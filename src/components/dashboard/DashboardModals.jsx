import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Package, Eye, FileText, Lock, ShieldCheck, 
  CloudUpload, Github, Linkedin, Instagram, Globe, 
  Sparkles, XCircle, Image as ImageIcon, CheckCircle2,
  ArrowRight, ExternalLink
} from 'lucide-react';

// UI Components
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

const getDeliveryFileKey = (file, index = 0) => `${index}-${file.name}-${file.size}-${file.lastModified || 0}`;

const formatFileSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const DashboardModals = ({ user, logic, showToast }) => {
  const { state, setters, actions } = logic;
  const { 
    modal, showRewardModal, isClaiming, kycFile, timelineApp, 
    viewWorkApp, currentQuestionIndex, score, viewProfileId, 
    publicProfileData, editProfileModal, applications, 
    paymentModal, selectedJob, energy, deliveryFiles = [],
    deliveryUploadProgress = {}, isSubmittingWork = false
  } = state;

  const { 
    setModal, setShowRewardModal, setKycFile, setTimelineApp, 
    setViewWorkApp, setScore, setCurrentQuestionIndex, 
    setViewProfileId, setPublicProfileData, setEditProfileModal, 
    setPaymentModal, setTab, setSelectedJob, setDeliveryFiles,
    setDeliveryUploadProgress
  } = setters;

  // Modernized, Hyper-Clean Interactive Styles
  const inputStyles = "w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white dark:bg-slate-900/60 dark:border-slate-800 dark:focus:border-indigo-400 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl outline-none text-sm transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 font-medium";
  const labelStyles = "block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 ml-1 flex items-center gap-1.5";
  
  const deliveryFilePreviews = React.useMemo(() => Object.fromEntries(
    deliveryFiles.map((file, index) => [
      getDeliveryFileKey(file, index),
      file.type?.startsWith('image/') ? URL.createObjectURL(file) : null
    ])
  ), [deliveryFiles]);

  React.useEffect(() => () => {
    Object.values(deliveryFilePreviews).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  }, [deliveryFilePreviews]);

  const handleDeliveryFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setDeliveryFiles(files);
    setDeliveryUploadProgress(Object.fromEntries(
      files.map((file, index) => [getDeliveryFileKey(file, index), { progress: 0, status: "Ready" }])
    ));
  };

  const closeSubmitWorkModal = () => {
    if (isSubmittingWork) return;
    setDeliveryFiles([]);
    setDeliveryUploadProgress({});
    setModal(null);
  };

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

      {/* SUPPORT CHAT */}
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
        <Modal title={`Timeline • ${timelineApp.jobs?.title}`} onClose={() => setTimelineApp(null)}>
          <div className="py-1 space-y-6">
            <OrderTimeline application={timelineApp} />
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-center">
              <span className="inline-flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full text-slate-500 text-xs font-mono font-semibold tracking-tight">
                ID: #{timelineApp.id}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* SUBMIT WORK */}
      {modal === 'submit_work' && (
        <Modal title="Deliver Project" onClose={closeSubmitWorkModal}>
          <form onSubmit={actions.handleSubmitWork} className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100/60 dark:border-indigo-900/40 p-4 rounded-2xl flex gap-3 items-start">
              <ShieldCheck className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-indigo-950/80 dark:text-indigo-300 leading-relaxed font-medium">
                Add an external route like Google Drive / GitHub, or securely attach your project files directly below.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className={labelStyles}>External Delivery Link</label>
              <input name="work_link" type="url" placeholder="https://github.com/..." className={inputStyles}/>
            </div>

            <div className="space-y-1.5">
              <label className={labelStyles}>Message to Client</label>
              <textarea name="message" rows="3" className={cn(inputStyles, "resize-none")} placeholder="Hey! Here are the updates I made..."></textarea>
            </div>

            {/* Interactive Upload Zone */}
            <div className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/30 transition-all duration-200 cursor-pointer">
              <input type="file" name="files" multiple onChange={handleDeliveryFileChange} disabled={isSubmittingWork} className="absolute inset-0 opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"/>
              <CloudUpload className="mx-auto text-slate-400 dark:text-slate-600 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:scale-105 transition-all duration-200" size={32} />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">Drop files here or browse</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Max 5MB per item</p>
            </div>

            {/* Selected File Trackers */}
            {deliveryFiles.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-500">Selected Files</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">{deliveryFiles.length} items</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {deliveryFiles.map((file, index) => {
                    const fileKey = getDeliveryFileKey(file, index);
                    const uploadState = deliveryUploadProgress[fileKey] || { progress: 0, status: "Ready" };
                    const progress = Math.max(0, Math.min(100, Number(uploadState.progress || 0)));
                    const isUploaded = uploadState.status === "Uploaded";
                    const isFailed = uploadState.status === "Failed";
                    const previewUrl = deliveryFilePreviews[fileKey];

                    return (
                      <div key={fileKey} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border",
                            isUploaded ? "border-emerald-100 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/40 text-emerald-500" :
                            isFailed ? "border-rose-100 bg-rose-50 dark:border-rose-950 dark:bg-rose-950/40 text-rose-500" :
                            "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 text-slate-500"
                          )}>
                            {previewUrl ? (
                              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                            ) : isUploaded ? (
                              <CheckCircle2 size={16} />
                            ) : isFailed ? (
                              <XCircle size={16} />
                            ) : (
                              <ImageIcon size={16} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{file.name}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatFileSize(file.size)}</p>
                          </div>
                          <span className={cn(
                            "shrink-0 text-xs font-bold",
                            isUploaded ? "text-emerald-500" : isFailed ? "text-rose-500" : "text-slate-500"
                          )}>
                            {uploadState.status === "Ready" && progress > 0 ? `${progress}%` : uploadState.status}
                          </span>
                        </div>
                        {progress > 0 && !isUploaded && !isFailed && (
                          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full bg-indigo-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button 
              disabled={isSubmittingWork} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isSubmittingWork ? 'Uploading Assets...' : 'Send Delivery'}
            </Button>
          </form>
        </Modal>
      )}

      {/* VIEW WORK */}
      {viewWorkApp && (
        <Modal title="Review Delivery" onClose={() => setViewWorkApp(null)}>
          <div className="space-y-5">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Creator Note</h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">
                "{viewWorkApp.work_message || 'No explicit update details left by the freelancer.'}"
              </p>
            </div>

            <div className="space-y-2">
              {viewWorkApp.work_link && (
                <a href={viewWorkApp.work_link} target="_blank" rel="noreferrer" 
                   className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all group">
                  <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center"><Package size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">Project Asset Repository</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{viewWorkApp.work_link}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors mr-1"/>
                </a>
              )}
              
              {viewWorkApp.work_files && viewWorkApp.work_files.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer" 
                   className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all group">
                  <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center"><FileText size={16}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">Attachment Delivery #{i+1}</p>
                  </div>
                  <Eye size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors mr-1"/>
                </a>
              ))}
            </div>

            <div className="pt-2 flex gap-3">
              <Button variant="outline" className="flex-1 py-3 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-semibold" onClick={() => setViewWorkApp(null)}>Back</Button>
              <Button className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/10" onClick={() => actions.handleApproveWork(viewWorkApp)}>Approve & Release Funds</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QUIZ LOCKED */}
      {modal === 'quiz-locked' && (
        <Modal title="Skill Locked" onClose={() => setModal(null)}>
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={20} className="text-slate-400 dark:text-slate-600"/>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">Assessment Required</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto text-xs leading-relaxed font-medium">You need to pass the prerequisite module in the Academy portal to unlock access to this target action.</p>
            <Button onClick={() => {setModal(null); setTab('academy');}} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl">Go to Academy</Button>
          </div>
        </Modal>
      )}

      {/* SKILL GATE */}
      {modal?.type === 'skill_gate' && (
        <Modal title="Skills Check" onClose={() => setModal(null)}>
          <div className="text-center py-2">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5">Verify Your Skillset</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium max-w-sm mx-auto mb-5 leading-relaxed">
              This job requires a verified <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">'{modal.category}'</span> badge. Complete the dynamic skills evaluation quiz below to proceed.
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                Decline
              </button>
              <button 
                onClick={() => actions.startAiQuiz(modal.category, modal.jobTitle)}
                className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:-translate-y-0.5 transition-all dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                Start Quiz <ArrowRight size={14} />
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
          title={publicProfileData.user.name} 
          onClose={() => { setViewProfileId(null); setPublicProfileData(null); }}
        >
          <div className="flex flex-col h-full max-h-[80vh] sm:max-h-[70vh]">
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-1">
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
                  ...(publicProfileData.services || []).map((item) => ({ ...item, source: 'Service', status: item.status || 'Live', freelancer_name: publicProfileData.user.name })),
                  ...(publicProfileData.portfolio || []).map((item) => ({ ...item, source: 'Portfolio', status: item.status || 'Live', freelancer_name: publicProfileData.user.name })),
                ]}
              />
            </div>

            <div className="shrink-0 mt-4 pt-4 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3 bg-white dark:bg-transparent">
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-semibold text-xs border-slate-200 dark:border-slate-800" 
                onClick={() => { setViewProfileId(null); setPublicProfileData(null); }}
              >
                Close
              </Button>
              <Button 
                className="flex-[2] sm:flex-initial px-6 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 dark:bg-indigo-500 dark:hover:bg-indigo-600" 
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
                Hire Freelancer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT PROFILE */}
      {editProfileModal && (
        <Modal title="Edit Profile" onClose={() => setEditProfileModal(false)}>
          <form onSubmit={actions.handleSavePublicProfile} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelStyles}>Professional Tagline</label>
                <input name="tag_line" defaultValue={user.tag_line} maxLength={50} className={inputStyles} placeholder="Freelance UI Designer & Editor" />
              </div>
              <div className="space-y-1.5">
                <label className={labelStyles}>Bio</label>
                <textarea name="bio" defaultValue={user.bio} rows="3" maxLength={300} className={cn(inputStyles, "resize-none")} placeholder="Tell people a little bit about what you create..."></textarea>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelStyles}>Social Channels</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative flex items-center">
                  <Github className="absolute left-4 text-slate-400 dark:text-slate-600" size={16} />
                  <input name="github" defaultValue={user.social_links?.github} placeholder="GitHub account" className={cn(inputStyles, "pl-11")} />
                </div>
                <div className="relative flex items-center">
                  <Linkedin className="absolute left-4 text-slate-400 dark:text-slate-600" size={16} />
                  <input name="linkedin" defaultValue={user.social_links?.linkedin} placeholder="LinkedIn handle" className={cn(inputStyles, "pl-11")} />
                </div>
                <div className="relative flex items-center">
                  <Instagram className="absolute left-4 text-slate-400 dark:text-slate-600" size={16} />
                  <input name="instagram" defaultValue={user.social_links?.instagram} placeholder="Instagram handle" className={cn(inputStyles, "pl-11")} />
                </div>
                <div className="relative flex items-center">
                  <Globe className="absolute left-4 text-slate-400 dark:text-slate-600" size={16} />
                  <input name="website" defaultValue={user.social_links?.website} placeholder="Website URL" className={cn(inputStyles, "pl-11")} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900">
              <Button variant="ghost" type="button" className="text-slate-400 dark:text-slate-500 font-semibold text-xs py-2.5" onClick={() => setEditProfileModal(false)}>Cancel</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/10 dark:bg-indigo-500 dark:hover:bg-indigo-600">Save Changes</Button>
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