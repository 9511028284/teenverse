type CallGeminiOptions = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export async function callGemini({
  system,
  user,
  model = "gemini-2.5-flash-lite",
  temperature = 0.2,
  maxTokens = 1000,
}: CallGeminiOptions) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: user }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Gemini request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: unknown }) => typeof part.text === "string" ? part.text : "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}
