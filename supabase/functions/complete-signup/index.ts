import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  calculateAge,
  corsHeaders,
  getAuthenticatedUser,
  getSupabaseAdmin,
  isValidEmail,
  json,
  normalizeIndianPhone,
  safeAuthError,
} from "../_shared/auth-security.ts";

const ALLOWED_ROLES = new Set(["freelancer", "client"]);

function cleanText(value: unknown, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

function makeReferralCode(name: string) {
  const seed = cleanText(name, 24).split(/\s+/)[0]?.replace(/[^a-z0-9]/gi, "").toUpperCase() || "TVH";
  const suffix = crypto.getRandomValues(new Uint16Array(1))[0] % 9000 + 1000;
  return `${seed}${suffix}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const role = String(body.role || "").trim();
    const name = cleanText(body.name);
    const email = cleanText(body.email || user.email || "", 254).toLowerCase();
    const phone = normalizeIndianPhone(body.phone);
    const nationality = cleanText(body.nationality || "India", 64);
    const source = cleanText(body.source, 80);

    if (!ALLOWED_ROLES.has(role)) throw new Error("Choose a valid account type.");
    if (!name) throw new Error("Enter your name.");
    if (!isValidEmail(email)) throw new Error("Enter a valid email address.");
    if (!source) throw new Error("Select how you discovered TeenVerseHub.");

    const supabaseAdmin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { data: verifiedPhone, error: verificationError } = await supabaseAdmin
      .from("phone_otp_verifications")
      .select("phone, expires_at")
      .eq("phone", phone)
      .gte("expires_at", nowIso)
      .maybeSingle();

    if (verificationError) throw verificationError;
    if (!verifiedPhone) throw new Error("Phone verification required.");

    const [freelancerPhone, clientPhone] = await Promise.all([
      supabaseAdmin.from("freelancers").select("id").eq("phone", phone).neq("id", user.id).maybeSingle(),
      supabaseAdmin.from("clients").select("id").eq("phone", phone).neq("id", user.id).maybeSingle(),
    ]);

    if (freelancerPhone.error) throw freelancerPhone.error;
    if (clientPhone.error) throw clientPhone.error;
    if (freelancerPhone.data || clientPhone.data) throw new Error("This mobile number cannot be used.");

    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert({ id: user.id, email, full_name: name }, { onConflict: "id" });
    if (userError) throw userError;

    const baseProfile = {
      id: user.id,
      name,
      email,
      phone,
      phone_verified: true,
      nationality,
      source,
      referral_code: makeReferralCode(name),
    };

    if (role === "freelancer") {
      const age = calculateAge(body.dob);
      if (age < 14 || age > 21) throw new Error("Platform registration is limited to ages 14 to 21.");

      const { data, error } = await supabaseAdmin
        .from("freelancers")
        .upsert({
          ...baseProfile,
          dob: String(body.dob),
          age,
          gender: cleanText(body.gender || "Other", 32),
        }, { onConflict: "id" })
        .select("*")
        .single();

      if (error) throw error;

      await supabaseAdmin
        .from("phone_otp_verifications")
        .update({ consumed_by: user.id, consumed_at: nowIso })
        .eq("phone", phone);

      return json({ success: true, role, profile: data });
    }

    const { data, error } = await supabaseAdmin
      .from("clients")
      .upsert({
        ...baseProfile,
        is_organisation: cleanText(body.org, 120),
      }, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from("phone_otp_verifications")
      .update({ consumed_by: user.id, consumed_at: nowIso })
      .eq("phone", phone);

    return json({ success: true, role, profile: data });
  } catch (error) {
    console.error("complete-signup:", error);
    return json({ success: false, error: safeAuthError(error) }, 400);
  }
});
