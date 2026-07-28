import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser } from "../_shared/ai/supabase.ts";
import {
  callTrustAI,
  clamp,
  safeArray,
  safeRecord,
  safeText,
  safeTextArray,
  type JsonObject,
  type JsonValue,
  type SupabaseAdmin,
} from "../_shared/trust.ts";

type ApplicantScore = {
  applicationId: string;
  freelancerId: string;
  freelancerName: string;
  overallMatch: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: "strong_hire" | "interview" | "trial_first" | "pass";
  explanation: string;
};

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => needle && haystack.includes(needle.toLowerCase()));
}

function computeScore(job: JsonObject, app: JsonObject, freelancer: JsonObject, portfolio: JsonObject): ApplicantScore {
  const tags = safeText(job.tags, "", 600).split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  const category = safeText(job.category, "", 80).toLowerCase();
  const skillBlob = [
    freelancer.specialty,
    freelancer.qualification,
    freelancer.bio,
    freelancer.technical_summary,
    safeTextArray(freelancer.verified_skills).join(" "),
    safeTextArray(freelancer.unlocked_skills).join(" "),
  ].join(" ").toLowerCase();
  const skillFit = Math.min(100, (includesAny(skillBlob, tags) ? 45 : 0) + (category && skillBlob.includes(category) ? 25 : 0) + 25);
  const challenge = clamp(freelancer.challenge_score);
  const trust = clamp(freelancer.trust_score);
  const portfolioConfidence = Object.values(safeRecord(portfolio.confidence_scores)).map((value) => clamp(value));
  const verifiedPortfolio = portfolioConfidence.length
    ? portfolioConfidence.reduce((sum, item) => sum + item, 0) / portfolioConfidence.length
    : clamp(freelancer.confidence_level, 0, 65);
  const communication = safeText(app.cover_letter, "", 1600).length > 120 ? 80 : 45;
  const availability = safeText(freelancer.availability_status, "available", 40) === "available" ? 85 : 45;
  const experience = safeText(freelancer.qualification, "", 500).length > 80 ? 75 : 45;

  const overallMatch = Math.round(
    skillFit * 0.22 +
    challenge * 0.16 +
    experience * 0.12 +
    verifiedPortfolio * 0.16 +
    communication * 0.1 +
    trust * 0.18 +
    availability * 0.06,
  );

  const strengths = [
    skillFit >= 65 ? "Relevant skill signals match the job category." : "",
    challenge >= 70 ? "Strong recent practical challenge score." : "",
    verifiedPortfolio >= 70 ? "Portfolio verification has high confidence." : "",
    trust >= 70 ? "High platform trust score." : "",
    communication >= 70 ? "Clear application communication." : "",
  ].filter(Boolean);
  const weaknesses = [
    challenge < 50 ? "Challenge evidence is limited or outdated." : "",
    verifiedPortfolio < 50 ? "Portfolio verification confidence is still low." : "",
    communication < 60 ? "Application message lacks detail." : "",
    trust < 45 ? "Trust score needs more verified activity." : "",
  ].filter(Boolean);

  const recommendation = overallMatch >= 82
    ? "strong_hire"
    : overallMatch >= 65
      ? "interview"
      : overallMatch >= 48
        ? "trial_first"
        : "pass";

  return {
    applicationId: safeText(app.id, "", 80),
    freelancerId: safeText(app.freelancer_id, "", 80),
    freelancerName: safeText(app.freelancer_name || freelancer.name, "Freelancer", 140),
    overallMatch: Math.max(1, Math.min(99, overallMatch)),
    strengths: strengths.length ? strengths : ["Some baseline profile signals are available."],
    weaknesses: weaknesses.length ? weaknesses : ["No major weaknesses detected from available data."],
    recommendation,
    explanation: "Weighted from skills, challenge evidence, experience, verified portfolio, communication, trust score, and availability.",
  };
}

