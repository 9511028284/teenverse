import React from 'react';
import { CheckCircle, Circle, Clock, Package, DollarSign, FileText } from 'lucide-react';

const OrderTimeline = ({ application }) => {
  if (!application) return null;

  const steps = [
    { id: 'Pending', label: 'Proposal Sent', icon: FileText, date: application.created_at },
    { id: 'Accepted', label: 'Order Started', icon: Clock, date: application.started_at },
    { id: 'Submitted', label: 'Work Delivered', icon: Package, date: application.submitted_at },
    { id: 'Completed', label: 'Client Approved', icon: CheckCircle, date: application.completed_at },
    { id: 'Paid', label: 'Payment Released', icon: DollarSign, date: application.paid_at },
  ];

  // Helper to determine step state: 'complete', 'current', or 'pending'
  const getStepStatus = (stepId, index) => {
    const statusMap = { 'Pending': 0, 'Accepted': 1, 'Submitted': 2, 'Completed': 3, 'Paid': 4 };
    const currentLevel = statusMap[application.status] || 0;
    const stepLevel = statusMap[stepId];

    if (application.status === 'Rejected') return 'rejected';
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
          if (application.status === 'Rejected') colorClass = 'bg-red-500 text-white border-red-500';

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-[#020617] px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${colorClass}`}>
                <step.icon size={18} />
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