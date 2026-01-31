import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Package, Eye, FileText, Lock, Sparkles } from 'lucide-react';

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
  const { modal, showRewardModal, isClaiming, kycFile, timelineApp, viewWorkApp, currentQuestionIndex, score, viewProfileId, publicProfileData, editProfileModal, applications, paymentModal, selectedJob, energy } = state;
  const { setModal, setShowRewardModal, setKycFile, setTimelineApp, setViewWorkApp, setScore, setCurrentQuestionIndex, setViewProfileId, setPublicProfileData, setEditProfileModal, setPaymentModal, setTab } = setters;

  return (
    <AnimatePresence>
       {/* DAILY REWARD */}
       {showRewardModal && (
            <DailyRewardModal 
                isOpen={showRewardModal}
                onClaim={actions.claimReward}
                isClaiming={isClaiming}
                onClose={() => setShowRewardModal(false)}
            />
        )}

        {/* KYC */}
        {modal === 'kyc_verification' && (
          <KycVerificationModal 
            user={user} 
            kycFile={kycFile} 
            setKycFile={setKycFile} 
            handleKycSubmit={actions.handleKycSubmit} 
            onClose={() => setModal(null)} 
          />
        )}

        {/* JOBS & SERVICES */}
        {modal === 'post-job' && <PostJobModal onClose={() => setModal(null)} onSubmit={actions.handlePostJob} />}
        {modal === 'create-service' && <CreateServiceModal onClose={() => setModal(null)} onSubmit={actions.handleCreateService} />}
        {modal === 'apply-job' && (
          <ApplyJobModal 
            onClose={() => setModal(null)} 
            onSubmit={actions.handleApplyJob} 
            job={selectedJob} 
            user={user}
            currentEnergy={energy}
          />
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

        {/* SUBMIT WORK */}
        {modal === 'submit_work' && (
          <Modal title="Deliver Your Work" onClose={() => setModal(null)}>
             <form onSubmit={actions.handleSubmitWork} className="space-y-4">
               <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-sm mb-4"><strong>Instructions:</strong> Provide a link (Drive/GitHub) OR upload files.</div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">External Link</label>
                 <input name="work_link" type="url" placeholder="https://..." className="w-full p-3 border rounded-xl dark:bg-black dark:border-gray-700 dark:text-white"/>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                 <textarea name="message" rows="3" className="w-full p-3 border rounded-xl dark:bg-black dark:border-gray-700 dark:text-white" placeholder="Describe work..."></textarea>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Files (Max 5MB)</label>
                 <input type="file" name="files" multiple className="w-full text-sm text-gray-500"/>
               </div>
               <Button className="w-full py-3">Submit Delivery</Button>
             </form>
          </Modal>
        )}

        {/* VIEW WORK (For Client) */}
        {viewWorkApp && (
          <Modal title="Review Delivery" onClose={() => setViewWorkApp(null)}>
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Freelancer Note</h4>
                  <p className="text-gray-800 dark:text-gray-200 text-sm italic">"{viewWorkApp.work_message || 'No message'}"</p>
                </div>
                <div className="space-y-3">
                  {viewWorkApp.work_link && (
                    <a href={viewWorkApp.work_link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors">
                        <Package size={20} className="text-indigo-600"/>
                        <div className="flex-1"><p className="font-bold text-indigo-700 text-sm">External Link</p></div>
                        <Eye size={16} className="text-gray-400"/>
                    </a>
                  )}
                  {viewWorkApp.work_files && viewWorkApp.work_files.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                        <FileText size={20} className="text-gray-600"/>
                        <div className="flex-1"><p className="font-bold text-gray-700 text-sm">File {i+1}</p></div>
                        <Eye size={16}/>
                    </a>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setViewWorkApp(null)}>Close</Button>
                  <Button className="flex-1 bg-emerald-600" onClick={() => actions.handleApproveWork(viewWorkApp)}>Approve Work</Button>
                </div>
            </div>
          </Modal>
        )}

        {/* QUIZ LOCKED */}
        {modal === 'quiz-locked' && (
           <Modal title="Skill Locked" onClose={() => setModal(null)}>
              <div className="text-center py-8">
                 <Lock size={40} className="mx-auto mb-6 text-gray-400"/>
                 <h3 className="text-xl font-bold dark:text-white mb-2">Access Denied</h3>
                 <p className="text-gray-500 mb-8">Pass the quiz in Academy first.</p>
                 <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full">Go to Academy</Button>
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
          <Modal title={`Profile: ${publicProfileData.user.name}`} onClose={() => { setViewProfileId(null); setPublicProfileData(null); }}>
              <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-2">
              <UserProfile user={publicProfileData.user} badges={publicProfileData.badges} unlockedSkills={publicProfileData.user.unlocked_skills || []} userLevel={Math.floor((publicProfileData.user.unlocked_skills?.length || 0) / 2) + 1} isClient={true} readOnly={true} onEditProfile={() => {}} />
               {publicProfileData.portfolio?.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                      <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2"><Sparkles size={20} className="text-purple-500"/> Portfolio</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {publicProfileData.portfolio.map(item => (
                          <div key={item.id} className="p-5 bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                               <h4 className="font-bold text-indigo-600 mb-2">{item.title}</h4>
                              <p className="text-sm text-gray-600 line-clamp-4">{item.content}</p>
                          </div>
                          ))}
                      </div>
                  </div>
               )}
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                   <Button variant="outline" onClick={() => { setViewProfileId(null); setPublicProfileData(null); }}>Close</Button>
                  <Button onClick={() => {
                          const app = applications.find(a => a.freelancer_id === viewProfileId && a.status === 'Pending');
                          if(app) { setViewProfileId(null); actions.handleAppAction('accept', app); } 
                          else { showToast("Return to applications to hire.", "info"); setViewProfileId(null); }
                      }} className="bg-indigo-600 text-white">Hire This Freelancer</Button>
              </div>
          </Modal>
        )}

        {/* EDIT PROFILE */}
        {editProfileModal && (
          <Modal title="Edit Public Profile" onClose={() => setEditProfileModal(false)}>
              <form onSubmit={actions.handleSavePublicProfile} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tagline</label>
                      <input name="tag_line" defaultValue={user.tag_line} maxLength={50} className="w-full p-3 border rounded-xl dark:bg-black dark:border-gray-700 dark:text-white" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio</label>
                      <textarea name="bio" defaultValue={user.bio} rows="4" maxLength={300} className="w-full p-3 border rounded-xl dark:bg-black dark:border-gray-700 dark:text-white"></textarea>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Social Links</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input name="github" defaultValue={user.social_links?.github} placeholder="GitHub URL" className="p-2 text-sm border rounded-lg dark:bg-black dark:border-gray-700 dark:text-white" />
                          <input name="linkedin" defaultValue={user.social_links?.linkedin} placeholder="LinkedIn URL" className="p-2 text-sm border rounded-lg dark:bg-black dark:border-gray-700 dark:text-white" />
                          <input name="instagram" defaultValue={user.social_links?.instagram} placeholder="Instagram URL" className="p-2 text-sm border rounded-lg dark:bg-black dark:border-gray-700 dark:text-white" />
                          <input name="website" defaultValue={user.social_links?.website} placeholder="Portfolio Website" className="p-2 text-sm border rounded-lg dark:bg-black dark:border-gray-700 dark:text-white" />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                      <Button variant="ghost" type="button" onClick={() => setEditProfileModal(false)}>Cancel</Button>
                      <Button className="bg-indigo-600 text-white">Save Changes</Button>
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