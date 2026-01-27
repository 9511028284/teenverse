// File: api/verify-kyc.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with SERVICE ROLE key (Admin privileges)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1. CORS Headers (Allow your frontend to call this function)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // In production, replace '*' with 'https://teenverse.vercel.app'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight options request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, aadhaar, otp, step, userRole } = req.body;

  try {
    // --- STEP 1: REQUEST OTP ---
    if (step === 'initiate') {
      console.log(`[KYC-INIT] Request for user: ${userId}, Aadhaar: ending in ${aadhaar.slice(-4)}`);

      // ------------------------------------------------------------------
      // REAL PRODUCTION LOGIC (Uncomment when you have valid keys)
      // ------------------------------------------------------------------
      /*
      const fetch = await import('node-fetch');
      const response = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           "aadhaar": aadhaar,
           "client_id": process.env.DIGILOCKER_CLIENT_ID
           // Note: Actual API endpoints vary by provider (Setu/Zoop/Gov direct)
        })
      });
      if (!response.ok) throw new Error('Failed to connect to DigiLocker');
      */
      
      // ------------------------------------------------------------------
      // SIMULATION MODE (Works immediately for testing)
     
      if (aadhaar.length !== 12) throw new Error("Invalid Aadhaar Number");
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.status(200).json({ 
        success: true, 
        message: "OTP sent to registered mobile number" 
      });
    }

    // --- STEP 2: VERIFY OTP & UPDATE DB ---
    if (step === 'verify') {
      console.log(`[KYC-VERIFY] Verifying OTP for user: ${userId}`);

      if (!otp || otp.length !== 6) {
        throw new Error("Invalid OTP format");
      }

      // ------------------------------------------------------------------
      // REAL LOGIC (Exchange OTP for Data)
      // ------------------------------------------------------------------
      /*
      // Verify OTP with DigiLocker, get Token, Fetch Data...
      // If success: proceed to update DB
      */

      // ------------------------------------------------------------------
      // SIMULATION LOGIC
      // ------------------------------------------------------------------
      // Allow any OTP '123456' or random for demo, fail others if you want
      await new Promise(resolve => setTimeout(resolve, 1500));

      // --- SECURE DATABASE UPDATE ---
      // We use the Service Role key here, so RLS policies won't block us.
      const table = userRole === 'client' ? 'clients' : 'freelancers';
      
      // 1. Get current badges
      const { data: userData, error: fetchError } = await supabase
        .from(table)
        .select('badges')
        .eq('id', userId)
        .single();

      if (fetchError) throw new Error(`User lookup failed: ${fetchError.message}`);

      const currentBadges = userData.badges || [];
      const newBadges = currentBadges.includes('Verified') ? currentBadges : [...currentBadges, 'Verified'];

      // 2. Update status
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          is_kyc_verified: true,
          badges: newBadges,
          kyc_timestamp: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw new Error(`DB Update failed: ${updateError.message}`);

      return res.status(200).json({ 
        success: true, 
        message: "KYC Verified Successfully" 
      });
    }

  } catch (error) {
    console.error("KYC Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}