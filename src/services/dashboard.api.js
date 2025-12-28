import { supabase } from '../supabase';

// ==========================================
// 1. DATA FETCHING (DASHBOARD & SEARCH)
// ==========================================

export const fetchDashboardData = async (user) => {
  const isClient = user.type === 'client';
  
  try {
    // 1. Fetch Services
    const { data: allServices, error: sError } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (sError) throw sError;
    
    // Filter services based on user type
    const services = isClient 
      ? allServices 
      : allServices.filter(s => s.freelancer_id === user.id);

    // 2. Fetch Jobs & Applications
    let jobs = [];
    let applications = [];

    if (isClient) {
      const { data: myJobs, error: jError } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });
      if (jError) throw jError;
      jobs = myJobs || [];

      const { data: apps, error: aError } = await supabase
        .from('applications')
        .select('*')
        .eq('client_id', user.id);
      if (aError) throw aError;
      applications = apps || [];

    } else {
      const { data: allJobs, error: jError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (jError) throw jError;
      jobs = allJobs || [];

      const { data: myApps, error: aError } = await supabase
        .from('applications')
        .select('*')
        .eq('freelancer_id', user.id);
      if (aError) throw aError;
      applications = myApps || [];
    }

    // 3. Fetch Notifications
    const { data: notifications, error: nError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (nError) throw nError;

    // 4. Fetch Referrals
    const { count, error: rError } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);
    if (rError) throw rError;

    return { 
      services, 
      jobs, 
      applications, 
      notifications: notifications || [], 
      referralCount: count || 0 
    };

  } catch (error) {
    console.error("Dashboard Data Fetch Error:", error);
    return { error };
  }
};

// Scalable Search (Replaces client-side filtering)
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
  return await supabase.from('jobs').insert([jobData]);
};

export const deleteJob = async (jobId) => {
  return await supabase.from('jobs').delete().eq('id', jobId);
};

export const createService = async (serviceData) => {
  return await supabase.from('services').insert([serviceData]);
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

// Secure Action Handler (Replaces direct updates for critical steps)
export const secureOrderAction = async (action, appId, userId, payload = {}) => {
  const { data, error } = await supabase.functions.invoke('order-manager', {
    body: { action, appId, userId, payload }
  });
  
  if (error) return { error };
  if (data.error) return { error: { message: data.error } }; // Catch backend logic errors
  return { data };
};

export const checkActionPermission = async (action, appId, userId) => {
  const { data, error } = await supabase.rpc('check_permission', {
    action_type: action,
    app_id: appId,
    user_id: userId
  });
  
  if (error) return { allowed: false, error };
  return { allowed: data.allowed, error: null };
};

// ==========================================
// 4. PAYMENTS (CASHFREE & PAYOUTS)
// ==========================================

// Initialize Cashfree Order
// src/services/dashboard.api.js

// ... existing imports

export const createEscrowSession = async (applicationId, amount, freelancerId, clientPhone) => {
  try {
    // 1. Generate a valid phone number (Real one if available, or a random valid dummy)
    // Cashfree Sandbox rejects '9999999999' often.
    const validPhone = clientPhone && clientPhone.length >= 10 
      ? clientPhone 
      : String(Math.floor(6000000000 + Math.random() * 900000000));

    // 2. Call the CORRECT Edge Function ('payment-gateway')
    const { data, error } = await supabase.functions.invoke('payment-gateway', {
      body: {
        action: 'CREATE_ORDER',
        amount: amount,
        orderId: `ORD_${applicationId}_${Date.now()}`,
        customerId: `CUST_${Date.now()}`,
        customerPhone: validPhone // Sending the valid phone
      }
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw error;
    }
    
    // 3. Validate Response
    if (!data || !data.payment_session_id) {
       throw new Error(data?.message || "Cashfree did not return a session ID");
    }

    return { paymentSessionId: data.payment_session_id, orderId: data.order_id };
  } catch (err) {
    console.error("Payment Init Error:", err);
    return { error: err };
  }
};

// ... keep other functions

// Verify Payment & Start Escrow
export const verifyAndStartEscrow = async (orderId, applicationId) => {
  try {
    const { data, error } = await supabase.functions.invoke('payment-gateway', {
      body: { action: 'VERIFY_PAYMENT', orderId }
    });

    if (error) throw error;

    if (data.status === 'SUCCESS') {
      const { error: dbError } = await supabase
        .from('applications')
        .update({ 
          status: 'Accepted', 
          started_at: new Date().toISOString(),
          payment_id: orderId, 
          is_escrow_held: true 
        })
        .eq('id', applicationId);
        
      if (dbError) throw dbError;
      return { success: true };
    } else {
      throw new Error("Payment verification failed at gateway.");
    }
  } catch (err) {
    return { error: err };
  }
};

// Manual Payment Process (Legacy/Simple Mode)
export const processPayment = async (appId, amount, freelancerId) => {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'Paid' })
    .eq('id', appId);

  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, 
      message: `💰 Payment received! ₹${(amount * 0.96).toFixed(2)}` 
    }]);
  }
  return { error };
};

