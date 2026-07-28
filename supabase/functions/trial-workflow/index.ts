import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser } from "../_shared/ai/supabase.ts";
import {
  callTrustAI,
  clamp,
  dedupe,
  recalculateTrustScore,
  safeArray,
  safeRecord,
  safeText,
  safeTextArray,
  type JsonObject,
  type JsonValue,
  type SupabaseAdmin,
} from "../_shared/trust.ts";

async function loadTrial(supabaseAdmin: SupabaseAdmin, trialId: string) {
  const { data, error } = await supabaseAdmin.from("paid_trials")
    .select("*")
    .eq("id", trialId)
    .maybeSingle();
  if (error) throw new Error(error.message || "Trial lookup failed.");
  const trial = safeRecord(data);
  if (!trial.id) throw new HttpError("Trial not found.", 404);
  return trial;
}

function ensureClient(trial: JsonObject, authUserId: string) {
  if (safeText(trial.client_id, "", 80) !== authUserId) throw new HttpError("Only the client can perform this action.", 403);
}

function ensureFreelancer(trial: JsonObject, authUserId: string) {
  if (safeText(trial.freelancer_id, "", 80) !== authUserId) throw new HttpError("Only the invited freelancer can perform this action.", 403);
}

async function createTrial(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const applicationId = safeText(body.applicationId, "", 80);
  const parsedJobId = Number(body.jobId);
  const jobId = Number.isFinite(parsedJobId) && parsedJobId > 0 ? parsedJobId : null;
  const freelancerId = safeText(body.freelancerId, "", 80);
  if (!freelancerId) throw new HttpError("Freelancer id is required.", 400);

  let app: JsonObject = {};
  if (applicationId) {
    const appRes = await supabaseAdmin.from("applications").select("*").eq("id", applicationId).maybeSingle();
    if (appRes.error) throw new Error(appRes.error.message || "Application lookup failed.");
    app = safeRecord(appRes.data);
    if (!app.id) throw new HttpError("Application not found.", 404);
    if (safeText(app.client_id, "", 80) !== authUserId) throw new HttpError("Only the application client can create a trial.", 403);
  }

  const amount = clamp(body.amount, 0, 1_000_000);
  const insertPayload: JsonObject = {
    application_id: applicationId || null,
    job_id: jobId || Number(app.job_id || 0) || null,
    client_id: authUserId,
    freelancer_id: freelancerId,
    title: safeText(body.title || app.job_title || app.title, "Paid Trial", 180),
    brief: safeText(body.brief, "Complete a small paid sample that proves fit for the project.", 3000),
    acceptance_criteria: safeArray(body.acceptanceCriteria) as JsonValue,
    amount,
    due_at: safeText(body.dueAt, "", 80) || null,
    status: "invited",
  };

  const { data, error } = await supabaseAdmin.from("paid_trials")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw new Error(error.message || "Trial creation failed.");

  if (applicationId) {
    await supabaseAdmin.from("applications").update({ trial_id: safeRecord(data).id ?? null }).eq("id", applicationId);
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: freelancerId,
    message: `Paid trial invited: ${safeText(insertPayload.title, "Paid Trial", 180)}`,
  });

  return data;
}

async function acceptTrial(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const trial = await loadTrial(supabaseAdmin, safeText(body.trialId, "", 80));
  ensureFreelancer(trial, authUserId);
  const updateRes = await supabaseAdmin.from("paid_trials")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", safeText(trial.id, "", 80));
  if (updateRes.error) throw new Error(updateRes.error.message || "Trial accept failed.");
  return { ...trial, status: "accepted" };
}

