// Path: supabase/functions/log-parent-consent/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight (Browser security check)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    // We use the Service Role Key to bypass RLS for the insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Parse Data from Frontend
    const { user_id, parent_email, consent_version } = await req.json();

    // Validate inputs
    if (!user_id || !parent_email) {
      throw new Error("Missing required fields: user_id or parent_email");
    }

    // 3. CAPTURE IP & USER AGENT (Server-Side)
    // This provides legal proof that the request came from a specific device/location
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // 4. Insert into the Database
    const { error } = await supabaseAdmin.from('parent_consents').insert({
      user_id: user_id, // Sent as string (TEXT)
      parent_email: parent_email,
      consent_version: consent_version,
      ip_address: clientIp,
      user_agent: userAgent,
      verified: true
    });

    if (error) {
        console.error("Database Insert Error:", error);
        throw error;
    }

    // 5. Success Response
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});