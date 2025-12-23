// [File: supabase/functions/payment-gateway/index.ts]
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ENV VARS: Set these in your Supabase Dashboard -> Edge Functions -> Secrets
const CASHFREE_CLIENT_ID = Deno.env.get('CASHFREE_APP_ID')!;
const CASHFREE_CLIENT_SECRET = Deno.env.get('CASHFREE_SECRET_KEY')!;
const BASE_URL = "https://sandbox.cashfree.com/pg"; // Use 'https://api.cashfree.com/pg' for PROD

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, amount, orderId, customerId, customerPhone } = await req.json();

    // 1. CREATE ORDER
    if (action === 'CREATE_ORDER') {
      const resp = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'x-api-version': '2022-09-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: "INR",
          customer_details: {
            customer_id: customerId,
            customer_phone: customerPhone
          }
        })
      });

      const data = await resp.json();
      return new Response(JSON.stringify(data), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. VERIFY ORDER
    if (action === 'VERIFY_PAYMENT') {
      const resp = await fetch(`${BASE_URL}/orders/${orderId}`, {
        headers: {
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'x-api-version': '2022-09-01'
        }
      });
      
      const data = await resp.json();
      const status = data.order_status === 'PAID' ? 'SUCCESS' : 'PENDING';
      
      return new Response(JSON.stringify({ status, raw: data }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { 
      status: 400, headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: corsHeaders 
    });
  }
});