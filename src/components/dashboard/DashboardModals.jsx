import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Package, Eye, FileText, Lock, Unlock,
  ShieldCheck, CloudUpload, Github, Linkedin, Instagram, Globe, Sparkles, XCircle
} from 'lucide-react';

// UI
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Modals
import PostJobModal from '../modals/PostJobModal';
import SupportChatModal from '../modals/SupportChatModal';
import CreateServiceModal from '../modals/CreateServiceModal';
import ApplyJobModal from '../modals/ApplyJobModal';
import PaymentModal from '../modals/PaymentModal';
import KycVerificationModal from '../modals/KycVerificationModal';
import ActiveQuizModal from '../modals/ActiveQuizModal';
import DailyRewardModal from '../modals/DailyRewardModal';
import OrderTimeline from '../dashboard/OrderTimeline';
import UserProfile from '../dashboard/UserProfile';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const DashboardModals = ({ user, logic, showToast }) => {
  const { state, setters, actions } = logic;
  const { 
    modal, showRewardModal, isClaiming, kycFile, timelineApp, 
    viewWorkApp, currentQuestionIndex, score, viewProfileId, 
    publicProfileData, editProfileModal, applications, 
    paymentModal, selectedJob, energy 
  } = state;

  const { 
    setModal, setShowRewardModal, setKycFile, setTimelineApp, 
    setViewWorkApp, setScore, setCurrentQuestionIndex, 
    setViewProfileId, setPublicProfileData, setEditProfileModal, 
    setPaymentModal, setTab, setSelectedJob 
  } = setters;

  // 💅 Premium Re-engineered Tactile Shared Styles
  const inputStyles = "w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.05] text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] transition-all duration-200 ease-out";
  const labelStyles = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] mb-1.5 ml-1";

  return (
    <AnimatePresence mode="wait">
       {/* DAILY REWARD */}
       {showRewardModal && (
            <DailyRewardModal 
                isOpen={showRewardModal}
                onClaim={actions.claimReward}
                isClaiming={isClaiming}
                onClose={() => setShowRewardModal(false)}
            />
        )}

        {/* KYC MODALS */}
      {modal === 'kyc_verification' && (
        <KycVerificationModal 
          mode="identity"
          user={user}
          kycFile={kycFile}
          setKycFile={setKycFile}
          actions={actions} 
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'bank_linkage' && (
        <KycVerificationModal 
          mode="banking"
          user={user}
          kycFile={kycFile}
          setKycFile={setKycFile}
          actions={actions} 
          onClose={() => setModal(null)}
        />
      )}

      {/* IN-APP SUPPORT CHAT */}
      {modal === 'support-chat' && (
          <SupportChatModal 
              user={user} 
              showToast={showToast} 
              onClose={() => setModal(null)} 
          />
      )}

        {/* JOBS & SERVICES */}
        {modal === 'post-job' && <PostJobModal onClose={() => setModal(null)} onSubmit={actions.handlePostJob} />}
        {modal === 'create-service' && <CreateServiceModal onClose={() => setModal(null)} onSubmit={actions.handleCreateService} />}
        {modal === 'apply-job' && selectedJob && (
          <ApplyJobModal 
            onClose={() => { setModal(null); setSelectedJob(null); }} 
            onSubmit={actions.handleApplyJob} 
            job={selectedJob} 
            user={user}
            currentEnergy={energy}
          />
        )}

        {/* PROJECT TIMELINE OVERLAY */}
        {timelineApp && (
          <Modal title={`Timeline: ${timelineApp.jobs?.title}`} onClose={() => setTimelineApp(null)}>
            <div className="py-2 space-y-6">
                <OrderTimeline application={timelineApp} />
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.04] flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-400 dark:bg-slate-950 dark:border-white/[0.04] dark:text-slate-500 text-[10px] font-bold font-mono uppercase tracking-wider shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-none">
                        Order ID: #{timelineApp.id}
                    </span>
                </div>
            </div>
          </Modal>
        )}

        {/* SUBMIT WORK - Tactile Form Deliverable */}
        {modal === 'submit_work' && (
          <Modal title="Deliver Project" onClose={() => setModal(null)}>
             <form onSubmit={actions.handleSubmitWork} className="space-y-5">
               <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 p-4 rounded-2xl flex gap-3 items-start shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6)] dark:shadow-none">
                  <ShieldCheck className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={18} strokeWidth={2.5} />
                  <p className="text-xs font-medium leading-relaxed">
                    <strong>Instructions:</strong> Provide a persistent delivery route (Google Drive / GitHub repository) to maintain client file clarity, or bundle asset attachments below.
                  </p>
               </div>
               
               <div className="space-y-1">
                 <label className={labelStyles}>External Delivery Link</label>
                 <input name="work_link" type="url" placeholder="https://..." className={inputStyles}/>
               </div>

               <div className="space-y-1">
                 <label className={labelStyles}>Message to Client</label>
                 <textarea name="message" rows="3" className={cn(inputStyles, "resize-none")} placeholder="Summarize deliverable updates clearly for the client review stage..."></textarea>
               </div>

               {/* Dropzone frame component wrapper */}
               <div className="group relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[20px] p-6 text-center bg-slate-50/50 dark:bg-slate-950/20 transition-all duration-300 hover:border-indigo-500/40 cursor-pointer">
                 <input type="file" name="files" multiple className="absolute inset-0 opacity-0 cursor-pointer z-20"/>
                 <CloudUpload className="mx-auto text-slate-400 mb-2 group-hover:text-indigo-500 group-hover:scale-105 transition-all duration-300" size={28} strokeWidth={2.5} />
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Drag components here or browse folders <span className="block text-[10px] text-slate-400 font-medium mt-0.5">(Max 5MB per upload item)</span></p>
               </div>

               <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_10px_24px_rgba(79,70,229,0.2)] dark:bg-indigo-500 dark:hover:bg-indigo-400">Submit Delivery</Button>
             </form>
          </Modal>
        )}

        {/* VIEW WORK - Client Review Panel */}
        {viewWorkApp && (
          <Modal title="Review Delivery" onClose={() => setViewWorkApp(null)}>
            <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-200/60 dark:bg-slate-950 dark:border-white/[0.04] p-4 rounded-2xl shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.01)]">
                  <h4 className={labelStyles}>Freelancer Note</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold leading-relaxed italic">
                    "{viewWorkApp.work_message || 'No contextual summary message provided.'}"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {viewWorkApp.work_link && (
                    <a href={viewWorkApp.work_link} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-3.5 p-4 bg-white border border-slate-200/80 dark:bg-slate-900/40 dark:border-white/[0.05] rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_12px_rgba(0,0,0,0.01)] dark:shadow-none hover:border-indigo-500/20 dark:hover:border-indigo-500/30 transition-all duration-300 group">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 rounded-xl flex items-center justify-center shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6)] dark:shadow-none group-hover:scale-105 transition-transform"><Package size={18} strokeWidth={2.5}/></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate">Project Assets Package</p>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">Secure External URL Route</p>
                        </div>
                        <Eye size={16} strokeWidth={2.5} className="text-slate-400 group-hover:text-indigo-500 transition-colors mr-1"/>
                    </a>
                  )}
                  
                  {viewWorkApp.work_files && viewWorkApp.work_files.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-4 p-4 bg-white border border-slate-200/80 dark:bg-slate-900/40 dark:border-white/[0.05] rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_12px_rgba(0,0,0,0.01)] dark:shadow-none hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-300 group">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 rounded-xl flex items-center justify-center shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6)] dark:shadow-none group-hover:scale-105 transition-transform"><FileText size={18} strokeWidth={2.5}/></div>
                        <div className="flex-1 min-w-0"><p className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate">Attachment Deliverable {i+1}</p></div>
                        <Eye size={16} strokeWidth={2.5} className="text-slate-400 group-hover:text-emerald-500 transition-colors mr-1"/>
                    </a>
                  ))}
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                  <Button variant="outline" className="flex-1 py-3 rounded-xl border-slate-200 dark:border-white/10 font-bold text-xs uppercase tracking-wider" onClick={() => setViewWorkApp(null)}>Back</Button>
                  <Button className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(16,185,129,0.2)]" onClick={() => actions.handleApproveWork(viewWorkApp)}>Approve & Release Funds</Button>
                </div>
            </div>
          </Modal>
        )}

        {/* QUIZ LOCKED MODULE ASSIGNMENT ASSESSMENTS */}
        {modal === 'quiz-locked' && (
           <Modal title="Skill Locked" onClose={() => setModal(null)}>
              <div className="text-center py-6">
                 <div className="w-16 h-16 bg-slate-100 border border-slate-200/60 dark:bg-slate-950 dark:border-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.01)]">
                    <Lock size={24} strokeWidth={2.5} className="text-slate-400 dark:text-slate-500"/>
                 </div>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">Access Boundary Protected</h3>
                 <p className="text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto text-xs font-medium leading-relaxed">You must fulfill and check off this matching skill assessment criteria course within the Academy space module first.</p>
                 <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(79,70,229,0.2)] dark:bg-indigo-500 dark:hover:bg-indigo-400">Launch Academy Portal</Button>
              </div>
           </Modal>
        )}

        {/* SKILL GATE ASSESSMENT ASSIGNMENT */}
        {modal?.type === 'skill_gate' && (
            <Modal title="Verification Required" onClose={() => setModal(null)}>
                <div className="text-center py-2">
                    <div className="relative w-16 h-16 mx-auto mb-5">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                        <div className="relative w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_8px_16px_rgba(79,70,229,0.25)]">
                            <Sparkles size={24} strokeWidth={2.5} className="text-white drop-shadow-sm" />
                        </div>
                    </div>
                    <h3 className="text-lg font-black tracking-tight mb-1 text-slate-900 dark:text-white">
                        Prove Your Skills
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium max-w-sm mx-auto mb-4 leading-normal">
                        A verified <span className="text-indigo-600 dark:text-indigo-400 font-black px-2 py-0.5 bg-indigo-500/10 rounded-md">'{modal.category}'</span> ecosystem badge credential verification parameter is requested to finalize operations for <span className="italic font-bold text-slate-800 dark:text-slate-300">"{modal.jobTitle}"</span>. 
                    </p>
                    <div className="bg-slate-50 border border-slate-200/60 dark:bg-slate-950 dark:border-white/[0.04] p-4 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 text-left mb-6 leading-relaxed">
                        To maintain standard work ecosystem outputs, please complete this dynamic verification quiz index parameters loop.
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                            Decline
                        </button>
                        <button 
                            onClick={() => actions.startAiQuiz(modal.category, modal.jobTitle)}
                            className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(79,70,229,0.2)] hover:-translate-y-0.5 transition-all dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        >
                            Start Quiz ASSESSMENT 🤖
                        </button>
                    </div>
                </div>
            </Modal>
        )}

        {/* ACTIVE ASSESSMENT QUIZ */}
        {modal?.type === 'quiz' && (
           <ActiveQuizModal 
             modalData={modal}
             currentQuestionIndex={currentQuestionIndex}
             score={score}
             setScore={setScore}
             setCurrentQuestionIndex={setCurrentQuestionIndex}
             handleQuizSelection={actions.handleQuizSelection}
             onClose={() => setModal(null)}
             showToast={showToast}
           />
        )}

       {/* VIEW PUBLIC PROFILE CARD CONTAINER */}
        {viewProfileId && publicProfileData && (
          <Modal 
            title={`Profile: ${publicProfileData.user.name}`} 
            onClose={() => { setViewProfileId(null); setPublicProfileData(null); }}
          >
              <div className="flex flex-col h-full max-h-[82vh] sm:max-h-[72vh]">
                  
                  {/* Scrollable Viewport Profile */}
                  <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-1 pr-2">
                      <UserProfile 
                          user={publicProfileData.user} 
                          badges={publicProfileData.badges} 
                          unlockedSkills={publicProfileData.user.unlocked_skills || []} 
                          userLevel={Math.floor((publicProfileData.user.unlocked_skills?.length || 0) / 2) + 1} 
                          isClient={true} 
                          readOnly={true} 
                          onEditProfile={() => {}} 
                          applications={[
                              ...(publicProfileData.projects || []).map((item) => ({ ...item, freelancer_name: publicProfileData.user.name })),
                              ...(publicProfileData.services || []).map((item) => ({ ...item, source: 'Gig / Service', status: item.status || 'Live', freelancer_name: publicProfileData.user.name })),
                              ...(publicProfileData.portfolio || []).map((item) => ({ ...item, source: 'Portfolio Item', status: item.status || 'Live', freelancer_name: publicProfileData.user.name })),
                          ]}
                      />
                  </div>

                  {/* High-Contrast Floating Action Footer */}
                  <div className="shrink-0 mt-3 pt-4 border-t border-slate-200/80 dark:border-white/[0.04] flex flex-col sm:flex-row justify-end gap-2.5 bg-white dark:bg-transparent">
                      <Button 
                          variant="outline" 
                          className="w-full sm:w-auto py-3 sm:py-2 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" 
                          onClick={() => { setViewProfileId(null); setPublicProfileData(null); }}
                      >
                          Close Profile
                      </Button>
                      <Button 
                          className="w-full sm:w-auto py-3 sm:py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(79,70,229,0.2)] dark:bg-indigo-500 dark:hover:bg-indigo-400" 
                          onClick={() => {
                              const app = applications.find(a => a.freelancer_id === viewProfileId && a.status === 'Pending');
                              if(app) { 
                                  setViewProfileId(null); 
                                  actions.handleAppAction('accept', app); 
                              } else { 
                                  showToast("Return to applications to hire.", "info"); 
                                  setViewProfileId(null); 
                              }
                          }}
                      >
                          Confirm Selection & Hire
                      </Button>
                  </div>
                  
              </div>
          </Modal>
        )}

        {/* EDIT PROFILE CONFIGURATION METRICS */}
        {editProfileModal && (
          <Modal title="Update Profile" onClose={() => setEditProfileModal(false)}>
              <form onSubmit={actions.handleSavePublicProfile} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                          <label className={labelStyles}>Professional Tagline</label>
                          <input name="tag_line" defaultValue={user.tag_line} maxLength={50} className={inputStyles} placeholder="e.g. Graphic Designer & Video Specialist" />
                      </div>
                      <div className="space-y-1">
                          <label className={labelStyles}>Short Bio</label>
                          <textarea name="bio" defaultValue={user.bio} rows="3" maxLength={300} className={cn(inputStyles, "resize-none")} placeholder="Highlight matching experience and specialty certifications here..."></textarea>
                      </div>
                  </div>

                  <div className="pt-1.5 space-y-2">
                      <label className={labelStyles}>Social Presence Indexes</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="relative flex items-center">
                            <Github className="absolute left-4 text-slate-400 dark:text-slate-500" size={15} strokeWidth={2.5} />
                            <input name="github" defaultValue={user.social_links?.github} placeholder="GitHub Username" className={cn(inputStyles, "pl-11")} />
                         </div>
                         <div className="relative flex items-center">
                            <Linkedin className="absolute left-4 text-slate-400 dark:text-slate-500" size={15} strokeWidth={2.5} />
                            <input name="linkedin" defaultValue={user.social_links?.linkedin} placeholder="LinkedIn URL" className={cn(inputStyles, "pl-11")} />
                         </div>
                         <div className="relative flex items-center">
                            <Instagram className="absolute left-4 text-slate-400 dark:text-slate-500" size={15} strokeWidth={2.5} />
                            <input name="instagram" defaultValue={user.social_links?.instagram} placeholder="Instagram URL" className={cn(inputStyles, "pl-11")} />
                         </div>
                         <div className="relative flex items-center">
                            <Globe className="absolute left-4 text-slate-400 dark:text-slate-500" size={15} strokeWidth={2.5} />
                            <input name="website" defaultValue={user.social_links?.website} placeholder="Portfolio Website URL" className={cn(inputStyles, "pl-11")} />
                         </div>
                      </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                      <Button variant="ghost" type="button" className="text-slate-400 font-bold text-xs uppercase tracking-wider py-2.5" onClick={() => setEditProfileModal(false)}>Discard</Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(79,70,229,0.2)] dark:bg-indigo-500 dark:hover:bg-indigo-400">Apply Changes</Button>
                  </div>
              </form>
          </Modal>
        )}

        {/* PAYMENT SYSTEM PORTAL ROUTE */}
        {paymentModal && <PaymentModal onClose={() => setPaymentModal(null)} onConfirm={actions.processPayment} paymentData={paymentModal} />}
    </AnimatePresence>
  );
};

export default DashboardModals;