import React, { useState } from 'react';
import { ShieldCheck, Download, Hash, Calendar, Loader } from 'lucide-react';

// --- Sub-Component for Individual Row Logic ---
const RecordRow = ({ app, onDownloadInvoice }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // ✅ FIX: Pass the entire 'app' object to the parent.
      // The Dashboard will now check if the invoice exists.
      // If it's missing, the Dashboard will AUTO-GENERATE it instead of showing an error.
      await onDownloadInvoice(app); 
    } catch (err) {
      console.error("Download interaction failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative bg-[#09090b] hover:bg-white/[0.02] border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Job ID */}
            <div className="col-span-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800 text-gray-500 group-hover:text-blue-400 transition-colors">
                   <Hash size={14}/>
                </div>
                <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">
                    {String(app.job_id || "").slice(0,8).toUpperCase()}
                </span>
            </div>

            {/* Date */}
            <div className="col-span-3 flex items-center gap-2 text-gray-400 text-sm">
                 <Calendar size={14} className="opacity-50"/>
                 {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>

            {/* Status Pill */}
            <div className="col-span-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    app.status === 'Paid' || app.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    'bg-gray-700/30 text-gray-400 border-gray-600/30'
                }`}>
                    {app.status}
                </span>
            </div>

            {/* Amount */}
            <div className="col-span-2 flex items-center gap-1 text-white font-mono font-bold">
                <span className="text-gray-600">₹</span>{app.bid_amount}
            </div>

            {/* Action Button */}
            <div className="col-span-2 flex justify-end">
                {app.status === 'Paid' || app.status === 'Completed' ? (
                    <button 
                        onClick={handleDownload}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-blue-600 hover:text-white border border-white/10 text-xs font-bold transition-all group-hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader size={14} className="animate-spin"/> : <Download size={14}/>} 
                        <span className="hidden lg:inline">{loading ? 'Processing...' : 'PDF'}</span>
                    </button>
                ) : (
                    <span className="text-gray-600 text-xs italic">Pending</span>
                )}
            </div>
        </div>
    </div>
  );
};

// --- Main Component ---
const Records = ({ applications, onDownloadInvoice }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#09090b] border border-blue-500/20 p-8 flex flex-col sm:flex-row items-center gap-6 shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]">
         {/* Background Effect */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

         <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <ShieldCheck size={32}/>
         </div>
         <div className="text-center sm:text-left z-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Safety Ledger</h3>
            <p className="text-blue-200/60 font-mono text-xs mt-1 max-w-lg">
               Immutable record of all contract executions and safety compliance verification.
            </p>
         </div>
      </div>

      {/* DATA VAULT LIST */}
      <div className="space-y-4">
        {/* Table Header (Hidden on mobile, visible on desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <div className="col-span-3">Job ID</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2 text-right">Asset</div>
        </div>

        {applications.map((app) => (
            <RecordRow 
              key={app.id} 
              app={app} 
              onDownloadInvoice={onDownloadInvoice} // ✅ Passing the prop down
            />
        ))}
      </div>
    </div>
  );
};

export default Records;