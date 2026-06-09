import {
  getAIPlanFeatureLimit,
  getFeatureMaxTokens,
  getFeaturePeriodLimit,
  isFeatureEnabled,
  normalizeUserPlan,
  type AIFeature,
  type AIPeriod,
  type UserPlan,
} from "./plan-limits.ts";

export type { AIFeature, AIPeriod, UserPlan };

function isPremiumPlanActive(profile: { current_plan?: unknown; plan_expires_at?: unknown } | null) {
  const plan = normalizeUserPlan(profile?.current_plan);
  if (plan === "basic") return false;

  const expiry = profile?.plan_expires_at ? new Date(String(profile.plan_expires_at)) : null;
  return Boolean(expiry && expiry > new Date());
}

export async function getUserAIPlan(supabaseAdmin: any, userId: string): Promise<UserPlan> {
  const { data, error } = await supabaseAdmin
    .from("freelancers")
    .select("current_plan, plan_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return isPremiumPlanActive(data) ? normalizeUserPlan(data?.current_plan) : "basic";
}

export async function getAIUsageQuota(
  supabaseAdmin: any,
  userId: string,
  feature: AIFeature,
  period: AIPeriod,
) {
  const plan = await getUserAIPlan(supabaseAdmin, userId);
  const limit = getFeaturePeriodLimit(plan, feature, period);

  return {
    plan,
    feature,
    period,
    limit,
    maxTokens: getFeatureMaxTokens(plan, feature),
    enabled: isFeatureEnabled(plan, feature),
    config: getAIPlanFeatureLimit(plan, feature),
  };
}

export async function checkPlanAIUsageLimit(
  supabaseAdmin: any,
  userId: string,
  feature: AIFeature,
  period: AIPeriod,
) {
  const quota = await getAIUsageQuota(supabaseAdmin, userId, feature, period);
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
    allowed: limit > 0 && usage < limit,
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
