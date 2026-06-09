import { createClient } from "npm:@supabase/supabase-js@2";

export class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getDefaultSecretKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return "";

  try {
    return JSON.parse(secretKeys)?.default || "";
  } catch {
    return "";
  }
}

export function createSupabaseAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || getDefaultSecretKey();

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireAuthenticatedUser(request: Request, supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new HttpError("Unauthorized.", 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError("Unauthorized.", 401);
  }

  return data.user;
}

export function resolveUserId(authUserId: string, requestedUserId?: unknown) {
  const userId = String(requestedUserId || authUserId).trim();
  if (!userId) throw new HttpError("User ID is required.", 400);
  if (userId !== authUserId) throw new HttpError("You can only use AI features for your own account.", 403);
  return userId;
}

