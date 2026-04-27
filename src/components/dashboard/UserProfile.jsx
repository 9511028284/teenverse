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

const MotionDiv = motion.div;

const Card = ({ children, className = '', onClick, glow }) => (
  <MotionDiv
    whileHover={onClick ? { scale: 0.98, y: -2 } : { y: -2 }}
    whileTap={onClick ? { scale: 0.95 } : {}}
    onClick={onClick}
    className={[
      'relative overflow-hidden rounded-[2rem] border backdrop-blur-2xl transition-all duration-500 ease-out',
      'bg-white/60 dark:bg-[#0a0a0f]/60 border-white/80 dark:border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
      glow ? 'hover:border-purple-400/50 dark:hover:border-purple-400/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] dark:hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'hover:border-neutral-300 dark:hover:border-white/[0.12]',
      onClick ? 'cursor-pointer' : '',
      className
    ].join(' ')}
  >
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/[0.03] to-transparent transition-colors duration-500" />
    <div className="relative z-10 h-full">{children}</div>
  </MotionDiv>
);

// --- EDITABLE/OWNER SOCIAL BUTTON ---
const SocialBtn = ({ icon: Icon, href, label }) => {
  if (!href) return null;
  const IconComponent = Icon;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/80 px-4 py-2.5 text-xs font-bold text-neutral-600 shadow-sm transition-all duration-500 hover:border-transparent hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white hover:shadow-lg hover:shadow-purple-500/25 dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:from-indigo-500/80 dark:hover:to-purple-500/80 dark:hover:text-white"
    >
      <IconComponent size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
};

// --- LOCKED/CLIENT-VIEW SOCIAL BUTTON (PREVENTS PLATFORM LEAKAGE) ---
const LockedSocialBtn = ({ icon: Icon, label }) => {
  const IconComponent = Icon;
  return (
    <div 
      title="Platform Protected: External contact disabled until hired."
      className="group flex cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/50 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all duration-500 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
    >
      <IconComponent size={16} className="opacity-80" />
      <span className="hidden sm:inline">{label} Verified</span>
      <LockKeyhole size={12} className="ml-1 opacity-50" />
    </div>
  );
};

const StatBlock = ({ value, label, accentClass }) => (
  <div className="group relative flex flex-1 flex-col items-center justify-center p-5 transition-all duration-500">
    <span
      className="bg-gradient-to-br from-neutral-900 to-neutral-500 bg-clip-text text-2xl font-black tracking-tight text-transparent transition-colors duration-500 dark:from-white dark:to-neutral-400 sm:text-3xl"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {value}
    </span>
    <div className="mt-2 flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full shadow-[0_0_10px_currentColor] ${accentClass} transition-colors duration-500`} />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 transition-colors duration-500 dark:text-neutral-400">{label}</span>
    </div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-500 ${
      active ? 'text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
    }`}
  >
    {active && (
      <MotionDiv
        layoutId="activeTabPill"
        className="absolute inset-0 z-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
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
  if (trustScore >= 80) return { label: 'High Trust', tone: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' };
  if (trustScore >= 50) return { label: 'Medium Trust', tone: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' };
  return { label: 'Low Trust', tone: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' };
};

const ResumeChip = ({ children, tone = 'neutral' }) => {
  const toneClasses = {
    neutral: 'bg-neutral-900 text-white',
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    trust: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  };

  return (
    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${toneClasses[tone] || toneClasses.neutral}`}>
      {children}
    </span>
  );
};

const ResumeSectionTitle = ({ icon: Icon, children }) => (
  (() => {
    const IconComponent = Icon;
    return (
  <h4 className="mb-4 flex items-center gap-2 border-b border-neutral-200 pb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">
    <IconComponent size={14} className="text-neutral-900" /> {children}
  </h4>
    );
  })()
);

const ResumeEmpty = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm font-bold text-neutral-400">
    {children}
  </div>
);

