import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser, resolveUserId } from "../_shared/ai/supabase.ts";
import {
  callTrustAI,
  buildChallengeMandatoryFields,
  clamp,
  dedupe,
  fallbackChallenge,
  recalculateTrustScore,
  safeArray,
  safeRecord,
  safeText,
  safeTextArray,
  type JsonObject,
  type JsonValue,
  type SupabaseAdmin,
} from "../_shared/trust.ts";

const TEMPORARY_AI_ERROR = "AI trust review is temporarily unavailable. Please try again shortly.";

function getAction(body: Record<string, unknown>) {
  return safeText(body.action, "", 80);
}

function buildDeterministicChallengeEvaluation({
  artifact,
  notes,
  links,
  mandatoryAnswers,
  mandatoryFields,
}: {
  artifact: string;
  notes: string;
  links: string[];
  mandatoryAnswers: JsonObject;
  mandatoryFields: JsonObject[];
}) {
  const fullText = [artifact, notes, JSON.stringify(mandatoryAnswers)].join("\n").toLowerCase();
  const completedMandatory = mandatoryFields.filter((field) => {
    const id = safeText(field.id, "", 80);
    if (!id) return false;
    if (safeText(field.type, "", 20) === "checkbox") return mandatoryAnswers[id] === true;
    return safeText(mandatoryAnswers[id], "", 4000).length >= Math.max(1, Number(field.minLength || 1));
  }).length;
  const mandatoryRatio = mandatoryFields.length ? completedMandatory / mandatoryFields.length : 1;

  const quality = clamp(
    30 +
    Math.min(28, artifact.length / 70) +
    Math.min(16, notes.length / 90) +
    (links.length > 0 ? 10 : 0) +
    (/\bpng\b/.test(fullText) ? 5 : 0) +
    (/\bjpg\b|\bjpeg\b/.test(fullText) ? 5 : 0),
  );
  const originality = clamp(
    35 +
    (/\boriginal\b|\bunique\b|\bown\b|\bnot copied\b|\bconcept\b/.test(fullText) ? 24 : 0) +
    Math.min(22, safeText(mandatoryAnswers.logo_plan || mandatoryAnswers.original_logo_concept, "", 2000).length / 4) +
    (/\breference\b|\binspiration\b/.test(fullText) ? 8 : 0),
  );
  const plagiarism = clamp(
    /\bcopy\b|\bcopied\b|\btemplate\b|\bcanva template\b|\bstock\b/.test(fullText) && !/\bnot copied\b|\bno copied\b|\boriginal\b/.test(fullText)
      ? 58
      : 12,
  );
  const completeness = clamp(30 + mandatoryRatio * 45 + (artifact.length >= 80 ? 10 : 0) + (links.length > 0 ? 8 : 0));
  const instructionFollowing = clamp(
    25 +
    mandatoryRatio * 45 +
    (/\brevision\b|\bminor revision\b|\bon time\b|\bpolite\b/.test(fullText) ? 12 : 0) +
    (/\bsource\b|\bfigma\b|\bcanva\b|\bpsd\b|\bsvg\b|\bai file\b/.test(fullText) ? 8 : 0),
  );
  const communication = clamp(35 + Math.min(35, notes.length / 60) + (/\bpolite\b|\bcommunicate\b|\bdeadline\b/.test(fullText) ? 15 : 0));
  const score = clamp((quality + originality + completeness + instructionFollowing + communication - plagiarism * 0.35) / 4.65);
  const confidence = clamp(45 + mandatoryRatio * 30 + Math.min(15, links.length * 5) + (artifact.length >= 200 ? 10 : 0));

  return {
    challengeScore: Math.round(score),
    confidenceLevel: Math.round(confidence),
    challengeReport: {
      quality: Math.round(quality),
      originality: Math.round(originality),
      plagiarism: Math.round(plagiarism),
      completeness: Math.round(completeness),
      instructionFollowing: Math.round(instructionFollowing),
      estimatedExperience: score >= 78 ? "intermediate" : score >= 58 ? "beginner-plus" : "beginner",
      improvementSuggestions: [
        ...(links.length === 0 ? ["Add a portfolio, export, or design file link for stronger evidence."] : []),
        ...(!/\bpng\b/.test(fullText) || !/\bjpg\b|\bjpeg\b/.test(fullText) ? ["Explicitly confirm both PNG and JPG exports."] : []),
        ...(notes.length < 160 ? ["Add more design reasoning and quality checks."] : []),
      ],
      summary: "Evaluated with TeenVerseHub's deterministic trust engine because live AI review was unavailable.",
      providerFallback: "deterministic-trust-engine",
    },
  };
}

