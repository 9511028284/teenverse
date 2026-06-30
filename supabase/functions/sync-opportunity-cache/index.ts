import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  corsHeaders,
  getAuthenticatedUser,
  getSupabaseAdmin,
  json,
} from "../_shared/auth-security.ts";

const clean = (value: unknown, maxLength = 2000) => String(value || "").trim().slice(0, maxLength);

async function assertAdmin(userId: string) {
  const admin = getSupabaseAdmin();
  const [{ data: profile }, { data: legacyAdmin }] = await Promise.all([
    admin.from("profiles").select("id,role,status").eq("id", userId).maybeSingle(),
    admin.from("admins").select("id").eq("id", userId).maybeSingle(),
  ]);
  if (profile?.role !== "admin" && !legacyAdmin) throw new Error("Forbidden");
  if (profile?.status && profile.status !== "active") throw new Error("Forbidden");
  return admin;
}

const normalizePublishTo = (value: unknown) => {
  const values = Array.isArray(value) ? value : [];
  return ["intern", "app"].filter((target) => values.includes(target));
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const user = await getAuthenticatedUser(req);
    const admin = await assertAdmin(user.id);
    const body = await req.json().catch(() => ({}));
    const opportunityId = clean(body.opportunityId || body.opportunity_id, 120);
    const requestedAction = clean(body.action, 32).toLowerCase();
    if (!opportunityId) throw new Error("Missing opportunity id.");
    if (!["upsert", "delete"].includes(requestedAction)) throw new Error("Invalid cache action.");

    const workerUrl = clean(Deno.env.get("AUX_WORKER_URL"), 500).replace(/\/$/, "");
    const workerSecret = Deno.env.get("AUX_WORKER_INTERNAL_SECRET") || "";
    if (!workerUrl || !workerSecret) throw new Error("Cloudflare cache sync secrets are not configured.");

    const { data: opportunity, error } = await admin
      .from("opportunities")
      .select("*")
      .eq("id", opportunityId)
      .single();
    if (error) throw error;

    const { data: business } = await admin
      .from("business_profiles")
      .select("business_name,business_type,verification_status")
      .eq("user_id", opportunity.business_id)
      .maybeSingle();

    const action = requestedAction === "upsert" && opportunity.status === "active" ? "upsert" : "delete";
    const path = action === "upsert" ? "/v1/opportunities/cache-upsert" : "/v1/opportunities/cache-delete";
    const publishTo = normalizePublishTo(opportunity.publish_to);
    const payload = action === "delete" ? { opportunity_id: opportunityId } : {
      opportunity_id: opportunity.id,
      business_id: opportunity.business_id,
      title: opportunity.title,
      description: opportunity.description,
      type: opportunity.type,
      publish_to: publishTo,
      skills_required: opportunity.skills_required || [],
      work_mode: opportunity.work_mode,
      location: opportunity.location,
      stipend_min: opportunity.stipend_min,
      stipend_max: opportunity.stipend_max,
      currency: opportunity.currency,
      is_paid: opportunity.is_paid,
      duration: opportunity.duration,
      application_deadline: opportunity.application_deadline,
      status: opportunity.status,
      business_name: business?.business_name || "TeenVerseHub business",
      business_type: business?.business_type || null,
      verification_status: business?.verification_status || null,
      published_at: opportunity.published_at,
      search_text: clean([opportunity.title, opportunity.description, opportunity.type, opportunity.location, ...(opportunity.skills_required || [])].join(" ")),
      payload: {
        id: opportunity.id,
        business_id: opportunity.business_id,
        title: opportunity.title,
        description: opportunity.description,
        type: opportunity.type,
        publish_to: publishTo,
        skills_required: opportunity.skills_required || [],
        work_mode: opportunity.work_mode,
        location: opportunity.location,
        stipend_min: opportunity.stipend_min,
        stipend_max: opportunity.stipend_max,
        currency: opportunity.currency,
        is_paid: opportunity.is_paid,
        duration: opportunity.duration,
        application_deadline: opportunity.application_deadline,
        status: opportunity.status,
        business_name: business?.business_name || "TeenVerseHub business",
        business_type: business?.business_type || null,
        published_at: opportunity.published_at,
      },
    };

    const response = await fetch(`${workerUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": workerSecret },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Cloudflare cache sync failed with ${response.status}: ${clean(await response.text(), 500)}`);

    const cache = await response.json().catch(() => ({}));
    const { error: auditError } = await admin.from("admin_audit_logs").insert({
      admin_id: user.id,
      action_type: `OPPORTUNITY_CACHE_${action.toUpperCase()}`,
      target_id: opportunityId,
      metadata: { requested_action: requestedAction, status: opportunity.status },
    });
    if (auditError) console.warn("Cache sync audit insert failed:", auditError.message);

    return json({ success: true, action, opportunityId, cache });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudflare cache sync failed.";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 400;
    return json({ success: false, error: message }, status);
  }
});
