import { DEEPSEEK_DEFAULT_MODEL } from "./providers.ts";

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type CallDeepSeekOptions = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
};

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export async function callDeepSeek({
  system,
  user,
  model = DEEPSEEK_DEFAULT_MODEL,
  temperature = 0.3,
  max_tokens = 1500,
  response_format,
}: CallDeepSeekOptions) {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is missing.");
  }

  const messages: DeepSeekMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
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
    const message = payload?.error?.message || payload?.message || `DeepSeek request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("DeepSeek returned an empty response.");
  }

  return content;
}

