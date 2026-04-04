// supabase/functions/process-subscription/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Admin Client to bypass RLS for DB updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Verify the user is authenticated (Security check)
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized Access')
    }

    // 3. Parse the incoming request payload
    const { planId, planName, amount, isAnnual, useWallet, orderId } = await req.json()

    // 4. Calculate Duration based on your UI rules
    // Starter is "2 years", others are 1 year or 1 month
    let durationMonths = 1;
    if (planName === 'Starter') {
        durationMonths = 24; // 2 years
    } else if (isAnnual) {
        durationMonths = 12; // 1 year
    }

    // 5. If they didn't use the wallet, verify the Cashfree Gateway payment
    if (!useWallet) {
        if (!orderId) throw new Error('Missing Cashfree Order ID for gateway payment.');

        const cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
        const cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
        const cashfreeEnv = Deno.env.get('CASHFREE_ENV') || 'PRODUCTION'; // 'SANDBOX' or 'PRODUCTION'
        
        const cfUrl = cashfreeEnv === 'SANDBOX' 
            ? `https://sandbox.cashfree.com/pg/orders/${orderId}`
            : `https://api.cashfree.com/pg/orders/${orderId}`;

        const cfResponse = await fetch(cfUrl, {
            method: 'GET',
            headers: {
                'x-client-id': cashfreeAppId!,
                'x-client-secret': cashfreeSecretKey!,
                'x-api-version': '2022-09-01'
            }
        });

        const cfData = await cfResponse.json();

        // Ensure the payment was actually successful and amounts match
        if (cfData.order_status !== 'PAID') {
            throw new Error(`Payment verification failed. Status: ${cfData.order_status}`);
        }
        if (cfData.order_amount < amount) {
            throw new Error('Payment amount mismatch. Possible fraud attempt.');
        }
    }

    // 6. Execute the Secure RPC to grant access and deduct wallet (if applicable)
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('grant_subscription_access', {
        p_user_id: user.id,
        p_plan_name: planName,       // e.g., 'Starter', 'Pro', 'Elite'
        p_duration_months: durationMonths,
        p_amount: amount,            // e.g., 99, 299
        p_use_wallet: useWallet      // true or false
    });

    if (rpcError) throw rpcError;
    if (!rpcData.success) throw new Error(rpcData.error);

    // 7. Success! Return to frontend
    return new Response(
      JSON.stringify({ success: true, message: `Successfully upgraded to ${planName}!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("Subscription Error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})