import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Menu, LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, Sparkles, Settings, LogOut, 
  Award, Sun, Moon, Bell, Search, Filter, PlusCircle, Zap, Lock, Check, Clock, Trash2, ThumbsUp, CreditCard, 
  Receipt, X, CheckCircle, Package, Save, Share2, Download, 
  Trophy, Unlock, Swords, Heart, Crown, ShieldCheck, FileCheck, Maximize2, Minimize2, User, ListChecks, ChevronRight
} from 'lucide-react';
import { supabase } from '../supabase';
import { CATEGORIES, COLORS, QUIZZES, BATTLES, PRICING_PLANS } from '../utils/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ChatSystem from '../components/features/ChatSystem';


// Import Sub-Components
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
import html2canvas from 'html2canvas'; 

const Dashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme }) => {
  const isClient = user?.type === 'client';
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false); 
  
  // Data States
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]); 
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Referral Stats State
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });

  // UI States
  const [showNotifications, setShowNotifications] = useState(false); 
  const [modal, setModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const lastNotificationId = useRef(null);
  
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileForm, setProfileForm] = useState(user ? { ...user } : {});

  // Feature States
  const [paymentModal, setPaymentModal] = useState(null); 
  const [parentMode, setParentMode] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState(user?.unlockedSkills || []);
  const [badges, setBadges] = useState(user?.badges || ['Verified']);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [rawPortfolioText, setRawPortfolioText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeBattles, setActiveBattles] = useState(BATTLES || []); 

  const SAFE_QUIZZES = QUIZZES || {};

  const [quizState, setQuizState] = useState({ selected : null, status: 'idle'});

  // REF FOR PROFILE CARD DOWNLOAD
  const profileCardRef = useRef(null); 

  const LOCAL_CATEGORIES = {
    'dev': 'Development',
    'design': 'Design',
    'marketing': 'Marketing',
    'writing': 'Writing',
    'video': 'Video Editing',
    'data': 'Data Entry'
  };

  const currentXP = unlockedSkills.length * 500;
  const nextLevelXP = (Math.floor(currentXP / 2000) + 1) * 2000;
  const progressPercent = (currentXP / nextLevelXP) * 100;
  const userLevel = Math.floor(currentXP / 2000) + 1;

  // Filter Jobs
  const filteredJobs = jobs.filter(job => 
    (job.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (job.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job.tags?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: allServices, error: sError } = await supabase.from('services').select('*').order('created_at', {ascending: false});
      if (!sError && allServices) {
          if (!isClient) {
             setServices(allServices.filter(s => s.freelancer_id === user.id));
          } else {
             setServices(allServices);
          }
      }

      let appsData = [];
      if (isClient) {
        const { data: myJobs } = await supabase.from('jobs').select('*').eq('client_id', user.id).order('created_at', {ascending: false});
        setJobs(myJobs || []);
        const { data: apps } = await supabase.from('applications').select('*').eq('client_id', user.id);
        appsData = apps || [];
      } else {
        const { data: allJobs } = await supabase.from('jobs').select('*').order('created_at', {ascending: false});
        setJobs(allJobs || []);
        const { data: myApps } = await supabase.from('applications').select('*').eq('freelancer_id', user.id);
        appsData = myApps || [];
      }
      setApplications(appsData);

      const total = appsData.reduce((acc, curr) => {
        if (curr.status === 'Paid') {
          const amount = Number(curr.bid_amount) || 0;
          return isClient ? acc + amount : acc + (amount * 0.96);
        }
        return acc;
      }, 0);
      setTotalEarnings(total);

      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {ascending: false});
      if (notifs && notifs.length > 0) {
        const latest = notifs[0];
        if (lastNotificationId.current && latest.id !== lastNotificationId.current) {
          showToast(latest.message, 'success');
        }
        lastNotificationId.current = latest.id;
      }
      setNotifications(notifs || []);
      
      const { count } = await supabase
         .from('referrals')
         .select('*', { count: 'exact', head: true })
         .eq('referrer_id', user.id);
      
      setReferralStats({ count: count || 0, earnings: (count || 0) * 50 });
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, [user, isClient, showToast]); 

  const handleClearNotifications = async () => {
    const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
    if (error) showToast(error.message, 'error'); else setNotifications([]);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobData = { 
        client_id: user.id, 
        client_name: user.name, 
        title: formData.get('title'), 
        budget: formData.get('budget'), 
        job_type: 'Fixed', 
        duration: formData.get('duration'), 
        tags: formData.get('tags'), 
        description: formData.get('description'), 
        category: formData.get('category') || 'dev' 
    };
    const { error } = await supabase.from('jobs').insert([jobData]);
    if (error) { showToast(error.message, 'error'); } else { showToast('Job Posted!'); setModal(null); setJobs([jobData, ...jobs]); }
  };

  const handleDeleteJob = async (id) => {
    if(!window.confirm("Are you sure you want to delete this job?")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); } else { showToast('Job Deleted'); setJobs(jobs.filter(j => j.id !== id)); }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceData = {
      freelancer_id: user.id,
      freelancer_name: user.name,
      title: formData.get('title'),
      description: formData.get('description'),
      price: formData.get('price'),
      delivery_time: formData.get('delivery_time'),
      category: formData.get('category')
    };
    const { error } = await supabase.from('services').insert([serviceData]);
    if (error) { showToast(error.message, 'error'); } else { showToast('Gig Created Successfully!'); setModal(null); setServices([serviceData, ...services]); }
  };

  const handleDeleteService = async (id) => {
    if(!window.confirm("Delete this gig?")) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); } else { showToast('Service Deleted'); setServices(services.filter(s => s.id !== id)); }
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
    if (applications.some(app => app.job_id === selectedJob.id && app.freelancer_id === user.id)) { showToast("Already applied!", "error"); return; }
    const formData = new FormData(e.target);
    const appData = { job_id: selectedJob.id, freelancer_id: user.id, freelancer_name: user.name, client_id: selectedJob.client_id, cover_letter: formData.get('cover_letter'), bid_amount: formData.get('bid_amount') };
    const { error } = await supabase.from('applications').insert([appData]);
    if (error) { showToast(error.message, 'error'); } else { await supabase.from('notifications').insert([{ user_id: selectedJob.client_id, message: `New application: ${selectedJob.title}` }]); showToast('Applied successfully!'); setModal(null); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tableName = isClient ? 'clients' : 'freelancers';
    const cleanUpdates = { name: profileForm.name, phone: profileForm.phone, nationality: profileForm.nationality };
    if (!isClient) {
        cleanUpdates.age = profileForm.age;
        cleanUpdates.qualification = profileForm.qualification;
        cleanUpdates.specialty = profileForm.specialty;
        cleanUpdates.services = profileForm.services;
        cleanUpdates.upi = profileForm.upi;
    } else { cleanUpdates.is_organisation = profileForm.is_organisation; }
    const { error } = await supabase.from(tableName).update(cleanUpdates).eq('id', user.id);
    if (error) { showToast(error.message, 'error'); } else { showToast("Profile updated!"); setUser({ ...user, ...cleanUpdates }); }
  };

  const initiatePayment = (appId, amount, freelancerId) => setPaymentModal({ appId, amount, freelancerId });
  const processPayment = async () => {
    if (!paymentModal) return;
    const { appId, amount, freelancerId } = paymentModal;
    const { error } = await supabase.from('applications').update({ status: 'Paid' }).eq('id', appId);
    if (error) { showToast(error.message, 'error'); } else { await supabase.from('notifications').insert([{ user_id: freelancerId, message: `💰 Payment received! ₹${(amount * 0.96).toFixed(2)}` }]); showToast("Payment Successful!", "success"); setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: 'Paid' } : a)); setPaymentModal(null); }
  };

  const handleQuizSelection = async (categoryId, answer) => {
    const correctAnswer = SAFE_QUIZZES[categoryId]?.answer;
    if (!correctAnswer) return;
    setQuizState({ selected: answer, status: answer === correctAnswer ? 'correct' : 'incorrect' });
    if (answer === correctAnswer) {
      setTimeout(async () => {
        const newSkills = [...unlockedSkills, categoryId];
        setUnlockedSkills(newSkills);
        setBadges([...badges, 'Skill Unlocked']);
        await supabase.from('freelancers').update({ unlocked_skills: newSkills }).eq('id', user.id);
        setUser({ ...user, unlockedSkills: newSkills });
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

  const updateStatus = async (appId, status, freelancerId) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', appId);
    if(error) { showToast(error.message, 'error'); return; }
    await supabase.from('notifications').insert([{ user_id: freelancerId, message: `Application ${status}` }]);
    showToast(`Marked as ${status}`);
    setApplications(applications.map(a => a.id === appId ? { ...a, status } : a));
  };

  const handleJoinBattle = () => !parentMode && showToast("Battle Joined!");
  const handleVote = (bid, eid) => {
     if (parentMode) return;
     setActiveBattles(activeBattles.map(b => b.id === bid ? { ...b, entries: b.entries.map(e => e.id === eid ? {...e, votes: e.votes + 1} : e) } : b));
     showToast("Voted!");
  };

  const handleDownloadCard = async () => {
    if (profileCardRef.current) {
      try {
        showToast("Generating image...", "info");
        const canvas = await html2canvas(profileCardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `TeenVerse-${user.name || 'Profile'}.png`;
        link.click();
        showToast("Downloaded successfully!", "success");
      } catch (err) { console.error("Download failed:", err); showToast("Failed to download image.", "error"); }
    } else { showToast("Could not find card element.", "error"); }
  };

  // --- REDESIGNED SIDEBAR ITEM ---
  const SidebarItem = ({ id, icon: Icon, label, color }) => (
    <button 
      onClick={() => {setTab(id); setMenuOpen(false);}} 
      className={`
        group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300
        ${tab === id 
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'
        }
      `}
    >
      <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${tab === id ? 'text-white' : color || ''}`} />
      {!zenMode && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {tab === id && <ChevronRight size={14} className="opacity-80 animate-pulse"/>}
        </>
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

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-500 font-sans overflow-hidden">
      
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent dark:from-indigo-900"></div>
         <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-200 via-transparent to-transparent dark:from-purple-900"></div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`
          fixed md:static inset-y-0 left-0 z-50 transform 
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 
          transition-all duration-300 ease-in-out
          flex flex-col h-screen 
          ${zenMode ? 'md:w-24' : 'md:w-80'}
      `}>
        {/* Floating Sidebar Container */}
        <div className={`
            flex flex-col h-full m-0 md:m-4 rounded-none md:rounded-3xl 
            bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl 
            border-r md:border border-gray-200 dark:border-white/5 
            shadow-2xl md:shadow-xl overflow-hidden
        `}>
          
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between shrink-0">
             <div className={`flex items-center gap-3 transition-all duration-300 ${zenMode ? 'justify-center w-full' : ''}`}>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                 <Rocket size={20} className="fill-white/20"/>
               </div>
               {!zenMode && (
                 <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                   Teen<span className="text-indigo-600">VerseHub</span>
                 </span>
               )}
             </div>
             <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24}/></button>
          </div>

          {/* User Profile Snippet */}
          {!zenMode && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:border-indigo-100 transition-colors">
               <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                     <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-900 overflow-hidden">
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                           {user.name ? user.name[0] : <User size={20}/>}
                        </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white dark:border-gray-900">
                        Lv.{userLevel}
                     </div>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1">
                       {user.name?.split(' ')[0] || 'User'} 
                       {badges.length > 0 && <Award size={12} className="text-amber-500 fill-amber-500"/>}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type} Account</p>
                  </div>
               </div>
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>XP Progress</span>
                    <span>{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                 </div>
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
                 <SidebarItem id="applications" icon={FileText} label="Applications" />
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

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
             <div className="flex gap-2">
                <button onClick={() => setZenMode(!zenMode)} className="flex-1 flex items-center justify-center p-2 rounded-xl text-gray-500 hover:bg-white dark:hover:bg-white/10 transition-colors">
                  {zenMode ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}
                </button>
                <button onClick={onLogout} className="flex-1 flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                   <LogOut size={18}/>
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
         
         {/* Glass Header */}
         <header className="sticky top-0 z-30 px-6 py-4">
            <div className="bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
               
               {/* Left: Mobile Menu & Breadcrumbs */}
               <div className="flex items-center gap-4">
                  <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"><Menu/></button>
                  <div className="flex items-center gap-3">
                     <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 items-center justify-center border border-gray-100 dark:border-white/5">
                        {getTabIcon()}
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize leading-none">{tab.replace('-', ' ')}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Welcome back, {user.name?.split(' ')[0]}</p>
                     </div>
                  </div>
               </div>

               {/* Right: Actions */}
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
                    {/* Notification Dropdown */}
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
                  <Overview 
                      user={user} 
                      isClient={isClient} 
                      totalEarnings={totalEarnings} 
                      jobsCount={isClient ? jobs.length : applications.length} 
                      badgesCount={badges.length} 
                      setTab={setTab}
                      referralCount={referralStats.count} 
                      referralEarnings={referralStats.earnings} 
                  />
                 )}
                 {tab === 'jobs' && <Jobs isClient={isClient} services={services} filteredJobs={filteredJobs} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} parentMode={parentMode} />}
                 {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setModal} handleDeleteJob={handleDeleteJob} />}
                 {tab === 'my-services' && !isClient && <MyServices services={services} setModal={setModal} handleDeleteService={handleDeleteService} />}
                 {tab === 'applications' && <Applications applications={applications} isClient={isClient} updateStatus={updateStatus} initiatePayment={initiatePayment} parentMode={parentMode} />}
                 {tab === 'messages' && <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden h-[calc(100vh-180px)]"><ChatSystem user={user} activeChat={activeChat} setActiveChat={setActiveChat} parentMode={parentMode} /></div>}
                 {tab === 'academy' && !isClient && <Academy unlockedSkills={unlockedSkills} setModal={setModal} quizzes={SAFE_QUIZZES} />}
                 {tab === 'portfolio' && !isClient && <Portfolio rawPortfolioText={rawPortfolioText} setRawPortfolioText={setRawPortfolioText} handleAiGenerate={handleAiGenerate} isAiLoading={isAiLoading} portfolioItems={portfolioItems} />}
                 {tab === 'profile-card' && !isClient && (
                    <ProfileCard ref={profileCardRef} user={user} unlockedSkills={unlockedSkills} badges={badges} userLevel={userLevel} applications={applications} handleDownloadCard={handleDownloadCard} showToast={showToast} />
                 )}
                 {tab === 'records' && <Records applications={applications} />}
                 {tab === 'settings' && <SettingsComp profileForm={profileForm} setProfileForm={setProfileForm} isClient={isClient} handleUpdateProfile={handleUpdateProfile} parentMode={parentMode} setParentMode={setParentMode} />}
               </div>
            </div>
         </div>
      </main>

      {/* --- MODALS (Redesigned) --- */}
      {modal === 'post-job' && (
        <Modal title="Create New Listing" onClose={() => setModal(null)}>
          <form onSubmit={handlePostJob} className="space-y-5">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Job Title</label>
               <input name="title" type="text" placeholder="e.g. Senior React Developer" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Budget (₹)</label>
                  <input name="budget" type="number" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Duration</label>
                  <input name="duration" type="text" placeholder="e.g. 2 Weeks" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Category</label>
               <div className="relative">
                 <select name="category" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500 transition-all">
                    {Object.keys(LOCAL_CATEGORIES).map(cat => <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>)}
                 </select>
                 <div className="absolute right-4 top-4 pointer-events-none text-gray-500"><ChevronRight size={14} className="rotate-90"/></div>
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Description</label>
               <textarea name="description" rows="4" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required></textarea>
            </div>
            <Button className="w-full py-3.5 text-base shadow-lg shadow-indigo-500/30">Publish Job</Button>
          </form>
        </Modal>
      )}

      {modal === 'create-service' && (
        <Modal title="Setup New Gig" onClose={() => setModal(null)}>
           <form onSubmit={handleCreateService} className="space-y-5">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Gig Title</label>
               <input name="title" type="text" placeholder="e.g. I will design your logo" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Price (₹)</label><input name="price" type="number" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Delivery</label><input name="delivery_time" type="text" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Category</label>
               <div className="relative">
                 <select name="category" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none appearance-none">
                    {Object.keys(LOCAL_CATEGORIES).map(cat => <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>)}
                 </select>
               </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Description</label>
               <textarea name="description" rows="4" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required></textarea>
            </div>
            <Button className="w-full py-3.5 shadow-lg shadow-indigo-500/30">Create Gig</Button>
          </form>
        </Modal>
      )}

      {modal === 'apply-job' && (
        <Modal title="Submit Proposal" onClose={() => setModal(null)}>
           <form onSubmit={handleApplyJob} className="space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-300"><Briefcase size={20}/></div>
                 <div>
                    <h4 className="font-bold text-sm dark:text-white line-clamp-1">{selectedJob?.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Budget: ₹{selectedJob?.budget}</p>
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Your Bid Amount (₹)</label>
                 <input name="bid_amount" type="number" defaultValue={selectedJob?.budget} className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Cover Letter</label>
                 <textarea name="cover_letter" rows="5" placeholder="Why are you the best fit for this role?" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required></textarea>
              </div>
              <Button className="w-full py-3.5 text-base shadow-lg shadow-indigo-500/30">Send Proposal</Button>
           </form>
        </Modal>
      )}

      {/* Logic-Locked Modals (Style Updated) */}
      {modal === 'quiz-locked' && (
         <Modal title="Skill Locked" onClose={() => setModal(null)}>
            <div className="text-center py-8">
               <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                  <Lock size={40}/>
               </div>
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
                     <button 
                        key={i}
                        onClick={() => handleQuizSelection(key, opt)}
                        disabled={quizState.status !== 'idle'}
                        className={`w-full p-4 rounded-xl text-left border-2 transition-all font-medium flex items-center justify-between
                           ${quizState.selected === opt 
                              ? (quizState.status === 'correct' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700')
                              : 'bg-white border-gray-100 hover:border-indigo-500 hover:shadow-md dark:bg-[#020617] dark:border-white/10 dark:text-gray-300'
                           }
                        `}
                     >
                        {opt}
                        {quizState.selected === opt && (quizState.status === 'correct' ? <CheckCircle size={20}/> : <X size={20}/>)}
                     </button>
                  ))}
               </div>
               {quizState.status === 'correct' && <p className="text-center text-emerald-600 font-bold animate-pulse">Correct! +500 XP Awarded</p>}
            </div>
         </Modal>
      ))}

      {paymentModal && (
         <Modal title="Secure Escrow Payment" onClose={() => setPaymentModal(null)}>
            <div className="space-y-6 pt-4">
               <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-4 shadow-inner">
                     <CreditCard size={40}/>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Payable</p>
                  <h2 className="text-5xl font-black text-gray-900 dark:text-white mt-2">₹{paymentModal.amount}</h2>
               </div>
               
               <div className="bg-gray-50 dark:bg-[#020617] p-5 rounded-2xl text-sm space-y-3 border border-gray-100 dark:border-white/5">
                  <div className="flex justify-between text-gray-500"><span>Service Fee (Platform)</span><span>4%</span></div>
                  <div className="flex justify-between text-gray-500"><span>Taxes</span><span>0%</span></div>
                  <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base"><span>Freelancer Receives</span><span>₹{(parseFloat(paymentModal.amount) * 0.96).toFixed(2)}</span></div>
               </div>
               <Button onClick={processPayment} className="w-full py-4 text-lg shadow-xl shadow-indigo-500/20">Confirm Transfer</Button>
               <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1"><Lock size={12}/> 256-bit SSL Secured</p>
            </div>
         </Modal>
      )}

    </div>
  );
};

export default Dashboard;