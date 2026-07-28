import { callDeepSeek } from "./ai/deepseek.ts";
import { callGemini } from "./ai/gemini.ts";
import { parseAIJson } from "./ai/json.ts";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type SupabaseAdmin = {
  from: (table: string) => {
    select: (columns?: string, options?: JsonObject) => QueryBuilder;
    insert: (values: JsonObject | JsonObject[]) => QueryBuilder;
    update: (values: JsonObject) => QueryBuilder;
    upsert?: (values: JsonObject | JsonObject[], options?: JsonObject) => QueryBuilder;
  };
};

export type QueryBuilder = {
  select: (columns?: string, options?: JsonObject) => QueryBuilder;
  eq: (column: string, value: JsonValue) => QueryBuilder;
  in: (column: string, values: JsonValue[]) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  single: () => Promise<QueryResult>;
  maybeSingle: () => Promise<QueryResult>;
  then: <TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>;
};

export type QueryResult = {
  data: JsonValue;
  error: { message?: string } | null;
};

export type TrustComponent = {
  key: string;
  label: string;
  value: number;
  weight: number;
  weighted: number;
  status: "strong" | "ok" | "needs_work";
};

export const TRUST_WEIGHTS = {
  identity: 15,
  skillChallenge: 20,
  portfolio: 15,
  aiInterview: 10,
  behaviour: 10,
  clientReviews: 10,
  responseTime: 10,
  completionRate: 10,
} as const;

export function clamp(value: unknown, min = 0, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

export function safeText(value: unknown, fallback = "", maxLength = 4000) {
  const text = typeof value === "string" ? value.trim() : fallback;
  return text.slice(0, maxLength);
}

export function safeTextArray(value: unknown, maxItems = 12) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => safeText(item, "", 120)).filter(Boolean).slice(0, maxItems);
}

export function safeRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

export function safeArray(value: unknown): JsonValue[] {
  return Array.isArray(value) ? value.filter((item): item is JsonValue => item !== undefined) : [];
}

