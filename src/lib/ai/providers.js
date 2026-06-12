export const DEFAULT_GENERATION_PROVIDER = 'deepseek';
export const DEFAULT_ASSISTANT_PROVIDER = 'groq';
export const DEFAULT_FIRST_CHECK_PROVIDER = 'deepseek';
export const DEFAULT_SECOND_CHECK_PROVIDER = 'gemini';

export const AI_MODELS = Object.freeze({
  deepseek: Object.freeze({
    fast: 'deepseek-v4-flash',
    pro: 'deepseek-v4-pro',
  }),
  groq: Object.freeze({
    assistant: 'llama-3.1-8b-instant',
  }),
  gemini: Object.freeze({
    secondCheck: 'gemini-2.5-flash-lite',
  }),
});

export const AI_PROVIDERS = Object.freeze({
  DEEPSEEK: 'deepseek',
  GEMINI: 'gemini',
  GROQ: 'groq',
});
