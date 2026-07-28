import { supabase } from '../supabase';

const PUBLIC_PROFILE_CACHE_TTL_MS = 30_000;
const PUBLIC_PROFILE_TIMEOUT_MS = 12_000;
const PUBLIC_PROFILE_RATE_WINDOW_MS = 60_000;
const PUBLIC_PROFILE_RATE_LIMIT = 24;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OFFICIAL_CLIENT_SELECT = 'client_id, display_name, badge_label, verified_at';

const publicProfileCache = new Map();
const publicProfileInflight = new Map();
const publicProfileRateBuckets = new Map();

const withTimeout = (promise, timeoutMs, message) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const enforceLocalRateLimit = (bucketKey, limit = PUBLIC_PROFILE_RATE_LIMIT, windowMs = PUBLIC_PROFILE_RATE_WINDOW_MS) => {
  const now = Date.now();
  const bucket = publicProfileRateBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    publicProfileRateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterMs: bucket.resetAt - now,
    };
  }

  bucket.count += 1;
  return { allowed: true };
};

const safeProfileBundle = (bundle = {}) => ({
  user: bundle.user || null,
  badges: Array.isArray(bundle.badges) ? bundle.badges : [],
  portfolio: Array.isArray(bundle.portfolio) ? bundle.portfolio : [],
  projects: Array.isArray(bundle.projects) ? bundle.projects : [],
  services: Array.isArray(bundle.services) ? bundle.services : [],
  resume: bundle.resume || null,
});

const decorateJobsWithOfficialAccounts = async (jobs = []) => {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const clientIds = [
    ...new Set(
      safeJobs
        .map((job) => job?.client_id)
        .filter((id) => UUID_RE.test(String(id || '')))
    ),
  ];

  if (clientIds.length === 0) return safeJobs;

  try {
    const { data, error } = await supabase
      .from('official_client_accounts')
      .select(OFFICIAL_CLIENT_SELECT)
      .in('client_id', clientIds);

    if (error) throw error;

    const officialByClientId = new Map(
      (data || []).map((account) => [account.client_id, account])
    );

    return safeJobs.map((job) => {
      const officialAccount = officialByClientId.get(job.client_id);
      if (!officialAccount) return job;

      return {
        ...job,
        client_name: officialAccount.display_name || job.client_name,
        client_is_official: true,
        client_verified_label: officialAccount.badge_label || 'Official TeenVerseHub account',
        client_verified_at: officialAccount.verified_at || null,
      };
    });
  } catch (error) {
    console.warn('Official client account lookup failed:', error);
    return safeJobs;
  }
};

// ==========================================
// 1. DATA FETCHING (OPTIMIZED)
// ==========================================

