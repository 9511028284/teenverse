import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Debug: Check Environment Variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server Misconfiguration: Missing Environment Variables");
    }

    // 3. Initialize Admin Client (Bypasses RLS for security checks)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Parse Request - NOW REQUIRES userId
    const { action, appId, userId, payload } = await req.json();
    console.log(`Received Secure Request -> Action: ${action}, AppID: ${appId}, UserID: ${userId}`);

    if (!appId || !userId) throw new Error("Missing 'appId' or 'userId' in request body");

    // 5. 🛡️ SECURITY: Fetch User Profile & Parent Mode Status
    // We check the DB for the TRUE parent mode status (ignoring frontend)
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users') // Verify this matches your table name (users/freelancers/clients)
      .select('parent_mode_enabled, is_banned')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
        throw new Error("User validation failed: User not found.");
    }

    if (userProfile.is_banned) {
        return new Response(JSON.stringify({ error: "Account Suspended" }), { status: 403, headers: corsHeaders });
    }

    // 6. 🛡️ SECURITY: Enforce Parent Mode
    // Critical actions are blocked if Parent Mode is ON
    const RESTRICTED_ACTIONS = ['APPROVE_WORK', 'RELEASE_ESCROW', 'PAY'];
    
    if (userProfile.parent_mode_enabled && RESTRICTED_ACTIONS.includes(action)) {
        console.warn(`Blocked Action ${action} for User ${userId} due to Parent Mode.`);
        return new Response(JSON.stringify({ 
            error: "Security Block: Parent Mode is active. Ask your parent to approve this.",
            isSecurityBlock: true 
        }), { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 7. Fetch Application Data
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (fetchError || !app) throw new Error("Application not found");

    // 8. Logic based on action (State Machine)
   
    let updates = {};
    const now = new Date().toISOString();
    
    if (action === 'ACCEPT_APPLICATION') {
        updates = { status: 'Accepted', started_at: now }
    } 
    else if (action === 'SUBMIT_WORK') {
        updates = { 
            status: 'Submitted', 
            submitted_at: now,
            work_link: payload?.work_link || null,
            work_message: payload?.work_message || payload?.message || null, // Handle both keys safely
            
            // ✅ NEW: Actually save the file URLs to the database
            work_files: payload?.files || [] 
        }
    } 
    else if (action === 'APPROVE_WORK') {
        updates = { status: 'Completed', completed_at: now }
    } 
    else if (action === 'RELEASE_ESCROW') {
        if (app.status !== 'Completed') throw new Error("Work must be approved first.");
        updates = { status: 'Paid', paid_at: now, is_escrow_held: false }
    }
    
// ... rest of the file
    // 9. Update DB
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', appId);

    if (updateError) throw new Error(`Database Update Failed: ${updateError.message}`);

    // 10. Success Response
    return new Response(JSON.stringify({ success: true, message: "Order Updated Successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("CRITICAL FUNCTION ERROR:", err);
    return new Response(JSON.stringify({ 
      error: err.message, 
      details: "Check Supabase Edge Function Logs." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})