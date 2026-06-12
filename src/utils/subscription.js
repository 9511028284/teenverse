export const BASE_PLAN_LIMITS = {
  current_plan: 'Basic',
  bids_remaining: 5,
  resumes_remaining: 1,
  plan_expires_at: null,
};

const PLAN_NAME_ALIASES = {
  base: 'Basic',
  basic: 'Basic',
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
};

export const normalizePlanName = (planName = 'Basic') => {
  const key = String(planName || 'Basic').trim().toLowerCase();
  return PLAN_NAME_ALIASES[key] || 'Basic';
};

export const PLAN_LIMITS = {
  Basic: { bids_remaining: 5, resumes_remaining: 1 },
  Starter: { bids_remaining: 12, resumes_remaining: 2 },
  Pro: { bids_remaining: 18, resumes_remaining: 6 },
  Elite: { bids_remaining: 99999, resumes_remaining: 99999 },
};

export const SUBSCRIPTION_BADGES = ['Starter', 'Pro', 'Elite'];

export const isPremiumPlanActive = (userLike = {}) => {
  const plan = normalizePlanName(userLike?.current_plan);
  if (plan === 'Basic') return false;

  const expiry = userLike?.plan_expires_at ? new Date(userLike.plan_expires_at) : null;
  return Boolean(expiry && expiry > new Date());
};

export const getEffectivePlanName = (userLike = {}) => {
  return isPremiumPlanActive(userLike) ? normalizePlanName(userLike?.current_plan) : 'Basic';
};

export const normalizeExpiredSubscription = (userLike = {}) => {
  if (!userLike) return userLike;

  const currentPlan = normalizePlanName(userLike.current_plan);
  const hasPlanNameDrift = currentPlan !== (userLike.current_plan || 'Basic');

  if (isPremiumPlanActive(userLike)) {
    return hasPlanNameDrift ? { ...userLike, current_plan: currentPlan } : userLike;
  }

  if (currentPlan === 'Basic') {
    return hasPlanNameDrift ? { ...userLike, current_plan: 'Basic' } : userLike;
  }

  return {
    ...userLike,
    ...BASE_PLAN_LIMITS,
  };
};

export const getPlanLimits = (planName = 'Basic') => {
  return PLAN_LIMITS[normalizePlanName(planName)] || PLAN_LIMITS.Basic;
};

export const getCommissionRate = (planName = 'Basic') => {
  switch (normalizePlanName(planName)) {
    case 'Elite':
      return 0.04;
    case 'Pro':
      return 0.06;
    case 'Starter':
      return 0.07;
    default:
      return 0.10;
  }
};

export const formatCommissionRate = (rate) => {
  const percentage = Number(rate) * 100;
  return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`;
};

export const filterSubscriptionBadgesForPlan = (badges = [], userLike = {}) => {
  const effectivePlan = getEffectivePlanName(userLike);

  return badges.filter((badge) => {
    if (!SUBSCRIPTION_BADGES.includes(badge?.name)) return true;
    return effectivePlan !== 'Basic' && badge.name === effectivePlan;
  });
};
