export const BASE_PLAN_LIMITS = {
  current_plan: 'Basic',
  bids_remaining: 5,
  resumes_remaining: 1,
  plan_expires_at: null,
};

export const PLAN_LIMITS = {
  Basic: { bids_remaining: 5, resumes_remaining: 1 },
  Starter: { bids_remaining: 12, resumes_remaining: 2 },
  Pro: { bids_remaining: 18, resumes_remaining: 6 },
  Elite: { bids_remaining: 99999, resumes_remaining: 99999 },
};

export const SUBSCRIPTION_BADGES = ['Starter', 'Pro', 'Elite'];

export const isPremiumPlanActive = (userLike = {}) => {
  const plan = userLike?.current_plan || 'Basic';
  if (plan === 'Basic') return false;

  const expiry = userLike?.plan_expires_at ? new Date(userLike.plan_expires_at) : null;
  return Boolean(expiry && expiry > new Date());
};

export const getEffectivePlanName = (userLike = {}) => {
  return isPremiumPlanActive(userLike) ? userLike.current_plan : 'Basic';
};

export const normalizeExpiredSubscription = (userLike = {}) => {
  if (!userLike || isPremiumPlanActive(userLike) || (userLike.current_plan || 'Basic') === 'Basic') {
    return userLike;
  }

  return {
    ...userLike,
    ...BASE_PLAN_LIMITS,
  };
};

export const getPlanLimits = (planName = 'Basic') => {
  return PLAN_LIMITS[planName] || PLAN_LIMITS.Basic;
};

export const filterSubscriptionBadgesForPlan = (badges = [], userLike = {}) => {
  const effectivePlan = getEffectivePlanName(userLike);

  return badges.filter((badge) => {
    if (!SUBSCRIPTION_BADGES.includes(badge?.name)) return true;
    return effectivePlan !== 'Basic' && badge.name === effectivePlan;
  });
};
