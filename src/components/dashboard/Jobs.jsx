import React, { useState } from 'react';
import { 
  Search, MapPin, ArrowUpRight, Sparkles, Filter, Briefcase, 
  ChevronDown, ChevronUp, Clock, Calendar, DollarSign, Flag, AlertTriangle,
  Loader2, Flame, Zap, Crown, User, Star, Paperclip, ShieldCheck, Cpu, Award
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

// --- HELPER: STRICT ELITE CHECK ---
const checkIsElite = (val) => {
    return val === true || String(val).toLowerCase() === 'true' || val === 1 || val === '1';
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

// --- TALENT CARD COMPONENT (FOR CLIENTS) ---
const TalentCard = ({ freelancer, onAction, setActiveChat, setTab }) => {
    const isElite = freelancer.current_plan === 'Elite';
    
    return (
        <div className={`group relative bg-white dark:bg-[#09090b] rounded-[24px] border ${isElite ? 'border-amber-500/30 hover:border-amber-400 shadow-md' : 'border-gray-200 dark:border-white/10 hover:border-indigo-500/30'} p-6 flex flex-col hover:-translate-y-1 transition-all hover:shadow-xl overflow-hidden`}>
            
            {/* Elite Badge */}
            {isElite && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black shadow-lg shadow-amber-500/30 z-20">
                    <Crown size={12} className="fill-white" /> ELITE
                </div>
            )}

            <div className="flex items-center gap-4 mb-5 mt-2">
                <div className="relative">
                    <div className={`absolute -inset-1 rounded-full blur opacity-40 ${isElite ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                    <img src={freelancer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${freelancer.id}`} alt="avatar" className="w-16 h-16 rounded-full bg-gray-100 relative z-10 border-2 border-white dark:border-gray-800 object-cover" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                        {freelancer.name}
                        <ShieldCheck size={14} className="text-emerald-500" title="Identity Verified"/>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{freelancer.tag_line || freelancer.specialty || 'Digital Creator'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex flex-col justify-center border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><DollarSign size={12}/> Rate</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">₹{freelancer.hourly_rate || 0}<span className="text-[10px] text-gray-500 font-normal">/hr</span></p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex flex-col justify-center border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1"><Star size={12}/> Rating</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1">{freelancer.rating || "5.0"}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                {(freelancer.unlocked_skills || ['Creative', 'Tech']).slice(0,3).map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => onAction('view_profile', freelancer)}>
                    <User size={14} className="mr-1"/> Profile
                </Button>
                <Button className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20" onClick={() => {
                    setActiveChat({ id: freelancer.id, name: freelancer.name });
                    setTab('messages');
                }}>
                    Chat <ArrowUpRight size={14}/>
                </Button>
            </div>
        </div>
    )
}

