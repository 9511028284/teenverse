import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callDeepSeek } from "../_shared/ai/deepseek.ts";
import { callGemini } from "../_shared/ai/gemini.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { parseAIJson } from "../_shared/ai/json.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser } from "../_shared/ai/supabase.ts";
import { checkPlanAIUsageLimit, incrementAIUsage } from "../_shared/ai/usage.ts";

type WorkReviewDecision = "ready_for_client" | "needs_minor_clarification" | "needs_revision";

type WorkReview = {
  matchScore: number;
  decision: WorkReviewDecision;
  extractedRequirements: string[];
  submittedWorkSummary: string;
  matchedItems: string[];
  missingOrUnclearItems: string[];
  clientFriendlySummary: string;
  freelancerFeedback: string;
  reason: string;
};

type WorkReviewContext = {
  jobTitle: string;
  jobDescription: string;
  jobCategory: string;
  jobTags: string;
  chatContext: string;
  submittedWorkMessage: string;
  submittedWorkLink: string;
  submittedWorkFiles: string[];
};

const DEEPSEEK_WORK_REVIEW_MODEL = "deepseek-v4-flash";
const GEMINI_WORK_REVIEW_MODEL = "gemini-2.5-flash-lite";
const WORK_REVIEW_MAX_TOKENS = 1000;
const JOB_DESCRIPTION_LIMIT = 2000;
const CHAT_CONTEXT_LIMIT = 3000;
const WORK_MESSAGE_LIMIT = 3000;
const PROMPT_LIMIT = 8000;
const TEMPORARY_UNAVAILABLE_ERROR =
  "AI review is temporarily unavailable. You can still submit the work manually or try again later.";

function normalizeWorkReviewDecision(score: number): WorkReviewDecision {
  if (score >= 75) return "ready_for_client";
  if (score >= 55) return "needs_minor_clarification";
  return "needs_revision";
}

