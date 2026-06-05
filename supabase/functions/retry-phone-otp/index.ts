import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  assertRateLimit,
  clientIp,
  corsHeaders,
  json,
  safeAuthError,
  toMsg91Identifier,
} from "../_shared/auth-security.ts";

const MSG91_BASE_URL = "https://api.msg91.com/api/v5/widget";

function extractRequestId(data: Record<string, unknown>, fallback: string) {
  return String(data.reqId || data.requestId || data.message || data.data || fallback || "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const { phone, reqId, channel } = await req.json();
    const msg91Identifier = toMsg91Identifier(phone);
    const widgetId = Deno.env.get("MSG91_WIDGET_ID");
    const authkey = Deno.env.get("MSG91_AUTH_KEY") || Deno.env.get("MSG91_AUTHKEY") || Deno.env.get("MSG91_TOKEN_AUTH");

    if (!widgetId || !authkey) throw new Error("OTP service is not configured.");
    if (!reqId) throw new Error("Send OTP first.");

    await assertRateLimit("otp_retry_phone", msg91Identifier, 3, 15 * 60);
    await assertRateLimit("otp_retry_ip", clientIp(req), 10, 15 * 60);

    const payload: Record<string, unknown> = { widgetId, reqId };
    if (channel) payload.retryChannel = channel;

    const response = await fetch(`${MSG91_BASE_URL}/retryOtp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.type === "error") {
      throw new Error(String(data.message || "OTP could not be resent."));
    }

    return json({
      success: true,
      reqId: extractRequestId(data, String(reqId)),
    });
  } catch (error) {
    console.error("retry-phone-otp:", error);
    return json({ success: false, error: safeAuthError(error, "We couldn't resend the OTP. Please try again.") }, 400);
  }
});
