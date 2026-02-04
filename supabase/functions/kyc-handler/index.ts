// Follows Deno/Supabase Edge Function patterns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. CORS Headers (Required for Browser Access)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 2. Handle Pre-flight Requests (Browser options check)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 3. Initialize Admin Client (Bypasses RLS to update kyc_status)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Parse Request
    const body = await req.json();
    const { action, user_id, age_group, pan_number, file_path } = body;
    
    // Default to Sandbox if env var is missing
    const KYC_ENV = Deno.env.get("SETU_ENV") ?? "sandbox"; 

    // ====================================================
    // 🟢 ACTION 1: IDENTITY VERIFICATION (PAN + File)
    // ====================================================
    if (action === 'VERIFY_IDENTITY') {
        
        // --- SANDBOX LOGIC 🛠️ ---
        if (KYC_ENV === "sandbox") {
            // Simulate Network Delay (1.5s)
            await new Promise((r) => setTimeout(r, 1500));

            // Simulate Rejection Logic (for testing)
            // If PAN is "FAIL12345F", trigger an error
            if (pan_number === "FAIL12345F") {
                 return new Response(JSON.stringify({ 
                     success: false, 
                     error: "Simulated PAN Validation Failed (Sandbox)" 
                 }), {
                     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                     status: 400
                 });
            }

            // ✅ Success: Update DB
            // We set status to 'pending_bank' or just keep it internally noted.
            // For this flow, we will insert a record into 'kyc_status'.
            const { error: dbError } = await supabaseClient
                .from('kyc_status')
                .upsert({
                    user_id: user_id,
                    status: 'pending', // Pending until bank is linked
                    provider: 'sandbox_setu',
                    age_group: age_group,
                    submitted_at: new Date().toISOString(),
                    metadata: { pan_verified: true, pan_number: pan_number }
                });

            if (dbError) throw dbError;

            return new Response(JSON.stringify({
                success: true,
                mode: "sandbox",
                status: "identity_verified"
            }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 200 
            });
        }

        // --- PRODUCTION LOGIC 🚀 (Placeholder) ---
        return new Response(JSON.stringify({ 
            success: false, 
            message: "Production Identity API not configured" 
        }), { status: 501, headers: corsHeaders });
    }

    // ====================================================
    // 🔵 ACTION 2: BANKING VERIFICATION (Cashfree)
    // ====================================================
    // Note: Your frontend handles the basic DB insert for banking.
    // You can use this block if you want the Edge Function to validate the IFSC via API.
    if (action === 'VERIFY_BANK') {
         if (KYC_ENV === "sandbox") {
             // Simulate Bank Verification
             return new Response(JSON.stringify({
                success: true,
                mode: "sandbox",
                status: "bank_verified"
            }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                status: 200 
            });
         }
    }

    // Default Fallback
    return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid Action Provided" 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
    });
  }
});