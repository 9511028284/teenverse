import React from 'react';
import { CheckCircle, Circle, Clock, Package, DollarSign, FileText, XCircle } from 'lucide-react';
import { APP_STATUS } from '../../utils/status';

const OrderTimeline = ({ application }) => {
  if (!application) return null;

  const steps = [
    { id: APP_STATUS.PENDING, label: 'Proposal Sent', icon: FileText, date: application.created_at },
    { id: APP_STATUS.ACCEPTED, label: 'Order Started', icon: Clock, date: application.started_at },
    { id: APP_STATUS.SUBMITTED, label: 'Work Delivered', icon: Package, date: application.submitted_at },
    { id: APP_STATUS.COMPLETED, label: 'Client Approved', icon: CheckCircle, date: application.completed_at },
    { id: APP_STATUS.PAID, label: 'Payment Released', icon: DollarSign, date: application.paid_at },
  ];

  // Helper to determine step state: 'complete', 'current', 'pending', or 'rejected'
  const getStepStatus = (stepId, index) => {
    const statusMap = { 
        [APP_STATUS.PENDING]: 0, 
        [APP_STATUS.ACCEPTED]: 1, 
        [APP_STATUS.SUBMITTED]: 2, 
        [APP_STATUS.COMPLETED]: 3, 
        [APP_STATUS.PAID]: 4 
    };

    const currentLevel = statusMap[application.status] || 0;
    const stepLevel = statusMap[stepId];

    // Special Case: Rejection
    // If the entire application is rejected, mark the first step as rejected to show failure.
    if (application.status === APP_STATUS.REJECTED) {
        if (stepId === APP_STATUS.PENDING) return 'rejected';
        return 'pending'; // Future steps are dead
    }

    if (currentLevel > stepLevel) return 'complete';
    if (currentLevel === stepLevel) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full relative">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full" />
        
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, index);
          let colorClass = 'bg-gray-200 text-gray-400 border-gray-200'; // Default Pending
  
          if (status === 'complete') colorClass = 'bg-emerald-500 text-white border-emerald-500';
          if (status === 'current') colorClass = 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900';
          if (status === 'rejected') colorClass = 'bg-red-500 text-white border-red-500';

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-[#020617] px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${colorClass}`}>
                {status === 'rejected' ? <XCircle size={18}/> : <step.icon size={18} />}
              </div>
              <div className="text-center">
                <p className={`text-[10px] uppercase font-bold ${status === 'current' ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] text-gray-400">
                    {new Date(step.date).toLocaleDateString()}
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