async function assertChallengeOwner(supabaseAdmin: SupabaseAdmin, challengeId: string, userId: string) {
  const { data, error } = await supabaseAdmin.from("skill_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message || "Challenge lookup failed.");
  const challenge = safeRecord(data);
  if (!challenge.id) throw new HttpError("Challenge not found.", 404);
  return challenge;
}

async function createChallenge(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const userId = resolveUserId(authUserId, body.userId);
  const category = safeText(body.category, "general", 80);
  const topic = safeText(body.topic || body.jobTitle || category, category, 140);
  const parsedJobId = Number(body.jobId);
  const jobId = Number.isFinite(parsedJobId) && parsedJobId > 0 ? parsedJobId : null;
  let jobTitle = safeText(body.jobTitle, "", 180);
  let jobDescription = "";

  if (jobId) {
    const { data } = await supabaseAdmin.from("jobs")
      .select("title, description, category, tags")
      .eq("id", jobId)
      .maybeSingle();
    const job = safeRecord(data);
    jobTitle = safeText(job.title, jobTitle, 180);
    jobDescription = safeText(job.description, "", 1200);
  }

  const deterministicMandatoryFields = buildChallengeMandatoryFields(category, topic, jobTitle, jobDescription);

  const activeRes = await supabaseAdmin.from("skill_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  if (activeRes.error) throw new Error(activeRes.error.message || "Active challenge lookup failed.");

  const now = Date.now();
  const activeChallenges = safeArray(activeRes.data).map(safeRecord);
  const reusableChallenge = activeChallenges.find((row) => {
    const rowJobId = Number(row.job_id || 0) || null;
    return rowJobId === jobId && new Date(String(row.expires_at)).getTime() > now;
  });

  if (reusableChallenge?.id) {
    const reusableConstraints = safeRecord(reusableChallenge.constraints);
    const existingMandatoryFields = safeArray(reusableConstraints.mandatoryFields).map(safeRecord);
    const existingVersion = safeText(reusableConstraints.mandatoryFieldsVersion, "", 80);
    const nextVersion = safeText((deterministicMandatoryFields as { version?: string }).version, "", 80);
    if (existingMandatoryFields.length === 0 || (nextVersion && existingVersion !== nextVersion)) {
      const enrichedConstraints = {
        ...reusableConstraints,
        mandatoryFields: deterministicMandatoryFields,
        mandatoryFieldsVersion: nextVersion,
      };
      await supabaseAdmin.from("skill_challenges")
        .update({ constraints: enrichedConstraints as JsonValue })
        .eq("id", safeText(reusableChallenge.id, "", 80))
        .eq("user_id", userId);
      return { ...reusableChallenge, constraints: enrichedConstraints, reused: true };
    }
    return { ...reusableChallenge, reused: true };
  }

  const expiredIds = activeChallenges
    .filter((row) => new Date(String(row.expires_at)).getTime() <= now)
    .map((row) => safeText(row.id, "", 80))
    .filter(Boolean);

  await Promise.all(expiredIds.map((expiredId) => (
    supabaseAdmin.from("skill_challenges")
      .update({ status: "expired" })
      .eq("id", expiredId)
      .eq("user_id", userId)
  )));

  const fallback = fallbackChallenge(userId, category, topic, jobTitle);
  let challenge = fallback;
  let provider = "rules";
  let model = "deterministic-v1";

  try {
    challenge = await callTrustAI({
      system: "You generate unique practical work-sample challenges for TeenVerseHub. Return compact valid JSON only.",
      user: [
        `Freelancer id seed: ${userId}`,
        `Category: ${category}`,
        `Topic/job title: ${topic}`,
        `Job title: ${jobTitle || "not provided"}`,
        `Job context: ${jobDescription || "not provided"}`,
        "Create a unique, time-limited practical challenge. Do not create multiple choice questions.",
        "Mandatory fields must directly reflect the job requirements and must be answerable before submission.",
        'Return JSON: {"title":"","brief":"","instructions":"","deliverables":[""],"constraints":{"mandatoryFields":[{"id":"","label":"","type":"text|textarea|checkbox","required":true,"minLength":10,"placeholder":""}]},"rubric":{},"durationMinutes":45}',
      ].join("\n"),
      fallback,
      maxTokens: 1600,
    }) as typeof fallback;
    provider = "deepseek";
    model = "deepseek-v4-flash";
  } catch (error) {
    console.warn("Challenge AI generation fallback:", getErrorMessage(error, "AI unavailable."));
  }

  const durationMinutes = Math.max(10, Math.min(180, Number(challenge.durationMinutes || 45)));
  const expiresAt = new Date(Date.now() + durationMinutes * 60_000).toISOString();
  const challengeConstraints = safeRecord(challenge.constraints);
  const aiMandatoryFields = safeArray(challengeConstraints.mandatoryFields).map(safeRecord);
  const deterministicVersion = safeText((deterministicMandatoryFields as { version?: string }).version, "general-lite-v1", 80);
  const useDeterministicFields = deterministicVersion === "logo-lite-v2";
  const constraints = {
    ...challengeConstraints,
    mandatoryFields: useDeterministicFields || aiMandatoryFields.length === 0 ? deterministicMandatoryFields : aiMandatoryFields,
    mandatoryFieldsVersion: deterministicVersion,
  };
  const insertPayload: JsonObject = {
    user_id: userId,
    job_id: jobId,
    category,
    topic,
    title: safeText(challenge.title, fallback.title, 160),
    brief: safeText(challenge.brief, fallback.brief, 2000),
    instructions: safeText(challenge.instructions, fallback.instructions, 4000),
    deliverables: safeArray(challenge.deliverables) as JsonValue,
    constraints: constraints as JsonValue,
    rubric: safeRecord(challenge.rubric) as JsonValue,
    duration_minutes: durationMinutes,
    expires_at: expiresAt,
    provider,
    model,
  };

  const { data, error } = await supabaseAdmin.from("skill_challenges")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw new Error(error.message || "Challenge creation failed.");
  return data;
}

async function autosaveChallenge(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const userId = resolveUserId(authUserId, body.userId);
  const challengeId = safeText(body.challengeId, "", 80);
  if (!challengeId) throw new HttpError("Challenge id is required.", 400);
  await assertChallengeOwner(supabaseAdmin, challengeId, userId);

  const updateRes = await supabaseAdmin.from("skill_challenges")
    .update({ auto_save: safeRecord(body.draft) as JsonValue })
    .eq("id", challengeId)
    .eq("user_id", userId);
  if (updateRes.error) throw new Error(updateRes.error.message || "Autosave failed.");
  return { savedAt: new Date().toISOString() };
}

async function submitChallenge(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const userId = resolveUserId(authUserId, body.userId);
  const challengeId = safeText(body.challengeId, "", 80);
  if (!challengeId) throw new HttpError("Challenge id is required.", 400);
  const challenge = await assertChallengeOwner(supabaseAdmin, challengeId, userId);
  if (String(challenge.status) === "evaluated") throw new HttpError("Challenge already evaluated.", 409);
  if (new Date(String(challenge.expires_at)).getTime() < Date.now()) {
    await supabaseAdmin.from("skill_challenges").update({ status: "expired" }).eq("id", challengeId).eq("user_id", userId);
    throw new HttpError("Challenge time expired.", 400);
  }

  const submission = safeRecord(body.submission);
  const artifact = safeText(submission.artifact, "", 10000);
  const notes = safeText(submission.notes, "", 4000);
  const links = safeTextArray(submission.links, 6);
  const mandatoryAnswers = safeRecord(submission.mandatory);
  const mandatoryFields = safeArray(safeRecord(challenge.constraints).mandatoryFields).map(safeRecord);
  const missingMandatoryFields = mandatoryFields.filter((field) => {
    if (field.required === false) return false;
    const id = safeText(field.id, "", 80);
    if (!id) return false;
    const answer = mandatoryAnswers[id];
    if (safeText(field.type, "", 20) === "checkbox") return answer !== true;
    const minLength = Math.max(1, Number(field.minLength || 1));
    return safeText(answer, "", 4000).length < minLength;
  });

  if (missingMandatoryFields.length > 0) {
    const labels = missingMandatoryFields.map((field) => safeText(field.label, "Required field", 120)).join(", ");
    throw new HttpError(`Complete mandatory challenge fields first: ${labels}.`, 400);
  }

  if (mandatoryFields.length === 0 && artifact.length < 80 && notes.length < 80 && links.length === 0) {
    throw new HttpError("Submission needs a meaningful artifact, explanation, or link.", 400);
  }

  const fallback = {
    challengeScore: 55,
    confidenceLevel: 45,
    challengeReport: {
      quality: 50,
      originality: 50,
      plagiarism: 10,
      completeness: 50,
      instructionFollowing: 50,
      estimatedExperience: "beginner",
      improvementSuggestions: ["Add more implementation detail and verification evidence."],
      summary: "Submission was received and needs more evidence for a stronger score.",
    },
  };

  let evaluation = fallback;
  try {
    evaluation = await callTrustAI({
      system: "You evaluate TeenVerseHub practical skill challenges. Be strict, fair, and return valid JSON only. Treat unverifiable or copied work as low confidence.",
      user: [
        `Challenge title: ${safeText(challenge.title, "", 180)}`,
        `Brief: ${safeText(challenge.brief, "", 1200)}`,
        `Instructions: ${safeText(challenge.instructions, "", 2200)}`,
        `Rubric: ${JSON.stringify(safeRecord(challenge.rubric))}`,
        `Artifact: ${artifact}`,
        `Notes: ${notes}`,
        `Links: ${links.join(", ") || "none"}`,
        `Mandatory answers: ${JSON.stringify(mandatoryAnswers).slice(0, 4000)}`,
        'Return JSON: {"challengeScore":0,"confidenceLevel":0,"challengeReport":{"quality":0,"originality":0,"plagiarism":0,"completeness":0,"instructionFollowing":0,"estimatedExperience":"","improvementSuggestions":[""],"summary":""}}',
      ].join("\n"),
      fallback,
      maxTokens: 1800,
    }) as typeof fallback;
  } catch (error) {
    console.warn("Challenge AI evaluation failed, using deterministic trust engine:", getErrorMessage(error, TEMPORARY_AI_ERROR));
    evaluation = buildDeterministicChallengeEvaluation({
      artifact,
      notes,
      links,
      mandatoryAnswers,
      mandatoryFields,
    }) as typeof fallback;
  }

  const score = clamp(evaluation.challengeScore);
  const confidence = clamp(evaluation.confidenceLevel);
  const now = new Date().toISOString();
  const report = safeRecord(evaluation.challengeReport);

  const updateRes = await supabaseAdmin.from("skill_challenges")
    .update({
      status: "evaluated",
      challenge_submission: submission as JsonValue,
      challenge_score: score,
      challenge_report: report as JsonValue,
      confidence_level: confidence,
      submitted_at: now,
      evaluation_date: now,
    })
    .eq("id", challengeId)
    .eq("user_id", userId);
  if (updateRes.error) throw new Error(updateRes.error.message || "Challenge save failed.");

  const profileUpdate = await supabaseAdmin.from("freelancers")
    .update({
      challenge_score: score,
      challenge_report: report as JsonValue,
      challenge_submission: submission as JsonValue,
      evaluation_date: now,
      confidence_level: confidence,
    })
    .eq("id", userId);
  if (profileUpdate.error) throw new Error(profileUpdate.error.message || "Profile challenge update failed.");

  const trust = await recalculateTrustScore(supabaseAdmin, userId, "skill_challenge_evaluated");
  return { challengeScore: score, confidenceLevel: confidence, challengeReport: report, trust };
}

async function verifyPortfolio(supabaseAdmin: SupabaseAdmin, authUserId: string, body: Record<string, unknown>) {
  const userId = resolveUserId(authUserId, body.userId);
  const answers = safeRecord(body.answers);
  const requestedProjects = safeArray(body.projects).map(safeRecord).slice(0, 8);
  const [portfolioRes, appsRes, servicesRes] = await Promise.all([
    supabaseAdmin.from("portfolio_items").select("id, title, content, created_at").eq("user_id", userId).limit(12),
    supabaseAdmin.from("applications").select("id, status, work_link, work_message, jobs(title, category, description)").eq("freelancer_id", userId).limit(20),
    supabaseAdmin.from("services").select("id, title, description, category").eq("freelancer_id", userId).limit(8),
  ]);

  const projectContext = [
    ...safeArray(portfolioRes.data),
    ...safeArray(appsRes.data),
    ...safeArray(servicesRes.data),
    ...requestedProjects,
  ].map(safeRecord).slice(0, 18);

  if (projectContext.length === 0) throw new HttpError("Add at least one portfolio item, service, or delivered project before verification.", 400);

  const sourceIds = projectContext.map((project) => safeText(project.id, "", 80)).filter(Boolean);

  if (Object.keys(answers).length === 0) {
    const fallbackQuestions = projectContext.slice(0, 4).map((project, index) => ({
      id: `q${index + 1}`,
      projectId: safeText(project.id, `project-${index + 1}`, 80),
      question: `Explain one technical decision you personally made on "${safeText(project.title, "this project", 120)}" and how you verified it worked.`,
    }));
    const generated = await callTrustAI({
      system: "You ask contextual portfolio verification questions for TeenVerseHub. Return valid JSON only.",
      user: [
        "Create 4 concise follow-up questions that detect fake or exaggerated portfolio projects.",
        `Projects: ${JSON.stringify(projectContext).slice(0, 6000)}`,
        'Return JSON: {"questions":[{"id":"","projectId":"","question":""}]}',
      ].join("\n"),
      fallback: { questions: fallbackQuestions },
      maxTokens: 1200,
    }).catch(() => ({ questions: fallbackQuestions }));

    const questions = safeArray(generated.questions).map(safeRecord).slice(0, 6);
    const insertRes = await supabaseAdmin.from("portfolio_verifications")
      .insert({ user_id: userId, source_project_ids: sourceIds, questions: questions as JsonValue, status: "questions_ready" })
      .select("*")
      .single();
    if (insertRes.error) throw new Error(insertRes.error.message || "Portfolio question save failed.");
    return insertRes.data;
  }

  const fallback = {
    verifiedSkills: [],
    confidenceScores: {},
    projectAnalysis: [],
    technicalSummary: "Portfolio verification completed with limited confidence.",
    fakeProjectRisk: 35,
    report: {
      summary: "Answers were reviewed for consistency.",
      flags: [],
      nextSteps: ["Add more concrete implementation evidence."],
    },
  };

  const evaluation = await callTrustAI({
    system: "You verify TeenVerseHub portfolios. Detect fake projects, infer skills, and return valid JSON only.",
    user: [
      `Projects: ${JSON.stringify(projectContext).slice(0, 7000)}`,
      `Answers: ${JSON.stringify(answers).slice(0, 7000)}`,
      'Return JSON: {"verifiedSkills":[""],"confidenceScores":{"skill":0},"projectAnalysis":[{"projectId":"","risk":0,"notes":""}],"technicalSummary":"","fakeProjectRisk":0,"report":{"summary":"","flags":[""],"nextSteps":[""]}}',
    ].join("\n"),
    fallback,
    maxTokens: 2200,
  }).catch(() => fallback);

  const verifiedSkills = dedupe(safeTextArray(evaluation.verifiedSkills, 24));
  const confidenceScores = safeRecord(evaluation.confidenceScores);
  const projectAnalysis = safeArray(evaluation.projectAnalysis).map(safeRecord).slice(0, 18);
  const technicalSummary = safeText(evaluation.technicalSummary, fallback.technicalSummary, 3000);
  const fakeProjectRisk = clamp(evaluation.fakeProjectRisk);
  const report = safeRecord(evaluation.report);
  const now = new Date().toISOString();

  const insertRes = await supabaseAdmin.from("portfolio_verifications")
    .insert({
      user_id: userId,
      source_project_ids: sourceIds,
      questions: safeArray(body.questions) as JsonValue,
      answers: answers as JsonValue,
      verified_skills: verifiedSkills as unknown as JsonValue,
      confidence_scores: confidenceScores as JsonValue,
      project_analysis: projectAnalysis as unknown as JsonValue,
      technical_summary: technicalSummary,
      fake_project_risk: fakeProjectRisk,
      report: report as JsonValue,
      status: fakeProjectRisk >= 70 ? "needs_review" : "verified",
      provider: "deepseek",
      model: "deepseek-v4-flash",
      evaluated_at: now,
    })
    .select("*")
    .single();
  if (insertRes.error) throw new Error(insertRes.error.message || "Portfolio verification save failed.");

  const profileUpdate = await supabaseAdmin.from("freelancers")
    .update({
      verified_skills: verifiedSkills as unknown as JsonValue,
      confidence_scores: confidenceScores as JsonValue,
      project_analysis: projectAnalysis as unknown as JsonValue,
      technical_summary: technicalSummary,
    })
    .eq("id", userId);
  if (profileUpdate.error) throw new Error(profileUpdate.error.message || "Portfolio profile update failed.");

  for (const skill of verifiedSkills.slice(0, 12)) {
    const confidence = clamp(confidenceScores[skill] ?? 65);
    await supabaseAdmin.from("verified_skill_evidence").insert({
      freelancer_id: userId,
      skill,
      source_type: "portfolio",
      source_id: safeRecord(insertRes.data).id ?? null,
      confidence,
      evidence: { report: technicalSummary } as JsonValue,
    });
  }

  const trust = await recalculateTrustScore(supabaseAdmin, userId, "portfolio_verified");
  return { verification: insertRes.data, trust };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return fail("Method not allowed.", 405);

  try {
    const supabaseAdmin = createSupabaseAdminClient() as unknown as SupabaseAdmin;
    const authUser = await requireAuthenticatedUser(request, supabaseAdmin as never);
    const body = await readJson<Record<string, unknown>>(request);
    const action = getAction(body);

    if (action === "create_challenge") return ok(await createChallenge(supabaseAdmin, authUser.id, body));
    if (action === "autosave_challenge") return ok(await autosaveChallenge(supabaseAdmin, authUser.id, body));
    if (action === "submit_challenge") return ok(await submitChallenge(supabaseAdmin, authUser.id, body));
    if (action === "verify_portfolio") return ok(await verifyPortfolio(supabaseAdmin, authUser.id, body));
    if (action === "recalculate_trust") {
      const userId = resolveUserId(authUser.id, body.userId);
      return ok(await recalculateTrustScore(supabaseAdmin, userId, "manual_recalculate"));
    }

    return fail("Unsupported trust action.", 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Trust engine failed."), status);
  }
});
