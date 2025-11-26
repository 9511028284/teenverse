import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Menu, LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, Sparkles, Settings, LogOut, 
  Award, Sun, Moon, Bell, Search, Filter, PlusCircle, Zap, Lock, Check, Clock, Trash2, ThumbsUp, CreditCard, 
  Receipt, X, CheckCircle, Package, Save, Share2, Download, 
  Trophy, Unlock, Swords, Heart, Crown, ShieldCheck, FileCheck, Maximize2, Minimize2, User, ListChecks
} from 'lucide-react';
import { supabase } from '../supabase';
import { CATEGORIES, COLORS, QUIZZES, BATTLES, PRICING_PLANS } from '../utils/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ChatSystem from '../components/features/ChatSystem';
import Pricing from './Pricing';

// Import Sub-Components
import Overview from '../components/dashboard/Overview';
import Jobs from '../components/dashboard/Jobs';
import MyServices from '../components/dashboard/MyServices';
import ClientPostedJobs from '../components/dashboard/ClientPostedJobs'; // NEW IMPORT
import Applications from '../components/dashboard/Applications';
import Academy from '../components/dashboard/Academy';
import Battles from '../components/dashboard/Battles';
import Portfolio from '../components/dashboard/Portfolio';
import ProfileCard from '../components/dashboard/ProfileCard';
import Records from '../components/dashboard/Records';
import SettingsComp from '../components/dashboard/SettingsComp';

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

  const [quizState, setQuizState] =
  useState({ selected : null, status: 'idle'});


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
    if (error) {
        showToast(error.message, 'error'); 
    } else { 
        showToast('Job Posted!'); 
        setModal(null); 
        // Optimistic update for client view
        setJobs([jobData, ...jobs]);
    }
  };

  const handleDeleteJob = async (id) => {
    if(!window.confirm("Are you sure you want to delete this job?")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Job Deleted');
      setJobs(jobs.filter(j => j.id !== id));
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
      category: formData.get('category')
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
    if(!window.confirm("Delete this gig?")) return;
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

  const handleDownloadCard = () => alert("Download feature coming soon!");

  // UI Helpers
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
      case 'posted-jobs': return <ListChecks className="text-indigo-500"/>; // Updated icon
      case 'academy': return <BookOpen className="text-green-500"/>;
      case 'battles': return <Swords className="text-red-500"/>;
      case 'settings': return <Settings className="text-gray-500"/>;
      case 'profile-card': return <User className="text-purple-500"/>;
      case 'pricing': return <Crown className="text-yellow-500"/>;
      case 'records': return <ShieldCheck className="text-blue-500"/>;
      default: return <LayoutDashboard className="text-indigo-500"/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B1120] transition-colors duration-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0F172A]/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 flex flex-col h-screen shadow-2xl md:shadow-none ${zenMode ? 'md:w-20' : 'md:w-72'}`}>
        {/* ... Sidebar Header ... */}
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
                   <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-lg border-2 border-white dark:border-gray-600 shadow-md">{user.name ? user.name[0] : <User />}</div>
                   <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-800">{userLevel}</div>
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-bold truncate dark:text-gray-200 flex items-center gap-1">{user.name?.split(' ')[0] || 'User'} {badges.length > 0 && <Award size={12} className="text-yellow-500 fill-yellow-500"/>}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type}</p>
                </div>
             </div>
             <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-1 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{width: `${progressPercent}%`}}></div></div>
             <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold"><span>{currentXP} XP</span><span>Next: {nextLevelXP}</span></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
           {zenMode ? (
             <div className="flex flex-col items-center gap-4 pt-4">
                <button onClick={() => setTab('overview')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><LayoutDashboard size={20}/></button>
                <button onClick={() => setTab('jobs')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><Briefcase size={20}/></button>
                <button onClick={() => setTab('messages')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><MessageSquare size={20}/></button>
                {!isClient && <button onClick={() => setTab('academy')} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"><BookOpen size={20}/></button>}
             </div>
           ) : (
             <>
               <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
               <SidebarItem id="pricing" icon={CheckCircle} label="Get Verified" color="text-yellow-500" />
               
               <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Work</div>
               <SidebarItem id="jobs" icon={Briefcase} label={isClient ? 'Find Services' : 'Find Work'} />
               {/* NEW: MY POSTED JOBS FOR CLIENT */}
               {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Posted Jobs" />}
               
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
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
           <Button variant="ghost" className={`w-full ${zenMode ? 'justify-center px-0' : 'justify-start'} text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10`} icon={LogOut} onClick={onLogout}>{!zenMode && "Sign Out"}</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0B1120] relative">
         {/* Header */}
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
               <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full relative"><Bell size={20}/>{notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce"></span>}</button>
               {showNotifications && (
                 <div className="absolute right-4 top-16 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-[#0F172A]"><span className="font-bold text-sm dark:text-white">Notifications</span><button onClick={handleClearNotifications} className="text-xs text-indigo-500">Clear All</button></div>
                    <div className="max-h-64 overflow-y-auto">{notifications.length === 0 ? <div className="p-6 text-center text-gray-400 text-xs">No new alerts</div> : notifications.map(n => <div key={n.id} className="p-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs dark:text-gray-300">{n.message}</div>)}</div>
                 </div>
               )}
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
            <div className="max-w-6xl mx-auto">
            {tab === 'pricing' && <Pricing onBack={() => setTab('overview')} showToast={showToast} />}
            {tab === 'overview' && <Overview user={user} isClient={isClient} totalEarnings={totalEarnings} jobsCount={isClient ? jobs.length : applications.length} badgesCount={badges.length} setTab={setTab} />}
            {tab === 'jobs' && <Jobs isClient={isClient} services={services} filteredJobs={filteredJobs} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} parentMode={parentMode} />}
            
            {/* NEW: CLIENT POSTED JOBS TAB */}
            {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setModal} handleDeleteJob={handleDeleteJob} />}

            {tab === 'my-services' && !isClient && <MyServices services={services} setModal={setModal} handleDeleteService={handleDeleteService} />}
            {tab === 'applications' && <Applications applications={applications} isClient={isClient} updateStatus={updateStatus} initiatePayment={initiatePayment} parentMode={parentMode} />}
            {tab === 'messages' && <div className="h-[calc(100vh-140px)]"><ChatSystem user={user} activeChat={activeChat} setActiveChat={setActiveChat} parentMode={parentMode} /></div>}
            {tab === 'academy' && !isClient && <Academy unlockedSkills={unlockedSkills} setModal={setModal} quizzes={SAFE_QUIZZES} />}
            {tab === 'battles' && !isClient && <Battles activeBattles={activeBattles} handleJoinBattle={handleJoinBattle} handleVote={handleVote} />}
            {tab === 'portfolio' && !isClient && <Portfolio rawPortfolioText={rawPortfolioText} setRawPortfolioText={setRawPortfolioText} handleAiGenerate={handleAiGenerate} isAiLoading={isAiLoading} portfolioItems={portfolioItems} />}
            {tab === 'profile-card' && !isClient && <ProfileCard user={user} unlockedSkills={unlockedSkills} badges={badges} userLevel={userLevel} applications={applications} handleDownloadCard={handleDownloadCard} showToast={showToast} />}
            {tab === 'records' && <Records applications={applications} />}
            {tab === 'settings' && <SettingsComp profileForm={profileForm} setProfileForm={setProfileForm} isClient={isClient} handleUpdateProfile={handleUpdateProfile} parentMode={parentMode} setParentMode={setParentMode} />}
            </div>
         </div>
      </main>

      {/* --- MODALS --- */}
      {modal === 'post-job' && (
        <Modal title="Post a Job" onClose={() => setModal(null)}>
          <form onSubmit={handlePostJob} className="space-y-4">
            <div>
               <label className="block text-sm font-medium mb-1 dark:text-gray-300">Job Title</label>
               <input 
                  name="title" 
                  type="text" 
                  placeholder="e.g. React Developer Needed" 
                  className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Budget (₹)</label>
                  <input name="budget" type="number" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Duration</label>
                  <input name="duration" type="text" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required />
               </div>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
               <select name="category" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none">{Object.keys(LOCAL_CATEGORIES).map(cat => <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>)}</select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
               <textarea name="description" rows="4" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required></textarea>
            </div>
            <Button className="w-full py-3">Post Job</Button>
          </form>
        </Modal>
      )}
      {modal === 'create-service' && (
        <Modal title="Create Gig" onClose={() => setModal(null)}>
           <form onSubmit={handleCreateService} className="space-y-4">
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
               <input name="title" type="text" placeholder="e.g. I will design logos" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Price (₹)</label><input name="price" type="number" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required /></div>
               <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase">Delivery</label><input name="delivery_time" type="text" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required /></div>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
               <select name="category" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none">{Object.keys(LOCAL_CATEGORIES).map(cat => <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>)}</select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
               <textarea name="description" rows="4" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required></textarea>
            </div>
            <Button className="w-full py-3">Create Gig</Button>
          </form>
        </Modal>
      )}
      {modal === 'apply-job' && (
        <Modal title="Apply for Job" onClose={() => setModal(null)}>
           <form onSubmit={handleApplyJob} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">Your Bid (₹)</label>
                 <input name="bid_amount" type="number" defaultValue={selectedJob?.budget} className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">Cover Letter</label>
                 <textarea name="cover_letter" rows="4" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] border rounded-xl dark:border-gray-700 dark:text-white outline-none" required></textarea>
              </div>
              <Button className="w-full py-3">Submit Proposal</Button>
           </form>
        </Modal>
      )}
      {/* Quiz & Payment Modals... */}
      {modal === 'quiz-locked' && (
         <Modal title="Locked" onClose={() => setModal(null)}>
            <div className="text-center py-6">
               <Lock className="mx-auto text-gray-400 mb-4" size={32}/>
               <p className="text-gray-600 dark:text-gray-300 mb-6">You need to unlock this skill in the Academy first.</p>
               <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full">Go to Academy</Button>
            </div>
         </Modal>
      )}
      {Object.keys(SAFE_QUIZZES).map(key => modal === `quiz-${key}` && (
         <Modal key={key} title={SAFE_QUIZZES[key].question} onClose={() => {setModal(null); setQuizState({selected: null, status: 'idle'});}}>
            <div className="space-y-4">
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
         <Modal title="Secure Payment" onClose={() => setPaymentModal(null)}>
            <div className="space-y-6 text-center pt-4">
               <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600"><CreditCard size={32}/></div>
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Amount</p>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white">₹{paymentModal.amount}</h2>
               </div>
               <div className="bg-gray-50 dark:bg-[#0F172A] p-4 rounded-xl text-sm space-y-2">
                  <div className="flex justify-between text-gray-500"><span>Platform Fee</span><span>4%</span></div>
                  <div className="flex justify-between font-bold dark:text-white border-t pt-2 border-gray-200 dark:border-gray-700"><span>Net Pay</span><span>₹{(parseFloat(paymentModal.amount) * 0.96).toFixed(2)}</span></div>
               </div>
               <Button onClick={processPayment} className="w-full py-3 text-lg">Confirm Payment</Button>
            </div>
         </Modal>
      )}
    </div>
  );
};

export default Dashboard;