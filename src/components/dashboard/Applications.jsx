import React from 'react';
import Button from '../ui/Button';
import { Eye, Clock, CheckCircle, XCircle, Package, DollarSign, Lock, Unlock } from 'lucide-react';

const Applications = ({ applications, isClient, onAction, onViewTimeline, parentMode }) => {
  
  // Helper to render the correct button based on Status & Role
  const renderActions = (app) => {
    // 1. REJECTED / PAID (End States)
    if (app.status === 'Rejected') return <span className="text-red-500 text-xs font-bold">Rejected</span>;
    if (app.status === 'Paid') return <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Completed</span>;

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
          <div className="flex gap-2 justify-end">
             <Button size="sm" onClick={() => onAction('view_submission', app)} variant="outline">View Work</Button>
             <Button size="sm" onClick={() => onAction('approve', app)} className="bg-emerald-500 hover:bg-emerald-600">Approve</Button>
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
    </div>
  );
};

export default Applications;