async function runMatching(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const parsedJobId = Number(body.jobId);
  const jobId = Number.isFinite(parsedJobId) && parsedJobId > 0 ? parsedJobId : 0;
  if (!jobId) throw new HttpError("Job id is required.", 400);

  const { data: jobData, error: jobError } = await supabaseAdmin.from("jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) throw new Error(jobError.message || "Job lookup failed.");
  const job = safeRecord(jobData);
  if (!job.id) throw new HttpError("Job not found.", 404);
  if (safeText(job.client_id, "", 80) !== authUserId) throw new HttpError("Only the job owner can rank applicants.", 403);

  const { data: appData, error: appError } = await supabaseAdmin.from("applications")
    .select("*")
    .eq("job_id", jobId)
    .limit(80);
  if (appError) throw new Error(appError.message || "Applications lookup failed.");
  const applications = safeArray(appData).map(safeRecord);
  if (applications.length === 0) return { job, rankings: [] };

  const freelancerIds = [...new Set(applications.map((app) => safeText(app.freelancer_id, "", 80)).filter(Boolean))];
  const [freelancersRes, portfolioRes] = await Promise.all([
    supabaseAdmin.from("freelancers")
      .select("id, name, specialty, qualification, bio, verified_skills, unlocked_skills, trust_score, challenge_score, confidence_level, confidence_scores, technical_summary, availability_status, response_speed_hours")
      .in("id", freelancerIds),
    supabaseAdmin.from("portfolio_verifications")
      .select("user_id, confidence_scores, fake_project_risk, evaluated_at")
      .in("user_id", freelancerIds)
      .order("evaluated_at", { ascending: false }),
  ]);
  if (freelancersRes.error) throw new Error(freelancersRes.error.message || "Freelancers lookup failed.");

  const freelancerById = new Map(safeArray(freelancersRes.data).map((row) => [safeText(safeRecord(row).id, "", 80), safeRecord(row)]));
  const portfolioByUserId = new Map<string, JsonObject>();
  safeArray(portfolioRes.data).map(safeRecord).forEach((row) => {
    const userId = safeText(row.user_id, "", 80);
    if (userId && !portfolioByUserId.has(userId)) portfolioByUserId.set(userId, row);
  });

  let rankings = applications
    .map((app) => computeScore(job, app, freelancerById.get(safeText(app.freelancer_id, "", 80)) || {}, portfolioByUserId.get(safeText(app.freelancer_id, "", 80)) || {}))
    .sort((left, right) => right.overallMatch - left.overallMatch);

  const aiFallback = { rankings: rankings.slice(0, 12) as unknown as JsonValue };
  const aiResult = await callTrustAI({
    system: "You refine applicant rankings for TeenVerseHub clients. Preserve ids and return valid JSON only.",
    user: [
      `Job: ${JSON.stringify(job).slice(0, 2500)}`,
      `Deterministic rankings: ${JSON.stringify(rankings.slice(0, 16)).slice(0, 8000)}`,
      'Return JSON: {"rankings":[{"applicationId":"","freelancerId":"","freelancerName":"","overallMatch":0,"strengths":[""],"weaknesses":[""],"recommendation":"strong_hire|interview|trial_first|pass","explanation":""}]}',
    ].join("\n"),
    fallback: aiFallback,
    maxTokens: 2200,
  }).catch(() => aiFallback);

  const aiRankings = safeArray(aiResult.rankings).map((item) => {
    const row = safeRecord(item);
    return {
      applicationId: safeText(row.applicationId, "", 80),
      freelancerId: safeText(row.freelancerId, "", 80),
      freelancerName: safeText(row.freelancerName, "Freelancer", 140),
      overallMatch: Math.round(clamp(row.overallMatch)),
      strengths: safeTextArray(row.strengths, 5),
      weaknesses: safeTextArray(row.weaknesses, 5),
      recommendation: ["strong_hire", "interview", "trial_first", "pass"].includes(safeText(row.recommendation, "", 40))
        ? safeText(row.recommendation, "", 40)
        : "trial_first",
      explanation: safeText(row.explanation, "Ranked from verified trust signals.", 900),
    };
  }).filter((row) => row.applicationId && row.freelancerId) as ApplicantScore[];

  if (aiRankings.length) rankings = aiRankings.sort((left, right) => right.overallMatch - left.overallMatch);

  for (const ranking of rankings.slice(0, 40)) {
    await supabaseAdmin.from("applications")
      .update({
        trust_match_score: ranking.overallMatch,
        trust_match_report: ranking as unknown as JsonValue,
        trust_match_evaluated_at: new Date().toISOString(),
      })
      .eq("id", ranking.applicationId)
      .eq("job_id", jobId);
  }

  const reportRes = await supabaseAdmin.from("ai_match_reports")
    .insert({
      job_id: jobId,
      client_id: safeText(job.client_id, "", 80),
      generated_by: authUserId,
      applicant_count: applications.length,
      rankings: rankings as unknown as JsonValue,
      provider: "deepseek",
      model: "deepseek-v4-flash",
    })
    .select("*")
    .single();
  if (reportRes.error) throw new Error(reportRes.error.message || "Match report save failed.");

  return { job, rankings, report: reportRes.data };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return fail("Method not allowed.", 405);

  try {
    const supabaseAdmin = createSupabaseAdminClient() as unknown as SupabaseAdmin;
    const authUser = await requireAuthenticatedUser(request, supabaseAdmin as never);
    const body = await readJson<Record<string, unknown>>(request);
    return ok(await runMatching(supabaseAdmin, authUser.id, body));
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Applicant matching failed."), status);
  }
});
