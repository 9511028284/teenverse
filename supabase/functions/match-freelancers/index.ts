import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callDeepSeek } from "../_shared/ai/deepseek.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { parseAIJson } from "../_shared/ai/json.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser } from "../_shared/ai/supabase.ts";
import { checkPlanAIUsageLimit, incrementAIUsage } from "../_shared/ai/usage.ts";

function normalizeParsed(parsed: any, query: string) {
  const skills = Array.isArray(parsed?.skills)
    ? parsed.skills.map((item: unknown) => String(item).toLowerCase()).filter(Boolean)
    : [];

  return {
    query,
    skills,
    budget: Number(parsed?.budget) || null,
    urgency: String(parsed?.urgency || "Normal"),
    category: String(parsed?.category || ""),
  };
}

function scoreFreelancer(row: any, parsed: ReturnType<typeof normalizeParsed>) {
  const haystack = [
    row.name,
    row.specialty,
    row.qualification,
    row.bio,
    row.about,
    row.unlocked_skills,
    row.skills,
  ].flat().filter(Boolean).join(" ").toLowerCase();
  const queryTerms = [...parsed.skills, ...parsed.query.toLowerCase().split(/\W+/).filter((term) => term.length > 3)];
  const matchedTerms = new Set(queryTerms.filter((term) => haystack.includes(term)));
  const hourlyRate = Number(row.hourly_rate || row.rate || row.starting_price || 0);
  const trustScore = Number(row.trust_score || 0);
  const verifiedBoost = row.is_kyc_verified || row.kyc_status === "verified" ? 12 : 0;
  const budgetFit = parsed.budget && hourlyRate ? Math.max(0, 15 - Math.abs(hourlyRate - parsed.budget) / Math.max(parsed.budget, 1) * 15) : 4;

  return (matchedTerms.size * 14) + Math.min(trustScore, 100) / 4 + verifiedBoost + budgetFit;
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
    const query = String(body.query || "").trim();

    if (!query) return fail("Search query is required.", 400);

    const dailyUsage = await checkPlanAIUsageLimit(supabaseAdmin, authUser.id, "talent_matching", "daily");
    if (!dailyUsage.allowed) return fail(`Daily AI talent matching limit reached for your ${dailyUsage.plan} plan.`, 403);

    const weeklyUsage = await checkPlanAIUsageLimit(supabaseAdmin, authUser.id, "talent_matching", "weekly");
    if (!weeklyUsage.allowed) return fail(`Weekly AI talent matching limit reached for your ${weeklyUsage.plan} plan.`, 403);

    const parsedText = await callDeepSeek({
      system: "You parse client hiring requests for TeenVerseHub. Return valid JSON only.",
      user: [
        `Request: ${query}`,
        "Return JSON only with:",
        '{ "skills": [], "budget": null, "urgency": "Low | Normal | High", "category": "" }',
      ].join("\n"),
      model: "deepseek-v4-flash",
      temperature: 0.15,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const parsed = normalizeParsed(parseAIJson(parsedText), query);
    const { data: freelancers, error } = await supabaseAdmin
      .from("freelancers")
      .select("*")
      .limit(80);

    if (error) throw error;

    const results = (freelancers || [])
      .map((row: any) => {
        const aiMatchScore = scoreFreelancer(row, parsed);
        return {
          ...row,
          hourly_rate: Number(row.hourly_rate || row.rate || row.starting_price || 0),
          response_speed_hours: Number(row.response_speed_hours || 24),
          ai_match_score: aiMatchScore,
          match_score: Math.max(1, Math.min(99, Math.round(aiMatchScore))),
        };
      })
      .sort((a: any, b: any) => b.ai_match_score - a.ai_match_score)
      .slice(0, 12);

    await incrementAIUsage(supabaseAdmin, authUser.id, "talent_matching", "daily");
    await incrementAIUsage(supabaseAdmin, authUser.id, "talent_matching", "weekly");

    return ok({ parsed, results });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Freelancer matching failed."), status);
  }
});
