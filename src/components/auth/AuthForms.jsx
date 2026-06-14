'use client'

import React, { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Eye, EyeOff, Loader2, Check, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { getPasswordSecurityStatus } from '../../utils/passwordSecurity';

// ─── STYLING SYSTEM PARAMETERS ───────────────────────────────────────────────
const serif = { fontFamily: 'var(--font-kibitz, "Cormorant Garamond", "EB Garamond", Georgia, serif)', fontWeight: 300 };
const mono  = { fontFamily: 'var(--font-mono, "Space Mono", ui-monospace, monospace)', fontWeight: 400 };

// ─── STAGGERED SPRING ANIMATION VARIANTS ─────────────────────────────────────
const viewVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.04, delayChildren: 0.02 } 
  },
  exit: { opacity: 0, x: 16, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

const stepVariants = {
  enter: (dir) => ({
    opacity: 0,
    x: dir > 0 ? 30 : -30,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir > 0 ? -30 : 30,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  })
};

// ─── BRAND ASSETS & GEOMETRIC BACKDROPS ──────────────────────────────────────
const GoogleIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
));

const GithubIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-current text-neutral-900 dark:text-zinc-100">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
));

const VisualLogoMark = memo(() => (
  <div className="inline-flex items-center justify-center gap-2 font-bold text-2xl tracking-tight select-none mb-10 box-border">
    <span className="text-neutral-900 dark:text-zinc-50 tracking-tighter"></span>
  </div>
));

const RightPanelSplit = memo(() => {
  const reduced = useReducedMotion();
  return (
    <div className="relative hidden w-full h-full lg:flex flex-col items-center justify-center bg-neutral-50 border-l border-neutral-200/60 dark:bg-zinc-900/30 dark:border-zinc-900 overflow-hidden px-12 text-center select-none box-border">
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        <motion.div animate={reduced ? {} : { y: [0, -12, 0], scale: [1, 1.03, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-12 left-16 h-36 w-36 rounded-full bg-gradient-to-tr from-blue-400/15 to-indigo-500/5 blur-2xl" />
        <motion.div animate={reduced ? {} : { y: [0, 16, 0], x: [0, -8, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 right-12 h-48 w-48 rounded-full bg-gradient-to-br from-amber-400/15 to-orange-500/5 blur-3xl" />
        <div className="absolute top-1/4 right-20 w-36 h-36 bg-fuchsia-500/[0.03] rounded-[40px] rotate-45 border border-fuchsia-500/10" />
        <div className="absolute bottom-1/4 left-14 w-28 h-14 bg-emerald-400/[0.06] rounded-b-full" />
        <div className="absolute top-12 right-12 opacity-[0.02] bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:12px_12px] w-48 h-48" />
      </div>

      <div className="relative z-10 max-w-md space-y-4 box-border">
        <h3 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-zinc-50 leading-[1.15] sm:text-4xl" style={serif}>
          Changing the way the world creates.
        </h3>
        <p className="text-sm leading-relaxed text-neutral-500 dark:text-zinc-400 max-w-sm mx-auto">
          Connect with curated young digital talent, map project parameters safely, and explore verified portfolio environments with confidence.
        </p>
      </div>
    </div>
  )
});

const ActionButton = ({ onClick, loading, disabled, icon: Icon, children, className, type = "button", ...props }) => (
  <button 
    type={type}
    onClick={onClick} 
    disabled={loading || disabled} 
    className={`w-full h-11 px-5 font-semibold text-[14px] rounded-xl transition-all duration-200 flex justify-center items-center gap-2 overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none tracking-tight box-border ${className || 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-sm'}`}
    {...props}
  >
     <AnimatePresence mode="wait">
       {loading ? (
         <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
           <Loader2 className="animate-spin" size={16}/>
         </motion.div>
       ) : (
         <motion.span key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 w-full box-border">
           {children} {Icon && <Icon size={14} className="shrink-0" />}
         </motion.span>
       )}
     </AnimatePresence>
  </button>
);

const SocialBtn = ({ onClick, icon, label }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className="w-full h-10 border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 rounded-md flex items-center justify-center gap-2 text-sm font-medium text-neutral-800 dark:text-zinc-200 transition-all shadow-sm active:scale-[0.99] box-border"
  >
    {icon} <span>Sign in with {label}</span>
  </button>
);

let googleIdentityInitializedClientId = null;
let googleCredentialHandler = null;

const dispatchGoogleCredential = (response) => {
  googleCredentialHandler?.(response);
};

const GoogleIdentityButton = memo(({ loading, onCredentialResponse, showToast }) => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const renderedWidthRef = useRef(0);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return undefined;
    googleCredentialHandler = onCredentialResponse;

    let cancelled = false;
    let retryTimer = null;
    let resizeObserver = null;

    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
      const width = Math.min(400, Math.max(200, Math.floor(containerRef.current?.clientWidth || 0)));
      if (renderedWidthRef.current === width && buttonRef.current.children.length > 0) return;

      if (googleIdentityInitializedClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: dispatchGoogleCredential,
          ux_mode: 'popup',
        });
        googleIdentityInitializedClientId = clientId;
      }

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width,
      });
      renderedWidthRef.current = width;
    };

    const waitForGoogleIdentity = () => {
      if (window.google?.accounts?.id) {
        renderButton();
      } else if (!cancelled) {
        retryTimer = window.setTimeout(waitForGoogleIdentity, 100);
      }
    };

    waitForGoogleIdentity();

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(renderButton);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      if (googleCredentialHandler === onCredentialResponse) googleCredentialHandler = null;
      if (retryTimer) window.clearTimeout(retryTimer);
      resizeObserver?.disconnect();
    };
  }, [clientId, onCredentialResponse]);

  if (!clientId) {
    return (
      <button
        type="button"
        onClick={() => showToast("Google sign-in is not configured.")}
        className="w-full h-10 border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 rounded-md flex items-center justify-center gap-2 text-sm font-medium text-neutral-800 dark:text-zinc-200 transition-all shadow-sm active:scale-[0.99] box-border"
      >
        <GoogleIcon />
        <span>Sign in with Google</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0 h-10 overflow-hidden rounded-md box-border">
      <div ref={buttonRef} className={`h-10 transition-opacity ${loading ? 'pointer-events-none opacity-50' : ''}`} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/70 text-neutral-700 backdrop-blur-[1px] dark:bg-zinc-900/70 dark:text-zinc-200">
          <Loader2 className="animate-spin" size={16} />
        </div>
      )}
    </div>
  );
});

