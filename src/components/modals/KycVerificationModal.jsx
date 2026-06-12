import React, { useState, useEffect, useRef } from 'react';
import { Shield, CheckCircle, Lock, AlertTriangle, Fingerprint, CreditCard, Info, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal'; 
import Button from '../ui/Button'; 
import { supabase } from '../../supabase'; 

const KycVerificationModal = ({ mode, user, actions, onClose }) => {
  const { handleIdentitySubmit, handleBankSubmit, handleDigilockerSuccess } = actions;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const sdkSessionRequestedRef = useRef(false);
  const panSubmittingRef = useRef(false);

  const notify = (message, type = 'error') => {
    setNotice({ message, type });
  };

  // ==========================================
  // ⚡ DYNAMIC STATE & FLOW CONTROL
  // ==========================================
  const hasCompletedIdentity = Boolean(
    user?.is_kyc_verified || ['approved', 'verified'].includes(user?.kyc_status)
  );
  const isAlreadyVerified = hasCompletedIdentity || user.kyc_status === 'age_verified' || user.digilocker_verified === true;
  const userDob = user.temp_dob || user.dob;
  
  const calculatedAge = userDob ? (new Date().getFullYear() - new Date(userDob).getFullYear()) : null;
  const isMinor = calculatedAge !== null ? calculatedAge < 18 : false;

  const [dlFlowState, setDlFlowState] = useState(isAlreadyVerified ? 'verified' : 'idle');
  
  const [panNumber, setPanNumber] = useState('');
  const [identityConsent, setIdentityConsent] = useState(false);

  // 🚀 NEW: Ref for the hidden SDK mount point
  const sdkMountRef = useRef(null);

  // Bank Form State
  const isBankMinor = user.kyc_type === 'minor' || isMinor;
  const [bankForm, setBankForm] = useState({
    account_number: '', ifsc_code: '', bank_name: '', account_holder_name: '',
    guardian_name: '', guardian_relationship: 'Parent', consent: false
  });

  useEffect(() => {
     if (isAlreadyVerified && dlFlowState !== 'success_anim') {
         setDlFlowState('verified');
     }
  }, [isAlreadyVerified, dlFlowState]);

  // ==========================================
  // ACTION 1: INITIALIZE SDK (Hidden)
  // ==========================================
  // Pre-load the SDK into a hidden div as soon as the modal opens
  useEffect(() => {
    if (mode !== 'identity' || isAlreadyVerified || dlFlowState !== 'idle' || sdkSessionRequestedRef.current) return;

    let isMounted = true;
    sdkSessionRequestedRef.current = true;

    const prepareSdk = async () => {
        try {
            setNotice(null);
            const { data, error } = await supabase.functions.invoke('digilocker', {
              body: { action: 'CREATE_SESSION', user_id: user.id }
            });

            if (error || !data?.token) throw new Error("Could not generate secure session token.");
            if (!isMounted) return;

            setTimeout(() => {
                if (typeof window.DigiboostSdk !== 'function' || !sdkMountRef.current) return;

                window.DigiboostSdk({
                    gateway: "production",
                    token: data.token,
                    selector: "#hidden-sdk-mount", 
                    // No styling needed, it's invisible
                    onSuccess: function() {
                        localStorage.removeItem('kyc_in_progress'); 
                        setDlFlowState('success_anim');
                        setIsSubmitting(false);
                        if (handleDigilockerSuccess) handleDigilockerSuccess(data.verification_id);
                        setTimeout(() => setDlFlowState('verified'), 2500);
                    },
                    onFailure: function() {
                        localStorage.removeItem('kyc_in_progress'); 
                        notify("Verification was cancelled or failed. Please try again.");
                        setIsSubmitting(false);
                    }
                });
                
                if (isMounted) setDlFlowState('sdk_ready');

            }, 500); 

        } catch (err) {
            console.error("SDK Prep Error:", err);
            sdkSessionRequestedRef.current = false;
            if (isMounted) notify("Could not prepare DigiLocker. Please close and try again.");
        }
    };

    prepareSdk();

    return () => { isMounted = false; };
  }, [mode, isAlreadyVerified, user.id, dlFlowState, handleDigilockerSuccess]);

  // ==========================================
  // ACTION 2: TRIGGER HIDDEN SDK
  // ==========================================
  const triggerDigiLocker = () => {
      if (dlFlowState !== 'sdk_ready') {
        notify("Secure connection is still preparing. Please wait a moment.", "error");
        return;
      }
      setIsSubmitting(true);
      
      // Leave a breadcrumb for drop-off recovery
      localStorage.setItem('kyc_in_progress', 'true');

      // Programmatically click the Surepass button hidden in the DOM
      const surepassButton = sdkMountRef.current?.querySelector('button');
      
      if (surepassButton) {
          surepassButton.click();
      } else {
          notify("Secure connection not ready yet. Please try again in a moment.");
          setIsSubmitting(false);
      }
  };

  // ==========================================
  // ACTION 3: SUBMIT FINAL IDENTITY (PAN)
  // ==========================================
  const onIdentitySubmit = async (e) => {
    e.preventDefault();
    if (panSubmittingRef.current || isSubmitting) return;
    if (dlFlowState !== 'verified') return notify("Please complete DigiLocker verification first.");
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) return notify("Please enter a valid PAN format, e.g. ABCDE1234F.");
    if (isMinor && !identityConsent) return notify("Guardian consent is strictly required.");

    setIsSubmitting(true);
    panSubmittingRef.current = true;
    setNotice(null);

    try {
      const { data: panData, error: panError } = await supabase.functions.invoke('pan', {
          body: { action: 'VERIFY_PAN', pan_number: panNumber }
      });

      if (panError || !panData?.success) {
          setIsSubmitting(false);
	          return notify("Surepass Error: " + (panData?.error || panError?.message || "Unknown Error"));
      }

      let clientIp = 'unknown';
      if (isMinor && identityConsent) {
        try {
          const ipData = await (await fetch('https://api.ipify.org?format=json')).json();
          clientIp = ipData.ip;
        } catch (_err) {
          clientIp = 'unknown';
        }
      }

      await handleIdentitySubmit({ 
        ageGroup: isMinor ? 'minor' : 'adult', 
        panNumber, 
        digilocker_verified: true,
        dob: userDob,
        guardianConsent: identityConsent,
        guardianName: panData.registered_name, 
        consentIp: clientIp,
        consentUserAgent: navigator.userAgent,
        consentVersion: 'v1.0-TeenVerseHub'
      });
      
    } catch (err) {
	      notify("Verification failed: " + err.message);
    } finally {
      panSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const onBankSubmit = async (e) => {
    e.preventDefault();
	    if (isBankMinor && (!bankForm.guardian_name || !bankForm.consent)) return notify("Guardian details required.");
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
  // HELPER: PROGRESS BAR
  // ==========================================
  const renderProgressBar = () => {
      let progress = 0;
      if (dlFlowState === 'sdk_ready' || dlFlowState === 'idle') progress = 33;
      if (dlFlowState === 'verified' || dlFlowState === 'success_anim') progress = 66;

      return (
          <div className="w-full bg-slate-200 rounded-full h-1.5 mb-4 dark:bg-slate-800">
             <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
      );
  };

  // ==========================================
  // VIEW 1: IDENTITY VERIFICATION
  // ==========================================
  if (mode === 'identity') {
    return (
	      <Modal title="Identity Verification" onClose={onClose}>
	        {renderProgressBar()}
	        {notice && (
	          <div className={`mb-4 rounded-xl border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'}`}>
	            {notice.message}
	          </div>
	        )}
	        <div className="space-y-5">
           <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 dark:bg-indigo-500/10 dark:border-indigo-500/20">
              <Shield className="text-indigo-600 shrink-0 dark:text-indigo-300" />
              <p className="text-xs text-indigo-800 dark:text-indigo-200">
                 We verify age through DigiLocker and PAN through a secure verification provider. Verification is required before applying or receiving payouts.
              </p>
           </div>
           
           <div className="space-y-4">
               {/* STEP 1: DIGILOCKER */}
               <div className={`p-4 rounded-xl border transition-colors duration-500 ${dlFlowState === 'verified' || dlFlowState === 'success_anim' ? 'bg-green-50 border-green-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-gray-50 border-gray-200 dark:bg-white/[0.03] dark:border-white/10'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 dark:text-gray-400">
                      <Fingerprint size={14}/> Step 1: Age Verification
                    </label>
                    {(dlFlowState === 'verified' || dlFlowState === 'success_anim') && <CheckCircle size={16} className="text-green-500 animate-pulse" />}
                  </div>
                  
                  {/* 🚀 THE HIDDEN SDK MOUNT POINT */}
                  <div id="hidden-sdk-mount" ref={sdkMountRef} style={{ display: 'none' }}></div>
                  
                  {/* STATE 1: PREPARING (Waiting for Edge Function) */}
                  {dlFlowState === 'idle' && (
                     <div className="space-y-3 animate-fade-in">
                        <Button disabled variant="outline" className="w-full flex items-center justify-center gap-2">
                           <Loader2 size={16} className="animate-spin" /> Preparing secure connection...
                        </Button>
                     </div>
                  )}

                  {/* STATE 2: SDK READY (Your Custom Button!) */}
                  {dlFlowState === 'sdk_ready' && (
                    <div className="space-y-3 animate-fade-in">
                       <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3 dark:bg-blue-500/10 dark:border-blue-500/20">
                           <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                           <div className="text-xs text-blue-900 space-y-1 dark:text-blue-200">
                               <p className="font-bold">Secure Government Portal</p>
                               <p>You will continue through DigiLocker. We only use the verified date of birth needed for platform eligibility.</p>
                           </div>
                       </div>
                       
                       <Button 
                         type="button" 
                         onClick={triggerDigiLocker} 
                         disabled={isSubmitting}
                         variant="primary" 
                         className="w-full bg-blue-600 hover:bg-blue-700 transition-all"
                       >
                         {isSubmitting ? "Opening DigiLocker..." : "Verify Age via DigiLocker"}
                       </Button>
                    </div>
                  )}

                  {/* STATE 3: GAMIFICATION SUCCESS ANIMATION */}
                  {dlFlowState === 'success_anim' && (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2 animate-fade-in">
                       <CheckCircle className="text-green-500" size={40} />
                       <h3 className="font-extrabold text-green-800 text-lg dark:text-green-300">Age verified</h3>
                       <p className="text-green-700 text-xs font-semibold dark:text-green-300">Complete PAN verification to finish KYC.</p>
                    </div>
                  )}

                  {/* STATE 4: VERIFIED SETTLED */}
                  {dlFlowState === 'verified' && (
                    <Button type="button" disabled variant="outline" className="w-full bg-green-50/50 text-green-700 border-green-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                      ✓ Verified (DOB: {userDob})
                    </Button>
                  )}
               </div>
               
               {/* STEP 2: PAN */}
               {(dlFlowState === 'verified' || dlFlowState === 'success_anim') && (
                 <div className="p-4 rounded-xl border bg-white border-gray-200 shadow-sm animate-fade-in dark:bg-white/[0.03] dark:border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 dark:text-gray-400">
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
                        className="w-full p-3 rounded-xl border font-mono uppercase bg-gray-50 focus:border-indigo-500 outline-none transition-colors dark:bg-slate-950 dark:border-white/10 dark:text-white" 
                        placeholder="ABCDE1234F" 
                        maxLength={10} 
                      />
                    </div>
                 </div>
               )}

               {/* STEP 3: GUARDIAN CONSENT */}
               {(dlFlowState === 'verified' || dlFlowState === 'success_anim') && isMinor && (
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-3 animate-fade-in dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200">
                    <h4 className="font-bold flex items-center gap-2"><AlertTriangle size={14}/> Parent Declaration</h4>
                    <div className="pt-2 flex items-start gap-3">
                      <input type="checkbox" id="id_consent" className="mt-0.5" checked={identityConsent} onChange={(e) => setIdentityConsent(e.target.checked)} />
                      <label htmlFor="id_consent" className="font-bold cursor-pointer transition-colors hover:text-amber-700">
                        I confirm I am the legal guardian. I approve this minor to participate on TeenVerseHub, and assume financial responsibility.
                      </label>
                    </div>
                 </div>
               )}

               <Button 
                 onClick={onIdentitySubmit} 
                 disabled={dlFlowState !== 'verified' || panNumber.length !== 10 || (isMinor && !identityConsent) || isSubmitting} 
                 className="w-full py-3 mt-4 transition-all duration-300"
               >
                   {isSubmitting ? "Processing..." : "Complete Verification"}
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
	           {notice && (
	             <div className={`rounded-xl border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
	               {notice.message}
	             </div>
	           )}
	           <form onSubmit={onBankSubmit} className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
               {isBankMinor && (
                   <div className="p-3 bg-white rounded-lg text-xs border border-gray-200 mb-2 space-y-3">
                       <p className="font-bold text-gray-500 uppercase flex items-center gap-2"><Shield size={12}/> Guardian Details</p>
                       <input required placeholder="Guardian Name (as per Bank)" value={bankForm.guardian_name} className="w-full p-2.5 rounded-lg border outline-none focus:border-indigo-500" onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} />
                       <select className="w-full p-2.5 rounded-lg border bg-white outline-none focus:border-indigo-500" value={bankForm.guardian_relationship} onChange={e => setBankForm({...bankForm, guardian_relationship: e.target.value})}>
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
               <Button type="submit" disabled={isSubmitting || (isBankMinor && !bankForm.consent)} className="w-full py-3 bg-gray-900 hover:bg-black text-white mt-2">
                   {isSubmitting ? "Linking..." : "Link Bank Account"}
               </Button>
           </form>
        </div>
      </Modal>
    );
  }
  return null;
};

export default KycVerificationModal;
