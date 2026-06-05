import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  assertRateLimit,
  assertTurnstile,
  clientIp,
  corsHeaders,
  json,
  safeAuthError,
  toMsg91Identifier,
} from "../_shared/auth-security.ts";

const MSG91_BASE_URL = "https://api.msg91.com/api/v5/widget";

function extractRequestId(data: Record<string, unknown>) {
  return String(data.reqId || data.requestId || data.message || data.data || "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const { phone, identifier, captchaToken } = await req.json();
    const msg91Identifier = toMsg91Identifier(phone || identifier);
    const widgetId = Deno.env.get("MSG91_WIDGET_ID");
    const authkey = Deno.env.get("MSG91_AUTH_KEY") || Deno.env.get("MSG91_AUTHKEY") || Deno.env.get("MSG91_TOKEN_AUTH");

    if (!widgetId || !authkey) throw new Error("OTP service is not configured.");

    await assertTurnstile(captchaToken);
    await assertRateLimit("otp_send_phone", msg91Identifier, 3, 15 * 60);
    await assertRateLimit("otp_send_ip", clientIp(req), 10, 15 * 60);

    const response = await fetch(`${MSG91_BASE_URL}/sendOtp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey },
      body: JSON.stringify({ widgetId, identifier: msg91Identifier }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.type === "error") {
      throw new Error(String(data.message || "OTP could not be sent."));
    }

    return json({
      success: true,
      reqId: extractRequestId(data),
    });
  } catch (error) {
    console.error("send-phone-otp:", error);
    return json({ success: false, error: safeAuthError(error, "We couldn't send the OTP. Please try again.") }, 400);
  }
});
