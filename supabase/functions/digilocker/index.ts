import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CASHFREE_API_URL = Deno.env.get("CASHFREE_KYC_API_URL") || "https://sandbox.cashfree.com/verification";
const CASHFREE_CLIENT_ID = Deno.env.get("CASHFREE_KYC_CLIENT_ID");
const CASHFREE_CLIENT_SECRET = Deno.env.get("CASHFREE_KYC_CLIENT_SECRET");

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

    // ==========================================
    // ACTION: Generate DigiLocker Redirect URL
    // ==========================================
    if (action === "CREATE_SESSION") {
      const verification_id = `DL_${Date.now()}_${payload.user_id}`;
      
      const response = await fetch(`${CASHFREE_API_URL}/digilocker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": CASHFREE_CLIENT_ID!,
          "x-client-secret": CASHFREE_CLIENT_SECRET!,
        },
        body: JSON.stringify({
          verification_id,
          document_requested: ["AADHAAR"],
          redirect_url: payload.redirect_url, 
        }),
      });

      const data = await response.json();
      if (!data.url) throw new Error("Failed to generate DigiLocker URL");

      return new Response(JSON.stringify({ success: true, url: data.url, verification_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ==========================================
    // ACTION: Fetch Verified DOB from Cashfree
    // ==========================================
    if (action === "GET_DOCUMENT") {
      const { verification_id } = payload;
      
      const response = await fetch(`${CASHFREE_API_URL}/digilocker/document/AADHAAR?verification_id=${verification_id}`, {
        method: "GET",
        headers: {
          "x-client-id": CASHFREE_CLIENT_ID!,
          "x-client-secret": CASHFREE_CLIENT_SECRET!,
        }
      });

      const data = await response.json();
      
      if (data.status === "SUCCESS" && data.dob) {
        return new Response(JSON.stringify({ success: true, dob: data.dob, name: data.name }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        throw new Error("Document fetch failed or user denied consent.");
      }
    }

    throw new Error("Invalid action specified for DigiLocker service");

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});