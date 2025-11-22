import React, { useState } from 'react';
import { Check, ArrowLeft, CreditCard, ShieldCheck, Star, Zap } from 'lucide-react';
import { PRICING_PLANS } from '../utils/constants';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Pricing = ({ onBack, showToast }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      showToast(`Successfully subscribed to ${selectedPlan.name}!`, 'success');
      setSelectedPlan(null);
    }, 2000);
  };

  return (
    <div className="animate-fade-in p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Get Verified & Boost Trust</h1>
          <p className="text-gray-500 dark:text-gray-400">Choose a badge to stand out to clients.</p>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {PRICING_PLANS.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative bg-white dark:bg-gray-900 rounded-3xl border p-8 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl
              ${plan.recommended 
                ? 'border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-100 dark:shadow-none scale-105 z-10' 
                : 'border-gray-200 dark:border-gray-800'}`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                MOST POPULAR
              </div>
            )}

            <div className="mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4`}>
                {plan.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900 dark:text-white">₹{plan.price}</span>
                <span className="text-sm text-gray-500">/month</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setSelectedPlan(plan)}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all
                ${plan.recommended 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Confirmation Modal */}
      {selectedPlan && (
        <Modal title="Confirm Subscription" onClose={() => setSelectedPlan(null)}>
           <div className="text-center p-4">
              <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center mb-6 shadow-lg`}>
                {selectedPlan.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upgrade to {selectedPlan.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                You are about to pay <strong className="text-gray-900 dark:text-white">₹{selectedPlan.price}</strong>. 
                This will add the badge to your profile immediately.
              </p>
              
              <div className="flex gap-3">
                 <Button variant="outline" className="flex-1" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                 <Button variant="payment" className="flex-1" onClick={handlePurchase} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Pay via UPI"}
                 </Button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
};

export default Pricing;