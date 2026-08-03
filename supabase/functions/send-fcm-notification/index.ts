import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "npm:jose@5";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_TTL_SECONDS = 55 * 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizePem(privateKeyPem: string) {
  return privateKeyPem.includes("\\n")
    ? privateKeyPem.replaceAll("\\n", "\n")
    : privateKeyPem;
}

async function getAccessToken() {
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");

  if (!clientEmail || !privateKey) {
    throw new Error("Firebase service account credentials are not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(normalizePem(privateKey), "RS256");

  const assertion = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(key);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenBody?.error_description || "Unable to authorize Firebase Cloud Messaging.");
  }

  return tokenBody.access_token as string;
}

function sanitizeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function getPublicUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || Deno.env.get("SITE_URL") || "https://teenversehub.in";
  return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, siteUrl).toString();
}

function getSafeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  if (typeof error === "string") return error;
  return "Unable to send push notification.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header.");

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) throw new Error("Unauthorized.");

    const body = await req.json();
    const title = String(body.title || "TeenVerse alert").slice(0, 80);
    const messageBody = String(body.body || body.message || "").slice(0, 240);
    const url = getPublicUrl(String(body.url || "/dashboard"));
    const audience = body.audience;
    const saveInApp = body.saveInApp !== false;
    let targetUserIds = sanitizeIds(body.targetUserIds);

    if (!messageBody) {
      return json({ error: "Notification body is required." }, 400);
    }

    if (audience === "freelancers") {
      const { data, error } = await supabaseAdmin
        .from("freelancers")
        .select("id");

      if (error) throw error;
      targetUserIds = (data || []).map((row) => row.id);
    } else if (audience === "clients") {
      const { data, error } = await supabaseAdmin
        .from("clients")
        .select("id");

      if (error) throw error;
      targetUserIds = (data || []).map((row) => row.id);
    } else if (audience === "all" || audience === "everyone") {
      const { data: flData } = await supabaseAdmin.from("freelancers").select("id");
      const { data: clData } = await supabaseAdmin.from("clients").select("id");
      targetUserIds = [
        ...(flData || []).map((r) => r.id),
        ...(clData || []).map((r) => r.id),
      ];
    }

    targetUserIds = [...new Set(targetUserIds)];
    if (targetUserIds.length === 0) {
      return json({ sent: 0, skipped: "no-target-users" });
    }

    // 🚀 ALWAYS SAVE IN-APP NOTIFICATIONS so realtime alerts & bell badge update instantly!
    if (saveInApp) {
      const notifRows = targetUserIds.slice(0, 500).map((userId) => ({
        user_id: userId,
        message: title ? `${title}: ${messageBody}` : messageBody,
      }));
      await supabaseAdmin.from("notifications").insert(notifRows).catch((e) => {
        console.warn("Failed saving in-app notification rows:", e);
      });
    }

    // Query active FCM device tokens for these users
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
      .from("push_tokens")
      .select("id, fcm_token")
      .in("user_id", targetUserIds)
      .is("revoked_at", null);

    if (tokenError) throw tokenError;
    if (!tokenRows?.length) {
      return json({ sent: 0, inAppSaved: targetUserIds.length, skipped: "no-registered-fcm-devices" });
    }

    const projectId = Deno.env.get("FIREBASE_PROJECT_ID") || "teenverse-app";
    const accessToken = await getAccessToken();
    const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const staleTokenIds: number[] = [];

    const results = await Promise.all(tokenRows.map(async (row) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: row.fcm_token,
            data: {
              title,
              url,
              body: messageBody,
              tag: `teenverse-${Date.now()}`,
            },
            webpush: {
              fcm_options: {
                link: url,
              },
              notification: {
                title,
                body: messageBody,
                icon: getPublicUrl("/teenverse.svg"),
                badge: getPublicUrl("/teenverse.svg"),
              },
            },
          },
        }),
      });

      if (response.ok) return { ok: true };

      const errorBody = await response.json().catch(() => ({}));
      const errorCode = errorBody?.error?.details?.[0]?.errorCode;
      if (["UNREGISTERED", "INVALID_ARGUMENT"].includes(errorCode)) {
        staleTokenIds.push(row.id);
      }

      return { ok: false, error: errorBody?.error?.message || "FCM send failed" };
    }));

    if (staleTokenIds.length > 0) {
      await supabaseAdmin
        .from("push_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .in("id", staleTokenIds);
    }

    const sent = results.filter((result) => result.ok).length;
    return json({ sent, inAppSaved: targetUserIds.length, failed: results.length - sent });
  } catch (error) {
    const message = getSafeError(error);

    console.error("FCM push send skipped:", message, error);
    return json({ sent: 0, skipped: true, reason: message });
  }
});
