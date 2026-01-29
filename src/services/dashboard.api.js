import { supabase } from '../supabase';

// 🌍 CONNECT TO YOUR BACKEND (Optional: Only if you still use a separate Node server)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// --- HELPER: GENERIC BACKEND CALL ---
const callBackend = async (endpoint, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) throw new Error("User not authenticated");

  // Only run if BACKEND_URL is defined
  if (!BACKEND_URL) {
    console.warn("Skipping backend call: VITE_BACKEND_URL is not set.");
    return { error: "Backend not configured" };
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Backend request failed");
  return data;
};

// ==========================================
// 1. DATA FETCHING (OPTIMIZED)
// ==========================================

export const fetchDashboardData = async (user) => {
  const isClient = user.type === 'client';
  try {
    // 1. Services Query (Limit 20)
    let servicesQuery = supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!isClient) {
      servicesQuery = servicesQuery.eq('freelancer_id', user.id);
    }

    // 2. Jobs Query (Limit 20)
    let jobsQuery = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (isClient) {
      jobsQuery = jobsQuery.eq('client_id', user.id);
    }

    // 3. Applications Query (Limit 50)
    let appsQuery = supabase.from('applications').select('*').limit(50);
    if (isClient) {
      appsQuery = appsQuery.eq('client_id', user.id);
    } else {
      appsQuery = appsQuery.eq('freelancer_id', user.id);
    }

    // 4. Notifications Query (Limit 20)
    const notificationsQuery = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // ✅ EXECUTE IN PARALLEL
    const [servicesRes, jobsRes, appsRes, notifRes] = await Promise.all([
      servicesQuery,
      jobsQuery,
      appsQuery,
      notificationsQuery
    ]);

    if (servicesRes.error) throw servicesRes.error;
    if (jobsRes.error) throw jobsRes.error;
    if (appsRes.error) throw appsRes.error;
    if (notifRes.error) throw notifRes.error;

    return { 
      services: servicesRes.data || [], 
      jobs: jobsRes.data || [], 
      applications: appsRes.data || [], 
      notifications: notifRes.data || [],
      referralCount: 0 
    };
  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error);
    return { error };
  }
};

export const searchJobsAPI = async (searchTerm) => {
  if (!searchTerm) return [];
  const { data, error } = await supabase.rpc('search_jobs', { search_term: searchTerm });
  if (error) {
      console.error(error);
      return [];
  }
  return data;
};

// ==========================================
// 2. BASIC CRUD (JOBS & SERVICES)
// ==========================================

export const createJob = async (jobData) => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase Insert Error:", error);
    return { error };
  }

  return { data };
};

export const deleteJob = async (jobId) => {
  return await supabase.from('jobs').delete().eq('id', jobId);
};

export const createService = async (serviceData) => {
  return await supabase.from('services').insert([serviceData]).select();
};

export const deleteService = async (serviceId) => {
  return await supabase.from('services').delete().eq('id', serviceId);
};

// ==========================================
// 3. APPLICATIONS & STATUS FLOW
// ==========================================

export const applyForJob = async (applicationData, jobTitle) => {
  const { error } = await supabase.from('applications').insert([applicationData]);
  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: applicationData.client_id, 
      message: `New application: ${jobTitle}` 
    }]);
  }
  return { error };
};

export const updateApplicationStatus = async (appId, status, freelancerId) => {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId);

  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, 
      message: `Application ${status}` 
    }]);
  }
  return { error };
};

// ==========================================
// 4. AUDIT LOGGING
// ==========================================

export const logAuditAction = async (actionType, userId, details = {}) => {
  try {
    await supabase.from('audit_logs').insert({
      action: actionType,
      actor_id: userId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        client_agent: navigator.userAgent
      }
    });
  } catch (err) {
    console.warn("Audit log failed:", err);
  }
};

// ==========================================
// 5. ESCROW & PAYMENTS (SECURE EDGE FUNCTIONS)
// ==========================================

export const createEscrowSession = async (appId, amount, freelancerId, customerPhone) => {
  try {
    const { data, error } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'CREATE_ORDER',
        appId,
        amount,
        freelancerId,
        customerPhone
      }
    });

    if (error) throw error;
    return { paymentSessionId: data.payment_session_id, orderId: data.order_id, error: null };
  } catch (err) {
    console.error("Payment Session Error:", err);
    return { error: err };
  }
};

export const verifyAndStartEscrow = async (orderId, appId) => {
  try {
    const { data, error } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'VERIFY_ORDER',
        orderId,
        appId
      }
    });

    if (error) throw error;
    return { success: data.success, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
};

