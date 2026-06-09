export type UserPlan = "basic" | "starter" | "pro" | "elite";

// Display-only copy for frontend messaging. Server enforcement lives in Supabase Edge Functions.
// Basic limits are designed to keep AI cost around ₹500-₹700/month for 100 Basic users.
// Do not increase these limits without updating budget calculations.
export const AI_PLAN_LIMITS = {
  basic: {
    resume_generation: { monthly: 1, maxTokens: 1200 },
    quiz_generation: { monthly: 4, maxTokens: 1500 },
    ai_assistant: { daily: 3, weekly: 10, maxTokens: 300 },
    talent_matching: { monthly: 5, maxTokens: 1000 },
    freelancer_work_check: { monthly: 5, maxTokens: 1000 },
    large_file_ai: { enabled: false },
    gemini_second_check: { enabled: false },
  },
  starter: {
    resume_generation: { monthly: 2, maxTokens: 1600 },
    quiz_generation: { monthly: 8, maxTokens: 2000 },
    ai_assistant: { daily: 5, weekly: 20, maxTokens: 500 },
    talent_matching: { monthly: 20, maxTokens: 1200 },
    freelancer_work_check: { monthly: 25, maxTokens: 1200 },
    large_file_ai: { enabled: false },
    gemini_second_check: { enabled: false },
  },
  pro: {
    resume_generation: { monthly: 5, maxTokens: 2200 },
    quiz_generation: { monthly: 30, maxTokens: 2500 },
    ai_assistant: { daily: 20, weekly: 100, maxTokens: 800 },
    talent_matching: { monthly: 100, maxTokens: 1500 },
    freelancer_work_check: { monthly: 100, maxTokens: 1500 },
    large_file_ai: { enabled: true },
    gemini_second_check: { enabled: true },
  },
  elite: {
    resume_generation: { monthly: 20, maxTokens: 2500 },
    quiz_generation: { monthly: 200, maxTokens: 3000 },
    ai_assistant: { daily: 100, weekly: 500, monthly: 1000, maxTokens: 1000 },
    talent_matching: { monthly: 300, maxTokens: 1800 },
    freelancer_work_check: { monthly: 300, maxTokens: 1800 },
    large_file_ai: { enabled: true },
    gemini_second_check: { enabled: true },
  },
} as const;
