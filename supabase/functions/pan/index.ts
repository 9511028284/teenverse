import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const CASHFREE_API_URL = Deno.env.get("CASHFREE_KYC_API_URL") || "https://sandbox.cashfree.com/verification";
const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_KYC_CLIENT_ID");
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_KYC_CLIENT_SECRET");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ==========================================
    // ACTION: Verify PAN (Adult or Guardian)
    // ==========================================
    if (action === "VERIFY_PAN") {
      const response = await fetch(`${CASHFREE_API_URL}/pan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": CASHFREE_CLIENT_ID!,
          "x-client-secret": CASHFREE_CLIENT_SECRET!,
        },
        body: JSON.stringify({
          pan: payload.pan_number,
          name: payload.name || "User", 
        }),
      });

      const data = await response.json();
      
      if (data.valid === true) {
        return new Response(JSON.stringify({ success: true, registered_name: data.registered_name }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        throw new Error("Invalid PAN Card provided.");
      }
    }

    // ==========================================
    // ACTION: Save Final KYC State to Database
    // ==========================================
    if (action === "SAVE_KYC_DATA") {
      const { user_id, age_group, dob, pan_number, digilocker_verified, guardian_consent } = payload;
      
      const { error } = await supabaseAdmin
        .from('freelancers') // Update if your table name differs
        .update({
          kyc_status: 'verified',
          kyc_type: age_group,
          dob: dob,
          pan_number: pan_number,
          digilocker_verified: digilocker_verified,
          guardian_consent: guardian_consent || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action specified for PAN service");

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});