import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CreditCard, Lock } from 'lucide-react';

const PaymentModal = ({ onClose, onConfirm, paymentData }) => {
  if (!paymentData) return null;

  const { amount } = paymentData;
  const freelancerReceive = (parseFloat(amount) * 0.96).toFixed(2);

  return (
     <Modal title="Secure Escrow Payment" onClose={onClose}>
        <div className="space-y-6 pt-4">
           <div className="text-center">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-4 shadow-inner">
                 <CreditCard size={40}/>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Payable</p>
              <h2 className="text-5xl font-black text-gray-900 dark:text-white mt-2">₹{amount}</h2>
           </div>
           
           <div className="bg-gray-50 dark:bg-[#020617] p-5 rounded-2xl text-sm space-y-3 border border-gray-100 dark:border-white/5">
              <div className="flex justify-between text-gray-500"><span>Service Fee (Platform)</span><span>4%</span></div>
              <div className="flex justify-between text-gray-500"><span>Taxes</span><span>0%</span></div>
              <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base"><span>Freelancer Receives</span><span>₹{freelancerReceive}</span></div>
           </div>
           <Button onClick={onConfirm} className="w-full py-4 text-lg shadow-xl shadow-indigo-500/20">Confirm Transfer</Button>
           <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1"><Lock size={12}/> 256-bit SSL Secured</p>
        </div>
     </Modal>
  );
};

export default PaymentModal;