function isInsufficientBalanceError(error: unknown) {
  const message = String(
    error instanceof Error ? error.message : JSON.stringify(error),
  ).toLowerCase();

  return (
    message.includes("insufficient balance") ||
    message.includes("insufficient_balance") ||
    message.includes("balance")
  );
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 55;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function toStringArray(value: unknown, maxItems = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function toText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function safeTruncate(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 16)).trimEnd()}\n[truncated]`;
}

function takeTail(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `[earlier chat truncated]\n${value.slice(value.length - maxLength)}`;
}

function stringifyCompact(value: unknown) {
  if (!value) return "";
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeWorkReview(parsed: any): WorkReview {
  const matchScore = clampScore(parsed?.matchScore ?? parsed?.score);
  const decision = normalizeWorkReviewDecision(matchScore);

  return {
    matchScore,
    decision,
    extractedRequirements: toStringArray(parsed?.extractedRequirements),
    submittedWorkSummary: toText(parsed?.submittedWorkSummary, "Submitted work was reviewed against the available project details."),
    matchedItems: toStringArray(parsed?.matchedItems),
    missingOrUnclearItems: toStringArray(parsed?.missingOrUnclearItems),
    clientFriendlySummary: toText(parsed?.clientFriendlySummary, "The submission has been reviewed for client readiness."),
    freelancerFeedback: toText(parsed?.freelancerFeedback, "Please review the match notes and clarify anything unclear."),
    reason: toText(parsed?.reason, "Decision normalized from the AI match score."),
  };
}

async function fetchWorkReviewContext(
  supabaseAdmin: any,
  submissionId: string,
  authUserId: string,
  body: Record<string, unknown>,
): Promise<WorkReviewContext> {
  const { data: application, error: appError } = await supabaseAdmin
    .from("applications")
    .select("id, job_id, freelancer_id, client_id, work_message, work_link, work_files")
    .eq("id", submissionId)
    .maybeSingle();

  if (appError) throw appError;
  if (!application) throw new HttpError("Application not found.", 404);
  if (application.freelancer_id !== authUserId) {
    throw new HttpError("Only the assigned freelancer can review this submission.", 403);
  }

  let job: Record<string, unknown> | null = null;
  if (application.job_id) {
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("title, description, category")
      .eq("id", application.job_id)
      .maybeSingle();

    if (jobError) {
      console.warn("Unable to load job context for work review:", jobError.message);
    } else {
      job = jobData;
    }
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("sender_id, content, created_at")
    .eq("application_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (messagesError) {
    console.warn("Unable to load chat context for work review:", messagesError.message);
  }

  const chatLines = [...(messages || [])]
    .reverse()
    .map((message: any) => {
      const speaker = message.sender_id === application.client_id
        ? "Client"
        : message.sender_id === application.freelancer_id
          ? "Freelancer"
          : "User";
      return `${speaker}: ${String(message.content || "").trim()}`;
    })
    .filter((line) => line.length > 0)
    .join("\n");

  const submittedWorkFiles = Array.isArray(body.workFiles)
    ? body.workFiles.map(String)
    : Array.isArray(application.work_files)
      ? application.work_files.map(String)
      : [];
  const jobTags = stringifyCompact(body.jobTags || body.tags);

  return {
    jobTitle: safeTruncate(job?.title || body.jobTitle, 240),
    jobDescription: safeTruncate(job?.description || body.clientBrief, JOB_DESCRIPTION_LIMIT),
    jobCategory: safeTruncate(job?.category || body.jobCategory, 240),
    jobTags: safeTruncate(jobTags, 500),
    chatContext: takeTail(safeTruncate(chatLines, CHAT_CONTEXT_LIMIT + 120), CHAT_CONTEXT_LIMIT),
    submittedWorkMessage: safeTruncate(
      body.message || body.submittedWork || application.work_message,
      WORK_MESSAGE_LIMIT,
    ),
    submittedWorkLink: safeTruncate(body.workLink || application.work_link, 500),
    submittedWorkFiles,
  };
}

function buildWorkReviewPrompt(context: WorkReviewContext) {
  const formatPrompt = (ctx: WorkReviewContext) => {
    const workFiles = ctx.submittedWorkFiles.length
      ? ctx.submittedWorkFiles.join(", ")
      : "No files listed";

    return [
    "Project title:",
    ctx.jobTitle || "Untitled project",
    "",
    "Project description:",
    ctx.jobDescription || "No project description provided.",
    "",
    "Project category/tags:",
    `${ctx.jobCategory || "Uncategorized"} ${ctx.jobTags}`.trim(),
    "",
    "Recent client-freelancer chat context:",
    ctx.chatContext || "No recent chat context available.",
    "",
    "Freelancer submitted work:",
    `Message: ${ctx.submittedWorkMessage || "No message provided."}`,
    `Link: ${ctx.submittedWorkLink || "No link provided."}`,
    `Files: ${workFiles}`,
    "",
    "Task:",
    "1. Extract the client's main requirements.",
    "2. Extract what the freelancer submitted.",
    "3. Match submitted work against requirements.",
    "4. Identify missing or unclear items.",
    "5. Give a soft decision.",
    "",
    "Return JSON only:",
    "{",
    '  "matchScore": 0,',
    '  "decision": "ready_for_client | needs_minor_clarification | needs_revision",',
    '  "extractedRequirements": [],',
    '  "submittedWorkSummary": "",',
    '  "matchedItems": [],',
    '  "missingOrUnclearItems": [],',
    '  "clientFriendlySummary": "",',
    '  "freelancerFeedback": "",',
    '  "reason": ""',
    "}",
    "",
    "Decision rules:",
    '- 75-100: decision must be "ready_for_client"',
    '- 55-74: decision must be "needs_minor_clarification"',
    '- Below 55: decision must be "needs_revision"',
    "",
    "Important:",
    "- If work is reasonable and mostly relevant, prefer ready_for_client.",
    "- Use needs_minor_clarification when a small detail/link/file/format is unclear.",
    "- Use needs_revision only when submission is clearly incomplete, irrelevant, empty, or does not match the client request.",
    "- JSON only.",
    ].join("\n");
  };

  let prompt = formatPrompt(context);
  if (prompt.length > PROMPT_LIMIT) {
    prompt = formatPrompt({
      ...context,
      chatContext: takeTail(context.chatContext, 2200),
      submittedWorkMessage: safeTruncate(context.submittedWorkMessage, 2200),
      jobDescription: safeTruncate(context.jobDescription, 1600),
    });
  }

  return safeTruncate(prompt, PROMPT_LIMIT);
}

function buildSavePayload(body: Record<string, unknown>, review: WorkReview) {
  const payload: Record<string, unknown> = {
    ai_check_score: review.matchScore,
    ai_check_status: review.decision,
    ai_check_issues: review.missingOrUnclearItems,
    ai_check_suggestions: review.freelancerFeedback ? [review.freelancerFeedback] : [],
    ai_check_reason: review.reason,
    ai_checked_at: new Date().toISOString(),
    ai_second_check_required: false,
  };

  if (body.workLink) payload.work_link = String(body.workLink);
  if (body.message) payload.work_message = String(body.message);
  if (Array.isArray(body.workFiles)) payload.work_files = body.workFiles;

  return payload;
}

async function saveReview(
  supabaseAdmin: any,
  submissionId: string,
  body: Record<string, unknown>,
  review: WorkReview,
) {
  const { error } = await supabaseAdmin
    .from("applications")
    .update(buildSavePayload(body, review))
    .eq("id", submissionId);

  if (error) {
    console.warn("Unable to save AI work review:", error.message);
    return { saved: false, reason: error.message };
  }

  return { saved: true };
}

async function runDeepSeekReview(system: string, user: string) {
  return await callDeepSeek({
    system,
    user,
    model: DEEPSEEK_WORK_REVIEW_MODEL,
    temperature: 0.2,
    max_tokens: WORK_REVIEW_MAX_TOKENS,
    response_format: { type: "json_object" },
  });
}

async function runGeminiReview(system: string, user: string) {
  return await callGemini({
    system,
    user,
    model: GEMINI_WORK_REVIEW_MODEL,
    temperature: 0.2,
    maxTokens: WORK_REVIEW_MAX_TOKENS,
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") return fail("Method not allowed.", 405);

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const authUser = await requireAuthenticatedUser(request, supabaseAdmin);
    const body = await readJson<Record<string, unknown>>(request);
    const submissionId = String(body.submissionId || "").trim();

    if (!submissionId) {
      return fail("Submission id is required.", 400);
    }

    const usage = await checkPlanAIUsageLimit(supabaseAdmin, authUser.id, "freelancer_work_check", "monthly");
    if (!usage.allowed) {
      return fail("Monthly freelancer work check limit reached. Upgrade your plan for more checks.", 403);
    }

    const context = await fetchWorkReviewContext(supabaseAdmin, submissionId, authUser.id, body);

    if (!context.submittedWorkMessage && !context.submittedWorkLink && context.submittedWorkFiles.length === 0) {
      return fail("Please include a work link, file, or message before requesting review.", 400);
    }

    const system = [
      "You are TeenVerseHub Work Review Assistant.",
      "Your job is to softly compare freelancer submitted work with the client's project requirements.",
      "Extract requirements from the project description and chat context, then compare them with submitted work.",
      "Be fair, practical, and not overly strict.",
      "Do not reject work for small differences.",
      "Return valid JSON only.",
    ].join("\n");
    const user = buildWorkReviewPrompt(context);

    console.log("Work review primary provider: deepseek");
    console.log("Work review model:", DEEPSEEK_WORK_REVIEW_MODEL);

    let provider = "deepseek";
    let model = DEEPSEEK_WORK_REVIEW_MODEL;
    let fallbackUsed = false;
    let fallbackReason: string | undefined;
    let responseText = "";

    try {
      responseText = await runDeepSeekReview(system, user);
    } catch (deepSeekError) {
      if (!isInsufficientBalanceError(deepSeekError)) {
        console.error("Work review DeepSeek error:", getErrorMessage(deepSeekError, "DeepSeek review failed."));
        return fail(TEMPORARY_UNAVAILABLE_ERROR, 503);
      }

      fallbackUsed = true;
      fallbackReason = "deepseek_insufficient_balance";
      provider = "gemini";
      model = GEMINI_WORK_REVIEW_MODEL;

      try {
        responseText = await runGeminiReview(system, user);
      } catch (geminiError) {
        console.error("Work review Gemini fallback error:", getErrorMessage(geminiError, "Gemini review failed."));
        return fail(TEMPORARY_UNAVAILABLE_ERROR, 503);
      }
    }

    let review: WorkReview;
    try {
      review = normalizeWorkReview(parseAIJson(responseText));
    } catch (parseError) {
      console.error("Work review JSON parse error:", getErrorMessage(parseError, "Invalid review JSON."));
      return fail(TEMPORARY_UNAVAILABLE_ERROR, 503);
    }

    const persistence = await saveReview(supabaseAdmin, submissionId, body, review);
    await incrementAIUsage(supabaseAdmin, authUser.id, "freelancer_work_check", "monthly");

    console.log("Work review fallback provider used:", fallbackUsed);
    console.log("Work review final decision:", review.decision);
    console.log("Work review final score:", review.matchScore);

    return ok({
      review,
      provider,
      model,
      fallbackUsed,
      ...(fallbackReason ? { fallbackReason } : {}),
      persistence,
      plan: usage.plan,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, TEMPORARY_UNAVAILABLE_ERROR), status);
  }
});
