import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  cleanError,
  cleanRpcResponse,
  corsHeaders,
  getConversionRate,
  getSupabaseAdmin,
  methodNotAllowed,
  parseRequiredString,
  parseUuid,
  readJsonBody,
  unauthorized,
  validateHubbleSecret,
} from "../_shared/hubble-wallet.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return methodNotAllowed();
  }

  if (!validateHubbleSecret(req)) {
    return unauthorized();
  }

  try {
    const body = await readJsonBody(req);
    const userId = parseUuid(body.userId);
    const referenceId = parseRequiredString(body.referenceId, "referenceId");
    const note = typeof body.note === "string" ? body.note.trim() : null;
    const supabase = getSupabaseAdmin();

    console.log("[Hubble wallet] reverse request", {
      userId,
      referenceId,
    });

    const { data, error } = await supabase.rpc("hubble_wallet_reverse", {
      p_user_id: userId,
      p_reference_id: referenceId,
      p_conversion_rate: getConversionRate(),
      p_note: note,
    });

    if (error) throw error;

    return cleanRpcResponse(data, 404);
  } catch (error) {
    return cleanError(error, "Unable to reverse wallet debit");
  }
});
