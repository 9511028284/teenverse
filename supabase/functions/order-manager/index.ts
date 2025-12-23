import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS Preflight - Essential for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Debug: Check Environment Variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("MISSING ENV VARS: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is null.");
      throw new Error("Server Misconfiguration: Missing Environment Variables");
    }

    // 3. Initialize Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Parse Request
    const { action, appId, payload } = await req.json();
    console.log(`Received Request -> Action: ${action}, AppID: ${appId}`); // Debug Log

    if (!appId) throw new Error("Missing 'appId' in request body");

    // 5. Fetch current application to verify it exists
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      console.error("Fetch Error:", fetchError);
      throw new Error("Application not found or database error");
    }

    let updates = {}
    const now = new Date().toISOString();
    
    // 6. Logic based on action (State Machine)
    if (action === 'ACCEPT_APPLICATION') {
        // Ensure the 'started_at' column exists in your DB!
        updates = { status: 'Accepted', started_at: now }
    } 
    else if (action === 'SUBMIT_WORK') {
        updates = { 
            status: 'Submitted', 
            submitted_at: now,
            work_link: payload?.work_link || null,
            work_message: payload?.message || null
            // Note: If you have a 'work_files' column, add: work_files: payload?.files 
        }
    } 
    else if (action === 'APPROVE_WORK') {
        updates = { status: 'Completed', completed_at: now }
    } 
    else {
        throw new Error(`Invalid Action: ${action}`);
    }

    console.log(`Applying Updates for ${action}:`, updates); // Debug Log

    // 7. Update DB
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', appId);

    if (updateError) {
      console.error("Update Failed:", updateError);
      throw new Error(`Database Update Failed: ${updateError.message}`);
    }

    // 8. Success Response
    return new Response(JSON.stringify({ success: true, message: "Order Updated" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    // 9. CRITICAL: Log the actual error to Supabase Dashboard
    console.error("CRITICAL FUNCTION ERROR:", err);

    return new Response(JSON.stringify({ 
      error: err.message, 
      details: "Check Supabase Edge Function Logs for more info." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})