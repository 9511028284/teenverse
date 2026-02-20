import React, { useState } from 'react';
import { Shield, CheckCircle, Lock, AlertTriangle, Fingerprint, CreditCard } from 'lucide-react';
import Modal from '../ui/Modal'; 
import Button from '../ui/Button'; 
import { supabase } from '../../supabase'; // Ensure this matches your path

const KycVerificationModal = ({ mode, user, actions, onClose }) => {
  const { handleIdentitySubmit, handleBankSubmit } = actions;
  const [isSubmitting, setIsSubmitting] = useState(false);



  // ==========================================
  // ⚡ DYNAMIC STATE (This fixes the Step 2 issue!)
  // ==========================================
  // Instead of useState, we calculate these on every render.
  // When the dashboard updates the user object, the modal updates instantly.
  const digilockerVerified = user.kyc_status === 'age_verified' || user.digilocker_verified === true;
  const userDob = user.temp_dob || user.dob;
  
  const calculatedAge = userDob ? (new Date().getFullYear() - new Date(userDob).getFullYear()) : null;
  const isMinor = calculatedAge !== null ? calculatedAge < 18 : false;

  const [panNumber, setPanNumber] = useState('');
  const [panVerified, setPanVerified] = useState(false);
  const [identityConsent, setIdentityConsent] = useState(false);

  

  // Bank Form State
  const isBankMinor = user.kyc_type === 'minor' || isMinor;
  const [bankForm, setBankForm] = useState({
    account_number: '', 
    ifsc_code: '', 
    bank_name: '', 
    account_holder_name: '',
    guardian_name: '', 
    guardian_relationship: 'Parent', 
    consent: false
  });

  // ==========================================
  // ACTION: START DIGILOCKER
  // ==========================================
  const startDigiLocker = async () => {
    setIsSubmitting(true);
    try {
      const redirectUrl = "https://teenversehub.in/dashboard?dl_success=true";
      
      const { data, error } = await supabase.functions.invoke('digilocker', {
        body: { action: 'CREATE_SESSION', user_id: user.id, redirect_url: redirectUrl }
      });

      if (error) throw error;
      if (data?.url && data?.verification_id) {
         // Save ID to memory so the dashboard can verify it after redirect
         localStorage.setItem('cf_verification_id', data.verification_id);
         window.location.href = data.url; 
      } else {
         throw new Error("Could not generate DigiLocker session.");
      }
    } catch (err) {
      alert("DigiLocker Error: " + err.message);
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ACTION: SUBMIT FINAL IDENTITY
  // ==========================================
  const onIdentitySubmit = async (e) => {
    e.preventDefault();
    if (!digilockerVerified) return alert("Please complete DigiLocker verification first.");
    if (!panNumber || panNumber.length !== 10) return alert("Please enter a valid 10-character PAN number.");
    if (isMinor && !identityConsent) return alert("Guardian consent is strictly required.");

    setIsSubmitting(true);
    await handleIdentitySubmit({ 
      ageGroup: isMinor ? 'minor' : 'adult', 
      panNumber, 
      digilocker_verified: true,
      dob: userDob,
      guardianConsent: identityConsent 
    });
    setIsSubmitting(false);
  };

  // ==========================================
  // ACTION: SUBMIT BANK DETAILS
  // ==========================================
  const onBankSubmit = async (e) => {
    e.preventDefault();
    if (isBankMinor) {
        if (!bankForm.guardian_name || bankForm.guardian_name.trim().length < 3) return alert("Guardian Name is required for minors.");
        if (!bankForm.consent) return alert("You must confirm the guardian consent.");
    }
    if (!bankForm.bank_name) return alert("Please enter the Bank Name.");
    if (!bankForm.account_number) return alert("Account Number is required.");

    setIsSubmitting(true);
    const safePayload = { ...bankForm };
    
    if (!isBankMinor) {
        safePayload.guardian_name = 'Self';
        safePayload.guardian_relationship = 'Self';
        safePayload.is_guardian_account = false;
    }

    await handleBankSubmit(safePayload, isBankMinor ? 'minor' : 'adult');
    setIsSubmitting(false);
  };

  // ==========================================
  // VIEW 1: IDENTITY VERIFICATION
  // ==========================================
  if (mode === 'identity') {
    return (
      <Modal title="Identity Verification" onClose={onClose}>
        <div className="space-y-5">
           <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3">
              <Shield className="text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-800">
                 We use DigiLocker and NSDL to securely verify your age and identity. Takes less than a minute.
              </p>
           </div>
           
           <div className="space-y-4">
               {/* STEP 1: DIGILOCKER */}
               <div className={`p-4 rounded-xl border ${digilockerVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                      <Fingerprint size={14}/> Step 1: Age Verification
                    </label>
                    {digilockerVerified && <CheckCircle size={16} className="text-green-500" />}
                  </div>
                  <Button 
                    type="button"
                    onClick={startDigiLocker} 
                    disabled={digilockerVerified || isSubmitting}
                    variant={digilockerVerified ? "outline" : "primary"}
                    className="w-full"
                  >
                    {digilockerVerified ? `✓ Verified (DOB: ${userDob})` : (isSubmitting ? "Connecting..." : "Connect DigiLocker")}
                  </Button>
               </div>
               
               {/* STEP 2: PAN (Dynamically reveals when Step 1 is done) */}
               {digilockerVerified && (
                 <div className="p-4 rounded-xl border bg-white border-gray-200 shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <CreditCard size={14}/> Step 2: Financial Identity
                      </label>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">
                        {isMinor ? "Because you are under 18, please provide your Parent/Guardian's PAN number." : "Please provide your PAN number."}
                      </p>
                      <input 
                        value={panNumber} 
                        onChange={e => setPanNumber(e.target.value.toUpperCase())} 
                        className="w-full p-3 rounded-xl border font-mono uppercase bg-gray-50 focus:border-indigo-500 outline-none" 
                        placeholder="ABCDE1234F" 
                        maxLength={10} 
                      />
                    </div>
                 </div>
               )}

               {/* STEP 3: GUARDIAN CONSENT (Only for verified minors) */}
               {digilockerVerified && isMinor && (
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-3 animate-fade-in">
                    <h4 className="font-bold flex items-center gap-2"><AlertTriangle size={14}/> Parent Declaration</h4>
                    <div className="pt-2 flex items-start gap-3">
                      <input type="checkbox" id="id_consent" className="mt-0.5" checked={identityConsent} onChange={(e) => setIdentityConsent(e.target.checked)} />
                      <label htmlFor="id_consent" className="font-bold">I confirm I am the legal guardian. I approve this minor to participate on TeenVerseHub, and assume financial responsibility.</label>
                    </div>
                 </div>
               )}

               <Button 
                 onClick={onIdentitySubmit} 
                 disabled={!digilockerVerified || panNumber.length !== 10 || (isMinor && !identityConsent) || isSubmitting} 
                 className="w-full py-3 mt-4"
               >
                   Complete Verification
               </Button>
           </div>
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
                 <strong>Great work!</strong> Link your bank account to receive payouts securely.
              </p>
           </div>

           <form onSubmit={onBankSubmit} className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
               {isBankMinor && (
                   <div className="p-3 bg-white rounded-lg text-xs border border-gray-200 mb-2 space-y-3">
                       <p className="font-bold text-gray-500 uppercase flex items-center gap-2"><Shield size={12}/> Guardian Details</p>
                       <input 
                         required 
                         placeholder="Guardian Name (as per Bank)" 
                         value={bankForm.guardian_name}
                         className="w-full p-2.5 rounded-lg border outline-none focus:border-indigo-500" 
                         onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} 
                       />
                       <select 
                         className="w-full p-2.5 rounded-lg border bg-white outline-none focus:border-indigo-500" 
                         value={bankForm.guardian_relationship}
                         onChange={e => setBankForm({...bankForm, guardian_relationship: e.target.value})}
                       >
                          <option value="Parent">Parent</option>
                          <option value="Legal Guardian">Legal Guardian</option>
                       </select>
                   </div>
               )}

               <input required placeholder="IFSC Code" value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value.toUpperCase()})} className="w-full p-3 rounded-xl border bg-white outline-none focus:border-indigo-500" />
               <input required placeholder="Bank Name (e.g. SBI)" value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none focus:border-indigo-500" />
               <input required placeholder="Account Number" type="password" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none focus:border-indigo-500" />
               <input required placeholder="Account Holder Name" value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none focus:border-indigo-500" />
               
               {isBankMinor && (
                 <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mt-2 flex items-start gap-3">
                      <input type="checkbox" id="bank_consent" className="mt-0.5" checked={bankForm.consent} onChange={(e) => setBankForm({...bankForm, consent: e.target.checked})} />
                      <label htmlFor="bank_consent" className="font-bold">I confirm this is the parent/guardian bank account.</label>
                 </div>
               )}

               <Button 
                 type="submit" 
                 disabled={isSubmitting || (isBankMinor && !bankForm.consent)} 
                 className="w-full py-3 bg-gray-900 hover:bg-black text-white mt-2"
               >
                   {isSubmitting ? "Linking..." : "Link Bank Account"}
               </Button>
               
               <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-medium">
                   <Lock size={10} /> Bank details are 256-bit encrypted via Cashfree.
               </div>
           </form>
        </div>
      </Modal>
    );
  }
  
  return null;
};

export default KycVerificationModal;