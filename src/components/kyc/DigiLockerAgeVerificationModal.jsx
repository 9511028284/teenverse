import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Fingerprint, Info, Loader2, ShieldAlert, AlertCircle, RotateCcw } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '../../supabase';
import { loadDigiboostSdk } from './digilockerSdk';
import { getUserDob, hasAgeVerification, isMinorUser } from './kycUtils';

const STATE_CONFIG = {
  idle: {
    accent: 'slate',
    glow: 'from-slate-500/5 via-transparent to-transparent',
    border: 'border-slate-200/60 dark:border-white/[0.06]',
    bg: 'bg-slate-50/30 dark:bg-white/[0.01]'
  },
  preparing: {
    accent: 'blue',
    glow: 'from-blue-500/10 via-transparent to-transparent',
    border: 'border-blue-500/20 dark:border-blue-500/15',
    bg: 'bg-blue-50/10 dark:bg-blue-500/[0.02]'
  },
  sdk_ready: {
    accent: 'indigo',
    glow: 'from-indigo-600/10 via-transparent to-transparent',
    border: 'border-indigo-500/20 dark:border-indigo-500/15',
    bg: 'bg-indigo-50/10 dark:bg-indigo-500/[0.02]'
  },
  sdk_error: {
    accent: 'rose',
    glow: 'from-rose-500/12 via-transparent to-transparent',
    border: 'border-rose-500/30 dark:border-rose-500/20',
    bg: 'bg-rose-50/10 dark:bg-rose-500/[0.02]'
  },
  success_anim: {
    accent: 'emerald',
    glow: 'from-emerald-500/15 via-transparent to-transparent',
    border: 'border-emerald-500/30 dark:border-emerald-500/20',
    bg: 'bg-emerald-50/10 dark:bg-emerald-500/[0.02]'
  },
  verified: {
    accent: 'emerald',
    glow: 'from-emerald-500/10 via-transparent to-transparent',
    border: 'border-emerald-500/20 dark:border-emerald-500/10',
    bg: 'bg-emerald-50/5 dark:bg-emerald-500/[0.01]'
  }
};

