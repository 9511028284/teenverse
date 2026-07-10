import React, { useState } from 'react';
import {
  Search, MapPin, ArrowUpRight, Sparkles, Filter, Briefcase,
  ChevronDown, ChevronUp, Clock, Calendar, DollarSign, Flag, AlertTriangle,
  Loader2, Flame, Zap, Crown, User, Star, Paperclip, ShieldCheck, Cpu, Award,
  BadgeCheck
} from 'lucide-react';
import { supabase } from '../../supabase';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { getEffectivePlanName, isPremiumPlanActive } from '../../utils/subscription';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const unwrapFunctionData = (payload) => payload?.success ? payload.data : payload;

const getFunctionErrorMessage = async (error, fallback) => {
  const contextBody = await error?.context?.json?.().catch(() => null);
  return contextBody?.error || error?.message || fallback;
};

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

// --- HELPER: SAFE INT STRING HASH ---
const getStableIndex = (idString, modLimit) => {
    if (!idString) return 0;
    const str = String(idString);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % modLimit;
};

// --- AI RESULT CARD COMPONENT ---
const AiResultCard = ({ title, icon, freelancer, colorClass, setActiveChat, setTab }) => {
    if (!freelancer) return null;
    return (
      <div className={cn(
        "p-5 rounded-[24px] border bg-white relative overflow-hidden group transition-all duration-300 ease-out hover:-translate-y-1 text-left",
        "shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(0,0,0,0.02)]",
        "dark:bg-slate-900/40 dark:border-white/[0.04] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_12px_28px_rgba(0,0,0,0.25)]",
        colorClass
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 rounded-bl-full pointer-events-none" />

        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-3.5 text-current">
            {icon} {title}
        </div>

        <div className="flex justify-between items-start mb-4 gap-3">
            <div className="min-w-0">
                <h4 className="font-black text-lg text-slate-900 dark:text-white tracking-tight truncate">{freelancer.name || 'Pro Creator'}</h4>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                        {freelancer.match_score || 95}% Match
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        <Star size={11} className="fill-amber-400 text-amber-400 mb-0.5"/> {freelancer.rating || "5.0"}
                    </span>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="font-black text-slate-900 dark:text-white text-lg font-mono leading-none">₹{freelancer.hourly_rate || 0}<span className="text-[10px] text-slate-400 font-bold font-sans">/hr</span></p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Replies in {freelancer.response_speed_hours ?? 24}h</p>
            </div>
        </div>

        {freelancer.reasons && freelancer.reasons.length > 0 && (
            <ul className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-5 space-y-1.5 border-t border-slate-100 dark:border-white/[0.04] pt-3">
                {freelancer.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-tight">
                        <Sparkles size={12} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5"/>
                        <span>{r}</span>
                    </li>
                ))}
            </ul>
        )}

        <Button
            onClick={() => {
                setActiveChat({ id: freelancer.id, name: freelancer.name });
                setTab('messages');
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-transform active:scale-95 shadow-sm"
        >
            Chat & Hire Now
        </Button>
      </div>
    );
};

// --- TALENT CARD COMPONENT (FOR CLIENTS) ---
const TalentCard = ({ freelancer, onAction, setActiveChat, setTab, onTriggerReport }) => {
    const isElite = freelancer.current_plan === 'Elite' && isPremiumPlanActive(freelancer);

    return (
        <div className={cn(
            "group relative rounded-[28px] border p-6 flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 text-left",
            isElite
              ? 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_6px_20px_rgba(245,158,11,0.04)] dark:from-amber-950/20 dark:to-slate-900/40 dark:border-amber-500/30 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_16px_36px_rgba(0,0,0,0.35)] hover:border-amber-400 dark:hover:border-amber-500/50'
              : 'bg-white border-slate-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(0,0,0,0.01)] dark:bg-slate-900/40 dark:border-white/[0.05] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)] hover:border-indigo-500/20 dark:hover:border-indigo-500/30'
        )}>

            {/* Elite Badge */}
            {isElite && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-xl flex items-center gap-1 text-[10px] font-black tracking-widest shadow-sm z-20 border border-amber-300 dark:border-transparent">
                    <Crown size={11} className="fill-white" /> ELITE CREATOR
                </div>
            )}

            <div className="flex items-center gap-4 mb-5 mt-2">
                <div className="relative shrink-0">
                    <div className={cn("absolute -inset-1 rounded-full blur opacity-30 animate-pulse", isElite ? 'bg-amber-500' : 'bg-indigo-500')} />
                    <img src={freelancer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${freelancer.id}`} alt="avatar" className="w-14 h-14 rounded-full bg-slate-50 relative z-10 border-2 border-white dark:border-slate-800 object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
                        <span className="truncate">{freelancer.name}</span>
                        <ShieldCheck size={16} strokeWidth={2.5} className="text-emerald-500 shrink-0" title="Identity Verified"/>
                    </h3>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">{freelancer.tag_line || freelancer.specialty || 'Digital Creator'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl flex flex-col justify-center border border-slate-200/40 dark:border-white/[0.04]">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1 flex items-center gap-1"><DollarSign size={11} strokeWidth={2.5} className="text-indigo-500"/> Rate</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">₹{freelancer.hourly_rate || 0}<span className="text-[10px] text-slate-400 font-bold font-sans">/hr</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl flex flex-col justify-center border border-slate-200/40 dark:border-white/[0.04]">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1 flex items-center gap-1"><Star size={11} strokeWidth={2.5} className="text-amber-500"/> Score</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-0.5 font-mono"><Star size={12} className="fill-amber-400 text-amber-400 mb-0.5"/> {freelancer.rating || "5.0"}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6 mt-auto">
                {(freelancer.unlocked_skills || ['Creative', 'Tech']).slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/[0.04] bg-slate-50 dark:bg-white/5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {skill}
                    </span>
                ))}
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.04] items-center justify-between">
                <Button variant="outline" className="flex-1 text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-800" onClick={() => onAction('view_profile', freelancer)}>
                    <User size={13} className="mr-1"/> Portfolio
                </Button>
                <Button className="flex-1 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl h-9 transition-transform active:scale-95" onClick={() => {
                    setActiveChat({ id: freelancer.id, name: freelancer.name });
                    setTab('messages');
                }}>
                    Let's Chat <ArrowUpRight size={13} strokeWidth={2.5}/>
                </Button>
            </div>

            <button
              onClick={() => onTriggerReport({ target_type: 'user', target_id: freelancer.id, reported_user_id: freelancer.id })}
              className="text-[9px] font-bold text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 flex items-center gap-1 mt-2.5 transition-colors self-start ml-1"
            >
                <Flag size={10}/> Report Profile
            </button>
        </div>
    );
};

// --- STANDARD JOB CARD COMPONENT (FOR FREELANCERS) ---
const JobCard = ({ data, type, onTriggerReport, launchApplyModal }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const description = data?.description || "No description details provided.";
    const isLongText = description.length > 120;
    const displayName = data.client_name || 'Client';
    const isOfficialClient = data.client_is_official === true;
    const verifiedLabel = data.client_verified_label || 'Official Account Verified';
    const isElite = checkIsElite(data.is_elite);

    const hasAttachments = data.attachments && data.attachments.length > 0;

    const gradients = [
        "from-pink-500/80 via-rose-500/80 to-yellow-500/80",
        "from-blue-400/80 via-indigo-500/80 to-purple-500/80",
        "from-emerald-400/80 via-teal-500/80 to-cyan-500/80",
    ];

    const headerGradient = isElite
        ? "from-amber-600/60 via-yellow-500/40 to-orange-700/60"
        : gradients[getStableIndex(data.id, gradients.length)];

    const cardBg = isElite
        ? "bg-gradient-to-br from-[#161616] via-[#111111] to-[#070913] border-amber-500/30 hover:border-amber-400 shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.05),_0_8px_24px_rgba(0,0,0,0.5)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_20px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.2)]"
        : "bg-white border-slate-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(0,0,0,0.01)] dark:bg-slate-900/40 dark:border-white/[0.05] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)] hover:border-indigo-500/20 dark:hover:border-indigo-500/30";

    const titleColor = isElite ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-400 drop-shadow-sm" : "text-slate-900 dark:text-white";
    const pillBg = isElite ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-white/[0.04]";
    const pillText = isElite ? "text-amber-100" : "text-slate-700 dark:text-slate-200";
    const subText = isElite ? "text-amber-300/40" : "text-slate-400 dark:text-slate-500";
    const iconColor = isElite ? "text-amber-400" : "text-indigo-500 dark:text-indigo-400";
    const typeIconColor = isElite ? "text-amber-400" : "text-purple-500 dark:text-purple-400";
    const descriptionColor = isElite ? "text-slate-300" : "text-slate-600 dark:text-slate-300";
    const tagBg = isElite ? "bg-amber-500/20 border-amber-500/30 text-amber-200" : "bg-slate-100 dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300";
    const priceColor = isElite ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400" : "text-slate-900 dark:text-white";

    return (
      <div className={cn("group relative rounded-[28px] border transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden flex flex-col h-full text-left", cardBg)}>

        {isElite && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-black px-3 py-1 rounded-xl flex items-center gap-1.5 text-[10px] font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] z-20 ring-1 ring-white/20">
                <Crown size={11} className="fill-black relative z-10" />
                <span className="relative z-10 tracking-widest uppercase">Elite Drop</span>
            </div>
        )}

        <div className={cn("h-24 w-full relative overflow-hidden bg-gradient-to-br", headerGradient)}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
            <div className={cn("absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t to-transparent", isElite ? 'from-[#161616]' : 'from-white dark:from-[#070A14]')} />
            <div className={cn("absolute top-4 right-4 backdrop-blur-md border px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-20", isElite ? 'bg-slate-950/60 border-amber-500/30 text-amber-300' : 'bg-white/90 dark:bg-slate-950/40 border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white')}>
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_6px_currentColor]", isElite ? 'bg-amber-400' : 'bg-emerald-500')} />
                <span className="text-[9px] font-black uppercase tracking-wider">{type}</span>
            </div>
        </div>

        <div className="p-6 pt-0 flex flex-col flex-grow relative z-10 -mt-1">
            <div className="mb-4">
              <h3 className={cn("text-lg font-black leading-snug mb-2 transition-all tracking-tight group-hover:opacity-90", isExpanded ? '' : 'line-clamp-2', titleColor)}>
                  {data.title || 'Untitled Gig Post'}
              </h3>
              <div className={cn("text-xs font-bold flex items-center gap-2 mt-2", isElite ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400')}>
                  <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black uppercase shadow-inner", isElite ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
                    {displayName.charAt(0)}
                  </span>
                  <span className="truncate">{displayName}</span>
                  {isOfficialClient && (
                    <BadgeCheck
                      size={15}
                      strokeWidth={2.8}
                      className="shrink-0 fill-sky-500 text-white drop-shadow-sm"
                      title={verifiedLabel}
                    />
                  )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 font-bold">
                <div className={cn("border rounded-xl p-2.5 flex items-center gap-2", pillBg)}>
                    <Clock size={14} strokeWidth={2.5} className={iconColor}/>
                    <div className="leading-tight">
                        <p className={cn("text-[9px] font-black uppercase tracking-wider", subText)}>Timeline</p>
                        <p className={cn("text-xs font-black truncate mt-0.5", pillText)}>{data.duration || "Flexible"}</p>
                    </div>
                </div>
                <div className={cn("border rounded-xl p-2.5 flex items-center gap-2", pillBg)}>
                    <Briefcase size={14} strokeWidth={2.5} className={typeIconColor}/>
                    <div className="leading-tight">
                        <p className={cn("text-[9px] font-black uppercase tracking-wider", subText)}>Job Structure</p>
                        <p className={cn("text-xs font-black truncate mt-0.5", pillText)}>{data.job_type || "Fixed Pay"}</p>
                    </div>
                </div>
                <div className={cn("col-span-2 border rounded-xl p-2 flex items-center gap-1.5 justify-center", pillBg)}>
                    <Calendar size={12} strokeWidth={2.5} className={isElite ? "text-amber-500/40" : "text-slate-400"}/>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider font-mono", isElite ? 'text-amber-200/50' : 'text-slate-400 dark:text-slate-500')}>
                        Posted {getTimeAgo(data.created_at)}
                    </span>
                </div>
            </div>

            <div className="mb-4 relative">
                <p className={cn("text-xs font-medium leading-relaxed", isExpanded ? '' : 'line-clamp-3', descriptionColor)}>
                    {description}
                </p>
                {isLongText && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className={cn("mt-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors hover:underline outline-none", isElite ? 'text-amber-400 hover:text-amber-300' : 'text-indigo-600 dark:text-indigo-400')}
                    >
                        {isExpanded ? <>Show Less <ChevronUp size={11} strokeWidth={2.5}/></> : <>Read Full Bio <ChevronDown size={11} strokeWidth={2.5}/></>}
                    </button>
                )}
            </div>

            {hasAttachments && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    {data.attachments.map((url, idx) => (
                        <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95",
                              isElite
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20'
                                : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50'
                            )}
                        >
                            <Paperclip size={11} strokeWidth={2.5} />
                            Brief File {data.attachments.length > 1 ? idx + 1 : ''}
                        </a>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                {(data.tags ? data.tags.split(',') : [data.category || 'Gig']).slice(0,3).map((t, i) => (
                    <span key={i} className={cn("px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider", tagBg)}>
                        {t.trim()}
                    </span>
                ))}
            </div>

            <div className={cn("pt-4 border-t flex items-center justify-between", isElite ? 'border-amber-500/10' : 'border-slate-100 dark:border-white/[0.04]')}>
                <div className="text-left">
                    <p className={cn("text-[9px] uppercase tracking-widest font-black mb-0.5", isElite ? 'text-amber-500/50' : 'text-slate-400 dark:text-slate-500')}>Offer Payout</p>
                    <div className={cn("flex items-baseline font-black text-lg font-mono leading-none", priceColor)}>
                        <span className={cn("text-xs font-bold mr-0.5 font-sans", isElite ? 'text-amber-600' : 'text-slate-400')}>₹</span>
                        {data.price || data.budget || 0}
                    </div>
                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         onTriggerReport({ target_type: 'job', target_id: data.id, reported_user_id: data.client_id || data.user_id });
                      }}
                      className={cn("text-[9px] font-bold flex items-center gap-1 mt-2 transition-colors outline-none", isElite ? 'text-slate-600 hover:text-red-400' : 'text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400')}
                    >
                      <Flag size={9} strokeWidth={2.5} /> Flag Post
                    </button>
                </div>

                <button
                   onClick={() => launchApplyModal(data)}
                   className={cn(
                     "h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all outline-none",
                     isElite
                       ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-black border border-amber-300 shadow-md shadow-amber-500/10'
                       : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                   )}
                >
                    Apply Now
                    <ArrowUpRight size={15} strokeWidth={3}/>
                </button>
            </div>
        </div>
      </div>
    );
};

// --- MAIN JOBS COMPONENT ---
const Jobs = ({
    user, showToast, isClient, freelancersList = [], filteredJobs = [],
    searchTerm, setSearchTerm, setModal, setActiveChat, setTab, setSelectedJob, onAction
}) => {

  const [localReportModal, setLocalReportModal] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [jobView, setJobView] = useState('normal');

  const publicMissions = filteredJobs.filter(job => {
      if (job.category === 'Direct Hire') return false;
      if (job.status && !['Pending', 'Open'].includes(job.status)) return false;

      const isElite = checkIsElite(job.is_elite);
      if (jobView === 'elite' && !isElite) return false;
      if (jobView === 'normal' && isElite) return false;

      return true;
  });

  const handleToggle = (view) => {
      if (view === 'elite' && getEffectivePlanName(user) !== 'Elite') {
          if (showToast) showToast("Subscription verification failed. Upgrade to Elite to scan premium jobs.", "error");
          return;
      }
      setJobView(view);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!localReportModal) return;
    const formData = new FormData(e.target);
    onAction?.('report', localReportModal, { reason: formData.get('reason'), description: formData.get('description') });
    setLocalReportModal(null);
  };

  const launchApplyModal = (jobObject) => {
      setSelectedJob(jobObject);
      setModal('apply-job');
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
      if (error) throw new Error(await getFunctionErrorMessage(error, "Talent matching failed."));
      const payload = unwrapFunctionData(data);

      setParsedData(payload.parsed);
      if (payload.results && payload.results.length > 0) {
          const best = payload.results[0];
          const remaining = payload.results.filter(f => f.id !== best.id);
          const fast = remaining.length > 0 ? remaining.reduce((prev, curr) => (curr.response_speed_hours ?? 24) < (prev.response_speed_hours ?? 24) ? curr : prev) : null;
          const budget = remaining.filter(f => f.id !== fast?.id).reduce((prev, curr) => curr.hourly_rate < prev.hourly_rate ? curr : prev, remaining[0] || null);
          setAiResults({ best, fast, budget });
      }
    } catch (err) {
      console.error("AI Match Error:", err);
      if (showToast) showToast(err.message || "Talent matching failed.", "error");
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className={cn("min-h-screen pb-20 relative px-0 text-center space-y-8", isClient ? 'mx-auto w-full max-w-7xl' : '')}>

      {/* --- FLOATING CONTROLLERS BAR --- */}
      <div className="sticky top-6 z-[40] mx-auto max-w-4xl px-4">
        {isClient ? (
          /* Client AI Match Panel */
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-white/[0.04] rounded-[28px] p-5 sm:p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),_0_12px_36px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_20px_40px_rgba(0,0,0,0.35)] relative overflow-hidden text-center">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-4 relative z-10">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 tracking-tight">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 shrink-0" size={22} strokeWidth={2.5}/> Smart AI Matcher
                </h2>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
                    Describe your project scope, ideal tech stack, or maximum target budget to find the perfect creator instantly.
                </p>
            </div>

            <form onSubmit={handleAiSearch} className="relative group z-10 w-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl sm:rounded-full blur opacity-10 group-hover:opacity-20 transition-all duration-300" />

                <div className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.05] rounded-2xl sm:rounded-full p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center shadow-inner gap-2 sm:gap-0">
                    <div className="flex items-center flex-1 px-2.5">
                        {isAiSearching ? (
                            <Loader2 className="text-indigo-500 animate-spin shrink-0" size={18} strokeWidth={2.5} />
                        ) : (
                            <Search className={cn("shrink-0 transition-colors", searchTerm ? 'text-indigo-500' : 'text-slate-400')} size={18} strokeWidth={2.5}/>
                        )}
                        <input
                            type="text"
                            placeholder="e.g., Need a Python developer to build a video editor backend..."
                            className="w-full bg-transparent px-3 py-2.5 outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs sm:text-sm"
                            value={searchTerm || ''}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex shrink-0 w-full sm:w-auto">
                        <Button
                            type="submit"
                            disabled={isAiSearching || !searchTerm}
                            className="w-full sm:w-auto rounded-xl sm:rounded-full py-3 sm:py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md whitespace-nowrap flex justify-center items-center dark:bg-indigo-500 active:scale-95 transition-transform"
                        >
                            {isAiSearching ? 'Scanning Network...' : 'Find Matches'}
                        </Button>
                    </div>
                </div>
            </form>

            {parsedData && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 animate-fade-in-up relative z-10">
                  <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1 shadow-sm">
                    <DollarSign size={13} strokeWidth={2.5}/> Budget: ₹{parsedData.budget || 'Flexible'}
                  </span>
                  <span className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 rounded-full flex items-center gap-1 shadow-sm">
                    <Clock size={13} strokeWidth={2.5}/> Urgency: {parsedData.urgency || 'Normal'}
                  </span>
              </div>
            )}
          </div>
        ) : (
          /* Freelancer Main Filter Search Box */
          <div className="relative group w-full">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl sm:rounded-full blur opacity-10 transition-opacity" />
            <div className="relative bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/[0.05] rounded-2xl sm:rounded-full p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center shadow-md gap-2 sm:gap-0">
                <div className="flex items-center flex-1 px-2.5">
                    <Search className="text-slate-400 shrink-0" size={18} strokeWidth={2.5}/>
                    <input
                        type="text"
                        placeholder="Search open work, verified requirements, or keywords..."
                        className="w-full bg-transparent px-3 py-2.5 outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold text-xs sm:text-sm"
                        value={searchTerm || ''}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-1.5 w-full sm:w-auto shrink-0">
                    <button
                        type="button"
                        className="flex-1 sm:flex-none sm:w-10 sm:h-10 py-3 sm:py-0 rounded-xl sm:rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                        <Filter size={16} strokeWidth={2.5}/>
                    </button>
                    <Button
                        type="button"
                        className="flex-[2] sm:flex-none rounded-xl sm:rounded-full py-3 sm:py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm"
                    >
                        Search Gigs
                    </Button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* --- TOP MATCHES EXPANSION PANEL --- */}
      {aiResults && isClient && (
        <div className="mx-auto w-full max-w-5xl px-4 mt-8 mb-4 animate-fade-in-up">
            <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] mb-4 flex items-center justify-center gap-2">
                <Sparkles size={14} className="text-indigo-500 animate-pulse"/> Smartest Recommendations Picked For You
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AiResultCard title="Best Overall Match" icon={<Flame size={12} fill="currentColor" className="text-orange-500"/>} freelancer={aiResults.best} colorClass="border-orange-200/80 bg-orange-50/10 text-orange-600 dark:border-orange-500/20 dark:text-orange-400" setActiveChat={setActiveChat} setTab={setTab} />
              <AiResultCard title="Fastest Responder" icon={<Zap size={12} fill="currentColor" className="text-yellow-500"/>} freelancer={aiResults.fast} colorClass="border-yellow-200/80 bg-yellow-50/10 text-yellow-600 dark:border-yellow-500/20 dark:text-yellow-400" setActiveChat={setActiveChat} setTab={setTab} />
              <AiResultCard title="Most Cost Effective" icon={<DollarSign size={12} strokeWidth={2.5} className="text-emerald-500"/>} freelancer={aiResults.budget} colorClass="border-emerald-200/80 bg-emerald-50/10 text-emerald-600 dark:border-emerald-500/20 dark:text-emerald-400" setActiveChat={setActiveChat} setTab={setTab} />
            </div>
            <div className="mt-12 mb-2 flex items-center gap-4">
                <div className="h-px bg-slate-200 dark:bg-white/[0.04] flex-1" />
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Talent Ledger</span>
                <div className="h-px bg-slate-200 dark:bg-white/[0.04] flex-1" />
            </div>
        </div>
      )}

      {/* --- MAIN MATRIX GRID --- */}
      <div className={cn("mx-auto w-full max-w-5xl px-4 mt-2")}>
          <div className={cn("flex flex-col mb-6 gap-4 text-left", isClient ? 'items-center text-center' : 'sm:flex-row sm:items-center justify-between')}>

              {isClient ? (
                  <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center justify-center gap-2">
                          Verified Creative Ledger <ShieldCheck className="text-emerald-500" size={24} strokeWidth={2.5}/>
                      </h2>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 max-w-xl mx-auto">Explore public creator profiles, verified review tiers, and history metrics across the app.</p>
                  </div>
              ) : (
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-2">
                      Open Work <Sparkles size={20} className="text-indigo-500"/>
                  </h2>
              )}

              {/* TIER FILTER TOGGLE */}
              {!isClient && (
                  <div className="bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:border-white/[0.04] p-1 rounded-full flex items-center w-fit shrink-0 shadow-inner">
                      <button
                          onClick={() => handleToggle('normal')}
                          className={cn("px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 outline-none", jobView === 'normal' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400')}
                      >
                          Standard
                      </button>
                      <button
                          onClick={() => handleToggle('elite')}
                          className={cn("px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all duration-200 outline-none", jobView === 'elite' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400')}
                      >
                          <Crown size={12} strokeWidth={2.5} className={jobView === 'elite' ? 'fill-white' : ''}/> Premium Elite
                      </button>
                  </div>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {isClient
                ? freelancersList.map(f => <TalentCard key={f.id} freelancer={f} onAction={onAction} setActiveChat={setActiveChat} setTab={setTab} onTriggerReport={setLocalReportModal} />)
                : publicMissions.map(j => <JobCard key={j.id} data={j} type="Gig Project" onTriggerReport={setLocalReportModal} launchApplyModal={launchApplyModal} />)
            }
          </div>
      </div>

      {/* --- RE-ENGINEERED EMPTY STATES --- */}
      {((!isClient && publicMissions.length === 0) || (isClient && freelancersList.length === 0)) && (
        <div className={cn("mx-auto w-full max-w-5xl px-4", isClient ? 'pb-12' : 'py-20 border border-dashed border-slate-200 bg-white/40 dark:border-slate-800/40 dark:bg-slate-900/10 rounded-[32px] text-center shadow-sm')}>

           {isClient ? (
               <div className="w-full bg-white/90 border border-slate-200/80 rounded-[32px] dark:border-white/[0.04] dark:bg-slate-900/40 p-8 md:p-12 shadow-sm backdrop-blur-xl">
                   <div className="text-center mb-10 space-y-2">
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Hire Verified Talent Safety Guaranteed</h3>
                       <p className="text-slate-400 dark:text-slate-500 text-xs font-medium max-w-xl mx-auto leading-relaxed">
                           Our workflow rules are optimized to secure your project milestones. Enjoy instant automated matching alongside highly protected escrow holding systems.
                       </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                       <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl dark:bg-slate-950 dark:border-white/[0.04]">
                           <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-transparent rounded-xl flex items-center justify-center mb-4 shadow-sm"><Cpu size={18} strokeWidth={2.5}/></div>
                           <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm mb-1">Smart AI Recommendations</h4>
                           <p className="text-xs font-medium text-slate-400 dark:text-slate-500 leading-normal">Describe exactly what you need in the query box above to load matching candidate pools instantly.</p>
                       </div>
                       <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl dark:bg-slate-950 dark:border-white/[0.04]">
                           <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent rounded-xl flex items-center justify-center mb-4 shadow-sm"><ShieldCheck size={18} strokeWidth={2.5}/></div>
                           <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm mb-1">Escrow Protections</h4>
                           <p className="text-xs font-medium text-slate-400 dark:text-slate-500 leading-normal">Deposited job milestone funds are securely guarded on our end, and released only when you approve the work deliverable updates.</p>
                       </div>
                       <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl dark:bg-slate-950 dark:border-white/[0.04]">
                           <div className="w-10 h-10 bg-amber-50 border border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent rounded-xl flex items-center justify-center mb-4 shadow-sm"><Award size={18} strokeWidth={2.5}/></div>
                           <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm mb-1">Skill Verification Checks</h4>
                           <p className="text-xs font-medium text-slate-400 dark:text-slate-500 leading-normal">Creators must complete custom ecosystem verification assessments loops before bidding to keep your project outcomes risk-free.</p>
                       </div>
                   </div>
               </div>
           ) : (
               <div className="space-y-2">
                   <Briefcase size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" strokeWidth={2.5}/>
                   <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">No Open Briefs Listed</h3>
                   <p className="text-xs font-bold text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-normal">
                       {jobView === 'elite' ? "No premium Elite gigs are currently active on the main dashboard grid right now." : "No job entries match your active search strings."}
                   </p>
               </div>
           )}

        </div>
      )}

      {/* --- REPORT CONTROLLER MODAL --- */}
      {localReportModal && (
        <Modal title="Submit Content Report" onClose={() => setLocalReportModal(null)}>
            <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 p-4 rounded-2xl flex gap-3 text-red-900 dark:text-red-300 text-left">
                    <Flag size={16} strokeWidth={2.5} className="text-red-500 mt-0.5 shrink-0 animate-bounce" />
                    <p className="text-xs font-medium leading-relaxed">All incident tickets undergo official human admin reviews. Creating false or deceptive reports will negatively flag your account security evaluation status parameters.</p>
                </div>

                <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Reason for Report</label>
                    <select name="reason" required className="w-full p-3 rounded-xl border bg-slate-50 border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500">
                        <option value="">Select a reason...</option>
                        <option value="Scam/Fraud">Scam or Fraudulent Activity</option>
                        <option value="Harassment">Harassment / Abusive Content</option>
                        <option value="Misleading">Misleading Description</option>
                        <option value="Inappropriate">Inappropriate Content</option>
                    </select>
                </div>

                <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Additional Details</label>
                    <textarea name="description" required placeholder="Describe the issue with clear context details here..." className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[110px] text-sm font-bold bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-slate-800 resize-none"></textarea>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                     <Button variant="ghost" type="button" className="font-bold text-xs uppercase tracking-wider rounded-xl" onClick={() => setLocalReportModal(null)}>Cancel</Button>
                     <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-transform active:scale-95 shadow-md">Submit Report</Button>
                </div>
            </form>
        </Modal>
      )}
    </div>
  );
};

export default Jobs;