const StepBar = ({ step, total = 4 }) => (
  <div className="flex gap-1.5 mb-6 select-none box-border">
    {Array.from({ length: total }).map((_, i) => (
      <div 
        key={i} 
        className={`h-1 rounded-full transition-all duration-300 box-border ${
          i + 1 < step ? 'bg-indigo-600 dark:bg-zinc-200 flex-1' : 
          i + 1 === step ? 'bg-indigo-600 dark:bg-zinc-200 flex-[2]' : 
          'bg-neutral-100 dark:bg-zinc-800 flex-1'
        }`} 
      />
    ))}
  </div>
);

const PasswordSecurityPanel = memo(({ password }) => {
  const status = getPasswordSecurityStatus(password);
  const active = password.length > 0;
  const strengthLabel = status.isStrong ? 'Strong password' : active ? 'Keep strengthening' : 'Password security';

  return (
    <div className={`rounded-xl border p-3 transition-all box-border ${status.isStrong ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20' : 'border-neutral-200 bg-neutral-50/50 dark:border-zinc-800 dark:bg-zinc-900/30'}`}>
      <div className="flex items-center justify-between gap-3 box-border">
        <div className="flex min-w-0 items-center gap-2 box-border">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${status.isStrong ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-white text-neutral-500 dark:bg-zinc-950 dark:text-zinc-400'}`}>
            <ShieldCheck size={14} />
          </span>
          <div className="min-w-0 box-border">
            <p className={`text-xs font-bold leading-tight ${status.isStrong ? 'text-emerald-800 dark:text-emerald-300' : 'text-neutral-800 dark:text-zinc-200'}`}>{strengthLabel}</p>
            <p className="text-[10px] font-medium text-neutral-400 dark:text-zinc-500 leading-tight">Required for account security</p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-mono font-bold ${status.isStrong ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-400 dark:text-zinc-500'}`}>
          {status.passedCount}/{status.total}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white dark:bg-zinc-950 box-border">
        <div className={`h-full rounded-full transition-all duration-300 ${status.isStrong ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-zinc-200'}`} style={{ width: `${status.progress}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 box-border">
        {status.checks.map((check) => (
          <div key={check.id} className={`flex min-w-0 items-center gap-1.5 text-[11px] font-semibold box-border ${check.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-400 dark:text-zinc-500'}`}>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border box-border ${check.passed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 bg-white dark:border-zinc-700 dark:bg-zinc-950'}`}>
              {check.passed && <Check size={9} strokeWidth={3} />}
            </span>
            <span className="truncate">{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── MINIMAL CALENDAR COMPONENT ──────────────────────────────────────────────
const CustomCalendar = ({ selectedDateStr, onDateSelect, showToast }) => {
  const minAge = 14; const maxAge = 25; const today = new Date();
  const minYear = today.getFullYear() - maxAge; const maxYear = today.getFullYear() - minAge;
  const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null;

  const [calYear, setCalYear] = useState(selectedDate ? selectedDate.getFullYear() : maxYear);
  const [calMonth, setCalMonth] = useState(selectedDate ? selectedDate.getMonth() : today.getMonth());
  const [yearView, setYearView] = useState(false);

  const handleCalNav = (dir) => {
    if (yearView) return;
    let newMonth = calMonth + dir; let newYear = calYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newYear < minYear) newYear = minYear; if (newYear > maxYear) newYear = maxYear;
    setCalMonth(newMonth); setCalYear(newYear);
  };

  const handleSelectDay = (d) => {
    const date = new Date(calYear, calMonth, d);
    const todayD = new Date();
    let calcAge = todayD.getFullYear() - date.getFullYear();
    const m = todayD.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && todayD.getDate() < date.getDate())) calcAge--;

    if (calcAge < minAge || calcAge > maxAge) {
      showToast(`Platform is for ages ${minAge}–${maxAge} only.`, 'error'); return;
    }
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    onDateSelect(localDate.toISOString().split('T')[0], calcAge);
  };

  return (
    <div className="border border-neutral-200 bg-neutral-50/50 p-4 rounded-xl dark:border-zinc-800 dark:bg-zinc-900/30 box-border w-full">
      <div className="flex items-center justify-between mb-3 box-border">
        <button type="button" onClick={() => handleCalNav(-1)} className="h-6 w-6 rounded border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:border-zinc-800 transition-colors box-border">&larr;</button>
        <span onClick={() => setYearView(!yearView)} className="text-xs font-bold text-neutral-800 dark:text-zinc-200 cursor-pointer select-none hover:text-indigo-600 transition-colors">
          {yearView ? 'Select Year' : `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calMonth]} ${calYear}`}
        </span>
        <button type="button" onClick={() => handleCalNav(1)} className="h-6 w-6 rounded border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:border-zinc-800 transition-colors box-border">&rarr;</button>
      </div>
      {yearView ? (
        <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto p-1 custom-scrollbar box-border">
          {Array.from({ length: maxYear - minYear + 1 }).map((_, i) => {
            const y = maxYear - i;
            return (
              <button key={y} type="button" onClick={() => { setCalYear(y); setYearView(false); }} className={`p-1.5 rounded text-xs transition-colors box-border ${y === calYear ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-600 dark:text-zinc-400'}`}>{y}</button>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] box-border">
          {['S','M','T','W','T','F','S'].map((d, i) => <span key={`${d}-${i}`} className="font-bold text-neutral-400 py-1 select-none box-border">{d}</span>)}
          {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => <div key={i} className="aspect-square box-border" />)}
          {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
            const d = i + 1; const isSel = selectedDate && new Date(calYear, calMonth, d).toDateString() === selectedDate.toDateString();
            return <button key={d} type="button" onClick={() => handleSelectDay(d)} className={`aspect-square rounded-lg flex items-center justify-center transition-colors text-xs font-medium box-border ${isSel ? 'bg-indigo-600 text-white font-bold' : 'text-neutral-700 dark:text-zinc-300 hover:bg-neutral-200/50 dark:hover:bg-zinc-800'}`}>{d}</button>
          })}
        </div>
      )}
    </div>
  );
};

