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
    // 2. Environment Setup
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Server Misconfiguration: Missing Environment Variables");
    }

    // Initialize Admin Client (Bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Parse Request
    const { action, appId, userId, payload } = await req.json();

    if (!appId || !userId) throw new Error("Missing 'appId' or 'userId' in request body");

    // 4. 🛡️ SECURITY: Fetch User Profile
    // Check Admin Status first
    const { data: adminData } = await supabaseAdmin.from('admins').select('id').eq('id', userId).maybeSingle();
    const isAdmin = !!adminData;

    // Check User Profiles
    const { data: fData } = await supabaseAdmin.from('freelancers').select('id, parent_mode, status, kyc_status, energy_points').eq('id', userId).maybeSingle();
    const { data: cData } = await supabaseAdmin.from('clients').select('id, status, kyc_status').eq('id', userId).maybeSingle();
    
    const userProfile = fData || cData || (isAdmin ? { status: 'active' } : null);

    if (!userProfile) {
       console.error(`[CRITICAL] User ${userId} not found.`);
       throw new Error("User profile not found.");
    }

    // 5. 🛡️ Enforcement (Skipped for Admins)
    if (!isAdmin) {
        // Check Account Status (Bans)
        if (userProfile.status === 'suspended' || userProfile.status === 'banned') {
            return new Response(JSON.stringify({ error: "Account Suspended" }), { status: 403, headers: corsHeaders });
        }

        // Check Parent Mode
        const RESTRICTED_ACTIONS = ['APPROVE_WORK', 'RELEASE_ESCROW', 'PAY'];
        if (userProfile.parent_mode === true && RESTRICTED_ACTIONS.includes(action)) {
            return new Response(JSON.stringify({ 
                error: "Security Block: Parent Mode is active.", 
                isSecurityBlock: true 
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Check KYC (Financial Actions)
        const KYC_ACTIONS = ['ACCEPT_APPLICATION', 'RELEASE_ESCROW'];
        if (KYC_ACTIONS.includes(action) && userProfile.kyc_status !== 'approved') {
            return new Response(JSON.stringify({
                error: "KYC_REQUIRED", 
                message: "Identity verification required before moving funds.", 
                isKycBlock: true
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    // 6. Fetch Application Data
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (fetchError || !app) throw new Error("Application not found");

    // Ownership Check
    const isClient = app.client_id === userId;
    const isFreelancer = app.freelancer_id === userId;

    if (!isClient && !isFreelancer && !isAdmin) {
      throw new Error("Unauthorized: You do not have permission to modify this order.");
    }

    // 7. State Machine Logic
    let updates = {};
    let notification = null;
    let financialRecord = null; // Used for audit logging { type: 'RELEASE' | 'REFUND', amount: 0 }
    const now = new Date().toISOString();
    
    switch (action) {
      case 'ACCEPT_APPLICATION':
        updates = { status: 'Accepted', started_at: now };
        notification = { user_id: app.freelancer_id, message: `Application accepted! Project started.` };
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
        notification = { user_id: app.client_id, message: `Work submitted by freelancer. Please review.` };
        break;

      case 'APPROVE_WORK':
        if (!isClient) throw new Error("Only the client can approve work.");
        updates = { status: 'Completed', completed_at: now };
        notification = { user_id: app.freelancer_id, message: `Work approved! Payment pending.` };
        break;

      case 'RELEASE_ESCROW':
        if (!isClient) throw new Error("Only the client can release funds.");
        
        // 🛡️ FINANCIAL SECURITY: Double Spend Prevention
        if (!app.is_escrow_held) {
            throw new Error("No escrow funds found for this job. Funds may have already been released.");
        }
        
        updates = { 
            status: 'Paid', 
            paid_at: now, 
            is_escrow_held: false, 
            is_escrow_terms_agreed: payload?.escrowConsent || false
        };
        
        // Prepare Financial Record
        const releaseAmount = payload?.amount || app.bid_amount || 0;
        financialRecord = { type: 'RELEASE', amount: releaseAmount };
        
        notification = { 
            user_id: app.freelancer_id, 
            message: `💰 Payment released! ₹${(releaseAmount * 0.95).toFixed(2)} credited.` 
        };
        break;

      // ✅ ADMIN ACTION 1: FORCE RELEASE
      case 'ADMIN_FORCE_RELEASE':
        if (!isAdmin) throw new Error("Unauthorized: Admin Access Required");
        if (!app.is_escrow_held) throw new Error("No funds held to release.");
        
        updates = { 
            status: 'Paid', 
            paid_at: now, 
            is_escrow_held: false, 
            rejection_reason: "Admin Override: Force Release" 
        };
        
        financialRecord = { type: 'RELEASE', amount: payload?.amount || app.bid_amount };
        notification = { user_id: app.freelancer_id, message: `System Admin released payment of ₹${financialRecord.amount}.` };
        break;

      // ✅ ADMIN ACTION 2: FORCE REFUND
      case 'ADMIN_FORCE_REFUND':
        if (!isAdmin) throw new Error("Unauthorized: Admin Access Required");
        if (!app.is_escrow_held) throw new Error("No funds held to refund.");

        updates = { 
            status: 'Cancelled', 
            is_escrow_held: false, 
            rejection_reason: "Admin Override: Force Refund" 
        };
        
        financialRecord = { type: 'REFUND', amount: app.bid_amount };
        notification = { user_id: app.client_id, message: `System Admin refunded payment of ₹${financialRecord.amount}.` };
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

        // Prepare Refund Record (Only if funds were actually held)
        if (app.is_escrow_held) {
            financialRecord = { type: 'REFUND', amount: app.bid_amount };
        }
        
        notification = { user_id: app.freelancer_id, message: `Application rejected. Reason: ${payload?.reason}` };
        break;
        
      case 'REQUEST_REVISION':
        if (!isClient) throw new Error("Only client can request revision.");
        updates = { 
            status: 'Revision Requested', 
            revision_message: payload?.message,
            revision_count: (app.revision_count || 0) + 1
        };
        notification = { user_id: app.freelancer_id, message: `⚠️ Revision Requested: "${payload?.message?.substring(0, 20)}..."` };
        break;

      // ✅ NEW: SUBMIT REVIEW CASE (Fixed "Invalid Action" Error)
      case 'SUBMIT_REVIEW':
        if (!isClient) throw new Error("Only the client can submit a review.");
        if (!payload?.rating) throw new Error("Rating is required.");

        updates = { 
            client_rating: payload.rating, 
            client_review_tags: payload.tags || [] 
        };

        notification = { 
            user_id: app.freelancer_id, 
            message: `🌟 You received a ${payload.rating}-Star Review!` 
        };

        // Award Energy for 5-star reviews
        if (payload.rating === 5) {
            const { data: flUser } = await supabaseAdmin.from('freelancers').select('energy_points').eq('id', app.freelancer_id).single();
            if (flUser) {
                await supabaseAdmin.from('freelancers').update({ energy_points: (flUser.energy_points || 0) + 5 }).eq('id', app.freelancer_id);
            }
        }
        break;

      default:
        throw new Error(`Invalid Action: ${action}`);
    }
    
    // 8. Execute Main Update (Application Status)
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', appId);

    if (updateError) throw new Error(`Database Update Failed: ${updateError.message}`);

    // 9. 🏦 ROBUST FINANCIAL LOGGING (Fix for Missing Logs)
    if (financialRecord) {
        // Attempt to find existing order
        let targetOrderId = null;
        
        const { data: escrowData } = await supabaseAdmin
            .from('escrow_orders')
            .select('id')
            .eq('app_id', appId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (escrowData) {
            targetOrderId = escrowData.id;
        } else {
            // ⚠️ FALLBACK: Create "Shadow Order" if original is missing to preserve audit trail
            console.warn(`[AUDIT FIX] No Escrow Order found for App ${appId}. Creating Shadow Order.`);
            const shadowOrder = await supabaseAdmin.from('escrow_orders').insert({
                id: `SHADOW-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                app_id: appId,
                client_id: app.client_id,
                freelancer_id: app.freelancer_id,
                bid_amount: financialRecord.amount,
                status: 'Pending'
            }).select().single();
            
            if (shadowOrder.data) targetOrderId = shadowOrder.data.id;
        }

        if (targetOrderId) {
            const newStatus = financialRecord.type === 'RELEASE' ? 'Released' : 'Refunded';
            
            // A. Update Order Status
            await supabaseAdmin
                .from('escrow_orders')
                .update({ status: newStatus, updated_at: now })
                .eq('id', targetOrderId);

            // B. Insert Immutable Payment Log
            const logEntry = {
                order_id: targetOrderId,
                amount: financialRecord.amount,
                status: newStatus.toUpperCase(), 
                raw_data: { 
                    action_by: userId, 
                    app_id: appId, 
                    reason: action,
                    timestamp: now,
                    actor_role: isAdmin ? 'ADMIN' : (app.client_id === userId ? 'CLIENT' : 'FREELANCER')
                }
            };
            
            const { error: logError } = await supabaseAdmin.from('payment_logs').insert(logEntry);
            if (logError) console.error("Payment Log Insert Failed:", logError);
        }
    }

    // 10. Send Notification
    if (notification) {
        await supabaseAdmin.from('notifications').insert(notification);
    }

    // 11. Success Response
    return new Response(JSON.stringify({ success: true, message: "Order Updated Successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("ORDER MANAGER ERROR:", err.message);
    return new Response(JSON.stringify({ 
      error: err.message, 
      details: "Check Supabase Edge Function Logs." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})