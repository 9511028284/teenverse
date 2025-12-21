import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { parentEmail, otp } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Fetch latest OTP for this email that hasn't expired
  const { data, error } = await supabase
    .from('parent_otps')
    .select('*')
    .eq('email', parentEmail)
    .eq('otp_code', otp)
    .gt('expires_at', new Date().toISOString()) // Check expiry
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ success: false, error: "Invalid or Expired OTP" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
    })
  }

  // 2. Consume OTP (Delete it so it can't be reused)
  await supabase.from('parent_otps').delete().eq('id', data.id)

  return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  })
})