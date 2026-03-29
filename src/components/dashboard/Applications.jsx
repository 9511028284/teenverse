import React, { useState } from 'react';
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';    
import ReviewModal from '../modals/ReviewModal'; 
import ChatSystem from '../features/ChatSystem'; 
import { 
  Clock, CheckCircle, XCircle, Package, Lock, Unlock, 
  FileText, ExternalLink, RefreshCw, AlertTriangle, Star, ShieldCheck, 
  Receipt, Wallet, AlertOctagon, User, Banknote, Hourglass, Flag, MessageSquare
} from 'lucide-react';

const Applications = ({ user, applications, isClient, onAction, onViewTimeline, parentMode, showToast }) => {
  
  // --- STATES ---
  const [reviewApp, setReviewApp] = useState(null); 
  const [releaseModal, setReleaseModal] = useState(null); 
  const [rejectModal, setRejectModal] = useState(null);
  const [reportModal, setReportModal] = useState(null); 
  
  // NEW CHAT STATES
  const [chatApp, setChatApp] = useState(null);
  const [chatInitialMessage, setChatInitialMessage] = useState("");

  // --- HANDLERS ---
  const handleReviewSubmit = async (rating, tags) => {
     onAction('review', reviewApp, { rating, tags });
     setReviewApp(null);
  };

  const confirmRelease = () => {
    if (!releaseModal) return;
    onAction('pay', releaseModal); 
    setReleaseModal(null); 
  };

  const handleRejectConfirm = (e) => {
    e.preventDefault();
    const reason = e.target.reason.value;
    if(!reason) return;
    onAction('reject', rejectModal, { reason });
    setRejectModal(null);
  };

  const handleReportSubmit = async (e) => {
      e.preventDefault();
      if (!reportModal) return;

      const formData = new FormData(e.target);
      const reason = formData.get('reason');
      const description = formData.get('description');

      onAction('report', reportModal, { reason, description });
      setReportModal(null);
  };

  const handleOpenChat = (app, initialMsg = "") => {
      setChatInitialMessage(initialMsg);
      setChatApp(app);
  };

  const handleRequestRevision = (app) => {
      onAction('revision', app); 
      handleOpenChat(app, "Hi, I have reviewed the delivery and need some revisions. Please update the following:\n\n- ");
  };

  const getJobTitle = (app) => {
      if (app.title) return app.title; 
      if (app.job_title) return app.job_title;
      if (app.job?.title) return app.job.title; 
      if (app.jobs) {
          if (Array.isArray(app.jobs)) return app.jobs[0]?.title; 
          if (app.jobs.title) return app.jobs.title; 
      }
      return app.job_id ? `Project #${app.job_id.toString().slice(0,8)}` : 'Archived Project';
  };

  const renderActions = (app) => {
    
    // A. REJECTED STATE
    if (app.status === 'Rejected') {
        return <span className="text-red-500 text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Refunded/Rejected</span>;
    }

    // B. PROCESSING STATE
    if (app.status === 'Processing') {
        if (isClient) {
            return (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <Hourglass size={12} className="animate-pulse"/> Processing Payout
                </div>
            );
        } else {
            // If they HAVEN'T linked a bank, show the bouncing button
            if (!user?.is_bank_linked) {
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-green-600 font-bold">Payment Approved!</span>
                        <Button size="sm" onClick={() => onAction('withdraw_funds', app)} className="bg-green-600 hover:bg-green-700 text-white shadow-lg animate-bounce">
                            <Banknote size={14} className="mr-1"/> Link Bank to Receive
                        </Button>
                    </div>
                );
            }
            
            // If they HAVE linked a bank, hide the button and show this locked state
            return (
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <CheckCircle size={10} /> Bank Linked
                    </div>
                    <span className="text-amber-600 text-xs font-bold flex items-center gap-1 mt-1">
                        <Hourglass size={12}/> Payment in Queue
                    </span>
                    <span className="text-[10px] text-gray-400">Processing payout (24hrs)</span>
                </div>
            );
        }
    }

    // C. PAID / COMPLETED STATE
    if (app.status === 'Paid') {
        if (isClient) {
            if (!app.client_rating) {
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Order Complete</span>
                        <Button size="sm" onClick={() => setReviewApp(app)} className="bg-amber-400 hover:bg-amber-500 text-white flex items-center gap-1 text-[10px] py-1 h-7 shadow-sm">
                            <Star size={12} className="fill-white"/> Rate Freelancer
                        </Button>
                    </div>
                );
            } else {
                 return (
                    <div className="flex flex-col items-end">
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Completed</span>
                        <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <Star size={10} className="fill-amber-500"/> {app.client_rating}/5
                        </div>
                    </div>
                 );
            }
        } else {
            return <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Funds Deposited</span>;
        }
    }

    // D. CLIENT ACTIONS
    if (isClient) {
      if (app.status === 'Pending') {
        return (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => onAction('reject', app)} className="text-red-500 border-red-200 hover:bg-red-50">Reject</Button>
            <Button size="sm" onClick={() => onAction('initiate_payment', app)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 shadow-md shadow-indigo-200">
              <ShieldCheck size={14}/> Hire & Pay
            </Button>
          </div>
        );
      }

      if (app.status === 'Accepted') {
        return (
            <div className="flex flex-col items-end gap-1 animate-fade-in">
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <Lock size={10} /> Escrow Active
                </span>
                <div className="flex items-center gap-2 mt-1">
                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-blue-200 hover:bg-blue-50">
                        <MessageSquare size={14}/> Chat
                    </Button>
                    <button onClick={() => setRejectModal(app)} className="text-[10px] text-red-400 hover:text-red-500 underline transition-colors">
                        Cancel Order
                    </button>
                </div>
            </div>
        );
      }

      if (app.status === 'Submitted') {
        return (
          <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 text-xs mb-1 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                {app.work_link ? (
                  <a href={app.work_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                    <ExternalLink size={12}/> Link
                  </a>
                ) : <span className="text-gray-400 italic text-[10px]">No Link</span>}
                <span className="text-gray-300">|</span>
                {app.work_files && app.work_files.length > 0 ? (
                  <span className="flex items-center gap-1 text-indigo-500 cursor-pointer hover:underline" onClick={() => onAction('view_submission', app)}>
                    <FileText size={12}/> {app.work_files.length} File(s)
                  </span>
                ) : <span className="text-gray-400 italic text-[10px]">No Files</span>}
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-blue-200 hover:bg-blue-50" title="Open Chat">
                    <MessageSquare size={14}/> Chat
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRequestRevision(app)} className="text-amber-600 border-amber-200 hover:bg-amber-50" title="Request Revision">
                    <RefreshCw size={14}/> Revise
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectModal(app)} className="text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-1" title="Reject & Refund">
                    <XCircle size={14}/> Reject
                </Button>
                <Button size="sm" onClick={() => onAction('approve', app)} className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 shadow-md">Approve</Button>
              </div>
          </div>
        );
      }
      
      if (app.status === 'Completed') {
        return (
          <Button size="sm" onClick={() => parentMode ? null : setReleaseModal(app)} disabled={parentMode} className={`flex items-center gap-2 transition-all duration-300 ${parentMode ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300' : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'}`}>
            {parentMode ? <Lock size={14}/> : <Unlock size={14}/>} 
            {parentMode ? 'Locked: Ask Parent' : 'Release Payment'}
          </Button>
        );
      }
    }

    // E. FREELANCER ACTIONS
    if (!isClient) {
      if (app.status === 'Pending') return <span className="text-gray-400 text-xs italic">Waiting for client...</span>;
      
      if (app.status === 'Revision Requested') {
        return (
            <div className="flex flex-col items-end gap-2">
                <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1 animate-bounce">
                    <AlertTriangle size={10}/> REVISION REQUESTED
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-blue-200 hover:bg-blue-50">
                        <MessageSquare size={14}/> Chat
                    </Button>
                    <Button size="sm" onClick={() => onAction('submit', app)} className="bg-amber-500 hover:bg-amber-600 text-white shadow-md">
                        <RefreshCw size={14} className="mr-1"/> Resubmit
                    </Button>
                </div>
            </div>
        );
      }
      if (app.status === 'Accepted') return (
          <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-blue-200 hover:bg-blue-50">
                  <MessageSquare size={14}/> Chat
              </Button>
              <Button size="sm" onClick={() => onAction('submit', app)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200">
                  <Package size={14} className="mr-1"/> Deliver Work
              </Button>
          </div>
      );
      if (app.status === 'Submitted') return (
          <div className="flex flex-col items-end gap-2">
              <span className="text-amber-500 text-xs font-medium bg-amber-50 px-2 py-1 rounded-md">Under Review</span>
              <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-blue-200 hover:bg-blue-50">
                  <MessageSquare size={14}/> Chat
              </Button>
          </div>
      );
      if (app.status === 'Completed') return <span className="text-emerald-600 text-xs font-bold animate-pulse">Approved! Payment Processing...</span>;
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            {isClient ? 'Manage Orders' : 'My Gigs'}
            <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
            {applications.length}
            </span>
          </h2>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">{isClient ? 'Freelancer' : 'Client'}</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{getJobTitle(app)}</div>
                    <button onClick={() => onViewTimeline(app)} className="text-[10px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1 mt-1 font-medium transition-colors">
                      <Clock size={10}/> View Timeline
                    </button>
                  </td>
                  
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 text-white flex items-center justify-center text-xs font-bold">
                            {(isClient ? app.freelancer_name : app.client_name)?.[0] || 'U'}
                        </div>
                        <div>
                            <div className="font-bold text-sm">
                              {isClient ? app.freelancer_name : app.client_name || 'User'}
                            </div>
                            {isClient && (
                              <button 
                                onClick={() => onAction('view_profile', app)} 
                                className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 transition-colors"
                              >
                                <User size={10} /> View Profile
                              </button>
                            )}
                        </div>
                    </div>
                  </td>

                  <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">₹{app.bid_amount}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                      ${app.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        app.status === 'Rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                        app.status === 'Processing' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        app.status === 'Completed' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                        app.status === 'Submitted' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                        app.status === 'Revision Requested' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        app.status === 'Accepted' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                         {renderActions(app)}
                         {/* REPORT BUTTON */}
                         <button 
                             onClick={() => setReportModal(app)} 
                             className="text-[10px] text-gray-300 hover:text-red-500 flex items-center gap-1 transition-colors"
                             title="Report Issue"
                         >
                             <Flag size={10}/> Report Issue
                         </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 && <div className="p-10 text-center text-gray-400">No active applications found.</div>}
      </div>

       {/* --- MODALS SECTION --- */}

       {/* 1. Chat System Modal */}
       {chatApp && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl relative h-[90vh] md:h-[85vh]">
                <button 
                    onClick={() => setChatApp(null)}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full p-2"
                >
                    <XCircle size={24} />
                </button>
                <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
                    <ChatSystem 
                        user={user}
                        activeChat={{
                            id: isClient ? chatApp.freelancer_id : chatApp.client_id,
                            name: isClient ? chatApp.freelancer_name : chatApp.client_name,
                            application_id: chatApp.id,
                            status: chatApp.status // PASS STATUS TO TRIGGER LOCKS
                        }}
                        setActiveChat={() => setChatApp(null)}
                        initialMessage={chatInitialMessage}
                        onAction={onAction}
                    />
                </div>
            </div>
         </div>
       )}

       {/* 2. Release Modal */}
       {releaseModal && (
         <Modal title="Confirm Payment Release" onClose={() => setReleaseModal(null)}>
           <div className="space-y-6">
             <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                    <Receipt size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction Breakdown</h3>
                <p className="text-xs text-gray-500">Please review the final payout details.</p>
             </div>
             <div className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span>Total Escrow Amount</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{releaseModal.bid_amount}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-amber-600 dark:text-amber-500">
                    <span className="flex items-center gap-1"><ShieldCheck size={12}/> Platform Fee (5%)</span>
                    <span className="font-medium">- ₹{(releaseModal.bid_amount * 0.05).toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
                <div className="flex justify-between items-center text-base">
                    <span className="font-bold text-gray-900 dark:text-white">Freelancer Receives</span>
                    <span className="font-black text-green-600 dark:text-green-400 text-lg">
                        ₹{(releaseModal.bid_amount * 0.95).toFixed(2)}
                    </span>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button variant="outline" onClick={() => setReleaseModal(null)} className="w-full sm:flex-1">Cancel</Button>
                <Button onClick={confirmRelease} className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                    <Wallet size={16} /> Confirm & Pay
                </Button>
             </div>
           </div>
         </Modal>
       )}

       {/* 3. Reject Modal */}
       {rejectModal && (
        <Modal title="Reject & Refund" onClose={() => setRejectModal(null)}>
            <form onSubmit={handleRejectConfirm} className="space-y-4">
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-xs">
                    <h4 className="font-bold flex items-center gap-2 mb-1 text-sm">
                        <AlertOctagon size={16}/> {rejectModal.status === 'Accepted' ? 'Cancel Order?' : 'Reject Delivery?'}
                    </h4>
                    <p>{rejectModal.status === 'Accepted' ? "Cancelling now will refund the escrow amount to your wallet." : "Rejecting this work will cancel the order and initiate a refund."}</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason for {rejectModal.status === 'Accepted' ? 'Cancellation' : 'Rejection'}</label>
                    <textarea name="reason" required placeholder={rejectModal.status === 'Accepted' ? "e.g. Freelancer is unresponsive..." : "e.g. Work does not match requirements..."} className="w-full p-4 border border-gray-200 rounded-xl min-h-[100px] text-sm dark:bg-black dark:text-white resize-none focus:ring-2 focus:ring-red-500 outline-none"></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setRejectModal(null)} className="w-full sm:flex-1">Go Back</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 w-full sm:flex-1">{rejectModal.status === 'Accepted' ? 'Cancel Order' : 'Reject Work'}</Button>
                </div>
            </form>
        </Modal>
       )}
       
       {/* 4. Report Modal */}
       {reportModal && (
        <Modal title="Submit a Report" onClose={() => setReportModal(null)}>
            <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex gap-3">
                    <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full h-fit text-red-600 dark:text-red-200">
                       <Flag size={18} />
                    </div>
                    <div>
                       <h4 className="font-bold text-red-800 dark:text-red-200 text-sm">Trust & Safety</h4>
                       <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                         Reports are taken seriously. False reporting may lead to account restrictions.
                       </p>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
                    <select name="reason" required className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">Select a reason...</option>
                      <option value="Scam/Fraud">Scam or Fraudulent Activity</option>
                      <option value="Harassment">Harassment or Abusive Behavior</option>
                      <option value="Non-Payment">Payment Issue / Non-Payment</option>
                      <option value="Inappropriate">Inappropriate Content</option>
                      <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Details</label>
                    <textarea 
                      name="description" 
                      required 
                      placeholder="Please describe the issue..." 
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 resize-none"
                    ></textarea>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                     <Button variant="ghost" type="button" onClick={() => setReportModal(null)}>Cancel</Button>
                     <Button className="bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
                </div>
            </form>
        </Modal>
       )}

       {reviewApp && (
            <ReviewModal freelancerName={reviewApp.freelancer_name} onClose={() => setReviewApp(null)} onSubmit={handleReviewSubmit} />
        )}
    </div>
  );
};

export default Applications;