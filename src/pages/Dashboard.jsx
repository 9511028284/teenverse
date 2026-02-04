import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, LayoutDashboard, Briefcase, BookOpen, Settings, 
  Sun, Moon, Bell, User, Swords, ShieldCheck, Zap, ListChecks, Crown 
} from 'lucide-react';
import { useDashboardLogic } from '../hooks/useDashboardLogic';

// Components
import DashboardSidebar from '../components/dashboard/DashboardSidebar'; 
import DashboardModals from '../components/dashboard/DashboardModals';
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
import ResumeBuilder from '../components/dashboard/ResumeBuilder';
import UserProfile from '../components/dashboard/UserProfile';

const pageVariants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -10, scale: 0.98 }
};
const pageTransition = { type: "tween", ease: "anticipate", duration: 0.4 };

const Dashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme }) => {
  const logic = useDashboardLogic(user, setUser, showToast);
  const { state, setters, actions } = logic;
  const { 
      tab, menuOpen, isLoading, isClient, energy, notifications, showNotifications,
      jobs, services, filteredJobs, searchTerm, applications, referralStats, totalEarnings,
      badges, unlockedSkills, userLevel, progressPercent, zenMode, parentMode, profileForm,
      portfolioItems, rawPortfolioText, isAiLoading, SAFE_QUIZZES, profileCardRef
  } = state;

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
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
          <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500 text-sm animate-pulse">Loading TeenVerseHub.</p>
          </div>
        </motion.div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-500 font-sans overflow-hidden">
      
      {/* BACKGROUND MESH */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent dark:from-indigo-900"></div>
         <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-200 via-transparent to-transparent dark:from-purple-900"></div>
      </div>

      <DashboardSidebar 
        user={user} isClient={isClient} badges={badges} userLevel={userLevel} progressPercent={progressPercent}
        menuOpen={menuOpen} setMenuOpen={setters.setMenuOpen} zenMode={zenMode} setZenMode={setters.setZenMode}
        tab={tab} setTab={setters.setTab} onLogout={onLogout} energy={energy}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
         <header className="sticky top-0 z-30 px-6 py-4">
             <div className="bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
               
               <div className="flex items-center gap-4">
                  <button onClick={() => setters.setMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"><Menu/></button>
                   <div className="flex items-center gap-3">
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 items-center justify-center border border-gray-100 dark:border-white/5">{getTabIcon()}</div>
                      <div>
                          <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize leading-none">{tab.replace('-', ' ')}</h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">Welcome back, {user.name?.split(' ')[0]}</p>
                      </div>
                   </div>
               </div>

               {!isClient && (
                  <div className="hidden md:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/30 mr-2">
                    <div className="p-1 bg-indigo-500 rounded-full text-white"><Zap size={12} fill="currentColor"/></div>
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{energy} Energy</span>
                  </div>
               )}

               <div className="flex items-center gap-3">
                 <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-black/30 p-1 rounded-full">
                      <button onClick={() => !darkMode && toggleTheme()} className={`p-2 rounded-full transition-all ${!darkMode ? 'bg-white shadow-sm text-amber-500' : 'text-gray-400'}`}><Sun size={18}/></button>
                      <button onClick={() => darkMode && toggleTheme()} className={`p-2 rounded-full transition-all ${darkMode ? 'bg-gray-800 shadow-sm text-indigo-400' : 'text-gray-400'}`}><Moon size={18}/></button>
                  </div>
                  <div className="relative">
                    <button onClick={() => setters.setShowNotifications(!showNotifications)} className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 text-gray-500 dark:text-gray-400 transition-colors">
                      <Bell size={20}/>
                      {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0F172A]"></span>}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in z-50">
                          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                             <span className="font-bold text-sm dark:text-white">Notifications</span>
                             <button onClick={actions.handleClearNotifications} className="text-xs font-medium text-indigo-500 hover:text-indigo-600">Clear All</button>
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

         <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
               <AnimatePresence mode='wait'>
                 <motion.div key={tab} variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    {tab === 'overview' && (
                      <Overview 
                        user={user} isClient={isClient} totalEarnings={totalEarnings} 
                        jobsCount={isClient ? jobs.length : applications.length} 
                        badgesCount={badges.length} setTab={setters.setTab} 
                        referralCount={referralStats.count} referralEarnings={referralStats.earnings} 
                        energy={energy}
                      />
                    )}
                    {tab === 'jobs' && <Jobs isClient={isClient} services={services} filteredJobs={filteredJobs} searchTerm={searchTerm} setSearchTerm={setters.setSearchTerm} setModal={setters.setModal} setTab={setters.setTab} setSelectedJob={setters.setSelectedJob} parentMode={parentMode} />}
                    {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setters.setModal} handleDeleteJob={actions.handleDeleteJob} />}
                    
                    {tab === 'my-services' && !isClient && (
                       <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 opacity-70">
                         <div className="w-24 h-24 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4"><Briefcase size={40} className="text-gray-400" /></div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gigs Temporarily Unavailable</h3>
                         <p className="text-gray-500 max-w-md mt-2">We are currently upgrading the Gigs system. Please check back soon!</p>
                       </div>
                    )}

                    {tab === 'resume' && !isClient && <ResumeBuilder user={user} showToast={showToast} />}
                    
                    {tab === 'applications' && (
                      <Applications 
                        applications={applications} isClient={isClient} parentMode={parentMode}
                        onAction={actions.handleAppAction} onViewTimeline={(app) => setters.setTimelineApp(app)}
                        showToast={showToast}
                      />
                    )}
                  
                    {tab === 'academy' && !isClient && <Academy unlockedSkills={unlockedSkills} setModal={setters.setModal} quizzes={SAFE_QUIZZES} />}
                    {tab === 'portfolio' && !isClient && <Portfolio rawPortfolioText={rawPortfolioText} setRawPortfolioText={setters.setRawPortfolioText} handleAiGenerate={actions.handleAiGenerate} isAiLoading={isAiLoading} portfolioItems={portfolioItems} />}
                    
                    {tab === 'profile-card' && !isClient && (
                      <ProfileCard 
                       ref={profileCardRef} user={user} unlockedSkills={unlockedSkills} badges={badges} 
                       userLevel={userLevel} applications={applications} handleDownloadCard={actions.handleDownloadCard} 
                       handleShareToInstagram={actions.handleShareToInstagram} showToast={showToast} 
                      />
                    )}

                    {tab === 'profile' && !isClient && (
                     <UserProfile 
                       user={user} badges={badges} userLevel={userLevel} unlockedSkills={unlockedSkills} 
                       isClient={isClient} onEditProfile={() => setters.setEditProfileModal(true)} 
                     />
                    )}

                    {tab === 'records' && (
                      <Records applications={applications} onDownloadInvoice={actions.handleInvoiceDownload} />
                    )}
                    
                    {tab === 'settings' && (
                      <SettingsComp 
                       profileForm={profileForm} setProfileForm={setters.setProfileForm} isClient={isClient} 
                       handleUpdateProfile={actions.handleUpdateProfile} parentMode={parentMode} 
                       setParentMode={(val) => { setters.setParentMode(val); actions.logAction && actions.logAction('PARENT_MODE_TOGGLE', { enabled: val }); }}
                       onOpenKyc={() => setters.setModal('kyc_verification')} 
                     />
                    )}

                    <footer className="text-center py-6 text-[10px] text-gray-400 dark:text-gray-600 space-y-1 mt-auto">
                      <p>TeenVerseHub acts as an <strong>intermediary platform</strong> (IT Act, 2000). Disputes are resolved via administrative mediation.</p>
                      <p>Funds are held in neutral escrow and are never forfeited, only refunded or released.</p>
                    </footer>
                 </motion.div>
               </AnimatePresence>
            </div>
         </div>
      </main>

      {/* MODALS */}
      <DashboardModals user={user} logic={logic} showToast={showToast} />

    </div>
  );
};

export default Dashboard;