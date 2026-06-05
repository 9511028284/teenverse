import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const token = authHeader.replace("Bearer ", "");
  const supabaseAdmin = getSupabaseAdmin();
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  return user;
}

export function normalizeIndianPhone(input: unknown) {
  const digits = String(input || "").replace(/\D/g, "").replace(/^0+/, "");
  const local = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  if (!/^[6-9]\d{9}$/.test(local)) throw new Error("Enter a valid Indian mobile number.");
  return `+91${local}`;
}

export function toMsg91Identifier(input: unknown) {
  return normalizeIndianPhone(input).replace("+", "");
}

export function isValidEmail(input: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input || "").trim().toLowerCase());
}

export function calculateAge(dob: unknown) {
  const value = String(dob || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Enter a valid date of birth.");

  const birthDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) throw new Error("Enter a valid date of birth.");

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age;
}

export function isStrongPassword(password: unknown) {
  const value = String(password || "");
  return value.length >= 7 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function assertTurnstile(captchaToken: unknown) {
  const secret = Deno.env.get("CLOUDFLARE_TURNSTILE_SECRET");
  if (!captchaToken) throw new Error("Security check required.");
  if (!secret) throw new Error("Security check is not configured.");

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", String(captchaToken));

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const result = await response.json();
  if (!result?.success) throw new Error("Security check failed.");
}

export async function assertRateLimit(action: string, key: string, limit: number, windowSeconds: number) {
  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000).toISOString();
  const safeKey = await sha256Hex(`${action}:${key}`);

  const { count, error: countError } = await supabaseAdmin
    .from("auth_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .eq("rate_key", safeKey)
    .gte("created_at", windowStart);

  if (countError) throw countError;
  if ((count || 0) >= limit) throw new Error("Too many attempts. Please try again later.");

  const { error: insertError } = await supabaseAdmin
    .from("auth_rate_limits")
    .insert({ action, rate_key: safeKey });
  if (insertError) throw insertError;
}

export function clientIp(req: Request) {
  return req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

export function safeAuthError(error: unknown, fallback = "We couldn't complete this request. Please try again.") {
  if (error instanceof Error && /rate|too many|valid indian mobile|security check|invalid or expired otp|send otp first|enter the otp|phone verification required|unauthorized/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
