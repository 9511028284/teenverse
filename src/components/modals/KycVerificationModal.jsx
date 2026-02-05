import React, { useState } from 'react';
import { UploadCloud, Shield, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal'; 
import Button from '../ui/Button'; 

const KycVerificationModal = ({ mode, user, kycFile, setKycFile, actions, onClose }) => {
  const { handleIdentitySubmit, handleBankSubmit } = actions;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auto-detect Age (Default to 20/Adult if missing to prevent minor-logic locks)
  const isMinor = (user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : (user.age || 20)) < 18;
  const ageGroup = isMinor ? 'minor' : 'adult';

  // State
  const [identityConsent, setIdentityConsent] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  
  // Bank Form State
  const [bankForm, setBankForm] = useState({
    account_number: '', 
    ifsc_code: '', 
    bank_name: '', 
    account_holder_name: '',
    guardian_name: '', 
    guardian_relationship: 'Parent', 
    consent: false
  });

  // --- IDENTITY SUBMIT ---
  const onIdentitySubmit = async (e) => {
    e.preventDefault();
    
    // Manual Validation (Fixes Mobile "required" glitch)
    if (!kycFile) {
        alert("Please select an ID proof document.");
        return;
    }

    setIsSubmitting(true);
    await handleIdentitySubmit({ ageGroup, panNumber, kycFile, guardianConsent: identityConsent });
    setIsSubmitting(false);
  };

  // --- BANK SUBMIT ---
  const onBankSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Strict Validation
    if (isMinor) {
        if (!bankForm.guardian_name || bankForm.guardian_name.trim().length < 3) {
             alert("Guardian Name is required for minors.");
             return;
        }
        if (!bankForm.consent) {
             alert("You must confirm the guardian consent.");
             return;
        }
    }
    if (!bankForm.bank_name) return alert("Please enter the Bank Name.");
    if (!bankForm.account_number) return alert("Account Number is required.");

    setIsSubmitting(true);

    // 2. 🛡️ CRITICAL FRONTEND FIX for "guardian_required_for_minors"
    // The DB constraint crashes if guardian_name is NULL, even for adults.
    // We strictly force 'Self' for adults here to satisfy the database.
    const safePayload = { ...bankForm };
    
    if (!isMinor) {
        safePayload.guardian_name = 'Self';
        safePayload.guardian_relationship = 'Self';
        safePayload.is_guardian_account = false;
    }

    // Send the safe payload to the backend
    await handleBankSubmit(safePayload, ageGroup);
    setIsSubmitting(false);
  };

  // ==========================================
  // VIEW 1: IDENTITY VERIFICATION
  // ==========================================
  if (mode === 'identity') {
    return (
      <Modal title={isMinor ? "Parent/Guardian Verification" : "Identity Verification"} onClose={onClose}>
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase">
                    {isMinor ? "Guardian's PAN Number" : "PAN Number"}
                  </label>
                  <input required value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} className="w-full p-3 rounded-xl border font-mono uppercase" placeholder="ABCDE1234F" maxLength={10} />
               </div>
               
               <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer relative bg-white dark:bg-transparent transition-colors">
                   {/* 🛠️ MOBILE FIX: Removed 'required', added 'accept', added z-index */}
                   <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" 
                      onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                              setKycFile(e.target.files[0]);
                          }
                      }} 
                   />
                   <div className="pointer-events-none">
                       <UploadCloud className="mx-auto text-gray-400 mb-2" />
                       <p className="text-sm font-bold text-gray-500 truncate px-4">
                           {kycFile ? kycFile.name : `Tap to Upload ${isMinor ? "Guardian's " : ""}ID Proof`}
                       </p>
                   </div>
               </div>

               {isMinor && (
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-3">
                    <h4 className="font-bold flex items-center gap-2"><AlertTriangle size={14}/> Parent Declaration</h4>
                    <div className="pt-2 flex items-start gap-3">
                      <input type="checkbox" id="id_consent" className="mt-0.5" checked={identityConsent} onChange={(e) => setIdentityConsent(e.target.checked)} />
                      <label htmlFor="id_consent" className="font-bold">I am the parent / legal guardian and I agree to the declaration.</label>
                    </div>
                 </div>
               )}

               <Button 
                 type="submit" 
                 disabled={isSubmitting || (isMinor && !identityConsent)} 
                 className={`w-full py-3 ${isMinor && !identityConsent ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                   {isSubmitting ? "Verifying..." : "Verify & Continue"}
               </Button>
           </form>
        </div>
      </Modal>
    );
  }

  // ==========================================
  // VIEW 2: BANKING LINKAGE
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
               {/* Minor Specific Fields */}
               {isMinor && (
                   <div className="p-3 bg-white rounded-lg text-xs border border-gray-200 mb-2 space-y-2">
                       <p className="font-bold text-gray-500 uppercase">Guardian Details (Required)</p>
                       <input 
                         required 
                         placeholder="Guardian Name" 
                         value={bankForm.guardian_name}
                         className="w-full p-2 rounded border" 
                         onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} 
                       />
                       <select 
                         className="w-full p-2 rounded border bg-white" 
                         value={bankForm.guardian_relationship}
                         onChange={e => setBankForm({...bankForm, guardian_relationship: e.target.value})}
                       >
                          <option value="Parent">Parent</option>
                          <option value="Legal Guardian">Legal Guardian</option>
                       </select>
                   </div>
               )}

               <input required placeholder="IFSC Code" value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value.toUpperCase()})} className="w-full p-3 rounded-xl border bg-white" />
               
               {/* ✅ ADDED MISSING BANK NAME FIELD (Required by DB) */}
               <input required placeholder="Bank Name (e.g. SBI)" value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               
               <input required placeholder="Account Number" type="password" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               <input required placeholder="Account Holder Name" value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               
               {isMinor && (
                 <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mt-2 flex items-start gap-3">
                      <input type="checkbox" id="bank_consent" className="mt-0.5" checked={bankForm.consent} onChange={(e) => setBankForm({...bankForm, consent: e.target.checked})} />
                      <label htmlFor="bank_consent" className="font-bold">I confirm this is the parent/guardian bank account.</label>
                 </div>
               )}

               <Button 
                 type="submit" 
                 disabled={isSubmitting || (isMinor && !bankForm.consent)} 
                 className={`w-full py-3 bg-green-600 hover:bg-green-700 mt-2 ${isMinor && !bankForm.consent ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
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