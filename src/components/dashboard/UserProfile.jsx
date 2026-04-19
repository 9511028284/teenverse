import React, { useState, useEffect, useRef } from 'react';
import {
  Github, Instagram, Linkedin, Globe,
  Award, Zap, Edit3, ShieldCheck,
  Terminal, Sparkles, FileText, Briefcase,
  GraduationCap, Download, X, ExternalLink,
  ArrowUpRight, CheckCircle, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase';
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────

const Card = ({ children, className = '', onClick, glow }) => (
  <motion.div
    whileHover={onClick ? { scale: 0.98, y: -2 } : { y: -2 }}
    whileTap={onClick ? { scale: 0.95 } : {}}
    onClick={onClick}
    className={[
      'relative rounded-[2rem] border backdrop-blur-2xl transition-all duration-500 ease-out overflow-hidden',
      'bg-white/60 dark:bg-[#0a0a0f]/60 border-white/80 dark:border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
      glow ? 'hover:border-purple-400/50 dark:hover:border-purple-400/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] dark:hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'hover:border-neutral-300 dark:hover:border-white/[0.12]',
      onClick ? 'cursor-pointer' : '',
      className
    ].join(' ')}
  >
    {/* Inner Glass Highlight */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/[0.03] to-transparent pointer-events-none transition-colors duration-500" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const SocialBtn = ({ icon: Icon, href, label }) => {
  if (!href) return null;
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.05] text-neutral-600 dark:text-neutral-400 hover:text-white dark:hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 dark:hover:from-indigo-500/80 dark:hover:to-purple-500/80 hover:border-transparent transition-all duration-500 text-xs font-bold shadow-sm hover:shadow-lg hover:shadow-purple-500/25"
    >
      <Icon size={16} className="group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform duration-300" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
};

const StatBlock = ({ value, label, accentClass }) => (
  <div className="flex flex-col items-center justify-center p-5 flex-1 relative group transition-all duration-500">
    <span
      className={`text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 transition-colors duration-500`}
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {value}
    </span>
    <div className="flex items-center gap-1.5 mt-2">
      <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] ${accentClass} transition-colors duration-500`} />
      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-bold transition-colors duration-500">{label}</span>
    </div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-500 rounded-full ${
      active ? 'text-white' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeTabPill"
        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-full z-0"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    <span className="relative z-10">{label}</span>
  </button>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const UserProfile = ({ user, badges, userLevel, unlockedSkills, onEditProfile, readOnly = false, showToast }) => {
  const socials = user?.social_links || {};
  const [resumeData, setResumeData] = useState(null);
  const [userExtras, setUserExtras] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
  const resumeRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      const { data: r } = await supabase.from('resumes').select('content')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
      if (r) setResumeData(r.content);
      const { data: e } = await supabase.from('freelancers')
        .select('specialty, qualification, resume_url').eq('id', user.id).maybeSingle();
      if (e) setUserExtras(e);
    };
    fetchData();
  }, [user?.id]);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsDownloading(true);
    if (showToast) showToast("Generating PDF…", "info");
    try {
      const el = resumeRef.current;
      const orig = el.style.width;
      el.style.width = '210mm';
      const dataUrl = await toPng(el, { quality: 1, pixelRatio: 2 });
      el.style.width = orig;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const props = pdf.getImageProperties(dataUrl);
      const w = pdf.internal.pageSize.getWidth();
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, (props.height * w) / props.width);
      pdf.save(`Resume-${user.name?.replace(/\s+/g, '_')}.pdf`);
      if (showToast) showToast("Downloaded!", "success");
    } catch {
      if (showToast) showToast("Failed.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f8fafc] dark:bg-[#030305] text-neutral-900 dark:text-white pb-24 relative overflow-hidden transition-colors duration-700 ease-in-out"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;0,800&family=DM+Mono:wght@400;500&family=Sora:wght@700;800;900&display=swap');

        /* Minimal Animated Grid Background with seamless dark/light transition */
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

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; transition: background 0.3s; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      {/* ── BACKGROUND FX ──────────────────────────────────────── */}
      <div className="ambient-spotlight" />
      <div className="cyber-grid" />

      {/* ── CONTENT WRAPPER ────────────────────────────────────── */}
      <div className="relative z-10 max-w-[64rem] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">

        {/* ── HERO SECTION ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] border border-white/60 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.01] backdrop-blur-3xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700"
        >
          {/* Cover Strip */}
          <div className="h-44 w-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 dark:from-indigo-900/40 dark:via-purple-900/20 dark:to-[#030305] transition-colors duration-700" />
            {user?.cover_image && (
              <img src={user.cover_image} className="absolute inset-0 w-full h-full object-cover opacity-40 dark:opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000" alt="cover" />
            )}
            
            {!readOnly && (
              <button
                onClick={onEditProfile}
                className="absolute top-5 right-5 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 border border-white dark:border-white/10 text-neutral-900 dark:text-white backdrop-blur-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 z-30"
              >
                <Edit3 size={14} /> <span className="hidden sm:inline">Edit Profile</span>
              </button>
            )}
          </div>

          {/* Profile Core */}
          <div className="px-6 sm:px-10 pb-8 relative z-20 -mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
              
              {/* Avatar & Title */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                <div className="w-36 h-36 rounded-[2rem] p-2 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-2 border-white dark:border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative group transition-all duration-700">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-[2rem] opacity-20 dark:opacity-30 blur-xl group-hover:opacity-40 transition-opacity duration-500" />
                  <img
                    src={user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                    className="w-full h-full object-cover rounded-[1.5rem] relative z-10 bg-neutral-100 dark:bg-[#0a0a0f]"
                    alt="avatar"
                  />
                </div>
                
                <div className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 transition-colors duration-700" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {user?.name || 'Creator'}
                    </h1>
                    {badges.some(b => b.name === 'Verified') && (
                      <div className="bg-white dark:bg-neutral-800 p-1.5 rounded-full shadow-md dark:shadow-none">
                        <ShieldCheck size={22} className="text-blue-500 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20 transition-colors duration-500">
                      @{user?.name?.split(' ')[0]?.toLowerCase() || 'user'}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400 tracking-widest uppercase text-[10px]">{user?.tag_line || 'Digital Creator'}</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 w-fit shadow-lg shadow-amber-500/10 transition-all duration-500">
                <Zap size={16} className="fill-amber-500 dark:fill-amber-400" />
                <span className="text-xs font-black tracking-widest uppercase">Level {userLevel}</span>
              </div>
            </div>

            {/* Bio & Socials */}
            <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base font-medium leading-relaxed max-w-3xl mb-8 transition-colors duration-500">
              {user?.bio || 'No biography written yet. This creator prefers to let their work speak for itself.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <SocialBtn icon={Github} href={socials.github} label="GitHub" />
              <SocialBtn icon={Instagram} href={socials.instagram} label="Instagram" />
              <SocialBtn icon={Linkedin} href={socials.linkedin} label="LinkedIn" />
              {socials.website && <SocialBtn icon={Globe} href={socials.website} label="Website" />}
            </div>
          </div>

          {/* Clean Stats Bar */}
          <div className="border-t border-white/50 dark:border-white/[0.05] bg-white/30 dark:bg-white/[0.01] flex divide-x divide-neutral-200 dark:divide-white/[0.05] backdrop-blur-md transition-colors duration-700">
            <StatBlock value={badges.length} label="Badges" accentClass="bg-pink-500 dark:bg-pink-400 text-pink-500" />
            <StatBlock value={`Lvl.${userLevel}`} label="Rank" accentClass="bg-indigo-500 dark:bg-indigo-400 text-indigo-500" />
            <StatBlock value={unlockedSkills.length} label="Skills" accentClass="bg-cyan-500 dark:bg-cyan-400 text-cyan-500" />
            <StatBlock 
              value={(user?.wallet_balance || 0) > 999 ? `₹${((user?.wallet_balance || 0) / 1000).toFixed(1)}k` : `₹${user?.wallet_balance || 0}`} 
              label="Wallet" 
              accentClass="bg-emerald-500 dark:bg-emerald-400 text-emerald-500" 
            />
          </div>
        </motion.div>

        {/* ── BENTO GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Info Column */}
          <Card className="lg:col-span-2 flex flex-col p-6 sm:p-8" glow>
            <div className="flex gap-2 mb-8 bg-white/50 dark:bg-black/30 p-1.5 rounded-full w-fit border border-neutral-200 dark:border-white/[0.05] backdrop-blur-md shadow-inner transition-colors duration-500">
              {['about', 'skills', 'achievements'].map(t => (
                <TabBtn key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)} />
              ))}
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                
                {/* About Tab */}
                {activeTab === 'about' && (
                  <motion.div key="about"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-3 transition-colors duration-500">The Story</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed transition-colors duration-500">
                        {user?.bio || 'Complete your profile to tell the world what you do.'}
                      </p>
                    </div>

                    {userExtras && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100 dark:border-indigo-500/20 transition-colors duration-500">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-indigo-500/20 shadow-sm flex items-center justify-center mb-4 transition-colors duration-500">
                            <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 transition-colors duration-500">Specialty</p>
                          <p className="text-base font-bold text-neutral-900 dark:text-white transition-colors duration-500">{userExtras.specialty || 'Not specified'}</p>
                        </div>
                        <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10 border border-cyan-100 dark:border-cyan-500/20 transition-colors duration-500">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-cyan-500/20 shadow-sm flex items-center justify-center mb-4 transition-colors duration-500">
                            <GraduationCap size={20} className="text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 transition-colors duration-500">Qualification</p>
                          <p className="text-base font-bold text-neutral-900 dark:text-white transition-colors duration-500">{userExtras.qualification || 'Not specified'}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                  <motion.div key="skills"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Verified Tech Stack</h3>
                    {unlockedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {unlockedSkills.map(skill => (
                          <span key={skill} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-white/10 bg-white/30 dark:bg-white/[0.01] transition-colors duration-500">
                        <Terminal size={32} className="text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                        <p className="text-base font-bold text-neutral-600 dark:text-neutral-400">No verified skills yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                  <motion.div key="achievements"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-6 flex justify-between items-center transition-colors duration-500">
                      Hall of Fame <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest bg-neutral-100 dark:bg-white/[0.05] px-3 py-1 rounded-full">{badges.length} Unlocked</span>
                    </h3>
                    {badges.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {badges.map((badge, i) => (
                          <div key={i} className="badge-card aspect-square flex flex-col items-center justify-center p-4 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent rounded-20px opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="w-14 h-14 rounded-[1.2rem] bg-white dark:bg-purple-500/10 border border-neutral-100 dark:border-purple-500/20 shadow-sm flex items-center justify-center mb-3 relative z-10 transition-colors duration-500">
                              <Award size={24} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-bold text-center text-neutral-700 dark:text-neutral-300 relative z-10 transition-colors duration-500">
                              {badge.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-white/10 bg-white/30 dark:bg-white/[0.01] transition-colors duration-500">
                        <Star size={32} className="text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
                        <p className="text-base font-bold text-neutral-600 dark:text-neutral-400">No badges yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </Card>

          {/* Side Column */}
          <div className="flex flex-col gap-6">
            
            {/* Identity Card */}
            <Card className="flex-1 p-6 sm:p-8" glow>
              <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] font-black tracking-widest text-neutral-400 dark:text-neutral-500 uppercase transition-colors duration-500">Identity Card</p>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm transition-colors duration-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="mb-8 pb-8 border-b border-neutral-200 dark:border-white/[0.05] transition-colors duration-500">
                <span className="text-7xl sm:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-400 dark:from-white dark:to-neutral-600 tracking-tighter transition-colors duration-500" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {String(userLevel).padStart(2, '0')}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-widest ml-3 align-top mt-5 inline-block transition-colors duration-500">Level</span>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'Badges Earned', value: badges.length, color: 'text-pink-500 dark:text-pink-400' },
                  { label: 'Skills Verified', value: unlockedSkills.length, color: 'text-cyan-500 dark:text-cyan-400' },
                  { label: 'KYC Status', value: 'Verified', color: 'text-indigo-500 dark:text-indigo-400', isIcon: true },
                ].map(({ label, value, color, isIcon }) => (
                  <div key={label} className="flex justify-between items-center py-3 px-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.02] transition-colors duration-300">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{label}</span>
                    <span className={`text-sm font-black ${color} flex items-center gap-1.5 transition-colors duration-500`}>
                      {isIcon && <CheckCircle size={14} className="mb-0.5" />} {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions / Resume */}
            {resumeData && (
              <Card onClick={() => setShowResumeModal(true)} className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/5 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/10 border-indigo-200 dark:border-indigo-500/20 group transition-all duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-indigo-500/20 shadow-md border border-indigo-50 dark:border-transparent flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-base font-black text-neutral-900 dark:text-white transition-colors duration-500">View Resume</p>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mt-1 transition-colors duration-500">Verified Document</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-colors duration-500">
                    <ArrowUpRight size={18} className="text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-500 group-hover:rotate-45" />
                  </div>
                </div>
              </Card>
            )}

            {userExtras?.resume_url && (
              <a href={userExtras.resume_url} target="_blank" rel="noopener noreferrer" className="block outline-none">
                <Card className="p-5 flex items-center justify-center gap-2 border-neutral-200 dark:border-white/[0.05] hover:bg-white/80 dark:hover:bg-white/[0.05]">
                  <ExternalLink size={16} className="text-neutral-400 dark:text-neutral-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">External Portfolio</span>
                </Card>
              </a>
            )}

          </div>
        </div>
      </div>

      {/* ── RESUME MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showResumeModal && resumeData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 dark:bg-black/80 backdrop-blur-md sm:p-6"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-50 dark:bg-[#0a0a0f] w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[2.5rem] flex flex-col border border-neutral-200 dark:border-white/[0.1] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-neutral-200 dark:border-white/[0.05] bg-white dark:bg-[#0a0a0f]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-900 dark:text-white">Preview Resume</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadPDF} disabled={isDownloading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Download size={14} /> {isDownloading ? 'Saving…' : 'Download PDF'}
                  </button>
                  <button onClick={() => setShowResumeModal(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center py-8 px-4 bg-neutral-100 dark:bg-[#030305]">
                <div
                  ref={resumeRef}
                  className="bg-white text-neutral-900 w-full max-w-[210mm] min-h-[297mm] rounded-2xl shadow-xl"
                  style={{ fontFamily: "'DM Sans', sans-serif", padding: '14mm 16mm' }}
                >
                  <div className="mb-8 pb-5 border-b-[3px] border-neutral-900">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-neutral-900 mb-2 leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {resumeData.full_name || user?.name}
                    </h1>
                    <p className="text-sm font-black tracking-[0.2em] text-indigo-600 uppercase">{resumeData.professional_title}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="sm:col-span-2 space-y-8">
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3 border-b border-neutral-200 pb-2 flex items-center gap-2">
                          <Briefcase size={14} className="text-neutral-900" /> Profile
                        </h4>
                        <p className="text-sm text-neutral-700 font-medium leading-relaxed">{resumeData.summary}</p>
                      </section>
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-200 pb-2 flex items-center gap-2">
                          <Zap size={14} className="text-neutral-900" /> Experience
                        </h4>
                        <div className="space-y-6">
                          {resumeData.experience?.map((job, i) => (
                            <div key={i} className="pl-4 border-l-[3px] border-indigo-100 relative">
                              <div className="absolute w-3 h-3 bg-indigo-600 rounded-full -left-[7.5px] top-1.5 border-[3px] border-white shadow-sm" />
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                                <h5 className="font-black text-neutral-900 text-base">{job.role}</h5>
                                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md tracking-wider mt-1 sm:mt-0 w-fit border border-indigo-100">{job.period}</span>
                              </div>
                              <p className="text-sm text-neutral-500 font-bold mb-2 uppercase tracking-wide">{job.company}</p>
                              <p className="text-sm text-neutral-700 font-medium leading-relaxed whitespace-pre-line">{job.description}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                    <div className="space-y-8">
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3 border-b border-neutral-200 pb-2 flex items-center gap-2">
                          <GraduationCap size={14} className="text-neutral-900" /> Education
                        </h4>
                        <div className="space-y-4">
                          {resumeData.education?.map((edu, i) => (
                            <div key={i} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                              <h5 className="font-black text-neutral-900 text-sm mb-1">{edu.degree}</h5>
                              <p className="text-xs font-bold text-indigo-600">{edu.school}</p>
                              <p className="text-[10px] font-black text-neutral-400 tracking-widest mt-2 uppercase">{edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3 border-b border-neutral-200 pb-2 flex items-center gap-2">
                          <Terminal size={14} className="text-neutral-900" /> Core Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills?.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1.5 bg-neutral-900 text-white text-[10px] font-bold rounded-lg tracking-wide shadow-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;