// Automated Payouts (Edge Function)
export const releasePayout = async (appId, amount, freelancerId) => {
  try {
    const payoutAmount = (amount * 0.96).toFixed(2);
    
    const { data, error } = await supabase.functions.invoke('payment-gateway', {
      body: {
        action: 'INITIATE_PAYOUT',
        amount: payoutAmount,
        transferId: `TRANS_${appId}_${Date.now()}`,
        freelancerId: freelancerId
      }
    });

    if (error) throw error;
    
    if (data.status === 'SUCCESS' || data.status === 'PENDING') {
        await supabase
            .from('applications')
            .update({ 
                status: 'Paid', 
                paid_at: new Date().toISOString(),
                is_escrow_held: false,
                payout_reference: data.referenceId
            })
            .eq('id', appId);
            
        return { success: true };
    } else {
        throw new Error(data.message || "Payout initiation failed");
    }

  } catch (err) {
    console.error("Payout Error:", err);
    return { error: err };
  }
};

// Release Escrow (Simple Database Update - Fallback)
export const releaseEscrowFunds = async (appId, amount, freelancerId) => {
  const { error } = await supabase
    .from('applications')
    .update({ 
      status: 'Paid', 
      paid_at: new Date().toISOString(),
      is_escrow_held: false 
    })
    .eq('id', appId);

  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, 
      message: `💸 Payment Released! ₹${amount} has been credited.` 
    }]);
  }
  return { error };
};

// ==========================================
// 5. ADMIN ACTIONS (LEVEL 1: FINANCIALS)
// ==========================================

export const fetchAdminEscrowOrders = async () => {
  const { data, error } = await supabase
    .from('applications')
    .select(`*, client_name, freelancer_name, jobs (title)`)
    .in('status', ['Accepted', 'Disputed', 'Submitted', 'Completed']) 
    .eq('is_escrow_held', true)
    .order('updated_at', { ascending: false });

  return { data, error };
};

export const adminForceRelease = async (appId, amount, freelancerId) => {
  const { error } = await supabase
    .from('applications')
    .update({ 
      status: 'Paid', 
      is_escrow_held: false,
      paid_at: new Date().toISOString(),
      rejection_reason: 'Admin Force Release' 
    })
    .eq('id', appId);
    
  if (!error) {
     await supabase.from('notifications').insert({
        user_id: freelancerId,
        message: `Admin resolved dispute: Payment of ₹${amount} released.`
     });
  }
  return { error };
};

export const adminForceRefund = async (appId, clientId) => {
  const { error } = await supabase
    .from('applications')
    .update({ 
      status: 'Cancelled', 
      is_escrow_held: false,
      rejection_reason: 'Admin Force Refund'
    })
    .eq('id', appId);

  if (!error) {
     await supabase.from('notifications').insert({
        user_id: clientId,
        message: `Admin resolved dispute: Order cancelled and funds refunded.`
     });
  }
  return { error };
};

