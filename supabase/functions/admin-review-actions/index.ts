import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  clientIp,
  corsHeaders,
  getAuthenticatedUser,
  getSupabaseAdmin,
  json,
} from "../_shared/auth-security.ts";

const BUSINESS_ACTIONS = new Set(["verify", "reject", "suspend"]);
const OPPORTUNITY_ACTIONS = new Set(["approve", "reject", "pause", "close"]);

const clean = (value: unknown, maxLength = 1000) => String(value || "").trim().slice(0, maxLength);

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

async function writeAudit(
  admin: ReturnType<typeof getSupabaseAdmin>,
  req: Request,
  adminId: string,
  actionType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await admin.from("admin_audit_logs").insert({
    admin_id: adminId,
    action_type: actionType,
    target_id: targetId,
    ip_address: clientIp(req),
    metadata,
  });
  if (!error) return;

  const { error: fallbackError } = await admin.from("audit_logs").insert({
    action: actionType,
    actor_id: adminId,
    details: { target_id: targetId, ...metadata },
  });
  if (fallbackError) throw new Error("The review changed state but its audit entry could not be written.");
}

async function reviewBusiness(req: Request, adminId: string, resourceId: string, action: string, reason: string) {
  if (!BUSINESS_ACTIONS.has(action)) throw new Error("Invalid business review action.");
  if ((action === "reject" || action === "suspend") && !reason) throw new Error("A reason is required.");

  const admin = await assertAdmin(adminId);
  const { data: existing, error: existingError } = await admin
    .from("business_profiles")
    .select("*")
    .eq("user_id", resourceId)
    .single();
  if (existingError) throw existingError;

  const patch = action === "verify"
    ? { verification_status: "verified", can_post: true, rejection_reason: null, verified_at: new Date().toISOString() }
    : action === "reject"
      ? { verification_status: "rejected", can_post: false, rejection_reason: reason, verified_at: null }
      : { verification_status: "suspended", can_post: false, rejection_reason: reason, verified_at: null };

  const { data: business, error } = await admin
    .from("business_profiles")
    .update(patch)
    .eq("user_id", resourceId)
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit(admin, req, adminId, `BUSINESS_${action.toUpperCase()}`, resourceId, {
    old_status: existing.verification_status,
    new_status: business.verification_status,
    reason: reason || null,
  });

  // TODO: insert a business notification after the existing notifications schema is standardized.
  return business;
}

async function reviewOpportunity(req: Request, adminId: string, resourceId: string, action: string, reason: string) {
  if (!OPPORTUNITY_ACTIONS.has(action)) throw new Error("Invalid opportunity review action.");
  if (action === "reject" && !reason) throw new Error("A rejection reason is required.");

  const admin = await assertAdmin(adminId);
  const { data: existing, error: existingError } = await admin
    .from("opportunities")
    .select("*")
    .eq("id", resourceId)
    .single();
  if (existingError) throw existingError;

  if ((action === "approve" || action === "reject") && existing.status !== "pending_review") {
    throw new Error("Only pending review opportunities can be approved or rejected.");
  }
  if ((action === "pause" || action === "close") && existing.status !== "active") {
    throw new Error("Only active opportunities can be paused or closed.");
  }

  if (action === "approve") {
    const { data: business, error: businessError } = await admin
      .from("business_profiles")
      .select("verification_status,can_post")
      .eq("user_id", existing.business_id)
      .single();
    if (businessError) throw businessError;
    if (business.verification_status !== "verified" || business.can_post !== true) {
      throw new Error("Verify this business and enable posting before approving its opportunity.");
    }
  }

  const patch = action === "approve"
    ? { status: "active", rejection_reason: null, published_at: new Date().toISOString() }
    : action === "reject"
      ? { status: "rejected", rejection_reason: reason }
      : action === "pause"
        ? { status: "paused" }
        : { status: "closed" };

  const { data: opportunity, error } = await admin
    .from("opportunities")
    .update(patch)
    .eq("id", resourceId)
    .select("*")
    .single();
  if (error) throw error;

  await writeAudit(admin, req, adminId, `OPPORTUNITY_${action.toUpperCase()}`, resourceId, {
    business_id: existing.business_id,
    old_status: existing.status,
    new_status: opportunity.status,
    reason: reason || null,
  });

  // TODO: insert a business notification after the existing notifications schema is standardized.
  return opportunity;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const resource = clean(body.resource, 32).toLowerCase();
    const resourceId = clean(body.resourceId || body.resource_id, 120);
    const action = clean(body.action, 32).toLowerCase();
    const reason = clean(body.reason, 1000);
    if (!resourceId) throw new Error("Missing resource id.");

    if (resource === "business") {
      const business = await reviewBusiness(req, user.id, resourceId, action, reason);
      return json({ success: true, business });
    }
    if (resource === "opportunity") {
      const opportunity = await reviewOpportunity(req, user.id, resourceId, action, reason);
      return json({ success: true, opportunity });
    }
    throw new Error("Invalid review resource.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin review action failed.";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 400;
    return json({ success: false, error: message }, status);
  }
});
