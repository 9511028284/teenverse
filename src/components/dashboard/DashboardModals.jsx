import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Package, Eye, FileText, Lock, Sparkles, 
  ShieldCheck, CloudUpload, Github, Linkedin, Instagram, Globe 
} from 'lucide-react';

// UI
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Modals
import PostJobModal from '../modals/PostJobModal';
import CreateServiceModal from '../modals/CreateServiceModal';
import ApplyJobModal from '../modals/ApplyJobModal';
import PaymentModal from '../modals/PaymentModal';
import KycVerificationModal from '../modals/KycVerificationModal';
import ActiveQuizModal from '../modals/ActiveQuizModal';
import DailyRewardModal from '../modals/DailyRewardModal';
import OrderTimeline from '../dashboard/OrderTimeline';
import UserProfile from '../dashboard/UserProfile';

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
    setPaymentModal, setTab 
  } = setters;

  // 💅 Premium Shared Styles
  const inputStyles = "w-full p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-gray-900 dark:text-white";
  const labelStyles = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

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

        {/* TIMELINE */}
        {timelineApp && (
          <Modal title={`Timeline: ${timelineApp.jobs?.title}`} onClose={() => setTimelineApp(null)}>
            <div className="py-2">
                <OrderTimeline application={timelineApp} />
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-[10px] font-mono text-gray-500 uppercase tracking-tighter">
                        {/* 👇 Fix applied here: safely rendering the raw ID */}
                        Order ID: #{timelineApp.id}
                    </span>
                </div>
            </div>
          </Modal>
        )}

         {/* TIMELINE */}
        {timelineApp && (
          <Modal title={`Project Timeline: ${timelineApp.jobs?.title}`} onClose={() => setTimelineApp(null)}>
            <OrderTimeline application={timelineApp} />
            <div className="mt-4 text-center">
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-500">Order ID: #{timelineApp.id}</span>
            </div>
          </Modal>
        )}

        {/* SUBMIT WORK - Modernized Form */}
        {modal === 'submit_work' && (
          <Modal title="Deliver Project" onClose={() => setModal(null)}>
             <form onSubmit={actions.handleSubmitWork} className="space-y-5">
               <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 items-start">
                  <ShieldCheck className="text-indigo-500 shrink-0" size={20} />
                  <p className="text-indigo-700 dark:text-indigo-300 text-xs leading-relaxed">
                    <strong>Instructions:</strong> Use a permanent link (Google Drive/GitHub) to ensure the client can always access the assets, or securely upload files below.
                  </p>
               </div>
               
               <div>
                 <label className={labelStyles}>External Delivery Link</label>
                 <input name="work_link" type="url" placeholder="https://..." className={inputStyles}/>
               </div>

               <div>
                 <label className={labelStyles}>Message to Client</label>
                 <textarea name="message" rows="3" className={inputStyles} placeholder="Explain what's included in this delivery..."></textarea>
               </div>

               <div className="group relative border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500 transition-colors">
                 <input type="file" name="files" multiple className="absolute inset-0 opacity-0 cursor-pointer"/>
                 <CloudUpload className="mx-auto text-gray-400 mb-2 group-hover:text-indigo-500 transition-colors" size={32} />
                 <p className="text-xs text-gray-500 font-medium">Drag files or click to upload (Max 5MB)</p>
               </div>

               <Button className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-500/20 font-bold tracking-wide">Submit Delivery</Button>
             </form>
          </Modal>
        )}

        {/* VIEW WORK - Client Review */}
        {viewWorkApp && (
          <Modal title="Review Delivery" onClose={() => setViewWorkApp(null)}>
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <h4 className={labelStyles}>Freelancer Note</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
                    "{viewWorkApp.work_message || 'No message provided.'}"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {viewWorkApp.work_link && (
                    <a href={viewWorkApp.work_link} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm group">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Package size={20}/></div>
                        <div className="flex-1"><p className="font-bold text-gray-900 dark:text-white text-sm">Project Assets</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">External URL</p></div>
                        <Eye size={18} className="text-gray-400 group-hover:text-indigo-500"/>
                    </a>
                  )}
                  {viewWorkApp.work_files && viewWorkApp.work_files.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:scale-[1.02] transition-all shadow-sm group">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><FileText size={20}/></div>
                        <div className="flex-1"><p className="font-bold text-gray-900 dark:text-white text-sm">Attachment {i+1}</p></div>
                        <Eye size={18} className="text-gray-400 group-hover:text-emerald-500"/>
                    </a>
                  ))}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 py-3.5 rounded-xl border-gray-200" onClick={() => setViewWorkApp(null)}>Back</Button>
                  <Button className="flex-[2] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20" onClick={() => actions.handleApproveWork(viewWorkApp)}>Approve & Release Funds</Button>
                </div>
            </div>
          </Modal>
        )}

        {/* QUIZ LOCKED */}
        {modal === 'quiz-locked' && (
           <Modal title="Skill Locked" onClose={() => setModal(null)}>
              <div className="text-center py-8">
                 <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={32} className="text-gray-400"/>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h3>
                 <p className="text-gray-500 mb-8 px-4 text-sm">You need to pass the assessment in the Academy before accessing this feature.</p>
                 <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full py-4 rounded-xl shadow-lg">Go to Academy</Button>
              </div>
           </Modal>
        )}

        {/* SKILL GATE - High Impact UI */}
        {modal?.type === 'skill_gate' && (
            <Modal title="Verification Required" onClose={() => setModal(null)}>
                <div className="text-center py-4">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative w-full h-full bg-gradient-to-tr from-indigo-600 to-violet-400 rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                            <Sparkles size={40} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black mb-3 text-gray-900 dark:text-white">
                        Prove Your Skills
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm px-4 mb-6">
                        You need a verified <span className="text-indigo-500 font-bold px-1.5 py-0.5 bg-indigo-500/10 rounded">'{modal.category}'</span> badge to apply for <span className="italic">"{modal.jobTitle}"</span>. 
                    </p>
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-xs text-gray-500 dark:text-gray-300 text-left mb-6">
                        To keep quality high, you gotta pass a quick AI assessment to unlock this category. Ready to flex your skills?
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => setModal(null)} className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                            Maybe Later
                        </button>
                        <button 
                            onClick={() => actions.startAiQuiz(modal.category, modal.jobTitle)}
                            className="flex-[2] py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            Start AI Quiz 🤖
                        </button>
                    </div>
                </div>
            </Modal>
        )}

        {/* ACTIVE QUIZ */}
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

       {/* VIEW PUBLIC PROFILE */}
        {viewProfileId && publicProfileData && (
          <Modal 
            title={`Profile: ${publicProfileData.user.name}`} 
            onClose={() => { setViewProfileId(null); setPublicProfileData(null); }}
          >
              <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[75vh]">
                  
                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-1 sm:p-2 pr-2">
                      <UserProfile 
                          user={publicProfileData.user} 
                          badges={publicProfileData.badges} 
                          unlockedSkills={publicProfileData.user.unlocked_skills || []} 
                          userLevel={Math.floor((publicProfileData.user.unlocked_skills?.length || 0) / 2) + 1} 
                          isClient={true} 
                          readOnly={true} 
                          onEditProfile={() => {}} 
                      />
                      
                      {publicProfileData.portfolio?.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-gray-200/60 dark:border-white/10">
                              {/* Premium Section Header */}
                              <div className="flex items-center gap-3 mb-6">
                                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                      <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400"/>
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                      Portfolio Showcase
                                  </h3>
                              </div>

                              {/* Portfolio Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {publicProfileData.portfolio.map(item => (
                                      <div 
                                          key={item.id} 
                                          className="group p-5 bg-white dark:bg-white/[0.02] rounded-2xl ring-1 ring-gray-200 dark:ring-white/10 hover:ring-indigo-500/50 dark:hover:ring-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 ease-out cursor-default"
                                      >
                                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                              {item.title}
                                          </h4>
                                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                              {item.content}
                                          </p>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Sticky Footer Actions */}
                  <div className="shrink-0 mt-2 pt-4 border-t border-gray-200/60 dark:border-white/10 flex flex-col sm:flex-row justify-end gap-3 bg-white dark:bg-transparent">
                      <Button 
                          variant="outline" 
                          className="w-full sm:w-auto py-3.5 sm:py-2.5 rounded-xl font-medium border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" 
                          onClick={() => { setViewProfileId(null); setPublicProfileData(null); }}
                      >
                          Close
                      </Button>
                      <Button 
                          className="w-full sm:w-auto py-3.5 sm:py-2.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all" 
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
                          Hire This Freelancer
                      </Button>
                  </div>
                  
              </div>
          </Modal>
        )}

        {/* EDIT PROFILE - Redesigned Input Grid */}
        {editProfileModal && (
          <Modal title="Update Profile" onClose={() => setEditProfileModal(false)}>
              <form onSubmit={actions.handleSavePublicProfile} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className={labelStyles}>Professional Tagline</label>
                          <input name="tag_line" defaultValue={user.tag_line} maxLength={50} className={inputStyles} placeholder="e.g. Senior Full-Stack Engineer" />
                      </div>
                      <div>
                          <label className={labelStyles}>Short Bio</label>
                          <textarea name="bio" defaultValue={user.bio} rows="3" maxLength={300} className={inputStyles} placeholder="Tell clients what makes you unique..."></textarea>
                      </div>
                  </div>

                  <div className="pt-2">
                      <label className={labelStyles}>Social Presence</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="relative">
                            <Github className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input name="github" defaultValue={user.social_links?.github} placeholder="GitHub Handle" className={`${inputStyles} pl-10`} />
                         </div>
                         <div className="relative">
                            <Linkedin className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input name="linkedin" defaultValue={user.social_links?.linkedin} placeholder="LinkedIn URL" className={`${inputStyles} pl-10`} />
                         </div>
                         <div className="relative">
                            <Instagram className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input name="instagram" defaultValue={user.social_links?.instagram} placeholder="Instagram URL" className={`${inputStyles} pl-10`} />
                         </div>
                         <div className="relative">
                            <Globe className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                            <input name="website" defaultValue={user.social_links?.website} placeholder="Portfolio Website" className={`${inputStyles} pl-10`} />
                         </div>
                      </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                      <Button variant="ghost" type="button" className="text-gray-500 py-3 sm:py-2" onClick={() => setEditProfileModal(false)}>Discard</Button>
                      <Button className="bg-indigo-600 text-white py-3 sm:py-2 rounded-xl shadow-lg shadow-indigo-500/20">Apply Changes</Button>
                  </div>
              </form>
          </Modal>
        )}

        {/* PAYMENT */}
        {paymentModal && <PaymentModal onClose={() => setPaymentModal(null)} onConfirm={actions.processPayment} paymentData={paymentModal} />}
    </AnimatePresence>
  );
};

export default DashboardModals;