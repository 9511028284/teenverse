import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callAssistantAI } from "../_shared/ai/assistant.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { INPUT_TOO_LONG_ERROR, isInputTooLong } from "../_shared/ai/plan-limits.ts";
import { GROQ_ASSISTANT_MODEL } from "../_shared/ai/providers.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser, resolveUserId } from "../_shared/ai/supabase.ts";
import { checkPlanAIUsageLimit, incrementAIUsage } from "../_shared/ai/usage.ts";

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") return fail("Method not allowed.", 405);

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const authUser = await requireAuthenticatedUser(request, supabaseAdmin);
    const body = await readJson<Record<string, unknown>>(request);
    const userId = resolveUserId(authUser.id, body.userId);
    const message = String(body.message || body.query || body.prompt || "").trim();

    if (!message) return fail("Message is required.", 400);

    const dailyUsage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "ai_assistant", "daily");
    if (!dailyUsage.allowed) return fail("Daily AI assistant limit reached. Upgrade your plan for more questions.", 403);

    const weeklyUsage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "ai_assistant", "weekly");
    if (!weeklyUsage.allowed) return fail("Weekly AI assistant limit reached. Upgrade your plan for more questions.", 403);

    const monthlyLimit = "monthly" in dailyUsage.config ? Number(dailyUsage.config.monthly || 0) : 0;
    if (monthlyLimit > 0) {
      const monthlyUsage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "ai_assistant", "monthly");
      if (!monthlyUsage.allowed) return fail("Monthly AI assistant fair-use limit reached.", 403);
    }

    if (isInputTooLong(dailyUsage.plan, "ai_assistant", message)) {
      return fail(INPUT_TOO_LONG_ERROR, 400);
    }

    const answer = await callAssistantAI(message, {
      name: body.name,
      role: body.role,
      plan: dailyUsage.plan,
      route: body.route,
    }, {
      maxTokens: dailyUsage.maxTokens,
    });

    await incrementAIUsage(supabaseAdmin, userId, "ai_assistant", "daily");
    await incrementAIUsage(supabaseAdmin, userId, "ai_assistant", "weekly");
    if (monthlyLimit > 0) {
      await incrementAIUsage(supabaseAdmin, userId, "ai_assistant", "monthly");
    }

    return ok({
      answer,
      message: answer,
      provider: "groq",
      model: GROQ_ASSISTANT_MODEL,
      plan: dailyUsage.plan,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "AI assistant failed."), status);
  }
});
