import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) throw new Error('Unauthorized Access')

    // 1. SECURE GATEKEEPER: Check plan in DB
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('freelancers')
        .select('current_plan')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) throw new Error('Could not find user profile.')

    // 2. DENY ACCESS: If not Pro or Elite
    if (profile.current_plan !== 'Pro' && profile.current_plan !== 'Elite') {
        throw new Error('Access Denied. You must be a Pro or Elite member.')
    }

    // 3. SUCCESS: Return the permanent link you created in Step 1
    // 🚀 PASTE YOUR PERMANENT DISCORD LINK BELOW
    const inviteUrl = "https://discord.gg/cpZSjyQvRC";

    return new Response(
      JSON.stringify({ success: true, inviteUrl: inviteUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})