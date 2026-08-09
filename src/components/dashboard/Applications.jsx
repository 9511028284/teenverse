import React, { useState } from 'react';
import Button from '../ui/Button'; 
import Modal from '../ui/Modal';    
import ReviewModal from '../modals/ReviewModal'; 
import ChatSystem from '../features/ChatSystem'; 
import ConfirmationModal from '../ui/ConfirmationModal'; 
import { 
  Clock, CheckCircle, XCircle, Package, Lock, Unlock, 
  FileText, ExternalLink, RefreshCw, AlertTriangle, Star, ShieldCheck, 
  Receipt, Wallet, AlertOctagon, User, Banknote, Hourglass, Flag, MessageSquare
} from 'lucide-react';
import { formatCommissionRate, getCommissionRate, getEffectivePlanName } from '../../utils/subscription';

const getFreelancerPlanContext = (app = {}) => ({
  current_plan: app.freelancer_current_plan || app.freelancer_plan || app.current_plan || 'Basic',
  plan_expires_at: app.freelancer_plan_expires_at || app.freelancerPlanExpiresAt || app.plan_expires_at || null,
});

const Applications = ({ user, applications, isClient, onAction, onViewTimeline, parentMode }) => {
  
  // --- STATES ---
  const [reviewApp, setReviewApp] = useState(null); 
  const [releaseModal, setReleaseModal] = useState(null); 
  const [rejectModal, setRejectModal] = useState(null);
  const [reportModal, setReportModal] = useState(null); 

  // CONFIRMATION STATE
  const [confirmAction, setConfirmAction] = useState(null); // { type, app, customTitle, customDesc, customBtnText, extraContent }
  
  // CHAT STATES
  const [chatApp, setChatApp] = useState(null);
  const [chatInitialMessage, setChatInitialMessage] = useState("");

  // --- PREMIUM CHECKOUT STATES ---
  const [checkoutApp, setCheckoutApp] = useState(null); 
  const [useWallet, setUseWallet] = useState(false);
  const walletBalance = Number(user?.wallet_balance) || 0;
  const releaseAmount = Number(releaseModal?.bid_amount) || 0;
  const releasePlanName = releaseModal ? getEffectivePlanName(getFreelancerPlanContext(releaseModal)) : 'Basic';
  const releaseCommissionRate = getCommissionRate(releasePlanName);
  const releaseCommissionLabel = formatCommissionRate(releaseCommissionRate);
  const releasePlatformFee = releaseAmount * releaseCommissionRate;
  const releasePayout = Math.max(0, releaseAmount - releasePlatformFee);

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

  // CONFIRMATION HANDLER — executes the action after user confirms
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, app } = confirmAction;
    
    switch (type) {
      case 'approve':
        onAction('approve', app);
        break;
      case 'release':
        setReleaseModal(app);
        break;
      case 'hire':
        setCheckoutApp(app);
        break;
      case 'cancel':
        setRejectModal(app);
        break;
      case 'revision':
        handleRequestRevision(app);
        break;
      default:
        break;
    }
    setConfirmAction(null);
  };

  // Trigger confirmation modal
  const requestConfirm = (type, app, customTitle, customDesc, customBtnText, extraContent) => {
    setConfirmAction({ type, app, customTitle, customDesc, customBtnText, extraContent });
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
        return <span className="text-red-500 dark:text-red-400 text-xs font-black tracking-tight flex items-center gap-1.5"><XCircle size={14} strokeWidth={2.5}/> Refunded/Rejected</span>;
    }

    // B. PROCESSING STATE
    if (app.status === 'Processing') {
        if (isClient) {
            return (
                <div className="flex items-center gap-1.5 text-xs font-black tracking-tight text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/10 px-3 py-1.5 rounded-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                    <Hourglass size={13} className="animate-pulse"/> Processing Payout
                </div>
            );
        } else {
            if (!user?.is_bank_linked) {
                return (
                    <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs text-green-600 dark:text-green-400 font-black tracking-tight">Payment Approved!</span>
                        <Button size="sm" onClick={() => onAction('withdraw_funds', app)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_6px_16px_rgba(16,185,129,0.25)] font-black text-[11px] uppercase tracking-wider rounded-xl animate-bounce">
                            <Banknote size={14} className="mr-1"/> Link Bank to Receive
                        </Button>
                    </div>
                );
            }
            
            return (
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                        <CheckCircle size={10} strokeWidth={2.5} /> Bank Linked
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-black tracking-tight flex items-center gap-1 mt-1">
                        <Hourglass size={13} className="animate-pulse" /> Payment in Queue
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Processing payout (24hrs)</span>
                </div>
            );
        }
    }

    // C. PAID / COMPLETED STATE
    if (app.status === 'Paid') {
        if (isClient) {
            if (!app.client_rating) {
                return (
                    <div className="flex flex-col items-end gap-1.5">
                        <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black tracking-tight flex items-center gap-1.5"><CheckCircle size={14} strokeWidth={2.5}/> Order Complete</span>
                        <Button size="sm" onClick={() => setReviewApp(app)} className="bg-amber-400 hover:bg-amber-500 text-white flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-1.5 h-8 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_12px_rgba(245,158,11,0.2)]">
                            <Star size={12} className="fill-white"/> Rate Freelancer
                        </Button>
                    </div>
                );
            } else {
                 return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black tracking-tight flex items-center gap-1.5"><CheckCircle size={14} strokeWidth={2.5}/> Completed</span>
                        <div className="text-[10px] font-black text-amber-500 flex items-center gap-1 bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-lg shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                            <Star size={10} className="fill-amber-500 dark:fill-amber-400"/> {app.client_rating}/5
                        </div>
                    </div>
                 );
            }
        } else {
            return <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black tracking-tight flex items-center gap-1.5"><CheckCircle size={14} strokeWidth={2.5}/> Funds Deposited</span>;
        }
    }

    // D. CLIENT ACTIONS
    if (isClient) {
      if (app.status === 'Pending') {
        return (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => onAction('reject', app)} className="text-red-500 border-slate-200 hover:bg-red-50 dark:border-white/10 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl font-bold text-xs">Reject</Button>
            <Button size="sm" onClick={() => setCheckoutApp(app)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_6px_16px_rgba(79,70,229,0.25)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
              <ShieldCheck size={14} strokeWidth={2.5}/> Hire & Pay
            </Button>
          </div>
        );
      }

      if (app.status === 'Accepted') {
        return (
            <div className="flex flex-col items-end gap-1.5 animate-fade-in">
                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                    <Lock size={10} strokeWidth={2.5} /> Escrow Active
                </span>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-slate-200 hover:bg-blue-50/50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-blue-950/10 rounded-xl font-bold text-xs">
                        <MessageSquare size={14}/> Chat
                    </Button>
                    <button onClick={() => setRejectModal(app)} className="text-[10px] font-bold text-slate-400 hover:text-red-500 dark:text-slate-500 transition-colors underline underline-offset-2">
                        Cancel Order
                    </button>
                </div>
            </div>
        );
      }

      if (app.status === 'Submitted') {
        return (
          <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 border border-slate-200/60 dark:bg-slate-950 dark:border-white/[0.05] p-2 rounded-xl shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.01)]">
                {app.work_link ? (
                  <a href={app.work_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                    <ExternalLink size={12} strokeWidth={2.5}/> Link
                  </a>
                ) : <span className="text-slate-400 italic text-[10px]">No Link</span>}
                <span className="text-slate-200 dark:text-white/10">|</span>
                {app.work_files && app.work_files.length > 0 ? (
                  <span className="flex items-center gap-1 text-indigo-500 cursor-pointer hover:text-indigo-600 dark:text-indigo-400" onClick={() => onAction('view_submission', app)}>
                    <FileText size={12}/> {app.work_files.length} File(s)
                  </span>
                ) : <span className="text-slate-400 italic text-[10px]">No Files</span>}
              </div>

              <div className="flex gap-1.5 justify-end flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-slate-800 rounded-xl font-bold text-xs" title="Open Chat">
                    <MessageSquare size={14}/>
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRequestRevision(app)} className="text-amber-600 border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:text-amber-400 dark:hover:bg-slate-800 rounded-xl font-bold text-xs" title="Request Revision">
                    <RefreshCw size={14}/>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectModal(app)} className="text-red-500 border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:text-red-400 dark:hover:bg-slate-800 flex items-center gap-1 rounded-xl font-bold text-xs" title="Reject & Refund">
                    Reject
                </Button>
                <Button size="sm" onClick={() => onAction('approve', app)} className="bg-emerald-500 hover:bg-emerald-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_6px_16px_rgba(16,185,129,0.2)] text-white font-black text-xs uppercase tracking-wider rounded-xl">Approve</Button>
              </div>
          </div>
        );
      }
      
      if (app.status === 'Completed') {
        return (
          <Button size="sm" onClick={() => parentMode ? null : setReleaseModal(app)} disabled={parentMode} className={`flex items-center gap-2 font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all duration-300 ${parentMode ? 'bg-slate-200 border border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_20px_rgba(16,185,129,0.25)]'}`}>
            {parentMode ? <Lock size={14} strokeWidth={2.5}/> : <Unlock size={14} strokeWidth={2.5}/>} 
            {parentMode ? 'Locked: Ask Parent' : 'Release Payment'}
          </Button>
        );
      }
    }

    // E. FREELANCER ACTIONS
    if (!isClient) {
      if (app.status === 'Pending') return <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">Waiting for client...</span>;
      
      if (app.status === 'Revision Requested') {
        return (
            <div className="flex flex-col items-end gap-2">
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-black tracking-wider flex items-center gap-1 animate-bounce bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-2.5 py-1 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                    <AlertTriangle size={12} strokeWidth={2.5}/> REVISION REQUESTED
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-slate-800 rounded-xl font-bold text-xs">
                        <MessageSquare size={14}/> Chat
                    </Button>
                    <Button size="sm" onClick={() => onAction('submit', app)} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_6px_16px_rgba(245,158,11,0.25)]">
                        <RefreshCw size={14} className="mr-1"/> Resubmit
                    </Button>
                </div>
            </div>
        );
      }
      if (app.status === 'Accepted') return (
          <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-slate-800 rounded-xl font-bold text-xs">
                  <MessageSquare size={14}/> Chat
              </Button>
              <Button size="sm" onClick={() => onAction('submit', app)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_6px_16px_rgba(79,70,229,0.25)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  <Package size={14} className="mr-1"/> Deliver Work
              </Button>
          </div>
      );
      if (app.status === 'Submitted') return (
          <div className="flex flex-col items-end gap-2">
              <span className="text-amber-600 dark:text-amber-400 text-xs font-black bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 px-3 py-1 rounded-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">Under Review</span>
              <Button size="sm" variant="outline" onClick={() => handleOpenChat(app)} className="text-blue-500 border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-slate-800 rounded-xl font-bold text-xs">
                  <MessageSquare size={14}/> Chat
              </Button>
          </div>
      );
      if (app.status === 'Completed') return <span className="text-emerald-500 dark:text-emerald-400 text-xs font-black tracking-tight animate-pulse">Approved! Payout Processing...</span>;
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-black dark:text-white flex items-center gap-2.5 tracking-tight">
            {isClient ? 'Manage Orders' : 'My Gigs'}
            <span className="text-xs font-black text-slate-500 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/[0.04] px-3 py-1 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] dark:shadow-none">
              {applications.length}
            </span>
          </h2>
      </div>

      {/* Main Table Plate Container — Soft Clay Glass */}
      <div className="bg-white/95 border border-slate-200/60 dark:bg-slate-900/40 dark:border-white/[0.05] dark:backdrop-blur-xl rounded-[28px] overflow-hidden shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_20px_rgba(99,102,241,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100 dark:bg-slate-950/40 dark:border-white/[0.04] text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              <tr>
                <th className="p-4 pl-6">Project</th>
                <th className="p-4">{isClient ? 'Freelancer' : 'Client'}</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03] text-sm font-bold">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors duration-200 group">
                  <td className="p-4 pl-6 align-middle">
                    <div className="font-black text-slate-900 dark:text-white text-[15px] tracking-tight line-clamp-1">{getJobTitle(app)}</div>
                    <button onClick={() => onViewTimeline(app)} className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 mt-1.5 font-bold transition-colors">
                      <Clock size={11} strokeWidth={2.5}/> View Timeline
                    </button>
                  </td>
                  
                  <td className="p-4 align-middle text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2.5">
                        {/* Avatar ring profile */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 text-white flex items-center justify-center text-xs font-black shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.4),_0_2px_6px_rgba(99,102,241,0.15)] select-none">
                            {(isClient ? app.freelancer_name : app.client_name)?.[0] || 'U'}
                        </div>
                        <div>
                            <div className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                              {isClient ? app.freelancer_name : app.client_name || 'User'}
                            </div>
                            {isClient && (
                              <button 
                                onClick={() => onAction('view_profile', app)} 
                                className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1 mt-0.5 transition-colors"
                              >
                                <User size={10} strokeWidth={2.5} /> View Profile
                              </button>
                            )}
                        </div>
                    </div>
                  </td>

                  <td className="p-4 align-middle font-mono font-black text-slate-900 dark:text-white text-base">₹{app.bid_amount}</td>
                  <td className="p-4 align-middle">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none
                      ${app.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                        app.status === 'Rejected' ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                        app.status === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                        app.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                        app.status === 'Submitted' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                        app.status === 'Revision Requested' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                        app.status === 'Accepted' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' :
                        'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/5'
                      }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right align-middle">
                    <div className="flex flex-col items-end gap-1.5">
                         {renderActions(app)}
                         <button 
                             onClick={() => setReportModal(app)} 
                             className="text-[10px] font-bold text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors mt-0.5"
                             title="Report Issue"
                         >
                             <Flag size={11} strokeWidth={2.5}/> Report Issue
                         </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 && <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-bold text-sm">No active applications found.</div>}
      </div>

       {/* --- MODALS SECTION --- */}

       {/* 1. Chat System Overlayer Overlay */}
       {chatApp && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl relative h-[90vh] md:h-[85vh]">
                <button 
                    onClick={() => setChatApp(null)}
                    className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors bg-white/10 dark:bg-slate-900/80 rounded-full p-2 border border-white/10 shadow-sm"
                >
                    <XCircle size={22} strokeWidth={2.5} />
                </button>
                <div className="w-full h-full rounded-[28px] overflow-hidden bg-white dark:bg-slate-950 shadow-2xl border border-slate-200/60 dark:border-white/[0.06]">
                    <ChatSystem 
                        user={user}
                        activeChat={{
                            id: isClient ? chatApp.freelancer_id : chatApp.client_id,
                            name: isClient ? chatApp.freelancer_name : chatApp.client_name,
                            application_id: chatApp.id,
                            status: chatApp.status
                        }}
                        setActiveChat={() => setChatApp(null)}
                        initialMessage={chatInitialMessage}
                        onAction={onAction}
                    />
                </div>
            </div>
         </div>
       )}

       {/* 2. Premium Checkout Modal */}
       {checkoutApp && (() => {
         const totalAmount = Number(checkoutApp.bid_amount) || 0;
         const applicableWallet = Math.min(walletBalance, totalAmount);
         const walletDeduction = useWallet ? applicableWallet : 0;
         const finalPayable = Math.max(0, totalAmount - walletDeduction);

         const handleConfirmCheckout = () => {
           onAction('accept', checkoutApp, { finalPayable, walletDeduction });
           setCheckoutApp(null);
           setUseWallet(false);
         };

         return (
           <Modal title="Secure Escrow Checkout" onClose={() => { setCheckoutApp(null); setUseWallet(false); }}>
             <div className="space-y-5">
               <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/[0.05] dark:bg-slate-950 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.01)]">
                 <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Order Summary</h4>
                 <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                   <span>Gig Total</span>
                   <span className="font-black text-slate-900 dark:text-white">₹{totalAmount.toFixed(2)}</span>
                 </div>
                 
                 {/* Wallet Section with Clay highlights */}
                 <div className="flex items-center justify-between p-3.5 mt-4 bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-500/20 rounded-xl shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6)] dark:shadow-none">
                   <div className="flex items-center gap-2.5">
                     <Wallet size={18} className="text-indigo-600 dark:text-indigo-400" />
                     <div className="leading-none">
                       <p className="text-xs font-black text-indigo-950 dark:text-indigo-300">Wallet Deduction</p>
                       <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mt-1">Available balance: ₹{walletBalance.toFixed(2)}</p>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer select-none">
                     <input 
                       type="checkbox" 
                       className="sr-only peer" 
                       checked={useWallet} 
                       onChange={() => setUseWallet(!useWallet)}
                       disabled={walletBalance <= 0}
                     />
                     <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"></div>
                   </label>
                 </div>

                 {useWallet && walletDeduction > 0 && (
                   <div className="flex justify-between text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-4">
                     <span>Wallet Applied</span>
                     <span>- ₹{walletDeduction.toFixed(2)}</span>
                   </div>
                 )}

                 <div className="h-px bg-slate-200 dark:bg-white/[0.06] my-4" />
                 
                 <div className="flex justify-between items-center text-sm font-bold">
                   <span className="text-slate-900 dark:text-white">Final Payable Amount</span>
                   <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                     ₹{finalPayable.toFixed(2)}
                   </span>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
                 <Button variant="ghost" type="button" onClick={() => { setCheckoutApp(null); setUseWallet(false); }} className="w-full sm:w-auto font-bold text-xs uppercase tracking-wider rounded-xl">Cancel</Button>
                 <Button onClick={handleConfirmCheckout} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_20px_rgba(79,70,229,0.25)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
                   {finalPayable === 0 ? 'Pay with Wallet' : `Proceed to Pay ₹${finalPayable.toFixed(2)}`}
                 </Button>
               </div>
             </div>
           </Modal>
         );
       })()}

       {/* 3. Release Payment Breakdown Modal */}
       {releaseModal && (
         <Modal title="Confirm Payment Release" onClose={() => setReleaseModal(null)}>
           <div className="space-y-5">
             <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.6)]">
                    <Receipt size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight pt-1">Transaction Breakdown</h3>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Please review final escrow distribution percentages.</p>
             </div>
             
             <div className="bg-slate-50 border border-slate-200 border-dashed p-4 rounded-2xl dark:bg-slate-950 dark:border-white/[0.06] space-y-3 font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                    <span>Total Escrow Balance</span>
                    <span className="font-black text-slate-900 dark:text-white">₹{releaseAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-indigo-600 dark:text-indigo-400">
                    <span>Freelancer Plan</span>
                    <span className="font-black">{releasePlanName}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={12} strokeWidth={2.5}/> Platform Brokerage ({releaseCommissionLabel})</span>
                    <span className="font-black">- ₹{releasePlatformFee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-white/[0.05] my-2" />
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-900 dark:text-white">Freelancer Payout Net</span>
                    <span className="font-black text-emerald-500 dark:text-emerald-400 text-base tracking-tight">
                        ₹{releasePayout.toFixed(2)}
                    </span>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Button variant="outline" onClick={() => setReleaseModal(null)} className="w-full sm:flex-1 font-bold text-xs uppercase tracking-wider rounded-xl">Cancel</Button>
                <Button onClick={confirmRelease} className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5">
                    <Wallet size={14} /> Confirm & Release
                </Button>
             </div>
           </div>
         </Modal>
       )}

       {/* 4. Reject & Cancel Order Modal */}
       {rejectModal && (
        <Modal title="Reject & Refund" onClose={() => setRejectModal(null)}>
            <form onSubmit={handleRejectConfirm} className="space-y-4">
                <div className="bg-red-50 border border-red-100/70 p-4 rounded-2xl text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6)] dark:shadow-none">
                    <h4 className="font-black flex items-center gap-2 mb-1 text-xs uppercase tracking-wider">
                        <AlertOctagon size={16} strokeWidth={2.5}/> {rejectModal.status === 'Accepted' ? 'Cancel Order Transaction?' : 'Reject Delivered Assignment?'}
                    </h4>
                    <p className="text-xs font-medium leading-relaxed">{rejectModal.status === 'Accepted' ? "Cancelling now returns active escrow protection balances straight back to your wallet." : "Rejecting this milestone submission flags the gig card order parameters and requests balance returns."}</p>
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reason for {rejectModal.status === 'Accepted' ? 'Cancellation' : 'Rejection'}</label>
                    <textarea name="reason" required placeholder={rejectModal.status === 'Accepted' ? "e.g. Freelancer is unresponsive..." : "e.g. Work does not match layout requirements..."} className="w-full p-4 border border-slate-200 rounded-xl min-h-[110px] text-sm font-bold bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-white/[0.05] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] resize-none outline-none focus:ring-2 focus:ring-red-500"></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setRejectModal(null)} className="w-full sm:flex-1 font-bold text-xs uppercase tracking-wider rounded-xl">Go Back</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(220,38,38,0.2)] w-full sm:flex-1">{rejectModal.status === 'Accepted' ? 'Cancel Order' : 'Reject Work'}</Button>
                </div>
            </form>
        </Modal>
       )}
       
       {/* 5. Report Incident Modal */}
       {reportModal && (
        <Modal title="Submit a Report" onClose={() => setReportModal(null)}>
            <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="bg-red-50 border border-red-100/70 p-4 rounded-2xl flex gap-3 dark:bg-red-950/20 dark:border-red-900/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6)] dark:shadow-none">
                    <div className="bg-red-500 text-white p-2 rounded-xl h-fit shadow-sm">
                       <Flag size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                       <h4 className="font-black text-red-900 dark:text-red-300 text-xs uppercase tracking-wider">Trust & Safety Escalation</h4>
                       <p className="text-xs font-medium text-red-700 dark:text-red-400/80 mt-1 leading-relaxed">
                         Platform flags are automatically evaluated. Intentional false filing updates profile visibility indexes under administrative restriction criteria boundaries.
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
                      placeholder="Please clarify context and list system reference values comprehensively here..." 
                      className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[110px] text-sm font-bold bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-white/[0.05] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] resize-none"
                    ></textarea>
                </div>
                
                <div className="flex justify-end gap-2.5 pt-2">
                     <Button variant="ghost" type="button" onClick={() => setReportModal(null)} className="font-bold text-xs uppercase tracking-wider rounded-xl">Cancel</Button>
                     <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_8px_16px_rgba(220,38,38,0.2)]">Submit Report</Button>
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
