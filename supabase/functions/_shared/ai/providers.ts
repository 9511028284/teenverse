export type AIProvider = "deepseek" | "gemini" | "groq";

export const DEFAULT_GENERATION_PROVIDER: AIProvider = "deepseek";
export const DEFAULT_ASSISTANT_PROVIDER: AIProvider = "groq";
export const DEFAULT_FIRST_CHECK_PROVIDER: AIProvider = "deepseek";
export const DEFAULT_SECOND_CHECK_PROVIDER: AIProvider = "gemini";

export const AI_MODELS = {
  deepseek: {
    fast: "deepseek-v4-flash",
    pro: "deepseek-v4-pro",
  },
  groq: {
    assistant: "llama-3.1-8b-instant",
  },
  gemini: {
    secondCheck: "gemini-flash-lite",
  },
} as const;

export const DEEPSEEK_DEFAULT_MODEL = AI_MODELS.deepseek.fast;
export const DEEPSEEK_COMPLEX_MODEL = AI_MODELS.deepseek.pro;
export const GROQ_ASSISTANT_MODEL = AI_MODELS.groq.assistant;
