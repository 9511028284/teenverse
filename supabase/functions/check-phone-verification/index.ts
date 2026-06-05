import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  corsHeaders,
  getAuthenticatedUser,
  getSupabaseAdmin,
  json,
  normalizeIndianPhone,
  safeAuthError,
} from "../_shared/auth-security.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const user = await getAuthenticatedUser(req);
    const { phone } = await req.json();
    const normalizedPhone = normalizeIndianPhone(phone);
    const nowIso = new Date().toISOString();

    const { data, error } = await getSupabaseAdmin()
      .from("phone_otp_verifications")
      .select("phone, consumed_by, expires_at")
      .eq("phone", normalizedPhone)
      .gte("expires_at", nowIso)
      .maybeSingle();

    if (error) throw error;

    const verified = Boolean(data && (!data.consumed_by || data.consumed_by === user.id));
    return json({ success: true, verified });
  } catch (error) {
    console.error("check-phone-verification:", error);
    return json({ success: false, verified: false, error: safeAuthError(error) }, 400);
  }
});
