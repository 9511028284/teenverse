import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

class RequestValidationError extends Error {}

const parseAppId = (value: unknown) => {
  const appId = String(value ?? "").trim();
  if (!/^\d+$/.test(appId)) {
    throw new RequestValidationError("Valid application id is required.");
  }
  return appId;
};

const parseAmount = (value: unknown, fieldName: string) => {
  const amountText = String(value ?? "0").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    throw new RequestValidationError(`${fieldName} must be a valid amount.`);
  }

  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RequestValidationError(`${fieldName} must be zero or greater.`);
  }

  return amount;
};

const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const verifyCashfreeOrder = async (orderId: string, expectedAmount: number) => {
  const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID");
  const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY");
  const cashfreeEnv = Deno.env.get("CASHFREE_ENV") || "PRODUCTION";

  if (!cashfreeAppId || !cashfreeSecretKey) {
    throw new Error("Payment gateway is not configured.");
  }

  const cfUrl = cashfreeEnv === "SANDBOX"
    ? `https://sandbox.cashfree.com/pg/orders/${orderId}`
    : `https://api.cashfree.com/pg/orders/${orderId}`;

  const cfResponse = await fetch(cfUrl, {
    method: "GET",
    headers: {
      "x-client-id": cashfreeAppId,
      "x-client-secret": cashfreeSecretKey,
      "x-api-version": "2022-09-01",
    },
  });

  const cfData = await cfResponse.json().catch(() => ({}));
  if (!cfResponse.ok) {
    throw new Error(cfData?.message || "Payment verification request failed.");
  }

  if (cfData.order_status !== "PAID") {
    throw new Error(`Payment verification failed. Status: ${cfData.order_status || "UNKNOWN"}`);
  }

  if (Number(cfData.order_amount) + 0.01 < expectedAmount) {
    throw new Error("Payment amount mismatch. Possible fraud attempt.");
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new RequestValidationError("Missing authorization header.");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      throw new RequestValidationError("Unauthorized.");
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new RequestValidationError("Invalid JSON body.");
    }

    const payload = body as Record<string, unknown>;
    const appId = Number(parseAppId(payload.appId));
    const walletDeduction = parseAmount(payload.walletDeduction, "walletDeduction");
    const gatewayAmount = parseAmount(payload.gatewayAmount, "gatewayAmount");
    const orderId = typeof payload.orderId === "string" && payload.orderId.trim()
      ? payload.orderId.trim()
      : null;

    if (walletDeduction === 0 && gatewayAmount === 0) {
      throw new RequestValidationError("Payment amount is required.");
    }

    if (gatewayAmount > 0) {
      if (!orderId) throw new RequestValidationError("Missing payment gateway order id.");
      await verifyCashfreeOrder(orderId, gatewayAmount);
    }

    const { data, error } = await supabaseAdmin.rpc("fund_application_escrow", {
      p_app_id: appId,
      p_client_id: user.id,
      p_wallet_amount: walletDeduction,
      p_gateway_amount: gatewayAmount,
      p_order_id: orderId,
    });

    if (error) throw error;

    if (!data?.success) {
      return json({
        success: false,
        error: data?.error || "Wallet escrow funding failed.",
      }, 400);
    }

    return json({
      success: true,
      escrowOrderId: data.escrowOrderId,
      walletTransactionId: data.walletTransactionId,
      walletBalance: data.walletBalance,
      orderId: data.orderId,
      alreadyFunded: data.alreadyFunded || false,
    });
  } catch (error) {
    console.error("[fund-escrow-with-wallet]", error);

    if (error instanceof RequestValidationError) {
      return json({ success: false, error: error.message }, 400);
    }

    return json({
      success: false,
      error: error instanceof Error ? error.message : "Wallet escrow funding failed.",
    }, 500);
  }
});
