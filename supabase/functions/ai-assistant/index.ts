import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callAssistantAI } from "../_shared/ai/assistant.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
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
    if (!dailyUsage.allowed) return fail(`Daily AI assistant limit reached for your ${dailyUsage.plan} plan.`, 403);

    const weeklyUsage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "ai_assistant", "weekly");
    if (!weeklyUsage.allowed) return fail(`Weekly AI assistant limit reached for your ${weeklyUsage.plan} plan.`, 403);

    const answer = await callAssistantAI(message);

    await incrementAIUsage(supabaseAdmin, userId, "ai_assistant", "daily");
    await incrementAIUsage(supabaseAdmin, userId, "ai_assistant", "weekly");

    return ok({
      answer,
      message: answer,
      provider: "groq",
      model: GROQ_ASSISTANT_MODEL,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "AI assistant failed."), status);
  }
});