export const fetchDashboardData = async (user) => {
  const isClient = user.type === 'client';

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

  // 3. Applications Query (Limit 50) - include related project fields for portfolio/profile views
  let appsQuery = supabase
    .from('applications')
    .select(`
      *,
      jobs ( title, category, budget, description, created_at )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

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

  // ✅ EXECUTE IN PARALLEL - each query error is isolated so one failure doesn't crash all
  const [servicesRes, jobsRes, appsRes, notifRes] = await Promise.all([
    servicesQuery,
    jobsQuery,
    appsQuery,
    notificationsQuery
  ]);

  if (servicesRes.error) console.warn('Services fetch failed:', servicesRes.error);
  if (jobsRes.error) console.warn('Jobs fetch failed:', jobsRes.error);
  if (appsRes.error) console.warn('Applications fetch failed:', appsRes.error);
  if (notifRes.error) console.warn('Notifications fetch failed:', notifRes.error);

  let applications = appsRes.data || [];

  if (isClient && applications.length > 0) {
    const freelancerIds = [...new Set(applications.map((app) => app.freelancer_id).filter(Boolean))];

    if (freelancerIds.length > 0) {
      const { data: freelancerPlans, error: planError } = await supabase
        .from('freelancers')
        .select('id, current_plan, plan_expires_at')
        .in('id', freelancerIds);

      if (planError) {
        console.warn('Freelancer plan lookup failed:', planError);
      } else {
        const planByFreelancerId = new Map(
          (freelancerPlans || []).map((freelancer) => [freelancer.id, freelancer])
        );

        applications = applications.map((app) => {
          const freelancerPlan = planByFreelancerId.get(app.freelancer_id);
          if (!freelancerPlan) return app;

          return {
            ...app,
            freelancer_current_plan: freelancerPlan.current_plan,
            freelancer_plan_expires_at: freelancerPlan.plan_expires_at,
          };
        });
      }
    }
  }

  let decoratedJobs = jobsRes.data || [];
  try {
    decoratedJobs = await decorateJobsWithOfficialAccounts(jobsRes.data || []);
  } catch (err) {
    console.warn('Job decoration failed:', err);
  }

  return { 
    services: servicesRes.data || [], 
    jobs: decoratedJobs,
    applications,
    notifications: notifRes.data || [],
    referralCount: 0 
  };
};

export const searchJobsAPI = async (searchTerm) => {
  if (!searchTerm) return [];
  const { data, error } = await supabase.rpc('search_jobs', { search_term: searchTerm });
  if (error) {
      console.error(error);
      return [];
  }
  return decorateJobsWithOfficialAccounts(data || []);
};

export const sendPushNotification = async ({
  audience,
  targetUserIds,
  title = 'TeenVerse alert',
  body,
  url = '/dashboard',
}) => {
  if (!body) return { skipped: true };

  try {
    const { data, error } = await supabase.functions.invoke('send-fcm-notification', {
      body: { audience, targetUserIds, title, body, url },
    });

    if (error) throw error;
    return { data };
  } catch (error) {
    const errorBody = await error.context?.json?.().catch(() => null);
    const message = errorBody?.error || error.message || 'Push notification send failed';
    console.warn('Push notification send failed:', message, errorBody || error);
    return { error: { ...error, message, details: errorBody } };
  }
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

  const [decoratedData] = await decorateJobsWithOfficialAccounts(data ? [data] : []);

  await sendPushNotification({
    audience: 'freelancers',
    title: 'New job available',
    body: decoratedData?.title ? `New job available: ${decoratedData.title}` : 'A new job is available on TeenVerse.',
    url: '/dashboard',
  });

  return { data: decoratedData || data };
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
    await sendPushNotification({
      targetUserIds: [applicationData.client_id],
      title: 'New application',
      body: `New application: ${jobTitle}`,
      url: '/dashboard',
    });
  }
  return { error };
};

export const updateApplicationStatus = async (appId, status, freelancerId) => {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId);

  if (!error) {
    await sendPushNotification({
      targetUserIds: [freelancerId],
      title: 'Application updated',
      body: `Application ${status}`,
      url: '/dashboard',
    });
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
    return { paymentSessionId: data.payment_session_id, orderId: data.order_id || data.orderId, error: null };
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

export const fundEscrowWithWallet = async ({ appId, walletDeduction = 0, gatewayAmount = 0, orderId = null }) => {
  try {
    const { data, error } = await supabase.functions.invoke('fund-escrow-with-wallet', {
      body: {
        appId,
        walletDeduction,
        gatewayAmount,
        orderId
      }
    });

    if (error) {
      const errorBody = await error.context?.json?.().catch(() => null);
      throw new Error(errorBody?.error || errorBody?.message || error.message || "Wallet payment failed");
    }

    if (!data?.success) {
      throw new Error(data?.error || data?.message || "Wallet payment failed");
    }

    return { data, error: null };
  } catch (err) {
    console.error("Wallet Escrow Error:", err);
    return { data: null, error: err };
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
    const { error } = await supabase.functions.invoke('order-manager', {
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

export const fetchAdminEscrowOrders = async (page = 0, limit = 50) => {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // 1. QUERY WITH EXPLICIT JOINS
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
      const clientData = app.clients || {};

      return {
        id: app.id || order.app_id || order.id, 
        escrow_order_id: order.id,
        client_id: order.client_id,
        freelancer_id: order.freelancer_id,
        client_name: clientData.name || 'Unknown Client', 
        freelancer_name: app.freelancer_name || 'Unknown Freelancer',
        jobs: { title: jobData.title || 'Unknown Job' },
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
    const { error } = await supabase.functions.invoke('order-manager', {
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
    const { error } = await supabase.functions.invoke('order-manager', {
        body: { 
          action: 'ADMIN_FORCE_REFUND', 
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
    await sendPushNotification({
      targetUserIds: [freelancerId],
      title: 'Revision requested',
      body: `Revision Requested: "${message.substring(0, 40)}..."`,
      url: '/dashboard',
    });
  }
  return { error };
};

export const getEnergy = async (userId) => {
  const { data, error } = await supabase
    .from('freelancers')
    .select('energy_points') 
    .eq('id', userId)
    .single();

  if (error) return { energy: 0 };
  return { energy: data?.energy_points || 0 }; 
};

export const deductEnergy = async (userId, amount) => {
  return {
    success: false,
    error: {
      message: 'Energy spending must use a secured RPC for the specific action.',
      userId,
      amount,
    },
  };
};

export const awardEnergy = async (userId, amount, rewardType, context = 'default') => {
  try {
    const { data, error } = await supabase.rpc('claim_energy_reward', {
      p_user_id: userId,
      p_reward_type: rewardType,
      p_context: context,
    });

    if (error) throw error;

    return {
      success: Boolean(data?.success),
      amount: Number(data?.amount || 0),
      expectedAmount: amount,
      error: null,
    };
  } catch (err) {
    return { success: false, amount: 0, expectedAmount: amount, error: err };
  }
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
      await logAuditAction('USER_UPDATE', userId, {
          table: table,
          fields: Object.keys(updates)
      });
  }
  
  return { error };
};

export const getPublicProfile = async (userId) => {
  if (!UUID_RE.test(String(userId || ''))) {
    return { error: new Error('Invalid profile id') };
  }

  const cached = publicProfileCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (publicProfileInflight.has(userId)) {
    return publicProfileInflight.get(userId);
  }

  const rate = enforceLocalRateLimit(`public-profile:${userId}`);
  if (!rate.allowed) {
    return {
      error: new Error(`Too many profile requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.`),
      rateLimited: true,
    };
  }

  const request = (async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('get_public_profile_bundle', { p_user_id: userId }),
        PUBLIC_PROFILE_TIMEOUT_MS,
        'Public profile request timed out'
      );

      if (!error && data?.user) {
        const value = safeProfileBundle(data);
        publicProfileCache.set(userId, {
          expiresAt: Date.now() + PUBLIC_PROFILE_CACHE_TTL_MS,
          value,
        });
        return value;
      }

      if (error) {
        console.warn('Public profile RPC unavailable, using safe fallback:', error.message || error);
      }
    } catch (err) {
      console.warn('Public profile RPC failed, using safe fallback:', err.message || err);
    }

    // Fallback keeps sensitive application rows out of the browser. Project order
    // history is intentionally only loaded through the hardened RPC above.
    const [userRes, badgesRes, portfolioRes, servicesRes] = await Promise.all([
      supabase
        .from('freelancers')
        .select('id, name, bio, nationality, tag_line, journey_statement, unlocked_skills, created_at, social_links, referral_code, cover_image, specialty, qualification, hourly_rate, current_plan, trust_score, trust_score_breakdown, risk_level, challenge_score, confidence_level, verified_skills, confidence_scores, project_analysis, technical_summary')
        .eq('id', userId)
        .single(),
      supabase
        .from('user_badges')
        .select('name:badge_name, earned_at')
        .eq('user_id', userId),
      supabase
        .from('portfolio_items')
        .select('id, title, content, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('services')
        .select('id, title, name, description, category, service_category, specialty, status, price, starting_price, rate, created_at, freelancer_id')
        .eq('freelancer_id', userId)
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    if (userRes.error) return { error: userRes.error };

    const value = safeProfileBundle({
      user: userRes.data,
      badges: badgesRes.data || [],
      portfolio: portfolioRes.data || [],
      projects: [],
      services: servicesRes.data || [],
      resume: null,
    });

    publicProfileCache.set(userId, {
      expiresAt: Date.now() + PUBLIC_PROFILE_CACHE_TTL_MS,
      value,
    });

    return value;
  })().finally(() => {
    publicProfileInflight.delete(userId);
  });

  publicProfileInflight.set(userId, request);
  return request;
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

  const accountNumber = String(data?.account_number || '');
  return {
    data: {
      ...data,
      account_number: accountNumber ? `****${accountNumber.slice(-4)}` : '',
      account_number_last4: accountNumber.slice(-4),
    },
    error: null
  };
};

export const submitReview = async (appId, rating, tags = []) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    if (!rating) throw new Error("Rating is required");

    const { error } = await supabase.functions.invoke('order-manager', {
      body: { 
        action: 'SUBMIT_REVIEW',
        appId: appId,
        userId: user.id,
        payload: { 
            rating: parseInt(rating), 
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
    const { data, error } = await supabase.rpc('claim_daily_reward', {
      p_user_id: userId,
      p_today: date
    });

    if (error) throw error;
    return {
      success: Boolean(data?.success),
      amount: Number(data?.amount || 0),
      reason: data?.reason,
    };
  } catch (err) {
    console.error("Reward Claim Error:", err);
    return { success: false, error: err };
  }
};

// ==========================================
// 10. REPORTING SYSTEM (MVP)
// ==========================================

export const submitReport = async (reportData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to report");

    if (!reportData.target_id) {
        throw new Error("Missing target_id in API call");
    }

    const { error } = await supabase.from('reports').insert([{
      reporter_id: user.id,
      reported_user_id: reportData.reported_user_id, 
      target_type: reportData.target_type,
      target_id: reportData.target_id, 
      reason: reportData.reason,
      details: reportData.description 
    }]);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Report API Error:", err);
    return { error: err };
  }
};

// 1. Link code
export const applyReferralCode = async (userId, referralCode) => {
    const { data, error } = await supabase.rpc('apply_referral_code', { p_user_id: userId, p_code: referralCode });
    if (error) return { success: false, error: error.message };
    return data;
};

// 2. Claim money
export const claimReferralReward = async (userId) => {
    const { data, error } = await supabase.rpc('claim_referral_reward', { p_user_id: userId });
    if (error) return { success: false, error: error.message };
    return data;
};

// 1. Fetch user's active tickets
export const fetchUserTickets = async (userId) => {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    return { data, error };
};

// 2. Create a new ticket & initial message
export const createTicket = async (userId, subject, initialMessage) => {
    // Create Ticket
    const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({ user_id: userId, subject: subject })
        .select()
        .single();

    if (ticketErr) return { error: ticketErr };

    // Insert First Message
    const { error: msgErr } = await supabase
        .from('support_messages')
        .insert({
            ticket_id: ticket.id,
            sender_id: userId,
            is_admin: false,
            message: initialMessage
        });

    return { ticket, error: msgErr };
};

// 3. Send a message in an existing ticket
export const sendSupportMessage = async (ticketId, userId, message, isAdmin = false) => {
    const { error } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_id: userId, is_admin: isAdmin, message });
        
    // Update ticket 'updated_at' to bump it to the top of the admin list
    await supabase.from('support_tickets').update({ updated_at: new Date() }).eq('id', ticketId);

    return { error };
};

// 4. Fetch messages for a specific ticket
export const fetchTicketMessages = async (ticketId) => {
    const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
    return { data, error };
};
