import React from 'react';
// Adjust path as needed
import Pricing from '../components/dashboard/Pricing';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, LayoutDashboard, Briefcase, BookOpen, Settings, 
  Sun, Moon, Bell, User, Swords, ShieldCheck, Zap, ListChecks, Crown, Flag, Fingerprint, ShoppingBag
} from 'lucide-react';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

// UI Imports
import Button from '../components/ui/Button'; 
import Modal from '../components/ui/Modal';   
import SupportHub from '../components/dashboard/SupportHub'; 

// Components
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import ChatSystem from '../components/features/ChatSystem'; 
import DashboardModals from '../components/dashboard/DashboardModals';
import Overview from '../components/dashboard/Overview';
import Jobs from '../components/dashboard/Jobs';
import MyServices from '../components/dashboard/MyServices';
import ClientPostedJobs from '../components/dashboard/ClientPostedJobs';
import Academy from '../components/dashboard/Academy';
import Portfolio from '../components/dashboard/Portfolio';
import ProfileCard from '../components/dashboard/ProfileCard';
const Applications = React.lazy(() => import('../components/dashboard/Applications'));
const ResumeBuilder = React.lazy(() => import('../components/dashboard/ResumeBuilder'));
const Records = React.lazy(() => import('../components/dashboard/Records'));
const SettingsComp = React.lazy(() => import('../components/dashboard/SettingsComp'));
const UserProfile = React.lazy(() => import('../components/dashboard/UserProfile'));
const Store = React.lazy(() => import('../components/dashboard/Store'));

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -12, scale: 0.99 }
};
const pageTransition = { type: "tween", ease: "easeInOut", duration: 0.35 };

const TabLoadingFallback = ({ label = 'Loading workspace…' }) => (
  <div className="flex min-h-[45vh] items-center justify-center px-4">
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
      {label}
    </div>
  </div>
);

const Dashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme, onSwitchDashboardRole, roleSwitching, onDashboardReady }) => {
  const logic = useDashboardLogic(user, setUser, showToast);
  const { state, setters, actions } = logic;
  const { setActiveChat, setTab } = setters;
  
  const { 
      tab, menuOpen, isLoading, isClient, energy, notifications, showNotifications,
      jobs, services, filteredJobs, searchTerm, applications, referralStats, totalEarnings,
      badges, unlockedSkills, userLevel, progressPercent, zenMode, parentMode, profileForm,
      SAFE_QUIZZES, profileCardRef, isQuizLoading,
      reportModal, notificationPermission
  } = state;

  React.useEffect(() => {
    if (!isLoading) onDashboardReady?.();
  }, [isLoading, onDashboardReady]);

  const getTabIcon = () => {
    const icons = {
      'overview': <LayoutDashboard size={18} strokeWidth={2.5} className="text-indigo-600 dark:text-indigo-400"/>,
      'jobs': <Briefcase size={18} strokeWidth={2.5} className="text-blue-500 dark:text-blue-400"/>,
      'posted-jobs': <ListChecks size={18} strokeWidth={2.5} className="text-indigo-500 dark:text-indigo-400"/>,
      'academy': <BookOpen size={18} strokeWidth={2.5} className="text-emerald-500 dark:text-emerald-400"/>,
      'battles': <Swords size={18} strokeWidth={2.5} className="text-rose-500 dark:text-rose-400"/>,
      'settings': <Settings size={18} strokeWidth={2.5} className="text-neutral-500 dark:text-neutral-400"/>,
      'profile-card': <User size={18} strokeWidth={2.5} className="text-purple-500 dark:text-purple-400"/>,
      'portfolio': <Briefcase size={18} strokeWidth={2.5} className="text-cyan-500 dark:text-cyan-400"/>,
      'pricing': <Crown size={18} strokeWidth={2.5} className="text-yellow-500 dark:text-yellow-400"/>,
      'records': <ShieldCheck size={18} strokeWidth={2.5} className="text-blue-500 dark:text-blue-400"/>,
      'store': <ShoppingBag size={18} strokeWidth={2.5} className="text-teal-500 dark:text-teal-400"/>
    };
    return icons[tab] || <LayoutDashboard size={18} strokeWidth={2.5} className="text-indigo-500"/>;
  };

  // --- EDITORIAL CLAY-GLASS LOADING SCREEN ---
  if (isLoading) {
    if (roleSwitching) {
      return (
        <div className="h-screen bg-[#F4F6FA] dark:bg-[#070A14]" aria-hidden="true" />
      );
    }

    return (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#070A14]">
          <div className="flex flex-col items-center gap-6 relative px-4 text-center">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] w-72 h-72 rounded-full -z-10 animate-pulse mx-auto"></div>
              
              {/* Claymorphic Loader Card */}
              <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-white/40 dark:border-white/[0.04] rounded-[28px] flex items-center justify-center shadow-[inset_0_3px_6px_rgba(255,255,255,0.9),_0_20px_40px_rgba(99,102,241,0.1)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.08),_0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-pink-500/10 animate-[spin_4s_linear_infinite]" />
                  <Fingerprint size={42} className="text-indigo-600 dark:text-indigo-400 relative z-10 animate-pulse" strokeWidth={1.5} />
              </div>
              
              <div className="space-y-1.5">
                  <h3 className="font-black text-lg tracking-widest uppercase text-slate-900 dark:text-white">Authenticating</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">Initializing Workspace...</p>
              </div>
          </div>
        </motion.div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-900 dark:bg-[#070A14] dark:text-slate-100 transition-colors duration-300 font-sans overflow-hidden">
      
      {/* GLOWING BACKGROUND MESH */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 dark:opacity-40" aria-hidden="true">
         <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-300/40 via-transparent to-transparent dark:from-indigo-900/30 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-300/30 via-transparent to-transparent dark:from-purple-900/20 blur-3xl"></div>
      </div>

      <DashboardSidebar 
        user={user} isClient={isClient} badges={badges} userLevel={userLevel} progressPercent={progressPercent}
        menuOpen={menuOpen} setMenuOpen={setters.setMenuOpen} zenMode={zenMode} setZenMode={setters.setZenMode}
        tab={tab} setTab={setters.setTab} onLogout={onLogout} energy={energy}
        jobsCount={jobs.length} applicationsCount={applications.length}
        onSwitchDashboardRole={onSwitchDashboardRole}
        roleSwitching={roleSwitching}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
         
         {/* --- PREMIUM GLASS NAVIGATION HEADER --- */}
         <header className="sticky top-0 z-30 px-4 md:px-8 pt-4 md:pt-6 pb-2">
             <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-white/[0.04] rounded-[24px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),_0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),_0_12px_36px_rgba(0,0,0,0.2)] px-5 py-3.5 flex justify-between items-center">
               
               <div className="flex items-center gap-4">
                  <button onClick={() => setters.setMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"><Menu size={20}/></button>
                   <div className="flex items-center gap-3">
                      {/* Icon wrapper */}
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 items-center justify-center border border-slate-200/40 dark:border-white/[0.04] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-none">
                        {getTabIcon()}
                      </div>
                      <div>
                          <h2 className="text-base font-black text-slate-900 dark:text-white capitalize tracking-tight leading-none">{tab.replace('-', ' ')}</h2>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 hidden sm:block">Welcome back, {user.name?.split(' ')[0]}</p>
                      </div>
                   </div>
               </div>

               {/* Energy Capsule (Claymorphic accent) */}
               {!isClient && (
                  <div className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100/70 dark:bg-indigo-950/40 dark:border-indigo-500/20 px-3.5 py-2 rounded-full shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.6)] dark:shadow-none mr-2 select-none">
                    <div className="p-1 bg-indigo-600 dark:bg-indigo-500 rounded-full text-white shadow-sm"><Zap size={11} fill="currentColor"/></div>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 tracking-tight">{energy} Energy</span>
                  </div>
               )}

               <div className="flex items-center gap-3">
                 
                 {/* Theme Pill Slider */}
                 <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-950/60 p-1 border border-slate-200/50 dark:border-white/[0.03] rounded-full shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]">
                      <button onClick={() => !darkMode && toggleTheme()} className={`p-2 rounded-full transition-all duration-200 ${!darkMode ? 'bg-white text-amber-500 shadow-[0_3px_8px_rgba(0,0,0,0.06),_inset_0_1px_1px_rgba(255,255,255,0.9)]' : 'text-slate-400 hover:text-slate-200'}`}><Sun size={15} strokeWidth={2.5}/></button>
                      <button onClick={() => darkMode && toggleTheme()} className={`p-2 rounded-full transition-all duration-200 ${darkMode ? 'bg-slate-800 text-indigo-400 shadow-[0_3px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.08)]' : 'text-slate-500 hover:text-slate-800'}`}><Moon size={15} strokeWidth={2.5}/></button>
                  </div>

                  {/* Notification Bell */}
                  <div className="relative">
                    <button onClick={() => setters.setShowNotifications(!showNotifications)} className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all shadow-sm">
                      <Bell size={18}/>
                      {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden animate-fade-in z-50">
                          <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                             <span className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-white">Notifications</span>
                             <button onClick={actions.handleClearNotifications} className="text-xs font-black text-indigo-500 hover:text-indigo-600">Clear All</button>
                          </div>
                          
                          <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                            {notificationPermission === 'granted' ? (
                              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <ShieldCheck size={14}/> Push alerts enabled on this device.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={actions.handleEnablePushNotifications}
                                  className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-indigo-700 shadow-md shadow-indigo-500/10"
                                >
                                  Enable Push Alerts
                                </button>
                                {notificationPermission === 'denied' && (
                                  <p className="text-[10px] leading-relaxed font-medium text-amber-600 dark:text-amber-400">
                                    Notifications blocked. Allow permissions from your browser settings tab.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <div className="p-8 text-center text-slate-400 text-xs font-medium">No new alerts found</div> : notifications.map(n => (
                               <div key={n.id} className="p-3 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-medium text-slate-600 dark:text-slate-300 flex gap-2">
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

         {/* MAIN VIEWPORT PORT */}
         <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="max-w-7xl mx-auto pt-4">
               <AnimatePresence mode='wait'>
                 <motion.div key={tab} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    
                    {tab === 'overview' && (
                      <Overview 
                        user={user} isClient={isClient} totalEarnings={totalEarnings} 
                        jobsCount={isClient ? jobs.length : applications.length} 
                        badgesCount={badges.length} setTab={setTab} 
                        referralCount={referralStats.count} referralEarnings={referralStats.earnings} 
                        energy={energy}
                        setModal={setters.setModal}
                      />
                    )}

                    {tab === 'jobs' && (
                      <Jobs 
                          user={user}
                          isClient={isClient} 
                          services={services} 
                          filteredJobs={filteredJobs} 
                          searchTerm={searchTerm} 
                          setSearchTerm={setters.setSearchTerm} 
                          setModal={setters.setModal} 
                          setTab={setTab} 
                          setSelectedJob={setters.setSelectedJob} 
                          parentMode={parentMode} 
                          onAction={actions.handleAppAction} 
                          setActiveChat={setActiveChat}
                      />
                    )}

                    {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setters.setModal} handleDeleteJob={actions.handleDeleteJob} />}
                    
                    {tab === 'my-services' && !isClient && (
                       <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 opacity-80">
                         <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/60 rounded-full flex items-center justify-center mb-4 border border-slate-200/50 dark:border-white/[0.03] shadow-sm"><Briefcase size={32} className="text-slate-400" /></div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Gigs Temporarily Unavailable</h3>
                         <p className="text-xs font-medium text-slate-500 max-w-sm mt-1.5">We are currently upgrading the Gigs system architecture. Check back shortly!</p>
                       </div>
                    )}

                    {tab === 'resume' && !isClient && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading resume builder…" />}>
                        <ResumeBuilder user={user} showToast={showToast} />
                      </React.Suspense>
                    )}
                    
                    {tab === 'applications' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading applications…" />}>
                        <Applications 
                          applications={applications} isClient={isClient} parentMode={parentMode}
                          onAction={actions.handleAppAction} onViewTimeline={(app) => setters.setTimelineApp(app)}
                          showToast={showToast}
                        />
                      </React.Suspense>
                    )}

                    {tab === 'messages' && (
                       <ChatSystem 
                          user={user} 
                          activeChat={state.activeChat} 
                          setActiveChat={setters.setActiveChat}
                          onAction={actions.handleAppAction}
                          showToast={showToast}
                       />
                    )}

                    {tab === 'store' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading store…" />}>
                        <Store user={user} setUser={setUser} />
                      </React.Suspense>
                    )}

                    {tab === 'support' && (
                        <SupportHub 
                            user={user} 
                            showToast={showToast} 
                            setModal={setters.setModal}
                            isClient={isClient}
                        />
                    )}
                  
                    {tab === 'academy' && !isClient && (
                      <Academy 
                        unlockedSkills={unlockedSkills} 
                        setModal={setters.setModal} 
                        quizzes={SAFE_QUIZZES}
                        startAiQuiz={actions.startAiQuiz} 
                        isQuizLoading={isQuizLoading}     
                      />
                    )}

                    {tab === 'portfolio' && (
                      <Portfolio isClient={isClient} applications={applications} jobs={jobs} services={services} />
                    )}
                    
                    {tab === 'profile-card' && !isClient && (
                      <ProfileCard 
                        ref={profileCardRef} user={user} unlockedSkills={unlockedSkills} badges={badges} 
                        userLevel={userLevel} applications={applications} handleDownloadCard={actions.handleDownloadCard} 
                        services={services} handleShareToInstagram={actions.handleShareToInstagram} showToast={showToast} 
                      />
                    )}

                    {tab === 'profile' && !isClient && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading profile…" />}>
                        <UserProfile 
                          user={user} badges={badges} userLevel={userLevel} unlockedSkills={unlockedSkills} 
                          isClient={isClient} onEditProfile={() => setters.setEditProfileModal(true)} 
                          applications={applications} jobs={jobs} services={services}
                        />
                      </React.Suspense>
                    )}

                    {tab === 'records' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading records…" />}>
                        <Records applications={applications} onDownloadInvoice={actions.handleInvoiceDownload} />
                      </React.Suspense>
                    )}

                    {tab === 'pricing' && <Pricing isClient={state.isClient} user={user} onSubscribe={actions.handleSubscribe} />}
                    
                    {tab === 'settings' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading settings…" />}>
                        <SettingsComp 
                          profileForm={profileForm} setProfileForm={setters.setProfileForm} isClient={isClient} 
                          handleUpdateProfile={actions.handleUpdateProfile} parentMode={parentMode} 
                          setParentMode={actions.handleParentModeChange}
                          onOpenKyc={() => setters.setModal('kyc_verification')} 
                        />
                      </React.Suspense>
                    )}

                    {/* Editorial Platform Footer */}
                    <footer className="text-center py-8 text-[10px] text-slate-400 dark:text-slate-600 space-y-1.5 mt-12 border-t border-slate-200/40 dark:border-white/[0.03]">
                      <p>TeenVerseHub acts as an <strong>intermediary platform</strong> under the IT Act, 2000. Disputes are moderated via platform mediation protocol structures.</p>
                      <p>Funds remain secured inside separate neutral escrow modules and are never forfeited, exclusively released upon approval or fully returned.</p>
                    </footer>
                 </motion.div>
               </AnimatePresence>
            </div>
         </div>
      </main>

      {/* GLOBAL BACKGROUND MODALS HANDLER MODULE */}
      <DashboardModals user={user} logic={logic} showToast={showToast} />

      {/* --- CLAYMORPHIC CREATOR REGISTRATION PROFILE MODAL --- */}
      {state.modal === 'complete_profile' && (
          <Modal title="Complete Your Creator Profile 🚀" onClose={() => setters.setModal(null)}>
              <form onSubmit={actions.handleCompleteProfileSubmit} className="space-y-5">
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6)] dark:shadow-none">
                      Tell clients what you're good at so they can find you. <span className="text-indigo-600 dark:text-indigo-300 font-black">Earn +10 Energy for finishing this! ⚡</span>
                  </div>

                  <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Main Title / Specialty <span className="text-red-500">*</span></label>
                      <input 
                          name="specialty" 
                          required 
                          placeholder="e.g. Video Editor, Python Dev, Web Designer" 
                          className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]"
                      />
                  </div>

                  <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Qualification / Skills <span className="text-red-500">*</span></label>
                      <input 
                          name="qualification" 
                          required 
                          placeholder="e.g. Self-taught, B.Tech, 2 years experience" 
                          className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]"
                      />
                  </div>

                  {/* INTERACTIVE COMPACT HOURLY SLIDER WITH CLAYMORPHIC CUSHION */}
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl dark:bg-slate-950 dark:border-white/[0.04] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.01)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.3)]">
                      <label className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                          <span>Your Hourly Rate <span className="text-red-500">*</span></span>
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-white border border-indigo-100 px-3 py-1 rounded-xl shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.8),_0_4px_10px_rgba(99,102,241,0.05)] dark:bg-slate-900 dark:border-white/[0.05] dark:shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.05)]">
                              ₹{state.hourlyRate}/hr
                          </span>
                      </label>
                      <input 
                          name="hourly_rate"
                          type="range" 
                          min="50" 
                          max="4000" 
                          step="50"
                          value={state.hourlyRate}
                          onChange={(e) => setters.setHourlyRate(e.target.value)}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-2.5">
                          <span>₹50</span>
                          <span>₹4,000+</span>
                      </div>
                  </div>

                  <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top Project Link (Optional)</label>
                      <input 
                          name="project_url"
                          type="url" 
                          placeholder="https://your-best-project.com, GitHub, Behance..." 
                          className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]"
                      />
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">Clients love seeing past work! Paste a secure portfolio link here.</p>
                  </div>

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-3.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_10px_24px_rgba(79,70,229,0.25)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),_0_10px_24px_rgba(99,102,241,0.25)] rounded-xl">
                      Save Profile & Claim Energy
                  </Button>
              </form>
          </Modal>
      )}

      {/* --- SAFE REPORT MODAL --- */}
      {reportModal && (
        <Modal title="Submit a Report" onClose={() => setters.setReportModal(null)}>
          <form onSubmit={actions.handleReportSubmit} className="space-y-4">
            <div className="bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 p-4 rounded-2xl flex gap-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6)] dark:shadow-none">
              <div className="bg-red-500 text-white p-2 rounded-xl h-fit shadow-sm">
                 <Flag size={16} strokeWidth={2.5} />
              </div>
              <div>
                 <h4 className="font-black text-red-900 dark:text-red-300 text-xs uppercase tracking-wider">Trust & Safety Validation</h4>
                 <p className="text-xs font-medium text-red-700 dark:text-red-400/80 mt-1">
                   All logged system flags are carefully validated manually. Intentional false indexing can result in strict temporary ecosystem boundaries.
                 </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reason</label>
              <select name="reason" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/[0.05] dark:bg-slate-950 font-bold text-sm outline-none focus:ring-2 focus:ring-red-500 shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.02)]">
                <option value="">Select a reason...</option>
                <option value="Scam/Fraud">Scam or Fraudulent Activity</option>
                <option value="Harassment">Harassment or Abusive Behavior</option>
                <option value="Non-Payment">Payment Issue / Non-Payment</option>
                <option value="Inappropriate">Inappropriate Content</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Details</label>
              <textarea 
                name="description" 
                required 
                placeholder="Please describe the context comprehensively here..." 
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[110px] text-sm font-bold bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-white/[0.05] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] resize-none"
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2">
               <Button variant="ghost" type="button" className="font-bold text-xs uppercase tracking-wider rounded-xl" onClick={() => setters.setReportModal(null)}>Cancel</Button>
               <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(220,38,38,0.2)]">Submit Report</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default Dashboard;
