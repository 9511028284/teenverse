import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Github, Instagram, Linkedin, Globe,
  Award, Zap, Edit3, ShieldCheck,
  Terminal, Sparkles, FileText, Briefcase,
  GraduationCap, Download, X, ExternalLink,
  ArrowUpRight, CheckCircle, Star, ToggleLeft,
  BadgeAlert, LockKeyhole, Layers3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import Portfolio from './Portfolio';

const MotionDiv = motion.div;

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Card = ({ children, className = '', onClick, glow }) => (
  <MotionDiv
    whileHover={onClick ? { scale: 0.985, y: -2 } : { y: -2 }}
    whileTap={onClick ? { scale: 0.975 } : {}}
    onClick={onClick}
    onKeyDown={(event) => {
      if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      onClick(event);
    }}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    className={cn(
      'relative overflow-hidden rounded-[28px] border backdrop-blur-xl transition-all duration-300 ease-out',
      // LIGHT MODE: Soft pillowy glass
      'bg-white/90 border-slate-200/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_20px_rgba(99,102,241,0.02)]',
      // DARK MODE: Cosmic clay depth
      'dark:bg-slate-900/40 dark:border-white/[0.05] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)]',
      glow ? 'hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:shadow-[0_16px_32px_rgba(99,102,241,0.06)] dark:hover:shadow-[0_20px_40px_rgba(99,102,241,0.12)]' : 'hover:border-slate-300 dark:hover:border-white/[0.12]',
      onClick ? 'cursor-pointer' : '',
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 dark:from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </MotionDiv>
);

// --- EDITABLE/OWNER SOCIAL BUTTON ---
const SocialBtn = ({ icon: Icon, href, label }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),_0_2px_6px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out hover:border-transparent hover:bg-indigo-600 hover:text-white hover:shadow-[0_8px_16px_rgba(79,70,229,0.25)] dark:border-white/[0.05] dark:bg-slate-950 dark:text-slate-400 dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.2)] dark:hover:bg-indigo-500 dark:hover:text-white"
    >
      <Icon size={14} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
};

// --- LOCKED/CLIENT-VIEW SOCIAL BUTTON (PREVENTS PLATFORM LEAKAGE) ---
const LockedSocialBtn = ({ icon: Icon, label }) => {
  return (
    <div 
      title="Platform Protected: External contact disabled until hired."
      className="group flex cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/60 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-700 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6)] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-none"
    >
      <Icon size={14} strokeWidth={2.5} className="opacity-80" />
      <span className="hidden sm:inline">{label} Verified</span>
      <LockKeyhole size={11} strokeWidth={2.5} className="ml-0.5 opacity-50" />
    </div>
  );
};

const StatBlock = ({ value, label, accentClass }) => (
  <div className="group relative flex flex-1 flex-col items-center justify-center p-5 transition-all duration-300 hover:bg-slate-50/40 dark:hover:bg-white/[0.01]">
    <span
      className="bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-2xl font-black tracking-tight text-transparent transition-colors duration-300 dark:from-white dark:to-slate-400 sm:text-3xl font-mono"
    >
      {value}
    </span>
    <div className="mt-2 flex items-center gap-1.5">
      <div className={cn('h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]', accentClass)} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{label}</span>
    </div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'relative rounded-full px-5 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 outline-none',
      active ? 'text-white' : 'text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white'
    )}
  >
    {active && (
      <MotionDiv
        layoutId="activeTabPill"
        className="absolute inset-0 z-0 rounded-full bg-indigo-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_16px_rgba(79,70,229,0.25)] dark:bg-indigo-500"
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      />
    )}
    <span className="relative z-10">{label}</span>
  </button>
);

