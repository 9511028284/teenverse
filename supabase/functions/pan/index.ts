import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUREPASS_API_BASE_URL = (Deno.env.get("SUREPASS_API_BASE_URL") || "https://kyc-api.surepass.app").replace(/\/$/, "");
const SUREPASS_PAN_URL = Deno.env.get("SUREPASS_PAN_API_URL") || `${SUREPASS_API_BASE_URL}/api/v1/pan/pan-comprehensive`;
const SUREPASS_TOKEN = Deno.env.get("SUREPASS_TOKEN");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requireEnv = () => {
  if (!SUREPASS_TOKEN) throw new Error("Missing SUREPASS_TOKEN.");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase service configuration.");
};

const getAuthenticatedUserId = async (req: Request, supabaseAdmin: ReturnType<typeof createClient>) => {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) throw new Error("Missing authorization token.");

  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data.user?.id) throw new Error("Invalid authorization token.");
  return data.user.id;
};

const assertOwnProfile = (requestUserId: string, payloadUserId?: string) => {
  if (payloadUserId && payloadUserId !== requestUserId) {
    throw new Error("You can only update your own KYC profile.");
  }
};

const hashPan = async (pan: string) => {
  const data = new TextEncoder().encode(pan);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const verifyPanFormat = (pan: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    requireEnv();

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const requestUserId = await getAuthenticatedUserId(req, supabaseAdmin);
    const { action, ...payload } = await req.json();

    const surepassHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUREPASS_TOKEN}`,
    };

    if (action === "VERIFY_PAN") {
      const panNumber = String(payload.pan_number || "").trim().toUpperCase();
      if (!verifyPanFormat(panNumber)) throw new Error("Invalid PAN format.");

      const response = await fetch(SUREPASS_PAN_URL, {
        method: "POST",
        headers: surepassHeaders,
        body: JSON.stringify({ id_number: panNumber }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await response.text();
        console.error("Surepass PAN non-JSON response:", response.status, rawText.slice(0, 300));
        throw new Error(`Surepass PAN API returned HTTP ${response.status}.`);
      }

      const data = await response.json();
      if (!response.ok || data?.success !== true || !data?.data) {
        console.error("Surepass PAN error:", data);
        throw new Error(data?.message || "Invalid PAN card provided.");
      }

      return jsonResponse({
        success: true,
        registered_name: data.data.full_name || data.data.full_name_split?.join(" "),
      });
    }

    if (action === "SAVE_KYC_DATA") {
      const {
        user_id,
        age_group,
        pan_number,
        guardian_consent,
        guardian_name,
        consent_ip,
        consent_user_agent,
        consent_version,
        dob,
      } = payload;

      assertOwnProfile(requestUserId, user_id);

      const panNumber = String(pan_number || "").trim().toUpperCase();
      if (!verifyPanFormat(panNumber)) throw new Error("Invalid PAN format.");
      if (!["minor", "adult"].includes(age_group)) throw new Error("Invalid KYC age group.");
      if (age_group === "minor" && guardian_consent !== true) throw new Error("Guardian consent is required for minors.");

      const dbPayload: Record<string, unknown> = {
        kyc_status: "verified",
        is_kyc_verified: true,
        kyc_type: age_group,
        kyc_timestamp: new Date().toISOString(),
      };

      if (dob) dbPayload.dob = dob;

      if (age_group === "minor") {
        dbPayload.guardian_pan_hash = await hashPan(panNumber);
        dbPayload.guardian_pan_last4 = panNumber.slice(-4);
        dbPayload.parent_consent_verified = true;
        if (guardian_name) dbPayload.guardian_name = guardian_name;
        dbPayload.parent_consent_ip = consent_ip || null;
        dbPayload.parent_consent_user_agent = consent_user_agent || null;
        dbPayload.parent_consent_version = consent_version || null;
        dbPayload.parent_consent_timestamp = new Date().toISOString();
      } else {
        dbPayload.pan_hash = await hashPan(panNumber);
        dbPayload.pan_last4 = panNumber.slice(-4);
      }

      const { error } = await supabaseAdmin.from("freelancers").update(dbPayload).eq("id", requestUserId);
      if (error) {
        console.error("Supabase save error:", error);
        throw new Error(`Could not save KYC data: ${error.message}`);
      }

      return jsonResponse({ success: true });
    }

    throw new Error("Invalid action specified.");
  } catch (error) {
    console.error("PAN function error:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 400);
  }
});
