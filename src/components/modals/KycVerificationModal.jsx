import React, { useState } from 'react';
import { UploadCloud, Shield, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal'; 
import Button from '../ui/Button'; 

const KycVerificationModal = ({ mode, user, kycFile, setKycFile, actions, onClose }) => {
  const { handleIdentitySubmit, handleBankSubmit } = actions;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auto-detect Age
  const isMinor = (user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : (user.age || 20)) < 18;
  const ageGroup = isMinor ? 'minor' : 'adult';

  // State for Identity Declaration (Minor Only)
  const [identityConsent, setIdentityConsent] = useState(false);

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
    // Include consent flag in payload if backend stores it
    await handleIdentitySubmit({ ageGroup, panNumber, kycFile, guardianConsent: identityConsent });
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
               
               <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer relative">
                   <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setKycFile(e.target.files[0])} />
                   <UploadCloud className="mx-auto text-gray-400 mb-2" />
                   <p className="text-sm font-bold text-gray-500">{kycFile ? kycFile.name : `Upload ${isMinor ? "Guardian's " : ""}ID Proof`}</p>
               </div>

               {/* 🟡 MINOR DECLARATION - IDENTITY */}
               {isMinor && (
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-3">
                    <h4 className="font-bold flex items-center gap-2"><AlertTriangle size={14}/> Parent / Guardian Declaration (Mandatory)</h4>
                    <p className="leading-relaxed opacity-90">
                      I confirm that I am the parent or legal guardian of the minor user registering on TeenVerseHub. I hereby:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                      <li>Give my explicit consent for the minor to use the platform.</li>
                      <li>Consent to the use of my identity documents for verification.</li>
                      <li>Accept full financial and legal responsibility for activities performed by the minor.</li>
                    </ul>
                    <p className="font-medium opacity-80">TeenVerseHub is an intermediary and is not responsible for off-platform conduct.</p>
                    
                    <div className="pt-2 flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="id_consent" 
                        className="mt-0.5"
                        checked={identityConsent}
                        onChange={(e) => setIdentityConsent(e.target.checked)}
                      />
                      <label htmlFor="id_consent" className="font-bold">I am the parent / legal guardian and I agree to the above declaration.</label>
                    </div>
                    <p className="text-[10px] text-amber-700 italic">Providing false information may result in account suspension.</p>
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
               {/* Minor Specific Fields */}
               {isMinor && (
                   <div className="p-3 bg-white rounded-lg text-xs border border-gray-200 mb-2">
                       <p className="font-bold text-gray-500 uppercase mb-2">Guardian Details</p>
                       <input required placeholder="Guardian Name" className="w-full p-2 mb-2 rounded border" onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} />
                       <select className="w-full p-2 rounded border" onChange={e => setBankForm({...bankForm, guardian_relationship: e.target.value})}>
                          <option value="Parent">Parent</option>
                          <option value="Legal Guardian">Legal Guardian</option>
                       </select>
                   </div>
               )}

               <input required placeholder="IFSC Code" value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value.toUpperCase()})} className="w-full p-3 rounded-xl border bg-white" />
               <input required placeholder="Account Number" type="password" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               <input required placeholder="Holder Name" value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})} className="w-full p-3 rounded-xl border bg-white" />
               
               {/* 🟢 MINOR DECLARATION - BANKING */}
               {isMinor && (
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-3 mt-4">
                    <h4 className="font-bold flex items-center gap-2"><AlertTriangle size={14}/> Guardian Bank Declaration (Mandatory)</h4>
                    <p className="leading-relaxed opacity-90">
                      I confirm that the bank account details provided above belong to the parent or legal guardian of the minor user. I acknowledge that:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                      <li>TeenVerseHub does not process payouts to minor-held bank accounts.</li>
                      <li>All funds earned will be paid exclusively to this guardian account.</li>
                      <li>I am responsible for tax compliance related to these earnings.</li>
                    </ul>
                    
                    <div className="pt-2 flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="bank_consent" 
                        className="mt-0.5"
                        checked={bankForm.consent}
                        onChange={(e) => setBankForm({...bankForm, consent: e.target.checked})}
                      />
                      <label htmlFor="bank_consent" className="font-bold">I confirm that this is the parent / guardian bank account.</label>
                    </div>
                 </div>
               )}

               <Button 
                 type="submit" 
                 disabled={isSubmitting || (isMinor && !bankForm.consent)} 
                 className={`w-full py-3 bg-green-600 hover:bg-green-700 ${isMinor && !bankForm.consent ? 'opacity-50 cursor-not-allowed' : ''}`}
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