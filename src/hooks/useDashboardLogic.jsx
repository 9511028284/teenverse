import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import * as api from '../services/dashboard.api';
import { toPng, toBlob } from 'html-to-image';
import { jsPDF } from "jspdf";
import { QUIZZES, APP_STATUS } from '../utils/constants';
import { filterSubscriptionBadgesForPlan, getCommissionRate, getEffectivePlanName, getPlanLimits, normalizeExpiredSubscription } from '../utils/subscription';
import {
  getNotificationPermission,
  listenForForegroundMessages,
  requestNotificationPermission,
  showBrowserNotification
} from '../services/pushNotifications';

// ------------------------------------------
// 🚀 PRODUCTION CONFIGURATION
// ------------------------------------------
const KYC_MODE = 'production'; 
const TEENVERSE_HOME_URL = 'https://teenversehub.in';
// ------------------------------------------

const buildInstagramStoryJoinUrl = (profile) => {
  const url = new URL(TEENVERSE_HOME_URL);
  url.searchParams.set('utm_source', 'instagram');
  url.searchParams.set('utm_medium', 'story');
  url.searchParams.set('utm_campaign', 'profile_card');

  if (profile?.referral_code) {
    url.searchParams.set('ref', profile.referral_code);
  } else if (profile?.id) {
    url.searchParams.set('creator', profile.id);
  }

  return url.toString();
};

// Helper: Robust Date Checker
const isSameDay = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const checkDate = new Date(dateString);
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
};

const unwrapFunctionData = (payload) => payload?.success ? payload.data : payload;

const getFunctionErrorMessage = async (error, fallback) => {
  const contextBody = await error?.context?.json?.().catch(() => null);
  return contextBody?.error || error?.message || fallback;
};

const getUploadFileKey = (file, index = 0) => `${index}-${file.name}-${file.size}-${file.lastModified || 0}`;