export function dedupe(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function getStatus(value: number): TrustComponent["status"] {
  if (value >= 75) return "strong";
  if (value >= 45) return "ok";
  return "needs_work";
}

export function buildComponent(key: string, label: string, value: number, weight: number): TrustComponent {
  const normalized = clamp(value);
  return {
    key,
    label,
    value: Math.round(normalized),
    weight,
    weighted: Math.round((normalized * weight) / 100),
    status: getStatus(normalized),
  };
}

export function normalizeAiObject<T extends JsonObject>(text: string, fallback: T): T {
  try {
    return { ...fallback, ...safeRecord(parseAIJson(text)) } as T;
  } catch {
    return fallback;
  }
}

export async function callTrustAI<T extends JsonObject>({
  system,
  user,
  fallback,
  maxTokens = 1800,
}: {
  system: string;
  user: string;
  fallback: T;
  maxTokens?: number;
}) {
  let text = "";
  try {
    text = await callDeepSeek({
      system,
      user,
      model: "deepseek-v4-flash",
      temperature: 0.22,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });
  } catch (deepSeekError) {
    console.warn("Trust AI DeepSeek failed, trying Gemini:", deepSeekError instanceof Error ? deepSeekError.message : "Unknown error");
    text = await callGemini({
      system,
      user,
      model: "gemini-2.5-flash-lite",
      temperature: 0.2,
      maxTokens,
    });
  }

  return normalizeAiObject<T>(text, fallback);
}

export function uniqueChallengeNonce(userId: string, category: string) {
  const seed = `${userId}:${category}:${crypto.randomUUID()}:${Date.now()}`;
  return Array.from(new Uint8Array(new TextEncoder().encode(seed)))
    .reduce((acc, byte) => (acc + byte * 17) % 9973, 211)
    .toString(36)
    .toUpperCase();
}

export function buildChallengeMandatoryFields(category: string, topic: string, jobTitle = "", jobDescription = "") {
  const context = [category, topic, jobTitle, jobDescription].join(" ").toLowerCase();
  const isLogoDesign = /\blogo\b|brand mark|branding|png|jpg|source file|design/.test(context);
  const version = isLogoDesign ? "logo-lite-v2" : "general-lite-v1";

  if (isLogoDesign) {
    return Object.assign([
      {
        id: "logo_plan",
        label: "Your Logo Idea",
        type: "textarea",
        required: true,
        minLength: 30,
        placeholder: "In 2-3 lines: logo idea, colors/style, and why it will be memorable.",
      },
      {
        id: "delivery_ready",
        label: "Files You Can Submit",
        type: "text",
        required: true,
        minLength: 8,
        placeholder: "Example: PNG + JPG, Figma/Canva source if available.",
      },
      {
        id: "work_commitment",
        label: "I can submit original work on time and handle small revisions.",
        type: "checkbox",
        required: true,
        placeholder: "Required for this client brief.",
      },
    ], { version });
  }

  return Object.assign([
    {
      id: "approach",
      label: "Approach",
      type: "textarea",
      required: true,
      minLength: 30,
      placeholder: "Explain how you will solve this task for the client.",
    },
    {
      id: "deliverable_plan",
      label: "Deliverable Plan",
      type: "textarea",
      required: true,
      minLength: 20,
      placeholder: "List what you will submit and how you will verify quality.",
    },
    {
      id: "originality_commitment",
      label: "Originality Commitment",
      type: "checkbox",
      required: true,
      placeholder: "I confirm this work will be original and not copied.",
    },
  ], { version });
}

export function fallbackChallenge(userId: string, category: string, topic: string, jobTitle = "") {
  const nonce = uniqueChallengeNonce(userId, category);
  const domain = topic || category || "freelance project";
  const mandatoryFields = buildChallengeMandatoryFields(category, topic, jobTitle);
  return {
    title: `${domain} Practical Challenge ${nonce}`,
    brief: `Build a concise work sample for ${jobTitle || domain} that demonstrates practical judgement, originality, and client-ready communication.`,
    instructions: [
      "Read the client context carefully.",
      "Describe your approach, tradeoffs, and quality checks.",
      "Produce a small artifact, implementation plan, script, design outline, or content sample relevant to the category.",
      "Include notes that prove the work is your own.",
    ].join("\n"),
    deliverables: ["solution artifact", "implementation notes", "quality checklist"],
    constraints: {
      uniqueNonce: nonce,
      originalityRequired: true,
      noCopyPaste: true,
      mandatoryFields,
    },
    rubric: {
      quality: 20,
      originality: 20,
      completeness: 20,
      instructionFollowing: 20,
      communication: 20,
    },
    durationMinutes: 45,
  };
}

export async function recalculateTrustScore(supabaseAdmin: SupabaseAdmin, userId: string, reason = "recalculated") {
  const [profileRes, challengesRes, portfolioRes, appsRes] = await Promise.all([
    supabaseAdmin.from("freelancers")
      .select("id, trust_score, is_kyc_verified, kyc_status, challenge_score, confidence_level, confidence_scores, ai_interview_score, response_speed_hours")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin.from("skill_challenges")
      .select("challenge_score, confidence_level, evaluation_date")
      .eq("user_id", userId)
      .order("evaluation_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from("portfolio_verifications")
      .select("confidence_scores, fake_project_risk, evaluated_at")
      .eq("user_id", userId)
      .order("evaluated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from("applications")
      .select("status, client_rating, created_at, completed_at")
      .eq("freelancer_id", userId)
      .limit(80),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message || "Profile lookup failed.");

  const profile = safeRecord(profileRes.data);
  const latestChallenge = safeRecord(challengesRes.data);
  const latestPortfolio = safeRecord(portfolioRes.data);
  const apps = safeArray(appsRes.data).map(safeRecord);

  const identity = profile.is_kyc_verified === true || ["approved", "verified", "age_verified", "payout_ready", "fully_verified"].includes(String(profile.kyc_status || ""))
    ? 100
    : 20;
  const challenge = clamp(latestChallenge.challenge_score ?? profile.challenge_score ?? 0);
  const confidenceScores = safeRecord(latestPortfolio.confidence_scores ?? profile.confidence_scores);
  const portfolioScores = Object.values(confidenceScores).map((item) => clamp(item));
  const portfolio = portfolioScores.length
    ? portfolioScores.reduce((sum, item) => sum + item, 0) / portfolioScores.length
    : Math.max(0, 40 - clamp(latestPortfolio.fake_project_risk, 0, 40));
  const aiInterview = clamp(profile.ai_interview_score ?? 0);
  const behaviour = 90;
  const ratings = apps.map((row) => Number(row.client_rating)).filter((rating) => Number.isFinite(rating) && rating > 0);
  const clientReviews = ratings.length ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 20 : 35;
  const responseHours = Math.max(1, Number(profile.response_speed_hours || 24));
  const responseTime = Math.max(25, 100 - Math.min(72, responseHours) * 1.1);
  const completed = apps.filter((row) => ["Paid", "Completed", "Processing"].includes(String(row.status))).length;
  const failed = apps.filter((row) => ["Rejected", "Cancelled"].includes(String(row.status))).length;
  const completionRate = apps.length ? (completed / Math.max(1, completed + failed)) * 100 : 45;

  const breakdown = [
    buildComponent("identity", "Identity", identity, TRUST_WEIGHTS.identity),
    buildComponent("skillChallenge", "Skill Challenge", challenge, TRUST_WEIGHTS.skillChallenge),
    buildComponent("portfolio", "Portfolio", portfolio, TRUST_WEIGHTS.portfolio),
    buildComponent("aiInterview", "AI Interview", aiInterview, TRUST_WEIGHTS.aiInterview),
    buildComponent("behaviour", "Behaviour", behaviour, TRUST_WEIGHTS.behaviour),
    buildComponent("clientReviews", "Client Reviews", clientReviews, TRUST_WEIGHTS.clientReviews),
    buildComponent("responseTime", "Response Time", responseTime, TRUST_WEIGHTS.responseTime),
    buildComponent("completionRate", "Completion Rate", completionRate, TRUST_WEIGHTS.completionRate),
  ];

  const score = Math.max(0, Math.min(100, breakdown.reduce((sum, item) => sum + item.weighted, 0)));
  const previous = Number(profile.trust_score || 0);
  const updateRes = await supabaseAdmin.from("freelancers")
    .update({ trust_score: score, trust_score_breakdown: breakdown as unknown as JsonValue })
    .eq("id", userId);
  if (updateRes.error) throw new Error(updateRes.error.message || "Trust update failed.");

  if (Math.round(previous) !== score || reason !== "recalculated") {
    const historyRes = await supabaseAdmin.from("trust_score_history")
      .insert({ user_id: userId, score, breakdown: breakdown as unknown as JsonValue, reason });
    if (historyRes.error) throw new Error(historyRes.error.message || "Trust history insert failed.");
  }

  return { score, breakdown };
}
