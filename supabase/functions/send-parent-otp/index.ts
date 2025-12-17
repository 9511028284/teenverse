import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    // 1. Setup Supabase Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get Data from Frontend
    const { parentEmail, childName } = await req.json()
    if (!parentEmail) throw new Error("Parent email is required")

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 4. Save OTP to Database (So the RPC can verify it later)
    const { error: dbError } = await supabaseAdmin
      .from('parent_otps')
      .insert({
        email: parentEmail,
        otp_code: otp
      })

    if (dbError) {
      console.error("DB Error:", dbError)
      throw new Error("Failed to save OTP")
    }

    // 5. Send Email (Using Resend)
    // If you don't have a Resend key, this part will be skipped/logged.
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev', // Change this if you have a custom domain
          to: parentEmail,
          subject: 'TeenVerse Parental Verification Code',
          html: `
            <h2>Verify ${childName}'s Account</h2>
            <p>Your verification code is:</p>
            <h1>${otp}</h1>
            <p>This code expires in 10 minutes.</p>
          `
        })
      })
      
      if (!res.ok) {
        const errorData = await res.text()
        console.error("Resend API Error:", errorData)
        // We don't throw here, so you can still test via logs
      }
    } else {
        // --- MOCK MODE (For Testing) ---
        console.log(`[MOCK EMAIL] To: ${parentEmail} | OTP: ${otp}`)
    }

    // 6. Return Success
    return new Response(
      JSON.stringify({ success: true, message: "OTP sent" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
