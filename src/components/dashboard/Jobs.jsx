import React, { useState } from 'react';
import { 
  Search, MapPin, ArrowUpRight, Sparkles, Filter, Briefcase, 
  ChevronDown, ChevronUp, Clock, Calendar, DollarSign, Flag, AlertTriangle 
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal'; // Ensure this matches your file structure

// --- HELPER: TIME AGO ---
const getTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

// Added 'onAction' to props to handle reporting
const Jobs = ({ isClient, services, filteredJobs, searchTerm, setSearchTerm, setModal, setActiveChat, setTab, setSelectedJob, onAction }) => {
  
  // --- LOCAL STATE FOR REPORTING ---
  const [reportModal, setReportModal] = useState(null);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportModal) return;

    const formData = new FormData(e.target);
    const reason = formData.get('reason');
    const description = formData.get('description');

    // Trigger the action if passed from parent, or log it
    if (onAction) {
        onAction('report', reportModal, { reason, description });
    } else {
        console.warn("onAction prop missing in Jobs.jsx. Report data:", { ...reportModal, reason, description });
    }
    
    setReportModal(null);
  };

  const JobCard = ({ data, type }) => {
    // State to handle Read More / Read Less toggle
    const [isExpanded, setIsExpanded] = useState(false);

    // Dynamic Gradients based on ID for visual variety
    const gradients = [
        "from-pink-500/80 via-rose-500/80 to-yellow-500/80", 
        "from-blue-400/80 via-indigo-500/80 to-purple-500/80", 
        "from-emerald-400/80 via-teal-500/80 to-cyan-500/80", 
    ];
    const gradient = gradients[(data.id || 0) % gradients.length];

    // Description Logic
    const description = data.description || "No description provided for this mission.";
    const isLongText = description.length > 120;

    return (
      <div className="group relative bg-white dark:bg-[#09090b] rounded-[24px] border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl overflow-hidden flex flex-col h-full">
        
        {/* --- 1. COVER IMAGE AREA --- */}
        <div className={`h-28 w-full relative overflow-hidden bg-gradient-to-br ${gradient}`}>
            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
            {/* Fade to Content */}
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-white dark:from-[#09090b] to-transparent"></div>
            
            {/* Type Badge */}
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-800 dark:text-white uppercase tracking-wider">{type}</span>
            </div>
        </div>

        {/* --- 2. CARD CONTENT --- */}
        <div className="p-6 pt-0 flex flex-col flex-grow relative z-10 -mt-2">
           
           {/* Title & Author */}
           <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-indigo-400 transition-all">
                  {data.title}
              </h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300">
                    {isClient ? '👤' : '🏢'}
                  </span>
                  {isClient ? `Freelancer: ${data.freelancer_name}` : `Client: ${data.client_name}`}
              </p>
           </div>

           {/* --- METADATA GRID (Adequate Details) --- */}
           <div className="grid grid-cols-2 gap-2 mb-5">
               <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-2.5 flex items-center gap-2">
                   <Clock size={14} className="text-indigo-500 dark:text-indigo-400"/>
                   <div>
                       <p className="text-[9px] text-gray-400 uppercase font-bold">Duration</p>
                       <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{data.duration || "Flexible"}</p>
                   </div>
               </div>
               <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-2.5 flex items-center gap-2">
                   <Briefcase size={14} className="text-purple-500 dark:text-purple-400"/>
                   <div>
                       <p className="text-[9px] text-gray-400 uppercase font-bold">Type</p>
                       <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{data.job_type || "Fixed Price"}</p>
                   </div>
               </div>
               {/* Full Width Row for Date */}
               <div className="col-span-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-2 flex items-center gap-2 justify-center">
                   <Calendar size={12} className="text-gray-400"/>
                   <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Posted {getTimeAgo(data.created_at)}</span>
               </div>
           </div>

           {/* Description with Expand */}
           <div className="mb-6 relative">
               <p className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                   {description}
               </p>
               
               {isLongText && (
                   <button 
                       onClick={(e) => {
                           e.stopPropagation();
                           setIsExpanded(!isExpanded);
                       }}
                       className="mt-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
                   >
                       {isExpanded ? (
                           <>Collapse Details <ChevronUp size={12} /></>
                       ) : (
                           <>Read Full Details <ChevronDown size={12} /></>
                       )}
                   </button>
               )}
           </div>

           {/* Tags */}
           <div className="flex flex-wrap gap-2 mb-6 mt-auto">
               {(data.tags ? data.tags.split(',') : [data.category || 'Gig']).slice(0,3).map((t,i) => (
                   <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                       {t}
                   </span>
               ))}
           </div>

           {/* --- FOOTER ACTION --- */}
           <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
               <div>
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold mb-0.5">Budget</p>
                   <div className="flex items-center text-gray-900 dark:text-white font-black text-lg">
                       <span className="text-sm text-gray-400 font-medium mr-0.5">₹</span>{data.price || data.budget}
                   </div>
                   
                   {/* 🚩 NEW: REPORT BUTTON */}
                   {/* 🚩 REPORT BUTTON */}
<button 
  onClick={(e) => {
     e.stopPropagation();
     
     // 1. Prepare the payload explicitly
     const reportPayload = { 
        target_type: 'job', 
        target_id: data.id, // <--- Force this key to be 'target_id'
        reported_user_id: isClient ? data.freelancer_id : data.client_id 
     };

     // 2. Send it via onAction (Preferred)
     if (onAction) {
         console.log("🚀 Sending Report from Jobs:", reportPayload);
         onAction('report', reportPayload);
     } 
     // 3. Fallback for local state (Safety net)
     else if (setModal) {
         setModal(reportPayload); 
     }
  }}
  className="text-[10px] text-gray-300 hover:text-red-500 flex items-center gap-1 mt-1 transition-colors"
  title="Report this post"
>
  <Flag size={10} /> Report
</button>
               </div>
               
               <button 
                  onClick={() => isClient ? 
                    (setActiveChat({ id: data.freelancer_id, name: data.freelancer_name }), setTab('messages')) : 
                    (setSelectedJob(data), setModal('apply-job'))
                  }
                  className="h-10 px-5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl dark:shadow-white/10"
               >
                   {isClient ? 'Chat' : 'Apply'}
                   <ArrowUpRight size={16} strokeWidth={2.5}/>
               </button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-8 animate-fade-in pb-20">
      
      {/* --- FLOATING COMMAND BAR (Light/Dark Mode Friendly) --- */}
      <div className="sticky top-6 z-40 mx-auto max-w-2xl px-4">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-full p-2 flex items-center shadow-xl">
                <Search className="ml-4 text-gray-400" size={20}/>
                <input 
                    type="text" 
                    placeholder={isClient ? "Find talent..." : "Search missions..."}
                    className="w-full bg-transparent px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="pr-1 flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                        <Filter size={18}/>
                    </button>
                    <Button className="rounded-full px-6 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-200 font-bold tracking-tight">
                        GO
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* --- TITLE AREA --- */}
      <div className="flex items-end justify-between px-4 mt-8">
          <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">
                 {isClient ? 'Talent Pool' : 'Mission Board'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-mono text-xs mt-1">
                 {filteredJobs.length + services.length} ACTIVE SIGNALS DETECTED
              </p>
          </div>
          <div className="flex gap-2 items-center bg-green-500/10 dark:bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-green-600 dark:text-green-500 text-xs font-bold uppercase tracking-widest">Live Feed</span>
          </div>
      </div>

      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4">
        {isClient 
            ? services.map(s => <JobCard key={s.id} data={s} type="Gig" />)
            : filteredJobs.map(j => <JobCard key={j.id} data={j} type="Mission" />)
        }
      </div>

      {/* --- EMPTY STATE --- */}
      {((!isClient && filteredJobs.length === 0) || (isClient && services.length === 0)) && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[40px] bg-gray-50 dark:bg-white/5 m-4">
           <div className="w-24 h-24 bg-white dark:bg-black rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center mb-6 shadow-xl dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
               <Briefcase size={32} className="text-gray-400 dark:text-gray-600"/>
           </div>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Void Detected</h3>
           <p className="text-gray-500 dark:text-gray-400 text-sm">No signals matching your query.</p>
        </div>
      )}

      {/* --- 🆕 REPORT MODAL --- */}
      {reportModal && (
        <Modal title="Report Post" onClose={() => setReportModal(null)}>
            <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex gap-3">
                    <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full h-fit text-red-600 dark:text-red-200">
                       <Flag size={18} />
                    </div>
                    <div>
                       <h4 className="font-bold text-red-800 dark:text-red-200 text-sm">Trust & Safety</h4>
                       <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                         Reports are reviewed by admins. False reporting may lead to a ban.
                       </p>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
                    <select name="reason" required className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500">
                      <option value="">Select a reason...</option>
                      <option value="Scam/Fraud">Scam or Fraudulent Activity</option>
                      <option value="Harassment">Harassment / Abusive Content</option>
                      <option value="Misleading">Misleading Description</option>
                      <option value="Inappropriate">Inappropriate Content</option>
                      <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Details</label>
                    <textarea 
                      name="description" 
                      required 
                      placeholder="Please describe the issue..." 
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 resize-none"
                    ></textarea>
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                     <Button variant="ghost" type="button" onClick={() => setReportModal(null)}>Cancel</Button>
                     <Button className="bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
                </div>
            </form>
        </Modal>
      )}

    </div>
  );
};

export default Jobs;