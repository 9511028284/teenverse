import React, { useState } from 'react';
import { ShieldCheck, Download, Hash, Calendar, Loader } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Sub-Component for Individual Row Logic ---
const RecordRow = ({ app, onDownloadInvoice }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownloadInvoice(app); 
    } catch (err) {
      console.error("Download interaction failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "group relative border backdrop-blur-md rounded-[20px] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5",
      // LIGHT MODE: Soft clean glass row
      "bg-white border-slate-200/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_12px_rgba(0,0,0,0.01)]",
      "hover:border-indigo-500/20 hover:shadow-[0_12px_24px_rgba(99,102,241,0.05)]",
      // DARK MODE: Volumetric midnight clay row
      "dark:bg-slate-900/40 dark:border-white/[0.04] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_8px_24px_rgba(0,0,0,0.2)]",
      "dark:hover:border-indigo-500/30 dark:hover:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.12),_0_16px_32px_rgba(99,102,241,0.12)]"
    )}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-left">
            
            {/* Job ID Section */}
            <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 border border-slate-200/40 dark:border-white/[0.03] transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none">
                   <Hash size={13} strokeWidth={2.5}/>
                </div>
                <span className="font-mono text-sm font-black text-slate-800 dark:text-slate-200 tracking-wide">
                    {String(app.job_id || "").slice(0, 8).toUpperCase()}
                </span>
            </div>

            {/* Calendar Execution Date */}
            <div className="col-span-3 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold">
                 <Calendar size={14} strokeWidth={2.5} className="opacity-60 text-slate-400" />
                 {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>

            {/* Status Tracking Pill */}
            <div className="col-span-2">
                <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none",
                    app.status === 'Paid' || app.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-white/5'
                )}>
                    {app.status}
                </span>
            </div>

            {/* Escrow Amount Vector */}
            <div className="col-span-2 flex items-baseline text-slate-900 dark:text-white font-mono font-black text-base leading-none">
                <span className="text-xs font-sans font-bold text-slate-400 mr-0.5 opacity-70">R </span>{app.bid_amount}
            </div>

            {/* Compact High-Impact Action Button */}
            <div className="col-span-2 flex justify-end">
                {app.status === 'Paid' || app.status === 'Completed' ? (
                    <button 
                        onClick={handleDownload}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.25),_0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.4)] hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white"
                    >
                        {loading ? <Loader size={13} className="animate-spin" strokeWidth={2.5}/> : <Download size={13} strokeWidth={2.5}/>} 
                        <span className="hidden lg:inline">{loading ? 'Compiling...' : 'PDF'}</span>
                    </button>
                ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-bold font-mono italic pr-4">Pending</span>
                )}
            </div>
        </div>
    </div>
  );
};

// --- Main Component ---
const Records = ({ applications, onDownloadInvoice }) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto px-0">
      
      {/* 1. SAFETY LEDGER PREMIUM BANNER HERO */}
      <div className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_12px_36px_rgba(0,0,0,0.03)] backdrop-blur-xl dark:border-white/[0.05] dark:bg-slate-900/40 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_20px_40px_rgba(0,0,0,0.3)] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
         
         {/* Internal ambient nodes */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none dark:bg-indigo-500/5" aria-hidden="true" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay pointer-events-none" />

         {/* Claymorphic icon center shield */}
         <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 flex items-center justify-center shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.6)] dark:shadow-none shrink-0">
            <ShieldCheck size={26} strokeWidth={2.5}/>
         </div>
         
         <div className="text-center sm:text-left z-10 space-y-0.5">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Safety Ledger</h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-xs max-w-xl leading-normal">
               Immutable, secure registry tracking verified contract executions, transaction protect states, and system audit trails.
            </p>
         </div>
      </div>

      {/* 2. SECURE DATA VAULT LIST MATRIX */}
      <div className="space-y-3">
        {/* Document Column Metadata Headers */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            <div className="col-span-3 pl-1">Job reference ID</div>
            <div className="col-span-3">Execution Date</div>
            <div className="col-span-2">System Status</div>
            <div className="col-span-2">Total Amount</div>
            <div className="col-span-2 text-right pr-4">Compliant Asset</div>
        </div>

        {/* Mapped Row Nodes */}
        {applications.map((app) => (
            <RecordRow 
              key={app.id} 
              app={app} 
              onDownloadInvoice={onDownloadInvoice}
            />
        ))}

        {/* Empty Fallback Block State */}
        {applications.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-200/80 rounded-[28px] bg-white/40 dark:border-white/[0.05] dark:bg-slate-900/10 text-slate-400 dark:text-slate-500 font-bold text-sm shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
             No active ledger index statements indexed on this account.
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;