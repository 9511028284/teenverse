import React from 'react';
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
import Pricing from '../components/dashboard/Pricing';
import MarketingCampaign from '../components/dashboard/MarketingCampaign';

const Applications = React.lazy(() => import('../components/dashboard/Applications'));
const ResumeBuilder = React.lazy(() => import('../components/dashboard/ResumeBuilder'));
const Records = React.lazy(() => import('../components/dashboard/Records'));
const SettingsComp = React.lazy(() => import('../components/dashboard/SettingsComp'));
const UserProfile = React.lazy(() => import('../components/dashboard/UserProfile'));
const Store = React.lazy(() => import('../components/dashboard/Store'));
const TrustCenter = React.lazy(() => import('../components/dashboard/TrustCenter'));

// Snappy, modern spring transitions perfect for Gen Z interfaces
const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -10, scale: 0.98 }
};

const pageTransition = { 
  type: "spring", 
  stiffness: 260, 
  damping: 20 
};

const TabLoadingFallback = ({ label = 'Spinning up your workspace…' }) => (
  <div className="flex min-h-[50vh] items-center justify-center px-4">
    <div className="rounded-2xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 text-sm font-bold text-slate-600 shadow-xl dark:border-white/10 dark:text-slate-300 flex items-center gap-3 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
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
      'overview': <LayoutDashboard size={18} className="text-indigo-500 dark:text-indigo-400" />,
      'jobs': <Briefcase size={18} className="text-sky-500 dark:text-sky-400" />,
      'posted-jobs': <ListChecks size={18} className="text-violet-500 dark:text-violet-400" />,
      'academy': <BookOpen size={18} className="text-emerald-500 dark:text-emerald-400" />,
      'battles': <Swords size={18} className="text-rose-500 dark:text-rose-400" />,
      'settings': <Settings size={18} className="text-slate-500 dark:text-slate-400" />,
      'profile-card': <User size={18} className="text-fuchsia-500 dark:text-fuchsia-400" />,
      'portfolio': <Briefcase size={18} className="text-cyan-500 dark:text-cyan-400" />,
      'pricing': <Crown size={18} className="text-amber-500 dark:text-amber-400" />,
      'records': <ShieldCheck size={18} className="text-blue-500 dark:text-blue-400" />,
      'trust': <ShieldCheck size={18} className="text-emerald-500 dark:text-emerald-400" />,
      'store': <ShoppingBag size={18} className="text-teal-500 dark:text-teal-400" />
    };
    return icons[tab] || <LayoutDashboard size={18} className="text-indigo-500"/>;
  };

  if (isLoading) {
    if (roleSwitching) return <div className="h-screen bg-[#F8FAFC] dark:bg-[#090D1A]" aria-hidden="true" />;

    return (
      <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#090D1A]">
        <div className="flex flex-col items-center gap-6 relative px-4 text-center">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[140px] w-80 h-80 rounded-full -z-10 animate-pulse mx-auto"></div>
            
            {/* Smooth Glassmorphic Loader */}
            <div className="w-24 h-24 bg-white/70 dark:bg-slate-900/70 border border-white dark:border-white/[0.05] backdrop-blur-xl rounded-[32px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 animate-[spin_3s_linear_infinite]" />
                <Fingerprint size={40} className="text-indigo-500 dark:text-indigo-400 relative z-10" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-1">
                <h3 className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">Setting up your universe</h3>
                <p className="text-indigo-500 dark:text-indigo-400 text-xs font-semibold tracking-wide">Syncing workspaces...</p>
            </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#090D1A] dark:text-slate-100 transition-colors duration-300 font-sans overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* GLOWING DYNAMIC BACKGROUND MESH */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-60 mix-blend-screen dark:mix-blend-normal" aria-hidden="true">
         <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/30 to-purple-500/0 dark:from-indigo-950/40 dark:to-transparent rounded-full blur-[160px]"></div>
         <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-fuchsia-400/20 to-blue-500/0 dark:from-purple-950/30 dark:to-transparent rounded-full blur-[160px]"></div>
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
         
         {/* --- NEOMORPHIC/GLASS FLOATING HEADER --- */}
         <header className="sticky top-0 z-30 px-4 md:px-6 pt-4 pb-2">
             <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/[0.05] rounded-[24px] shadow-sm px-6 py-4 flex justify-between items-center transition-all">
               
               <div className="flex items-center gap-4">
                  <button onClick={() => setters.setMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"><Menu size={20}/></button>
                   <div className="flex items-center gap-3">
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200/40 dark:border-white/[0.05] shadow-inner">
                        {getTabIcon()}
                      </div>
                      <div>
                          <h2 className="text-base font-extrabold text-slate-900 dark:text-white capitalize tracking-tight leading-tight">{tab.replace('-', ' ')}</h2>
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:block">Hey {user.name?.split(' ')[0]}, let's get things moving.</p>
                      </div>
                   </div>
               </div>

               <div className="flex items-center gap-4">
                 {/* Interactive Energy Tracker */}
                 {!isClient && (
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="hidden md:flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100/80 dark:border-indigo-500/20 px-4 py-2 rounded-full cursor-pointer select-none"
                    >
                      <Zap size={14} className="text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400 animate-bounce" />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 tracking-tight">{energy} Energy</span>
                    </motion.div>
                 )}
                 
                 {/* Theme Toggle Pill */}
                 <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-white/[0.04] rounded-full">
                      <button onClick={() => !darkMode && toggleTheme()} className={`p-1.5 rounded-full transition-all duration-300 ${!darkMode ? 'bg-white text-amber-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-200'}`}><Sun size={15} strokeWidth={2.5}/></button>
                      <button onClick={() => darkMode && toggleTheme()} className={`p-1.5 rounded-full transition-all duration-300 ${darkMode ? 'bg-slate-800 text-indigo-400 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}><Moon size={15} strokeWidth={2.5}/></button>
                  </div>

                  {/* Notification Portal */}
                  <div className="relative">
                    <button onClick={() => setters.setShowNotifications(!showNotifications)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm relative">
                      <Bell size={18} className="text-slate-600 dark:text-slate-300"/>
                      {notifications.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-13 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden z-50 mt-2"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                               <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Alerts Portal</span>
                               <button onClick={actions.handleClearNotifications} className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Clear All</button>
                            </div>
                            
                            <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                              {notificationPermission === 'granted' ? (
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <ShieldCheck size={14}/> Push alerts enabled on this device.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={actions.handleEnablePushNotifications}
                                    className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-700 shadow-md shadow-indigo-500/10"
                                  >
                                    Enable Push Alerts
                                  </button>
                                  {notificationPermission === 'denied' && (
                                    <p className="text-[10px] leading-relaxed font-medium text-amber-500 dark:text-amber-400">
                                      Notifications blocked. Allow permissions from your browser settings tab.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5">
                              {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs font-medium">All caught up! ✨</div>
                              ) : notifications.map(n => (
                                 <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-medium text-slate-600 dark:text-slate-300 flex gap-2.5 items-start transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                                    <p className="leading-normal">{n.message}</p>
                                 </div>
                              ))}
                            </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
               </div>
             </div>
         </header>

         {/* --- MAIN TAB STAGE --- */}
         <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="max-w-7xl mx-auto pt-2">
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
                          user={user} isClient={isClient} services={services} filteredJobs={filteredJobs} 
                          searchTerm={searchTerm} setSearchTerm={setters.setSearchTerm} setModal={setters.setModal} 
                          setTab={setTab} setSelectedJob={setters.setSelectedJob} parentMode={parentMode} 
                          onAction={actions.handleAppAction} setActiveChat={setActiveChat}
                      />
                    )}

                    {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setters.setModal} handleDeleteJob={actions.handleDeleteJob} />}
                    
                    {tab === 'my-services' && !isClient && (
                       <div className="flex flex-col items-center justify-center h-[45vh] text-center p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/[0.04] rounded-3xl shadow-sm">
                         <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center mb-4 border border-slate-200/40 dark:border-white/[0.03] shadow-inner">
                           <Briefcase size={26} className="text-slate-400" />
                         </div>
                         <h3 className="text-base font-bold text-slate-950 dark:text-white tracking-tight">Gigs Architecture Upgrading</h3>
                         <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">We are updating modules for optimization. Check back soon!</p>
                       </div>
                    )}

                    {tab === 'resume' && !isClient && (
                      <React.Suspense fallback={<TabLoadingFallback label="Booting resume builder blueprint…" />}>
                        <ResumeBuilder user={user} showToast={showToast} />
                      </React.Suspense>
                    )}
                    
                    {tab === 'applications' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Assembling application states…" />}>
                        <Applications 
                          user={user} applications={applications} isClient={isClient} parentMode={parentMode}
                          onAction={actions.handleAppAction} onViewTimeline={(app) => setters.setTimelineApp(app)}
                          showToast={showToast}
                        />
                      </React.Suspense>
                    )}

                    {tab === 'messages' && (
                       <ChatSystem 
                          user={user} activeChat={state.activeChat} setActiveChat={setters.setActiveChat}
                          onAction={actions.handleAppAction} showToast={showToast}
                       />
                    )}

                    {tab === 'store' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading cosmetic engine store…" />}>
                        <Store user={user} setUser={setUser} />
                      </React.Suspense>
                    )}

                    {tab === 'support' && (
                        <SupportHub user={user} showToast={showToast} setModal={setters.setModal} isClient={isClient} />
                    )}
                  
                    {tab === 'academy' && !isClient && (
                      <Academy 
                        unlockedSkills={unlockedSkills} setModal={setters.setModal} quizzes={SAFE_QUIZZES}
                        startAiQuiz={actions.startAiQuiz} isQuizLoading={isQuizLoading}     
                      />
                    )}

                    {tab === 'portfolio' && (
                      <Portfolio isClient={isClient} applications={applications} jobs={jobs} services={services} />
                    )}

                    {tab === 'trust' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading trust intelligence…" />}>
                        <TrustCenter
                          user={user}
                          setUser={setUser}
                          jobs={jobs}
                          applications={applications}
                          showToast={showToast}
                        />
                      </React.Suspense>
                    )}
                    
                    {tab === 'profile-card' && !isClient && (
                      <ProfileCard 
                        ref={profileCardRef} user={user} unlockedSkills={unlockedSkills} badges={badges} 
                        userLevel={userLevel} applications={applications} handleDownloadCard={actions.handleDownloadCard} 
                        services={services} handleShareToInstagram={actions.handleShareToInstagram} showToast={showToast} 
                      />
                    )}

                    {tab === 'profile' && !isClient && (
                      <React.Suspense fallback={<TabLoadingFallback label="Assembling matrix profiles…" />}>
                        <UserProfile 
                          user={user} badges={badges} userLevel={userLevel} unlockedSkills={unlockedSkills} 
                          isClient={isClient} onEditProfile={() => setters.setEditProfileModal(true)} 
                          applications={applications} jobs={jobs} services={services}
                        />
                      </React.Suspense>
                    )}

                    {tab === 'records' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Gathering transaction indices…" />}>
                        <Records applications={applications} onDownloadInvoice={actions.handleInvoiceDownload} />
                      </React.Suspense>
                    )}

                    {tab === 'pricing' && <Pricing isClient={state.isClient} user={user} onSubscribe={actions.handleSubscribe} />}
                    
                    {tab === 'settings' && (
                      <React.Suspense fallback={<TabLoadingFallback label="Loading environmental parameters…" />}>
                        <SettingsComp 
                          profileForm={profileForm} setProfileForm={setters.setProfileForm} isClient={isClient} 
                          handleUpdateProfile={actions.handleUpdateProfile} parentMode={parentMode} 
                          setParentMode={actions.handleParentModeChange} onOpenKyc={() => setters.setModal('kyc_verification')} 
                        />
                      </React.Suspense>
                    )}

                    {/* Clean Minimalist Platform Footer */}
                    <footer className="text-center py-8 text-[11px] text-slate-400 dark:text-slate-600 space-y-1 mt-12 border-t border-slate-200/50 dark:border-white/[0.04]">
                      <p>TeenVerseHub acts as an <strong>intermediary platform</strong> under the IT Act, 2000. Verification loops protect structural ecosystem bounds.</p>
                      <p>Ecosystem balances are secured safely within independent multi-party escrow configurations, released strictly on confirmation parameters.</p>
                    </footer>
                 </motion.div>
               </AnimatePresence>
            </div>
         </div>
      </main>

      <DashboardModals user={user} logic={logic} showToast={showToast} />

      {/* --- CREATOR REGISTRATION PROFILE MODAL --- */}
      <AnimatePresence>
        {state.modal === 'complete_profile' && (
            <Modal title="Complete Your Creator Profile 🚀" onClose={() => setters.setModal(null)}>
                <form onSubmit={actions.handleCompleteProfileSubmit} className="space-y-5 pt-2">
                    <div className="bg-indigo-50/70 border border-indigo-100 text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-500/20 p-4 rounded-2xl text-xs font-semibold leading-relaxed">
                        Let clients know what you specialize in. <span className="text-indigo-600 dark:text-indigo-300 font-extrabold">Earn +10 Energy for finishing this! ⚡</span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Main Specialty <span className="text-rose-500">*</span></label>
                        <input 
                            name="specialty" required placeholder="e.g. Video Editor, Python Dev, Web Designer" 
                            className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-950 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Skills & Qualifications <span className="text-rose-500">*</span></label>
                        <input 
                            name="qualification" required placeholder="e.g. Self-taught designer, 2 years experience" 
                            className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-950 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold transition-all"
                        />
                    </div>

                    {/* Interactive Rate Component Slider */}
                    <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl dark:bg-slate-950 dark:border-white/[0.04]">
                        <label className="flex justify-between items-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                            <span>Hourly Rate <span className="text-rose-500">*</span></span>
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/[0.05] px-3 py-1 rounded-xl shadow-sm">
                                ₹{state.hourlyRate}/hr
                            </span>
                        </label>
                        <input 
                            name="hourly_rate" type="range" min="50" max="4000" step="50" value={state.hourlyRate}
                            onChange={(e) => setters.setHourlyRate(e.target.value)}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-2">
                            <span>₹50</span>
                            <span>₹4,000+</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Top Project Link (Optional)</label>
                        <input 
                            name="project_url" type="url" placeholder="https://your-portfolio.com or GitHub, Behance..." 
                            className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-950 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold transition-all"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all">
                        Save Profile & Claim Energy
                    </Button>
                </form>
            </Modal>
        )}
      </AnimatePresence>

      {/* --- TRUST & SAFETY COMPLIANT REPORT MODAL --- */}
      <AnimatePresence>
        {reportModal && (
          <Modal title="Submit Ecosystem Flag Notice" onClose={() => setters.setReportModal(null)}>
            <form onSubmit={actions.handleReportSubmit} className="space-y-4 pt-2">
              <div className="bg-rose-50/70 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 p-4 rounded-2xl flex gap-3">
                <div className="bg-rose-500 text-white p-2 rounded-xl h-fit shadow-sm">
                   <Flag size={16} strokeWidth={2.5} />
                </div>
                <div>
                   <h4 className="font-bold text-rose-900 dark:text-rose-300 text-xs uppercase tracking-wider">Safety & Trust Protocol</h4>
                   <p className="text-xs font-medium text-rose-700 dark:text-rose-400/80 mt-0.5">
                     Submissions enter structural evaluation moderation queues. Malicious profiling behaviors will negatively affect profile health boundaries.
                   </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Category Context</label>
                <select name="reason" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 dark:border-white/[0.05] dark:bg-slate-950 font-semibold text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all">
                  <option value="">Select contextual profile reason...</option>
                  <option value="Scam/Fraud">Suspected Compromised Framework / Fraud</option>
                  <option value="Harassment">Ecosystem Boundary Violation / Harassment</option>
                  <option value="Non-Payment">Escrow Discrepancy / Incomplete Transaction</option>
                  <option value="Inappropriate">Inappropriate Visual Asset / Content</option>
                  <option value="Other">Uncategorized Disruption</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Comprehensive Summary Description</label>
                <textarea 
                  name="description" required placeholder="Please provide specific situational records clearly..." 
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none min-h-[110px] text-sm font-semibold bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-white/[0.05] transition-all resize-none"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                 <Button variant="ghost" type="button" className="font-bold text-xs uppercase tracking-wider rounded-xl" onClick={() => setters.setReportModal(null)}>Cancel</Button>
                 <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all">Submit Flag Notice</Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <MarketingCampaign />
    </div>
  );
};

export default Dashboard;