// --- STANDARD JOB CARD COMPONENT (FOR FREELANCERS) ---
const JobCard = ({ data, type, isClient, onAction, setModal, setActiveChat, setTab, setSelectedJob }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const description = data?.description || "No description provided.";
    const isLongText = description.length > 120;
    const displayName = data.client_name || 'Client';
    const isElite = checkIsElite(data.is_elite);
    
    const hasAttachments = data.attachments && data.attachments.length > 0;

    const gradients = [
        "from-pink-500/80 via-rose-500/80 to-yellow-500/80", 
        "from-blue-400/80 via-indigo-500/80 to-purple-500/80", 
        "from-emerald-400/80 via-teal-500/80 to-cyan-500/80", 
    ];
    
    const headerGradient = isElite 
        ? "from-amber-600/60 via-yellow-500/40 to-orange-700/60" 
        : gradients[(data.id || 0) % gradients.length];
        
    const cardBg = isElite 
        ? "bg-gradient-to-br from-[#1a1a1a] via-[#111111] to-[#000000] border-amber-500/30 hover:border-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.25)]" 
        : "bg-white dark:bg-[#09090b] border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 hover:shadow-xl";
        
    const titleColor = isElite ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-sm" : "text-gray-900 dark:text-white";
    const pillBg = isElite ? "bg-amber-500/10 border-amber-500/20" : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5";
    const pillText = isElite ? "text-amber-100" : "text-gray-700 dark:text-gray-200";
    const subText = isElite ? "text-amber-200/50" : "text-gray-400 uppercase";
    const iconColor = isElite ? "text-amber-400" : "text-indigo-500 dark:text-indigo-400";
    const typeIconColor = isElite ? "text-amber-400" : "text-purple-500 dark:text-purple-400";
    const descriptionColor = isElite ? "text-gray-300" : "text-gray-600 dark:text-gray-300";
    const tagBg = isElite ? "bg-amber-500/20 border-amber-500/30 text-amber-200" : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300";
    const priceColor = isElite ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500" : "text-gray-900 dark:text-white";

    return (
      <div className={`group relative rounded-[24px] border transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col h-full ${cardBg}`}>
        
        {isElite && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black shadow-[0_0_15px_rgba(245,158,11,0.6)] z-20 overflow-hidden ring-1 ring-white/30">
                <Crown size={12} className="fill-black relative z-10" /> 
                <span className="relative z-10 tracking-wider">ELITE</span>
            </div>
        )}

        <div className={`h-28 w-full relative overflow-hidden bg-gradient-to-br ${headerGradient}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
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
                  Client: {displayName}
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

            <div className="mb-4 relative">
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

            {hasAttachments && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    {data.attachments.map((url, idx) => (
                        <a 
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-transform active:scale-95 hover:shadow-md ${
                                isElite 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                            }`}
                        >
                            <Paperclip size={12} />
                            View File {data.attachments.length > 1 ? idx + 1 : ''}
                        </a>
                    ))}
                </div>
            )}

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
                         const reportPayload = { target_type: 'job', target_id: data.id, reported_user_id: data.client_id };
                         if (onAction) onAction('report', reportPayload);
                         else if (setModal) setModal(reportPayload); 
                      }}
                      className={`text-[10px] flex items-center gap-1 mt-1 transition-colors ${isElite ? 'text-gray-500 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}
                    >
                      <Flag size={10} /> Report
                    </button>
                </div>
                
                <button 
                   onClick={() => (setSelectedJob(data), setModal('apply-job'))}
                   className={`h-10 px-5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg ${
                     isElite 
                     ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300' 
                     : 'bg-gray-900 dark:bg-white text-white dark:text-black'
                   }`}
                >
                    Apply
                    <ArrowUpRight size={16} strokeWidth={isElite ? 3 : 2.5}/>
                </button>
            </div>
        </div>
      </div>
    )
}

// --- MAIN JOBS COMPONENT ---
const Jobs = ({ 
    user, showToast, isClient, freelancersList = [], filteredJobs = [], 
    searchTerm, setSearchTerm, setModal, setActiveChat, setTab, setSelectedJob, onAction 
}) => {
  
  const [reportModal, setReportModal] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  
  const [jobView, setJobView] = useState('normal'); 

  // --- FILTER 1: FREELANCER VIEW (Missions) ---
  const publicMissions = filteredJobs.filter(job => {
      if (job.category === 'Direct Hire') return false;
      if (job.status && !['Pending', 'Open'].includes(job.status)) return false;

      const isElite = checkIsElite(job.is_elite);
      if (jobView === 'elite' && !isElite) return false; 
      if (jobView === 'normal' && isElite) return false; 

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
      <div className="sticky top-6 z-[100] mx-auto max-w-4xl px-4">
        {isClient ? (
          <div className="bg-white/90 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-xl relative overflow-hidden">
            {/* Soft decorative background glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="text-center mb-5 sm:mb-6 relative z-10">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
                    <Sparkles className="text-indigo-500 shrink-0" size={24}/> AI Talent Matcher
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto leading-relaxed">
                    Don't waste time scrolling. Describe your exact project, required skills, and budget, and our AI will find the perfect freelancer for you.
                </p>
            </div>

            <form onSubmit={handleAiSearch} className="relative group z-10">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[1.5rem] sm:rounded-full blur opacity-10 group-hover:opacity-30 transition-opacity"></div>
                
                {/* 🚀 RESPONSIVE CONTAINER: Stacks on mobile, pill on desktop */}
                <div className="relative bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-full p-1.5 sm:p-2 flex flex-col sm:flex-row items-stretch sm:items-center shadow-inner gap-2 sm:gap-0">
                    
                    <div className="flex items-center flex-1 px-2 sm:pl-4 sm:pr-2">
                        {isAiSearching ? (
                            <Loader2 className="text-indigo-500 animate-spin shrink-0" size={20} />
                        ) : (
                            <Search className={`shrink-0 transition-colors ${searchTerm ? 'text-indigo-500' : 'text-gray-400'}`} size={20}/>
                        )}
                        <input 
                            type="text" 
                            placeholder="e.g., Need a Python dev for ₹1500/hr..."
                            className="w-full bg-transparent px-3 sm:px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-xs sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex shrink-0 w-full sm:w-auto">
                        <Button 
                            type="submit" 
                            disabled={isAiSearching || !searchTerm} 
                            className="w-full sm:w-auto rounded-xl sm:rounded-full py-3 sm:py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-tight shadow-md shadow-indigo-500/20 text-xs sm:text-sm whitespace-nowrap flex justify-center items-center transition-all"
                        >
                            {isAiSearching ? 'SEARCHING...' : 'FIND TALENT'}
                        </Button>
                    </div>
                </div>
            </form>
            
            {parsedData && (
              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-3 animate-fade-in-up relative z-10">
                  <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1.5 shadow-sm">
                    <DollarSign size={14}/> Budget: ₹{parsedData.budget || 'Flexible'}
                  </span>
                  <span className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Clock size={14}/> Priority: {parsedData.urgency || 'Normal'}
                  </span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[1.5rem] sm:rounded-full blur opacity-10 transition-opacity"></div>
            
            {/* 🚀 RESPONSIVE CONTAINER: Stacks on mobile, pill on desktop */}
            <div className="relative bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-full p-1.5 sm:p-2 flex flex-col sm:flex-row items-stretch sm:items-center shadow-2xl gap-2 sm:gap-0">
                
                <div className="flex items-center flex-1 px-2 sm:pl-4 sm:pr-2">
                    <Search className="text-gray-400 shrink-0" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Search missions, skills, or keywords..."
                        className="w-full bg-transparent px-3 sm:px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium text-xs sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                    <button 
                        type="button" 
                        className="flex-1 sm:flex-none sm:w-10 sm:h-10 py-3 sm:py-0 rounded-xl sm:rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-all"
                    >
                        <Filter size={18}/>
                    </button>
                    <Button 
                        type="button" 
                        className="flex-[2] sm:flex-none rounded-xl sm:rounded-full py-3 sm:py-2.5 px-6 bg-gray-900 dark:bg-white text-white dark:text-black font-bold tracking-tight shadow-md text-xs sm:text-sm flex justify-center items-center"
                    >
                        SEARCH
                    </Button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* --- AI MATCH RESULTS --- */}
      {aiResults && isClient && (
        <div className="px-4 mt-12 mb-8 animate-fade-in-up">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500"/> Top Recommended Professionals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AiResultCard title="Best Overall Match" icon={<Flame size={14}/>} freelancer={aiResults.best} colorClass="border-orange-200 text-orange-600" setActiveChat={setActiveChat} setTab={setTab} />
              <AiResultCard title="Fastest Responder" icon={<Zap size={14}/>} freelancer={aiResults.fast} colorClass="border-yellow-200 text-yellow-600" setActiveChat={setActiveChat} setTab={setTab} />
              <AiResultCard title="Most Cost Effective" icon={<DollarSign size={14}/>} freelancer={aiResults.budget} colorClass="border-emerald-200 text-emerald-600" setActiveChat={setActiveChat} setTab={setTab} />
            </div>
            <div className="mt-12 mb-4 flex items-center gap-4">
                <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or browse full talent directory</span>
                <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
            </div>
        </div>
      )}

      {/* --- MAIN FEED --- */}
      <div className="px-4 mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              
              {isClient ? (
                  <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                          Verified Talent Directory <ShieldCheck className="text-emerald-500" size={24}/>
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Browse our curated list of top-rated professionals ready for your next project.</p>
                  </div>
              ) : (
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">
                      Mission Board
                  </h2>
              )}
              
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
                ? freelancersList.map(f => <TalentCard key={f.id} freelancer={f} onAction={onAction} setActiveChat={setActiveChat} setTab={setTab} />)
                : publicMissions.map(j => <JobCard key={j.id} data={j} type="Mission" isClient={false} onAction={onAction} setModal={setModal} setActiveChat={setActiveChat} setTab={setTab} setSelectedJob={setSelectedJob} />)
            }
          </div>
      </div>

      {/* --- EMPTY STATE --- */}
      {((!isClient && publicMissions.length === 0) || (isClient && freelancersList.length === 0)) && (
        <div className={`flex flex-col items-center justify-center ${isClient ? 'py-12' : 'py-32 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[40px] bg-gray-50 dark:bg-[#0B0F19] m-4 text-center'}`}>
           
           {isClient ? (
               <div className="w-full max-w-5xl mx-auto bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 md:p-12 shadow-xl">
                   <div className="text-center mb-10">
                       <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4">Hire Top-Tier Talent, Risk-Free</h3>
                       <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                           Our platform is built to protect you. From AI-driven matchmaking to secure escrow payments, we ensure your project is a success from start to finish.
                       </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="bg-gray-50 dark:bg-[#0B0F19] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                           <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4"><Cpu size={24}/></div>
                           <h4 className="font-bold text-gray-900 dark:text-white mb-2">Smart AI Matching</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Type your exact requirements in the search bar above, and our AI will instantly filter thousands of profiles to find your perfect match.</p>
                       </div>
                       <div className="bg-gray-50 dark:bg-[#0B0F19] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                           <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4"><ShieldCheck size={24}/></div>
                           <h4 className="font-bold text-gray-900 dark:text-white mb-2">Secure Escrow Protection</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Your payment is held safely in escrow. Funds are only released to the freelancer once you review and approve the final work.</p>
                       </div>
                       <div className="bg-gray-50 dark:bg-[#0B0F19] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                           <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-4"><Award size={24}/></div>
                           <h4 className="font-bold text-gray-900 dark:text-white mb-2">Verified Professionals</h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Every freelancer goes through strict identity and skill verification, ensuring you only work with reliable, high-quality creators.</p>
                       </div>
                   </div>
               </div>
           ) : (
               <>
                   <Briefcase size={48} className="text-gray-300 mb-4"/>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Void Detected</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                       {jobView === 'elite' ? "No Elite entries currently available. Check back later!" : "No signals matching your query. Try adjusting your search terms."}
                   </p>
               </>
           )}
           
        </div>
      )}

      {/* --- REPORT MODAL --- */}
      {reportModal && (
        <Modal title="Report" onClose={() => setReportModal(null)}>
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