// ==========================================
// 6. FEATURES: REVISIONS, REVIEWS, & ENERGY
// ==========================================

// --- REVISION SYSTEM ---
export const requestRevision = async (appId, message, freelancerId) => {
  const { data: app } = await supabase
    .from('applications')
    .select('revision_count')
    .eq('id', appId)
    .single();

  const newCount = (app?.revision_count || 0) + 1;

  const { error } = await supabase
    .from('applications')
    .update({ 
      status: 'Revision Requested', 
      revision_message: message,
      revision_count: newCount 
    })
    .eq('id', appId);

  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, 
      message: `⚠️ Revision Requested: "${message.substring(0, 20)}..."` 
    }]);
  }

  return { error };
};

// --- ENERGY SYSTEM ---
export const getEnergy = async (userId) => {
  const { data, error } = await supabase
    .from('freelancers')
    .select('energy_points')
    .eq('id', userId)
    .single();
  return { energy: data?.energy_points || 0, error };
};

export const deductEnergy = async (userId, amount) => {
  const { data: user } = await supabase.from('freelancers').select('energy_points').eq('id', userId).single();
  if (!user || user.energy_points < amount) {
    return { error: { message: "Not enough Energy points!" } };
  }

  const { error } = await supabase
    .from('freelancers')
    .update({ energy_points: user.energy_points - amount })
    .eq('id', userId);
    
  return { success: true, newBalance: user.energy_points - amount, error };
};

export const awardEnergy = async (userId, amount) => {
  const { data: user } = await supabase.from('freelancers').select('energy_points').eq('id', userId).single();
  const { error } = await supabase
    .from('freelancers')
    .update({ energy_points: (user?.energy_points || 0) + amount })
    .eq('id', userId);
  return { error };
};

// --- REVIEWS SYSTEM ---
export const submitReview = async (appId, rating, tags, freelancerId) => {
  const { error } = await supabase
    .from('applications')
    .update({ 
      client_rating: rating, 
      client_review_tags: tags 
    })
    .eq('id', appId);

  if (!error) {
    await supabase.from('notifications').insert([{ 
      user_id: freelancerId, 
      message: `🌟 You received a ${rating}-Star Review!` 
    }]);
    
    // Bonus 5 energy for 5-star review
    if (rating === 5) {
        await awardEnergy(freelancerId, 5); 
    }
  }
  return { error };
};

// --- CLIENT-SIDE HELPERS (Templates) ---
export const generateCoverLetter = (userName, jobTitle, jobCategory) => {
  const templates = [
    `Hi! I saw you're looking for help with ${jobTitle}. I have experience in ${jobCategory} and I'd love to help you. I can start immediately!`,
    `Hello! I'm ${userName}. I read your project details about ${jobTitle} and I'm confident I can deliver great results. Check out my portfolio!`,
    `Hi there! I specialize in projects like "${jobTitle}". This matches my skills in ${jobCategory} perfectly. Let's chat so I can share my ideas!`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

// ==========================================
// 7. USER UTILS & BADGES
// ==========================================

export const clearUserNotifications = async (userId) => {
  return await supabase.from('notifications').delete().eq('user_id', userId);
};

export const updateUserProfile = async (userId, updates, table) => {
  return await supabase.from(table).update(updates).eq('id', userId);
};

export const unlockSkill = async (userId, newSkills) => {
  return await supabase.from('freelancers').update({ unlocked_skills: newSkills }).eq('id', userId);
};

export const checkAndGrantFirstGigBadge = async (userId) => {
  const { count } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', userId)
    .eq('status', 'Paid');

  if (count === 1) {
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_name: 'First Gig'
    });
    return true; 
  }
  return false;
};