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

    // 4. Parse Request
    const { action, appId, userId, payload } = await req.json();
    console.log(`[DEBUG] Received Request -> Action: ${action}, AppID: ${appId}, UserID: ${userId}`);

    if (!appId || !userId) throw new Error("Missing 'appId' or 'userId' in request body");

    // 5. 🛡️ SECURITY: Fetch User Profile (Dual Table Check)
    // We check 'freelancers' first, then 'clients'
    
    // A. Check Freelancers Table (Updated to include kyc_status)
    const { data: fData, error: fError } = await supabaseAdmin
      .from('freelancers') 
      .select('id, parent_mode, status, kyc_status') 
      .eq('id', userId)
      .maybeSingle();

    // B. Check Clients Table (Updated to include kyc_status)
    const { data: cData, error: cError } = await supabaseAdmin
      .from('clients') 
      .select('id, status, kyc_status') 
      .eq('id', userId)
      .maybeSingle();

    // C. Assign Profile
    const userProfile = fData || cData;

    if (!userProfile) {
       console.error(`[CRITICAL] User ${userId} not found in 'freelancers' or 'clients'.`);
       throw new Error("User validation failed: User profile not found. Please create your profile first.");
    }

    // 6. 🛡️ Check Ban Status
    // Your schema uses text status 'active' or 'suspended'
    if (userProfile.status === 'suspended' || userProfile.status === 'banned') {
        return new Response(JSON.stringify({ error: "Account Suspended" }), { status: 403, headers: corsHeaders });
    }

    // 7. 🛡️ Enforce Parent Mode
    // Only verify parent mode if the column exists (it only exists on freelancers)
    const RESTRICTED_ACTIONS = ['APPROVE_WORK', 'RELEASE_ESCROW', 'PAY'];
    
    // Check if 'parent_mode' exists (is not undefined) AND is explicitly true
    if (userProfile.parent_mode === true && RESTRICTED_ACTIONS.includes(action)) {
        console.warn(`Blocked Action ${action} for User ${userId} due to Parent Mode.`);
        return new Response(JSON.stringify({ 
            error: "Security Block: Parent Mode is active. Ask your parent to approve this.",
            isSecurityBlock: true 
        }), { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 8. 🛡️ NEW: Enforce KYC Verification (The Unhappy Path)
    // Blocks money movement if KYC is not approved
    const KYC_RESTRICTED_ACTIONS = ['ACCEPT_APPLICATION', 'RELEASE_ESCROW'];
    
    if (KYC_RESTRICTED_ACTIONS.includes(action)) {
        if (userProfile.kyc_status !== 'approved') {
            console.warn(`Blocked Action ${action} for User ${userId} due to KYC Status: ${userProfile.kyc_status}`);
            return new Response(JSON.stringify({
                error: "KYC_REQUIRED",
                message: "Identity verification required before moving funds.",
                isKycBlock: true
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    // 9. Fetch Application Data & Verify Ownership
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (fetchError || !app) throw new Error("Application not found");

    // Ownership Check
    const isClient = app.client_id === userId;
    const isFreelancer = app.freelancer_id === userId;

    if (!isClient && !isFreelancer) {
      throw new Error("Unauthorized: You do not have permission to modify this order.");
    }

    // 10. Logic based on action (State Machine)
    let updates = {};
    const now = new Date().toISOString();
    
    switch (action) {
      case 'ACCEPT_APPLICATION':
        // Usually clients "accept" proposals, or system accepts after payment
        updates = { status: 'Accepted', started_at: now };
        break;

      case 'SUBMIT_WORK':
        if (!isFreelancer) throw new Error("Only the freelancer can submit work.");
        updates = { 
          status: 'Submitted', 
          submitted_at: now,
          work_link: payload?.work_link || null,
          work_message: payload?.work_message || payload?.message || null,
          work_files: payload?.files || [] 
        };
        break;

      case 'APPROVE_WORK':
        if (!isClient) throw new Error("Only the client can approve work.");
        updates = { status: 'Completed', completed_at: now };
        break;

      case 'RELEASE_ESCROW':
        if (!isClient) throw new Error("Only the client can release funds.");
        if (app.status !== 'Completed') throw new Error("Work must be approved (Completed) before releasing escrow.");
        updates = { status: 'Paid', paid_at: now, is_escrow_held: false };
        break;

      case 'REJECT_APPLICATION':
        if (!isClient) throw new Error("Only the client can reject work.");
        if (app.status === 'Paid') throw new Error("Cannot reject an order that is already paid.");
        
        updates = { 
            status: 'Rejected', 
            rejection_reason: payload?.reason || "No reason provided",
            is_escrow_held: false, 
            completed_at: now 
        };
        break;

      default:
        throw new Error(`Invalid Action: ${action}`);
    }
    
    // 11. Update DB
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', appId);

    if (updateError) throw new Error(`Database Update Failed: ${updateError.message}`);

    // 12. Success Response
    return new Response(JSON.stringify({ success: true, message: "Order Updated Successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("CRITICAL FUNCTION ERROR:", err.message);
    return new Response(JSON.stringify({ 
      error: err.message, 
      details: "Check Supabase Edge Function Logs." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})