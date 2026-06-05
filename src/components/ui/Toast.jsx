import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const isInfo = type === 'info';
  const Icon = isError ? AlertCircle : isWarning ? AlertTriangle : isInfo ? Info : CheckCircle;
  const label = isError ? 'Error' : isWarning ? 'Warning' : isInfo ? 'Info' : 'Success';
  const borderTone = isError
    ? 'border-rose-400/30 dark:border-rose-300/50'
    : isWarning
      ? 'border-amber-400/30 dark:border-amber-300/50'
      : isInfo
        ? 'border-sky-400/30 dark:border-sky-300/50'
        : 'border-emerald-400/30 dark:border-emerald-300/50';
  const textTone = isError
    ? 'text-rose-300 dark:text-rose-600'
    : isWarning
      ? 'text-amber-300 dark:text-amber-600'
      : isInfo
        ? 'text-sky-300 dark:text-sky-600'
        : 'text-emerald-300 dark:text-emerald-600';
  const iconTone = isError
    ? 'bg-rose-400/15 text-rose-300 dark:bg-rose-500/10 dark:text-rose-600'
    : isWarning
      ? 'bg-amber-400/15 text-amber-300 dark:bg-amber-500/10 dark:text-amber-600'
      : isInfo
        ? 'bg-sky-400/15 text-sky-300 dark:bg-sky-500/10 dark:text-sky-600'
        : 'bg-emerald-400/15 text-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-600';
  
  return (
    <div
      className="fixed left-1/2 top-4 z-[120] w-[calc(100vw-1rem)] max-w-[430px] -translate-x-1/2 sm:top-6 sm:w-[min(430px,calc(100vw-2rem))] md:left-auto md:right-6 md:translate-x-0"
      role="status"
      aria-live="polite"
    >
      <div className={`relative flex min-h-14 items-start gap-3 overflow-hidden rounded-[28px] border px-4 py-3 pr-11 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.75)] backdrop-blur-2xl bg-zinc-950/95 text-white dark:bg-white/95 dark:text-zinc-950 ${borderTone}`}>
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <span className={`block text-[10px] font-black uppercase tracking-widest ${textTone}`}>
            {label}
          </span>
          <span className="block whitespace-normal break-words text-sm font-semibold leading-snug text-white dark:text-zinc-950">{message}</span>
        </div>

        <button 
          onClick={onClose} 
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white dark:text-zinc-500 dark:hover:bg-zinc-950/10 dark:hover:text-zinc-950"
          aria-label="Close notification"
          type="button"
        >
          <X size={14}/>
        </button>
      </div>
    </div>
  );
};

export default Toast;
