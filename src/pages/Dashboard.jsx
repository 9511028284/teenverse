import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Menu, LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, Sparkles, Settings, LogOut, 
  Award, Sun, Moon, Bell, Search, Filter, PlusCircle, Zap, Lock, Check, Clock, Trash2, ThumbsUp, CreditCard, 
  Receipt, X, CheckCircle, Package, Save, Share2, Download, 
  Trophy, Unlock, Swords, Heart, Crown, ShieldCheck, FileCheck, Maximize2, Minimize2, User, ListChecks, ChevronRight, Eye
} from 'lucide-react';

// --- SUPABASE & UTILS ---
import { supabase } from '../supabase';
import { CATEGORIES, COLORS, QUIZZES, BATTLES, PRICING_PLANS } from '../utils/constants';
import { APP_STATUS, NEXT_ALLOWED_STATE } from '../utils/status';

// UI Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

// Features
import ChatSystem from '../components/features/ChatSystem';
import Overview from '../components/dashboard/Overview';
import Jobs from '../components/dashboard/Jobs';
import MyServices from '../components/dashboard/MyServices';
import ClientPostedJobs from '../components/dashboard/ClientPostedJobs';
import Applications from '../components/dashboard/Applications';
import Academy from '../components/dashboard/Academy';
import Portfolio from '../components/dashboard/Portfolio';
import ProfileCard from '../components/dashboard/ProfileCard';
import Records from '../components/dashboard/Records';
import SettingsComp from '../components/dashboard/SettingsComp';
import OrderTimeline from '../components/dashboard/OrderTimeline';

// Services
import * as api from '../services/dashboard.api';

// Modals
import PostJobModal from '../components/modals/PostJobModal';
import CreateServiceModal from '../components/modals/CreateServiceModal';
import ApplyJobModal from '../components/modals/ApplyJobModal';
import PaymentModal from '../components/modals/PaymentModal';

import html2canvas from 'html2canvas';