const uploadFileWithProgress = (signedUrl, file, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`R2 Upload failed with HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("R2 Upload failed"));
    xhr.send(file);
});

// Helper: Clean Cloudflare R2 Uploads
const uploadFilesToR2 = async (files, userId, folderPrefix, maxSizeBytes, showToast, onProgress) => {
    let uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size === 0) continue;

        if (file.size > maxSizeBytes) {
            onProgress?.({ file, index: i, progress: 0, status: "Failed" });
            showToast(`"${file.name}" exceeds the size limit. Please choose a smaller file.`, "error");
            throw new Error("File size limit exceeded");
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const filePath = folderPrefix ? `${folderPrefix}/${userId}/${Date.now()}_${safeName}` : `${userId}/${Date.now()}_${safeName}`; 

        try {
            onProgress?.({ file, index: i, progress: 5, status: "Preparing" });
            const { data: presignData, error: presignError } = await supabase.functions.invoke('generate-r2-url', {
                body: { fileName: filePath, fileType: file.type }
            });

            if (presignError || !presignData?.signedUrl) throw new Error("Could not get secure upload link.");

            onProgress?.({ file, index: i, progress: 12, status: "Uploading" });
            if (onProgress) {
                await uploadFileWithProgress(presignData.signedUrl, file, (progress) => {
                    onProgress({ file, index: i, progress: Math.max(12, progress), status: "Uploading" });
                });
            } else {
                const uploadRes = await fetch(presignData.signedUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type || 'application/octet-stream' }
                });

                if (!uploadRes.ok) throw new Error("R2 Upload failed");
            }

            if (folderPrefix === 'jobs') {
                 uploadedUrls.push(presignData.publicUrl);
            } else {
                 const baseUrl = import.meta.env.VITE_R2_PUBLIC_URL.replace(/\/$/, "");
                 const cleanPath = filePath.replace(/^\//, "");
                 uploadedUrls.push(`${baseUrl}/${cleanPath}`);
            }
            onProgress?.({ file, index: i, progress: 100, status: "Uploaded" });
        } catch (err) {
            console.error("Upload Error:", err);
            onProgress?.({ file, index: i, progress: 0, status: "Failed" });
            showToast(`Failed to upload ${file.name}`, "error");
            throw err; 
        }
    }
    return uploadedUrls;
};

// ================================================================
// 💳 CENTRALIZED PAYMENT HELPER (Used by Chat & Bidding)
// ================================================================
const processCashfreePayment = async (params, onSuccess, onFail) => {
  const cashfree = new window.Cashfree({ mode: "production" }); 

  try {
    const { data: orderData, error: orderError } = await supabase.functions.invoke('payment-gateway', {
      body: { 
        action: 'CREATE_ORDER', amount: params.amount, customerPhone: params.customerPhone,
        freelancerId: params.freelancerId, appId: params.appId, userId: params.userId
      }
    });

    const createdOrderId = orderData?.order_id || orderData?.orderId;
    if (orderError || !orderData?.payment_session_id || !createdOrderId) throw new Error("Order creation failed.");

    await cashfree.checkout({
      paymentSessionId: orderData.payment_session_id,
      redirectTarget: "_modal" 
    });

    const { data: verifyData } = await supabase.functions.invoke('payment-gateway', {
      body: { action: 'VERIFY_ORDER', orderId: createdOrderId, appId: params.appId }
    });

    if (verifyData?.success) {
      const verifiedOrderId = verifyData.order_id || verifyData.orderId || verifyData?.order?.order_id || createdOrderId;
      onSuccess({ ...verifyData, order_id: verifiedOrderId, orderId: verifiedOrderId });
    } else {
      onFail("Payment not completed or failed.");
    }
  } catch (err) {
    console.error(err);
    onFail(err.message);
  }
};
// ================================================================

export const useDashboardLogic = (user, setUser, showToast) => {
  const isClient = user?.type === 'client';
   
  // --- UI & TAB STATES ---
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  // --- REPORTING STATE ---
  const [reportModal, setReportModal] = useState(null); 

  // --- DATA STATES ---
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });
  const [totalEarnings, setTotalEarnings] = useState(0);

  // --- INTERACTION STATES ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const [modal, setModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); 
  const [selectedApp, setSelectedApp] = useState(null);
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [deliveryUploadProgress, setDeliveryUploadProgress] = useState({});
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
   
  // --- ENERGY & REWARD STATES ---
  const [energy, setEnergy] = useState(20);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const hasCheckedReward = useRef(false);

  // --- PROFILE VIEW STATE ---
  const [viewProfileId, setViewProfileId] = useState(null);
  const [publicProfileData, setPublicProfileData] = useState(null);
  const [editProfileModal, setEditProfileModal] = useState(false);
  
  // 🚀 PROFILE COMPLETION TRACKER & RATE STATE
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(500); // Default slider starting position
  const hasPromptedProfile = useRef(false);

  // --- KYC & QUIZ STATES ---
  const [kycFile, setKycFile] = useState(null); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // --- HYBRID DELIVERY STATES ---
  const [timelineApp, setTimelineApp] = useState(null);
  const [viewWorkApp, setViewWorkApp] = useState(null);
   
  const [searchTerm, setSearchTerm] = useState("");
  const [profileForm, setProfileForm] = useState(user ? { ...user } : {});
  const [paymentModal, setPaymentModal] = useState(null);

  // --- FEATURE STATES ---
  const [parentMode, setParentMode] = useState(Boolean(user?.parent_mode));
  const [unlockedSkills, setUnlockedSkills] = useState(user?.unlockedSkills || []);
  const [badges, setBadges] = useState([]);
  const [portfolioItems] = useState([]);
  const [rawPortfolioText, setRawPortfolioText] = useState("");
    
  const SAFE_QUIZZES = QUIZZES || {};
  const profileCardRef = useRef(null);
  const cashfree = useRef(null);
  const dashboardLoadRef = useRef({ key: null, promise: null });

  useEffect(() => {
    setParentMode(Boolean(user?.parent_mode));
  }, [user?.id, user?.parent_mode]);

  // --- DERIVED VALUES ---
  const currentXP = unlockedSkills.length * 500 + (badges.length * 200);
  const nextLevelXP = (Math.floor(currentXP / 2000) + 1) * 2000;
  const progressPercent = Math.min((currentXP / nextLevelXP) * 100, 100);
  const userLevel = Math.floor(currentXP / 2000) + 1;

  const filteredJobs = jobs.filter(job => 
    (job.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (job.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job.tags?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // --- LOGGING ---
  const logAction = async (actionType, details = {}) => {
    try {
      await supabase.from('audit_logs').insert({
        action: actionType,
        actor_id: user.id,
        details: { ...details, timestamp: new Date().toISOString(), ip_hint: "client_side_trigger" }
      });
    } catch (err) { console.error("Audit Logging Failed:", err); }
  };

  const handleParentModeChange = async (enabled) => {
    const nextValue = Boolean(enabled);
    const previousValue = parentMode;

    setParentMode(nextValue);

    if (isClient) {
      await logAction('PARENT_MODE_TOGGLE', { enabled: nextValue, local_only: true });
      return true;
    }

    try {
      const { error } = await supabase
        .from('freelancers')
        .update({ parent_mode: nextValue })
        .eq('id', user.id);

      if (error) throw error;

      setUser((prev) => prev ? { ...prev, parent_mode: nextValue } : prev);
      await logAction('PARENT_MODE_TOGGLE', { enabled: nextValue });
      showToast(nextValue ? "Parent Shield activated." : "Parent Shield deactivated.", "success");
      return true;
    } catch (err) {
      setParentMode(previousValue);
      showToast(err.message || "Could not update Parent Shield.", "error");
      return false;
    }
  };

  // ------------------------------------------
  // ⚡ ACTION: FETCH DIGILOCKER DATA (SDK SUCCESS)
  // ------------------------------------------
  const handleDigilockerSuccess = async (verificationId) => {
    showToast("Fetching Aadhaar details securely...", "info");
    try {
        const { data, error } = await supabase.functions.invoke('digilocker', {
            body: { action: 'GET_DOCUMENT', verification_id: verificationId, user_id: user.id }
        });

        if (error || !data?.success) throw new Error(data?.error || "DigiLocker failed.");

        setUser(prev => ({ 
            ...prev, 
            digilocker_verified: true, 
            kyc_status: 'age_verified', 
            dob: data.dob 
        }));
        showToast(`Age Verified! Please enter your PAN.`, "success");
    } catch (err) {
        showToast(err.message, "error");
    }
  };

  // ------------------------------------------
  // 🏆 EXCLUSIVE TIME-BASED BADGE CHECKER
  // ------------------------------------------
  const checkAndAwardExclusiveBadges = async (currentBadges) => {
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      
      let newBadge = null;
      let badgeIcon = '';
      let energyBonus = 0;

      // 1. Check Night Owl (12 AM to 5 AM)
      if (currentHour >= 0 && currentHour < 5 && !currentBadges.some(b => b.name === 'Night Owl')) {
          newBadge = 'Night Owl';
          badgeIcon = 'Moon';
          energyBonus = 15;
      }
      // 2. Check Weekend Warrior (Saturday or Sunday)
      else if ((currentDay === 0 || currentDay === 6) && !currentBadges.some(b => b.name === 'Weekend Warrior')) {
          newBadge = 'Weekend Warrior';
          badgeIcon = 'Swords';
          energyBonus = 20;
      }
      // 3. Check Early Adopter
      else if (user?.created_at) {
          const joinDate = new Date(user.created_at);
          const cutoffDate = new Date('2026-12-31T23:59:59Z');
          if (joinDate < cutoffDate && !currentBadges.some(b => b.name === 'Early Adopter')) {
              newBadge = 'Early Adopter';
              badgeIcon = 'Rocket';
              energyBonus = 50;
          }
      }

      if (newBadge) {
          const { error } = await supabase.from('user_badges').insert({
              user_id: user.id,
              badge_name: newBadge
          });

          if (!error) {
              setBadges(prev => [...prev, { name: newBadge, icon: badgeIcon }]);
              const reward = await api.awardEnergy(user.id, energyBonus, 'secret_badge', newBadge);
              if (reward.success) {
                setEnergy(prev => prev + reward.amount);
                showToast(`🎉 SECRET UNLOCKED: ${newBadge} Badge! +${reward.amount} Energy ⚡`, "success");
              } else {
                showToast(`🎉 SECRET UNLOCKED: ${newBadge} Badge!`, "success");
              }
              
              await logAction('EXCLUSIVE_BADGE_UNLOCKED', { badge: newBadge });
          }
      }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (window.Cashfree) {
      cashfree.current = new window.Cashfree({ mode: "production" });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadKey = `${user.id}:${user.type || ''}:${isClient ? 'client' : 'freelancer'}`;

    const loadData = async () => {
        if (jobs.length === 0) setIsLoading(true);
        try {
            if (dashboardLoadRef.current.key !== loadKey || !dashboardLoadRef.current.promise) {
                dashboardLoadRef.current = {
                    key: loadKey,
                    promise: (async () => {
                        const dashboardPromise = api.fetchDashboardData(user);
                        const badgesPromise = supabase.from('user_badges').select('badge_name, badges(icon)').eq('user_id', user.id);
                        const userProfilePromise = isClient
                            ? Promise.resolve({ data: null })
                            : supabase
                                .from('freelancers')
                                .select('energy_points, last_login_date, qualification, specialty, resume_url, hourly_rate, current_plan, plan_expires_at, bids_remaining, resumes_remaining, wallet_balance')
                                .eq('id', user.id)
                                .single();

                        const [badgeRes, dashboardRes, profileRes] = await Promise.all([badgesPromise, dashboardPromise, userProfilePromise]);
                        return { badgeRes, dashboardRes, userProfileData: profileRes.data };
                    })(),
                };
            }

            const { badgeRes, dashboardRes, userProfileData } = await dashboardLoadRef.current.promise;
            if (!isMounted) return;

            if (!isClient && userProfileData) {
                const normalizedProfile = normalizeExpiredSubscription(userProfileData);
                if (normalizedProfile !== userProfileData) {
                    try {
                        const { error: normalizeError } = await supabase.rpc('normalize_freelancer_subscription', { p_user_id: user.id });
                        if (normalizeError) console.warn('Subscription refresh failed:', normalizeError);
                    } catch (err) {
                        console.warn('Subscription refresh failed:', err);
                    }
                }
                const planFields = {
                    current_plan: normalizedProfile.current_plan,
                    plan_expires_at: normalizedProfile.plan_expires_at,
                    bids_remaining: normalizedProfile.bids_remaining,
                    resumes_remaining: normalizedProfile.resumes_remaining,
                    wallet_balance: normalizedProfile.wallet_balance,
                };
                const hasPlanDrift = Object.entries(planFields).some(([key, value]) => user?.[key] !== value);
                if (hasPlanDrift) {
                    setUser(prev => ({ ...prev, ...planFields }));
                }

                setEnergy(userProfileData.energy_points || 20);
                if (userProfileData.hourly_rate) setHourlyRate(userProfileData.hourly_rate);

                if (!userProfileData.qualification || !userProfileData.specialty) {
                    setNeedsProfileSetup(true);
                }

                if (!hasCheckedReward.current) {
                    if (!userProfileData.last_login_date || !isSameDay(userProfileData.last_login_date)) {
                        hasCheckedReward.current = true;
                        setTimeout(() => setShowRewardModal(true), 1500);
                    } else {
                        hasCheckedReward.current = true;
                    }
                }
            }

            const formattedBadges = badgeRes.data?.map(b => ({
                name: b.badge_name,
                icon: b.badges?.icon || 'Award'
            })) || [];
            const visibleBadges = isClient
                ? formattedBadges
                : filterSubscriptionBadgesForPlan(formattedBadges, userProfileData ? normalizeExpiredSubscription(userProfileData) : user);
            setBadges(visibleBadges);

            // 🚀 Trigger the exclusive badge checker!
            if (!isClient) {
                checkAndAwardExclusiveBadges(visibleBadges);
            }

            const { services, jobs, applications, notifications, referralCount, error } = dashboardRes;
            if (!error) {
                setServices(services);
                setJobs(jobs);
                setApplications(applications);
                setNotifications(notifications);
                setReferralStats({ count: referralCount, earnings: referralCount * 50 });
                
                // 🚀 DYNAMIC COMMISSION CALCULATOR
                const commissionRate = getCommissionRate(getEffectivePlanName(userProfileData));
                
                const total = applications.reduce((acc, curr) => {
                      if (curr.status === 'Paid') {
                          const amount = Number(curr.bid_amount) || 0;
                          return isClient ? acc + amount : acc + (amount * (1 - commissionRate)); 
                      }
                      return acc;
                }, 0);
                setTotalEarnings(total);
            }
        } catch (err) {
            showToast("Dashboard sync failed: " + err.message, "error");
        } finally {
            if (dashboardLoadRef.current.key === loadKey) {
                dashboardLoadRef.current = { key: null, promise: null };
            }
            if (isMounted) setIsLoading(false);
        }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user, isClient, showToast]); 

  useEffect(() => {
    if (!user?.id) return undefined;

    let stopForegroundMessages = () => {};
    listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'TeenVerse alert';
      const body = payload.notification?.body || payload.data?.body;
      if (!body) return;

      showToast(body, 'info');
      showBrowserNotification({
        title,
        body,
        tag: payload.data?.tag || `fcm-${Date.now()}`,
        url: payload.data?.url || '/dashboard'
      });
    }).then((unsubscribe) => {
      stopForegroundMessages = unsubscribe;
    });

    const notificationsChannel = supabase
      .channel(`dashboard-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new;
          if (!notification?.message) return;

          setNotifications(prev => [
            notification,
            ...prev.filter(item => item.id !== notification.id)
          ].slice(0, 20));

          showToast(notification.message, 'info');
          showBrowserNotification({
            title: 'TeenVerse alert',
            body: notification.message,
            tag: `notification-${notification.id || notification.created_at || Date.now()}`,
            url: '/dashboard'
          });
        }
      )
      .subscribe();

    const jobsChannel = isClient
      ? null
      : supabase
          .channel(`freelancer-jobs-${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'jobs' },
            (payload) => {
              const job = payload.new;
              if (!job?.id) return;

              setJobs(prev => [
                job,
                ...prev.filter(item => item.id !== job.id)
              ].slice(0, 20));
            }
          )
          .subscribe();

    return () => {
      stopForegroundMessages();
      supabase.removeChannel(notificationsChannel);
      if (jobsChannel) supabase.removeChannel(jobsChannel);
    };
  }, [user?.id, isClient, showToast]);

  // 🚀 SMART TRIGGER FOR PROFILE MODAL
  useEffect(() => {
     if (!isLoading && !isClient && needsProfileSetup && !showRewardModal && !modal && !hasPromptedProfile.current) {
         hasPromptedProfile.current = true;
         setTimeout(() => setModal('complete_profile'), 1000);
     }
  }, [isLoading, isClient, needsProfileSetup, showRewardModal, modal]);

  const claimReward = async () => {
    setIsClaiming(true);
    const today = new Date().toISOString().split('T')[0];
    const reward = await api.claimDailyReward(user.id, today);
    
    if (reward.success) {
        setEnergy(prev => prev + reward.amount);
        showToast(`⚡ +${reward.amount} Energy Claimed!`, "success");
        await logAction('DAILY_REWARD_CLAIMED', { date: today, amount: reward.amount });
    } else {
        showToast("You have already claimed your reward for today!", "info");
    }
    
    setShowRewardModal(false);
    hasCheckedReward.current = true;
    setIsClaiming(false);
  };

  const handleEnablePushNotifications = async () => {
    const permission = await requestNotificationPermission(user.id);
    setNotificationPermission(permission);

    if (permission === 'granted') {
      showToast("Push alerts enabled.", "success");
      await showBrowserNotification({
        title: 'TeenVerse alerts enabled',
        body: 'You will get alerts for new jobs, applications, and task updates.',
        tag: 'push-alerts-enabled',
        url: '/dashboard'
      });
    } else if (permission === 'denied') {
      showToast("Notifications are blocked in your browser settings.", "warning");
    } else if (permission === 'unsupported') {
      showToast("This browser does not support push notifications.", "error");
    } else if (permission === 'missing-vapid-key') {
      showToast("Firebase VAPID key is missing. Add VITE_FIREBASE_VAPID_KEY.", "error");
    } else {
      showToast("Push alerts could not be enabled. Please try again.", "error");
    }
  };

  // ------------------------------------------
  // 💰 ACTION: REDEEM REFERRAL (2-STEP WALLET SYSTEM)
  // ------------------------------------------
  const handleRedeemReferral = async (referralCode) => {
    if (!referralCode || referralCode.trim() === "") {
        showToast("Please enter a valid code.", "warning");
        return;
    }

    showToast("Verifying code...", "info");
    
    const applyRes = await api.applyReferralCode(user.id, referralCode.trim());
    
    if (applyRes.success) {
        setUser(prev => ({ ...prev, referred_by: referralCode }));
        const isKycDone = user?.is_kyc_verified || ['verified', 'payout_ready', 'fully_verified'].includes(user?.kyc_status);
        
        if (isKycDone) {
            const claimRes = await api.claimReferralReward(user.id);
            if (claimRes.success) {
                showToast("Code applied & verified! ₹5 added to wallet 💰", "success");
                setUser(prev => ({ ...prev, wallet_balance: (Number(prev.wallet_balance) || 0) + 5 }));
            }
        } else {
            showToast("Code linked! Complete KYC to unlock your ₹5 reward 💰", "success");
        }
        setModal(null);
    } else {
        showToast(applyRes.error, "error");
    }
  };

  // ------------------------------------------
  // 🔐 SMART LOCK SYSTEM (KYC STATE MACHINE)
  // ------------------------------------------
  const checkKycLock = (actionType) => {
    if (isClient) return true; 
    const hasAgeVerified = Boolean(
        user?.digilocker_verified ||
        user?.is_kyc_verified ||
        ['approved', 'verified', 'age_verified', 'payout_kyc_pending', 'payout_ready', 'fully_verified'].includes(user?.kyc_status)
    );
    const hasPayoutKyc = Boolean(
        user?.is_kyc_verified ||
        ['approved', 'verified', 'payout_kyc_pending', 'payout_ready', 'fully_verified'].includes(user?.kyc_status)
    );

    if (actionType === 'apply_paid') {
        if (!hasAgeVerified) {
            showToast("🔒 Verify your age before applying for paid opportunities.", "info");
            setModal('kyc_verification');
            return false;
        }
    }

    if (actionType === 'withdraw_funds' || actionType === 'release_escrow') {
        if (!hasPayoutKyc) {
            showToast("🔒 Set up payout KYC before receiving funds.", "error");
            setModal('bank_linkage');
            return false;
        }
        if (!user.is_bank_linked) { 
            showToast("🏦 Please link your bank account to receive funds.", "info");
            setModal('bank_linkage'); 
            return false;
        }
    }

    return true; 
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportModal) return;

    const formData = new FormData(e.target);
    const resolvedTargetId = reportModal.target_id || reportModal.id || reportModal.job_id;
    let resolvedType = reportModal.target_type || reportModal.type;
    
    if (!resolvedType) {
        resolvedType = reportModal.bid_amount ? 'application' : 'job';
    }

    const resolvedReportedUser = reportModal.reported_user_id || reportModal.reportedId || reportModal.freelancer_id || reportModal.client_id;

    if (!resolvedTargetId) {
        showToast("Error: Content ID is missing. Cannot submit.", "error");
        return;
    }

    const reportData = {
        target_type: resolvedType,
        target_id: String(resolvedTargetId), 
        reported_user_id: resolvedReportedUser,
        reason: formData.get('reason'),
        description: formData.get('description')
    };

    showToast("Submitting report...", "info");
    const { error } = await api.submitReport(reportData);

    if (error) {
        showToast(error.message, "error");
    } else {
        showToast("Report submitted successfully.", "success");
        setReportModal(null);
    }
  };

  // ------------------------------------------
  // ⚡ ACTION: IDENTITY VERIFICATION (V2)
  // ------------------------------------------
  const handleIdentitySubmit = async ({ ageGroup, panNumber, digilocker_verified, dob, guardianConsent, guardianName, consentIp, consentUserAgent, consentVersion, closeModal = true }) => {
    showToast("Finalizing Identity Verification...", "info");

    try {
        const { data, error: fnError } = await supabase.functions.invoke('pan', {
            body: { 
                action: 'SAVE_KYC_DATA', user_id: user.id, age_group: ageGroup,
                dob: dob, pan_number: panNumber, digilocker_verified: digilocker_verified,
                guardian_consent: guardianConsent, guardian_name: guardianName,
                consent_ip: consentIp, consent_user_agent: consentUserAgent, consent_version: consentVersion 
            }
        });

        if (fnError) throw new Error(fnError.message || "Verification Service Unreachable");
        if (!data.success) throw new Error(data.error || "Identity Verification Failed");

        await logAction('IDENTITY_VERIFIED', { mode: KYC_MODE, age_group: ageGroup });
        showToast("Payout KYC verified. Add your bank details to receive payouts.", "success");
        
        setUser(prev => ({ 
            ...prev, kyc_status: 'payout_kyc_pending', is_kyc_verified: true,
            kyc_type: ageGroup, dob: dob, digilocker_verified: true
        }));
        
        if (!badges.some(b => b.name === 'Verified')) {
            setBadges(prev => [...prev, { name: 'Verified', icon: 'ShieldCheck' }]);
            await supabase.from('user_badges').insert({ user_id: user.id, badge_name: 'Verified' });
            setTimeout(() => showToast("🏆 BADGE UNLOCKED: Verified Identity!", "success"), 1000);
        }

        if (closeModal) setModal(null);
        
        const reward = await api.claimReferralReward(user.id);
        if (reward?.success) {
            setTimeout(() => {
                showToast("🎉 Referral Bonus Unlocked! ₹5 added to wallet.", "success");
                setUser(prev => ({ ...prev, wallet_balance: (Number(prev.wallet_balance) || 0) + 5 }));
            }, 2000);
        }

        return true; 

    } catch (err) {
        console.error(err);
        showToast("Identity check failed: " + err.message, "error");
        return false;
    }
  };

  // ------------------------------------------
  // 🏦 ACTION: BANK ACCOUNT
  // ------------------------------------------
  const handleBankSubmit = async (bankPayload = {}, ageGroup = 'adult') => {
    const safePayload = {
        account_holder_name: String(bankPayload.account_holder_name || '').trim(),
        account_number: String(bankPayload.account_number || '').trim(),
        ifsc_code: String(bankPayload.ifsc_code || '').trim().toUpperCase(),
        bank_name: String(bankPayload.bank_name || '').trim(),
        guardian_name: String(bankPayload.guardian_name || '').trim(),
        guardian_relationship: String(bankPayload.guardian_relationship || '').trim(),
        consent: Boolean(bankPayload.consent),
        is_guardian_account: Boolean(bankPayload.is_guardian_account)
    };

    if (!safePayload.account_holder_name || !safePayload.account_number || !safePayload.ifsc_code) {
        showToast("Bank details are incomplete.", "error");
        return false;
    }

    const isMinor = ageGroup === 'minor';
    if (isMinor && (!safePayload.guardian_name || !safePayload.consent)) {
        showToast("Parent/guardian approval is required for payout setup.", "error");
        return false;
    }

    try {
        showToast("Saving payout details...", "info");

        const { data, error: bankError } = await supabase.functions.invoke('kyc-handler', {
            body: {
                action: 'LINK_BANK',
                user_id: user.id,
                age_group: isMinor ? 'minor' : 'adult',
                bank_details: safePayload
            }
        });

        if (bankError || !data?.success) {
            throw new Error(data?.error || bankError?.message || "Bank details could not be saved.");
        }

        const { error: linkError } = await supabase.rpc('mark_bank_linked', { 
            target_user_id: user.id 
        });

        if (linkError) throw linkError;

        if (setUser) {
            setUser(prevUser => ({
                ...prevUser,
                is_bank_linked: true,
                kyc_status: 'payout_ready'
            }));
        }

        showToast("Payout setup saved. You can now receive payouts.", "success");
        setModal(null);
        return true;
    } catch (err) {
        showToast(err.message || "Error saving payout details.", "error");
        return false;
    }
};

  // --- JOB & SERVICE ACTIONS ---
  // --- JOB & SERVICE ACTIONS ---
const handlePostJob = async (e) => {
    e.preventDefault();
    
    // 1. Security Check
    if (!checkKycLock('post_job')) return;
    
    // 2. Extract Form Data
    const formData = new FormData(e.target);
    const title = formData.get('title');
    
    // 🚀 Strict Parsing for Database
    const isEliteBoolean = formData.get('is_elite') === 'true';
    const budget = parseFloat(formData.get('budget')); // <-- Renamed back to 'budget' so it matches!
    
    const fileInput = e.target.querySelector('input[name="attachments"]');
    const files = fileInput ? Array.from(fileInput.files) : []; 
    
    // 3. Dynamic Minimum Budget Validation
    const minRequiredBudget = isEliteBoolean ? 500 : 100;
    
    if (budget < minRequiredBudget) {
        return showToast(`Minimum budget for ${isEliteBoolean ? 'Elite' : 'Normal'} projects is ₹${minRequiredBudget}`, "error"); 
    }
    
    if (title.length < 5) return showToast("Job title is too short", "error"); 
    
    // 4. Handle File Uploads (if any)
    let uploadedUrls = [];
    if (files.length > 0) {
        showToast("Uploading attachments to secure vault...", "info");
        try {
            uploadedUrls = await uploadFilesToR2(files, user.id, 'jobs', 10 * 1024 * 1024, showToast);
        } catch (_error) {
            return; // Exit early if upload failed
        }
    }

    // 5. Construct Payload
    const jobData = { 
        client_id: user.id, 
        client_name: user.name, 
        title: title, 
        budget: budget,             // ✅ Now perfectly defined
        is_elite: isEliteBoolean,   // ✅ Pure boolean
        job_type: 'Fixed', 
        duration: formData.get('duration'), 
        tags: formData.get('tags'), 
        description: formData.get('description'), 
        category: formData.get('category') || 'dev',
        attachments: uploadedUrls 
    };
    
    // 6. Save to Database
    const { data: createdJob, error } = await api.createJob(jobData);
    
    if (error) { 
        showToast(error.message, 'error'); 
    } else { 
        await logAction('JOB_POSTED', { 
            title: title, 
            budget: budget,         // ✅ Now perfectly defined
            is_elite: isEliteBoolean, 
            has_attachments: uploadedUrls.length > 0 
        });
        
        showToast(isEliteBoolean ? 'Elite Project Posted Successfully!' : 'Project Posted Successfully!', 'success'); 
        
        setModal(null); 
        setJobs([createdJob || jobData, ...jobs]); 
    }
};
  
  const handleDeleteJob = async (id) => {
    if(!window.confirm("Are you sure you want to delete this job?")) return;
    const { error } = await api.deleteJob(id);
    if (error) { showToast(error.message, 'error'); } 
    else { 
        await logAction('JOB_DELETED', { job_id: id });
        showToast('Job Deleted'); 
        setJobs(jobs.filter(j => j.id !== id)); 
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceData = {
      freelancer_id: user.id, freelancer_name: user.name, title: formData.get('title'),
      description: formData.get('description'), price: formData.get('price'),
      delivery_time: formData.get('delivery_time'), category: formData.get('category')
    };
    const { error } = await api.createService(serviceData);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast('Gig Created Successfully!'); setModal(null); setServices([serviceData, ...services]); }
  };

  const handleDeleteService = async (id) => {
    if(!window.confirm("Delete this gig?")) return;
    const { error } = await api.deleteService(id);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast('Service Deleted'); setServices(services.filter(s => s.id !== id)); }
  };

  const handleApplyJob = async (e, energyCost, educationConsent) => {
    e.preventDefault();

    if (parentMode) { showToast("Parent Mode Active 🛑", "error"); return; }
    if (!checkKycLock('apply_paid')) return; 
    
    if (!isClient && selectedJob) {
      const jobCategory = selectedJob.category || 'dev';
      if (!unlockedSkills.includes(jobCategory)) {
        setModal({ 
            type: 'skill_gate', 
            category: jobCategory, 
            jobTitle: selectedJob.title 
        });
        return; 
      }
    }

    // 🚀 SUBSCRIPTION CHECK
    const effectivePlan = getEffectivePlanName(user);
    if (effectivePlan !== 'Elite' && (user?.bids_remaining === undefined || user?.bids_remaining <= 0)) {
        showToast("You're out of bids for this month! Upgrade your plan to apply for more gigs.", "warning");
        setTab('pricing');
        return;
    }

    const parsedCost = Number(energyCost);
    if (isNaN(parsedCost) || parsedCost <= 0) {
        return showToast("System Error: Invalid energy cost detected.", "error");
    }

    if (energy < parsedCost) { 
        return showToast(`Low battery! 🪫 You need ${parsedCost} ⚡ to apply.`, "error"); 
    }

    showToast("Shooting your shot... 🚀", "info");
    const formData = new FormData(e.target);
    
    const { data, error } = await supabase.rpc('apply_for_job_with_energy', {
        p_job_id: selectedJob.id,
        p_freelancer_id: user.id,
        p_freelancer_name: user.name,
        p_client_id: selectedJob.client_id,
        p_cover_letter: formData.get('cover_letter'),
        p_bid_amount: formData.get('bid_amount'),
        p_is_educational_waiver_signed: educationConsent,
        p_energy_cost: parsedCost
    });

    if (error) { 
        showToast(error.message, 'error'); 
        return false;
    } else { 
        setEnergy(prev => prev - parsedCost);
        
        // 🚀 Deduct 1 bid locally so the UI updates immediately
        if (effectivePlan !== 'Elite') {
            setUser(prev => ({ 
                ...prev, 
                bids_remaining: Math.max(0, (prev.bids_remaining || 0) - 1) 
            }));
        }

        showToast('W application! 🎯 Proposal sent.', 'success'); 
        api.sendPushNotification({
            targetUserIds: [selectedJob.client_id],
            title: 'New application',
            body: `New application: ${selectedJob.title}`,
            url: '/dashboard'
        }).catch((pushError) => console.warn('Application push notification failed:', pushError));
        
        const newApp = {
            id: data.application_id, 
            job_id: selectedJob.id, 
            freelancer_id: user.id, 
            status: 'Pending', 
            bid_amount: formData.get('bid_amount'), 
            created_at: new Date().toISOString()
        };
        setApplications(prev => [newApp, ...prev]);
        setModal(null); 
        return true;
    }
  };

  const finalizeEscrowFunding = async (app, { orderId, walletDeduction = 0, walletBalance = null, message = "Payment Confirmed! Order Started." } = {}) => {
      const fundedAt = new Date().toISOString();

      await logAction('ESCROW_FUNDED', {
         order_id: orderId,
         amount: app.bid_amount,
         wallet_amount: walletDeduction
      });

      showToast(message, "success");
      await api.sendPushNotification({
          targetUserIds: [app.freelancer_id],
          title: 'Application accepted',
          body: 'Your application was accepted. The order has started.',
          url: '/dashboard'
      });

      if (walletDeduction > 0) {
        setUser(prev => ({
            ...prev,
            wallet_balance: walletBalance ?? Math.max(0, (Number(prev?.wallet_balance) || 0) - walletDeduction)
        }));
      }

      setApplications(prev => prev.map(a => a.id == app.id ? {
          ...a,
          status: 'Accepted',
          payment_status: 'Held',
          started_at: fundedAt,
          is_escrow_held: true
      } : a));

      setTimeout(async () => {
          const { applications: newApps } = await api.fetchDashboardData(user);
          if(newApps) setApplications(newApps);
      }, 1500);
  };

  const handleWalletEscrowFunding = async (app, walletDeduction, gatewayAmount = 0, orderId = null) => {
      showToast(gatewayAmount > 0 ? "Verifying payment and wallet..." : "Funding escrow from wallet...", "info");

      const { data, error } = await api.fundEscrowWithWallet({
        appId: app.id,
        walletDeduction,
        gatewayAmount,
        orderId
      });

      if (error || !data?.success) {
        showToast(error?.message || data?.error || "Wallet payment failed.", "error");
        return;
      }

      await finalizeEscrowFunding(app, {
        orderId: data.orderId || orderId || `wallet-${app.id}`,
        walletDeduction,
        walletBalance: data.walletBalance,
        message: walletDeduction > 0
          ? "Wallet payment confirmed! Escrow secured."
          : "Payment Confirmed! Order Started."
      });
  };

  const handleAcceptApplication = async (app, checkout = {}) => {
    if (isClient && !checkKycLock('accept_job')) return; 

    const totalAmount = Number(app.bid_amount) || 0;
    const walletBalance = Number(user?.wallet_balance) || 0;
    const walletDeduction = Math.min(
      Math.max(Number(checkout?.walletDeduction) || 0, 0),
      totalAmount
    );
    const requestedFinalPayable = Number(checkout?.finalPayable);
    const finalPayable = Math.max(
      0,
      Number.isFinite(requestedFinalPayable)
        ? requestedFinalPayable
        : totalAmount - walletDeduction
    );
    const isUsingWallet = walletDeduction > 0;

    if (isUsingWallet && walletBalance < walletDeduction) {
      showToast("Insufficient wallet balance for this checkout.", "error");
      return;
    }

    if (isUsingWallet && finalPayable === 0) {
      await handleWalletEscrowFunding(app, walletDeduction, 0, null);
      return;
    }

    if (!cashfree.current) { showToast("Payment Gateway initializing... please wait.", "error"); return; }
    showToast(isUsingWallet ? "Opening checkout for remaining amount..." : "Securing Payment Session...", "info");
    try {
      const { paymentSessionId, orderId, error } = await api.createEscrowSession(
        app.id, isUsingWallet ? finalPayable : totalAmount, app.freelancer_id, user.phone 
      );
      if (error) throw new Error(error.message || "Secure Session Failed");
      
      cashfree.current.checkout({
          paymentSessionId: paymentSessionId,
          redirectTarget: "_modal",
      }).then(() => {
          setTimeout(() => {
            if (isUsingWallet) {
              handleWalletEscrowFunding(app, walletDeduction, finalPayable, orderId);
            } else {
              handlePaymentVerification(orderId, app);
            }
          }, 2000);
      });
    } catch (err) { showToast(err.message, "error"); }
  };

  const handlePaymentVerification = async (orderId, app) => {
      showToast("Verifying Payment...", "info");
      const { success } = await api.verifyAndStartEscrow(orderId, app.id);
      
      if (success) {
         await finalizeEscrowFunding(app, { orderId });
      } else { showToast("Payment verification failed. Check if money was deducted.", "warning"); }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedApp) { showToast("Error: No active application selected.", "error"); return; }
    
    const formData = new FormData(e.target);
    const workLink = String(formData.get('work_link') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const files = formData.getAll('files').filter(file => file instanceof File && file.size > 0);
    
    if (!workLink && files.length === 0) {
        return showToast("Please provide a project link or attach at least one file.", "error");
    }

    const timestamp = new Date().toISOString();
    let uploadedWorkFiles = [];

    try {
      setIsSubmittingWork(true);

      if (files.length > 0) {
        setDeliveryUploadProgress(Object.fromEntries(
          files.map((file, index) => [getUploadFileKey(file, index), { progress: 0, status: "Queued" }])
        ));
        showToast("Uploading delivery files...", "info");
        uploadedWorkFiles = await uploadFilesToR2(
          files,
          user.id,
          'deliveries',
          5 * 1024 * 1024,
          showToast,
          ({ file, index, progress, status }) => {
            setDeliveryUploadProgress(prev => ({
              ...prev,
              [getUploadFileKey(file, index)]: { progress, status }
            }));
          }
        );
      }
    } catch {
      return;
    } finally {
      setIsSubmittingWork(false);
    }

    setDeliveryFiles([]);
    setDeliveryUploadProgress({});
    setModal(null);
    showToast("AI is checking whether your submission matches the project details.", "info");

    const clientBrief = [
      selectedApp.jobs?.title || selectedApp.job_title || selectedApp.title || 'Client project',
      selectedApp.jobs?.description || selectedApp.job_description || selectedApp.description || selectedApp.cover_letter || '',
    ].filter(Boolean).join('\n\n');
    const submittedWork = [
      workLink ? `Delivery link: ${workLink}` : '',
      uploadedWorkFiles.length ? `Uploaded files: ${uploadedWorkFiles.join(', ')}` : '',
      message ? `Freelancer note: ${message}` : '',
    ].filter(Boolean).join('\n\n');

    const { data: checkPayload, error: checkError } = await supabase.functions.invoke('check-freelancer-work', {
      body: {
        submissionId: selectedApp.id,
        clientBrief,
        submittedWork,
        workLink,
        message,
        workFiles: uploadedWorkFiles,
      }
    });

    if (checkError) {
      const message = await getFunctionErrorMessage(checkError, "AI review is temporarily unavailable. You can submit manually or try again.");
      showToast(message, "error");
      return;
    }

    const reviewPayload = unwrapFunctionData(checkPayload);
    const review = reviewPayload?.review || reviewPayload;
    if (!review?.decision) {
      showToast("AI review is temporarily unavailable. You can submit manually or try again.", "error");
      return;
    }

    const aiPatch = {
      ai_check_score: review.matchScore,
      ai_check_status: review.decision,
      ai_check_issues: review.missingOrUnclearItems || [],
      ai_check_suggestions: review.freelancerFeedback ? [review.freelancerFeedback] : [],
      ai_check_reason: review.reason,
      ai_checked_at: timestamp,
      ai_second_check_required: false,
      work_link: workLink,
      work_message: message,
      work_files: uploadedWorkFiles,
    };

    if (review.decision === 'needs_revision') {
      const suggestion = review.freelancerFeedback || review.missingOrUnclearItems?.[0] || "Please revise the submission and try again.";
      showToast(`Your submission needs revision before sending to the client. ${suggestion}`, "warning");
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...aiPatch } : a));
      setSelectedApp(null);
      return;
    }

    if (review.decision === 'needs_minor_clarification') {
      const clarification = review.freelancerFeedback || review.missingOrUnclearItems?.[0] || "Please clarify the missing or unclear details.";
      showToast(`Your work mostly matches, but please clarify these points. ${clarification}`, "warning");
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...aiPatch } : a));
      setSelectedApp(null);
      return;
    }

    showToast("Your work looks ready to send to the client.", "success");
    
    const { error } = await supabase.functions.invoke('order-manager', {
      body: { 
        action: 'SUBMIT_WORK', 
        appId: selectedApp.id, 
        userId: user.id, 
        payload: { work_link: workLink, message: message, files: uploadedWorkFiles }
      }
    });
    
    if (error) { showToast("Submission failed: " + error.message, "error"); } 
    else {
      await logAction('WORK_SUBMITTED', { app_id: selectedApp.id, has_link: Boolean(workLink), has_files: uploadedWorkFiles.length > 0 });
      showToast("Work Submitted Successfully!", "success");
      await api.sendPushNotification({
        targetUserIds: [selectedApp.client_id],
        title: 'Work submitted',
        body: 'A freelancer submitted work for your project.',
        url: '/dashboard'
      });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...aiPatch, status: APP_STATUS.SUBMITTED, submitted_at: timestamp } : a));
      setSelectedApp(null);
    }
  };

  const handleApproveWork = async (app) => {
    const prevApps = [...applications];
    setApplications(apps => apps.map(a => a.id === app.id ? { ...a, status: APP_STATUS.COMPLETED } : a));
    const { error } = await supabase.functions.invoke('order-manager', { body: { action: 'APPROVE_WORK', appId: app.id, userId: user.id } });
    if (!error) {
      await logAction('WORK_APPROVED', { app_id: app.id, freelancer_id: app.freelancer_id });
      showToast("Work Approved! Please release payment.", "success");
      await api.sendPushNotification({
        targetUserIds: [app.freelancer_id],
        title: 'Work approved',
        body: 'Your submitted work was approved.',
        url: '/dashboard'
      });
      setViewWorkApp(null);
    } else {
      setApplications(prevApps); 
      showToast(error.message, 'error');
    }
  };

  const generateAndStoreInvoice = async (app, baseAmount, customTitle = null) => {
    try {
      const doc = new jsPDF();
      const invoiceId = `INV-${Date.now().toString().slice(-8)}`;
      
      // 🚀 DYNAMIC COMMISSION RATE APPLIED TO INVOICE
      const commissionRate = getCommissionRate(getEffectivePlanName(user));
      const isFreelancer = user.type !== 'client'; 
      const fee = isFreelancer ? (baseAmount * commissionRate) : 0;
      const finalAmount = baseAmount - fee;

      const billedToName = isFreelancer ? "TeenVerseHub Payouts" : (user.name || "Client");
      const otherPartyLabel = isFreelancer ? "Payee (You):" : "Freelancer:";
      const otherPartyName = isFreelancer ? (user.name || "Freelancer") : (app.freelancer_name || "Freelancer");

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("TeenVerseHub Invoice", 20, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(isFreelancer ? "Payout Statement" : "Payment Receipt", 20, 26);
      
      doc.text(`Invoice ID: ${invoiceId}`, 20, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
      const titleToUse = customTitle || selectedJob?.title || 'Freelance Service';
      doc.text(`Job Title: ${titleToUse}`, 20, 55);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 65, 190, 65);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      
      doc.text(isFreelancer ? "Payer:" : "Billed To:", 20, 80);
      doc.setFont("helvetica", "normal");
      doc.text(billedToName, 20, 86);

      doc.setFont("helvetica", "bold");
      doc.text(otherPartyLabel, 120, 80); 
      doc.setFont("helvetica", "normal");
      doc.text(otherPartyName, 120, 86); 
      
      const boxHeight = isFreelancer ? 30 : 20;
      doc.setFillColor(248, 248, 248);
      doc.rect(115, 100, 80, boxHeight, 'F');

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      if (isFreelancer) {
          doc.text(`Gross Amount:`, 120, 108);
          doc.text(`₹${Number(baseAmount).toFixed(2)}`, 190, 108, { align: 'right' });
          
          doc.setTextColor(220, 50, 50); 
          // Format dynamically (e.g. 5% or 3.5%)
          const formattedRate = parseFloat((commissionRate * 100).toFixed(1)) + '%';
          doc.text(`Platform Fee (${formattedRate}):`, 120, 114); 
          doc.text(`- ₹${fee.toFixed(2)}`, 190, 114, { align: 'right' });
          
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "bold");
          doc.text(`Net Earnings:`, 120, 124); 
          doc.setFontSize(12);
          doc.text(`₹${finalAmount.toFixed(2)}`, 190, 124, { align: 'right' });
      } else {
          doc.setFontSize(12);
          doc.text(`Total Paid:`, 120, 113);
          doc.setFont("helvetica", "bold");
          doc.text(`₹${Number(baseAmount).toFixed(2)}`, 190, 113, { align: 'right' });
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("System generated document.", 20, 145);
      
      const pdfBlob = doc.output('blob');
      const filePath = `${user.id}/${app.id}_invoice.pdf`; 

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, pdfBlob, { upsert: true });

      if (uploadError) throw uploadError;

      return filePath;

    } catch (err) {
      console.error("Invoice Error:", err);
      showToast("Invoice generation failed.", "error");
      return null;
    }
  };

  const handleInvoiceDownload = async (app) => {
    let path = app.invoice_path;
    if (!path) {
      showToast("Invoice missing. Generating a new one...", "info");
      const relatedJob = jobs.find(j => j.id === app.job_id);
      path = await generateAndStoreInvoice(app, app.bid_amount, relatedJob?.title);
      if (!path) return;
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, invoice_path: path } : a));
    }
    const url = await api.getInvoiceUrl(path);
    if (url) window.open(url, '_blank');
  };

  const processPayment = async (escrowConsent) => {
    if (!paymentModal) return;
    const { appId, amount, freelancerId } = paymentModal;
    const { error } = await api.processPayment(appId, amount, freelancerId, escrowConsent);
    
    if (error) { showToast(error.message, 'error'); } 
    else { 
       await logAction('RELEASE_ESCROW', { app_id: appId, amount: amount });
       showToast("Payment Successful! Generating Invoice...", "success");
       await api.sendPushNotification({
         targetUserIds: [freelancerId],
         title: 'Payment released',
         body: 'Payment has been released for your project.',
         url: '/dashboard'
       });
       const targetApp = applications.find(a => a.id === appId);
       const invoicePath = await generateAndStoreInvoice(targetApp, amount);

       setApplications(apps => apps.map(a => a.id === appId ? { 
           ...a, status: APP_STATUS.PAID, paid_at: new Date().toISOString(), invoice_path: invoicePath 
       } : a));
       
       setPaymentModal(null);
       if (applications.filter(a => a.status === APP_STATUS.PAID).length === 0) {
          showToast("🏆 BADGE UNLOCKED: First Gig!", "success");
          setBadges([...badges, { name: 'First Gig', icon: 'Briefcase' }]);
       }
    }
  };

  const handleAppAction = async (action, app, payload = null) => {
    if (action === 'view_profile') { handleViewProfile(app.freelancer_id || app.id); return; }
    
    if (action === 'withdraw_funds') {
        checkKycLock('withdraw_funds'); 
        return;
    }

    if (action === 'report') {
        const reportData = app || payload; 
        setReportModal({
            target_type: reportData.target_type || 'job',
            target_id: reportData.id || reportData.target_id, 
            reported_user_id: reportData.reported_user_id
        });
        return;
    }

    const RESTRICTED = ['approve', 'pay', 'release_escrow'];
    if (parentMode && RESTRICTED.includes(action)) { showToast("Parent Mode Active: Action Locked", "error"); return; }
    
    if (action === 'initiate_payment') {
        if (!user?.phone) {
            showToast("Please update your phone number in profile settings first.", "error");
            return;
        }

        showToast("Opening Secure Checkout...", "info");

        await processCashfreePayment(
            {
               amount: app.bid_amount,
               customerPhone: user.phone,
               freelancerId: app.freelancer_id,
               appId: app.id,
               userId: user.id
            },
            async () => {
                const { error } = await supabase.from('applications')
                    .update({ status: 'Accepted', payment_status: 'Held' })
                    .eq('id', app.id);
                    
                if(!error) {
                    showToast("Payment Successful! Escrow Secured.", "success");
                    await api.sendPushNotification({
                        targetUserIds: [app.freelancer_id],
                        title: 'Application accepted',
                        body: 'Your application was accepted. The order has started.',
                        url: '/dashboard'
                    });
                    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Accepted', payment_status: 'Held' } : a));
                } else {
                     showToast("Payment verified, but failed to update dashboard.", "error");
                }
            },
            (errorMsg) => { showToast(errorMsg, "error"); }
        );
        return;
    }

    if (action === 'accept') { handleAcceptApplication(app, payload || {}); return; }
    
    if (action === 'pay' && !checkKycLock('release_escrow')) { return; }
    
    if (action === 'submit') { setSelectedApp(app); setModal('submit_work'); return; }
    if (action === 'view_submission') { setViewWorkApp(app); return; }
    if (action === 'verify_payment') { handlePaymentVerification(app.id, app.escrow_order_id); return; }
    
    const backendActionMap = { 'approve': 'APPROVE_WORK', 'pay': 'RELEASE_ESCROW', 'reject': 'REJECT_APPLICATION', 'revision': 'REQUEST_REVISION', 'review': 'SUBMIT_REVIEW' };
    const backendAction = backendActionMap[action];
    
    if (backendAction) {
        showToast(`Processing ${action}...`, "info");
        const { error } = await supabase.functions.invoke('order-manager', {
            body: { action: backendAction, appId: app.id, userId: user.id, payload: payload || {} }
        });

        if (error) {
             const errorBody = error.context?.json ? await error.context.json() : {};
             if (errorBody.isSecurityBlock) {
                 setParentMode(true);
                 await logAction('SECURITY_BLOCK_TRIGGERED', { action: action, app_id: app.id });
                 showToast("⛔ Security Block: Ask your parent to approve.", "error");
             } else { showToast(error.message || "Action Failed", "error"); }
        } else {
             await logAction('APP_ACTION_COMPLETED', { action: action, app_id: app.id });
             const now = new Date().toISOString();
             setApplications(prev => prev.map(a => {
                if (a.id !== app.id) return a;
                if (action === 'approve') return { ...a, status: 'Completed', completed_at: now };
                if (action === 'pay') return { ...a, status: 'Processing', is_escrow_held: true };
                if (action === 'reject') return { ...a, status: 'Rejected' };
                if (action === 'revision') return { ...a, status: 'Revision Requested' };
                if (action === 'review') return { ...a, client_rating: payload?.rating }; 
                return a;
             }));
             const statusPush = {
                approve: 'Your submitted work was approved.',
                pay: 'Payment is being processed for your project.',
                reject: 'Your application or delivery was rejected.',
                revision: 'A revision was requested for your project.',
                review: 'You received a new review.'
             }[action];
             if (statusPush) {
                await api.sendPushNotification({
                    targetUserIds: [app.freelancer_id],
                    title: 'Task update',
                    body: statusPush,
                    url: '/dashboard'
                });
             }
             showToast(action === 'pay' ? "Funds released to Admin for review." : "Action Successful!", "success");
             if (viewWorkApp) setViewWorkApp(null);
        }
    }
  };

  const handleViewProfile = async (freelancerId) => {
    showToast("Fetching Profile...", "info");
    const { user, badges, portfolio, projects, services, resume, error } = await api.getPublicProfile(freelancerId);
    if (error) {
      showToast(error.message || "Could not load profile", "error");
    } else {
      setPublicProfileData({ user, badges, portfolio, projects, services, resume });
      setViewProfileId(freelancerId);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (parentMode) { showToast("Parent Mode Restricted", "error"); return; }
    
    const tableName = isClient ? 'clients' : 'freelancers';
    const cleanUpdates = { name: profileForm.name, nationality: profileForm.nationality };
    if (!isClient) {
        Object.assign(cleanUpdates, { qualification: profileForm.qualification, specialty: profileForm.specialty, services: profileForm.services, upi: profileForm.upi, bank_name: profileForm.bank_name, account_number: profileForm.account_number, ifsc_code: profileForm.ifsc_code });
    } else { cleanUpdates.is_organisation = profileForm.is_organisation; }
    
    const { error } = await api.updateUserProfile(user.id, cleanUpdates, tableName);
    if (error) { showToast(error.message, 'error'); } 
    else { await logAction('PROFILE_UPDATED', { updated_fields: Object.keys(cleanUpdates) }); showToast("Credentials updated successfully!", "success"); setUser({ ...user, ...cleanUpdates }); }
  };

  const handleSavePublicProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
        bio: formData.get('bio'), tag_line: formData.get('tag_line'),
        social_links: { github: formData.get('github'), instagram: formData.get('instagram'), linkedin: formData.get('linkedin'), website: formData.get('website') }
    };
    const tableName = isClient ? 'clients' : 'freelancers';
    const { error } = await api.updateUserProfile(user.id, updates, tableName);
    if (error) { showToast(error.message, 'error'); } 
    else { await logAction('PUBLIC_PROFILE_UPDATED', {}); showToast("Public profile updated!", "success"); setUser({ ...user, ...updates }); setEditProfileModal(false); }
  };

  // 🚀 NEW: COMPLETE PROFILE FORM HANDLER (Link Only)
  const handleCompleteProfileSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const updates = {
          qualification: formData.get('qualification'),
          specialty: formData.get('specialty'),
          hourly_rate: Number(formData.get('hourly_rate')),
          // Get the URL if provided, otherwise leave it empty
          projects: formData.get('project_url') || null 
      };

      showToast("Saving profile...", "info");
      try {
          const { error } = await api.updateUserProfile(user.id, updates, 'freelancers');
          if (error) throw error;

          setUser({ ...user, ...updates });
          setNeedsProfileSetup(false);
          setModal(null);
          
          const reward = await api.awardEnergy(user.id, 10, 'profile_complete');
          if (reward.success) setEnergy(prev => prev + reward.amount);
          showToast(`Profile Complete!${reward.success ? ` +${reward.amount} Energy ⚡` : ''}`, "success");
          
      } catch (err) {
          showToast("Failed to save profile: " + err.message, "error");
      }
  };

  const startAiQuiz = async (categoryId, specificTopic = 'Basics') => {
    setIsQuizLoading(true);
    setModal(null); 
    showToast(`🤖 Generating ${specificTopic} assessment...`, "info");

    try {
      const { data, error } = await supabase.functions.invoke('generate-academy-quiz', {
        body: { userId: user.id, category: categoryId, topic: specificTopic, subCategory: specificTopic, level: 'beginner', count: 10 }
      });
      if (error) throw new Error(await getFunctionErrorMessage(error, "Quiz generation failed."));
      const quizData = unwrapFunctionData(data);
      setModal({ type: 'quiz', category: categoryId, data: quizData });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Quiz generation failed. Try again.", "error");
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleQuizSelection = async (categoryId, passed, isGeneral = false) => {
    if (passed) {
      setTimeout(async () => {
        if (isGeneral) {
             const reward = await api.awardEnergy(user.id, 2, 'quiz_general', categoryId);
             if (reward.success) setEnergy(prev => prev + reward.amount);
             showToast(`🎉 Module Complete! +50 XP${reward.success ? ` & +${reward.amount} Energy ⚡` : ''}`, "success");
             setModal(null); setScore(0); setCurrentQuestionIndex(0);
             return;
        }

        const newSkills = [...unlockedSkills, categoryId];
        setUnlockedSkills(newSkills);
        await api.unlockSkill(user.id, newSkills); 
        setUser({ ...user, unlockedSkills: newSkills });
        
        const reward = await api.awardEnergy(user.id, 5, 'skill_certified', categoryId);
        if (reward.success) setEnergy(prev => prev + reward.amount);
        
        if (!badges.some(b => b.name === 'Skill Certified')) {
            setBadges(prev => [...prev, { name: 'Skill Certified', icon: 'Award' }]);
            await supabase.from('user_badges').insert({ user_id: user.id, badge_name: 'Skill Certified' });
        }
        
        showToast(`🏆 CERTIFIED! +500 XP${reward.success ? ` & +${reward.amount} Energy ⚡` : ''}`, "success");
        setModal(null); setScore(0); setCurrentQuestionIndex(0);

      }, 1000);
    } else {
        showToast("❌ Failed. Try again to earn rewards.", "error");
    }
  };

  const handleDownloadCard = async () => {
    if (profileCardRef.current === null) { showToast("Card not found.", "error"); return; }
    try {
      showToast("Generating HQ Image...", "info");
      const dataUrl = await toPng(profileCardRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `TeenVerse-${user.name}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Downloaded successfully!", "success");
    } catch (err) { showToast("Failed to download image: " + err.message, "error"); }
  };

  const handleShareToInstagram = async () => {
    if (profileCardRef.current === null) return;
    try {
      showToast("Preparing Instagram-ready share...", "info");
      const blob = await toBlob(profileCardRef.current, { cacheBust: true, pixelRatio: 2 });
      if (!blob) throw new Error('Failed to generate image');

      const safeName = (user.name || 'TeenVerse-Creator').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '');
      const file = new File([blob], `TeenVerse-${safeName}.png`, { type: 'image/png' });
      const storyJoinUrl = buildInstagramStoryJoinUrl(user);
      const shareText = `${user.name || 'A TeenVerse creator'} on TeenVerseHub: ${user.specialty || user.tag_line || 'verified teen talent'}\nJoin from this story: ${storyJoinUrl}`;
      const shareData = {
        files: [file],
        title: 'My TeenVerse Profile',
        text: shareText,
        url: storyJoinUrl,
      };

      try {
        await navigator.clipboard?.writeText(storyJoinUrl);
      } catch (_err) {
        // Clipboard is a helpful bonus for Instagram link stickers, not a blocker.
      }

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showToast("Shared. Your story join link is copied for Instagram's link sticker.", "success");
      } else if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareData.title, text: shareText });
        showToast("Shared. Paste the copied link into Instagram's link sticker.", "success");
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `TeenVerse-${safeName}.png`;
        link.href = objectUrl;
        link.click();
        URL.revokeObjectURL(objectUrl);
        showToast("Downloaded card and copied the story join link for Instagram.", "info");
      }
    } catch (err) { if (err.name !== 'AbortError') showToast("Failed to share: " + err.message, "error"); }
  };

  const handleClearNotifications = async () => {
      try {
        const { error } = await api.clearUserNotifications(user.id);
        if (error) showToast(error.message, 'error');
        else { setNotifications([]); showToast("Notifications cleared", "success"); }
      } catch (err) { showToast(err.message, "error"); }
  };

  // ------------------------------------------
  // 💳 ACTION: SUBSCRIBE (SPLIT PAYMENT & BADGES)
  // ------------------------------------------
  const handleSubscribe = async (plan, isAnnual, walletDeduction, finalPayable) => {
    
    // Helper to instantly add the badge to UI
    const awardBadgeLocally = (planName) => {
        let icon = 'Gem'; // 💎 Pro Icon
        if (planName === 'Starter') icon = 'Zap'; // ⚡ Starter Icon
        if (planName === 'Elite') icon = 'Crown'; // 👑 Elite Icon
        
        if (!badges.some(b => b.name === planName)) {
            setBadges(prev => [...prev, { name: planName, icon }]);
            setTimeout(() => showToast(`🏆 UNLOCKED: Premium ${planName} Status!`, "success"), 1000);
        }
    };

    // SCENARIO 1: Paid entirely with Wallet
    if (finalPayable === 0) {
        showToast("Securing subscription via Wallet...", "info");
        
        const { data, error } = await supabase.functions.invoke('process-subscription', {
            body: { 
                planId: plan.planId, 
                planName: plan.name, 
                amount: 0, 
                isAnnual, 
                useWallet: true,
                walletDeduction
            }
        });

        if (error || !data?.success) {
            return showToast(data?.error || "Upgrade failed.", "error");
        }
        
        showToast(`🎉 Welcome to ${plan.name}! Limits updated.`, "success");
        
        setUser(prev => ({ 
            ...prev, 
            current_plan: data.profile?.current_plan || plan.name,
            plan_expires_at: data.profile?.plan_expires_at,
            wallet_balance: Math.max(0, prev.wallet_balance - walletDeduction),
            bids_remaining: data.profile?.bids_remaining ?? getPlanLimits(plan.name).bids_remaining,
            resumes_remaining: data.profile?.resumes_remaining ?? getPlanLimits(plan.name).resumes_remaining
        }));
        
        awardBadgeLocally(plan.name); // 🚀 Trigger Badge
        return;
    }

    // SCENARIO 2: Gateway Payment Required (Split or Full)
    showToast("Opening Secure Checkout...", "info");
    
    const tempOrderId = `SUB_${plan.planId}_${Date.now()}`;
    
    await processCashfreePayment(
        {
           amount: finalPayable,
           customerPhone: user.phone,
           freelancerId: user.id,
           appId: tempOrderId, 
           userId: user.id
        },
        async (verifyData) => {
            showToast("Payment received! Activating plan...", "info");
            
            const { data, error } = await supabase.functions.invoke('process-subscription', {
                body: { 
                    planId: plan.planId, 
                    planName: plan.name, 
                    amount: finalPayable,
                    walletDeduction: walletDeduction,
                    isAnnual, 
                    useWallet: walletDeduction > 0,
                    orderId: verifyData.order_id || verifyData.orderId
                }
            });

            if (error || !data?.success) {
                 return showToast(data?.error || "Upgrade failed during verification.", "error");
            }

            showToast(`🎉 Welcome to ${plan.name}! Limits updated.`, "success");
            setUser(prev => ({ 
                ...prev, 
                current_plan: data.profile?.current_plan || plan.name,
                plan_expires_at: data.profile?.plan_expires_at,
                wallet_balance: data.profile?.wallet_balance ?? Math.max(0, prev.wallet_balance - walletDeduction),
                bids_remaining: data.profile?.bids_remaining ?? getPlanLimits(plan.name).bids_remaining,
                resumes_remaining: data.profile?.resumes_remaining ?? getPlanLimits(plan.name).resumes_remaining
            }));
            
            awardBadgeLocally(plan.name); // 🚀 Trigger Badge
        },
        (errorMsg) => { showToast(errorMsg, "error"); }
    );
  };

  // ------------------------------------------
  // 📝 ACTION: SECURE RESUME LIMITER
  // ------------------------------------------
  const handleUseResume = async () => {
      const effectivePlan = getEffectivePlanName(user);
      if (effectivePlan !== 'Elite' && (user?.resumes_remaining === undefined || user?.resumes_remaining <= 0)) {
          showToast("You've reached your monthly resume limit! Please upgrade your plan.", "warning");
          setTab('pricing'); 
          return false;
      }

      if (effectivePlan !== 'Elite') {
          const { data, error } = await supabase.rpc('decrement_resume_limit', { p_user_id: user.id });
          
          if (error || !data?.success) {
              showToast(data?.error || "Failed to verify resume limits.", "error");
              return false;
          }
          
          setUser(prev => ({ 
              ...prev, 
              resumes_remaining: Math.max(0, (prev.resumes_remaining || 0) - 1) 
          }));
      }
      
      showToast("Resume slot used successfully!", "success");
      return true;
  };

  return {
    state: {
        isClient, tab, menuOpen, zenMode, isLoading, jobs, services, applications, notifications,
        referralStats, totalEarnings, showNotifications, modal, selectedJob, selectedApp,
        deliveryFiles, deliveryUploadProgress, isSubmittingWork,
        notificationPermission, energy, showRewardModal, isClaiming, viewProfileId, publicProfileData, editProfileModal,
        kycFile, currentQuestionIndex, score, timelineApp, viewWorkApp, searchTerm, profileForm,
        paymentModal, parentMode, unlockedSkills, badges, portfolioItems, rawPortfolioText,
        SAFE_QUIZZES, profileCardRef, currentXP, nextLevelXP, progressPercent,
        userLevel, filteredJobs,
        isQuizLoading, 
        reportModal, activeChat,
        hourlyRate, 
        needsProfileSetup
    },
    setters: {
        setTab, setMenuOpen, setZenMode, setModal, setSelectedJob, setShowRewardModal,
        setDeliveryFiles, setDeliveryUploadProgress,
        setKycFile, setScore, setCurrentQuestionIndex, setTimelineApp, setViewWorkApp,
        setSearchTerm, setProfileForm, setPaymentModal, setParentMode, setRawPortfolioText,
        setEditProfileModal, setViewProfileId, setPublicProfileData, setShowNotifications, setApplications,
        setReportModal, setActiveChat,
        setHourlyRate 
    },
    actions: {
        handlePostJob, 
        handleDeleteJob, handleCreateService, handleDeleteService,
        handleApplyJob, handleAcceptApplication, handlePaymentVerification, handleSubmitWork,
        handleApproveWork, handleInvoiceDownload, processPayment, handleAppAction, handleViewProfile,
        handleUpdateProfile, handleSavePublicProfile, handleQuizSelection,
        handleDownloadCard, handleShareToInstagram, handleClearNotifications, claimReward,
        handleIdentitySubmit, 
        handleBankSubmit,
        startAiQuiz,
        handleReportSubmit,
        handleCompleteProfileSubmit,
        handleDigilockerSuccess,
        handleRedeemReferral,
        handleSubscribe,
        handleUseResume,
        handleParentModeChange,
        handleEnablePushNotifications
    }
  };
};
