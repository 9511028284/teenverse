import React from 'react';
import { CheckCircle, Clock, Package, DollarSign, FileText, XCircle, ArrowRight } from 'lucide-react';
import { APP_STATUS } from '../../utils/status';

const OrderTimeline = ({ application }) => {
  if (!application) return null;

  const steps = [
    { id: APP_STATUS.PENDING, label: 'Proposal', icon: FileText, date: application.created_at },
    { id: APP_STATUS.ACCEPTED, label: 'Active', icon: Clock, date: application.started_at },
    { id: APP_STATUS.SUBMITTED, label: 'Delivered', icon: Package, date: application.submitted_at },
    { id: APP_STATUS.COMPLETED, label: 'Approved', icon: CheckCircle, date: application.completed_at },
    { id: APP_STATUS.PAID, label: 'Paid', icon: DollarSign, date: application.paid_at },
  ];

  // Helper to determine step state
  const getStepStatus = (stepId) => {
    const statusMap = { 
        [APP_STATUS.PENDING]: 0, 
        [APP_STATUS.ACCEPTED]: 1, 
        [APP_STATUS.SUBMITTED]: 2, 
        [APP_STATUS.COMPLETED]: 3, 
        [APP_STATUS.PAID]: 4 
    };
    const currentLevel = statusMap[application.status] || 0;
    const stepLevel = statusMap[stepId];

    if (application.status === APP_STATUS.REJECTED) {
        if (stepId === APP_STATUS.PENDING) return 'rejected';
        return 'pending';
    }

    if (currentLevel > stepLevel) return 'complete';
    if (currentLevel === stepLevel) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full py-8 px-2 overflow-x-auto">
      <div className="min-w-[600px] flex items-center justify-between relative">
        
        {/* Connection Rail (Background) */}
        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-800 -z-10 rounded-full" />
        
        {/* Animated Progress Bar (Foreground) */}
        {/* You would calculate width dynamically based on status index, simplified here for CSS */}
        <div className="absolute left-0 top-1/2 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 -z-10 rounded-full transition-all duration-1000" 
             style={{ width: application.status === 'Paid' ? '100%' : '50%', opacity: application.status === 'Rejected' ? 0 : 1 }}></div>

        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          
          let statusColor = "bg-[#0f172a] border-gray-700 text-gray-600"; // Pending
          let glow = "";
          
          if (status === 'complete') {
              statusColor = "bg-[#0f172a] border-emerald-500 text-emerald-400";
              glow = "shadow-[0_0_15px_rgba(16,185,129,0.3)]";
          }
          if (status === 'current') {
              statusColor = "bg-indigo-600 border-indigo-400 text-white";
              glow = "shadow-[0_0_20px_rgba(99,102,241,0.6)] ring-4 ring-indigo-500/20";
          }
          if (status === 'rejected') {
              statusColor = "bg-red-900/20 border-red-500 text-red-500";
              glow = "shadow-[0_0_15px_rgba(239,68,68,0.4)]";
          }

          return (
            <div key={step.id} className="flex flex-col items-center gap-3 relative group">
              
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${statusColor} ${glow}`}>
                {status === 'rejected' ? <XCircle size={20}/> : <step.icon size={20} />}
              </div>

              <div className="text-center absolute top-14 w-32">
                <p className={`text-[10px] uppercase font-bold tracking-widest ${status === 'current' ? 'text-indigo-400' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[9px] font-mono text-gray-600 mt-1">
                    {new Date(step.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;