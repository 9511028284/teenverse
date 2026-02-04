import React, { useState } from 'react';
import { UploadCloud, Shield, CheckCircle, Lock } from 'lucide-react';
import Modal from '../ui/Modal'; 
import Button from '../ui/Button'; 

const KycVerificationModal = ({ mode, user, kycFile, setKycFile, actions, onClose }) => {
  const { handleIdentitySubmit, handleBankSubmit } = actions;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auto-detect Age
  const isMinor = (user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : (user.age || 20)) < 18;
  const ageGroup = isMinor ? 'minor' : 'adult';

  // Forms
  const [panNumber, setPanNumber] = useState('');
  const [bankForm, setBankForm] = useState({
    account_number: '', ifsc_code: '', bank_name: '', account_holder_name: '',
    guardian_name: '', guardian_relationship: 'Parent', consent: false
  });

  // --- IDENTITY SUBMIT ---
  const onIdentitySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleIdentitySubmit({ ageGroup, panNumber, kycFile });
    setIsSubmitting(false);
  };

  // --- BANK SUBMIT ---
  const onBankSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await handleBankSubmit(bankForm, ageGroup);
    setIsSubmitting(false);
  };

  // ==========================================
  // VIEW 1: IDENTITY VERIFICATION (Before Apply)
  // ==========================================
  if (mode === 'identity') {
    return (
      <Modal title="Identity Verification" onClose={onClose}>
        <div className="space-y-4">
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <Shield className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800">
                 You must verify your identity before {user.type === 'client' ? 'posting jobs' : 'applying'}. 
                 Takes 30 seconds.
              </p>
           </div>
           
           <form onSubmit={onIdentitySubmit} className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Number</label>
                  <input required value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} className="w-full p-3 rounded-xl border font-mono uppercase" placeholder="ABCDE1234F" maxLength={10} />
               </div>
               
               <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer relative">
                   <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setKycFile(e.target.files[0])} />
                   <UploadCloud className="mx-auto text-gray-400 mb-2" />
                   <p className="text-sm font-bold text-gray-500">{kycFile ? kycFile.name : "Upload ID Proof"}</p>
               </div>

               <Button type="submit" disabled={isSubmitting} className="w-full py-3">
                   {isSubmitting ? "Verifying..." : "Verify & Continue"}
               </Button>
           </form>
        </div>
      </Modal>
    );
  }

  // ==========================================
  // VIEW 2: BANKING LINKAGE (Before Payout)
  // ==========================================
  if (mode === 'banking') {
    return (
      <Modal title="Link Bank Account" onClose={onClose}>
        <div className="space-y-4">
           <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
              <CheckCircle className="text-green-600 shrink-0" />
              <p className="text-xs text-green-800">
                 <strong>Great work!</strong> Funds are waiting. Link your bank account to receive the payout securely.
              </p>
           </div>

           <form onSubmit={onBankSubmit} className="space-y-4 bg-gray-50 p-4 rounded-xl">
               <input required placeholder="IFSC Code" value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value.toUpperCase()})} className="w-full p-3 rounded-xl border bg-white" />
               <input required placeholder="Account Number" type="password" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               <input required placeholder="Holder Name" value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               
               {/* Minor Specific Fields */}
               {isMinor && (
                   <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-100">
                       <p className="font-bold mb-2">Guardian Details (Required for Minors)</p>
                       <input required placeholder="Guardian Name" className="w-full p-2 mb-2 rounded border" onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} />
                   </div>
               )}

               <Button type="submit" disabled={isSubmitting} className="w-full py-3 bg-green-600 hover:bg-green-700">
                   {isSubmitting ? "Linking..." : "Link Bank & Withdraw"}
               </Button>
               
               <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                   <Lock size={10} /> Bank details are encrypted via Cashfree.
               </div>
           </form>
        </div>
      </Modal>
    );
  }
  
  return null;
};

export default KycVerificationModal;