import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { 
  Eye, Clock, CheckCircle, XCircle, Package, DollarSign, Lock, Unlock, 
  FileText, ExternalLink, RefreshCw, AlertTriangle, Star 
} from 'lucide-react';
import * as api from '../../services/dashboard.api'; 
import ReviewModal from '../modals/ReviewModal'; // [Feature 4] Review Modal

const Applications = ({ applications, isClient, onAction, onViewTimeline, parentMode, showToast }) => {
  
  const [revisionModal, setRevisionModal] = useState(null); // [Feature 1] Revision Modal
  const [reviewApp, setReviewApp] = useState(null); // [Feature 4] Review Modal State

  // --- REVISION HANDLER ---
  const handleSendRevision = async (e) => {
    e.preventDefault();
    const message = e.target.revision_msg.value;
    if (!message) return;

    const { error } = await api.requestRevision(revisionModal.id, message, revisionModal.freelancer_id);
    
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Revision Sent Successfully', 'success');
      setRevisionModal(null);
      // In a real app, you might trigger a refresh here
    }
  };

  // --- REVIEW HANDLER ---
  const handleReviewSubmit = async (rating, tags) => {
    const { error } = await api.submitReview(reviewApp.id, rating, tags, reviewApp.freelancer_id);
    if (error) {
        showToast(error.message, 'error');
    } else {
        showToast("Review Submitted! 🌟", 'success');
        setReviewApp(null);
    }
  };

  const renderActions = (app) => {
    // 1. REJECTED / PAID (End States)
    if (app.status === 'Rejected') return <span className="text-red-500 text-xs font-bold">Rejected</span>;
    if (app.status === 'Paid') {
        // [Feature 4] Show Rate Button or Rating
        if (isClient && !app.client_rating) {
            return (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Completed</span>
                    <Button size="sm" onClick={() => setReviewApp(app)} className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1 text-[10px] py-1 h-7">
                        <Star size={12}/> Rate Work
                    </Button>
                </div>
            );
        } else if (app.client_rating) {
             return (
                <div className="flex flex-col items-end">
                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Completed</span>
                    <div className="text-[10px] font-bold text-yellow-500 flex items-center gap-1 mt-1"><Star size={10} className="fill-yellow-500"/> {app.client_rating}/5</div>
                </div>
             );
        }
        return <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Completed</span>;
    }

    // 2. CLIENT ACTIONS
    if (isClient) {
      if (app.status === 'Pending') {
        return (
          <div className="flex gap-2 justify-end">
             {/* UPDATED: Indicates Payment Required to Start */}
            <Button size="sm" onClick={() => onAction('accept', app)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
              <DollarSign size={14}/> Hire & Pay
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction('reject', app)} className="text-red-500 border-red-200">Reject</Button>
          </div>
        );
      }

      if (app.status === 'Accepted') {
        return (
            // UPDATED: Visual Indicator for Escrow
            <div className="flex flex-col items-end">
                <span className="text-xs text-indigo-500 font-medium animate-pulse">Waiting for work...</span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                    <Lock size={10} /> Funds in Escrow
                </span>
            </div>
        );
      }

      if (app.status === 'Submitted') {
        return (
          <div className="flex flex-col items-end gap-2">
             {/* Direct access to submitted work */}
             <div className="flex items-center gap-3 text-xs mb-1">
                {app.submission_link && (
                  <a href={app.submission_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline hover:text-blue-600 transition-colors">
                    <ExternalLink size={12}/> Link
                  </a>
                )}
                {app.submission_file && (
                  <a href={app.submission_file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-500 hover:underline hover:text-indigo-600 transition-colors">
                    <FileText size={12}/> File
                  </a>
                )}
             </div>

             <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={() => onAction('view_submission', app)} variant="outline">Details</Button>
                
                {/* [Feature 1] Revision Button */}
                <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setRevisionModal(app)} 
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                    <RefreshCw size={14} className="mr-1"/> Revision
                </Button>

                <Button size="sm" onClick={() => onAction('approve', app)} className="bg-emerald-500 hover:bg-emerald-600">Approve</Button>
             </div>
          </div>
        );
      }
      
      if (app.status === 'Completed') {
        return (
          // UPDATED: Release Escrow Action
          <Button 
            size="sm" 
            onClick={() => onAction('pay', app)} 
            disabled={parentMode} // PARENT MODE LOCK
            className={`flex items-center gap-1 ${parentMode ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            <Unlock size={14}/> {parentMode ? 'Locked' : 'Release Escrow'}
          </Button>
        );
      }
    }

    // 3. FREELANCER ACTIONS
    if (!isClient) {
      if (app.status === 'Pending') return <span className="text-gray-400 text-xs">Proposal Sent</span>;
      
      // [Feature 1] Revision State for Freelancer
      if (app.status === 'Revision Requested') {
        return (
            <div className="flex flex-col items-end">
                <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle size={10}/> ACTION REQUIRED
                </div>
                <Button size="sm" onClick={() => onAction('submit', app)} className="bg-amber-500 hover:bg-amber-600 text-white shadow-md">
                    <RefreshCw size={14} className="mr-1"/> Resubmit Work
                </Button>
            </div>
        );
      }

      if (app.status === 'Accepted') return <Button size="sm" onClick={() => onAction('submit', app)} className="bg-indigo-600"><Package size={14} className="mr-1"/> Submit Work</Button>;
      if (app.status === 'Submitted') return <span className="text-amber-500 text-xs font-medium">Under Review</span>;
      if (app.status === 'Completed') return <span className="text-emerald-600 text-xs font-bold">Approved! Payment Pending</span>;
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
        {isClient ? 'Manage Orders' : 'My Jobs'}
        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {applications.length} Records
        </span>
      </h2>

      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-4">Project</th>
                <th className="p-4">{isClient ? 'Freelancer' : 'Client'}</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold dark:text-white line-clamp-1">{app.jobs?.title || 'Unknown Job'}</div>
                    <button onClick={() => onViewTimeline(app)} className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 mt-1">
                      <Clock size={10}/> View Timeline
                    </button>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                    {isClient ? app.freelancer_name : app.client_name || 'Client'}
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">₹{app.bid_amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                      ${app.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                        app.status === 'Rejected' ? 'bg-red-50 text-red-500' :
                        app.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                        app.status === 'Revision Requested' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {renderActions(app)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 && <div className="p-10 text-center text-gray-400">No active applications found.</div>}
      </div>

       {/* --- [Feature 1] REVISION MODAL --- */}
       {revisionModal && (
        <Modal title="Request Revisions" onClose={() => setRevisionModal(null)}>
            <form onSubmit={handleSendRevision} className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm">
                    <h4 className="font-bold flex items-center gap-2 mb-1"><AlertTriangle size={16}/> Keep it constructive!</h4>
                    <p>Clearly explain what needs to be fixed. The freelancer will be notified to resubmit.</p>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Revision Instructions</label>
                    <textarea 
                        name="revision_msg" 
                        required
                        placeholder="e.g., The logo color is too dark, please make it lighter..."
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none min-h-[120px] dark:bg-black dark:text-white dark:border-gray-700"
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" type="button" onClick={() => setRevisionModal(null)}>Cancel</Button>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">Send Request</Button>
                </div>
            </form>
        </Modal>
       )}

       {/* --- [Feature 4] REVIEW MODAL --- */}
       {reviewApp && (
            <ReviewModal 
                freelancerName={reviewApp.freelancer_name}
                onClose={() => setReviewApp(null)}
                onSubmit={handleReviewSubmit}
            />
        )}

    </div>
  );
};

export default Applications;