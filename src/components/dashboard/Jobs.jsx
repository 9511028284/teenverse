import React, { useState } from 'react';
import { 
  Search, MapPin, ArrowUpRight, Sparkles, Filter, Briefcase, 
  ChevronDown, ChevronUp, Clock, Calendar, DollarSign, Flag, AlertTriangle,
  Loader2, Flame, Zap, Crown
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

// --- AI RESULT CARD COMPONENT ---
const AiResultCard = ({ title, icon, freelancer, colorClass, setActiveChat, setTab }) => {
    if (!freelancer) return null;
    return (
      <div className={`p-5 rounded-[24px] border bg-white dark:bg-[#09090b] shadow-lg relative overflow-hidden group ${colorClass} transition-all hover:-translate-y-1`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-bl-full pointer-events-none"></div>
        
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 text-current">
            {icon} {title}
        </div>
        
        <div className="flex justify-between items-start mb-4">
            <div>
                <h4 className="font-bold text-xl dark:text-white leading-tight">{freelancer.name || 'Pro User'}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] font-bold">
                        {freelancer.match_score || 95}% MATCH
                    </span>
                    <span className="text-xs text-gray-500">⭐ {freelancer.rating || "5.0"}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="font-black text-gray-900 dark:text-white text-lg">₹{freelancer.hourly_rate || 0}<span className="text-xs text-gray-400 font-medium">/hr</span></p>
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

// --- STANDARD & ELITE CARD COMPONENT ---
const JobCard = ({ data, type, isClient, onAction, setModal, setActiveChat, setTab, setSelectedJob }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Safety Fallbacks
    const description = data?.description || "No description provided.";
    const isLongText = description.length > 120;
    const displayName = isClient ? (data.freelancer_name || 'Freelancer') : (data.client_name || 'Client');

    // Elite Mode Check
    const isElite = data.is_elite && !isClient;

    // Standard Gradients
    const gradients = [
        "from-pink-500/80 via-rose-500/80 to-yellow-500/80", 
        "from-blue-400/80 via-indigo-500/80 to-purple-500/80", 
        "from-emerald-400/80 via-teal-500/80 to-cyan-500/80", 
    ];
    
    // Dynamic Styling Variables
    const headerGradient = isElite 
        ? "from-amber-600/60 via-yellow-500/40 to-orange-700/60" 
        : gradients[(data.id || 0) % gradients.length];
        
    const cardBg = isElite 
        ? "bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-[#000000] border-amber-500/30 hover:border-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.25)]" 
        : "bg-white dark:bg-[#09090b] border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:shadow-xl";
        
    const titleColor = isElite 
        ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-sm" 
        : "text-gray-900 dark:text-white";
        
    const pillBg = isElite 
        ? "bg-amber-500/10 border-amber-500/20" 
        : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5";
        
    const pillText = isElite ? "text-amber-100" : "text-gray-700 dark:text-gray-200";
    const subText = isElite ? "text-amber-200/50" : "text-gray-400 uppercase";
    const iconColor = isElite ? "text-amber-400" : "text-indigo-500 dark:text-indigo-400";
    const typeIconColor = isElite ? "text-amber-400" : "text-purple-500 dark:text-purple-400";
    const descriptionColor = isElite ? "text-gray-300" : "text-gray-600 dark:text-gray-300";
    const tagBg = isElite ? "bg-amber-500/20 border-amber-500/30 text-amber-200" : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300";
    const priceColor = isElite ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500" : "text-gray-900 dark:text-white";

    return (
      <div className={`group relative rounded-[24px] border transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col h-full ${cardBg}`}>
        
        {/* ELITE BADGE - ENHANCED */}
        {isElite && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black shadow-[0_0_15px_rgba(245,158,11,0.6)] z-20 overflow-hidden ring-1 ring-white/30">
                <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-shimmer skew-x-12"></div>
                <Crown size={12} className="fill-black relative z-10" /> 
                <span className="relative z-10 tracking-wider">ELITE</span>
            </div>
        )}

        <div className={`h-28 w-full relative overflow-hidden bg-gradient-to-br ${headerGradient}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
            
            {/* Smooth transition from gradient to card bg */}
            <div className={`absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t ${isElite ? 'from-[#1a1a1a]' : 'from-white dark:from-[#09090b]'} to-transparent`}></div>
            
            <div className={`absolute top-4 right-4 ${isElite ? 'bg-black/60 border-amber-500/30 text-amber-300' : 'bg-white/90 dark:bg-black/40 border-gray-200 dark:border-white/10 text-gray-800 dark:text-white'} backdrop-blur-md border px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-20`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isElite ? 'bg-amber-400' : 'bg-green-500'} animate-pulse shadow-[0_0_8px_currentColor]`}></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
            </div>
        </div>

        <div className="p-6 pt-0 flex flex-col flex-grow relative z-10 -mt-2">
            <div className="mb-4">
              <h3 className={`text-xl font-bold leading-tight mb-2 transition-all ${isExpanded ? '' : 'line-clamp-2'} ${titleColor}`}>
                  {data.title || 'Untitled Operation'}
              </h3>
              <p className={`text-xs font-medium flex items-center gap-2 ${isElite ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isElite ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
                    {displayName.charAt(0)}
                  </span>
                  {isClient ? `Freelancer: ${displayName}` : `Client: ${displayName}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
                <div className={`border rounded-xl p-2.5 flex items-center gap-2 transition-colors ${pillBg}`}>
                    <Clock size={14} className={iconColor}/>
                    <div>
                        <p className={`text-[9px] font-bold ${subText}`}>Duration</p>
                        <p className={`text-xs font-bold ${pillText}`}>{data.duration || "Flexible"}</p>
                    </div>
                </div>
                <div className={`border rounded-xl p-2.5 flex items-center gap-2 transition-colors ${pillBg}`}>
                    <Briefcase size={14} className={typeIconColor}/>
                    <div>
                        <p className={`text-[9px] font-bold ${subText}`}>Type</p>
                        <p className={`text-xs font-bold ${pillText}`}>{data.job_type || "Fixed Price"}</p>
                    </div>
                </div>
                <div className={`col-span-2 border rounded-xl p-2 flex items-center gap-2 justify-center transition-colors ${pillBg}`}>
                    <Calendar size={12} className={isElite ? "text-amber-500/50" : "text-gray-400"}/>
                    <span className={`text-[10px] font-medium ${isElite ? 'text-amber-200/70' : 'text-gray-500 dark:text-gray-400'}`}>
                        Posted {getTimeAgo(data.created_at)}
                    </span>
                </div>
            </div>

            <div className="mb-6 relative">
                <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'} ${descriptionColor}`}>
                    {description}
                </p>
                {isLongText && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className={`mt-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors hover:underline ${isElite ? 'text-amber-400 hover:text-amber-300' : 'text-indigo-600 dark:text-indigo-400'}`}
                    >
                        {isExpanded ? <>Collapse Details <ChevronUp size={12} /></> : <>Read Full Details <ChevronDown size={12} /></>}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                {(data.tags ? data.tags.split(',') : [data.category || 'Gig']).slice(0,3).map((t,i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-wide ${tagBg}`}>
                        {t}
                    </span>
                ))}
            </div>

            <div className={`pt-4 border-t flex items-center justify-between ${isElite ? 'border-amber-500/20' : 'border-gray-100 dark:border-white/5'}`}>
                <div>
                    <p className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${isElite ? 'text-amber-500/70' : 'text-gray-400 dark:text-gray-500'}`}>Budget</p>
                    <div className={`flex items-center font-black text-lg ${priceColor}`}>
                        <span className={`text-sm font-medium mr-0.5 ${isElite ? 'text-amber-600' : 'text-gray-400'}`}>₹</span>
                        {data.price || data.budget || 0}
                    </div>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         const reportPayload = { target_type: 'job', target_id: data.id, reported_user_id: isClient ? data.freelancer_id : data.client_id };
                         if (onAction) onAction('report', reportPayload);
                         else if (setModal) setModal(reportPayload); 
                      }}
                      className={`text-[10px] flex items-center gap-1 mt-1 transition-colors ${isElite ? 'text-gray-500 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                    >
                      <Flag size={10} /> Report
                    </button>
                </div>
                
                <button 
                   onClick={() => isClient ? 
                     (setActiveChat({ id: data.freelancer_id, name: data.freelancer_name, application_id: data.id }), setTab('messages')) : 
                     (setSelectedJob(data), setModal('apply-job'))
                   }
                   className={`h-10 px-5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg ${
                     isElite 
                     ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300' 
                     : 'bg-gray-900 dark:bg-white text-white dark:text-black'
                   }`}
                >
                    {isClient ? 'Chat' : 'Apply'}
                    <ArrowUpRight size={16} strokeWidth={isElite ? 3 : 2.5}/>
                </button>
            </div>
        </div>
      </div>
    )
}

// --- MAIN JOBS COMPONENT ---
const Jobs = ({ 
    user, showToast, isClient, services = [], filteredJobs = [], 
    searchTerm, setSearchTerm, setModal, setActiveChat, setTab, setSelectedJob, onAction 
}) => {
  
  const [reportModal, setReportModal] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  
  const [jobView, setJobView] = useState('normal'); 

  const publicMissions = filteredJobs.filter(job => {
      if (job.category === 'Direct Hire') return false;
      if (job.status && !['Pending', 'Open'].includes(job.status)) return false;

      if (jobView === 'elite' && !job.is_elite) return false; 
      if (jobView === 'normal' && job.is_elite) return false; 

      return true;
  });

  const handleToggle = (view) => {
      if (view === 'elite' && user?.current_plan !== 'Elite') {
          if (showToast) {
              showToast("You have to subscribe to Elite to access elite jobs.", "error");
          } else {
              alert("You have to subscribe to Elite to access elite jobs.");
          }
          return;
      }
      setJobView(view);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportModal) return;
    const formData = new FormData(e.target);
    onAction?.('report', reportModal, { reason: formData.get('reason'), description: formData.get('description') });
    setReportModal(null);
  };

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
      if (data.results && data.results.length > 0) {
          const best = data.results[0]; 
          const remaining = data.results.filter(f => f.id !== best.id);
          const fast = remaining.length > 0 ? remaining.reduce((prev, curr) => (curr.response_speed_hours ?? 24) < (prev.response_speed_hours ?? 24) ? curr : prev) : null;
          const budget = remaining.filter(f => f.id !== fast?.id).reduce((prev, curr) => curr.hourly_rate < prev.hourly_rate ? curr : prev, remaining[0] || null);
          setAiResults({ best, fast, budget });
      }
    } catch (err) {
      console.error("AI Search Error:", err);
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className="min-h-screen space-y-8 animate-fade-in pb-20 relative">
      
      {/* --- COMMAND BAR --- */}
      <div className="sticky top-6 z-[100] mx-auto max-w-3xl px-4">
        {isClient ? (
          <>
            <form onSubmit={handleAiSearch} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-10 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-full p-2 flex items-center shadow-xl">
                    {isAiSearching ? <Loader2 className="ml-4 text-indigo-500 animate-spin" size={20} /> : <Sparkles className={`ml-4 ${searchTerm ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`} size={20}/>}
                    <input 
                        type="text" 
                        placeholder="Describe what you need (e.g., Logo designer under ₹1000)"
                        className="w-full bg-transparent px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="pr-1 flex gap-2">
                        <button type="button" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-all">
                            <Filter size={18}/>
                        </button>
                        <Button type="submit" disabled={isAiSearching || !searchTerm} className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-tight">
                            MATCH
                        </Button>
                    </div>
                </div>
            </form>
            {parsedData && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 whitespace-nowrap animate-fade-in-up">
                  <span className="px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1 shadow-sm">
                    <DollarSign size={12} className="text-emerald-500"/> Max: ₹{parsedData.budget || 'Open'}
                  </span>
                  <span className="px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1 shadow-sm">
                    <Clock size={12} className="text-rose-500"/> {parsedData.urgency || 'Normal'} priority
                  </span>
              </div>
            )}
          </>
        ) : (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur opacity-10 transition-opacity"></div>
            <div className="relative bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-full p-2 flex items-center shadow-2xl">
                <Search className="ml-4 text-gray-400" size={20}/>
                <input 
                    type="text" 
                    placeholder="Search missions, skills, or keywords..."
                    className="w-full bg-transparent px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="pr-1 flex gap-2">
                    <button type="button" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 transition-all"><Filter size={18}/></button>
                    <Button type="button" className="rounded-full px-6 bg-gray-900 dark:bg-white text-white dark:text-black font-bold tracking-tight shadow-md">SEARCH</Button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* --- AI MATCH RESULTS --- */}
      {aiResults && isClient && (
        <div className="px-4 mt-12 mb-8 animate-fade-in-up">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500"/> Top AI Matches
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AiResultCard title="Best Overall" icon={<Flame size={14}/>} freelancer={aiResults.best} colorClass="border-orange-200 text-orange-600" setActiveChat={setActiveChat} setTab={setTab} />
              <AiResultCard title="Fastest Reply" icon={<Zap size={14}/>} freelancer={aiResults.fast} colorClass="border-yellow-200 text-yellow-600" setActiveChat={setActiveChat} setTab={setTab} />
              <AiResultCard title="Best Value" icon={<DollarSign size={14}/>} freelancer={aiResults.budget} colorClass="border-emerald-200 text-emerald-600" setActiveChat={setActiveChat} setTab={setTab} />
            </div>
            <div className="mt-8 mb-4 flex items-center gap-4">
                <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or browse catalog</span>
                <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
            </div>
        </div>
      )}

      {/* --- MAIN FEED --- */}
      <div className="px-4 mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">
                 {isClient ? 'Talent Catalog' : 'Mission Board'}
              </h2>
              
              {/* ELITE TOGGLE FOR FREELANCERS ONLY */}
              {!isClient && (
                  <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-full flex items-center border border-gray-200 dark:border-white/10 w-fit shrink-0">
                      <button 
                          onClick={() => handleToggle('normal')}
                          className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${jobView === 'normal' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                          Normal
                      </button>
                      <button 
                          onClick={() => handleToggle('elite')}
                          className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${jobView === 'elite' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20' : 'text-gray-500 hover:text-amber-500'}`}
                      >
                          <Crown size={14} className={jobView === 'elite' ? 'fill-white' : ''}/> Elite
                      </button>
                  </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {isClient 
                ? services.map(s => <JobCard key={s.id} data={s} type="Gig" isClient={isClient} onAction={onAction} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} />)
                : publicMissions.map(j => <JobCard key={j.id} data={j} type="Mission" isClient={isClient} onAction={onAction} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} />)
            }
          </div>
      </div>

      {/* --- EMPTY STATE --- */}
      {((!isClient && publicMissions.length === 0) || (isClient && services.length === 0)) && (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[40px] bg-gray-50 dark:bg-white/5 m-4 text-center">
           <Briefcase size={48} className="text-gray-300 mb-4"/>
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Void Detected</h3>
           <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
               {jobView === 'elite' ? "No Elite Missions currently available. Check back later!" : "No signals matching your query. Try adjusting your search terms."}
           </p>
        </div>
      )}

      {/* --- REPORT MODAL --- */}
      {reportModal && (
        <Modal title="Report Post" onClose={() => setReportModal(null)}>
            <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 flex gap-3 text-red-800 dark:text-red-200">
                    <Flag size={18} />
                    <p className="text-xs">Reports are reviewed by admins. False reporting may lead to a ban.</p>
                </div>
                <select name="reason" required className="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-red-500">
                    <option value="">Select a reason...</option>
                    <option value="Scam/Fraud">Scam or Fraudulent Activity</option>
                    <option value="Harassment">Harassment / Abusive Content</option>
                    <option value="Misleading">Misleading Description</option>
                    <option value="Inappropriate">Inappropriate Content</option>
                </select>
                <textarea name="description" required placeholder="Describe the issue..." className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] text-sm dark:bg-gray-800 dark:text-white resize-none"></textarea>
                <div className="flex justify-end gap-3 pt-2">
                     <Button variant="ghost" type="button" onClick={() => setReportModal(null)}>Cancel</Button>
                     <Button className="bg-red-600 hover:bg-red-700 text-white">Submit Report</Button>
                </div>
            </form>
        </Modal>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar{display:none;} 
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
        @keyframes shimmer {
            0% { transform: translateX(-150%) skewX(12deg); }
            100% { transform: translateX(150%) skewX(12deg); }
        }
        .animate-shimmer {
            animation: shimmer 2.5s infinite linear;
        }
      `}} />
    </div>
  );
};

export default Jobs;