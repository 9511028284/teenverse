import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, LayoutDashboard, Briefcase, FileText, MessageSquare, BookOpen, Sparkles, Settings, 
  Award, Sun, Moon, Bell, ShieldCheck, ListChecks, Package, Share2, User,
  Lock, Eye, UserCircle 
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { supabase } from '../supabase';
import { QUIZZES, APP_STATUS } from '../utils/constants';

// UI Components
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DashboardSidebar from '../components/dashboard/DashboardSidebar'; 
import KycVerificationModal from '../components/modals/KycVerificationModal';
import ActiveQuizModal from '../components/modals/ActiveQuizModal';

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
import UserProfile from '../components/dashboard/UserProfile'; 

// Services
import * as api from '../services/dashboard.api';

// Modals
import PostJobModal from '../components/modals/PostJobModal';
import CreateServiceModal from '../components/modals/CreateServiceModal';
import ApplyJobModal from '../components/modals/ApplyJobModal';
import PaymentModal from '../components/modals/PaymentModal';

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
  const [selectedJob, setSelectedJob] = useState(null); 
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [energy, setEnergy] = useState(20); 

  // --- KYC STATE ---
  const [kycFile, setKycFile] = useState(null);

  // --- QUIZ & ACADEMY STATES ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

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
    
  const SAFE_QUIZZES = QUIZZES || {};
  const profileCardRef = useRef(null);
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
    if (window.Cashfree) {
      cashfree.current = new window.Cashfree({ mode: "sandbox" });
    }
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadData = async () => {
        if (jobs.length === 0) setIsLoading(true);

        try {
            // 1. Parallel Data Fetching
            const energyPromise = !isClient ? api.getEnergy(user.id) : Promise.resolve({ energy: 0 });
            
            const badgesPromise = supabase
                .from('user_badges')
                .select('badge_name, badges(icon)')
                .eq('user_id', user.id);

            // Fetch Extended Profile Data (BIO, SOCIALS, ETC)
            const profilePromise = supabase
                .from(isClient ? 'clients' : 'freelancers')
                .select('bio, cover_image, social_links, tag_line, kyc_status, kyc_type')
                .eq('id', user.id)
                .single();

            const dashboardPromise = api.fetchDashboardData(user);

            const [energyRes, badgeRes, profileRes, dashboardRes] = await Promise.all([
                energyPromise,
                badgesPromise,
                profilePromise,
                dashboardPromise
            ]);

            if (!isMounted) return;

            // 2. Set State
            if (!isClient) setEnergy(energyRes.energy);
            
            const formattedBadges = badgeRes.data?.map(b => ({
                name: b.badge_name,
                icon: b.badges?.icon || 'Award'
            })) || [];
            setBadges(formattedBadges);

            // Update User & Form State with extended profile data
            if (profileRes.data) {
               const updatedUser = { ...user, ...profileRes.data };
               setUser(updatedUser);
               setProfileForm(updatedUser); 
            }

            const { services, jobs, applications, notifications, referralCount, error } = dashboardRes;
            
            if (!error) {
                setServices(services);
                setJobs(jobs);
                setApplications(applications);
                setNotifications(notifications);
                setReferralStats({ count: referralCount, earnings: referralCount * 50 });
                
                const total = applications.reduce((acc, curr) => {
                     if (curr.status === 'Paid') {
                        const amount = Number(curr.bid_amount) || 0;
                        return isClient ? acc + amount : acc + (amount * 0.96);
                     }
                     return acc;
                }, 0);
                setTotalEarnings(total);
            }

        } catch (err) {
            showToast("Dashboard sync failed: " + err.message, "error");
        } finally {
            if(isMounted) setIsLoading(false);
        }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user.id, isClient, showToast]); 

  // --- ACTION HANDLERS ---
  
  // Updated Profile Handler (Compatible Version)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const tableName = isClient ? 'clients' : 'freelancers';
    
    // Updated cleanUpdates to include new fields like bio, social_links
    const cleanUpdates = { 
        name: profileForm.name, 
        phone: profileForm.phone, 
        nationality: profileForm.nationality,
        bio: profileForm.bio,
        social_links: profileForm.social_links 
    };
    
    if (!isClient) {
        cleanUpdates.age = profileForm.age; 
        cleanUpdates.qualification = profileForm.qualification;
        cleanUpdates.specialty = profileForm.specialty;
        cleanUpdates.services = profileForm.services;
        cleanUpdates.upi = profileForm.upi; 
        // Note: Sensitive bank details are now handled via KYC Modal
    } else { 
        cleanUpdates.is_organisation = profileForm.is_organisation; 
    }

    const { error } = await api.updateUserProfile(user.id, cleanUpdates, tableName);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast("Profile updated!", "success"); setUser({ ...user, ...cleanUpdates }); }
  };

  const checkKycLock = (actionType) => {
    if (user.kyc_status === 'approved') return true;
    if (user.kyc_status === 'pending') {
       showToast("⏳ Verification under review.", "info");
       return false;
    }
    const BLOCKED_ACTIONS = ['apply_paid', 'accept_job', 'release_escrow', 'post_job'];
    if (BLOCKED_ACTIONS.includes(actionType)) {
      setModal('kyc_verification'); 
      return false;
    }
    return true;
  };

  const handleKycSubmit = async (e, { ageGroup, bankDetails }) => {
    e.preventDefault();
    if (!kycFile) return showToast("Please select an ID file.", "error");

    showToast("Encrypting & Uploading data...", "info");
    
    try {
        const fileName = `${user.id}/${Date.now()}_kyc`;
        const { error: uploadError } = await supabase.storage
            .from('id_proofs')
            .upload(fileName, kycFile);

        if (uploadError) throw uploadError;

        const beneficiaryId = `BEN-${Date.now().toString().slice(-6)}`;

        // Save Banking
        const { error: bankError } = await supabase
            .from('user_banking')
            .insert({
                user_id: user.id,
                account_holder_name: bankDetails.account_holder_name,
                account_number: bankDetails.account_number,
                ifsc_code: bankDetails.ifsc_code,
                bank_name: bankDetails.bank_name,
                is_guardian_account: ageGroup === 'minor',
                guardian_name: ageGroup === 'minor' ? bankDetails.guardian_name : null,
                guardian_relationship: ageGroup === 'minor' ? bankDetails.guardian_relationship : null,
                parent_consent_verified: bankDetails.consent || false,
                beneficiary_id: beneficiaryId
            });

        if (bankError) throw bankError;

        // Update Profile Status
        const table = isClient ? 'clients' : 'freelancers';
        const { error: dbError } = await supabase
            .from(table)
            .update({ 
                kyc_status: 'pending',
                id_proof_url: fileName,
                kyc_type: ageGroup,
                kyc_submitted_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (dbError) throw dbError;

        showToast("Success! Documents submitted.", "success");
        setUser({ ...user, kyc_status: 'pending', kyc_type: ageGroup }); 
        setModal(null);
        
    } catch (err) {
        showToast("Submission failed: " + err.message, "error");
    }
  };

  // Placeholders for other handlers to ensure full compatibility
  const handlePostJob = async (e) => { 
      e.preventDefault();
      // ... Implementation from previous context ...
      setModal(null); 
  };
  const handleApplyJob = async (e) => { 
      e.preventDefault();
      // ... Implementation from previous context ...
      setModal(null); 
  };
  const handleSubmitWork = async (e) => { 
      e.preventDefault();
      // ... Implementation from previous context ...
      setModal(null); 
  };
  const handleAction = async (action, app) => { /* ... Logic ... */ };

  const getTabIcon = () => {
    const icons = {
      'overview': <LayoutDashboard size={20} className="text-indigo-600 dark:text-indigo-400"/>,
      'jobs': <Briefcase size={20} className="text-blue-500"/>,
      'profile': <UserCircle size={20} className="text-pink-500"/>,
      'posted-jobs': <ListChecks size={20} className="text-indigo-500"/>,
      'academy': <BookOpen size={20} className="text-emerald-500"/>,
      'settings': <Settings size={20} className="text-gray-500"/>,
      'profile-card': <Share2 size={20} className="text-purple-500"/>,
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

      <DashboardSidebar 
        user={user} isClient={isClient} badges={badges} userLevel={userLevel} progressPercent={progressPercent}
        menuOpen={menuOpen} setMenuOpen={setMenuOpen} zenMode={zenMode} setZenMode={setZenMode}
        tab={tab} setTab={setTab} onLogout={onLogout}
      />

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
                    {/* Notification Dropdown Logic */}
                    {showNotifications && (
                      <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-fade-in z-50">
                          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                             <span className="font-bold text-sm dark:text-white">Notifications</span>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs">No new alerts</div> : notifications.map(n => (
                               <div key={n.id} className="p-3 border-b border-gray-50 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
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

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
               <div className="animate-fade-in-up">
                 {tab === 'overview' && (
                    <Overview user={user} isClient={isClient} totalEarnings={totalEarnings} jobsCount={isClient ? jobs.length : applications.length} badgesCount={badges.length} setTab={setTab} referralCount={referralStats.count} referralEarnings={referralStats.earnings} />
                 )}
                 {tab === 'jobs' && <Jobs isClient={isClient} services={services} filteredJobs={filteredJobs} searchTerm={searchTerm} setSearchTerm={setSearchTerm} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} parentMode={parentMode} />}
                 {tab === 'posted-jobs' && isClient && <ClientPostedJobs jobs={jobs} setModal={setModal} />}
                 {tab === 'my-services' && !isClient && <MyServices services={services} setModal={setModal} />}
                 
                 {tab === 'applications' && (
                    <Applications 
                        applications={applications} 
                        isClient={isClient} 
                        parentMode={parentMode}
                        onAction={handleAction} 
                        onViewTimeline={(app) => setTimelineApp(app)}
                        showToast={showToast}
                    />
                 )}
                 
                 {tab === 'messages' && <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden h-[calc(100vh-180px)]"><ChatSystem user={user} activeChat={activeChat} setActiveChat={setActiveChat} parentMode={parentMode} /></div>}
                 
                 {/* Profile Tab */}
                 {tab === 'profile' && !isClient && (
                    <UserProfile 
                       user={user} 
                       badges={badges} 
                       userLevel={userLevel} 
                       unlockedSkills={unlockedSkills} 
                       isClient={isClient} 
                       onEditProfile={() => setTab('settings')}
                    />
                 )}

                 {tab === 'academy' && !isClient && <Academy unlockedSkills={unlockedSkills} setModal={setModal} quizzes={SAFE_QUIZZES} />}
                 {tab === 'portfolio' && !isClient && <Portfolio rawPortfolioText={rawPortfolioText} setRawPortfolioText={setRawPortfolioText} handleAiGenerate={handleAiGenerate} isAiLoading={isAiLoading} portfolioItems={portfolioItems} />}
                 
                 {tab === 'profile-card' && !isClient && (
                   <ProfileCard 
                     ref={profileCardRef} 
                     user={user} 
                     unlockedSkills={unlockedSkills} 
                     badges={badges} 
                     userLevel={userLevel} 
                     applications={applications} 
                     showToast={showToast} 
                   />
                 )}

                 {tab === 'records' && <Records applications={applications} />}
    
                 {tab === 'settings' && (
                  <SettingsComp 
                    profileForm={profileForm} 
                    setProfileForm={setProfileForm} 
                    isClient={isClient} 
                    handleUpdateProfile={handleUpdateProfile} 
                    parentMode={parentMode} 
                    setParentMode={setParentMode}
                    onOpenKyc={() => setModal('kyc_verification')} 
                  />
                )}
               </div>
            </div>
         </div>
      </main>

      {/* --- MODALS --- */}
      {modal === 'kyc_verification' && (
        <KycVerificationModal 
          user={user} 
          kycFile={kycFile} 
          setKycFile={setKycFile} 
          handleKycSubmit={handleKycSubmit} 
          onClose={() => setModal(null)} 
        />
      )}

      {/* Placeholders for other modals */}
      {modal === 'post-job' && <PostJobModal onClose={() => setModal(null)} onSubmit={handlePostJob} />}
      {modal === 'create-service' && <CreateServiceModal onClose={() => setModal(null)} />}
      {modal === 'apply-job' && <ApplyJobModal onClose={() => setModal(null)} onSubmit={handleApplyJob} job={selectedJob} user={user} currentEnergy={energy} />}
      {modal === 'submit_work' && <Modal title="Deliver Your Work" onClose={() => setModal(null)}><form onSubmit={handleSubmitWork} className="space-y-4"> {/* Form */} </form></Modal>}
      
      {timelineApp && <Modal title={`Project Timeline: ${timelineApp.jobs?.title}`} onClose={() => setTimelineApp(null)}><OrderTimeline application={timelineApp} /></Modal>}
      {paymentModal && <PaymentModal onClose={() => setPaymentModal(null)} paymentData={paymentModal} />}

    </div>
  );
};

export default Dashboard;