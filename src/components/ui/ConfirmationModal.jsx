import React from 'react';
import { X, AlertCircle, CheckCircle, XCircle, ShieldCheck, Unlock, Lock, RefreshCw, Trash2, Star, Banknote } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const ICONS = {
  approve: CheckCircle,
  reject: XCircle,
  revision: RefreshCw,
  hire: ShieldCheck,
  cancel: Trash2,
  release: Unlock,
  rate: Star,
  default: AlertCircle,
};

const COLORS = {
  approve: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-600', icon: 'text-emerald-500' },
  reject: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', btn: 'bg-rose-500 hover:bg-rose-600', icon: 'text-rose-500' },
  revision: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', btn: 'bg-amber-500 hover:bg-amber-600', icon: 'text-amber-500' },
  hire: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-500 hover:bg-indigo-600', icon: 'text-indigo-500' },
  cancel: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', btn: 'bg-rose-500 hover:bg-rose-600', icon: 'text-rose-500' },
  release: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-500 hover:bg-emerald-600', icon: 'text-emerald-500' },
  rate: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', btn: 'bg-amber-500 hover:bg-amber-600', icon: 'text-amber-500' },
  default: { bg: 'bg-slate-100 dark:bg-slate-900/50', border: 'border-slate-200 dark:border-white/10', text: 'text-slate-600 dark:text-slate-400', btn: 'bg-slate-500 hover:bg-slate-600', icon: 'text-slate-500' },
};

const TEXTS = {
  approve: { 
    title: 'Approve & Release Funds', 
    desc: 'This will release the escrow payment to the freelancer and mark the project as completed. This action cannot be undone.',
    btn: 'Yes, Approve & Release'
  },
  reject: { 
    title: 'Reject & Refund', 
    desc: 'This will cancel the order and refund the escrow amount to your wallet. The freelancer will be notified.',
    btn: 'Yes, Reject & Refund'
  },
  revision: { 
    title: 'Request Revision', 
    desc: 'The freelancer will be notified that revisions are needed. They can then resubmit updated work.',
    btn: 'Yes, Request Revision'
  },
  hire: { 
    title: 'Hire & Fund Escrow', 
    desc: 'This will create an order and fund the escrow from your wallet or payment method. The freelancer can then start working.',
    btn: 'Yes, Hire & Pay'
  },
  cancel: { 
    title: 'Cancel Order', 
    desc: 'This will cancel the active order and refund the escrow amount to your wallet. The freelancer will be notified.',
    btn: 'Yes, Cancel Order'
  },
  release: { 
    title: 'Release Payment', 
    desc: 'This will release the remaining escrow payment to the freelancer. This action cannot be undone.',
    btn: 'Yes, Release Payment'
  },
  rate: { 
    title: 'Rate Freelancer', 
    desc: 'Your rating and feedback will be publicly visible on the freelancer\'s profile.',
    btn: 'Submit Rating'
  },
};

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  actionType = 'default', 
  customTitle, 
  customDesc, 
  customBtnText,
  isLoading = false,
  extraContent 
}) {
  if (!isOpen) return null;

  const Icon = ICONS[actionType] || ICONS.default;
  const colors = COLORS[actionType] || COLORS.default;
  const texts = TEXTS[actionType] || { title: 'Confirm Action', desc: 'Are you sure you want to proceed?', btn: 'Confirm' };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className={cn(
          "w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-in",
          colors.bg, colors.border, 'border'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className={cn("px-6 py-4 border-b flex items-center gap-3", colors.border)}>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg)}>
            <Icon size={24} className={colors.icon} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {customTitle || texts.title}
          </h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            {customDesc || texts.desc}
          </p>
          
          {extraContent && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-100 dark:border-white/10">
              {extraContent}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-5 py-2.5 rounded-xl font-black text-sm text-white uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50",
              colors.btn
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Processing...
              </span>
            ) : (
              customBtnText || texts.btn
            )}
          </button>
        </div>
      </div>
    </div>
  );
}