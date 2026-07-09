import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Fingerprint, Info, Loader2, ShieldAlert, AlertCircle, RotateCcw, Shield, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '../../supabase';
import { loadDigiboostSdk } from './digilockerSdk';
import { getUserDob, hasAgeVerification, isMinorUser } from './kycUtils';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STATE_CONFIG = {
  idle: {
    accent: 'indigo',
    glow: 'from-indigo-500/20 via-purple-500/5 to-transparent',
    border: 'border-slate-200 dark:border-slate-800/80',
    bg: 'bg-slate-50/50 dark:bg-slate-950/40'
  },
  preparing: {
    accent: 'blue',
    glow: 'from-blue-500/20 via-sky-500/5 to-transparent',
    border: 'border-blue-200 dark:border-blue-900/40',
    bg: 'bg-blue-50/30 dark:bg-blue-950/20'
  },
  sdk_ready: {
    accent: 'violet',
    glow: 'from-violet-500/20 via-fuchsia-500/5 to-transparent',
    border: 'border-violet-200 dark:border-violet-900/40',
    bg: 'bg-violet-50/30 dark:bg-violet-950/20'
  },
  sdk_error: {
    accent: 'rose',
    glow: 'from-rose-500/20 via-orange-500/5 to-transparent',
    border: 'border-rose-200 dark:border-rose-900/40',
    bg: 'bg-rose-50/30 dark:bg-rose-950/20'
  },
  success_anim: {
    accent: 'emerald',
    glow: 'from-emerald-500/25 via-teal-500/5 to-transparent',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    bg: 'bg-emerald-50/30 dark:bg-emerald-950/20'
  },
  verified: {
    accent: 'emerald',
    glow: 'from-emerald-500/20 via-transparent to-transparent',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    bg: 'bg-emerald-50/10 dark:bg-emerald-950/10'
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
        title: 'Continue with DigiLocker 🚀',
        style: {
          minHeight: '48px',
          padding: '12px 24px',
          backgroundColor: '#4f46e5',
          color: '#ffffff',
          borderRadius: '16px',
          fontWeight: '700',
          fontSize: '14px',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          width: '100%',
          cursor: 'pointer'
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
  const progressWidth = dlFlowState === 'verified' || dlFlowState === 'success_anim' ? '100%' : dlFlowState === 'sdk_ready' ? '75%' : dlFlowState === 'preparing' ? '40%' : '15%';

  return (
    <Modal title="" onClose={onClose}>
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl px-2 pt-2 transition-colors duration-500 select-none">
        
        {/* Real-time Hardware-Accelerated 3D Mesh Gradient Backdrop */}
        <div 
          className={cn(
            "absolute -top-40 left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full bg-gradient-to-tr blur-[64px] pointer-events-none transition-all duration-700 -z-10 mix-blend-multiply dark:mix-blend-screen opacity-80 dark:opacity-40",
            current.glow
          )} 
        />

        {/* Sleek Progress Bar Accent */}
        <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden mb-6 p-[2px]">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: progressWidth }} 
          />
        </div>

        {/* 3D Visual Centerpiece */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center perspective-[1000px]">
            {/* 3D Glass Layer Elements */}
            <motion.div 
              animate={{ rotateY: [-10, 10, -10], rotateX: [5, -5, 5] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative w-16 h-16 bg-gradient-to-tr from-indigo-500/10 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/30 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(99,102,241,0.15)] flex items-center justify-center transform-style-3d"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              <Shield size={32} className="text-indigo-600 dark:text-indigo-400 drop-shadow-[0_4px_12px_rgba(99,102,241,0.3)] font-light" strokeWidth={1.5} />
              
              {/* Floating Orbiting Biometric Node */}
              <motion.div 
                animate={{ z: [10, 25, 10], y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -right-1 -bottom-1 w-7 h-7 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-purple-500 transform translate-z-[20px]"
              >
                <Fingerprint size={14} strokeWidth={2} />
              </motion.div>
            </motion.div>
          </div>
          
          <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
            Age Verification
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mt-1.5 leading-relaxed font-medium">
            Link with DigiLocker to instantly verify your profile age and start taking on high-paying gigs.
          </p>
        </div>

        {/* Interactive Notification Feed */}
        <AnimatePresence mode="wait">
          {notice && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "mb-5 rounded-2xl border p-3.5 text-xs font-semibold flex items-start gap-3 shadow-sm",
                notice.type === 'success' 
                  ? 'border-emerald-100 bg-emerald-50/50 text-emerald-800 dark:border-emerald-950/60 dark:bg-emerald-950/30 dark:text-emerald-400' 
                  : 'border-rose-100 bg-rose-50/50 text-rose-800 dark:border-rose-950/60 dark:bg-rose-950/30 dark:text-rose-400'
              )}
            >
              {notice.type === 'error' ? (
                <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
              )}
              <span className="leading-relaxed flex-1">{notice.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactile Flow Card Base */}
        <div className={cn(
          "p-5 rounded-2xl border transition-all duration-500 backdrop-blur-[1px] min-h-[130px] flex flex-col justify-between shadow-sm",
          current.bg, current.border
        )}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint size={12} strokeWidth={2.5} /> Secure Link
            </span>
            {(dlFlowState === 'verified' || dlFlowState === 'success_anim') && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Check size={10} strokeWidth={3} /> Active
              </span>
            )}
          </div>

          <div className="relative flex-1 flex flex-col justify-center">
            {dlFlowState === 'idle' && (
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="button"
                  onClick={prepareDigiLocker}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold h-12 rounded-2xl transition-all text-xs tracking-wide shadow-md shadow-slate-900/10 dark:shadow-none"
                >
                  Verify with DigiLocker
                </Button>
              </motion.div>
            )}

            {dlFlowState === 'preparing' && (
              <div className="w-full rounded-2xl border border-slate-200/60 bg-white dark:bg-slate-900 dark:border-slate-800/80 h-12 text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-3 shadow-inner">
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                Initializing secured channel...
              </div>
            )}

            {dlFlowState === 'sdk_error' && (
              <div className="space-y-3 py-0.5">
                <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-semibold">
                  Setup failed. Check your network or clear tracking blockers, then retry.
                </p>
                <Button 
                  type="button" 
                  onClick={retryDigiLockerSetup} 
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={12} /> Try Again
                </Button>
              </div>
            )}

            {dlFlowState === 'sdk_ready' && (
              <div className="space-y-3 py-0.5">
                <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-950 p-3 rounded-xl flex items-start gap-2.5 mb-2">
                  <Info className="text-indigo-500 shrink-0 mt-0.5" size={14} />
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Secure line open. Tap the button below to finish processing in your browser popup window.
                  </div>
                </div>
              </div>
            )}

            {/* Injected SDK Native Mount Container */}
            <div
              id="digilocker-sdk-mount"
              ref={sdkMountRef}
              className={dlFlowState === 'sdk_ready' ? 'relative block transition-all duration-300 transform scale-100 [&>button]:!w-full [&>button]:!shadow-lg [&>button]:!text-xs [&>button]:!font-bold [&>button]:!tracking-wide [&>button]:!h-12 [&>button]:!rounded-2xl [&>button]:!transition-all [&>button]:active:!scale-[0.99]' : 'hidden'}
            />

            {dlFlowState === 'success_anim' && (
              <div className="flex flex-col items-center justify-center py-1 space-y-2">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                  <CheckCircle2 size={18} className="animate-bounce" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs dark:text-slate-200">System Link Confirmed</h4>
              </div>
            )}

            {dlFlowState === 'verified' && (
              <div className="space-y-3.5 py-0.5">
                <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 h-12 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-inner">
                  Identity Active {userDob ? `(${userDob})` : ''}
                </div>
                {isMinor && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5">
                    <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                      <strong>Guardians note:</strong> Accounts under 18 require secondary guardian confirmation parameters initialized before processing payouts.
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