import { GROQ_ASSISTANT_MODEL } from "./providers.ts";

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

type CallGroqOptions = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
};

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export async function callGroq({
  system,
  user,
  model = GROQ_ASSISTANT_MODEL,
  temperature = 0.4,
  max_tokens = 700,
  response_format,
}: CallGroqOptions) {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  const messages: GroqMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      ...(response_format ? { response_format } : {}),
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Groq request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Groq returned an empty response.");
  }

  return content;
}