const normalizeLegacyResume = (content, user, userExtras) => {
  if (!content) return null;

  return {
    full_name: content.full_name || user?.name || 'Creator',
    professional_title: content.professional_title || userExtras?.specialty || user?.tag_line || 'TeenVerse Creator',
    summary: content.summary || user?.bio || user?.journey_statement || '',
    education: Array.isArray(content.education) ? content.education : [],
    verified_platform_work: [],
    verified_experiences: Array.isArray(content.experience)
      ? content.experience.map((item, index) => ({
          id: `legacy-exp-${index}`,
          title: item.role || 'Experience',
          company: item.company || 'Unknown',
          description: item.description || '',
          period: item.period || '',
          verified_label: 'Legacy resume',
        }))
      : [],
    verified_skills: Array.isArray(content.skills)
      ? content.skills.map((skill, index) => ({
          id: `legacy-skill-${index}`,
          skill_name: skill,
          source: 'legacy',
        }))
      : [],
    self_declared_experiences: [],
    self_declared_skills: [],
    trust_score: user?.trust_score || 0,
    trust_score_breakdown: user?.trust_score_breakdown || [],
    risk_level: user?.risk_level || 'low',
    data_mode: 'legacy',
  };
};

const buildVerifiedResume = ({ verifiedView, legacyResume, user, userExtras }) => {
  if (verifiedView) {
    return {
      full_name: user?.name || 'Creator',
      professional_title: user?.specialty || userExtras?.specialty || user?.tag_line || 'TeenVerse Creator',
      summary: user?.journey_statement || user?.bio || legacyResume?.summary || 'This creator is building a verified work record on TeenVerse.',
      education: legacyResume?.education || [],
      verified_platform_work: verifiedView.verified_platform_work || [],
      verified_experiences: verifiedView.verified_experiences || [],
      verified_skills: verifiedView.verified_skills || [],
      self_declared_experiences: [],
      self_declared_skills: [],
      trust_score: verifiedView.trust_score ?? user?.trust_score ?? 0,
      trust_score_breakdown: verifiedView.trust_score_breakdown || user?.trust_score_breakdown || [],
      risk_level: verifiedView.risk_level || user?.risk_level || 'low',
      data_mode: 'verified',
    };
  }

  return legacyResume;
};

const buildFullResume = ({ verifiedResume, experiences, skills }) => {
  if (!verifiedResume) return null;

  const selfDeclaredExperiences = (experiences || []).filter((item) => !item.is_verified).map((item) => ({
    id: item.id,
    title: item.title,
    company: item.company,
    description: item.description,
    period: formatPeriod(item.start_date, item.end_date),
    source: item.source || 'manual',
  }));

  const selfDeclaredSkills = (skills || []).filter((item) => !item.is_verified).map((item) => ({
    id: item.id,
    skill_name: item.skill_name,
    source: item.source || item.verification_source || 'manual',
  }));

  return {
    ...verifiedResume,
    self_declared_experiences: selfDeclaredExperiences,
    self_declared_skills: selfDeclaredSkills,
    data_mode: 'full',
  };
};

const formatPeriod = (startDate, endDate) => {
  const start = startDate ? new Date(startDate).getFullYear() : 'Unknown';
  const end = endDate ? new Date(endDate).getFullYear() : 'Present';
  return `${start} - ${end}`;
};

const getTrustBand = (trustScore) => {
  if (trustScore >= 80) return { label: 'High Trust', tone: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' };
  if (trustScore >= 50) return { label: 'Medium Trust', tone: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20' };
  return { label: 'Low Trust', tone: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20' };
};

const ResumeChip = ({ children, tone = 'neutral' }) => {
  const toneClasses = {
    neutral: 'bg-slate-900 text-white',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] dark:shadow-none',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] dark:shadow-none',
    trust: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] dark:shadow-none',
  };

  return (
    <span className={cn('rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide', toneClasses[tone] || toneClasses.neutral)}>
      {children}
    </span>
  );
};

const ResumeSectionTitle = ({ icon: Icon, children }) => (
  <h4 className="mb-4 flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-white/[0.04]">
    <Icon size={14} strokeWidth={2.5} className="text-slate-900 dark:text-white" /> {children}
  </h4>
);

const ResumeEmpty = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-slate-950/20 px-4 py-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500">
    {children}
  </div>
);

