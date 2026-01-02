import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const body = await req.json() // Data from Cashfree
  const { type, data } = body

  // 1. Handle Successful Payment
  if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = data.order.order_id
      
      // A. Immutable Audit Log (The "Black Box")
      await supabase.from('payment_logs').insert({
          order_id: orderId,
          amount: data.payment.payment_amount,
          status: 'SUCCESS',
          raw_data: body
      })

      // B. Update Application State
      // Assumes orderId format is "ORD_{APP_ID}_{TIMESTAMP}"
      const appId = orderId.split('_')[1] 

      await supabase
        .from('applications')
        .update({ 
            status: 'Accepted', 
            payment_verified: true,
            is_escrow_held: true,
            started_at: new Date().toISOString()
        })
        .eq('id', appId)
        
      return new Response(JSON.stringify({ status: 'OK' }), { status: 200 })
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})