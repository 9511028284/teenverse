import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { callDeepSeek } from "../_shared/ai/deepseek.ts";
import { corsHeaders, fail, getErrorMessage, ok, readJson } from "../_shared/ai/http.ts";
import { parseAIJson } from "../_shared/ai/json.ts";
import { createSupabaseAdminClient, HttpError, requireAuthenticatedUser, resolveUserId } from "../_shared/ai/supabase.ts";
import { checkPlanAIUsageLimit, incrementAIUsage } from "../_shared/ai/usage.ts";

function toArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeResume(parsed: any) {
  const experience = Array.isArray(parsed?.experience) ? parsed.experience : parsed?.experiences;
  const experiences = toArray(experience).map((item: any) => {
    if (typeof item === "string") return { title: "Experience", company: "Self declared", description: item };
    return {
      title: String(item?.title || item?.role || "Experience"),
      company: String(item?.company || item?.organization || "Self declared"),
      description: String(item?.description || item?.impact || item?.summary || ""),
      start_date: item?.start_date || null,
      end_date: item?.end_date || null,
    };
  });

  const projects = toArray(parsed?.projects).map((item: any) => (
    typeof item === "string" ? { title: "Project", description: item } : item
  ));
  const education = toArray(parsed?.education);
  const skills = toArray(parsed?.skills).map((item: any) => (
    typeof item === "string" ? item : String(item?.skill_name || item?.name || "")
  )).filter(Boolean);
  const summary = String(parsed?.summary || parsed?.journey_statement || "").trim();

  return {
    summary,
    journey_statement: String(parsed?.journey_statement || summary || "").trim(),
    skills,
    experience: experiences,
    experiences,
    projects,
    education,
    finalResumeText: String(parsed?.finalResumeText || parsed?.final_resume_text || "").trim(),
    suspicion_flags: Array.isArray(parsed?.suspicion_flags) ? parsed.suspicion_flags : [],
  };
}

function buildResumePrompt(body: Record<string, unknown>) {
  if (body.roughText) {
    return [
      "Create a clean ATS-friendly resume from the following rough material.",
      "Return JSON only with this shape:",
      '{ "summary": "", "journey_statement": "", "skills": [], "experience": [], "experiences": [], "projects": [], "education": [], "finalResumeText": "", "suspicion_flags": [] }',
      "",
      "Rules:",
      "- Do not invent employers, metrics, awards, or clients.",
      "- Keep unverified claims modest and transparent.",
      "- Use concise impact-focused language.",
      "",
      `Rough material:\n${String(body.roughText)}`,
    ].join("\n");
  }

  return [
    "Create a clean ATS-friendly resume for the following user.",
    "Return JSON only with:",
    '{ "summary": "", "skills": [], "experience": [], "projects": [], "education": [], "finalResumeText": "" }',
    "",
    `Name: ${String(body.name || "")}`,
    `Target role: ${String(body.targetRole || "")}`,
    `Skills: ${String(body.skills || "")}`,
    `Education: ${String(body.education || "")}`,
    `Projects: ${String(body.projects || "")}`,
    `Experience: ${String(body.experience || "")}`,
  ].join("\n");
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
    const userId = resolveUserId(authUser.id, body.userId);

    const usage = await checkPlanAIUsageLimit(supabaseAdmin, userId, "resume_generation", "monthly");
    if (!usage.allowed) {
      return fail(`Monthly resume generation limit reached for your ${usage.plan} plan.`, 403);
    }

    const system = "You are a professional ATS-friendly resume generator for TeenVerseHub. Return valid JSON only.";
    const responseText = await callDeepSeek({
      system,
      user: buildResumePrompt(body),
      model: "deepseek-v4-flash",
      temperature: 0.25,
      max_tokens: 2200,
      response_format: { type: "json_object" },
    });

    const resume = normalizeResume(parseAIJson(responseText));
    await incrementAIUsage(supabaseAdmin, userId, "resume_generation", "monthly");
    return ok(resume);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return fail(getErrorMessage(error, "Resume generation failed."), status);
  }
});
