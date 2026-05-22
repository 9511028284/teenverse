import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  cleanError,
  cleanRpcResponse,
  corsHeaders,
  getConversionRate,
  getSupabaseAdmin,
  json,
  methodNotAllowed,
  parseUuid,
  unauthorized,
  validateHubbleSecret,
} from "../_shared/hubble-wallet.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return methodNotAllowed();
  }

  if (!validateHubbleSecret(req)) {
    return unauthorized();
  }

  try {
    const url = new URL(req.url);
    const userId = parseUuid(url.searchParams.get("userId"));
    const supabase = getSupabaseAdmin();

    console.log("[Hubble wallet] balance request", { userId });

    const { data, error } = await supabase.rpc("hubble_wallet_get_balance", {
      p_user_id: userId,
      p_conversion_rate: getConversionRate(),
    });

    if (error) throw error;

    if (data?.status !== "SUCCESS") {
      return cleanRpcResponse(data, 400);
    }

    return json({
      userId: data.userId,
      totalCoins: data.totalCoins,
    });
  } catch (error) {
    return cleanError(error, "Unable to fetch wallet balance");
  }
});
