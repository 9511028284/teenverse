import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const cleanText = (value: unknown, maxLength = 160) =>
  String(value || "").trim().slice(0, maxLength);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { action, user_id, age_group, bank_details } = await req.json();
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: authData, error: authError } = token
      ? await supabaseClient.auth.getUser(token)
      : { data: { user: null }, error: new Error("Missing authorization header") };

    if (authError || !authData.user || authData.user.id !== user_id) {
      return jsonResponse({ success: false, error: "Unauthorized banking request." }, 401);
    }

    if (action === "VERIFY_IDENTITY") {
      return jsonResponse({
        success: false,
        error: "Legacy sandbox KYC is disabled. Use the production digilocker and pan functions.",
      }, 410);
    }

    if (action === "LINK_BANK") {
      if (!bank_details || typeof bank_details !== "object") {
        return jsonResponse({ success: false, error: "Bank details are required." }, 400);
      }

      const beneficiaryId = `BEN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const isMinor = age_group === "minor";
      const accountHolderName = cleanText(bank_details.account_holder_name);
      const accountNumber = cleanText(bank_details.account_number, 40);
      const ifscCode = cleanText(bank_details.ifsc_code, 24).toUpperCase();
      const bankName = cleanText(bank_details.bank_name || "Not provided", 120) || "Not provided";
      const rawGuardianName = cleanText(bank_details.guardian_name);
      const consent = bank_details.consent === true;

      if (!accountHolderName || !accountNumber || !ifscCode) {
        return jsonResponse({ success: false, error: "Account holder, account number, and IFSC are required." }, 400);
      }

      if (isMinor && (!rawGuardianName || !consent)) {
        return jsonResponse({ success: false, error: "Parent/guardian payout approval is required." }, 400);
      }

      const dbPayload = {
        user_id,
        account_holder_name: accountHolderName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        bank_name: bankName,
        is_guardian_account: isMinor,
        guardian_name: isMinor ? rawGuardianName || "Unknown Parent" : "Self",
        guardian_relationship: isMinor ? cleanText(bank_details.guardian_relationship || "Guardian", 80) : "Self",
        parent_consent_verified: isMinor ? consent : false,
        beneficiary_id: beneficiaryId,
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabaseClient
        .from("user_banking")
        .upsert(dbPayload, { onConflict: "user_id" });
      if (insertError) {
        console.error("DB Insert Error:", insertError);
        return jsonResponse({ success: false, error: `Database Error: ${insertError.message}` }, 400);
      }

      return jsonResponse({
        success: true,
        mode: "production",
        status: "bank_linked",
        beneficiary_id: beneficiaryId,
      });
    }

    return jsonResponse({ error: "Invalid Action" }, 400);
  } catch (error) {
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
