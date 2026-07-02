import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  corsHeaders,
  getAuthenticatedUser,
  getSupabaseAdmin,
  json,
  safeAuthError,
} from "../_shared/auth-security.ts";

const TARGET_ROLES = new Set(["client", "freelancer"]);

function cleanText(value: unknown, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const clean = cleanText(value);
    if (clean) return clean;
  }

  return "";
}

function getDisplayName(user: Record<string, unknown>, profile: Record<string, unknown> | null, client: Record<string, unknown> | null, freelancer: Record<string, unknown> | null) {
  return firstValue(
    client?.name,
    freelancer?.name,
    profile?.full_name,
    (user.user_metadata as Record<string, unknown> | undefined)?.full_name,
    (user.user_metadata as Record<string, unknown> | undefined)?.name,
    cleanText(user.email).split("@")[0],
    "TeenVerse user",
  );
}

async function safeMaybeSingle(query: PromiseLike<{ data: unknown; error: unknown }>) {
  const { data, error } = await query;
  if (error) {
    console.warn("switch-dashboard-role optional lookup failed:", error);
    return null;
  }

  return data as Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const targetRole = cleanText(body.target_role || body.targetRole, 32).toLowerCase();

    if (!TARGET_ROLES.has(targetRole)) {
      throw new Error("Choose client or freelancer.");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const [profile, usersRow, client, freelancer, wallet] = await Promise.all([
      safeMaybeSingle(supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle()),
      safeMaybeSingle(supabaseAdmin.from("users").select("*").eq("id", user.id).maybeSingle()),
      safeMaybeSingle(supabaseAdmin.from("clients").select("*").eq("id", user.id).maybeSingle()),
      safeMaybeSingle(supabaseAdmin.from("freelancers").select("*").eq("id", user.id).maybeSingle()),
      safeMaybeSingle(supabaseAdmin.from("wallet_accounts").select("wallet_balance").eq("user_id", user.id).maybeSingle()),
    ]);

    const email = firstValue(profile?.email, usersRow?.email, client?.email, freelancer?.email, user.email);
    const name = getDisplayName(user as unknown as Record<string, unknown>, profile, client, freelancer);
    const phone = firstValue(client?.phone, freelancer?.phone);
    const nationality = firstValue(freelancer?.nationality, client?.nationality, "India");
    const source = firstValue(freelancer?.source, client?.source, "dashboard-role-switch");

    const persistActiveRole = async () => {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ role: targetRole === "client" ? "business" : "student" })
        .eq("id", user.id);

      if (error) throw error;
    };

    if (!email) throw new Error("Email is required before switching dashboards.");
    if (!name) throw new Error("Name is required before switching dashboards.");

    if (targetRole === "client") {
      const payload = {
        id: user.id,
        email,
        name,
        phone: phone || null,
        phone_verified: Boolean(client?.phone_verified || freelancer?.phone_verified),
        nationality,
        source,
        bio: firstValue(client?.bio, freelancer?.bio, freelancer?.tag_line) || null,
        is_organisation: firstValue(client?.is_organisation, "individual"),
        status: firstValue(client?.status, "active"),
        wallet_balance: Number(wallet?.wallet_balance ?? client?.wallet_balance ?? freelancer?.wallet_balance ?? 0),
      };

      const { data, error } = await supabaseAdmin
        .from("clients")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();

      if (error) throw error;
      await persistActiveRole();

      return json({
        success: true,
        active_role: "client",
        client: data,
        freelancer,
      });
    }

    const payload = {
      id: user.id,
      email,
      name,
      phone: phone || null,
      phone_verified: Boolean(freelancer?.phone_verified || client?.phone_verified),
      nationality,
      source,
      bio: firstValue(freelancer?.bio, client?.bio, client?.requirements) || null,
      specialty: firstValue(freelancer?.specialty, "Getting started"),
      tag_line: firstValue(freelancer?.tag_line, "Open to freelance projects"),
      status: firstValue(freelancer?.status, "active"),
      current_plan: firstValue(freelancer?.current_plan, "Basic"),
      bids_remaining: Number(freelancer?.bids_remaining ?? 5),
      resumes_remaining: Number(freelancer?.resumes_remaining ?? 1),
      energy_points: Number(freelancer?.energy_points ?? 0),
      wallet_balance: Number(wallet?.wallet_balance ?? freelancer?.wallet_balance ?? client?.wallet_balance ?? 0),
    };

    const { data, error } = await supabaseAdmin
      .from("freelancers")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    await persistActiveRole();

    return json({
      success: true,
      active_role: "freelancer",
      client,
      freelancer: data,
    });
  } catch (error) {
    console.error("switch-dashboard-role:", error);
    return json({ success: false, error: safeAuthError(error, "Could not switch dashboard right now.") }, 400);
  }
});
