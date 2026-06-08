import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_DURATIONS: Record<string, number> = {
  Starter: 24,
  Pro: 1,
  Elite: 1,
};

const PLAN_NAME_ALIASES: Record<string, string> = {
  base: "Basic",
  basic: "Basic",
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

const normalizePlanName = (planName?: string | null) => {
  const key = (planName || "Basic").trim().toLowerCase();
  return PLAN_NAME_ALIASES[key] ?? "Basic";
};

const getDurationMonths = (planName: string, isAnnual: boolean) => {
  if (planName === "Starter") return PLAN_DURATIONS.Starter;
  return isAnnual ? 12 : (PLAN_DURATIONS[planName] ?? 1);
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

  const cfData = await cfResponse.json();
  if (!cfResponse.ok) {
    throw new Error(cfData?.message || "Payment verification request failed.");
  }
  if (cfData.order_status !== "PAID") {
    throw new Error(`Payment verification failed. Status: ${cfData.order_status}`);
  }
  if (Number(cfData.order_amount) < expectedAmount) {
    throw new Error("Payment amount mismatch. Possible fraud attempt.");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized Access");

    const payload = await req.json();
    const {
      planName,
      amount = 0,
      walletDeduction = 0,
      isAnnual = false,
      useWallet = false,
      orderId: payloadOrderId,
      order_id: payloadOrderIdSnake,
      cashfreeOrderId,
      cashfree_order_id: cashfreeOrderIdSnake,
    } = payload;
    const orderId = payloadOrderId || payloadOrderIdSnake || cashfreeOrderId || cashfreeOrderIdSnake || null;
    const selectedPlanName = normalizePlanName(planName);

    if (!["Starter", "Pro", "Elite"].includes(selectedPlanName)) {
      throw new Error("Invalid plan selected.");
    }

    const finalPayable = Number(amount) || 0;
    const walletAmount = useWallet ? Number(walletDeduction || amount || 0) : 0;
    if (finalPayable < 0 || walletAmount < 0) {
      throw new Error("Invalid payment amount.");
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("freelancers")
      .select("current_plan, plan_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      throw new Error("Freelancer profile not found.");
    }

    const currentPlan = normalizePlanName(existingProfile.current_plan);
    const hasPremiumPlan = currentPlan !== "Basic";
    const isNotExpired = existingProfile.plan_expires_at &&
      new Date(existingProfile.plan_expires_at) > new Date();

    if (hasPremiumPlan && isNotExpired) {
      const expiryDate = new Date(existingProfile.plan_expires_at).toLocaleDateString();
      throw new Error(
        `You already have an active ${currentPlan} subscription. You cannot switch plans until it expires on ${expiryDate}.`,
      );
    }

    if (finalPayable > 0) {
      if (!orderId) throw new Error("Missing Cashfree Order ID for gateway payment.");
      await verifyCashfreeOrder(orderId, finalPayable);
    }

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("grant_subscription_access", {
      p_user_id: user.id,
      p_plan_name: selectedPlanName,
      p_duration_months: getDurationMonths(selectedPlanName, isAnnual),
      p_paid_amount: finalPayable,
      p_wallet_amount: walletAmount,
      p_order_id: orderId ?? null,
    });

    if (rpcError) throw rpcError;
    if (!rpcData?.success) throw new Error(rpcData?.error || "Subscription upgrade failed.");

    const { data: profile } = await supabaseAdmin
      .from("freelancers")
      .select("current_plan, plan_expires_at, bids_remaining, resumes_remaining, wallet_balance")
      .eq("id", user.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully upgraded to ${selectedPlanName}!`,
        profile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Subscription Error:", error instanceof Error ? error.message : error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Subscription failed.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
