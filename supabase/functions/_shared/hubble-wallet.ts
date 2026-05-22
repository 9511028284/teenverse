import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hubble-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export type JsonBody = Record<string, unknown>;

export function json(body: JsonBody, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function methodNotAllowed() {
  return json(
    {
      status: "FAILED",
      message: "Method not allowed",
    },
    405,
  );
}

export function validateHubbleSecret(req: Request) {
  const expectedSecret = Deno.env.get("HUBBLE_SECRET");
  const receivedSecret = req.headers.get("X-Hubble-Secret");

  return Boolean(expectedSecret && receivedSecret && receivedSecret === expectedSecret);
}

export function unauthorized() {
  return json(
    {
      status: "FAILED",
      message: "Unauthorized",
    },
    401,
  );
}

export function getConversionRate() {
  const rawRate = Deno.env.get("HUBBLE_WALLET_CONVERSION_RATE") || "1";
  const rate = Number(rawRate);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid HUBBLE_WALLET_CONVERSION_RATE");
  }

  return rawRate;
}

export function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function parseUuid(value: unknown, fieldName = "userId") {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${fieldName} is required`);
  }

  const trimmed = value.trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(trimmed)) {
    throw new RequestValidationError(`${fieldName} must be a valid user id`);
  }

  return trimmed;
}

export function parsePositiveAmount(value: unknown, fieldName = "coins") {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new RequestValidationError(`${fieldName} is required`);
  }

  const amountText = String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    throw new RequestValidationError(`${fieldName} must be a positive amount`);
  }

  const amount = Number(amountText);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RequestValidationError(`${fieldName} must be greater than zero`);
  }

  return amountText;
}

export function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new RequestValidationError(`${fieldName} is required`);
  }

  return value.trim();
}

export async function readJsonBody(req: Request) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid JSON body");
    }

    return body as JsonBody;
  } catch (_error) {
    throw new RequestValidationError("Invalid JSON body");
  }
}

export function cleanRpcResponse(data: JsonBody | null, fallbackStatus = 400) {
  if (!data) {
    return json(
      {
        status: "FAILED",
        message: "Wallet operation failed",
      },
      fallbackStatus,
    );
  }

  const { httpStatus: rawHttpStatus, ...body } = data;
  const httpStatus =
    typeof rawHttpStatus === "number" && Number.isInteger(rawHttpStatus)
      ? rawHttpStatus
      : fallbackStatus;

  return json(body, data.status === "SUCCESS" ? 200 : httpStatus);
}

export function cleanError(error: unknown, fallbackMessage: string) {
  console.error("[Hubble wallet]", error);

  if (error instanceof RequestValidationError) {
    return json(
      {
        status: "FAILED",
        message: error.message,
      },
      400,
    );
  }

  return json(
    {
      status: "FAILED",
      message: fallbackMessage,
    },
    500,
  );
}

export class RequestValidationError extends Error {}
