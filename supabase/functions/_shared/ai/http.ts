export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function ok(data: unknown, status = 200) {
  return json({ success: true, data }, status);
}

export function fail(error: string, status = 400) {
  return json({ success: false, error }, status);
}

export function getErrorMessage(error: unknown, fallback = "AI request failed.") {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }
  return fallback;
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

