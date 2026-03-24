import React, { useState } from 'react';
import { 
  Search, MapPin, ArrowUpRight, Sparkles, Filter, Briefcase, 
  ChevronDown, ChevronUp, Clock, Calendar, DollarSign, Flag, AlertTriangle,
  Loader2, Flame, Zap
} from 'lucide-react';
import { supabase } from '../../supabase'; 
import Button from '../ui/Button';
import Modal from '../ui/Modal'; 

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

const Jobs = ({ isClient, services, filteredJobs, searchTerm, setSearchTerm, setModal, setActiveChat, setTab, setSelectedJob, onAction }) => {
  
  // --- STATES ---
  const [reportModal, setReportModal] = useState(null);
  
  // 🔥 AI MATCHING STATES (Only used by Clients)
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportModal) return;
    const formData = new FormData(e.target);
    const reason = formData.get('reason');
    const description = formData.get('description');

    if (onAction) {
        onAction('report', reportModal, { reason, description });
    }
    setReportModal(null);
  };

  // 🔥 TRIGGER AI MATCHING ENGINE (CLIENTS ONLY)
  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() || !isClient) return;

    setIsAiSearching(true);
    setAiResults(null);
    setParsedData(null);

    try {
      const { data, error } = await supabase.functions.invoke('match-freelancers', {
        body: { query: searchTerm }
      });

      if (error) throw error;
      
      setParsedData(data.parsed);
      categorizeAiResults(data.results);
    } catch (err) {
      console.error(err);
      // Fallback: If AI fails, the normal text filter still works on the catalog below
    } finally {
      setIsAiSearching(false);
    }
  };

  const categorizeAiResults = (freelancers) => {
    if (!freelancers || freelancers.length === 0) return;

    const best = freelancers[0]; 
    const remainingAfterBest = freelancers.filter(f => f.id !== best.id);
    
    const getSpeed = (f) => f.response_speed_hours ?? 999;
    const fast = remainingAfterBest.length > 0 
        ? remainingAfterBest.reduce((prev, curr) => getSpeed(curr) < getSpeed(prev) ? curr : prev) 
        : null;

    const remainingAfterFast = remainingAfterBest.filter(f => f.id !== fast?.id);
    const budget = remainingAfterFast.length > 0 
        ? remainingAfterFast.reduce((prev, curr) => curr.hourly_rate < prev.hourly_rate ? curr : prev) 
        : null;

    setAiResults({ best, fast, budget });
  };

  // --- AI RESULT CARD COMPONENT ---
  const AiResultCard = ({ title, icon, freelancer, colorClass }) => {
    if (!freelancer) return null;
    return (
      <div className={`p-5 rounded-[24px] border bg-white dark:bg-[#09090b] shadow-lg relative overflow-hidden group ${colorClass} transition-all hover:-translate-y-1`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-bl-full pointer-events-none"></div>
        
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 text-current">
            {icon} {title}
        </div>
        
        <div className="flex justify-between items-start mb-4">
            <div>
                <h4 className="font-bold text-xl dark:text-white leading-tight">{freelancer.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold">
                        {freelancer.match_score || 95}% MATCH
                    </span>
                    <span className="text-xs text-gray-500">⭐ {freelancer.rating || "5.0"}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="font-black text-gray-900 dark:text-white text-lg">₹{freelancer.hourly_rate}<span className="text-xs text-gray-400 font-medium">/hr</span></p>
                <p className="text-[10px] text-gray-400 font-medium">Replies in {freelancer.response_speed_hours ?? 24}h</p>
            </div>
        </div>

        {freelancer.reasons && freelancer.reasons.length > 0 && (
            <ul className="text-[10px] text-gray-500 dark:text-gray-400 mb-4 space-y-1">
                {freelancer.reasons.map((r, i) => <li key={i} className="flex items-center gap-1"><Sparkles size={10} className="text-indigo-400"/> {r}</li>)}
            </ul>
        )}

        <Button 
            onClick={() => {
                setActiveChat({ id: freelancer.id, name: freelancer.name });
                setTab('messages');
            }}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-[1.02]"
        >
            Hire Instantly
        </Button>
      </div>
    );
  };

  // --- STANDARD CARD COMPONENT ---
  const JobCard = ({ data, type }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const gradients = [
        "from-pink-500/80 via-rose-500/80 to-yellow-500/80", 
        "from-blue-400/80 via-indigo-500/80 to-purple-500/80", 
        "from-emerald-400/80 via-teal-500/80 to-cyan-500/80", 
    ];
    const gradient = gradients[(data.id || 0) % gradients.length];
    const description = data.description || "No description provided.";
    const isLongText = description.length > 120;

    return (
      <div className="group relative bg-white dark:bg-[#09090b] rounded-[24px] border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl overflow-hidden flex flex-col h-full">
        <div className={`h-28 w-full relative overflow-hidden bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-white dark:from-[#09090b] to-transparent"></div>
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-800 dark:text-white uppercase tracking-wider">{type}</span>
            </div>
        </div>

        <div className="p-6 pt-0 flex flex-col flex-grow relative z-10 -mt-2">
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
               <div className="col-span-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-2 flex items-center gap-2 justify-center">
                   <Calendar size={12} className="text-gray-400"/>
                   <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Posted {getTimeAgo(data.created_at)}</span>
               </div>
           </div>

           <div className="mb-6 relative">
               <p className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                   {description}
               </p>
               {isLongText && (
                   <button 
                       onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                       className="mt-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-colors"
                   >
                       {isExpanded ? <>Collapse Details <ChevronUp size={12} /></> : <>Read Full Details <ChevronDown size={12} /></>}
                   </button>
               )}
           </div>

           <div className="flex flex-wrap gap-2 mb-6 mt-auto">
               {(data.tags ? data.tags.split(',') : [data.category || 'Gig']).slice(0,3).map((t,i) => (
                   <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                       {t}
                   </span>
               ))}
           </div>

           <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
               <div>
                   <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold mb-0.5">Budget</p>
                   <div className="flex items-center text-gray-900 dark:text-white font-black text-lg">
                       <span className="text-sm text-gray-400 font-medium mr-0.5">₹</span>{data.price || data.budget}
                   </div>
                   <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        const reportPayload = { target_type: 'job', target_id: data.id, reported_user_id: isClient ? data.freelancer_id : data.client_id };
                        if (onAction) onAction('report', reportPayload);
                        else if (setModal) setModal(reportPayload); 
                     }}
                     className="text-[10px] text-gray-300 hover:text-red-500 flex items-center gap-1 mt-1 transition-colors"
                   >
                     <Flag size={10} /> Report
                   </button>
               </div>
               
               <button 
                  onClick={() => isClient ? 
                    (setActiveChat({ id: data.freelancer_id, name: data.freelancer_name, application_id: data.id }), setTab('messages')) : 
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
      
      {/* --- CONDITIONAL COMMAND BAR --- */}
      <div className="sticky top-6 z-40 mx-auto max-w-3xl px-4">
        
        {isClient ? (
          /* =========================================================
             CLIENT VIEW: AI COMMAND CENTER
             ========================================================= */
          <>
            <form onSubmit={handleAiSearch} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-full p-2 flex items-center shadow-xl">
                    
                    {isAiSearching ? (
                      <Loader2 className="ml-4 text-indigo-500 animate-spin" size={20} />
                    ) : (
                      <Sparkles className={`ml-4 transition-colors ${searchTerm ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`} size={20}/>
                    )}
                    
                    <input 
                        type="text" 
                        placeholder="Describe what you need (e.g., Logo designer under ₹1000)"
                        className="w-full bg-transparent px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <div className="pr-1 flex gap-2">
                        <button type="button" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                            <Filter size={18}/>
                        </button>
                        <Button type="submit" disabled={isAiSearching || !searchTerm} className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-tight shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                            MATCH
                        </Button>
                    </div>
                </div>
            </form>

            {/* AI Parse Feedback Pill */}
            {parsedData && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 whitespace-nowrap animate-fade-in-up">
                  <span className="px-3 py-1 bg-white/80 dark:bg-black/80 backdrop-blur border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1 shadow-sm">
                    <DollarSign size={12} className="text-emerald-500"/> Max: {parsedData.budget > 0 ? `₹${parsedData.budget}` : 'Open Budget'}
                  </span>
                  <span className="px-3 py-1 bg-white/80 dark:bg-black/80 backdrop-blur border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1 shadow-sm">
                    <Clock size={12} className="text-rose-500"/> {parsedData.urgency} priority
                  </span>
              </div>
            )}
          </>
        ) : (
          /* =========================================================
             FREELANCER VIEW: STANDARD REAL-TIME SEARCH
             ========================================================= */
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-full p-2 flex items-center shadow-xl">
                <Search className="ml-4 text-gray-400" size={20}/>
                <input 
                    type="text" 
                    placeholder="Search missions, skills, or keywords..."
                    className="w-full bg-transparent px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="pr-1 flex gap-2">
                    <button type="button" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                        <Filter size={18}/>
                    </button>
                    {/* Visual Button for consistency, but search is real-time via state */}
                    <Button type="button" className="rounded-full px-6 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-gray-200 font-bold tracking-tight">
                        SEARCH
                    </Button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* --- AI MATCH RESULTS (Only shows if matches found AND user is Client) --- */}
      {aiResults && isClient && (
        <div className="px-4 mt-12 mb-8 animate-fade-in-up">
           <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
               <Sparkles size={18} className="text-indigo-500"/> Top AI Matches
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AiResultCard title="Best Overall" icon={<Flame size={14}/>} freelancer={aiResults.best} colorClass="border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400" />
              <AiResultCard title="Fastest Reply" icon={<Zap size={14}/>} freelancer={aiResults.fast} colorClass="border-yellow-200 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-400" />
              <AiResultCard title="Best Value" icon={<DollarSign size={14}/>} freelancer={aiResults.budget} colorClass="border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" />
           </div>
           
           <div className="mt-8 mb-4 flex items-center gap-4">
               <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or browse standard catalog</span>
               <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
           </div>
        </div>
      )}

      {/* --- TITLE AREA --- */}
      <div className={`flex items-end justify-between px-4 ${(!aiResults || !isClient) ? 'mt-8' : ''}`}>
          <div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">
                 {isClient ? 'Talent Catalog' : 'Mission Board'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-mono text-xs mt-1">
                 {filteredJobs.length + services.length} ACTIVE SIGNALS DETECTED
              </p>
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

      {/* --- REPORT MODAL --- */}
      {reportModal && (
        <Modal title="Report Post" onClose={() => setReportModal(null)}>
            <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex gap-3">
                    <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full h-fit text-red-600 dark:text-red-200">
                       <Flag size={18} />
                    </div>
                    <div>
                       <h4 className="font-bold text-red-800 dark:text-red-200 text-sm">Trust & Safety</h4>
                       <p className="text-xs text-red-700 dark:text-red-300 mt-1">Reports are reviewed by admins. False reporting may lead to a ban.</p>
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
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Details</label>
                    <textarea name="description" required placeholder="Please describe the issue..." className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 resize-none"></textarea>
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