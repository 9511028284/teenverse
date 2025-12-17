import { supabase } from '../supabase';

// --- FETCHING DATA ---

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

// --- ACTIONS (JOBS & SERVICES) ---

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

// --- ACTIONS (APPLICATIONS & PAYMENTS) ---

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

// --- USER & UTILS ---

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
  // 1. Check count
  const { count } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', userId)
    .eq('status', 'Paid');

  // 2. Grant if it's the first one
  if (count === 1) {
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_name: 'First Gig'
    });
    return true; // Return true to trigger a confetti or toast in UI
  }
  return false;
};