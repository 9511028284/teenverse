export type AIPeriod = "daily" | "weekly" | "monthly";
export type AIFeature =
  | "resume_generation"
  | "quiz_generation"
  | "ai_assistant"
  | "freelancer_work_check"
  | "portfolio_generation"
  | "talent_matching";

type AIPlan = "Basic" | "Starter" | "Pro" | "Elite";

const PLAN_NAME_ALIASES: Record<string, AIPlan> = {
  base: "Basic",
  basic: "Basic",
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

const UNLIMITED_QUOTA = 99999;

const AI_PLAN_LIMITS: Record<AIPlan, Record<AIFeature, Partial<Record<AIPeriod, number>>>> = {
  Basic: {
    resume_generation: { monthly: 1 },
    quiz_generation: { monthly: 8 },
    ai_assistant: { daily: 5, weekly: 20 },
    freelancer_work_check: { monthly: 10 },
    portfolio_generation: { monthly: 2 },
    talent_matching: { daily: 5, weekly: 20 },
  },
  Starter: {
    resume_generation: { monthly: 2 },
    quiz_generation: { monthly: 16 },
    ai_assistant: { daily: 10, weekly: 40 },
    freelancer_work_check: { monthly: 25 },
    portfolio_generation: { monthly: 8 },
    talent_matching: { daily: 10, weekly: 40 },
  },
  Pro: {
    resume_generation: { monthly: 6 },
    quiz_generation: { monthly: 32 },
    ai_assistant: { daily: 25, weekly: 100 },
    freelancer_work_check: { monthly: 75 },
    portfolio_generation: { monthly: 20 },
    talent_matching: { daily: 25, weekly: 100 },
  },
  Elite: {
    resume_generation: { monthly: UNLIMITED_QUOTA },
    quiz_generation: { monthly: UNLIMITED_QUOTA },
    ai_assistant: { daily: UNLIMITED_QUOTA, weekly: UNLIMITED_QUOTA },
    freelancer_work_check: { monthly: UNLIMITED_QUOTA },
    portfolio_generation: { monthly: UNLIMITED_QUOTA },
    talent_matching: { daily: UNLIMITED_QUOTA, weekly: UNLIMITED_QUOTA },
  },
};

function normalizePlanName(planName: unknown): AIPlan {
  const key = String(planName || "Basic").trim().toLowerCase();
  return PLAN_NAME_ALIASES[key] || "Basic";
}

function isPremiumPlanActive(profile: { current_plan?: unknown; plan_expires_at?: unknown } | null) {
  const plan = normalizePlanName(profile?.current_plan);
  if (plan === "Basic") return false;

  const expiry = profile?.plan_expires_at ? new Date(String(profile.plan_expires_at)) : null;
  return Boolean(expiry && expiry > new Date());
}

export async function getUserAIPlan(supabaseAdmin: any, userId: string): Promise<AIPlan> {
  const { data, error } = await supabaseAdmin
    .from("freelancers")
    .select("current_plan, plan_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return isPremiumPlanActive(data) ? normalizePlanName(data?.current_plan) : "Basic";
}

export async function getAIUsageQuota(
  supabaseAdmin: any,
  userId: string,
  feature: AIFeature,
  period: AIPeriod,
) {
  const plan = await getUserAIPlan(supabaseAdmin, userId);
  const limit = AI_PLAN_LIMITS[plan]?.[feature]?.[period] ?? AI_PLAN_LIMITS.Basic[feature]?.[period] ?? 0;

  return {
    plan,
    feature,
    period,
    limit,
    unlimited: limit >= UNLIMITED_QUOTA,
  };
}

export async function checkPlanAIUsageLimit(
  supabaseAdmin: any,
  userId: string,
  feature: AIFeature,
  period: AIPeriod,
) {
  const quota = await getAIUsageQuota(supabaseAdmin, userId, feature, period);
  if (quota.unlimited) {
    const { periodStart, periodEnd } = getPeriodBounds(period);
    return {
      ...quota,
      allowed: true,
      usage: 0,
      remaining: UNLIMITED_QUOTA,
      periodStart,
      periodEnd,
    };
  }

  const usage = await checkAIUsageLimit(supabaseAdmin, userId, feature, quota.limit, period);
  return {
    ...quota,
    ...usage,
  };
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getPeriodBounds(period: AIPeriod, now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);

  if (period === "weekly") {
    const day = start.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + diffToMonday);
    end.setUTCDate(start.getUTCDate() + 6);
  } else if (period === "monthly") {
    start.setUTCDate(1);
    end.setUTCMonth(start.getUTCMonth() + 1, 0);
  }

  return {
    periodStart: toDateString(start),
    periodEnd: toDateString(end),
  };
}

type UsageRow = {
  id: string;
  usage_count: number | null;
};

export async function checkAIUsageLimit(
  supabaseAdmin: any,
  userId: string,
  feature: AIFeature,
  limit: number,
  period: AIPeriod,
) {
  const { periodStart, periodEnd } = getPeriodBounds(period);
  const { data, error } = await supabaseAdmin
    .from("ai_usage_limits")
    .select("id, usage_count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("period_type", period)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();

  if (error) throw error;

  const usage = Math.max(0, Number((data as UsageRow | null)?.usage_count || 0));
  return {
    allowed: usage < limit,
    usage,
    limit,
    remaining: Math.max(0, limit - usage),
    periodStart,
    periodEnd,
  };
}

export async function incrementAIUsage(
  supabaseAdmin: any,
  userId: string,
  feature: AIFeature,
  period: AIPeriod,
) {
  const { periodStart, periodEnd } = getPeriodBounds(period);
  const { data, error } = await supabaseAdmin
    .from("ai_usage_limits")
    .select("id, usage_count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("period_type", period)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();

  if (error) throw error;

  if ((data as UsageRow | null)?.id) {
    const nextCount = Math.max(0, Number((data as UsageRow).usage_count || 0)) + 1;
    const { error: updateError } = await supabaseAdmin
      .from("ai_usage_limits")
      .update({ usage_count: nextCount, updated_at: new Date().toISOString() })
      .eq("id", (data as UsageRow).id);

    if (updateError) throw updateError;
    return nextCount;
  }

  const { error: insertError } = await supabaseAdmin
    .from("ai_usage_limits")
    .insert({
      user_id: userId,
      feature,
      period_type: period,
      period_start: periodStart,
      period_end: periodEnd,
      usage_count: 1,
    });

  if (insertError) throw insertError;
  return 1;
}