async function submitTrial(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const trial = await loadTrial(supabaseAdmin, safeText(body.trialId, "", 80));
  ensureFreelancer(trial, authUserId);
  const submission = safeRecord(body.submission);
  if (safeText(submission.summary, "", 6000).length < 40 && safeTextArray(submission.links, 6).length === 0) {
    throw new HttpError("Trial submission needs a useful summary or link.", 400);
  }

  const updateRes = await supabaseAdmin.from("paid_trials")
    .update({ status: "submitted", submission: submission as JsonValue, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", safeText(trial.id, "", 80));
  if (updateRes.error) throw new Error(updateRes.error.message || "Trial submit failed.");
  return { ...trial, status: "submitted", submission };
}

async function reviewTrial(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const trial = await loadTrial(supabaseAdmin, safeText(body.trialId, "", 80));
  ensureClient(trial, authUserId);
  const fallback = {
    score: 60,
    decision: "review_manually",
    strengths: [],
    risks: ["AI review had limited evidence."],
    verifiedSkills: [],
    confidenceScores: {},
    summary: "Trial was reviewed with limited confidence.",
    improvementSuggestions: [],
  };

  const review = await callTrustAI({
    system: "You review paid trial submissions for TeenVerseHub clients. Return valid JSON only.",
    user: [
      `Trial brief: ${safeText(trial.brief, "", 3000)}`,
      `Acceptance criteria: ${JSON.stringify(safeArray(trial.acceptance_criteria)).slice(0, 3000)}`,
      `Submission: ${JSON.stringify(safeRecord(trial.submission)).slice(0, 7000)}`,
      'Return JSON: {"score":0,"decision":"approve|revision|reject|review_manually","strengths":[""],"risks":[""],"verifiedSkills":[""],"confidenceScores":{"skill":0},"summary":"","improvementSuggestions":[""]}',
    ].join("\n"),
    fallback,
    maxTokens: 1800,
  }).catch(() => fallback);

  const score = clamp(review.score);
  const updateRes = await supabaseAdmin.from("paid_trials")
    .update({ status: "ai_reviewed", ai_review: review as unknown as JsonValue, ai_score: score, updated_at: new Date().toISOString() })
    .eq("id", safeText(trial.id, "", 80));
  if (updateRes.error) throw new Error(updateRes.error.message || "Trial review save failed.");
  return { trialId: trial.id, aiReview: review, aiScore: score };
}

async function approveTrial(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const trial = await loadTrial(supabaseAdmin, safeText(body.trialId, "", 80));
  ensureClient(trial, authUserId);
  const review = safeRecord(trial.ai_review);
  const rating = clamp(body.rating ?? (Number(trial.ai_score || 0) / 20), 0, 5);
  const reviewText = safeText(body.review, safeText(review.summary, "Paid trial approved.", 1200), 1200);
  const freelancerId = safeText(trial.freelancer_id, "", 80);
  const now = new Date().toISOString();

  const updateRes = await supabaseAdmin.from("paid_trials")
    .update({ status: "approved", approved_at: now, updated_at: now })
    .eq("id", safeText(trial.id, "", 80));
  if (updateRes.error) throw new Error(updateRes.error.message || "Trial approval failed.");

  await supabaseAdmin.from("verified_experiences").insert({
    freelancer_id: freelancerId,
    client_id: authUserId,
    job_id: Number(trial.job_id || 0) || null,
    trial_id: safeText(trial.id, "", 80),
    title: safeText(trial.title, "Paid Trial", 180),
    summary: safeText(review.summary, "Successful paid trial converted into verified experience.", 1400),
    evidence: { trial: trial.submission, aiReview: review } as JsonValue,
  });

  await supabaseAdmin.from("verified_reviews").insert({
    freelancer_id: freelancerId,
    client_id: authUserId,
    trial_id: safeText(trial.id, "", 80),
    rating,
    review: reviewText,
  });

  const skills = dedupe(safeTextArray(review.verifiedSkills, 12));
  const confidenceScores = safeRecord(review.confidenceScores);
  for (const skill of skills) {
    await supabaseAdmin.from("verified_skill_evidence").insert({
      freelancer_id: freelancerId,
      skill,
      source_type: "trial",
      source_id: safeText(trial.id, "", 80),
      confidence: clamp(confidenceScores[skill] ?? trial.ai_score ?? 70),
      evidence: { trialId: trial.id, summary: review.summary } as JsonValue,
    });
  }

  const trust = await recalculateTrustScore(supabaseAdmin, freelancerId, "paid_trial_approved");
  await supabaseAdmin.from("notifications").insert({
    user_id: freelancerId,
    message: `Paid trial approved and converted into verified experience: ${safeText(trial.title, "Paid Trial", 160)}`,
  });

  return { approved: true, trust };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return fail("Method not allowed.", 405);

  try {
    const supabaseAdmin = createSupabaseAdminClient() as unknown as SupabaseAdmin;
    const authUser = await requireAuthenticatedUser(request, supabaseAdmin as never);
    const body = await readJson<Record<string, unknown>>(request);
    const action = safeText(body.action, "", 80);

    if (action === "create_trial") return ok(await createTrial(supabaseAdmin, authUser.id, body));
    if (action === "accept_trial") return ok(await acceptTrial(supabaseAdmin, authUser.id, body));
    if (action === "submit_trial") return ok(await submitTrial(supabaseAdmin, authUser.id, body));
    if (action === "review_trial") return ok(await reviewTrial(supabaseAdmin, authUser.id, body));
    if (action === "approve_trial") return ok(await approveTrial(supabaseAdmin, authUser.id, body));

    return fail("Unsupported trial action.", 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Trial workflow failed."), status);
  }
});
