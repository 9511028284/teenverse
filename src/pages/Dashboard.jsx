import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Menu, LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, Sparkles, Settings, LogOut, 
  Award, Sun, Moon, Bell, Search, PlusCircle, Lock, CheckCircle, Trash2, CreditCard, 
  Share2, Download, Swords, Package, Save, Maximize2, Minimize2, ShieldCheck, User, Crown, Receipt, Heart, Clock, Zap, ThumbsUp
} from 'lucide-react';
import { supabase } from '../supabase';
// We don't rely on external constants for the modals anymore to prevent crashes
import { COLORS, QUIZZES, BATTLES } from '../utils/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ChatSystem from '../components/features/ChatSystem';
import Pricing from './Pricing';

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
  
  // UI States
  const [showNotifications, setShowNotifications] = useState(false); 
  const [modal, setModal] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const lastNotificationId = useRef(null);
  
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  // Safety check: ensure user object exists before creating state
  const [profileForm, setProfileForm] = useState(user ? { ...user } : {});

  // Feature States
  const [paymentModal, setPaymentModal] = useState(null); 
  const [parentMode, setParentMode] = useState(false);
  const [unlockedSkills, setUnlockedSkills] = useState(user?.unlockedSkills || []);
  const [badges, setBadges] = useState(user?.badges || ['Verified']);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [rawPortfolioText, setRawPortfolioText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [quizState, setQuizState] = useState({ selected: null, status: 'idle' }); 
  const [activeBattles, setActiveBattles] = useState(BATTLES || []); 

  // --- HARDCODED DATA TO PREVENT CRASHES ---
  const LOCAL_CATEGORIES = {
    'development': 'Development',
    'design': 'Design',
    'marketing': 'Marketing',
    'writing': 'Writing',
    'video': 'Video Editing',
    'data': 'Data Entry'
  };

  const SAFE_QUIZZES = QUIZZES || {};

  // XP Calculation
  const currentXP = unlockedSkills.length * 500;
  const nextLevelXP = (Math.floor(currentXP / 2000) + 1) * 2000;
  const progressPercent = (currentXP / nextLevelXP) * 100;
  const userLevel = Math.floor(currentXP / 2000) + 1;

  // Filter Jobs Logic
  const filteredJobs = jobs.filter(job => 
    (job.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (job.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (job.tags?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // 1. Fetch Services
      const { data: allServices, error: sError } = await supabase.from('services').select('*').order('created_at', {ascending: false});
      if (!sError && allServices) {
          if (!isClient) {
             setServices(allServices.filter(s => s.freelancer_id === user.id));
          } else {
             setServices(allServices);
          }
      }

      // 2. Fetch Jobs & Applications
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

      // 3. Calculate Earnings
      const total = appsData.reduce((acc, curr) => {
        if (curr.status === 'Paid') {
          const amount = Number(curr.bid_amount) || 0;
          return isClient ? acc + amount : acc + (amount * 0.96);
        }
        return acc;
      }, 0);
      setTotalEarnings(total);

      // 4. Fetch Notifications
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {ascending: false});
      if (notifs && notifs.length > 0) {
        const latest = notifs[0];
        if (lastNotificationId.current && latest.id !== lastNotificationId.current) {
          showToast(latest.message, 'success');
        }
        lastNotificationId.current = latest.id;
      }
      setNotifications(notifs || []);
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
        job_type: 'Fixed', // Defaulting to simple fixed price
        duration: formData.get('duration'), 
        tags: formData.get('tags'), 
        description: formData.get('description'), 
        category: formData.get('category') || 'development' 
    };
    
    const { error } = await supabase.from('jobs').insert([jobData]);
    if (error) {
        showToast(error.message, 'error'); 
    } else { 
        showToast('Job Posted!'); 
        setModal(null); 
    }
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
      category: formData.get('category') || 'development'
    };
    
    const { error } = await supabase.from('services').insert([serviceData]);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Gig Created Successfully!');
      setModal(null);
      setServices([serviceData, ...services]);
    }
  };

  const handleDeleteService = async (id) => {
    if(!window.confirm("Are you sure you want to delete this gig?")) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Service Deleted');
      setServices(services.filter(s => s.id !== id));
    }
  };

  const handleApplyJob = async (e) => {
    e.preventDefault();
    if (parentMode) { showToast("Parent Mode Active: Cannot apply.", "error"); return; }
    if (!isClient && selectedJob) {
      const jobCategory = selectedJob.category || 'dev';
      if (!unlockedSkills.includes(jobCategory)) {
        showToast(`Locked! Pass the ${jobCategory} quiz in Academy first.`, "error");
        setModal('quiz-locked');
        return;
      }
    }
    // Check if already applied
    if (applications.some(app => app.job_id === selectedJob.id && app.freelancer_id === user.id)) { 
        showToast("Already applied!", "error"); 
        return; 
    }

    const formData = new FormData(e.target);
    const appData = { job_id: selectedJob.id, freelancer_id: user.id, freelancer_name: user.name, client_id: selectedJob.client_id, cover_letter: formData.get('cover_letter'), bid_amount: formData.get('bid_amount') };
    const { error } = await supabase.from('applications').insert([appData]);
    
    if (error) {
        showToast(error.message, 'error');
    } else { 
        await supabase.from('notifications').insert([{ user_id: selectedJob.client_id, message: `New application: ${selectedJob.title}` }]);
        showToast('Applied successfully!'); 
        setModal(null); 
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tableName = isClient ? 'clients' : 'freelancers';
    const cleanUpdates = {
        name: profileForm.name,
        phone: profileForm.phone,
        nationality: profileForm.nationality
    };

    if (!isClient) {
        cleanUpdates.age = profileForm.age;
        cleanUpdates.qualification = profileForm.qualification;
        cleanUpdates.specialty = profileForm.specialty;
        cleanUpdates.services = profileForm.services;
        cleanUpdates.upi = profileForm.upi;
    } else {
        cleanUpdates.is_organisation = profileForm.is_organisation;
    }

    const { error } = await supabase.from(tableName).update(cleanUpdates).eq('id', user.id);
    if (error) { showToast(error.message, 'error'); } else { showToast("Profile updated!"); setUser({ ...user, ...cleanUpdates }); }
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
        
        // Update DB
        await supabase.from('freelancers').update({ unlocked_skills: newSkills }).eq('id', user.id);
        
        setUser({ ...user, unlockedSkills: newSkills });
        setModal(null); 
        setQuizState({ selected: null, status: 'idle' });
        showToast("🎉 Skill Unlocked! +500 XP", "success");
      }, 1500);
    } else {
      setTimeout(() => {
        setQuizState({ selected: null, status: 'idle' });
        showToast("Incorrect. Try again!", "error");
      }, 1000);
    }
  };

  const handleAiGenerate = () => {
    if (!rawPortfolioText) return;
    setIsAiLoading(true);
    setTimeout(() => {
      const newItem = { id: Date.now(), title: "Professional Case Study", content: `Project Overview: ${rawPortfolioText}. \n\nOutcome: Successfully delivered a high-quality solution demonstrating core competencies in problem-solving and technical execution.` };
      setPortfolioItems([newItem, ...portfolioItems]);
      setRawPortfolioText("");
      setIsAiLoading(false);
      showToast("AI Magic Applied!");
    }, 1500);
  };

  const updateStatus = async (appId, status, freelancerId) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', appId);
    if(error) {
        showToast(error.message, 'error');
        return;
    }
    let msg = `Application ${status} by client.`;
    if(status === 'Accepted') msg = `Application Accepted! You can start working.`;
    
    await supabase.from('notifications').insert([{ user_id: freelancerId, message: msg }]);
    showToast(`Marked as ${status}`);
    setApplications(applications.map(a => a.id === appId ? { ...a, status } : a));
  };

  const initiatePayment = (appId, amount, freelancerId) => {
    setPaymentModal({ appId, amount, freelancerId });
  };

  const processPayment = async () => {
    if (!paymentModal) return;
    const { appId, amount, freelancerId } = paymentModal;

    const { error } = await supabase.from('applications').update({ status: 'Paid' }).eq('id', appId);
    
    if (error) {
        showToast(error.message, 'error');
    } else {
        await supabase.from('notifications').insert([{ user_id: freelancerId, message: `💰 Payment of ₹${amount} received for Job #${String(appId).slice(0,6)}` }]);
        showToast("Payment Successful! Freelancer notified.", "success");
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: 'Paid' } : a));
        setPaymentModal(null);
    }
  };

  const handleJoinBattle = (battleId) => {
    if (parentMode) return;
    showToast("Battle Joined! Submit your work before deadline.");
  };
  
  const handleVote = (battleId, entryId) => {
     if (parentMode) return;
     const updatedBattles = activeBattles.map(b => {
       if(b.id === battleId) {
         return { ...b, entries: b.entries.map(e => e.id === entryId ? {...e, votes: e.votes + 1} : e) }
       }
       return b;
     });
     setActiveBattles(updatedBattles);
     showToast("Voted! Good choice.");
  };

  const handleDownloadCard = () => alert("Download feature coming soon!");

  // UI Helper for Sidebar Items
  const SidebarItem = ({ id, icon: Icon, label, color }) => (
    <button 
      onClick={() => {setTab(id); setMenuOpen(false);}} 
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
        ${tab === id 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm translate-x-1' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
        }
      `}
    >
      <Icon size={18} className={tab === id ? 'text-indigo-600 dark:text-indigo-400' : color || ''} />
      {!zenMode && label}
      {!zenMode && tab === id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-auto animate-pulse" />}
    </button>
  );

  const getTabIcon = () => {
    switch(tab) {
      case 'overview': return <LayoutDashboard className="text-indigo-500"/>;
      case 'jobs': return <Briefcase className="text-blue-500"/>;
      case 'academy': return <BookOpen className="text-green-500"/>;
      case 'battles': return <Swords className="text-red-500"/>;
      case 'settings': return <Settings className="text-gray-500"/>;
      case 'profile-card': return <User className="text-purple-500"/>;
      default: return <LayoutDashboard className="text-indigo-500"/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B1120] transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Mobile Backdrop */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 
          bg-white dark:bg-[#0F172A]/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 
          transform transition-all duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
          ${zenMode ? 'md:w-20' : 'md:w-72'} 
          flex flex-col h-full shadow-2xl md:shadow-none
        `}
      >
        <div className={`p-6 border-b border-gray-100 dark:border-gray-800 flex ${zenMode ? 'justify-center' : 'justify-between'} items-center flex-shrink-0`}>
          <div className="flex items-center gap-3 font-black text-xl text-gray-900 dark:text-white overflow-hidden">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS?.primary || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-white shadow-lg shadow-indigo-500/30`}>
              <Rocket size={20} />
            </div>
            {!zenMode && <span className="animate-fade-in whitespace-nowrap">TeenVerse</span>}
          </div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white"><Minimize2 size={24}/></button>
        </div>

        {!zenMode && (
          <div className="px-6 py-4 animate-fade-in">
             <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-lg border-2 border-white dark:border-gray-600 shadow-md">
                     {user.name ? user.name[0] : <User />}
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-800">
                     {userLevel}
                   </div>
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-bold truncate dark:text-gray-200 flex items-center gap-1">
                    {user.name?.split(' ')[0] || 'User'} 
                    {badges.length > 0 && <Award size={12} className="text-yellow-500 fill-yellow-500"/>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type}</p>
                </div>
             </div>
             <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-1 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{width: `${progressPercent}%`}}></div>
             </div>
             <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                <span>{currentXP} XP</span>
                <span>Next: {nextLevelXP}</span>
             </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
           {zenMode ? (
             <div className="flex flex-col items-center gap-4 pt-4">
                <button onClick={() => setTab('overview')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><LayoutDashboard size={20}/></button>
                <button onClick={() => setTab('jobs')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><Briefcase size={20}/></button>
                <button onClick={() => setTab('messages')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><MessageSquare size={20}/></button>
                
             </div>
           ) : (
             <>
               <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
               <SidebarItem id="pricing" icon={CheckCircle} label="Get Verified" color="text-yellow-500" />
               <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Work</div>
               <SidebarItem id="jobs" icon={Briefcase} label={isClient ? 'jobs' : 'Find Work'} />
               {!isClient && <SidebarItem id="my-services" icon={Package} label="My Services" />}
               <SidebarItem id="applications" icon={FileText} label={isClient ? 'Applicants' : 'Applications'} />
               <SidebarItem id="messages" icon={MessageSquare} label="Messages" />
               
               {!isClient && (
                 <>
                   <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Growth</div>
                   <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                   <SidebarItem id="battles" icon={Swords} label="Battles" color="text-red-500" />
                   <SidebarItem id="portfolio" icon={Sparkles} label="Portfolio AI" color="text-purple-500" />
                   <SidebarItem id="profile-card" icon={Share2} label="Share Profile" />
                 </>
               )}
               
               <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">System</div>
               <SidebarItem id="records" icon={ShieldCheck} label="Records" />
               <SidebarItem id="settings" icon={Settings} label="Settings" />
             </>
           )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
           <Button variant="ghost" className={`w-full ${zenMode ? 'justify-center px-0' : 'justify-start'} text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10`} icon={LogOut} onClick={onLogout}>
             {!zenMode && "Sign Out"}
           </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0B1120] relative">
         <header className="bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 md:gap-4">
               <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg dark:text-white"><Menu/></button>
               <button onClick={() => setZenMode(!zenMode)} className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
                 {zenMode ? <Maximize2 size={20}/> : <Minimize2 size={20}/>}
               </button>
               <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hidden sm:block">{getTabIcon()}</div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white capitalize">{tab.replace('-', ' ')}</h2>
               </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
               <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
               </button>
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full relative">
                  <Bell size={20}/>
                  {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce"></span>}
               </button>
               
               {showNotifications && (
                 <div className="absolute right-4 top-16 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-[#0F172A]">
                       <span className="font-bold text-sm dark:text-white">Notifications</span>
                       <button onClick={handleClearNotifications} className="text-xs text-indigo-500">Clear All</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                       {notifications.length === 0 ? <div className="p-6 text-center text-gray-400 text-xs">No new alerts</div> : notifications.map(n => (
                          <div key={n.id} className="p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs dark:text-gray-300">{n.message}</div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
            <div className="max-w-6xl mx-auto">
            
            {/* PRICING */}
            {tab === 'pricing' && <Pricing onBack={() => setTab('overview')} showToast={showToast} />}

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                 <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                    <div className="relative z-10">
                       <h1 className="text-2xl md:text-3xl font-bold mb-2">Hello, {user.name?.split(' ')[0]}! 👋</h1>
                       <p className="text-indigo-100 opacity-90 mb-6 max-w-xl">
                          {isClient ? "Track your projects and manage payments efficiently." : "Your skills are in high demand. Keep learning to earn more!"}
                       </p>
                       <div className="flex gap-3">
                          <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg" onClick={() => setTab('jobs')}>{isClient ? 'Post Job' : 'Find Work'}</Button>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2">{isClient ? 'Total Spent' : 'Earnings'}</p>
                       <h3 className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalEarnings.toFixed(2)}</h3>
                    </div>
                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2">{isClient ? 'Active Jobs' : 'Applications'}</p>
                       <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{isClient ? jobs.length : applications.length}</h3>
                    </div>
                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                       <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-2">XP Level</p>
                       <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{userLevel}</h3>
                    </div>
                 </div>
              </div>
            )}

            {/* ACADEMY TAB */}
            {tab === 'academy' && !isClient && (
               <div className="animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                     <div>
                        <h2 className="text-2xl font-bold dark:text-white">Skill Academy</h2>
                        <p className="text-gray-500 dark:text-gray-400">Take quizzes to unlock new job categories.</p>
                     </div>
                     <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg font-bold text-sm">
                        {unlockedSkills.length} Skills Unlocked
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {Object.entries(SAFE_QUIZZES).map(([key, quiz]) => {
                        const isUnlocked = unlockedSkills.includes(key);
                        return (
                           <div key={key} className={`bg-white dark:bg-[#1E293B] p-6 rounded-2xl border ${isUnlocked ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-gray-200 dark:border-gray-700'} shadow-sm relative overflow-hidden`}>
                              {isUnlocked && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-xl font-bold">UNLOCKED</div>}
                              <h3 className="text-xl font-bold dark:text-white mb-2 flex items-center gap-2">
                                 {isUnlocked ? <CheckCircle size={20} className="text-emerald-500"/> : <Lock size={20} className="text-gray-400"/>}
                                 {quiz.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pass this quiz to apply for {key.toUpperCase()} jobs.</p>
                              {!isUnlocked ? (
                                 <Button onClick={() => setModal(`quiz-${key}`)} className="w-full">Start Quiz</Button>
                              ) : (
                                 <Button variant="outline" disabled className="w-full border-emerald-200 text-emerald-600 dark:border-emerald-900 dark:text-emerald-500">Completed</Button>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}

            {/* PORTFOLIO AI TAB */}
            {tab === 'portfolio' && !isClient && (
               <div className="animate-fade-in space-y-6">
                  <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
                     <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles/> Portfolio AI Builder</h2>
                     <p className="text-purple-100 mt-2 max-w-2xl">Don't know how to write a case study? Just describe what you did roughly, and our AI will format it into a professional portfolio piece.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-fit">
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Generate New Item</h3>
                        <textarea 
                           className="w-full h-40 p-4 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:text-white mb-4 resize-none"
                           placeholder="Example: I built a website for a local bakery using React..."
                           value={rawPortfolioText}
                           onChange={(e) => setRawPortfolioText(e.target.value)}
                        ></textarea>
                        <Button 
                           onClick={handleAiGenerate} 
                           disabled={isAiLoading || !rawPortfolioText} 
                           className={`w-full ${isAiLoading ? 'opacity-70' : ''}`}
                           icon={Sparkles}
                        >
                           {isAiLoading ? 'Generating...' : 'Generate with AI'}
                        </Button>
                     </div>

                     <div className="space-y-4">
                        <h3 className="font-bold text-lg dark:text-white">Your Portfolio</h3>
                        {portfolioItems.length === 0 && (
                           <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center text-gray-400">
                              No items yet. Use the AI to generate one!
                           </div>
                        )}
                        {portfolioItems.map(item => (
                           <div key={item.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">{item.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* PROFILE SHARE CARD */}
            {tab === 'profile-card' && !isClient && (
               <div className="flex flex-col items-center animate-fade-in">
                  <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                     <div className="relative z-10 mt-16">
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-[#1E293B] p-1 mx-auto mb-4">
                           <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-600 dark:text-gray-300 border-4 border-white dark:border-[#1E293B]">
                              {user.name ? user.name[0] : <User/>}
                           </div>
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
                        <p className="text-indigo-500 font-medium mb-4">{user.specialty || "Freelancer"}</p>
                        
                        <div className="flex justify-center gap-2 mb-6">
                           {badges.map((badge, i) => (
                              <span key={i} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs px-2 py-1 rounded-full font-bold border border-yellow-200 dark:border-yellow-900/50">{badge}</span>
                           ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6 border-t border-b border-gray-100 dark:border-gray-700 py-4">
                           <div><div className="font-bold text-gray-900 dark:text-white">{(applications || []).filter(a => a.status === 'Paid').length}</div><div className="text-xs text-gray-500">Jobs</div></div>
                           <div><div className="font-bold text-gray-900 dark:text-white">{userLevel}</div><div className="text-xs text-gray-500">Level</div></div>
                           <div><div className="font-bold text-gray-900 dark:text-white">4.9</div><div className="text-xs text-gray-500">Rating</div></div>
                        </div>

                        <div className="flex gap-3">
                           <Button className="flex-1" icon={Share2} onClick={() => showToast("Link copied to clipboard!")}>Share Link</Button>
                           <Button variant="outline" className="flex-1" icon={Download} onClick={() => showToast("Image saved to device!")}>Save Image</Button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* JOBS TAB */}
            {tab === 'jobs' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                        <input 
                           type="text" 
                           placeholder="Search for jobs (e.g. React, Design)..." 
                           className="w-full bg-gray-50 dark:bg-[#0F172A] pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-indigo-500 dark:text-white transition-colors"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     {isClient && <Button onClick={() => setModal('post-job')} icon={PlusCircle}>Post New Job</Button>}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {filteredJobs.map(job => (
                        <div key={job.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                           <div className="flex justify-between items-start mb-3">
                              <h3 className="font-bold text-lg dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">₹{job.budget}</span>
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                           <div className="flex flex-wrap gap-2 mb-4">
                              {job.tags?.split(',').map((tag, i) => (
                                 <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">{tag.trim()}</span>
                              ))}
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-xs text-gray-400">Posted by {job.client_name}</span>
                              {!isClient && (
                                 <Button size="sm" onClick={() => { setSelectedJob(job); setModal('apply-job'); }}>Apply Now</Button>
                              )}
                           </div>
                        </div>
                     ))}
                     {filteredJobs.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">No jobs found matching your search.</div>}
                  </div>
               </div>
            )}

            {/* MY SERVICES (Freelancer Only) */}
            {tab === 'my-services' && !isClient && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold dark:text-white">My Gigs</h2>
                     <Button onClick={() => setModal('create-service')} icon={PlusCircle}>Create Gig</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {services.map(service => (
                        <div key={service.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group">
                           <button onClick={() => handleDeleteService(service.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                           <h3 className="font-bold text-lg dark:text-white mb-2">{service.title}</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>
                           <div className="flex justify-between items-center font-bold">
                              <span className="text-indigo-600 dark:text-indigo-400">₹{service.price}</span>
                              <span className="text-xs text-gray-400 font-normal">{service.delivery_time} Delivery</span>
                           </div>
                        </div>
                     ))}
                     {services.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">You haven't created any gigs yet.</div>}
                  </div>
               </div>
            )}

            {/* APPLICATIONS TAB */}
            {tab === 'applications' && (
               <div className="space-y-6 animate-fade-in">
                  <h2 className="text-xl font-bold dark:text-white">{isClient ? 'Received Applications' : 'My Applications'}</h2>
                  <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                              <tr>
                                 <th className="p-4 whitespace-nowrap">{isClient ? 'Freelancer' : 'Client'}</th>
                                 <th className="p-4 whitespace-nowrap">Job ID</th>
                                 <th className="p-4 whitespace-nowrap">Cover Letter</th>
                                 <th className="p-4 whitespace-nowrap">Bid</th>
                                 <th className="p-4 whitespace-nowrap">Status</th>
                                 <th className="p-4 whitespace-nowrap text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {applications.map(app => (
                                 <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-4 font-medium dark:text-white whitespace-nowrap">{isClient ? app.freelancer_name : app.client_id}</td>
                                    <td className="p-4 text-xs font-mono text-gray-500 whitespace-nowrap">#{String(app.job_id).slice(0,6)}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{app.cover_letter}</td>
                                    <td className="p-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">₹{app.bid_amount}</td>
                                    <td className="p-4 whitespace-nowrap">
                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                          app.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                          app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                          'bg-amber-100 text-amber-700'
                                       }`}>{app.status}</span>
                                    </td>
                                    <td className="p-4 text-right whitespace-nowrap">
                                       {isClient && app.status === 'Pending' && (
                                          <div className="flex justify-end gap-2">
                                             <Button size="sm" onClick={() => updateStatus(app.id, 'Accepted', app.freelancer_id)} className="bg-emerald-500 hover:bg-emerald-600">Accept</Button>
                                             <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'Rejected', app.freelancer_id)} className="text-red-500 border-red-200 hover:bg-red-50">Reject</Button>
                                          </div>
                                       )}
                                       {isClient && app.status === 'Accepted' && !parentMode && (
                                          <Button size="sm" onClick={() => initiatePayment(app.id, app.bid_amount, app.freelancer_id)}>Pay Now</Button>
                                       )}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                     {applications.length === 0 && <div className="p-8 text-center text-gray-400">No records found.</div>}
                  </div>
               </div>
            )}

            {tab === 'messages' && <ChatSystem currentUser={user} activeChat={activeChat} setActiveChat={setActiveChat} parentMode={parentMode} />}


            {/* BATTLES TAB */}
            {tab === 'battles' && !isClient && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                     <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3"><Swords size={32}/> Weekly Battles</h2>
                        <p className="text-orange-100">Compete with other teens, win XP, badges, and community clout!</p>
                     </div>
                  </div>
                  <div className="grid gap-6">
                     {activeBattles.map(battle => (
                        <div key={battle.id} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                           <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
                              <div>
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase">Live</span>
                                    <span className="text-gray-500 text-xs">{battle.timeLeft} Left</span>
                                 </div>
                                 <h3 className="text-xl font-bold dark:text-white">{battle.title}</h3>
                                 <p className="text-gray-600 dark:text-gray-300 text-sm">{battle.description}</p>
                              </div>
                              <div className="text-right">
                                 <div className="text-xl font-bold text-indigo-600">{battle.reward}</div>
                                 <Button size="sm" className="mt-2" onClick={() => handleJoinBattle(battle.id)}>Join</Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
            
            {/* RECORDS & COMPLIANCE TAB */}
            {tab === 'records' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col sm:flex-row items-start gap-4">
                     <ShieldCheck className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24}/>
                     <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 text-lg">Safety Records</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Permanent record of all contracts for safety compliance.</p>
                     </div>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                              <tr>
                                 <th className="p-4 whitespace-nowrap">Job ID</th>
                                 <th className="p-4 whitespace-nowrap">Date</th>
                                 <th className="p-4 whitespace-nowrap">Status</th>
                                 <th className="p-4 whitespace-nowrap">Amount</th>
                                 <th className="p-4 whitespace-nowrap text-right">Record</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {applications.map(app => (
                                 <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-4 text-xs font-mono dark:text-gray-300 whitespace-nowrap">#{String(app.job_id).slice(0,8)}</td>
                                    <td className="p-4 text-sm dark:text-gray-300 whitespace-nowrap">{new Date(app.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 whitespace-nowrap"><span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-bold">{app.status}</span></td>
                                    <td className="p-4 font-bold dark:text-white whitespace-nowrap">₹{app.bid_amount}</td>
                                    <td className="p-4 text-right whitespace-nowrap"><button className="text-xs text-indigo-600 font-bold hover:underline">Download PDF</button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {/* SETTINGS TAB */}
            {tab === 'settings' && (
               <div className="max-w-2xl mx-auto bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg animate-fade-in">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Settings/> Settings</h2>
                  <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl mb-6">
                     <div><h3 className="font-bold text-amber-900 dark:text-amber-100">Parent Mode</h3><p className="text-xs text-amber-700 dark:text-amber-400">Read-only view for safety.</p></div>
                     <button onClick={() => setParentMode(!parentMode)} className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${parentMode ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{parentMode ? "Active" : "Inactive"}</button>
                  </div>
                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                     <Input label="Full Name" value={profileForm.name || ""} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Phone" value={profileForm.phone || ""} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                        <Input label="Nationality" value={profileForm.nationality || ""} onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} />
                     </div>
                     {!isClient && (
                        <>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input label="Age" value={profileForm.age || ""} onChange={e => setProfileForm({...profileForm, age: e.target.value})} />
                              <Input label="Qualification" value={profileForm.qualification || ""} onChange={e => setProfileForm({...profileForm, qualification: e.target.value})} />
                           </div>
                           <Input label="Specialty" value={profileForm.specialty || ""} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} />
                        </>
                     )}
                     <div className="pt-4"><Button className="w-full" icon={Save} disabled={parentMode}>Save Changes</Button></div>
                  </form>
               </div>
            )}

            </div>
         </div>
      </main>

      {/* --- FIXED: POST JOB MODAL (USES STANDARD HTML INPUTS TO PREVENT CRASHES) --- */}
      
      {modal === 'post-job' && (
        <Modal title="Post Job" onClose={() => setModal(null)}>
          <form onSubmit={handlePostJob} className="space-y-4">
            <Input name="title" label="Title" required />
            <div className="grid grid-cols-2 gap-4"><Input name="budget" label="Budget" required /><Input name="duration" label="Duration" required /></div>
            <Input name="type" label="Type" type="select" options={["Fixed", "Hourly"]} />
            <Input name="category" label="Category" type="select" options={["dev", "design", "video", "music"]} />
            <Input name="tags" label="Tags" />
            <Input name="description" label="Description" type="textarea" required />
            <Button className="w-full">Post Job</Button>
          </form>
        </Modal>
      )}

      {/* --- FIXED: CREATE GIG MODAL (USES STANDARD HTML INPUTS TO PREVENT CRASHES) --- */}
      {modal === 'create-service' && (
        <Modal title="Create a Gig" onClose={() => setModal(null)}>
          <form onSubmit={handleCreateService} className="space-y-4">
            <Input name="title" label="Gig Title" placeholder="I will design a logo..." required />
            <div className="grid grid-cols-2 gap-4">
               <Input name="price" label="Price (₹)" required />
               <Input name="delivery_time" label="Delivery Time" placeholder="e.g. 3 Days" required />
            </div>
            <Input name="category" label="Category" type="select" options={["dev", "design", "video", "music"]} />
            <Input name="description" label="Description" type="textarea" required />
            <Button className="w-full">Publish Gig</Button>
          </form>
        </Modal>
      )}

      {/* APPLY JOB MODAL - USES STANDARD INPUTS */}
      {modal === 'apply-job' && selectedJob && (
        <Modal title={`Apply for: ${selectedJob.title}`} onClose={() => setModal(null)}>
           <form onSubmit={handleApplyJob} className="space-y-4">
              <div className="bg-gray-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 mb-4">
                 <p><strong>Client Budget:</strong> ₹{selectedJob.budget}</p>
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-300">Your Bid (₹)</label>
                 <input name="bid_amount" type="number" defaultValue={selectedJob.budget} className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                 <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cover Letter</label>
                 <textarea name="cover_letter" rows="5" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Why are you the best fit?" required></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Submit Proposal</button>
           </form>
        </Modal>
      )}

      {modal === 'quiz-locked' && (
         <Modal title="Skill Locked! 🔒" onClose={() => setModal(null)}>
            <div className="text-center space-y-4">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500"><Lock size={32}/></div>
               <p className="text-gray-600 dark:text-gray-300">You need to pass the relevant quiz in the <strong>Academy</strong> tab before you can apply for these jobs.</p>
               <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full">Go to Academy</Button>
            </div>
         </Modal>
      )}

      {Object.keys(SAFE_QUIZZES).map(key => modal === `quiz-${key}` && (
         <Modal key={key} title={SAFE_QUIZZES[key].title} onClose={() => {setModal(null); setQuizState({selected: null, status: 'idle'});}}>
            <div className="space-y-4">
               <p className="font-medium text-lg dark:text-white">{SAFE_QUIZZES[key].question}</p>
               <div className="space-y-2">
                  {SAFE_QUIZZES[key].options.map((opt, i) => (
                     <button 
                        key={i}
                        onClick={() => handleQuizSelection(key, opt)}
                        disabled={quizState.status !== 'idle'}
                        className={`w-full p-4 rounded-xl text-left border transition-all font-medium
                           ${quizState.selected === opt 
                              ? (quizState.status === 'correct' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-red-100 border-red-500 text-red-700')
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-[#0F172A] dark:border-gray-700 dark:text-gray-300'
                           }
                        `}
                     >
                        {opt}
                     </button>
                  ))}
               </div>
               {quizState.status === 'correct' && <p className="text-center text-emerald-600 font-bold animate-bounce">Correct! Unlocking Skill...</p>}
            </div>
         </Modal>
      ))}

      {paymentModal && (
         <Modal title="Secure Payment Gateway" onClose={() => setPaymentModal(null)}>
            <div className="space-y-6 text-center">
               <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600"><CreditCard size={40}/></div>
               <div>
                  <p className="text-gray-500 text-sm uppercase font-bold">Total Amount</p>
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white">₹{paymentModal.amount}</h2>
               </div>
               <div className="bg-gray-50 dark:bg-[#0F172A] p-4 rounded-xl text-left space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{paymentModal.amount}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Platform Fee (4%)</span><span>₹{(paymentModal.amount * 0.04).toFixed(2)}</span></div>
                  <div className="border-t pt-2 font-bold flex justify-between mt-2"><span>Total Payable</span><span>₹{(parseFloat(paymentModal.amount) * 1.04).toFixed(2)}</span></div>
               </div>
               <Button onClick={processPayment} className="w-full py-3 text-lg">Confirm Payment</Button>
               <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><Lock size={12}/> 128-bit Secure SSL Connection</p>
            </div>
         </Modal>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;