// --- HELPER COMPONENT: BADGE ITEM ---
const BadgeItem = ({ name, iconName }) => {
  const IconMap = { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock };
  const Icon = IconMap[iconName] || Award;

  const colors = {
    trust: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    fun: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    skill: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    work: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    safety: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  };

  let cat = 'fun';
  if (['Verified Teen', 'Parent Approved', 'KYC Completed'].includes(name)) cat = 'trust';
  if (['First Gig', 'Rising Talent'].includes(name)) cat = 'work';
  if (['Skill Certified', 'Academy Graduate'].includes(name)) cat = 'skill';
  if (['Safe User', 'Community Safe'].includes(name)) cat = 'safety';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colors[cat]}`}>
      <Icon size={12} />
      {name}
    </div>
  );
};

const Dashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme }) => {
  const isClient = user?.type === 'client';
  
  // --- UI & TAB STATES ---
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- DATA STATES ---
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });
  const [totalEarnings, setTotalEarnings] = useState(0);

  // --- INTERACTION STATES ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [modal, setModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // For job browsing
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // Specifically for Order actions

  // --- HYBRID DELIVERY STATES ---
  const [timelineApp, setTimelineApp] = useState(null);
  const [viewWorkApp, setViewWorkApp] = useState(null);
  const lastNotificationId = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileForm, setProfileForm] = useState(user ? { ...user } : {});
  const [paymentModal, setPaymentModal] = useState(null);

  // --- FEATURE STATES ---
  const [parentMode, setParentMode] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState(user?.unlockedSkills || []);
  const [badges, setBadges] = useState([]);
  
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [rawPortfolioText, setRawPortfolioText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [quizState, setQuizState] = useState({ selected : null, status: 'idle'});
  
  const SAFE_QUIZZES = QUIZZES || {};
  const profileCardRef = useRef(null);

  // --- CASHFREE REF ---
  const cashfree = useRef(null);

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

  // --- CASHFREE INITIALIZATION ---
  useEffect(() => {
    // Check if window.Cashfree exists (loaded from script tag in index.html)
    if (window.Cashfree) {
      cashfree.current = new window.Cashfree({
        mode: "sandbox" // Change to "production" for live
      });
    } else {
      console.error("Cashfree SDK script not loaded in index.html");
      showToast("Payment System Loading Error", "error");
    }
  }, [showToast]);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadData = async () => {
      if (jobs.length === 0) setIsLoading(true);

      // 1. Fetch Badges
      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('badge_name, badges(icon)')
        .eq('user_id', user.id);
    
      const formattedBadges = badgeData?.map(b => ({
        name: b.badge_name,
        icon: b.badges?.icon || 'Award'
      })) || [];

      // 2. Fetch Dashboard Data
      const { services, jobs: jobsData, applications: appsData, notifications: notifsData, referralCount, error } = 
        await api.fetchDashboardData(user);

      if (isMounted && !error) {
        setServices(services);
        setJobs(jobsData);
        setApplications(appsData);
        setNotifications(notifsData);
        setBadges(formattedBadges);
        setReferralStats({ count: referralCount, earnings: referralCount * 50 });

        // Calculate Earnings
        const total = appsData.reduce((acc, curr) => {
          if (curr.status === APP_STATUS.PAID) {
            const amount = Number(curr.bid_amount) || 0;
            return isClient ? acc + amount : acc + (amount * 0.96);
          }
          return acc;
        }, 0);
        setTotalEarnings(total);

        // Toast for new notifications
        if (notifsData.length > 0) {
          const latest = notifsData[0];
          if (lastNotificationId.current && latest.id !== lastNotificationId.current) {
            showToast(latest.message, 'success');
          }
          lastNotificationId.current = latest.id;
        }
      } else if (error) {
        showToast("Failed to load dashboard data", "error");
      }
      setIsLoading(false);
    };

    loadData();
    return () => { isMounted = false; };
  }, [user, isClient, showToast, jobs.length]);

  // --- ACTION HANDLERS ---

  const handleClearNotifications = async () => {
    const { error } = await api.clearUserNotifications(user.id);
    if (error) showToast(error.message, 'error'); 
    else setNotifications([]);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const budget = parseFloat(formData.get('budget'));
    const title = formData.get('title');

    if (budget < 100) { showToast("Minimum budget is ₹100", "error"); return; }
    if (title.length < 5) { showToast("Job title is too short", "error"); return; }

    const jobData = { 
        client_id: user.id, client_name: user.name, title: title, budget: budget, 
        job_type: 'Fixed', duration: formData.get('duration'), tags: formData.get('tags'), 
        description: formData.get('description'), category: formData.get('category') || 'dev' 
    };

    const { error } = await api.createJob(jobData);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast('Job Posted!'); setModal(null); setJobs([jobData, ...jobs]); }
  };

  const handleDeleteJob = async (id) => {
    if(!window.confirm("Are you sure you want to delete this job?")) return;
    const { error } = await api.deleteJob(id);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast('Job Deleted'); setJobs(jobs.filter(j => j.id !== id)); }
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

  const handleApplyJob = async (e) => {
    e.preventDefault();
    if (parentMode) { showToast("Parent Mode Active", "error"); return; }
    
    if (!isClient && selectedJob) {
      const jobCategory = selectedJob.category || 'dev';
      if (!unlockedSkills.includes(jobCategory)) {
        showToast(`Locked! Pass the ${jobCategory} quiz in Academy first.`, "error");
        setModal('quiz-locked');
        return;
      }
    }

    if (applications.some(app => app.job_id === selectedJob.id && app.freelancer_id === user.id)) { 
      showToast("Already applied!", "error");
      return; 
    }

    const formData = new FormData(e.target);
    const appData = { 
      job_id: selectedJob.id, freelancer_id: user.id, freelancer_name: user.name, 
      client_id: selectedJob.client_id, cover_letter: formData.get('cover_letter'), 
      bid_amount: formData.get('bid_amount') 
    };
    const { error } = await api.applyForJob(appData, selectedJob.title);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast('Applied successfully!'); setModal(null); }
  };

  // --- HYBRID ORDER FLOW LOGIC (WITH CASHFREE) ---
  
  // 1. Accept Application -> Start Order (Replaces old logic with Payment Flow)
// --- CASHFREE: HIRE FLOW ---
  const handleAcceptApplication = async (app) => {
    // 1. Debugging Logs
    console.log("1. Starting Hire for:", app.id);
    if (!cashfree.current) {
        showToast("Payment Gateway not ready. Refresh page.", "error");
        return;
    }

    showToast("Initializing Secure Payment...", "info");

    // 2. Call API
    const response = await api.createEscrowSession(app.id, app.bid_amount, app.freelancer_id);
    console.log("2. API Response:", response);

    // 3. FIX: Handle both variable names (camelCase vs snake_case)
    const sessionId = response.paymentSessionId || response.payment_session_id;
    const orderId = response.orderId || response.order_id;

    // 4. Check for errors
    if (response.error) {
        showToast("Init Failed: " + response.error.message, "error");
        return;
    }

    if (!sessionId) {
        console.error("❌ Session ID missing in response:", response);
        showToast("Error: Payment Session failed", "error");
        return;
    }

    // 5. Open Checkout
    console.log("3. Opening Checkout with:", sessionId);
    cashfree.current.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_modal",
    }).then(() => {
        console.log("4. Popup Closed. Verifying...");
        handlePaymentVerification(orderId, app);
    });
  };
  // Helper: Verify Payment and Start Order
  // --- CASHFREE: VERIFY PAYMENT ---
// --- CASHFREE: VERIFY PAYMENT ---
  const handlePaymentVerification = async (orderId, app) => {
    console.log("Verifying Order:", orderId);
    
    // FIX: Extract 'success' correctly
    const { success, error } = await api.verifyAndStartEscrow(orderId, app.id);

    if (success) {
      showToast("Payment Secured! Order Started.", "success");
      // Update UI
      setApplications(prev => prev.map(a => 
        a.id === app.id ? { ...a, status: 'Accepted', started_at: new Date().toISOString() } : a
      ));
    } else {
      console.error("Verification Failed:", error);
      // Optional: You can ignore this alert if the user just closed the popup without paying
      if (error) showToast("Payment Verification Failed", "error");
    }
  };  // 2. Submit Work -> Hybrid Delivery
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    // FIX: Ensure we use the specific selected Application, NOT selectedJob
    if (!selectedApp) {
        showToast("Error: No active application selected.", "error");
        return;
    }

    setModal(null);
    showToast("Uploading work...", "info");
  
    const formData = new FormData(e.target);
    const workLink = formData.get('work_link');
    const message = formData.get('message');
    const files = e.target.files; 
    
    let uploadedUrls = [];
    // File Upload Logic
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('project-files').upload(filePath, file);
        if (!error) {
          const { data: publicUrl } = supabase.storage.from('project-files').getPublicUrl(filePath);
          uploadedUrls.push(publicUrl.publicUrl);
        }
      }
    }
  
    const timestamp = new Date().toISOString();
    // OPTIMISTIC UPDATE
    const prevApps = [...applications];
    setApplications(apps => apps.map(a => a.id === selectedApp.id ? { ...a, status: APP_STATUS.SUBMITTED, submitted_at: timestamp } : a));
    
    const { error } = await supabase.functions.invoke('order-manager', {
      body: { 
        action: 'SUBMIT_WORK', 
        appId: selectedApp.id, 
        payload: {
          work_link: workLink,
          message: message,
          files: uploadedUrls 
        }
      }
    });

    if (error) {
      setApplications(prevApps); // Rollback
      showToast("Submission failed: " + error.message, "error");
    } else {
      showToast("Work Submitted Successfully!", "success");
      setSelectedApp(null); // Clear selection
    }
  };

  // 3. Approve Work -> Completed
  const handleApproveWork = async (app) => {
    const prevApps = [...applications];
    setApplications(apps => apps.map(a => a.id === app.id ? { ...a, status: APP_STATUS.COMPLETED } : a));
    const { error } = await supabase.functions.invoke('order-manager', {
      body: { action: 'APPROVE_WORK', appId: app.id }
    });
    if (!error) {
      showToast("Work Approved! Please release payment.", "success");
      setViewWorkApp(null);
    } else {
      setApplications(prevApps); // Rollback
      showToast(error.message, 'error');
    }
  };

  // 4. Final Payment Wrapper (Releasing Money to Freelancer)
  const handleFinalPayment = async (app) => {
    if (parentMode) { showToast("Parent Mode: Payments Locked.", "error"); return; }
    if (app.status !== APP_STATUS.COMPLETED) { showToast("Approve work first.", "error"); return; }
    setPaymentModal({ appId: app.id, amount: app.bid_amount, freelancerId: app.freelancer_id });
  };

  // 5. Processing the Payment Release
  const processPayment = async () => {
    if (!paymentModal) return;
    const { appId, amount, freelancerId } = paymentModal;

    const { error } = await api.processPayment(appId, amount, freelancerId);
    if (error) { 
        showToast(error.message, 'error');
    } else { 
        showToast("Payment Successful!", "success");
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: APP_STATUS.PAID, paid_at: new Date().toISOString() } : a));
        setPaymentModal(null);
        // --- BADGE CHECK TRIGGER ---
        const paidApps = applications.filter(a => a.status === APP_STATUS.PAID);
        if (paidApps.length === 0) {
           showToast("🏆 BADGE UNLOCKED: First Gig!", "success");
           setBadges([...badges, { name: 'First Gig', icon: 'Briefcase' }]);
        }
    }
  };

  // --- MASTER ACTION HANDLER (Centralized) ---
  const handleAppAction = (action, app) => {
    // Parent Mode Guard
    if (parentMode && ['pay', 'approve', 'accept'].includes(action)) {
        showToast("Parent Mode Active: Action Locked", "error");
        return;
    }

    if (action === 'accept') handleAcceptApplication(app);
    if (action === 'reject') updateStatus(app.id, APP_STATUS.REJECTED, app.freelancer_id);
    
    // FIX: Using selectedApp to distinguish from generic browsing
    if (action === 'submit') { 
        setSelectedApp(app);
        setModal('submit_work'); 
    }
    
    if (action === 'view_submission') setViewWorkApp(app);
    if (action === 'approve') handleApproveWork(app);
    if (action === 'pay') handleFinalPayment(app);
  };

  // Generalized Status Updater with Rollback
  const updateStatus = async (appId, status, freelancerId) => {
    // 1. Current State Check
    const currentApp = applications.find(a => a.id === appId);
    if (!currentApp) return;

    // 2. State Machine Check
    const allowed = NEXT_ALLOWED_STATE[currentApp.status] || [];
    // Exception: You can always reject from Pending
    if (!allowed.includes(status) && status !== APP_STATUS.REJECTED) {
       // Strict mode off for now
    }

    // 3. Optimistic Update
    const prevApps = [...applications];
    setApplications(applications.map(a => a.id === appId ? { ...a, status } : a));
    
    // 4. API Call
    const { error } = await api.updateApplicationStatus(appId, status, freelancerId);
    if(error) { 
        setApplications(prevApps); // Rollback
        showToast(error.message, 'error');
    } else {
        showToast(`Marked as ${status}`);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tableName = isClient ? 'clients' : 'freelancers';
    const cleanUpdates = { name: profileForm.name, phone: profileForm.phone, nationality: profileForm.nationality };
    if (!isClient) {
        cleanUpdates.age = profileForm.age; cleanUpdates.qualification = profileForm.qualification;
        cleanUpdates.specialty = profileForm.specialty;
        cleanUpdates.services = profileForm.services;
        cleanUpdates.upi = profileForm.upi;
    } else { 
        cleanUpdates.is_organisation = profileForm.is_organisation;
    }

    const { error } = await api.updateUserProfile(user.id, cleanUpdates, tableName);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast("Profile updated!"); setUser({ ...user, ...cleanUpdates }); }
  };

  // --- QUIZ & AI HANDLERS ---
  const handleQuizSelection = async (categoryId, answer) => {
    const correctAnswer = SAFE_QUIZZES[categoryId]?.answer;
    if (!correctAnswer) return;
    
    setQuizState({ selected: answer, status: answer === correctAnswer ? 'correct' : 'incorrect' });
    if (answer === correctAnswer) {
      setTimeout(async () => {
        const newSkills = [...unlockedSkills, categoryId];
        setUnlockedSkills(newSkills);
        await api.unlockSkill(user.id, newSkills); 
        setUser({ ...user, unlockedSkills: newSkills });

        const hasBadge = badges.some(b => b.name === 'Skill Certified');
        if (!hasBadge) {
            const newBadge = { name: 'Skill Certified', icon: 'Award' };
            setBadges(prev => [...prev, newBadge]);
            await supabase.from('user_badges').insert({ user_id: user.id, badge_name: 'Skill Certified' });
        }
        setModal(null);
        setQuizState({ selected: null, status: 'idle' });
        showToast("🎉 Skill Unlocked! +500 XP", "success");
      }, 1500);
    } else {
      setTimeout(() => setQuizState({ selected: null, status: 'idle' }), 1000);
    }
  };

  const handleAiGenerate = () => {
    if (!rawPortfolioText) return;
    setIsAiLoading(true);
    setTimeout(() => {
      const newItem = { id: Date.now(), title: "Professional Case Study", content: rawPortfolioText };
      setPortfolioItems([newItem, ...portfolioItems]);
      setRawPortfolioText("");
      setIsAiLoading(false);
      showToast("AI Magic Applied!");
    }, 1500);
  };

  const handleDownloadCard = async () => {
    if (profileCardRef.current) {
      try {
        showToast("Generating image...", "info");
        const canvas = await html2canvas(profileCardRef.current, { backgroundColor: null, scale: 2, useCORS: true, logging: false });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `TeenVerse-${user.name || 'Profile'}.png`;
        link.click();
        showToast("Downloaded successfully!", "success");
      } catch (err) { console.error("Download failed:", err); showToast("Failed to download image.", "error"); }
    } else { showToast("Could not find card element.", "error"); }
  };

  // --- RENDER HELPERS ---
  const SidebarItem = ({ id, icon: Icon, label, color }) => (
    <button 
      onClick={() => {setTab(id); setMenuOpen(false);}} 
      className={`group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${tab === id ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'}`}
    >
      <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${tab === id ? 'text-white' : color || ''}`} />
      {!zenMode && (
        <> <span className="flex-1 text-left">{label}</span> {tab === id && <ChevronRight size={14} className="opacity-80 animate-pulse"/>} </>
      )}
    </button>
  );

  const getTabIcon = () => {
    const icons = {
      'overview': <LayoutDashboard size={20} className="text-indigo-600 dark:text-indigo-400"/>,
      'jobs': <Briefcase size={20} className="text-blue-500"/>,
      'posted-jobs': <ListChecks size={20} className="text-indigo-500"/>,
      'academy': <BookOpen size={20} className="text-emerald-500"/>,
      'battles': <Swords size={20} className="text-rose-500"/>,
      'settings': <Settings size={20} className="text-gray-500"/>,
      'profile-card': <User size={20} className="text-purple-500"/>,
      'pricing': <Crown size={20} className="text-yellow-500"/>,
      'records': <ShieldCheck size={20} className="text-blue-500"/>
    };
    return icons[tab] || <LayoutDashboard size={20} className="text-indigo-500"/>;
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
          <div className="flex flex-col items-center gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
             <p className="text-gray-500 text-sm animate-pulse">Loading TeenVerse...</p>
          </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-500 font-sans overflow-hidden">
      
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent dark:from-indigo-900"></div>
         <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-200 via-transparent to-transparent dark:from-purple-900"></div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-in-out flex flex-col h-screen ${zenMode ? 'md:w-24' : 'md:w-80'}`}>
        <div className={`flex flex-col h-full m-0 md:m-4 rounded-none md:rounded-3xl bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-r md:border border-gray-200 dark:border-white/5 shadow-2xl md:shadow-xl overflow-hidden`}>
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between shrink-0">
             <div className={`flex items-center gap-3 transition-all duration-300 ${zenMode ? 'justify-center w-full' : ''}`}>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0"><Rocket size={20} className="fill-white/20"/></div>
               {!zenMode && <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Teen<span className="text-indigo-600">VerseHub</span></span>}
             </div>
             <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24}/></button>
          </div>

          {/* User Profile Snippet */}
          {!zenMode && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:border-indigo-100 transition-colors">
               <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-900 overflow-hidden">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{user.name ? user.name[0] : <User size={20}/>}</div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white dark:border-gray-900">Lv.{userLevel}</div>
                  </div>
                  <div className="overflow-hidden">
                     <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1">{user.name?.split(' ')[0] || 'User'} {badges.some(b => b.name === 'Verified Teen') && <ShieldCheck size={12} className="text-blue-500"/>}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type} Account</p>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-1.5 mb-3">
                  {badges.length > 0 ? (
                    badges.slice(0, 3).map((b, i) => (
                      <BadgeItem key={i} name={b.name} iconName={b.icon} />
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">No badges earned yet.</span>
                  )}
                  {badges.length > 3 && <span className="text-[10px] text-gray-400">+{badges.length - 3} more</span>}
               </div>
               
                 <div className="space-y-1">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider"><span>XP Progress</span><span>{Math.round(progressPercent)}%</span></div>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div></div>
               </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
             {zenMode ? (
               <div className="flex flex-col items-center gap-4">
                  {['overview', 'jobs', 'messages', !isClient && 'academy'].filter(Boolean).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`p-3 rounded-2xl transition-all ${tab===t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                      {t === 'overview' && <LayoutDashboard size={20}/>}
                      {t === 'jobs' && <Briefcase size={20}/>}
                      {t === 'messages' && <MessageSquare size={20}/>}
                      {t === 'academy' && <BookOpen size={20}/>}
                      </button>
                  ))}
               </div>
             ) : (
               <>
                 <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
                 <div className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Workspace</div>
                 <SidebarItem id="jobs" icon={Briefcase} label={isClient ? 'Browse Services' : 'Find Jobs'} />
                 {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Listings" />}
                 {!isClient && <SidebarItem id="my-services" icon={Package} label="My Gigs" />}
                 <SidebarItem id="applications" icon={FileText} label="Orders & Jobs" />
                 <SidebarItem id="messages" icon={MessageSquare} label="Messages" />
                  {!isClient && (
                   <>
                     <div className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Growth</div>
                     <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                     <SidebarItem id="portfolio" icon={Sparkles} label="AI Portfolio" color="text-violet-500" />
                     <SidebarItem id="profile-card" icon={Share2} label="Share Profile" />
                   </>
                 )}
                 <div className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">System</div>
                 <SidebarItem id="records" icon={ShieldCheck} label="My Records" />
                 <SidebarItem id="settings" icon={Settings} label="Settings" />
               </>
             )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
             <div className="flex gap-2">
                <button onClick={() => setZenMode(!zenMode)} className="flex-1 flex items-center justify-center p-2 rounded-xl text-gray-500 hover:bg-white dark:hover:bg-white/10 transition-colors">{zenMode ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}</button>
                <button onClick={onLogout} className="flex-1 flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut size={18}/></button>
             </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        
         {/* Header */}
         <header className="sticky top-0 z-30 px-6 py-4">
            <div className="bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"><Menu/></button>
                   <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 items-center justify-center border border-gray-100 dark:border-white/5">{getTabIcon()}</div>
                     <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize leading-none">{tab.replace('-', ' ')}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Welcome back, {user.name?.split(' ')[0]}</p>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-black/30 p-1 rounded-full">
                     <button onClick={() => !darkMode && toggleTheme()} className={`p-2 rounded-full transition-all ${!darkMode ? 'bg-white shadow-sm text-amber-500' : 'text-gray-400'}`}><Sun size={18}/></button>
                     <button onClick={() => darkMode && toggleTheme()} className={`p-2 rounded-full transition-all ${darkMode ? 'bg-gray-800 shadow-sm text-indigo-400' : 'text-gray-400'}`}><Moon size={18}/></button>
                  </div>
                  <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 text-gray-500 dark:text-gray-400 transition-colors">
                       <Bell size={20}/>
                      {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0F172A]"></span>}
                    </button>
                    {showNotifications && (
                       <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in z-50">
                          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                             <span className="font-bold text-sm dark:text-white">Notifications</span>
                              <button onClick={handleClearNotifications} className="text-xs font-medium text-indigo-500 hover:text-indigo-600">Clear All</button>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                           {notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs">No new alerts</div> : notifications.map(n => (
                               <div key={n.id} className="p-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-xs text-gray-600 dark:text-gray-300 flex gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                  {n.message}
                               </div>
                             ))}
                           </div>
                      </div>
                    )}
                  </div>
               </div>
             </div>
         </header>

         {/* Scrollable Content Area */}
         <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
               <div className="animate-fade-in-up">
                 {tab === 'overview' && (
                     <Overview user={user} isClient={isClient} totalEarnings={totalEarnings} jobsCount={isClient ? jobs.length : applications.length} badgesCount={badges.length} setTab={setTab} referralCount={referralStats.count} referralEarnings={referralStats.earnings} />
                 )}
                 {tab === 'jobs' && <Jobs isClient={isClient} services={services} filteredJobs={filteredJobs} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} parentMode={parentMode} />}
                 {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setModal} handleDeleteJob={handleDeleteJob} />}
                 
                 {tab === 'my-services' && !isClient && <MyServices services={services} setModal={setModal} handleDeleteService={handleDeleteService} />}
                 
                 {/* --- HYBRID APPLICATIONS (With Master Handler) --- */}
                 {tab === 'applications' && (
                    <Applications 
                        applications={applications} 
                        isClient={isClient} 
                        parentMode={parentMode}
                        onAction={handleAppAction} 
                        onViewTimeline={(app) => setTimelineApp(app)}
                    />
                 )}
                 
                 {tab === 'messages' && <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden h-[calc(100vh-180px)]"><ChatSystem user={user} activeChat={activeChat} setActiveChat={setActiveChat} parentMode={parentMode} /></div>}
                 {tab === 'academy' && !isClient && <Academy unlockedSkills={unlockedSkills} setModal={setModal} quizzes={SAFE_QUIZZES} />}
                 {tab === 'portfolio' && !isClient && <Portfolio rawPortfolioText={rawPortfolioText} setRawPortfolioText={setRawPortfolioText} handleAiGenerate={handleAiGenerate} isAiLoading={isAiLoading} portfolioItems={portfolioItems} />}
                 {tab === 'profile-card' && !isClient && <ProfileCard ref={profileCardRef} user={user} unlockedSkills={unlockedSkills} badges={badges} userLevel={userLevel} applications={applications} handleDownloadCard={handleDownloadCard} showToast={showToast} />}
                 {tab === 'records' && <Records applications={applications} />}
                 {tab === 'settings' && <SettingsComp profileForm={profileForm} setProfileForm={setProfileForm} isClient={isClient} handleUpdateProfile={handleUpdateProfile} parentMode={parentMode} setParentMode={setParentMode} />}
               </div>
            </div>
         </div>
      </main>

      {/* --- MODALS --- */}
 
      {modal === 'post-job' && <PostJobModal onClose={() => setModal(null)} onSubmit={handlePostJob} />}
      {modal === 'create-service' && <CreateServiceModal onClose={() => setModal(null)} onSubmit={handleCreateService} />}
      {modal === 'apply-job' && <ApplyJobModal onClose={() => setModal(null)} onSubmit={handleApplyJob} job={selectedJob} />}

      {/* 1. TIMELINE MODAL */}
      {timelineApp && (
        <Modal title={`Project Timeline: ${timelineApp.jobs?.title}`} onClose={() => setTimelineApp(null)}>
          <OrderTimeline application={timelineApp} />
          <div className="mt-4 text-center">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-500">Order ID: #{timelineApp.id}</span>
          </div>
        </Modal>
      )}

      {/* 2. SUBMIT WORK MODAL (Freelancer) */}
      {modal === 'submit_work' && (
        <Modal title="Deliver Your Work" onClose={() => setModal(null)}>
          <form onSubmit={handleSubmitWork} className="space-y-4">
             <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-sm mb-4"><strong>Instructions:</strong> Provide a link to your work (Drive/GitHub) OR upload files directly.</div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">External Link (Recommended)</label>
              <input name="work_link" type="url" placeholder="https://drive.google.com/..." className="w-full p-3 border rounded-xl dark:bg-black dark:border-gray-700 dark:text-white"/>
            </div>
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
              <textarea name="message" rows="3" className="w-full p-3 border rounded-xl dark:bg-black dark:border-gray-700 dark:text-white" placeholder="Describe what you did..."></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Or Upload Files (Max 5MB)</label>
              <input type="file" name="files" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
            <Button className="w-full py-3 shadow-lg shadow-indigo-500/20">Submit Delivery</Button>
          </form>
        </Modal>
      )}

      {/* 3. VIEW WORK MODAL (Client) */}
      {viewWorkApp && (
        <Modal title="Review Delivery" onClose={() => setViewWorkApp(null)}>
          <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Freelancer Note</h4>
                <p className="text-gray-800 dark:text-gray-200 text-sm italic">"{viewWorkApp.work_message || 'No message provided'}"</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Deliverables</h4>
                {viewWorkApp.work_link && (
                  <a href={viewWorkApp.work_link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors group">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><Package size={20}/></div>
                      <div className="flex-1"><p className="font-bold text-indigo-700 text-sm">External Project Link</p><p className="text-xs text-indigo-400 truncate">{viewWorkApp.work_link}</p></div>
                      <Eye size={16} className="text-gray-400 group-hover:text-indigo-600"/>
                   </a>
                )}
                {viewWorkApp.work_files && viewWorkApp.work_files.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"><FileText size={20}/></div>
                      <div className="flex-1"><p className="font-bold text-gray-700 text-sm">Attached File {i+1}</p></div>
                      <Eye size={16} className="text-gray-400"/>
                  </a>
                ))}
             </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setViewWorkApp(null)}>Close</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApproveWork(viewWorkApp)}>Approve Work</Button>
              </div>
          </div>
        </Modal>
      )}

      {modal === 'quiz-locked' && (
         <Modal title="Skill Locked" onClose={() => setModal(null)}>
            <div className="text-center py-8">
               <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400"><Lock size={40}/></div>
               <h3 className="text-xl font-bold dark:text-white mb-2">Access Denied</h3>
               <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">You need to prove your skills in the Academy before applying to this category.</p>
               <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full py-3">Go to Academy</Button>
            </div>
         </Modal>
      )}

      {Object.keys(SAFE_QUIZZES).map(key => modal === `quiz-${key}` && (
         <Modal key={key} title="Skill Assessment" onClose={() => {setModal(null); setQuizState({selected: null, status: 'idle'});}}>
            <div className="space-y-6">
               <h3 className="text-lg font-bold text-center dark:text-white px-4">{SAFE_QUIZZES[key].question}</h3>
                <div className="space-y-3">
                  {SAFE_QUIZZES[key].options.map((opt, i) => (
                     <button key={i} onClick={() => handleQuizSelection(key, opt)} disabled={quizState.status !== 'idle'} className={`w-full p-4 rounded-xl text-left border-2 transition-all font-medium flex items-center justify-between ${quizState.selected === opt ? (quizState.status === 'correct' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700') : 'bg-white border-gray-100 hover:border-indigo-500 hover:shadow-md dark:bg-[#020617] dark:border-white/10 dark:text-gray-300'}`}>
                        {opt}
                        {quizState.selected === opt && (quizState.status === 'correct' ? <CheckCircle size={20}/> : <X size={20}/>)}
                     </button>
                  ))}
               </div>
               {quizState.status === 'correct' && <p className="text-center text-emerald-600 font-bold animate-pulse">Correct! +500 XP Awarded</p>}
            </div>
         </Modal>
      ))}

      {paymentModal && <PaymentModal onClose={() => setPaymentModal(null)} onConfirm={processPayment} paymentData={paymentModal} />}

    </div>
  );
};

export default Dashboard;