const UserProfile = ({ user, badges, userLevel, unlockedSkills, onEditProfile, readOnly = false, showToast }) => {
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

  const resumeRef = useRef(null);
  const canViewFullResume = !readOnly;
  const activeResume = resumeViewMode === 'full' && canViewFullResume ? fullResume || verifiedResume : verifiedResume;
  const trustBand = getTrustBand(activeResume?.trust_score || user?.trust_score || 0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setIsResumeLoading(true);

      try {
        const [legacyResumeRes, extrasRes, verifiedViewRes, experienceRes, skillsRes] = await Promise.all([
          supabase
            .from('resumes')
            .select('content')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
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
          supabase
            .from('resume_experiences')
            .select('*')
            .eq('user_id', user.id)
            .order('start_date', { ascending: false }),
          supabase
            .from('resume_skills')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

        const mergedUserExtras = {
          ...(extrasRes.data || {}),
          specialty: extrasRes.data?.specialty || user?.specialty,
        };

        const legacyResume = normalizeLegacyResume(legacyResumeRes.data?.content, { ...user, ...extrasRes.data }, mergedUserExtras);
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
  }, [user]);

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
      if (showToast) showToast('Downloaded!', 'success');
    } catch {
      if (showToast) showToast('Failed.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#f8fafc] pb-24 text-neutral-900 transition-colors duration-700 ease-in-out dark:bg-[#030305] dark:text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800&family=DM+Mono:wght@400;500&family=Sora:wght@700;800;900&display=swap');

        .cyber-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
          transition: background-image 0.7s ease-in-out;
        }
        .dark .cyber-grid {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
        }

        .ambient-spotlight {
          position: absolute; top: -20%; left: 10%; width: 80vw; height: 80vw;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.1) 40%, transparent 70%);
          border-radius: 50%; pointer-events: none;
          animation: drift 20s infinite alternate ease-in-out;
          transition: background 0.7s ease-in-out;
        }
        .dark .ambient-spotlight {
          background: radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(56, 189, 248, 0.05) 40%, transparent 70%);
        }

        @keyframes drift {
          0% { transform: translate(0%, 0%) scale(1); }
          100% { transform: translate(10%, 15%) scale(1.1); }
        }

        .skill-tag {
          background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.05);
          color: #4f46e5; border-radius: 10px; padding: 6px 14px;
          font-size: 12px; font-family: 'DM Mono', monospace; font-weight: 600;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .skill-tag:hover {
          background: linear-gradient(135deg, #6366f1, #a855f7); border-color: transparent;
          color: #fff; transform: translateY(-3px) scale(1.05);
          box-shadow: 0 10px 20px rgba(168, 85, 247, 0.2);
        }
        .dark .skill-tag {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0; box-shadow: none;
        }
        .dark .skill-tag:hover {
          background: linear-gradient(135deg, #6366f1, #a855f7); border-color: transparent;
          color: #fff; box-shadow: 0 10px 20px rgba(168, 85, 247, 0.3);
        }

        .badge-card {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(0,0,0,0.04); border-radius: 20px;
          transition: all 0.4s ease-out;
        }
        .badge-card:hover {
          background: #fff; border-color: rgba(168,85,247,0.3);
          transform: translateY(-5px); box-shadow: 0 15px 30px rgba(168,85,247,0.1);
        }
        .dark .badge-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .dark .badge-card:hover {
          background: rgba(255,255,255,0.05); border-color: rgba(168,85,247,0.4);
          box-shadow: 0 15px 30px rgba(168,85,247,0.15);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; transition: background 0.3s; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="ambient-spotlight" />
      <div className="cyber-grid" />

      <div className="relative z-10 mx-auto max-w-[64rem] space-y-6 px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/40 shadow-[0_20px_40px_rgba(0,0,0,0.04)] backdrop-blur-3xl transition-all duration-700 dark:border-white/[0.05] dark:bg-white/[0.01] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
          >
          <div className="group relative h-44 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 transition-colors duration-700 dark:from-indigo-900/40 dark:via-purple-900/20 dark:to-[#030305]" />
            {user?.cover_image && (
              <img src={user.cover_image} className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105 dark:opacity-30" alt="cover" />
            )}

            {!readOnly && (
              <button
                onClick={onEditProfile}
                className="absolute right-5 top-5 z-30 flex items-center gap-2 rounded-full border border-white bg-white/60 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-neutral-900 shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95 dark:border-white/10 dark:bg-black/40 dark:text-white dark:hover:bg-black/60"
              >
                <Edit3 size={14} /> <span className="hidden sm:inline">Edit Profile</span>
              </button>
            )}
          </div>

          <div className="relative z-20 -mt-20 px-6 pb-8 sm:px-10">
            <div className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                <div className="group relative h-36 w-36 rounded-[2rem] border-2 border-white bg-white/50 p-2 shadow-[0_0_40px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all duration-700 dark:border-white/10 dark:bg-neutral-900/50 dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-pink-500 opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-40 dark:opacity-30" />
                  <img
                    src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
                    className="relative z-10 h-full w-full rounded-[1.5rem] bg-neutral-100 object-cover dark:bg-[#0a0a0f]"
                    alt="avatar"
                  />
                </div>

                <div className="pb-3">
                  <div className="mb-2 flex items-center gap-3">
                    <h1
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-black tracking-tighter text-transparent transition-colors duration-700 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 sm:text-5xl"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {user?.name || 'Creator'}
                    </h1>
                    {badges.some((badge) => badge.name === 'Verified') && (
                      <div className="rounded-full bg-white p-1.5 shadow-md dark:bg-neutral-800 dark:shadow-none">
                        <ShieldCheck size={22} className="text-blue-500 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-indigo-600 transition-colors duration-500 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                      @{user?.name?.split(' ')[0]?.toLowerCase() || 'user'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 transition-colors duration-500 dark:text-neutral-400">{user?.tag_line || 'Digital Creator'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 px-5 py-2.5 text-amber-700 shadow-lg shadow-amber-500/10 transition-all duration-500 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-400">
                <Zap size={16} className="fill-amber-500 dark:fill-amber-400" />
                <span className="text-xs font-black uppercase tracking-widest">Level {userLevel}</span>
              </div>
            </div>

            <p className="mb-8 max-w-3xl text-sm font-medium leading-relaxed text-neutral-600 transition-colors duration-500 dark:text-neutral-400 sm:text-base">
              {user?.bio || 'No biography written yet. This creator prefers to let their work speak for itself.'}
            </p>

            {/* SECURE SOCIAL LINKS (PREVENTS PLATFORM BYPASS) */}
            <div className="flex flex-wrap gap-3">
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

          <div className="flex divide-x divide-neutral-200 border-t border-white/50 bg-white/30 backdrop-blur-md transition-colors duration-700 dark:divide-white/[0.05] dark:border-white/[0.05] dark:bg-white/[0.01]">
            <StatBlock value={badges.length} label="Badges" accentClass="bg-pink-500 text-pink-500 dark:bg-pink-400" />
            <StatBlock value={`Lvl.${userLevel}`} label="Rank" accentClass="bg-indigo-500 text-indigo-500 dark:bg-indigo-400" />
            <StatBlock value={unlockedSkills.length} label="Skills" accentClass="bg-cyan-500 text-cyan-500 dark:bg-cyan-400" />
            <StatBlock
              value={(user?.wallet_balance || 0) > 999 ? `₹${((user?.wallet_balance || 0) / 1000).toFixed(1)}k` : `₹${user?.wallet_balance || 0}`}
              label="Wallet"
              accentClass="bg-emerald-500 text-emerald-500 dark:bg-emerald-400"
            />
          </div>
        </MotionDiv>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col p-6 sm:p-8 lg:col-span-2" glow>
            <div className="mb-8 flex w-fit gap-2 rounded-full border border-neutral-200 bg-white/50 p-1.5 shadow-inner backdrop-blur-md transition-colors duration-500 dark:border-white/[0.05] dark:bg-black/30">
              {['about', 'skills', 'achievements'].map((tab) => (
                <TabBtn key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
              ))}
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="mb-3 text-xl font-black text-neutral-900 transition-colors duration-500 dark:text-white">The Story</h3>
                      <p className="font-medium leading-relaxed text-neutral-600 transition-colors duration-500 dark:text-neutral-400">
                        {user?.bio || 'Complete your profile to tell the world what you do.'}
                      </p>
                    </div>

                    {userExtras && (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 transition-colors duration-500 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-purple-500/10">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-colors duration-500 dark:bg-indigo-500/20">
                            <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 transition-colors duration-500 dark:text-neutral-400">Specialty</p>
                          <p className="text-base font-bold text-neutral-900 transition-colors duration-500 dark:text-white">{userExtras.specialty || 'Not specified'}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 transition-colors duration-500 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-blue-500/10">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-colors duration-500 dark:bg-cyan-500/20">
                            <GraduationCap size={20} className="text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 transition-colors duration-500 dark:text-neutral-400">Qualification</p>
                          <p className="text-base font-bold text-neutral-900 transition-colors duration-500 dark:text-white">{userExtras.qualification || 'Not specified'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="mb-6 text-xl font-black text-neutral-900 transition-colors duration-500 dark:text-white">Verified Tech Stack</h3>
                    {unlockedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {unlockedSkills.map((skill) => (
                          <span key={skill} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[2rem] border-2 border-dashed border-neutral-200 bg-white/30 py-16 text-center transition-colors duration-500 dark:border-white/10 dark:bg-white/[0.01]">
                        <Terminal size={32} className="mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
                        <p className="text-base font-bold text-neutral-600 dark:text-neutral-400">No verified skills yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'achievements' && (
                  <motion.div
                    key="achievements"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="mb-6 flex items-center justify-between text-xl font-black text-neutral-900 transition-colors duration-500 dark:text-white">
                      Hall of Fame <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:bg-white/[0.05]">{badges.length} Unlocked</span>
                    </h3>
                    {badges.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {badges.map((badge, index) => (
                          <div key={index} className="badge-card group relative aspect-square p-4">
                            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <div className="relative z-10 flex h-full flex-col items-center justify-center">
                              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-neutral-100 bg-white shadow-sm transition-colors duration-500 dark:border-purple-500/20 dark:bg-purple-500/10">
                                <Award size={24} className="text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-center text-xs font-bold text-neutral-700 transition-colors duration-500 dark:text-neutral-300">{badge.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[2rem] border-2 border-dashed border-neutral-200 bg-white/30 py-16 text-center transition-colors duration-500 dark:border-white/10 dark:bg-white/[0.01]">
                        <Star size={32} className="mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
                        <p className="text-base font-bold text-neutral-600 dark:text-neutral-400">No badges yet</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="flex-1 p-6 sm:p-8" glow>
              <div className="mb-8 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-colors duration-500 dark:text-neutral-500">Identity Card</p>
                <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition-colors duration-500 ${trustBand.bg}`}>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse dark:bg-emerald-400" />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${trustBand.tone}`}>{trustBand.label}</span>
                </div>
              </div>

              <div className="mb-8 border-b border-neutral-200 pb-8 transition-colors duration-500 dark:border-white/[0.05]">
                <span className="bg-gradient-to-b from-neutral-900 to-neutral-400 bg-clip-text text-7xl font-black tracking-tighter text-transparent transition-colors duration-500 dark:from-white dark:to-neutral-600 sm:text-8xl" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {String(userLevel).padStart(2, '0')}
                </span>
                <span className="mt-5 ml-3 inline-block align-top text-xs font-black uppercase tracking-widest text-neutral-400 transition-colors duration-500 dark:text-neutral-500">Level</span>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Badges Earned', value: badges.length, color: 'text-pink-500 dark:text-pink-400' },
                  { label: 'Skills Verified', value: unlockedSkills.length, color: 'text-cyan-500 dark:text-cyan-400' },
                  { label: 'KYC Status', value: 'Verified', color: 'text-indigo-500 dark:text-indigo-400', isIcon: true },
                ].map(({ label, value, color, isIcon }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl px-2 py-3 transition-colors duration-300 hover:bg-white/50 dark:hover:bg-white/[0.02]">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{label}</span>
                    <span className={`flex items-center gap-1.5 text-sm font-black ${color}`}>
                      {isIcon && <CheckCircle size={14} className="mb-0.5" />} {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {hasResumePreview && (
              <Card
                onClick={() => setShowResumeModal(true)}
                className="group border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 transition-all duration-500 hover:from-indigo-100 hover:to-purple-100 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-purple-500/5 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-50 bg-white shadow-md transition-transform duration-500 group-hover:scale-110 dark:border-transparent dark:bg-indigo-500/20">
                      <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-base font-black text-neutral-900 transition-colors duration-500 dark:text-white">View Resume</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors duration-500 dark:text-neutral-400">
                        {verifiedResume?.data_mode === 'verified' ? 'Trust-aware profile' : 'Legacy document'}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 transition-colors duration-500 group-hover:bg-indigo-600 dark:bg-indigo-500/20 dark:group-hover:bg-indigo-500">
                    <ArrowUpRight size={18} className="text-indigo-600 transition-all duration-500 group-hover:rotate-45 group-hover:text-white dark:text-indigo-400" />
                  </div>
                </div>
              </Card>
            )}

            {userExtras?.resume_url && (
              <a href={userExtras.resume_url} target="_blank" rel="noopener noreferrer" className="block outline-none">
                <Card className="flex items-center justify-center gap-2 border-neutral-200 p-5 hover:bg-white/80 dark:border-white/[0.05] dark:hover:bg-white/[0.05]">
                  <ExternalLink size={16} className="text-neutral-400 dark:text-neutral-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">External Portfolio</span>
                </Card>
              </a>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showResumeModal && activeResume && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-md dark:bg-black/80 sm:p-6"
            onClick={() => setShowResumeModal(false)}
          >
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(event) => event.stopPropagation()}
              className="flex h-full w-full flex-col overflow-hidden rounded-none border border-neutral-200 bg-neutral-50 shadow-2xl dark:border-white/[0.1] dark:bg-[#0a0a0f] sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-[2.5rem]"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-5 dark:border-white/[0.05] dark:bg-[#0a0a0f] sm:px-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                    <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-900 dark:text-white">Resume Profile</p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{user?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {canViewFullResume && (
                    <button
                      onClick={() => setResumeViewMode((mode) => (mode === 'verified' ? 'full' : 'verified'))}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                        resumeViewMode === 'verified'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      <ToggleLeft size={14} />
                      {resumeViewMode === 'verified' ? 'Verified only' : 'Full resume'}
                    </button>
                  )}
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 disabled:opacity-50"
                  >
                    <Download size={14} /> {isDownloading ? 'Saving...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => setShowResumeModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-neutral-100 px-4 py-8 dark:bg-[#030305] custom-scrollbar">
                {isResumeLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-5 text-sm font-bold text-neutral-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400">
                      Loading trust-aware resume...
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div
                      ref={resumeRef}
                      className="min-h-[297mm] w-full max-w-[210mm] rounded-2xl bg-white text-neutral-900 shadow-xl"
                      style={{ fontFamily: "'DM Sans', sans-serif", padding: '14mm 16mm' }}
                    >
                      <div className="mb-7 flex items-start justify-between gap-6 border-b-[3px] border-neutral-900 pb-5">
                        <div>
                          <h1 className="mb-2 text-4xl font-black uppercase leading-none tracking-tighter text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                            {activeResume.full_name}
                          </h1>
                          <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">{activeResume.professional_title}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <ResumeChip tone="trust">{trustBand.label}</ResumeChip>
                          <ResumeChip tone={activeResume.risk_level === 'high' ? 'warning' : activeResume.risk_level === 'medium' ? 'warning' : 'verified'}>
                            Risk: {activeResume.risk_level}
                          </ResumeChip>
                        </div>
                      </div>

                      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Trust score</p>
                          <p className="mt-2 text-2xl font-black text-neutral-900">{activeResume.trust_score ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Verified work</p>
                          <p className="mt-2 text-2xl font-black text-neutral-900">{activeResume.verified_platform_work?.length || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Verified skills</p>
                          <p className="mt-2 text-2xl font-black text-neutral-900">{activeResume.verified_skills?.length || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Resume mode</p>
                          <p className="mt-2 text-sm font-black uppercase text-neutral-900">{resumeViewMode === 'verified' || !canViewFullResume ? 'Verified only' : 'Full'}</p>
                        </div>
                      </div>

                      {activeResume.trust_score_breakdown?.length > 0 && (
                        <div className="mb-8 flex flex-wrap gap-2">
                          {activeResume.trust_score_breakdown.map((item, index) => (
                            <ResumeChip key={`${item.label}-${index}`} tone={item.value < 0 ? 'warning' : item.value > 0 ? 'verified' : 'trust'}>
                              {item.label}: {item.value > 0 ? `+${item.value}` : item.value}
                            </ResumeChip>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                        <div className="space-y-8 sm:col-span-2">
                          <section>
                            <ResumeSectionTitle icon={Briefcase}>Profile</ResumeSectionTitle>
                            <p className="text-sm font-medium leading-relaxed text-neutral-700">{activeResume.summary || 'No profile summary yet.'}</p>
                          </section>

                          <section>
                            <ResumeSectionTitle icon={ShieldCheck}>Platform Verified Work</ResumeSectionTitle>
                            {activeResume.verified_platform_work?.length ? (
                              <div className="space-y-5">
                                {activeResume.verified_platform_work.map((item, index) => (
                                  <div key={item.application_id || item.id || `verified-platform-${index}`} className="relative border-l-[3px] border-emerald-200 pl-4">
                                    <div className="absolute -left-[7.5px] top-1.5 h-3 w-3 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
                                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <h5 className="text-base font-black text-neutral-900">{item.title}</h5>
                                      <ResumeChip tone="verified">{item.status || 'Verified'}</ResumeChip>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-neutral-700">
                                      This work record is backed by TeenVerse platform activity, application state, and payment flow.
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>No platform-verified work yet.</ResumeEmpty>
                            )}
                          </section>

                          <section>
                            <ResumeSectionTitle icon={CheckCircle}>Verified Experience</ResumeSectionTitle>
                            {activeResume.verified_experiences?.length ? (
                              <div className="space-y-6">
                                {activeResume.verified_experiences.map((job, index) => (
                                  <div key={job.id || `verified-exp-${index}`} className="relative border-l-[3px] border-indigo-100 pl-4">
                                    <div className="absolute -left-[7.5px] top-1.5 h-3 w-3 rounded-full border-[3px] border-white bg-indigo-600 shadow-sm" />
                                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <h5 className="text-base font-black text-neutral-900">{job.title}</h5>
                                      <ResumeChip tone="verified">{job.period || job.verified_label || 'Verified'}</ResumeChip>
                                    </div>
                                    <p className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">{job.company}</p>
                                    <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-neutral-700">{job.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>No proof-backed experience yet.</ResumeEmpty>
                            )}
                          </section>

                          {resumeViewMode === 'full' && canViewFullResume && (
                            <section>
                              <ResumeSectionTitle icon={BadgeAlert}>Self Declared Experience</ResumeSectionTitle>
                              {activeResume.self_declared_experiences?.length ? (
                                <div className="space-y-6">
                                  {activeResume.self_declared_experiences.map((job, index) => (
                                    <div key={job.id || `self-exp-${index}`} className="relative border-l-[3px] border-amber-100 pl-4">
                                      <div className="absolute -left-[7.5px] top-1.5 h-3 w-3 rounded-full border-[3px] border-white bg-amber-500 shadow-sm" />
                                      <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <h5 className="text-base font-black text-neutral-900">{job.title}</h5>
                                        <ResumeChip tone="warning">{job.source === 'ai' ? 'AI generated' : 'Unverified'}</ResumeChip>
                                      </div>
                                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">{job.company}</p>
                                      <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-neutral-700">{job.description}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <ResumeEmpty>No self-declared experience listed.</ResumeEmpty>
                              )}
                            </section>
                          )}
                        </div>

                        <div className="space-y-8">
                          <section>
                            <ResumeSectionTitle icon={Layers3}>Trust Breakdown</ResumeSectionTitle>
                            {activeResume.trust_score_breakdown?.length ? (
                              <div className="space-y-3">
                                {activeResume.trust_score_breakdown.map((item, index) => (
                                  <div key={`${item.label}-${index}`} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{item.label}</p>
                                    <p className={`mt-2 text-sm font-black ${item.value < 0 ? 'text-amber-700' : 'text-neutral-900'}`}>
                                      {item.value > 0 ? `+${item.value}` : item.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>Trust breakdown not available yet.</ResumeEmpty>
                            )}
                          </section>

                          {activeResume.education?.length > 0 && (
                            <section>
                              <ResumeSectionTitle icon={GraduationCap}>Education</ResumeSectionTitle>
                              <div className="space-y-4">
                                {activeResume.education.map((edu, index) => (
                                  <div key={`edu-${index}`} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                                    <h5 className="mb-1 text-sm font-black text-neutral-900">{edu.degree}</h5>
                                    <p className="text-xs font-bold text-indigo-600">{edu.school}</p>
                                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">{edu.year}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          <section>
                            <ResumeSectionTitle icon={Terminal}>Verified Skills</ResumeSectionTitle>
                            {activeResume.verified_skills?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {activeResume.verified_skills.map((skill, index) => (
                                  <span key={skill.id || `verified-skill-${index}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
                                    {skill.skill_name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <ResumeEmpty>No verified skills yet.</ResumeEmpty>
                            )}
                          </section>

                          {resumeViewMode === 'full' && canViewFullResume && (
                            <section>
                              <ResumeSectionTitle icon={LockKeyhole}>Self Declared Skills</ResumeSectionTitle>
                              {activeResume.self_declared_skills?.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {activeResume.self_declared_skills.map((skill, index) => (
                                    <span key={skill.id || `self-skill-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 shadow-sm">
                                      {skill.skill_name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <ResumeEmpty>No self-declared skills listed.</ResumeEmpty>
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