// ─── 1. LOGIN VIEW ───────────────────────────────────────────────────────────
export const LoginView = memo(({ state, actions, turnstileRef }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 box-border">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 xl:px-32 relative z-10 box-border">
        <motion.form 
          key="login-form" 
          onSubmit={(e) => { e.preventDefault(); actions.handleFinalSubmit(); }}
          variants={viewVariants} 
          initial="hidden" 
          animate="visible" 
          exit="exit" 
          className="w-full max-w-sm mx-auto box-border"
        >
          <VisualLogoMark />
          
          <motion.div variants={itemVariants} className="space-y-1 mb-6 box-border">
             <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Login</h2>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-3 mb-4 box-border w-full">
             <GoogleIdentityButton loading={state.googleLoading} onCredentialResponse={actions.handleGoogleCredentialResponse} showToast={actions.showToast} />
             <SocialBtn icon={<GithubIcon />} onClick={actions.handleGithubLogin} label="GitHub" />
          </motion.div>
           
          <motion.div variants={itemVariants} className="flex items-center gap-3 my-6 text-neutral-400 dark:text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-wider before:flex-1 before:h-px before:bg-neutral-200/70 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-neutral-200/70 dark:after:bg-zinc-800 box-border">
             Or sign in with email
          </motion.div>

          <div className="space-y-3.5 box-border">
            <motion.div variants={itemVariants} className="box-border">
               <input type="email" placeholder="Email" className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-500" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} />
            </motion.div>

            <motion.div variants={itemVariants} className="relative flex items-center box-border">
               <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 pr-10 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400 dark:placeholder:text-zinc-500" value={state.formData.password} onChange={(e) => actions.updateField('password', e.target.value)} />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg outline-none box-border">
                 {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
               </button>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="flex items-center justify-between my-4 text-xs select-none box-border">
            <label className="flex items-center gap-2 text-neutral-500 dark:text-zinc-400 cursor-pointer font-semibold box-border">
              <input
                type="checkbox"
                checked={state.rememberMe}
                onChange={(e) => actions.setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-0 accent-indigo-600 h-3.5 w-3.5 box-border"
              />
              <span>Keep me logged in</span>
            </label>
            <button type="button" onClick={() => actions.setViewMode('forgot')} className="font-bold text-indigo-600 dark:text-zinc-400 hover:text-indigo-700 dark:hover:text-zinc-200 transition-colors">Forgot password?</button>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-5 box-border">
              {state.CLOUDFLARE_SITE_KEY && (
                  <div className="flex justify-center py-2 bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl mb-4 min-h-[65px] items-center box-border">
                      <Turnstile ref={turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} onError={() => actions.setCaptchaToken(null)} theme="light" />
                  </div>
              )}
              <ActionButton type="submit" loading={state.loading}>
                 Login
              </ActionButton>
          </motion.div>
           
          <motion.div variants={itemVariants} className="text-center text-xs text-neutral-500 dark:text-zinc-400 mt-6 select-none box-border">
             Don’t have an account? <button type="button" onClick={() => actions.setViewMode('signup')} className="font-bold text-indigo-600 dark:text-zinc-400 hover:text-indigo-700 dark:hover:text-zinc-200 transition-colors">Sign up</button>
          </motion.div>
        </motion.form>
      </div>
      <RightPanelSplit />
    </div>
  );
});

// ─── 2. SIGNUP VIEW ──────────────────────────────────────────────────────────
export const SignupView = memo(({ state, actions, turnstileRef }) => {
  const { step, formData, isPhoneVerified, phoneOtpSent, phoneOtp, otpLoading, otpAction, socialUser, agreedToTerms } = state;
  const calculatedAge = formData.age || state.age || (formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : null);
  const passwordStatus = getPasswordSecurityStatus(formData.password);
  const rawPhone = String(formData.phone || '');
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const displayPhone = rawPhone.startsWith('+91') || (phoneDigits.length === 12 && phoneDigits.startsWith('91'))
    ? phoneDigits.slice(2)
    : phoneDigits;
  
  const direction = 1;

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 box-border">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 xl:px-32 relative z-10 box-border overflow-hidden">
        <div className="w-full max-w-sm mx-auto box-border relative flex flex-col min-h-[480px]">
          
          <button type="button" onClick={step > 1 ? actions.handleBack : () => actions.setViewMode('login')} className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-zinc-200 transition-colors mb-6 border-none bg-transparent p-0 outline-none box-border w-fit">
              <ArrowLeft size={13} /> Back
          </button>

          {step > 1 && <StepBar step={step} />}

          <div className="relative flex-1 w-full box-border">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                {/* STEP 1: PATH CHOICE */}
                {step === 1 && (
                    <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-5 box-border w-full">
                        <div className="space-y-1 box-border">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Choose your path.</h2>
                            <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">Select an entry module into the ecosystem track.</p>
                        </div>
                        
                        <div className="flex flex-col gap-3 box-border w-full">
                            {['freelancer', 'client'].map((r) => (
                                <button 
                                    key={r} 
                                    type="button"
                                    onClick={() => actions.updateField('role', r)} 
                                    className={`p-4 border rounded-xl text-left transition-all duration-200 relative overflow-hidden flex items-start gap-3.5 box-border w-full outline-none
                                    ${formData.role === r ? 'border-neutral-900 bg-neutral-50/50 dark:border-zinc-100 dark:bg-zinc-900/40 shadow-sm' : 'border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 hover:border-neutral-300'}`}
                                >
                                    <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-base select-none ${r === 'freelancer' ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'bg-amber-50 dark:bg-amber-950/40'}`}>
                                        {r === 'freelancer' ? '🚀' : '🏢'}
                                    </div>
                                    <div className="space-y-1 max-w-[80%] box-border">
                                        <div className="text-sm font-bold text-neutral-900 dark:text-zinc-100">{r === 'freelancer' ? "I'm a Creator" : "I'm a Hirer"}</div>
                                        <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">{r === 'freelancer' ? 'Build profile proof, verify capabilities, and capture real project micro-tasks.' : 'Discover native student talent workflows and secure collaborative deliverables cleanly.'}</p>
                                    </div>
                                    <div className={`absolute right-3.5 top-4 w-4 h-4 rounded-full bg-neutral-900 dark:bg-zinc-100 flex items-center justify-center transition-all ${formData.role === r ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                                        <Check size={9} className="text-white dark:text-zinc-950" strokeWidth={3} />
                                    </div>
                                </button>
                            ))}
                        </div>

                        <ActionButton onClick={actions.handleNext} disabled={!formData.role} loading={state.loading}>
                            Continue
                        </ActionButton>
                    </motion.div>
                )}

                {/* STEP 2: CREDENTIALS */}
                {step === 2 && !socialUser && (
                    <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-4 box-border w-full">
                        <div className="space-y-1 box-border">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Credentials.</h2>
                            <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">Enter your email and create a secure password.</p>
                        </div>
                        
                        <div className="space-y-3 box-border w-full">
                            <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => actions.updateField('email', e.target.value)} className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" />
                            <input type="password" value={formData.password} onChange={(e) => actions.updateField('password', e.target.value)} className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" placeholder="Password (7+ chars, Aa, 0-9, special)"/>
                            <PasswordSecurityPanel password={formData.password} />
                        </div>

                        <ActionButton onClick={actions.handleNext} loading={state.loading} disabled={!formData.email || !passwordStatus.isStrong}>
                            Continue
                        </ActionButton>
                    </motion.div>
                )}

                {/* STEP 3: METADATA DETAILS */}
                {step === 3 && (
                    <motion.div key="step3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-4 box-border w-full">
                        <div className="space-y-1 box-border">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Profile setup.</h2>
                            <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">{formData.role === 'client' ? 'Tell us about your organization.' : 'Add your details so we can verify eligibility.'}</p>
                        </div>
                        
                        <div className="space-y-3 box-border w-full">
                            <input value={formData.name || ''} onChange={(e) => actions.updateField('name', e.target.value)} className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" placeholder="Full Name"/>

                            {formData.role === 'freelancer' ? (
                                <div className="space-y-3 box-border w-full">
                                    <div className="border border-neutral-200 dark:border-zinc-800 rounded-xl p-3 bg-neutral-50/20 box-border w-full">
                                        <div className="flex items-center justify-between mb-2.5 select-none box-border">
                                            <span className="text-xs font-bold text-neutral-400">Date of Birth</span>
                                            {calculatedAge && <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded tracking-wide font-mono" style={mono}>{calculatedAge} Yrs</span>}
                                        </div>
                                        <CustomCalendar selectedDateStr={formData.dob} onDateSelect={(dateStr, age) => { actions.updateField('dob', dateStr); actions.updateField('age', age); }} showToast={actions.showToast} />
                                    </div>
                                    
                                    <div className="flex gap-2 box-border w-full">
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <button key={g} type="button" onClick={() => actions.updateField('gender', g)} className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-all outline-none box-border ${formData.gender === g ? 'border-neutral-900 bg-neutral-50 text-neutral-900 dark:border-zinc-100 dark:bg-zinc-900' : 'border-neutral-200 text-neutral-400 dark:border-zinc-800'}`}>{g}</button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <input placeholder="Organization Name (Optional)" value={formData.org || ''} onChange={(e) => actions.updateField('org', e.target.value)} className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" />
                            )}

                            {state.CLOUDFLARE_SITE_KEY && !isPhoneVerified && (
                                <div className="flex justify-center py-2 bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl min-h-[65px] items-center box-border w-full">
                                    <Turnstile ref={turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} onError={() => actions.setCaptchaToken(null)} theme="light" />
                                </div>
                            )}

                            <div className="flex gap-2 box-border w-full">
                                <div className="relative flex items-center flex-1 box-border">
                                    <span className="absolute left-3 text-xs font-bold text-neutral-400 font-mono select-none font-mono" style={mono}>+91</span>
                                    <input type="tel" value={displayPhone} onChange={(e) => actions.updateField('phone', e.target.value.replace(/\D/g, ''))} disabled={isPhoneVerified || otpLoading} className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 pl-11 pr-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400 disabled:opacity-70" placeholder="Phone Number"/>
                                </div>
                                <button type="button" onClick={actions.handleSendPhoneOtp} disabled={otpLoading || isPhoneVerified || !displayPhone} className={`h-11 px-4 rounded-xl text-xs font-bold border transition-colors shadow-sm outline-none shrink-0 min-w-[86px] flex items-center justify-center box-border ${isPhoneVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400' : phoneOtpSent ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/70 dark:text-indigo-300' : 'bg-neutral-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white'}`}>
                                    {otpAction === 'send' ? <Loader2 className="animate-spin" size={14} /> : isPhoneVerified ? 'Verified' : phoneOtpSent ? 'Sent' : 'Send OTP'}
                                </button>
                            </div>

                            {phoneOtpSent && !isPhoneVerified && (
                                <div className="rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/30 p-3 space-y-3 box-border w-full">
                                    <div className="flex items-center justify-between gap-3 box-border">
                                        <div className="min-w-0 box-border">
                                            <p className="text-xs font-bold text-neutral-800 dark:text-zinc-200 leading-tight">Enter OTP</p>
                                            <p className="text-[10px] text-neutral-400 dark:text-zinc-500 leading-tight">Sent to +91 {displayPhone}</p>
                                        </div>
                                        <button type="button" onClick={actions.handleRetryPhoneOtp} disabled={otpLoading} className="shrink-0 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 dark:text-indigo-300 dark:hover:text-indigo-200">
                                            {otpAction === 'retry' ? 'Resending...' : 'Resend'}
                                        </button>
                                    </div>

                                    <div className="flex gap-2 box-border w-full">
                                        <input inputMode="numeric" maxLength={6} value={phoneOtp} onChange={(e) => actions.setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-11 flex-1 min-w-0 border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 rounded-xl text-center text-lg font-mono font-bold tracking-[0.35em] outline-none transition-all box-border focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-300" placeholder="000000" style={mono} />
                                        <button type="button" onClick={actions.handleVerifyPhoneOtp} disabled={otpLoading || phoneOtp.length < 4} className="h-11 px-4 rounded-xl text-xs font-bold border border-neutral-900 bg-neutral-900 text-white hover:bg-black disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white min-w-[74px] flex items-center justify-center box-border">
                                            {otpAction === 'verify' ? <Loader2 className="animate-spin" size={14} /> : 'Verify'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isPhoneVerified && (
                                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300 box-border w-full">
                                    <Check size={13} strokeWidth={3} />
                                    Mobile number verified
                                </div>
                            )}
                        </div>

                        <ActionButton onClick={actions.handleNext} loading={state.loading}>
                            Continue
                        </ActionButton>
                    </motion.div>
                )}

                {/* STEP 4: ACKNOWLEDGEMENTS */}
                {step === 4 && (
                    <motion.div key="step4" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-4 box-border w-full">
                        <div className="space-y-1 box-border">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Verification.</h2>
                            <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">Review your details and finish account setup.</p>
                        </div>
                        
                        <div className="space-y-4 box-border w-full">
                          <div className="flex flex-wrap gap-1.5 box-border w-full">
                              {['YouTube', 'Instagram', 'LinkedIn', 'Friend', 'School', 'Other'].map(opt => (
                                  <button key={opt} type="button" onClick={() => actions.updateField('source', opt)} className={`px-3 py-1.5 border text-xs rounded-full font-semibold transition-all outline-none box-border ${formData.source === opt ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-zinc-100 dark:text-zinc-950' : 'border-neutral-200 text-neutral-400 dark:border-zinc-800 hover:border-neutral-300'}`}>{opt}</button>
                              ))}
                          </div>

                          <input value={formData.referralCode || ''} onChange={(e) => actions.updateField('referralCode', e.target.value.toUpperCase())} className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border uppercase font-mono tracking-wider focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" style={mono} placeholder="Referral Code (Optional)"/>

                          <div className="flex items-start gap-2.5 pt-1 box-border w-full">
                              <button type="button" onClick={() => actions.setAgreedToTerms(!agreedToTerms)} className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors outline-none box-border ${agreedToTerms ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-300 bg-neutral-50 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                                  {agreedToTerms && <Check size={10} strokeWidth={3} />}
                              </button>
                              <p className="text-xs leading-normal text-neutral-400 dark:text-zinc-500 font-medium select-none box-border">
                                  I verify that I am between 14–25 years of age and explicitly consent to the operational <a href="/legal" className="underline font-bold text-neutral-600 dark:text-zinc-300">Terms of Service</a> and tracking policies.
                              </p>
                          </div>
                      </div>

                      {state.CLOUDFLARE_SITE_KEY && (
                          <div className="flex justify-center py-2 bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl min-h-[65px] items-center box-border w-full">
                              <Turnstile ref={turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} onError={() => actions.setCaptchaToken(null)} theme="light" />
                          </div>
                      )}
                      
                      <ActionButton onClick={actions.handleFinalSubmit} loading={state.loading} disabled={!agreedToTerms}>
                          Create Account
                      </ActionButton>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <RightPanelSplit />
    </div>
  );
});

// ─── 3. FORGOT PASSWORD VIEW ──────────────────────────────────────────────────
export const ForgotPasswordView = memo(({ state, actions, turnstileRef }) => {
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 box-border">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 xl:px-32 relative z-10 box-border">
        <motion.div key="forgot-form" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="w-full max-w-sm mx-auto box-border">
          
          <button type="button" onClick={() => actions.setViewMode('login')} className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-zinc-200 transition-colors mb-6 border-none bg-transparent p-0 outline-none box-border">
              <ArrowLeft size={13} /> Return to login
          </button>
           
          <AnimatePresence mode="wait">
            {!state.showResetVerify ? (
                <motion.div key="request-track" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5 box-border w-full">
                    <div className="space-y-1 box-border">
                      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Reset access.</h2>
                      <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">Enter your email to receive a reset code.</p>
                    </div>
                    
                    <form onSubmit={actions.handleForgotPassword} className="space-y-4 box-border w-full">
                      <input type="email" placeholder="Email Address" className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-950 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} required />
                       
                      {state.CLOUDFLARE_SITE_KEY && (
                          <div className="flex justify-center py-2 bg-neutral-50 dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl min-h-[65px] items-center box-border w-full">
                              <Turnstile ref={turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} onError={() => actions.setCaptchaToken(null)} theme="light" />
                          </div>
                      )}
                      <ActionButton type="submit" loading={state.loading}>
                          Send Verification Code
                      </ActionButton>
                    </form>
                </motion.div>
            ) : (
                <motion.div key="verification-track" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5 box-border w-full">
                    <div className="space-y-1 box-border">
                      <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>Verify token.</h2>
                      <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">Enter the 6-digit code from your inbox.</p>
                    </div>
                    
                    <input className="w-full h-11 text-center text-xl tracking-[0.4em] font-mono font-bold border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 rounded-xl outline-none transition-all box-border focus:bg-white focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" placeholder="000000" maxLength={6} value={state.resetOtp} onChange={(e) => actions.setResetOtp(e.target.value)} style={mono} />
                    
                    <ActionButton onClick={actions.handleVerifyResetOTP} loading={state.loading}>
                        Verify Code
                    </ActionButton>
                    
                    <div className="text-center text-xs text-neutral-400 space-y-3 pt-1 select-none box-border">
                        <p>Didn't get it? <button type="button" onClick={() => actions.showToast('Code resent!','success')} className="font-bold text-neutral-700 dark:text-zinc-200 hover:text-neutral-900 transition-colors">Resend</button></p>
                        <button type="button" onClick={() => actions.setShowResetVerify(false)} className="underline text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300">Wrong email path?</button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <RightPanelSplit />
    </div>
  );
});

// ─── 4. UPDATE PASSWORD VIEW ──────────────────────────────────────────────────
export const UpdatePasswordView = memo(({ state, actions }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 box-border">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24 xl:px-32 relative z-10 box-border">
        <motion.div key="update-form" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="w-full max-w-sm mx-auto box-border">
           <button type="button" onClick={() => actions.setViewMode('login')} className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-zinc-200 transition-colors mb-6 border-none bg-transparent p-0 outline-none box-border">
              <ArrowLeft size={13} /> Cancel
           </button>
           
           <div className="space-y-1 mb-5 box-border">
             <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-zinc-50" style={serif}>New password.</h2>
             <p className="text-xs text-neutral-400 dark:text-zinc-500 leading-relaxed">Create a new secure password.</p>
           </div>
           
           <form onSubmit={actions.handleUpdatePassword} className="space-y-4 box-border w-full">
             <div className="relative flex items-center box-border w-full">
               <input type={showPassword ? "text" : "password"} placeholder="New Secure Password" className="w-full h-11 border border-neutral-200 dark:border-zinc-800 bg-neutral-50/40 dark:bg-zinc-900/20 px-4 pr-10 rounded-xl text-sm outline-none transition-all box-border focus:bg-white dark:focus:bg-zinc-955 focus:border-indigo-600 dark:focus:border-zinc-500 focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-zinc-100/5 text-neutral-800 dark:text-zinc-100 placeholder:text-neutral-400" value={state.newPassword} onChange={(e) => actions.setNewPassword(e.target.value)} required minLength={7}/>
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg box-border">
                  {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
             </div>
             <PasswordSecurityPanel password={state.newPassword} />
             
             <ActionButton type="submit" loading={state.loading}>
                Update Password
             </ActionButton>
           </form>
        </motion.div>
      </div>
      <RightPanelSplit />
    </div>
  );
});