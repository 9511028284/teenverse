import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { parentEmail, childName } = await req.json()
    
    // 1. Generate a Secure 6-digit Code (Server-side)
    const otp = Math.floor(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000).toString();

    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Store in Private Database Table (Expires in 10 mins)
    const { error: dbError } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        email: parentEmail,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins
      }, { schema: 'private' }) // Explicitly use private schema

    if (dbError) throw new Error("Database error: " + dbError.message)

    // 4. Send Email via EmailJS REST API
    // Note: You must add EMAILJS_PRIVATE_KEY to your Supabase Secrets
    const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_yhvj30u', // [cite: 438]
        template_id: 'template_nr1rd2n', // [cite: 438]
        user_id: '_ZOft8l1SLf_-HFiV',    // Public Key [cite: 438]
        accessToken: Deno.env.get('EMAILJS_PRIVATE_KEY'), // Private Key needed for server-side
        template_params: {
          email: parentEmail,
          child_name: childName,
          otp: otp,
          message: "Please verify your child's Teenverse account."
        }
      })
    })

    if (!emailRes.ok) {
      const text = await emailRes.text()
      throw new Error(`EmailJS Error: ${text}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent securely" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})