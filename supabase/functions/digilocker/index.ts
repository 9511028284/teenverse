import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUREPASS_API_BASE_URL = (Deno.env.get("SUREPASS_API_BASE_URL") || "https://kyc-api.surepass.app").replace(/\/$/, "");
const SUREPASS_DIGILOCKER_URL = (Deno.env.get("SUREPASS_KYC_API_URL") || `${SUREPASS_API_BASE_URL}/api/v1/digilocker`).replace(/\/$/, "");
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

const readSurepassJson = async (response: Response, context: string) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const rawText = await response.text();
    console.error(`[${context}] Surepass returned non-JSON`, response.status, rawText.slice(0, 300));
    throw new Error(`Surepass API returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  if (!response.ok) {
    console.error(`[${context}] Surepass error`, data);
    throw new Error(data?.message || `Surepass API returned HTTP ${response.status}.`);
  }
  return data;
};

const normalizeDob = (dob: string) => {
  if (!dob) throw new Error("DOB missing from DigiLocker response.");
  if (dob.includes("/") && dob.split("/")[0].length === 2) return dob.split("/").reverse().join("-");
  if (dob.includes("-") && dob.split("-")[0].length === 2) return dob.split("-").reverse().join("-");
  return dob;
};

const calculateAge = (dob: string) => {
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) throw new Error("Invalid DOB returned by DigiLocker.");

  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;
  return age;
};

const assertAllowedAge = (age: number) => {
  if (age < 14 || age > 25) {
    throw new Error("Platform verification is limited to ages 14 to 25.");
  }
};

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

    if (action === "CREATE_SESSION") {
      assertOwnProfile(requestUserId, payload.user_id);

      const response = await fetch(`${SUREPASS_DIGILOCKER_URL}/initialize`, {
        method: "POST",
        headers: surepassHeaders,
        body: JSON.stringify({
          data: {
            signup_flow: true,
            skip_main_screen: true,
          },
        }),
      });

      const data = await readSurepassJson(response, "CREATE_SESSION");
      if (!data?.data?.token || !data?.data?.client_id) {
        throw new Error(data?.message || "Surepass did not return a DigiLocker SDK token.");
      }

      return jsonResponse({
        success: true,
        token: data.data.token,
        verification_id: data.data.client_id,
      });
    }

    if (action === "GET_DOCUMENT") {
      const { verification_id, user_id } = payload;
      assertOwnProfile(requestUserId, user_id);
      if (!verification_id) throw new Error("Missing verification_id.");

      const response = await fetch(`${SUREPASS_DIGILOCKER_URL}/download-aadhaar/${verification_id}`, {
        method: "GET",
        headers: surepassHeaders,
      });

      const resData = await readSurepassJson(response, "GET_DOCUMENT");
      const aadhaarData = resData?.data?.aadhaar_xml_data || resData?.data?.digilocker_metadata;
      if (!aadhaarData?.dob) throw new Error("DOB not found in Surepass Aadhaar data.");

      const safeDob = normalizeDob(aadhaarData.dob);
      const calculatedAge = calculateAge(safeDob);
      assertAllowedAge(calculatedAge);

      const { error: dbError } = await supabaseAdmin
        .from("freelancers")
        .update({
          dob: safeDob,
          age: calculatedAge,
          kyc_status: "age_verified",
          kyc_timestamp: new Date().toISOString(),
        })
        .eq("id", requestUserId);

      if (dbError) {
        console.error("Supabase update error:", dbError);
        throw new Error("Failed to save DigiLocker KYC status.");
      }

      return jsonResponse({
        success: true,
        dob: safeDob,
        name: aadhaarData.full_name || aadhaarData.name,
        calculated_age: calculatedAge,
      });
    }

    throw new Error("Invalid action specified.");
  } catch (error) {
    console.error("DigiLocker function error:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 400);
  }
});
