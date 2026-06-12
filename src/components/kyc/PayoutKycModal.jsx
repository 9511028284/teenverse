import React, { useRef, useState } from 'react';
import { AlertTriangle, CreditCard, Landmark, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { supabase } from '../../supabase';
import { getUserDob, isMinorUser, PAN_REGEX } from './kycUtils';

const PayoutKycModal = ({ user, actions = {}, onClose }) => {
  const { handleIdentitySubmit, handleBankSubmit } = actions;
  const panSubmittingRef = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [panNumber, setPanNumber] = useState('');
  const [bankForm, setBankForm] = useState({
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    account_holder_name: '',
    guardian_name: '',
    guardian_relationship: 'Parent',
    consent: false,
  });

  const isMinor = isMinorUser(user);
  const userDob = getUserDob(user);
  const isPanValid = PAN_REGEX.test(panNumber);
  const isMinorBlocked = isMinor && (!bankForm.guardian_name.trim() || !bankForm.consent);
  const isBankIncomplete = !bankForm.ifsc_code.trim() || !bankForm.account_number.trim() || !bankForm.account_holder_name.trim();
  const isSubmitDisabled = isSubmitting || !isPanValid || isBankIncomplete || isMinorBlocked;

  const notify = (message, type = 'error') => {
    setNotice({ message, type });
  };

  const updateBankForm = (field, value) => {
    setBankForm((prev) => ({ ...prev, [field]: value }));
  };

  const getClientIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data?.ip || 'unknown';
    } catch (_err) {
      return 'unknown';
    }
  };

  const submitPayoutKyc = async (event) => {
    event.preventDefault();
    if (panSubmittingRef.current || isSubmitDisabled) return;

    panSubmittingRef.current = true;
    setIsSubmitting(true);
    setNotice(null);

    try {
      const { data: panData, error: panError } = await supabase.functions.invoke('pan', {
        body: { action: 'VERIFY_PAN', pan_number: panNumber },
      });

      if (panError || !panData?.success) {
        throw new Error(panData?.error || panError?.message || 'PAN verification failed.');
      }

      let consentIp = 'unknown';
      if (isMinor && bankForm.consent) {
        consentIp = await getClientIp();
      }

      if (handleIdentitySubmit) {
        const identitySaved = await handleIdentitySubmit({
          ageGroup: isMinor ? 'minor' : 'adult',
          panNumber,
          digilocker_verified: Boolean(user?.digilocker_verified || user?.kyc_status === 'age_verified'),
          dob: userDob,
          guardianConsent: isMinor ? bankForm.consent : false,
          guardianName: isMinor ? bankForm.guardian_name : 'Self',
          consentIp,
          consentUserAgent: navigator.userAgent,
          consentVersion: 'v1.0-TeenVerseHub-PayoutKyc',
          closeModal: false,
        });

        if (identitySaved === false) {
          throw new Error('Could not save payout verification details.');
        }
      }

      if (!handleBankSubmit) {
        throw new Error('Bank processing is currently unavailable.');
      }

      const safePayload = {
        ...bankForm,
        ifsc_code: bankForm.ifsc_code.trim().toUpperCase(),
        bank_name: bankForm.bank_name.trim(),
        account_number: bankForm.account_number.trim(),
        account_holder_name: bankForm.account_holder_name.trim(),
      };

      if (!isMinor) {
        safePayload.guardian_name = 'Self';
        safePayload.guardian_relationship = 'Self';
        safePayload.is_guardian_account = false;
        safePayload.consent = false;
      } else {
        safePayload.guardian_name = bankForm.guardian_name.trim();
        safePayload.is_guardian_account = true;
      }

      const bankSaved = await handleBankSubmit(safePayload, isMinor ? 'minor' : 'adult');
      if (bankSaved === false) {
        throw new Error('Could not save bank details.');
      }

      notify('Payout details updated successfully.', 'success');
    } catch (err) {
      notify(err.message || 'Verification failed. Please try again.');
    } finally {
      panSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="" onClose={onClose}>
      <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950 px-1 pt-1 transition-colors duration-500">
        
        {/* Soft Ambient Background Glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-b from-indigo-500/5 to-transparent blur-[80px] pointer-events-none -z-10" />

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6 select-none">
          <div className="relative w-16 h-16 mb-3 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border-[0.5px] border-zinc-200/80 dark:border-white/[0.06] shadow-sm backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:6px_6px] opacity-70" />
            
            <img 
              src="/assets/images/card-pan-verify.png" 
              alt="Card and PAN check" 
              className="w-10 h-10 object-contain relative z-10 transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-indigo-600 dark:text-indigo-400 relative z-10">
              <CreditCard size={22} strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
            Set up payouts
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[260px] mt-1.5 leading-relaxed font-normal">
            Link your banking and identity details to set up direct platform transfers.
          </p>
        </div>

        <form onSubmit={submitPayoutKyc} className="space-y-4 relative z-10">
          
          {/* Messages Channel */}
          {notice && (
            <div className={`rounded-xl border-[0.5px] p-3.5 text-xs font-medium flex items-start gap-3 transition-all duration-300 animate-fade-in ${
              notice.type === 'success' 
                ? 'border-emerald-200/40 bg-emerald-50/20 text-emerald-900 dark:border-emerald-500/10 dark:bg-emerald-950/20 dark:text-emerald-400' 
                : 'border-rose-200/40 bg-rose-50/20 text-rose-900 dark:border-rose-500/10 dark:bg-rose-950/20 dark:text-rose-400'
            }`}>
              {notice.type === 'error' ? (
                <AlertCircle size={14} className="shrink-0 text-rose-500 mt-0.5" />
              ) : (
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500 mt-0.5" />
              )}
              <span className="leading-relaxed flex-1 font-normal">{notice.message}</span>
            </div>
          )}

          {/* Guidelines Ribbon */}
          <div className="rounded-xl border-[0.5px] border-zinc-200/60 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-zinc-900/20 p-3.5 flex gap-3 items-center">
            <ShieldCheck size={16} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
              Please double-check your account info. These fields are used directly for processing your transfer reports.
            </p>
          </div>

          {/* PAN Card Section */}
          <section className="rounded-xl border-[0.5px] border-zinc-200/60 bg-zinc-50/10 p-4 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.01]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              <CreditCard size={12} strokeWidth={2.5} /> PAN Verification
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-normal">
              {isMinor ? "Provide a parent or legal guardian's PAN card for setup approval." : "Provide your personal PAN card details to initialize your route."}
            </p>
            <input
              value={panNumber}
              onChange={(event) => setPanNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 font-mono bg-white dark:bg-zinc-900/60 outline-none transition-all focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            {panNumber.length === 10 && !isPanValid && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 font-normal flex items-center gap-1.5 animate-fade-in">
                <AlertCircle size={12} /> Format mismatch. Please check the PAN format.
              </p>
            )}
          </section>

          {/* Bank Account Section */}
          <section className="rounded-xl border-[0.5px] border-zinc-200/60 bg-zinc-50/10 p-4 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.01]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              <Landmark size={12} strokeWidth={2.5} /> Bank Account Details
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              <input
                required
                placeholder="IFSC Code"
                value={bankForm.ifsc_code}
                onChange={(event) => updateBankForm('ifsc_code', event.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 outline-none transition-all focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
              <input
                required
                placeholder="Account Number"
                type="password"
                value={bankForm.account_number}
                onChange={(event) => updateBankForm('account_number', event.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 outline-none transition-all focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
              <input
                required
                placeholder="Account Holder Name"
                value={bankForm.account_holder_name}
                onChange={(event) => updateBankForm('account_holder_name', event.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 outline-none transition-all focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
            </div>
          </section>

          {/* Minor Guardian Consent Section */}
          {isMinor && (
            <section className="rounded-xl border-[0.5px] border-amber-500/20 bg-amber-50/[0.02] p-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-3.5">
              <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 text-[11px]">
                <AlertTriangle size={13} className="text-amber-500" /> Parent / Guardian Approval
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <input
                  required
                  placeholder="Guardian Name"
                  value={bankForm.guardian_name}
                  onChange={(event) => updateBankForm('guardian_name', event.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 outline-none transition-all focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                />
                <select
                  className="w-full px-3 py-2.5 text-xs rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 outline-none text-zinc-800 dark:text-zinc-200"
                  value={bankForm.guardian_relationship}
                  onChange={(event) => updateBankForm('guardian_relationship', event.target.value)}
                >
                  <option value="Parent">Parent</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                </select>
              </div>
              
              <div className="flex items-start gap-3 bg-white/40 dark:bg-zinc-900/20 p-2.5 border-[0.5px] border-zinc-100 dark:border-zinc-900 rounded-lg">
                <input
                  type="checkbox"
                  id="payout_guardian_consent"
                  className="mt-0.5 rounded accent-zinc-900 dark:accent-zinc-100"
                  checked={bankForm.consent}
                  onChange={(event) => updateBankForm('consent', event.target.checked)}
                />
                <label htmlFor="payout_guardian_consent" className="text-[11px] leading-relaxed cursor-pointer font-normal text-zinc-500 dark:text-zinc-400 select-none">
                  I confirm this account belongs to my parent/guardian and approve setting up payouts for this profile.
                </label>
              </div>
            </section>
          )}

          {/* Action Footer Actions (Fixed Close/Cancel Option) */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 text-xs font-medium rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`flex-1 text-xs font-medium h-11 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 shadow-sm ${
                isSubmitDisabled 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'hover:bg-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? 'Linking account...' : 'Set Up Payout'}
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
};

export default PayoutKycModal;
