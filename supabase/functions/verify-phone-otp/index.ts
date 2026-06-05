import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  assertRateLimit,
  clientIp,
  corsHeaders,
  getSupabaseAdmin,
  json,
  normalizeIndianPhone,
  safeAuthError,
  sha256Hex,
  toMsg91Identifier,
} from "../_shared/auth-security.ts";

const MSG91_BASE_URL = "https://api.msg91.com/api/v5/widget";
const MSG91_CONTROL_WIDGET_URL = "https://control.msg91.com/api/v5/widget";

function extractAccessToken(data: Record<string, unknown>) {
  const value = String(
    data["access-token"] ||
      data.accessToken ||
      data.access_token ||
      data.token ||
      "",
  );

  return value.includes(".") || value.length > 80 ? value : "";
}

async function verifyAccessToken(accessToken: string) {
  const authkey = Deno.env.get("MSG91_AUTHKEY") || Deno.env.get("MSG91_AUTH_KEY") || Deno.env.get("MSG91_TOKEN_AUTH");
  if (!authkey || !accessToken) return null;

  const response = await fetch(`${MSG91_CONTROL_WIDGET_URL}/verifyAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ authkey, "access-token": accessToken }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.type === "error") {
    throw new Error("Phone verification failed.");
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const { phone, otp, reqId } = await req.json();
    const normalizedPhone = normalizeIndianPhone(phone);
    const msg91Identifier = toMsg91Identifier(normalizedPhone);
    const widgetId = Deno.env.get("MSG91_WIDGET_ID");
    const authkey = Deno.env.get("MSG91_AUTH_KEY") || Deno.env.get("MSG91_AUTHKEY") || Deno.env.get("MSG91_TOKEN_AUTH");

    if (!widgetId || !authkey) throw new Error("OTP service is not configured.");
    if (!reqId || !otp) throw new Error("Enter the OTP sent to your mobile.");

    await assertRateLimit("otp_verify_phone", msg91Identifier, 5, 15 * 60);
    await assertRateLimit("otp_verify_ip", clientIp(req), 20, 15 * 60);

    const response = await fetch(`${MSG91_BASE_URL}/verifyOtp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey },
      body: JSON.stringify({ widgetId, reqId, otp: String(otp) }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.type === "error") {
      throw new Error("Invalid or expired OTP.");
    }

    const accessToken = extractAccessToken(data);
    const verifiedData = accessToken ? await verifyAccessToken(accessToken) : null;
    const tokenHash = accessToken ? await sha256Hex(accessToken) : null;
    const supabaseAdmin = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from("phone_otp_verifications")
      .upsert({
        phone: normalizedPhone,
        msg91_identifier: msg91Identifier,
        req_id: String(reqId),
        access_token_hash: tokenHash,
        provider_payload: verifiedData || data,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: "phone" });

    if (upsertError) throw upsertError;

    return json({ success: true, phone: normalizedPhone });
  } catch (error) {
    console.error("verify-phone-otp:", error);
    return json({ success: false, error: safeAuthError(error, "Phone verification failed.") }, 400);
  }
});
