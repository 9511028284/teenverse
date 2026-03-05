import React from 'react';
import { CheckCircle, Clock, Package, DollarSign, FileText, XCircle } from 'lucide-react';
import { APP_STATUS } from '../../utils/status';

const OrderTimeline = ({ application }) => {
  if (!application) return null;

  // Define steps with their corresponding data
  const steps = [
    { id: APP_STATUS.PENDING, label: 'Proposal', icon: FileText, date: application.created_at },
    { id: APP_STATUS.ACCEPTED, label: 'Active', icon: Clock, date: application.started_at },
    { id: APP_STATUS.SUBMITTED, label: 'Delivered', icon: Package, date: application.submitted_at },
    { id: APP_STATUS.COMPLETED, label: 'Approved', icon: CheckCircle, date: application.completed_at },
    { id: APP_STATUS.PAID, label: 'Paid', icon: DollarSign, date: application.paid_at },
  ];

  // Map status to a numerical level for progress calculation
  const statusMap = { 
    [APP_STATUS.PENDING]: 0, 
    [APP_STATUS.ACCEPTED]: 1, 
    [APP_STATUS.SUBMITTED]: 2, 
    [APP_STATUS.COMPLETED]: 3, 
    [APP_STATUS.PAID]: 4 
  };

  const currentLevel = statusMap[application.status] ?? 0;
  const isRejected = application.status === APP_STATUS.REJECTED;

  // Calculate dynamic width for the progress bar (0% to 100%)
  const progressWidth = isRejected ? '0%' : `${(currentLevel / (steps.length - 1)) * 100}%`;

  const getStepStatus = (stepLevel) => {
    if (isRejected) return stepLevel === 0 ? 'rejected' : 'pending';
    if (currentLevel > stepLevel) return 'complete';
    if (currentLevel === stepLevel) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full py-10 px-4 overflow-x-auto custom-scrollbar">
      <div className="min-w-[650px] max-w-4xl mx-auto flex items-center justify-between relative px-6 mt-4 mb-12">
        
        {/* --- CONNECTION RAIL (Background Track) --- */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full shadow-inner" />
        
        {/* --- ANIMATED PROGRESS BAR (Foreground Track) --- */}
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
          style={{ width: progressWidth, opacity: isRejected ? 0 : 1 }}
        />

        {/* --- TIMELINE NODES --- */}
        {steps.map((step, index) => {
          const stepLevel = statusMap[step.id];
          const status = getStepStatus(stepLevel);
          
          // Default Styling (Pending)
          let nodeClasses = "bg-white dark:bg-[#0f172a] border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 scale-95";
          let iconWrapper = "opacity-50";
          let labelClasses = "text-gray-400 dark:text-gray-500";
          
          if (status === 'complete') {
              nodeClasses = "bg-gradient-to-br from-emerald-400 to-emerald-600 border-transparent text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-100";
              iconWrapper = "opacity-100";
              labelClasses = "text-emerald-600 dark:text-emerald-400 font-bold";
          } 
          else if (status === 'current') {
              nodeClasses = "bg-white dark:bg-gray-900 border-indigo-500 text-indigo-500 dark:text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-4 ring-indigo-500/20 scale-110";
              iconWrapper = "opacity-100 animate-pulse";
              labelClasses = "text-indigo-600 dark:text-indigo-400 font-black";
          } 
          else if (status === 'rejected') {
              nodeClasses = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105";
              iconWrapper = "opacity-100";
              labelClasses = "text-red-500 font-bold";
          }

          return (
            <div key={step.id} className="flex flex-col items-center relative group z-10">
              
              {/* Node Circle */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-700 ease-in-out ${nodeClasses}`}>
                <div className={iconWrapper}>
                  {status === 'rejected' ? <XCircle size={22} strokeWidth={2.5}/> : <step.icon size={20} strokeWidth={2.5} />}
                </div>
              </div>

              {/* Text Container (Positioned absolutely below the node) */}
              <div className="absolute top-16 w-32 flex flex-col items-center text-center">
                <p className={`text-[10px] uppercase tracking-[0.15em] transition-colors duration-500 ${labelClasses}`}>
                  {status === 'rejected' ? 'Rejected' : step.label}
                </p>
                
                {/* Date rendering with fade-in effect */}
                {step.date ? (
                  <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-1.5 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
                    {new Date(step.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                ) : (
                  <p className="text-[10px] font-mono text-gray-300 dark:text-gray-700 mt-1.5 italic">
                    Pending
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