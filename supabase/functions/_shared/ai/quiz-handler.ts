import { callDeepSeek } from "./deepseek.ts";
import { fail, json, ok, readJson } from "./http.ts";
import { parseAIJson } from "./json.ts";
import { INPUT_TOO_LONG_ERROR, isInputTooLong } from "./plan-limits.ts";
import { DEEPSEEK_DEFAULT_MODEL } from "./providers.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser, resolveUserId } from "./supabase.ts";
import { checkPlanAIUsageLimit, incrementAIUsage } from "./usage.ts";

function clampQuestionCount(value: unknown) {
  const count = Number(value || 10);
  if (!Number.isFinite(count)) return 10;
  return Math.max(1, Math.min(20, Math.floor(count)));
}

function normalizeQuiz(parsed: any, fallbackTitle: string) {
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];

  return {
    title: String(parsed?.title || fallbackTitle || "TeenVerse Quiz").slice(0, 120),
    questions: questions.map((item: any) => {
      const options = Array.isArray(item?.options)
        ? item.options.map((option: unknown) => String(option)).filter(Boolean).slice(0, 4)
        : [];
      const answer = String(item?.answer || item?.correctAnswer || item?.a || options[0] || "");

      return {
        question: String(item?.question || item?.q || "").trim(),
        q: String(item?.question || item?.q || "").trim(),
        options,
        answer,
        correctAnswer: answer,
        a: answer,
        explanation: String(item?.explanation || "").trim(),
      };
    }).filter((item: any) => item.question && item.options.length === 4 && item.answer),
  };
}

export async function handleQuizGeneration(request: Request) {
  if (request.method !== "POST") return fail("Method not allowed.", 405);

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const authUser = await requireAuthenticatedUser(request, supabaseAdmin);
    const body = await readJson<Record<string, unknown>>(request);
    const userId = resolveUserId(authUser.id, body.userId);

    const usage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "quiz_generation", "monthly");
    if (!usage.allowed) {
      return fail("Monthly quiz generation limit reached. Upgrade your plan for more quizzes.", 403);
    }

    const topic = String(body.topic || body.subCategory || body.category || "TeenVerse skills").trim();
    const level = String(body.level || "beginner").trim().toLowerCase();
    const count = clampQuestionCount(body.count);

    if (isInputTooLong(usage.plan, "quiz_generation", [topic, level].join("\n"))) {
      return fail(INPUT_TOO_LONG_ERROR, 400);
    }

    const system = "You are an expert quiz generator for TeenVerseHub. Return valid JSON only.";
    const user = [
      "Generate quiz questions for:",
      `Topic: ${topic}`,
      `Level: ${level}`,
      `Count: ${count}`,
      "",
      "Return JSON only:",
      '{ "title": "", "questions": [{ "question": "", "options": ["", "", "", ""], "answer": "", "explanation": "" }] }',
    ].join("\n");

    let quiz;

    try {
      console.log("Quiz/assessment generation using DeepSeek");

      const responseText = await callDeepSeek({
        system,
        user,
        model: DEEPSEEK_DEFAULT_MODEL,
        temperature: 0.35,
        max_tokens: usage.maxTokens,
        response_format: { type: "json_object" },
      });

      quiz = normalizeQuiz(parseAIJson(responseText), `${topic} Assessment`);
      if (quiz.questions.length === 0) {
        throw new Error("AI did not return usable quiz questions.");
      }
    } catch (error) {
      console.error("DeepSeek quiz/assessment generation failed:", error);
      return json(
        {
          success: false,
          error: "Failed to generate assessment. Please try again.",
          details: "DeepSeek generation failed.",
        },
        500,
      );
    }

    await incrementAIUsage(supabaseAdmin, userId, "quiz_generation", "monthly");
    return ok({
      ...quiz,
      provider: "deepseek",
      model: DEEPSEEK_DEFAULT_MODEL,
      plan: usage.plan,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (error instanceof HttpError) return fail(error.message, status);

    return fail("Failed to generate assessment. Please try again.", status);
  }
}