export const checkPaymentStatus = async (orderId) => {
  try {
    const { data, error } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'CHECK_STATUS',
        orderId
      }
    });

    if (error) throw error;
    return { success: true, status: data.status };
  } catch (err) {
    return { success: false, error: err };
  }
};

// ✅ SECURE PRODUCTION GRADE: PAYMENT RELEASE
export const processPayment = async (appId, amount, freelancerId, escrowConsent) => {
  try {
    // 1. Get current user for Auth context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 2. Invoke Secure Edge Function
    // We do NOT update the DB here directly anymore.
    const { data, error } = await supabase.functions.invoke('order-manager', {
      body: { 
        action: 'RELEASE_ESCROW',
        appId: appId,
        userId: user.id,
        payload: {
            amount: amount,
            freelancerId: freelancerId,
            escrowConsent: escrowConsent
        }
      }
    });

    if (error) {
        // Handle Edge Function specific errors
        const errorMsg = await error.context?.json().then(e => e.message).catch(() => error.message);
        throw new Error(errorMsg || "Payment Release Failed");
    }

    return { error: null };

  } catch (err) {
    console.error("Secure Process Payment Error:", err);
    return { error: err };
  }
};

// ==========================================
// 6. ADMIN ACTIONS (SECURE)
// ==========================================
// [File: src/services/dashboard.api.js]

