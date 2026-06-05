'use client'

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ShieldAlert, Scale, ArrowLeft } from 'lucide-react';

// ─── 1. MINIMAL DYNAMIC TOAST ────────────────────────────────────────────────
export const Toast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div 
         initial={{ opacity: 0, y: -18, scale: 0.96 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: -14, scale: 0.98 }}
         transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
         className="fixed top-4 left-1/2 z-[100] w-[calc(100vw-1rem)] max-w-[420px] -translate-x-1/2 sm:top-6 sm:w-[min(420px,calc(100vw-2rem))]"
         role="status"
         aria-live="polite"
      >
        <div className={`
          min-h-14 rounded-[28px] border px-4 py-3 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.75)] backdrop-blur-2xl transition-colors duration-150
          flex items-start gap-3 bg-zinc-950/95 text-white dark:bg-white/95 dark:text-zinc-950
          ${toast.type === 'success' 
            ? 'border-emerald-400/30 dark:border-emerald-300/50' 
            : 'border-rose-400/30 dark:border-rose-300/50'
          }
        `}>
           <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toast.type === 'success' ? 'bg-emerald-400/15 text-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-600' : 'bg-rose-400/15 text-rose-300 dark:bg-rose-500/10 dark:text-rose-600'}`}>
             {toast.type === 'success' ? <Check size={16} strokeWidth={2.5} /> : <ShieldAlert size={16} strokeWidth={2.5} />}
           </div>
           <div className="min-w-0 flex-1 space-y-0.5 text-left">
             <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${toast.type === 'success' ? 'text-emerald-300 dark:text-emerald-600' : 'text-rose-300 dark:text-rose-600'}`}>
               {toast.type === 'success' ? 'Success' : 'Security Alert'}
             </p>
             <span className="block whitespace-normal break-words text-sm font-semibold leading-snug text-white dark:text-zinc-950">{toast.message}</span>
           </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── 2. FLAT STEP INDICATOR ──────────────────────────────────────────────────
export const StepIndicator = ({ step }) => (
  <div className="flex gap-1.5 mb-6 justify-center items-center select-none">
    {[1, 2, 3, 4].map(i => (
      <div 
        key={i} 
        className={`h-1 rounded-full transition-all duration-300 ${
          step === i 
            ? 'w-10 bg-indigo-600 dark:bg-zinc-100' 
            : step > i 
              ? 'w-6 bg-indigo-200 dark:bg-zinc-800' 
              : 'w-2 bg-neutral-100 dark:bg-zinc-900'
        }`}
      />
    ))}
  </div>
);

// ─── 3. RESTRUCTURED SOCIAL BUTTON ───────────────────────────────────────────
export const SocialButton = ({ icon, onClick, label }) => (
  <button 
    type="button" 
    onClick={onClick} 
    title={label}
    className="flex-1 h-11 border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-[0.99] group" 
  >
    <div className="text-neutral-700 dark:text-zinc-300 group-hover:scale-105 transition-transform duration-150">
      {icon}
    </div>
  </button>
);

// ─── 4. FLAT EDITORIAL FLOATING NOTIFICATION ─────────────────────────────────
export const FloatingNotif = ({ icon: Icon, image3DUrl, title, sub, delay, x, y }) => {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: y + 10 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: [y + 10, y, y, y - 10],
      }}
      transition={{ duration: 6, delay: delay, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
      className="absolute z-20 bg-white/90 border border-neutral-200 p-3 rounded-xl flex items-center gap-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900/90 w-52 pointer-events-none text-left"
      style={{ top: y, left: x }}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100 dark:bg-zinc-800 dark:border-zinc-700">
        {image3DUrl ? (
          <img src={image3DUrl} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <Icon size={14} className="text-neutral-700 dark:text-zinc-300" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-mono font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider truncate">{title}</div>
        <div className="text-xs font-bold text-neutral-900 dark:text-zinc-100 truncate mt-0.5">{sub}</div>
      </div>
    </motion.div>
  );
};

// ─── 5. TYPOGRAPHIC BACK BUTTON ──────────────────────────────────────────────
export const BackButton = ({ onClick, label = "Return" }) => (
  <button 
    type="button"
    onClick={onClick} 
    className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-zinc-200 transition-colors mb-6 group border-none bg-transparent p-0"
  >
    <ArrowLeft size={13} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
    <span>{label}</span>
  </button>
);

// ─── 6. MINIMALIST PLATFORM LEGAL FINE PRINT ─────────────────────────────────
export const LegalFooter = ({ mobile }) => (
  <div className={`pt-4 border-t border-neutral-100 dark:border-zinc-900 text-[11px] leading-relaxed text-neutral-400 dark:text-zinc-500 ${mobile ? 'md:hidden' : 'hidden md:block'}`}>
    <div className="flex items-start gap-2 text-left mb-2">
      <Scale size={13} className="text-neutral-400 shrink-0 mt-0.5" />
      <p className="font-medium">
        <span className="font-bold text-neutral-700 dark:text-zinc-400">Legal Framework:</span> TeenVerseHub operates strictly as a secure technology intermediary workspace.
      </p>
    </div>
    <p className="font-mono text-[10px]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
      &copy; 2026 TeenVerseHub. All rights protected.
    </p>
  </div>
);
