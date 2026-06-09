export type UserPlan = "basic" | "starter" | "pro" | "elite";
export type AIPeriod = "daily" | "weekly" | "monthly";
export type AIFeature =
  | "resume_generation"
  | "quiz_generation"
  | "ai_assistant"
  | "freelancer_work_check"
  | "talent_matching"
  | "large_file_ai"
  | "gemini_second_check";

type UsageFeatureLimit = Partial<Record<AIPeriod, number>> & {
  maxTokens: number;
};

type EnabledFeatureLimit = {
  enabled: boolean;
};

export type AIFeatureLimit = UsageFeatureLimit | EnabledFeatureLimit;

// Basic limits are designed to keep AI cost around ₹500-₹700/month for 100 Basic users.
// Do not increase these limits without updating budget calculations.
export const AI_PLAN_LIMITS = {
  basic: {
    resume_generation: {
      monthly: 1,
      maxTokens: 1200,
    },
    quiz_generation: {
      monthly: 4,
      maxTokens: 1500,
    },
    ai_assistant: {
      daily: 3,
      weekly: 10,
      maxTokens: 300,
    },
    talent_matching: {
      monthly: 5,
      maxTokens: 1000,
    },
    freelancer_work_check: {
      monthly: 5,
      maxTokens: 1000,
    },
    large_file_ai: {
      enabled: false,
    },
    gemini_second_check: {
      enabled: false,
    },
  },

  starter: {
    resume_generation: {
      monthly: 2,
      maxTokens: 1600,
    },
    quiz_generation: {
      monthly: 8,
      maxTokens: 2000,
    },
    ai_assistant: {
      daily: 5,
      weekly: 20,
      maxTokens: 500,
    },
    talent_matching: {
      monthly: 20,
      maxTokens: 1200,
    },
    freelancer_work_check: {
      monthly: 25,
      maxTokens: 1200,
    },
    large_file_ai: {
      enabled: false,
    },
    gemini_second_check: {
      enabled: false,
    },
  },

  pro: {
    resume_generation: {
      monthly: 5,
      maxTokens: 2200,
    },
    quiz_generation: {
      monthly: 30,
      maxTokens: 2500,
    },
    ai_assistant: {
      daily: 20,
      weekly: 100,
      maxTokens: 800,
    },
    talent_matching: {
      monthly: 100,
      maxTokens: 1500,
    },
    freelancer_work_check: {
      monthly: 100,
      maxTokens: 1500,
    },
    large_file_ai: {
      enabled: true,
    },
    gemini_second_check: {
      enabled: true,
    },
  },

  elite: {
    resume_generation: {
      monthly: 20,
      maxTokens: 2500,
    },
    quiz_generation: {
      monthly: 200,
      maxTokens: 3000,
    },
    ai_assistant: {
      daily: 100,
      weekly: 500,
      monthly: 1000,
      maxTokens: 1000,
    },
    talent_matching: {
      monthly: 300,
      maxTokens: 1800,
    },
    freelancer_work_check: {
      monthly: 300,
      maxTokens: 1800,
    },
    large_file_ai: {
      enabled: true,
    },
    gemini_second_check: {
      enabled: true,
    },
  },
} as const;

const PLAN_NAME_ALIASES: Record<string, UserPlan> = {
  base: "basic",
  basic: "basic",
  starter: "starter",
  pro: "pro",
  elite: "elite",
};

export function normalizeUserPlan(planName: unknown): UserPlan {
  const key = String(planName || "basic").trim().toLowerCase();
  return PLAN_NAME_ALIASES[key] || "basic";
}

export function getAIPlanFeatureLimit(plan: UserPlan, feature: AIFeature): AIFeatureLimit {
  return AI_PLAN_LIMITS[plan]?.[feature] || AI_PLAN_LIMITS.basic[feature];
}

export function getFeatureMaxTokens(plan: UserPlan, feature: AIFeature) {
  const config = getAIPlanFeatureLimit(plan, feature);
  return "maxTokens" in config ? config.maxTokens : 0;
}

export function getFeaturePeriodLimit(plan: UserPlan, feature: AIFeature, period: AIPeriod) {
  const config = getAIPlanFeatureLimit(plan, feature);
  return "maxTokens" in config ? Number(config[period] || 0) : 0;
}

export function isFeatureEnabled(plan: UserPlan, feature: AIFeature) {
  const config = getAIPlanFeatureLimit(plan, feature);
  if ("enabled" in config) return Boolean(config.enabled);
  return true;
}

const BASIC_INPUT_LIMITS: Partial<Record<AIFeature, number>> = {
  ai_assistant: 1000,
  quiz_generation: 1500,
  resume_generation: 4000,
  talent_matching: 4000,
  freelancer_work_check: 8000,
};

const PREMIUM_INPUT_MULTIPLIER: Record<UserPlan, number> = {
  basic: 1,
  starter: 2,
  pro: 4,
  elite: 6,
};

export const INPUT_TOO_LONG_ERROR = "Input is too long for your current plan. Please shorten it or upgrade.";

export function getInputCharacterLimit(plan: UserPlan, feature: AIFeature) {
  const base = BASIC_INPUT_LIMITS[feature];
  if (!base) return 0;
  return base * PREMIUM_INPUT_MULTIPLIER[plan];
}

export function isInputTooLong(plan: UserPlan, feature: AIFeature, text: string) {
  const limit = getInputCharacterLimit(plan, feature);
  return limit > 0 && text.length > limit;
}
