import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { accessToken } = await req.json()
    
    // Your Authkey from the Server-Side Integration screenshot
    const MSG91_AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY') 

    if (!MSG91_AUTH_KEY) throw new Error('Missing MSG91_AUTH_KEY on server.')
    if (!accessToken) throw new Error('Access token is required.')

    // Call MSG91 to verify the token is legitimate
    const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "authkey": MSG91_AUTH_KEY,
        "access-token": accessToken
      })
    })

    const data = await response.json()

    // If MSG91 says the token is fake or expired
    if (data.type === 'error') {
       throw new Error(data.message || 'Token verification failed.')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})