export const fetchAdminEscrowOrders = async (page = 0, limit = 50) => {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // 1. QUERY WITH EXPLICIT JOINS
    // We join 'applications'.
    // Inside applications, we join 'jobs' (for title) and 'clients' (for name).
    const { data, error, count } = await supabase
      .from('escrow_orders')
      .select(`
        *,
        applications (
          id,
          status,
          freelancer_name,
          client_id,
          freelancer_id,
          clients:client_id ( name ),  
          jobs:job_id ( title )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("❌ Admin Finance Fetch Error:", error.message);
      return { data: [], count: 0, error };
    }

    // 2. DATA TRANSFORMATION
    const formattedData = (data || []).map(order => {
      const app = order.applications || {};
      const jobData = app.jobs || {};
      const clientData = app.clients || {}; // Get the joined client data

      return {
        // IDs
        id: app.id || order.app_id || order.id, 
        escrow_order_id: order.id,
        client_id: order.client_id,
        freelancer_id: order.freelancer_id,

        // Display Names (Using the joined data)
        client_name: clientData.name || 'Unknown Client', 
        freelancer_name: app.freelancer_name || 'Unknown Freelancer',
        jobs: { title: jobData.title || 'Unknown Job' },

        // Financials
        bid_amount: order.bid_amount, 
        status: order.status, 
        created_at: order.created_at,
        app_status: app.status || 'N/A'
      };
    });

    return { data: formattedData, count, error: null };

  } catch (err) {
    console.error("🔥 Critical Finance API Error:", err);
    return { data: [], count: 0, error: err };
  }
};
export const adminForceRelease = async (appId, amount, freelancerId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Call Edge Function with ADMIN Action
    const { data, error } = await supabase.functions.invoke('order-manager', {
        body: { 
          action: 'ADMIN_FORCE_RELEASE',
          appId: appId,
          userId: user.id, 
          payload: { amount, freelancerId }
        }
    });

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err };
  }
};

export const adminForceRefund = async (appId, clientId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Call Edge Function with ADMIN Action
    const { data, error } = await supabase.functions.invoke('order-manager', {
        body: { 
          action: 'ADMIN_FORCE_REFUND', // Ensure this exists in your order-manager logic too
          appId: appId,
          userId: user.id,
          payload: { clientId }
        }
    });

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err };
  }
};

// ==========================================
// 7. FEATURES: REVIEWS, ENERGY, & REVISIONS
// ==========================================

export const requestRevision = async (appId, message, freelancerId) => {
  const { data: app } = await supabase.from('applications').select('revision_count').eq('id', appId).single();
  const newCount = (app?.revision_count || 0) + 1;

  const { error } = await supabase
    .from('applications')
    .update({ status: 'Revision Requested', revision_message: message, revision_count: newCount })
    .eq('id', appId);

  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, message: `⚠️ Revision Requested: "${message.substring(0, 20)}..."` 
    }]);
  }
  return { error };
};

export const getEnergy = async (userId) => {
  const { data, error } = await supabase
    .from('freelancers')
    .select('energy_points') // <--- CHANGE THIS from 'energy'
    .eq('id', userId)
    .single();

  if (error) return { energy: 0 };
  
  // We map 'energy_points' from DB to 'energy' for your frontend state
  return { energy: data?.energy_points || 0 }; 
};

export const deductEnergy = async (userId, amount) => {
  // First check if they have enough
  const { data: user, error: fetchError } = await supabase
    .from('freelancers')
    .select('energy_points') // <--- CHANGE THIS
    .eq('id', userId)
    .single();

  if (fetchError || !user) return { success: false, error: fetchError };

  if (user.energy_points < amount) { // <--- CHANGE THIS
     return { success: false, error: { message: "Insufficient Energy Points" } };
  }

  // Perform deduction
  const { error: updateError } = await supabase
    .from('freelancers')
    .update({ energy_points: user.energy_points - amount }) // <--- CHANGE THIS
    .eq('id', userId);

  if (updateError) return { success: false, error: updateError };

  return { success: true };
};

export const awardEnergy = async (userId, amount) => {
  const { data: user } = await supabase.from('freelancers').select('energy_points').eq('id', userId).single();
  const { error } = await supabase.from('freelancers').update({ energy_points: (user?.energy_points || 0) + amount }).eq('id', userId);
  return { error };
};

export const unlockSkill = async (userId, newSkills) => {
  return await supabase.from('freelancers').update({ unlocked_skills: newSkills }).eq('id', userId);
};

// ==========================================
// 8. USER & PROFILE UTILS
// ==========================================

export const clearUserNotifications = async (userId) => {
  return await supabase.from('notifications').delete().eq('user_id', userId);
};

export const updateUserProfile = async (userId, updates, table) => {
  const { error } = await supabase.from(table).update(updates).eq('id', userId);
  
  if (!error) {
      // ✅ AUTOMATIC LOGGING
      // This uses the logAuditAction helper we defined in this file
      await logAuditAction('USER_UPDATE', userId, {
          table: table,
          fields: Object.keys(updates)
      });
  }
  
  return { error };
};
export const getPublicProfile = async (userId) => {
  // 1. Fetch User Details
  const { data: user, error } = await supabase
    .from('freelancers') 
    .select('id, name, bio, nationality, tag_line, unlocked_skills, created_at, social_links, cover_image') // Added images just in case
    .eq('id', userId)
    .single();
    
  if (error) return { error };

  // 2. Fetch Badges
  const { data: badges } = await supabase
    .from('user_badges')
    .select('name:badge_name, earned_at') // <--- RENAME badge_name TO name
    .eq('user_id', userId);

  // 3. Fetch Portfolio
  const { data: portfolio } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 4. --- NEW: Fetch Latest Resume ---
  const { data: resume } = await supabase
    .from('resumes')
    .select('content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) // Get the newest one
    .limit(1)
    .single();

  return { 
      user, 
      badges: badges || [], 
      portfolio: portfolio || [], 
      resume: resume?.content || null // Returns the resume JSON or null
  };
};

// ==========================================
// 9. INVOICE HANDLING
// ==========================================

export const getInvoiceUrl = async (filePath) => {
  if (!filePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 60); 
      
    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error("Error generating invoice URL:", err);
    return null;
  }
}

// [File: src/services/dashboard.api.js]

// ... existing code ...

// 🆕 FETCH BANKING DETAILS FOR ADMIN
export const getUserBankingDetails = async (userId) => {
  const { data, error } = await supabase
    .from('user_banking')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error("Banking Fetch Error:", error);
    return { data: null, error };
  }
  return { data, error: null };
};

export const submitReview = async (appId, rating, tags = []) => {
  try {
    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 2. Validate Frontend Side
    if (!rating) throw new Error("Rating is required");

    // 3. Call Edge Function
    const { data, error } = await supabase.functions.invoke('order-manager', {
      body: { 
        action: 'SUBMIT_REVIEW',
        appId: appId,
        userId: user.id,
        payload: { 
            rating: parseInt(rating), // Ensure it's a number
            tags: tags 
        }
      }
    });

    if (error) throw error;
    return { error: null };

  } catch (err) {
    console.error("Submit Review Error:", err);
    return { error: err };
  }
};

export const claimDailyReward = async (userId, date) => {
  try {
    // Uses the RPC function we discussed to handle UUIDs safely
    // If you haven't created the function in Supabase SQL Editor yet, do that first!
    const { error } = await supabase.rpc('claim_daily_reward', { 
      user_id: userId, 
      today: date 
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Reward Claim Error:", err);
    return { success: false, error: err };
  }
};