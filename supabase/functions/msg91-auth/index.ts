import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Standard CORS headers for Supabase Edge Functions
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
    const { action, phone, otp } = await req.json()
    
    // Retrieve secret environment variables
    const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY')
    const MSG91_TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID')

    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
      throw new Error('Server configuration error: Missing MSG91 credentials.')
    }
    if (!phone) {
      throw new Error('Phone number is required.')
    }

    // --- ROUTE 1: SEND OTP ---
    if (action === 'send') {
      // MSG91 v5 Send OTP Endpoint
      const url = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${phone}&authkey=${MSG91_AUTH_KEY}`
      
      const response = await fetch(url, {
        method: 'POST', // MSG91 uses POST for the v5 send endpoint
        headers: {
          'Content-Type': 'application/json', //
        },
        body: JSON.stringify({}), // Add dynamic variables here if your MSG91 template requires them
      })

      const data = await response.json()
      
      // MSG91 returns "type": "error" on failure
      if (data.type === 'error') {
         throw new Error(data.message || 'Failed to send OTP via MSG91.')
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } 
    // --- ROUTE 2: VERIFY OTP ---
    else if (action === 'verify') {
      if (!otp) throw new Error('OTP code is required for verification.')
      
      // MSG91 v5 Verify OTP Endpoint
      const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${phone}&authkey=${MSG91_AUTH_KEY}`
      
      const response = await fetch(url, {
        method: 'GET', // MSG91 uses GET for the verify endpoint
      })

      const data = await response.json()

      if (data.type === 'error' || data.message === 'Mobile no. not found') {
         throw new Error(data.message || 'Invalid or Expired OTP code.')
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
      
    } else {
      throw new Error('Invalid action requested.')
    }

  } catch (error) {
    // Catch-all error formatting
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})