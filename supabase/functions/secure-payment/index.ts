// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verify User (Auth Guard)
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) throw new Error("Unauthorized");

    const { appId } = await req.json();

    // 2. DB LOOKUP: Fetch the TRUE bid amount (Single Source of Truth)
    // We join 'applications' with 'jobs' to ensure the user is actually the client
    const { data: appData, error: dbError } = await supabase
      .from('applications')
      .select('id, bid_amount, freelancer_id, job:jobs(client_id, title)')
      .eq('id', appId)
      .single();

    if (dbError || !appData) throw new Error("Application not found");

    // 3. SECURITY CHECK: Ensure the caller is the Client who owns the job
    if (appData.job.client_id !== user.id) {
      throw new Error("Security Alert: You are not authorized to pay for this job.");
    }

    // 4. Call Cashfree (Backend to Backend)
    // We use the 'bid_amount' from DB, ignoring anything the frontend sent
    const payload = {
      order_amount: appData.bid_amount,
      order_currency: "INR",
      order_id: `ORDER_${appId}_${Date.now()}`,
      customer_details: {
        customer_id: user.id,
        customer_phone: "9999999999" // Use actual phone from DB if available
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/payment-result?order_id={order_id}`
      }
    };

    const cfResponse = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-client-id": Deno.env.get("CASHFREE_APP_ID")!,
        "x-client-secret": Deno.env.get("CASHFREE_SECRET_KEY")!,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) throw new Error(cfData.message || "Payment Gateway Error");

    // 5. Log the intent (Ops Trail)
    await supabase.from('payment_logs').insert({
      order_id: cfData.order_id,
      amount: appData.bid_amount,
      payer_id: user.id,
      status: 'initiated'
    });

    return new Response(JSON.stringify({ 
      payment_session_id: cfData.payment_session_id,
      order_id: cfData.order_id 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});