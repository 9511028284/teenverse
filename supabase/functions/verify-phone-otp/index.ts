import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  assertRateLimit,
  clientIp,
  corsHeaders,
  getSupabaseAdmin,
  json,
  normalizeIndianPhone,
  safeAuthError,
  toMsg91Identifier,
} from "../_shared/auth-security.ts";

const FIREBASE_API_KEY = Deno.env.get("FIREBASE_API_KEY");

async function verifyFirebaseIdToken(idToken: string) {
  if (!FIREBASE_API_KEY) throw new Error("FIREBASE_API_KEY is not configured.");

  // Use Firebase's own REST API to verify the token and get account info
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("Firebase token verification failed:", data.error);
    throw new Error(data.error?.message || "Invalid Firebase token.");
  }

  const user = data.users?.[0];
  if (!user) throw new Error("No user found for this token.");

  return user;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const { firebaseIdToken } = await req.json();

    if (!firebaseIdToken) throw new Error("Firebase ID token is required.");

    const ip = clientIp(req);
    await assertRateLimit("otp_verify_ip", ip, 20, 15 * 60);

    // Verify the Firebase ID token via Google Identity Toolkit REST API
    const firebaseUser = await verifyFirebaseIdToken(firebaseIdToken);

    // Extract the phone number from the verified Firebase user
    const phoneNumber = firebaseUser.phoneNumber;
    if (!phoneNumber) {
      throw new Error("No phone number associated with this Firebase user.");
    }

    const normalizedPhone = normalizeIndianPhone(phoneNumber);
    const msg91Identifier = toMsg91Identifier(normalizedPhone);

    const supabaseAdmin = getSupabaseAdmin();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from("phone_otp_verifications")
      .upsert({
        phone: normalizedPhone,
        msg91_identifier: msg91Identifier,
        req_id: `firebase_${firebaseUser.localId}`,
        access_token_hash: null,
        provider_payload: firebaseUser,
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
