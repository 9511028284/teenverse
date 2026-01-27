import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { parentEmail, childName } = await req.json()
    
    // 1. Init Supabase Admin (Bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Generate Safe OTP (Server-Side)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Store in your 'parent_otps' table
    const { error: dbError } = await supabase
      .from('parent_otps')
      .insert({ email: parentEmail, otp_code: otp })

    if (dbError) {
        console.error("Database Error:", dbError);
        return new Response(JSON.stringify({ error: "Database Error: " + dbError.message }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
        })
    }

    // 4. Send Email via EmailJS (Backend Sending)
    // Log keys existence (for debugging, do not log actual values)
    console.log("Attempting to send email...");
    console.log("Service ID set:", !!Deno.env.get('EMAILJS_SERVICE_ID'));
    console.log("Template ID set:", !!Deno.env.get('EMAILJS_TEMPLATE_ID'));

    const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
        template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
        user_id: Deno.env.get('EMAILJS_PUBLIC_KEY'),
        accessToken: Deno.env.get('EMAILJS_PRIVATE_KEY'),
        template_params: {
          email: parentEmail,
          child_name: childName,
          otp: otp,
          message: "Verify your child's Teenverse account."
        }
      })
    })

    if (!emailRes.ok) {
       // --- CRITICAL FIX: READ THE REAL ERROR ---
       const errorText = await emailRes.text();
       console.error("EmailJS Failed:", errorText);
       
       return new Response(JSON.stringify({ error: "EmailJS Error: " + errorText }), { 
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
           status: 500 
       })
    }

    return new Response(JSON.stringify({ message: "OTP Sent Successfully" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected Error: " + err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})