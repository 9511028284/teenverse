import { callDeepSeek } from "./deepseek.ts";
import { fail, getErrorMessage, ok, readJson } from "./http.ts";
import { parseAIJson } from "./json.ts";
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
      return fail(`Monthly quiz generation limit reached for your ${usage.plan} plan.`, 403);
    }

    const topic = String(body.topic || body.subCategory || body.category || "TeenVerse skills").trim();
    const level = String(body.level || "beginner").trim().toLowerCase();
    const count = clampQuestionCount(body.count);

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

    const responseText = await callDeepSeek({
      system,
      user,
      model: "deepseek-v4-flash",
      temperature: 0.35,
      max_tokens: 2200,
      response_format: { type: "json_object" },
    });

    const quiz = normalizeQuiz(parseAIJson(responseText), `${topic} Assessment`);
    if (quiz.questions.length === 0) {
      throw new Error("AI did not return usable quiz questions.");
    }

    await incrementAIUsage(supabaseAdmin, userId, "quiz_generation", "monthly");
    return ok(quiz);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Quiz generation failed."), status);
  }
}