// --- MAIN COMPONENT ---
const UserProfile = ({
  user,
  badges,
  userLevel,
  unlockedSkills,
  onEditProfile,
  isClient = false,
  readOnly = false,
  showToast,
  applications = [],
  jobs = [],
  services = [],
}) => {
  const socials = user?.social_links || {};
  const [resumeData, setResumeData] = useState(null);
  const [userExtras, setUserExtras] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [resumeViewMode, setResumeViewMode] = useState('verified');
  const [verifiedResume, setVerifiedResume] = useState(null);
  const [fullResume, setFullResume] = useState(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  const resumeRef = useRef(null);
  const canViewFullResume = !readOnly;
  const activeResume = resumeViewMode === 'full' && canViewFullResume ? fullResume || verifiedResume : verifiedResume;
  const trustBand = getTrustBand(activeResume?.trust_score || user?.trust_score || 0);
  
  const profileProjects = useMemo(() => [
    ...applications,
    ...jobs.map((job) => ({ ...job, source: 'Posted Project', status: job.status || 'Live' })),
    ...services.map((service) => ({ ...service, source: 'Gig / Service', status: service.status || 'Live' })),
  ], [applications, jobs, services]);
  
  const hasPortfolioPreview = profileProjects.length > 0;

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setIsResumeLoading(true);

      try {
        const resumeQuery = readOnly
          ? Promise.resolve({ data: null })
          : supabase
              .from('resumes')
              .select('content')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

        const experienceQuery = supabase
          .from('resume_experiences')
          .select(readOnly
            ? 'id, title, company, description, start_date, end_date, is_verified, source, proof_status'
            : '*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        const skillsQuery = supabase
          .from('resume_skills')
          .select(readOnly ? 'id, skill_name, is_verified, source, proof_status' : '*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (readOnly) {
          experienceQuery.eq('is_verified', true);
          skillsQuery.eq('is_verified', true);
        }

        const [legacyResumeRes, extrasRes, verifiedViewRes, experienceRes, skillsRes] = await Promise.all([
          resumeQuery,
          supabase
            .from('freelancers')
            .select('specialty, qualification, resume_url, journey_statement, trust_score, trust_score_breakdown, risk_level, social_links')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('client_resume_view')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          experienceQuery,
          skillsQuery,
        ]);

        const mergedUserExtras = {
          ...(extrasRes.data || {}),
          specialty: extrasRes.data?.specialty || user?.specialty,
        };

        const legacyResume = readOnly
          ? null
          : normalizeLegacyResume(legacyResumeRes.data?.content, { ...user, ...extrasRes.data }, mergedUserExtras);
        const verified = buildVerifiedResume({
          verifiedView: verifiedViewRes.data,
          legacyResume,
          user: { ...user, ...extrasRes.data },
          userExtras: mergedUserExtras,
        });

        const full = buildFullResume({
          verifiedResume: verified,
          experiences: experienceRes.data || [],
          skills: skillsRes.data || [],
        });

        setUserExtras(mergedUserExtras);
        setResumeData(legacyResumeRes.data?.content || null);
        setVerifiedResume(verified);
        setFullResume(full);
      } finally {
        setIsResumeLoading(false);
      }
    };

    fetchData();
  }, [readOnly, user]);

  const hasResumePreview = useMemo(() => {
    if (verifiedResume) return true;
    if (resumeData) return true;
    return false;
  }, [resumeData, verifiedResume]);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsDownloading(true);
    if (showToast) showToast('Generating PDF...', 'info');
    try {
      const el = resumeRef.current;
      const dataUrl = await toPng(el, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const props = pdf.getImageProperties(dataUrl);
      const width = pdf.internal.pageSize.getWidth();
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, (props.height * width) / props.width);
      pdf.save(`Resume-${(user?.name || 'Creator').replace(/\s+/g, '_')}.pdf`);
      if (showToast) showToast('Downloaded successfully!', 'success');
    } catch {
      if (showToast) showToast('Failed to compile PDF asset documentation.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F6FA] text-slate-900 transition-colors duration-300 dark:bg-[#070A14] dark:text-white pb-16 px-0">
      
      {/* GLOBAL CYBER GRID ACCENTS */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(circle_at_center,black_60%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-[10%] w-[70vw] h-[70vw] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-0">
          
          {/* --- PROFILE BANNER CONTAINER PLATE --- */}
          <MotionDiv
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_12px_36px_rgba(0,0,0,0.03)] backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_20px_40px_rgba(0,0,0,0.3)]"
          >
          <div className="group relative h-40 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/60 via-purple-100/50 to-pink-100/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-950" />
            {user?.cover_image && (
              <img src={user.cover_image} className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay dark:opacity-30" alt="cover mapping" />
            )}

            {!readOnly && (
              <button
                onClick={onEditProfile}
                className="absolute right-5 top-5 z-30 flex items-center gap-1.5 rounded-xl border border-white bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-900 shadow-md backdrop-blur-md transition-all hover:scale-105 dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
              >
                <Edit3 size={13} strokeWidth={2.5} /> <span>Edit Profile</span>
              </button>
            )}
          </div>

          <div className="relative z-20 -mt-16 px-6 pb-6 sm:px-8">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end text-left">
                
                {/* Clay Profile Shield Frame */}
                <div className="group relative h-32 w-32 rounded-[24px] border-2 border-white bg-white/80 p-1.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),_0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950 dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] shrink-0">
                  <img
                    src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                    className="h-full w-full rounded-[18px] bg-slate-100 object-cover dark:bg-slate-900"
                    alt="avatar profile vector"
                  />
                </div>

                <div className="pb-1">
                  <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">{user?.name || 'Creator'}</h1>
                    {badges.some((b) => b.name === 'Verified') && (
                      <div className="rounded-full bg-white border border-slate-100 p-1 shadow-sm dark:bg-slate-800 dark:border-transparent">
                        <ShieldCheck size={18} strokeWidth={2.5} className="text-blue-500 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2.5 text-xs font-bold">
                    <span className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-0.5 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 font-mono">
                      @{user?.name?.split(' ')[0]?.toLowerCase() || 'user'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{user?.tag_line || 'Digital Creator'}</span>
                  </div>
                </div>
              </div>

              {/* Claymorphic Level Badge Capsule */}
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_6px_14px_rgba(245,158,11,0.25)] select-none self-start sm:self-auto">
                <Zap size={14} className="fill-white drop-shadow-sm" />
                <span className="text-[11px] font-black uppercase tracking-wider">Level {userLevel}</span>
              </div>
            </div>

            <p className="mb-6 max-w-3xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 text-left">
              {user?.bio || 'No biography written yet. This creator prefers to let their work speak for itself.'}
            </p>

            {/* PLATFORM SECURED LINK BAR MAPS */}
            <div className="flex flex-wrap gap-2">
              {!readOnly ? (
                <>
                  <SocialBtn icon={Github} href={socials.github} label="GitHub" />
                  <SocialBtn icon={Instagram} href={socials.instagram} label="Instagram" />
                  <SocialBtn icon={Linkedin} href={socials.linkedin} label="LinkedIn" />
                  {socials.website && <SocialBtn icon={Globe} href={socials.website} label="Website" />}
                </>
              ) : (
                <>
                  {socials.github && <LockedSocialBtn icon={Github} label="GitHub" />}
                  {socials.linkedin && <LockedSocialBtn icon={Linkedin} label="LinkedIn" />}
                  {socials.instagram && <LockedSocialBtn icon={Instagram} label="Instagram" />}
                  {socials.website && <LockedSocialBtn icon={Globe} label="Website" />}
                </>
              )}
            </div>
          </div>

          <div className="flex border-t border-slate-100 bg-slate-50/50 dark:border-white/[0.04] dark:bg-[#070A14]/20 divide-x divide-slate-100 dark:divide-white/[0.04]">
            <StatBlock value={badges.length} label="Badges" accentClass="bg-pink-500 text-pink-500" />
            <StatBlock value={`Lvl.${userLevel}`} label="Rank" accentClass="bg-indigo-500 text-indigo-500" />
            <StatBlock value={unlockedSkills.length} label="Skills" accentClass="bg-cyan-500 text-cyan-500" />
            <StatBlock
              value={(user?.wallet_balance || 0) > 999 ? `₹${((user?.wallet_balance || 0) / 1000).toFixed(1)}k` : `₹${user?.wallet_balance || 0}`}
              label="Wallet"
              accentClass="bg-emerald-500 text-emerald-500"
            />
          </div>
          </MotionDiv>

        {/* --- DUAL WORKSPACE LAYOUT GRIDS --- */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
          
          {/* Left Bento Multi-tab Panel */}
          <Card className="flex flex-col p-6 sm:p-8 lg:col-span-2" glow>
            <div className="mb-6 flex w-fit gap-1 rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.04)] dark:border-white/[0.04] dark:bg-slate-950/60 dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]">
              {['about', 'skills', 'achievements'].map((t) => (
                <TabBtn key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)} />
              ))}
            </div>

            <div className="flex-1 text-left">
              <AnimatePresence mode="wait">
                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="mb-2 text-lg font-black text-slate-950 dark:text-white tracking-tight">The Story</h3>
                      <p className="font-medium text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        {user?.bio || 'Complete your profile to tell the world what you do.'}
                      </p>
                    </div>

                    {userExtras && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-5 dark:border-indigo-500/10 dark:from-indigo-500/10 dark:to-purple-500/5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] dark:shadow-none">
                          <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100/50 dark:border-transparent shadow-sm">
                            <Sparkles size={16} strokeWidth={2.5} />
                          </div>
                          <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Specialty Area</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{userExtras.specialty || 'Not specified'}</p>
                        </div>
                        
                        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/60 to-blue-50/40 p-5 dark:border-cyan-500/10 dark:from-cyan-500/10 dark:to-blue-500/5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] dark:shadow-none">
                          <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-100/50 dark:border-transparent shadow-sm">
                            <GraduationCap size={16} strokeWidth={2.5} />
                          </div>
                          <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Qualification Metric</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{userExtras.qualification || 'Not specified'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="mb-4 text-lg font-black text-slate-950 dark:text-white tracking-tight">Verified Tech Stack</h3>
                    {unlockedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {unlockedSkills.map((skill) => (
                          <span key={skill} className="rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 dark:bg-slate-950 dark:border-white/[0.04] dark:text-slate-300 text-xs font-bold px-3.5 py-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-none hover:scale-105 transition-all duration-200 cursor-default font-mono">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-white/10 dark:bg-slate-950/20">
                        <Terminal size={28} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                        <p className="text-sm font-black text-slate-400 dark:text-slate-500">No verified skills unlocked yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'achievements' && (
                  <motion.div
                    key="achievements"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="mb-5 flex items-center justify-between text-lg font-black text-slate-950 dark:text-white tracking-tight">
                      Hall of Fame <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40 dark:border-transparent">{badges.length} Unlocked</span>
                    </h3>
                    {badges.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {badges.map((b, idx) => (
                          <div key={idx} className="relative rounded-2xl bg-slate-50 border border-slate-200/60 p-4 overflow-hidden dark:bg-slate-950/40 dark:border-white/[0.05] shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.8)] dark:shadow-none hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center text-center group">
                            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-indigo-50 text-indigo-600 dark:border-transparent dark:bg-indigo-500/10 dark:text-indigo-400 shadow-sm">
                              <Award size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-300">{b.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-white/10 dark:bg-slate-950/20">
                        <Star size={28} className="mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                        <p className="text-sm font-black text-slate-400 dark:text-slate-500">No ecosystem badges unlocked yet</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Right Action Stack Sidebar */}
          <div className="flex flex-col gap-4 text-left">
            <Card className="p-6 sm:p-7" glow>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Identity Status</p>
                <div className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none', trustBand.bg)}>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={cn('text-[9px] font-black uppercase tracking-wider', trustBand.tone)}>{trustBand.label}</span>
                </div>
              </div>

              <div className="mb-6 border-b border-slate-100 pb-6 dark:border-white/[0.04] flex items-baseline">
                <span className="bg-gradient-to-b from-slate-950 to-slate-400 bg-clip-text text-6xl sm:text-7xl font-black font-mono tracking-tighter text-transparent dark:from-white dark:to-slate-600">
                  {String(userLevel).padStart(2, '0')}
                </span>
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rank Level</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { label: 'Badges Unlocked', value: badges.length, color: 'text-pink-500' },
                  { label: 'Skills Authenticated', value: unlockedSkills.length, color: 'text-cyan-500' },
                  { label: 'Ecosystem Verification', value: 'Verified', color: 'text-indigo-500', isIcon: true },
                ].map(({ label, value, color, isIcon }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
                    <span className={cn('flex items-center gap-1 text-xs font-black', color)}>
                      {isIcon && <CheckCircle size={13} strokeWidth={2.5} />} {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {hasResumePreview && (
              <Card
                onClick={() => setShowResumeModal(true)}
                className="group border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-5 hover:from-indigo-100/50 hover:to-purple-100/30 dark:border-indigo-500/10 dark:from-indigo-500/10 dark:to-purple-500/5 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white shadow-sm dark:border-transparent dark:bg-indigo-500/10">
                      <FileText size={18} strokeWidth={2.5} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">View Resume</p>
                      <p className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {verifiedResume?.data_mode === 'verified' ? 'Ecosystem Verified Profile' : 'Legacy Resume Plate'}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <ArrowUpRight size={16} strokeWidth={2.5} className="group-hover:rotate-45 transition-transform" />
                  </div>
                </div>
              </Card>
            )}

            <Card
              onClick={() => setShowPortfolioModal(true)}
              className={cn(
                'group border-cyan-100 bg-gradient-to-br from-cyan-50/50 to-teal-50/30 p-5 dark:border-cyan-500/10 dark:from-cyan-500/10 dark:to-teal-500/5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] dark:shadow-none',
                'hover:from-cyan-100/50 hover:to-teal-100/30 dark:hover:from-cyan-500/20 dark:hover:to-teal-500/10'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-100 bg-white shadow-sm dark:border-transparent dark:bg-cyan-500/10">
                    <Layers3 size={18} strokeWidth={2.5} className="text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">View Portfolio</p>
                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {hasPortfolioPreview ? `${profileProjects.length} Verified Showcase Asset${profileProjects.length === 1 ? '' : 's'}` : 'Open portfolio workspace'}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300',
                  'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white dark:bg-cyan-500/10 dark:text-cyan-400'
                )}>
                  <ArrowUpRight size={16} strokeWidth={2.5} className="group-hover:rotate-45 transition-transform" />
                </div>
              </div>
            </Card>

            {userExtras?.resume_url && (
              <a href={userExtras.resume_url} target="_blank" rel="noopener noreferrer" className="block outline-none">
                <Card className="flex items-center justify-center gap-2 border-slate-200/80 p-4 hover:bg-white dark:border-white/[0.04] dark:hover:bg-slate-900/60">
                  <ExternalLink size={14} strokeWidth={2.5} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">External Project Portfolio Link</span>
                </Card>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* --- OVERLAY MODALS LAYER --- */}
      <AnimatePresence>
        
        {/* Portfolio Overlayer Framework */}
        {showPortfolioModal && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-md p-4"
            onClick={() => setShowPortfolioModal(false)}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-slate-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                    <Layers3 size={18} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Portfolio Showcase</p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                      Verified credential logs linked to {user?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPortfolioModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-slate-50 dark:bg-slate-950/40 p-6">
                <Portfolio
                  isClient={isClient}
                  applications={readOnly ? [] : applications}
                  jobs={readOnly ? [] : jobs}
                  services={readOnly ? [] : services}
                  publicProjects={readOnly ? profileProjects : []}
                />
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {/* Dynamic A4 Resume Builder Compiler Preview Panel */}
        {showResumeModal && activeResume && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-md p-4"
            onClick={() => setShowResumeModal(false)}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-slate-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <FileText size={18} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Resume Document Ledger</p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{user?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {canViewFullResume && (
                    <button
                      onClick={() => setResumeViewMode((m) => (m === 'verified' ? 'full' : 'verified'))}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border transition-all outline-none',
                        resumeViewMode === 'verified'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      )}
                    >
                      <ToggleLeft size={13} strokeWidth={2.5} />
                      {resumeViewMode === 'verified' ? 'Verified Only' : 'Full Resume'}
                    </button>
                  )}
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                  >
                    <Download size={13} strokeWidth={2.5} /> {isDownloading ? 'Compiling...' : 'PDF'}
                  </button>
                  <button
                    onClick={() => setShowResumeModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Sub-A4 Document Viewer Canvas Body */}
              <div className="flex-1 overflow-y-auto bg-slate-100 p-4 dark:bg-slate-900/20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isResumeLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest shadow-sm dark:border-white/[0.05] dark:bg-slate-900">
                      Loading certified resume data vectors...
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center text-left">
                    <div
                      ref={resumeRef}
                      className="min-h-[297mm] w-full max-w-[210mm] rounded-2xl bg-white text-slate-900 shadow-xl"
                      style={{ padding: '16mm 18mm' }}
                    >
                      <div className="mb-6 flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-4">
                        <div>
                          <h1 className="mb-1 text-3xl font-black uppercase tracking-tight text-slate-900">
                            {activeResume.full_name}
                          </h1>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{activeResume.professional_title}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <ResumeChip tone="trust">{trustBand.label}</ResumeChip>
                          <ResumeChip tone={activeResume.risk_level === 'high' ? 'warning' : activeResume.risk_level === 'medium' ? 'warning' : 'verified'}>
                            Risk Status: {activeResume.risk_level}
                          </ResumeChip>
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 font-bold text-left">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Trust Score</p>
                          <p className="mt-1 text-xl font-black text-slate-900 font-mono">{activeResume.trust_score ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Escrow Audits</p>
                          <p className="mt-1 text-xl font-black text-slate-900 font-mono">{activeResume.verified_platform_work?.length || 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Badges Held</p>
                          <p className="mt-1 text-xl font-black text-slate-900 font-mono">{activeResume.verified_skills?.length || 0}</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">View Bounds</p>
                          <p className="mt-1 text-xs font-black uppercase text-slate-950">{resumeViewMode === 'verified' || !canViewFullResume ? 'Verified Only' : 'Full'}</p>
                        </div>
                      </div>

                      {activeResume.trust_score_breakdown?.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-1.5">
                          {activeResume.trust_score_breakdown.map((item, i) => (
                            <ResumeChip key={`${item.label}-${i}`} tone={item.value < 0 ? 'warning' : item.value > 0 ? 'verified' : 'trust'}>
                              {item.label}: {item.value > 0 ? `+${item.value}` : item.value}
                            </ResumeChip>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="space-y-6 sm:col-span-2">
                          <section>
                            <ResumeSectionTitle icon={Briefcase}>Executive Journey Statement</ResumeSectionTitle>
                            <p className="text-xs font-semibold leading-relaxed text-slate-600">{activeResume.summary || 'No platform profile overview logs initialized.'}</p>
                          </section>

                          <section>
                            <ResumeSectionTitle icon={ShieldCheck}>Platform Certified Protected Transactions</ResumeSectionTitle>
                            {activeResume.verified_platform_work?.length ? (
                              <div className="space-y-4">
                                {activeResume.verified_platform_work.map((item, i) => (
                                  <div key={item.application_id || item.id || `verified-p-${i}`} className="relative border-l-2 border-emerald-300 pl-4">
                                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full border border-white bg-emerald-500 shadow-sm" />
                                    <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                      <h5 className="text-sm font-black text-slate-900 leading-tight">{item.title}</h5>
                                      <ResumeChip tone="verified">{item.status || 'Verified Ledger'}</ResumeChip>
                                    </div>
                                    <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                                      This work record is fully verified by safe transaction logs, delivery assets verification, and locked smart-escrow payouts.
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>No platform-verified transaction records verified yet.</ResumeEmpty>
                            )}
                          </section>

                          <section>
                            <ResumeSectionTitle icon={CheckCircle}>Platform Verified History</ResumeSectionTitle>
                            {activeResume.verified_experiences?.length ? (
                              <div className="space-y-5">
                                {activeResume.verified_experiences.map((job, i) => (
                                  <div key={job.id || `verified-exp-${i}`} className="relative border-l-2 border-indigo-200 pl-4">
                                    <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full border border-white bg-indigo-600 shadow-sm" />
                                    <div className="mb-0.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                      <h5 className="text-sm font-black text-slate-900 leading-tight">{job.title}</h5>
                                      <ResumeChip tone="verified">{job.period || job.verified_label || 'Verified'}</ResumeChip>
                                    </div>
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{job.company}</p>
                                    <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-500">{job.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>No verifiable external experience listed on records ledger.</ResumeEmpty>
                            )}
                          </section>

                          {resumeViewMode === 'full' && canViewFullResume && (
                            <section>
                              <ResumeSectionTitle icon={BadgeAlert}>Self Declared History Logs</ResumeSectionTitle>
                              {activeResume.self_declared_experiences?.length ? (
                                <div className="space-y-5">
                                  {activeResume.self_declared_experiences.map((job, i) => (
                                    <div key={job.id || `self-exp-${i}`} className="relative border-l-2 border-amber-200 pl-4">
                                      <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full border border-white bg-amber-500 shadow-sm" />
                                      <div className="mb-0.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                        <h5 className="text-sm font-black text-slate-900 leading-tight">{job.title}</h5>
                                        <ResumeChip tone="warning">{job.source === 'ai' ? 'AI Compiled' : 'Unverified Parameter'}</ResumeChip>
                                      </div>
                                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{job.company}</p>
                                      <p className="whitespace-pre-line text-xs font-semibold leading-relaxed text-slate-500">{job.description}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <ResumeEmpty>No self-declared experience items added yet.</ResumeEmpty>
                              )}
                            </section>
                          )}
                        </div>

                        <div className="space-y-6">
                          <section>
                            <ResumeSectionTitle icon={Layers3}>Trust Parameters</ResumeSectionTitle>
                            {activeResume.trust_score_breakdown?.length ? (
                              <div className="space-y-2">
                                {activeResume.trust_score_breakdown.map((item, i) => (
                                  <div key={`${item.label}-${i}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 font-bold">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                                    <p className={cn('mt-1 text-xs font-black font-mono', item.value < 0 ? 'text-amber-600' : 'text-slate-900')}>
                                      {item.value > 0 ? `+${item.value}` : item.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>Account balance breakdowns not available yet.</ResumeEmpty>
                            )}
                          </section>

                          {activeResume.education?.length > 0 && (
                            <section>
                              <ResumeSectionTitle icon={GraduationCap}>Education History</ResumeSectionTitle>
                              <div className="space-y-2.5">
                                {activeResume.education.map((edu, i) => (
                                  <div key={`edu-${i}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left">
                                    <h5 className="text-xs font-black text-slate-900 leading-tight mb-0.5">{edu.degree}</h5>
                                    <p className="text-[10px] font-bold text-indigo-600">{edu.school}</p>
                                    <p className="mt-1 text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">{edu.year}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          <section>
                            <ResumeSectionTitle icon={Terminal}>Verified Skills Ledger</ResumeSectionTitle>
                            {activeResume.verified_skills?.length ? (
                              <div className="flex flex-wrap gap-1.5">
                                {activeResume.verified_skills.map((skill, i) => (
                                  <span key={skill.id || `verified-skill-${i}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 font-mono shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
                                    {skill.skill_name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>No platform verified skills earned yet.</ResumeEmpty>
                            )}
                          </section>

                          {resumeViewMode === 'full' && canViewFullResume && (
                            <section>
                              <ResumeSectionTitle icon={LockKeyhole}>Self Declared Skills Ledger</ResumeSectionTitle>
                              {activeResume.self_declared_skills?.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {activeResume.self_declared_skills.map((skill, i) => (
                                    <span key={skill.id || `self-skill-${i}`} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700 font-mono shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
                                      {skill.skill_name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <ResumeEmpty>No manual skills vectors added.</ResumeEmpty>
                              )}
                            </section>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