const DigiLockerAgeVerificationModal = ({ user, actions = {}, onClose }) => {
  const { handleDigilockerSuccess } = actions;
  const sdkMountRef = useRef(null);
  const sdkSessionRequestedRef = useRef(false);

  const [dlFlowState, setDlFlowState] = useState(hasAgeVerification(user) ? 'verified' : 'idle');
  const [notice, setNotice] = useState(null);

  const userDob = getUserDob(user);
  const isMinor = isMinorUser(user);
  const isAlreadyVerified = hasAgeVerification(user);

  const notify = (message, type = 'error') => {
    setNotice({ message, type });
  };

  useEffect(() => {
    if (isAlreadyVerified && dlFlowState !== 'success_anim') {
      setDlFlowState('verified');
    }
  }, [isAlreadyVerified, dlFlowState]);

  const prepareDigiLocker = async () => {
    if (isAlreadyVerified || sdkSessionRequestedRef.current) return;

    sdkSessionRequestedRef.current = true;
    setNotice(null);
    setDlFlowState('preparing');

    try {
      await loadDigiboostSdk();
      if (!sdkMountRef.current) throw new Error('Could not find secure mounting point.');
      if (!user?.id) throw new Error('User session not found.');

      const { data, error } = await supabase.functions.invoke('digilocker', {
        body: { action: 'CREATE_SESSION', user_id: user.id },
      });

      if (error || !data?.token) throw new Error(data?.error || 'Failed to create a secure session.');

      sdkMountRef.current.innerHTML = '';

      window.DigiboostSdk({
        gateway: 'production',
        token: data.token,
        selector: '#digilocker-sdk-mount',
        title: 'Continue with DigiLocker',
        style: {
          minHeight: '44px',
          padding: '12px 24px',
          backgroundColor: '#09090b',
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '13px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        onSuccess: (result) => {
          localStorage.removeItem('kyc_in_progress');
          const verificationId = result?.verification_id || result?.client_id || data.verification_id;
          setDlFlowState('success_anim');
          handleDigilockerSuccess?.(verificationId);
          setTimeout(() => setDlFlowState('verified'), 2000);
        },
        onFailure: (message) => {
          localStorage.removeItem('kyc_in_progress');
          notify(typeof message === 'string' ? message : 'Verification cancelled.');
        },
      });

      const markOpening = () => {
        localStorage.setItem('kyc_in_progress', 'true');
      };

      window.setTimeout(() => {
        const sdkButton = sdkMountRef.current?.querySelector('button');
        sdkButton?.addEventListener('click', markOpening);
      }, 0);

      setDlFlowState('sdk_ready');
    } catch (err) {
      console.error('KYC Error:', err);
      sdkSessionRequestedRef.current = false;
      setDlFlowState('sdk_error');
      notify(err.message || 'Connection failed.');
    }
  };

  const retryDigiLockerSetup = () => {
    sdkSessionRequestedRef.current = false;
    if (sdkMountRef.current) sdkMountRef.current.innerHTML = '';
    setNotice(null);
    setDlFlowState('idle');
  };

  const current = STATE_CONFIG[dlFlowState] || STATE_CONFIG.idle;
  const progressWidth = dlFlowState === 'verified' || dlFlowState === 'success_anim' ? '100%' : dlFlowState === 'sdk_ready' ? '70%' : '20%';

  return (
    <Modal title="" onClose={onClose}>
      <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950 px-1 pt-1 transition-colors duration-500">
        
        {/* Soft Ambient Background Glow */}
        <div 
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-b ${current.glow} blur-[80px] pointer-events-none transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) -z-10 mix-blend-screen`} 
        />

        {/* Minimal Progress Line */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-[2px] rounded-full overflow-hidden mb-8">
          <div 
            className="bg-zinc-900 dark:bg-zinc-50 h-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)" 
            style={{ width: progressWidth }} 
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8 select-none">
          <div className="relative w-14 h-14 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border-[0.5px] border-zinc-200/80 dark:border-white/[0.06] shadow-sm backdrop-blur-md overflow-hidden">
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:6px_6px] opacity-80" />
            
            <img 
              src="/assets/images/secure-verify.png" 
              alt="Shield" 
              className="w-8 h-8 object-contain relative z-10 transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-zinc-900 dark:text-zinc-100 relative z-10">
              <Fingerprint size={20} strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
            Verify Your Age
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[250px] mt-2 leading-relaxed font-normal">
            Connect your DigiLocker account to quickly confirm your age and unlock paid opportunities.
          </p>
        </div>

        {/* Notices & Errors */}
        {notice && (
          <div className={`mb-6 rounded-xl border-[0.5px] p-3.5 text-xs font-medium flex items-start gap-3 transition-all duration-300 animate-fade-in ${
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

        {/* Dynamic Action Container */}
        <div className={`p-5 rounded-xl border-[0.5px] transition-all duration-700 backdrop-blur-[2px] shadow-sm min-h-[140px] flex flex-col justify-between ${current.bg} ${current.border}`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <Fingerprint size={10} strokeWidth={2.5} /> Verification
            </span>
            {(dlFlowState === 'verified' || dlFlowState === 'success_anim') && (
              <span className="text-[10px] font-medium tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-[0.5px] border-emerald-500/20 px-2 py-0.5 rounded-md">
                Verified
              </span>
            )}
          </div>

          <div className="relative flex-1 flex flex-col justify-center">
            {dlFlowState === 'idle' && (
              <Button
                type="button"
                onClick={prepareDigiLocker}
                variant="primary"
                className="w-full bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium h-11 rounded-lg transition-all duration-200 text-xs shadow-sm flex items-center justify-center tracking-wide"
              >
                Verify with DigiLocker
              </Button>
            )}

            {dlFlowState === 'preparing' && (
              <div className="w-full rounded-lg border-[0.5px] border-zinc-200/50 bg-white dark:bg-zinc-900/40 dark:border-zinc-800/80 h-11 text-xs font-medium text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-2.5">
                <Loader2 size={12} className="animate-spin text-zinc-800 dark:text-zinc-200" />
                Connecting securely...
              </div>
            )}

            {dlFlowState === 'sdk_error' && (
              <div className="space-y-3 animate-fade-in py-1">
                <p className="text-xs text-rose-600 dark:text-rose-400/90 leading-relaxed font-normal">
                  Could not load DigiLocker. Please check your internet connection or disable ad blockers and try again.
                </p>
                <Button 
                  type="button" 
                  onClick={retryDigiLockerSetup} 
                  className="w-full h-9 rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={11} /> Try Again
                </Button>
              </div>
            )}

            {dlFlowState === 'sdk_ready' && (
              <div className="space-y-3 animate-fade-in py-1">
                <div className="bg-white/80 dark:bg-zinc-900/40 border-[0.5px] border-zinc-100 dark:border-zinc-900 p-3 rounded-lg flex items-start gap-2.5 mb-2">
                  <Info className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" size={13} />
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Connection ready. Click the button below to complete the verification in the official popup window.
                  </div>
                </div>
              </div>
            )}

            {/* Injected SDK Button Mount Container */}
            <div
              id="digilocker-sdk-mount"
              ref={sdkMountRef}
              className={dlFlowState === 'sdk_ready' ? 'relative block transition-all duration-300 transform scale-100 [&>button]:!w-full [&>button]:!shadow-none [&>button]:!text-xs [&>button]:!tracking-wide [&>button]:!h-11 [&>button]:!transition-all [&>button]:active:!scale-[0.99]' : 'hidden'}
            />

            {dlFlowState === 'success_anim' && (
              <div className="flex flex-col items-center justify-center py-2 space-y-2 animate-fade-in">
                <div className="w-9 h-9 bg-emerald-50/50 dark:bg-emerald-950/20 border-[0.5px] border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <CheckCircle2 size={16} className="animate-scale-up" />
                </div>
                <h4 className="font-medium text-zinc-800 text-xs dark:text-zinc-200">Verified Successfully</h4>
              </div>
            )}

            {dlFlowState === 'verified' && (
              <div className="space-y-4 animate-fade-in py-1">
                <div className="w-full rounded-lg border-[0.5px] border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 h-11 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 shadow-inner">
                  Age Verified {userDob ? `(${userDob})` : ''}
                </div>
                {isMinor && (
                  <div className="rounded-lg border-[0.5px] border-amber-500/20 bg-amber-50/[0.04] p-3 flex items-start gap-2.5">
                    <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      <strong>Note for under 18 users:</strong> A parent or guardian will need to provide approval before you can start paid tasks or receive payouts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DigiLockerAgeVerificationModal;