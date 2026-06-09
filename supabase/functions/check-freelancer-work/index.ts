import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callDeepSeek } from "../_shared/ai/deepseek.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { parseAIJson } from "../_shared/ai/json.ts";
import { INPUT_TOO_LONG_ERROR, isFeatureEnabled, isInputTooLong } from "../_shared/ai/plan-limits.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser } from "../_shared/ai/supabase.ts";
import { checkPlanAIUsageLimit, incrementAIUsage } from "../_shared/ai/usage.ts";

type WorkCheckStatus = "pass" | "second_check" | "reject" | "upgrade_required_for_second_check";

function forceStatus(score: number, canUseSecondCheck: boolean): WorkCheckStatus {
  if (score >= 90) return "pass";
  if (score >= 85) return canUseSecondCheck ? "second_check" : "upgrade_required_for_second_check";
  return "reject";
}

function normalizeDecision(parsed: any, canUseSecondCheck: boolean) {
  const score = Math.max(0, Math.min(100, Number(parsed?.score || 0)));
  const status = forceStatus(score, canUseSecondCheck);
  const upgradeMessage = "This submission needs advanced second-check. Upgrade to Pro or request manual review.";

  return {
    score,
    status,
    issues: Array.isArray(parsed?.issues) ? parsed.issues.map(String).slice(0, 12) : [],
    improvementSuggestions: Array.isArray(parsed?.improvementSuggestions)
      ? parsed.improvementSuggestions.map(String).slice(0, 12)
      : [],
    reason: status === "upgrade_required_for_second_check"
      ? upgradeMessage
      : String(parsed?.reason || "").trim(),
    message: status === "upgrade_required_for_second_check" ? upgradeMessage : undefined,
    canSendToClient: status === "pass",
    requiresSecondCheck: status === "second_check",
    requiresUpgradeForSecondCheck: status === "upgrade_required_for_second_check",
  };
}

async function secondCheckReview(_decision: ReturnType<typeof normalizeDecision>) {
  return null;
}

async function saveDecision(supabaseAdmin: any, body: Record<string, unknown>, decision: ReturnType<typeof normalizeDecision>) {
  const submissionId = String(body.submissionId || "").trim();
  if (!submissionId) return { saved: false, reason: "missing-submission-id" };

  const payload: Record<string, unknown> = {
    ai_check_score: decision.score,
    ai_check_status: decision.status,
    ai_check_issues: decision.issues,
    ai_check_suggestions: decision.improvementSuggestions,
    ai_check_reason: decision.reason,
    ai_checked_at: new Date().toISOString(),
    ai_second_check_required: decision.status === "second_check",
  };

  if (body.workLink) payload.work_link = String(body.workLink);
  if (body.message) payload.work_message = String(body.message);

  const { error } = await supabaseAdmin
    .from("applications")
    .update(payload)
    .eq("id", submissionId);

  if (error) {
    console.warn("Unable to save AI work check decision:", error.message);
    return { saved: false, reason: error.message };
  }

  return { saved: true };
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
    const clientBrief = String(body.clientBrief || "").trim();
    const submittedWork = String(body.submittedWork || "").trim();

    if (!clientBrief || !submittedWork) {
      return fail("Client brief and submitted work are required.", 400);
    }

    const usage = await checkPlanAIUsageLimit(supabaseAdmin, authUser.id, "freelancer_work_check", "monthly");
    if (!usage.allowed) {
      return fail("Monthly freelancer work check limit reached. Upgrade your plan for more checks.", 403);
    }

    const combinedInput = [clientBrief, submittedWork].join("\n\n");
    if (isInputTooLong(usage.plan, "freelancer_work_check", combinedInput)) {
      return fail(INPUT_TOO_LONG_ERROR, 400);
    }

    const system = "You are a strict freelancer work quality checker for TeenVerseHub. You compare client requirements with freelancer submitted work. Return valid JSON only.";
    const user = [
      `Client requirement:\n${clientBrief}`,
      "",
      `Freelancer submitted work:\n${submittedWork}`,
      "",
      "Check:",
      "1. Does the work match the client requirement?",
      "2. Is it complete?",
      "3. Is it original-looking and not low-effort?",
      "4. Are there missing sections?",
      "5. Is quality good enough to show to the client?",
      "",
      "Return JSON only:",
      '{ "score": 0, "status": "pass | second_check | reject", "issues": [], "improvementSuggestions": [], "reason": "" }',
      "",
      "Scoring rules:",
      "- score >= 90 => status must be \"pass\"",
      "- score 85 to 89 => status must be \"second_check\"",
      "- score < 85 => status must be \"reject\"",
    ].join("\n");

    const responseText = await callDeepSeek({
      system,
      user,
      model: "deepseek-v4-flash",
      temperature: 0.2,
      max_tokens: usage.maxTokens,
      response_format: { type: "json_object" },
    });

    const canUseSecondCheck = isFeatureEnabled(usage.plan, "gemini_second_check");
    const decision = normalizeDecision(parseAIJson(responseText), canUseSecondCheck);
    const secondCheck = decision.status === "second_check" && canUseSecondCheck ? await secondCheckReview(decision) : null;
    const persistence = await saveDecision(supabaseAdmin, body, decision);

    await incrementAIUsage(supabaseAdmin, authUser.id, "freelancer_work_check", "monthly");

    return ok({
      ...decision,
      secondCheck,
      persistence,
      provider: "deepseek",
      model: "deepseek-v4-flash",
      plan: usage.plan,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Freelancer work check failed."), status);
  }
});
