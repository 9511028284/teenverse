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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { action, user_id, age_group, bank_details } = await req.json();

    if (action === "VERIFY_IDENTITY") {
      return jsonResponse({
        success: false,
        error: "Legacy sandbox KYC is disabled. Use the production digilocker and pan functions.",
      }, 410);
    }

    if (action === "LINK_BANK") {
      const beneficiaryId = `BEN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const isMinor = age_group === "minor";
      const rawGuardianName = bank_details.guardian_name?.trim();

      const dbPayload = {
        user_id,
        account_holder_name: bank_details.account_holder_name,
        account_number: bank_details.account_number,
        ifsc_code: bank_details.ifsc_code,
        bank_name: bank_details.bank_name,
        is_guardian_account: isMinor,
        guardian_name: isMinor ? rawGuardianName || "Unknown Parent" : "Self",
        guardian_relationship: isMinor ? bank_details.guardian_relationship || "Guardian" : "Self",
        parent_consent_verified: bank_details.consent || false,
        beneficiary_id: beneficiaryId,
      };

      const { error: insertError } = await supabaseClient.from("user_banking").insert(dbPayload);
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
