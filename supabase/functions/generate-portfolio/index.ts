import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callDeepSeek } from "../_shared/ai/deepseek.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { parseAIJson } from "../_shared/ai/json.ts";
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

    const rawText = String(body.rawText || body.text || "").trim();
    if (!rawText) return fail("Portfolio text is required.", 400);

    const usage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "portfolio_generation", "monthly");
    if (!usage.allowed) {
      return fail(`Monthly portfolio generation limit reached for your ${usage.plan} plan.`, 403);
    }

    const responseText = await callDeepSeek({
      system: "You are a portfolio case-study writer for TeenVerseHub. Return valid JSON only.",
      user: [
        "Turn the following rough notes into one concise professional portfolio item.",
        "Return JSON only:",
        '{ "items": [{ "title": "", "content": "" }] }',
        "",
        rawText,
      ].join("\n"),
      model: "deepseek-v4-flash",
      temperature: 0.35,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });

    const parsed = parseAIJson(responseText);
    const items = (Array.isArray(parsed?.items) ? parsed.items : [parsed])
      .map((item: any) => ({
        id: Date.now(),
        title: String(item?.title || "Professional Case Study"),
        content: String(item?.content || rawText),
      }))
      .filter((item: any) => item.content);

    await incrementAIUsage(supabaseAdmin, userId, "portfolio_generation", "monthly");
    return ok({ items });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Portfolio generation failed."), status);
  }
});
