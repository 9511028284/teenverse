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

// ─── PALETTE ──────────────────────────────────────────────────────────────────
// Base:      #030712  (slate 950 - deeper space)
// Surface:   #0f172a  (slate 900 - glass cards)
// Accents:   #a78bfa (Violet), #2dd4bf (Teal), #fb7185 (Rose), #f0b429 (Gold)

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────

const Card = ({ children, className = '', onClick, glow }) => (
  <motion.div
    whileHover={onClick ? { scale: 0.99 } : {}}
    whileTap={onClick ? { scale: 0.97 } : {}}
    onClick={onClick}
    className={[
      'relative rounded-[2rem] border border-white/[0.04] bg-[#0f172a]/60 backdrop-blur-2xl transition-all duration-500 overflow-hidden',
      glow ? 'shadow-[0_0_40px_rgba(167,139,250,0.06)]' : 'shadow-2xl shadow-black/40',
      onClick ? 'cursor-pointer hover:border-white/10 hover:bg-[#0f172a]/80 hover:shadow-[0_0_50px_rgba(167,139,250,0.12)]' : '',
      className
    ].join(' ')}
  >
    {/* Subtle Inner Glow Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const SocialBtn = ({ icon: Icon, href, label }) => {
  if (!href) return null;
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[#94a3b8] hover:text-white hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 text-xs font-bold tracking-wide"
    >
      <Icon size={14} className="group-hover:scale-110 transition-transform duration-300" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
};

const StatBlock = ({ value, label, color }) => (
  <div className="flex flex-col items-center justify-center p-4 flex-1 border-r border-white/[0.04] last:border-r-0 relative group">
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <span
      className={`text-2xl sm:text-3xl font-black leading-none tracking-tighter ${color || 'text-[#f0b429]'}`}
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {value}
    </span>
    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-2 font-bold">{label}</span>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative px-5 py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
      active ? 'text-white' : 'text-[#64748b] hover:text-[#94a3b8]'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-gradient-to-r from-[#a78bfa] to-[#2dd4bf] shadow-[0_0_10px_rgba(167,139,250,0.5)]"
      />
    )}
    {label}
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
      className="min-h-screen bg-[#030712] text-white pb-24 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&family=DM+Mono:wght@400;500&family=Sora:wght@700;800;900&display=swap');

        /* Dynamic Aurora Background */
        .aurora-bg {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          overflow: hidden; z-index: 0; pointer-events: none;
        }
        .aurora-blob {
          position: absolute; border-radius: 50%; filter: blur(90px);
          animation: float 20s infinite ease-in-out alternate;
          opacity: 0.15;
        }
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
          100% { transform: translate(-30px, 50px) scale(0.9); }
        }

        /* SVG Noise Texture for Premium Grain */
        .noise-overlay {
          position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.25;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .avatar-ring {
          background: conic-gradient(from 180deg at 50% 50%, #f0b429, #fb7185, #a78bfa, #2dd4bf, #f0b429);
          padding: 3px; border-radius: 9999px;
          animation: spin-slow 8s linear infinite;
        }
        .avatar-ring-inner {
          border-radius: 9999px; overflow: hidden; background: #030712;
          animation: spin-slow 8s linear infinite reverse; /* Keep avatar upright */
        }
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }

        .skill-tag {
          background: rgba(45,212,191,0.05); border: 1px solid rgba(45,212,191,0.2);
          color: #2dd4bf; border-radius: 12px; padding: 6px 14px;
          font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 500;
          transition: all 0.3s ease; cursor: default;
          box-shadow: 0 0 0 rgba(45,212,191,0);
        }
        .skill-tag:hover {
          background: rgba(45,212,191,0.15); border-color: rgba(45,212,191,0.5);
          box-shadow: 0 0 15px rgba(45,212,191,0.2); transform: translateY(-1px);
        }

        .badge-card {
          background: linear-gradient(145deg, rgba(251,113,133,0.05) 0%, rgba(15,23,42,0.8) 100%);
          border: 1px solid rgba(251,113,133,0.1); border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1); backdrop-filter: blur(10px);
        }
        .badge-card:hover {
          border-color: rgba(251,113,133,0.4); transform: translateY(-4px) scale(1.02);
          box-shadow: 0 10px 30px rgba(251,113,133,0.15);
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      {/* ── BACKGROUND FX ──────────────────────────────────────── */}
      <div className="aurora-bg">
        <div className="aurora-blob bg-[#a78bfa] w-[40vw] h-[40vw] -top-[10vw] -left-[10vw]" style={{ animationDelay: '0s' }} />
        <div className="aurora-blob bg-[#2dd4bf] w-[35vw] h-[35vw] top-[20vw] right-[0vw]" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob bg-[#fb7185] w-[30vw] h-[30vw] -bottom-[10vw] left-[20vw]" style={{ animationDelay: '-10s' }} />
      </div>
      <div className="noise-overlay"></div>

      {/* ── CONTENT WRAPPER ────────────────────────────────────── */}
      <div className="relative z-10 max-w-[64rem] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6">

        {/* ── HERO CARD ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] border border-white/[0.06] bg-[#0f172a]/40 backdrop-blur-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          {/* Cover image strip */}
          <div className="h-32 sm:h-44 w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1040] via-[#0c1f35] to-[#1a1530]" />
            {user?.cover_image && (
              <img src={user.cover_image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" alt="cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 to-transparent" />
            
            {!readOnly && (
              <button
                onClick={onEditProfile}
                className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/30 border border-white/10 text-white/70 hover:text-white hover:border-white/30 hover:bg-black/50 backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl"
              >
                <Edit3 size={14} /> <span className="hidden sm:inline">Edit Profile</span>
              </button>
            )}
          </div>

          {/* Profile body */}
          <div className="px-6 sm:px-10 pb-0 relative z-20">
            {/* Avatar row — overlaps cover */}
            <div className="-mt-14 sm:-mt-16 mb-5 flex items-end justify-between">
              <div className="avatar-ring w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <div className="avatar-ring-inner w-full h-full">
                  <img
                    src={user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                    className="w-full h-full object-cover"
                    alt="avatar"
                  />
                </div>
              </div>
              {/* Level pill */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0b429]/10 border border-[#f0b429]/30 mb-2 shadow-[0_0_20px_rgba(240,180,41,0.15)] backdrop-blur-md">
                <Zap size={14} className="text-[#f0b429] fill-[#f0b429]" />
                <span className="text-xs font-black text-[#f0b429] tracking-widest uppercase">Level {userLevel}</span>
              </div>
            </div>

            {/* Name + handle + tagline */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 drop-shadow-sm"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {user?.name || 'Creator'}
                </h1>
                {badges.some(b => b.name === 'Verified') && (
                  <div className="w-8 h-8 rounded-full bg-[#2dd4bf]/10 flex items-center justify-center border border-[#2dd4bf]/20 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                    <ShieldCheck size={18} className="text-[#2dd4bf]" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-[#a78bfa] font-mono font-bold tracking-wide bg-[#a78bfa]/10 px-3 py-1 rounded-md border border-[#a78bfa]/20">
                  @{user?.name?.split(' ')[0]?.toLowerCase() || 'user'}
                </span>
                <span className="text-[#334155] font-black tracking-widest uppercase text-[10px]">
                  {user?.tag_line || 'Digital Creator'}
                </span>
              </div>
            </div>

            {/* Bio */}
            <p className="text-[#94a3b8] text-sm sm:text-base leading-relaxed max-w-2xl mb-6 font-medium">
              {user?.bio || 'No biography written yet. This creator prefers to let their work speak for itself.'}
            </p>

            {/* Socials */}
            <div className="flex flex-wrap gap-3 mb-8">
              <SocialBtn icon={Github} href={socials.github} label="GitHub" />
              <SocialBtn icon={Instagram} href={socials.instagram} label="Instagram" />
              <SocialBtn icon={Linkedin} href={socials.linkedin} label="LinkedIn" />
              {socials.website && <SocialBtn icon={Globe} href={socials.website} label="Portfolio" />}
            </div>
          </div>

          {/* Stats bar */}
          <div className="border-t border-white/[0.04] flex bg-black/20">
            <StatBlock value={badges.length}    label="Badges"  color="text-[#fb7185]" />
            <StatBlock value={`Lv.${userLevel}`} label="Rank"   color="text-[#f0b429]" />
            <StatBlock value={unlockedSkills.length} label="Skills" color="text-[#2dd4bf]" />
            <StatBlock
              value={(user?.wallet_balance || 0) > 999
                ? `₹${((user?.wallet_balance || 0) / 1000).toFixed(1)}k`
                : `₹${user?.wallet_balance || 0}`}
              label="Wallet"
              color="text-[#a78bfa]"
            />
          </div>
        </motion.div>

        {/* ── BODY GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — tabbed content */}
          <Card className="lg:col-span-3 flex flex-col" glow>
            <div className="flex border-b border-white/[0.04] px-2 pt-2 bg-black/10">
              {['about', 'skills', 'achievements'].map(t => (
                <TabBtn key={t} label={t} active={activeTab === t} onClick={() => setActiveTab(t)} />
              ))}
            </div>

            <div className="p-6 sm:p-8 flex-1">
              <AnimatePresence mode="wait">

                {/* About */}
                {activeTab === 'about' && (
                  <motion.div key="about"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b] mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f0b429] shadow-[0_0_10px_rgba(240,180,41,0.5)]" /> The Story
                      </p>
                      <p className="text-sm sm:text-base text-[#cbd5e1] leading-relaxed font-medium">
                        {user?.bio || 'No bio yet. Complete your profile to tell the world what you do.'}
                      </p>
                    </div>

                    {userExtras && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-gradient-to-br from-[#a78bfa]/10 to-transparent border border-[#a78bfa]/10">
                          <div className="p-3 rounded-2xl bg-[#a78bfa]/20 flex-shrink-0 shadow-[0_0_20px_rgba(167,139,250,0.15)]">
                            <Sparkles size={18} className="text-[#a78bfa]" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#64748b] mb-1.5">Specialty</p>
                            <p className="text-sm font-bold text-white tracking-wide">{userExtras.specialty || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-gradient-to-br from-[#2dd4bf]/10 to-transparent border border-[#2dd4bf]/10">
                          <div className="p-3 rounded-2xl bg-[#2dd4bf]/20 flex-shrink-0 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
                            <GraduationCap size={18} className="text-[#2dd4bf]" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#64748b] mb-1.5">Qualification</p>
                            <p className="text-sm font-bold text-white tracking-wide">{userExtras.qualification || '—'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {userExtras?.resume_url && (
                      <a
                        href={userExtras.resume_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#f0b429]/10 border border-[#f0b429]/30 text-[#f0b429] text-[11px] font-black uppercase tracking-widest hover:bg-[#f0b429]/20 hover:scale-105 transition-all shadow-[0_0_20px_rgba(240,180,41,0.1)]"
                      >
                        <ExternalLink size={14} /> View External Resume
                      </a>
                    )}
                  </motion.div>
                )}

                {/* Skills */}
                {activeTab === 'skills' && (
                  <motion.div key="skills"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b] mb-5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shadow-[0_0_10px_rgba(45,212,191,0.5)]" /> Verified Tech Stack
                    </p>
                    {unlockedSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {unlockedSkills.map(skill => (
                          <span key={skill} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-[#1e293b]/50 border border-white/5 flex items-center justify-center mb-4">
                          <Terminal size={24} className="text-[#64748b]" />
                        </div>
                        <p className="text-sm font-bold text-[#94a3b8] tracking-wide">No verified skills yet</p>
                        <p className="text-xs text-[#475569] mt-2 font-medium">Complete quizzes to unlock badges</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Achievements */}
                {activeTab === 'achievements' && (
                  <motion.div key="achievements"
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b] mb-5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#fb7185] shadow-[0_0_10px_rgba(251,113,133,0.5)]" /> Hall of Fame <span className="text-white/20">|</span> {badges.length} Unlocked
                    </p>
                    {badges.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        {badges.map((badge, i) => (
                          <div key={i} className="badge-card aspect-square flex flex-col items-center justify-center gap-3 p-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#fb7185]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 rounded-[1rem] bg-[#fb7185]/10 border border-[#fb7185]/20 flex items-center justify-center flex-shrink-0 relative z-10 shadow-inner">
                              <Award size={20} className="text-[#fb7185]" />
                            </div>
                            <span className="text-[10px] font-black text-[#94a3b8] group-hover:text-white text-center uppercase tracking-wider leading-tight px-1 relative z-10 transition-colors">
                              {badge.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-[#1e293b]/50 border border-white/5 flex items-center justify-center mb-4">
                          <Star size={24} className="text-[#64748b]" />
                        </div>
                        <p className="text-sm font-bold text-[#94a3b8] tracking-wide">No badges yet</p>
                        <p className="text-xs text-[#475569] mt-2 font-medium">Keep completing missions to earn them</p>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </Card>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Identity / Creator ID card */}
            <Card className="flex-1 p-6 sm:p-8 relative overflow-hidden flex flex-col" glow>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(167,139,250,0.15),_transparent_50%)] pointer-events-none" />

              <div className="relative z-10 flex-1">
                {/* Header row */}
                <div className="flex items-center justify-between mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#64748b]">Creator ID</p>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-pulse" />
                    <span className="text-[9px] font-black text-[#2dd4bf] uppercase tracking-widest">Active</span>
                  </div>
                </div>

                {/* Big level display */}
                <div className="mb-8 pb-8 border-b border-white/[0.06]">
                  <span
                    className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#f0b429] to-[#f0b429]/40 leading-none drop-shadow-lg"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {String(userLevel).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-black text-[#64748b] uppercase tracking-[0.2em] ml-3 align-top mt-5 inline-block">Level</span>
                </div>

                {/* Stat rows */}
                <div className="space-y-1">
                  {[
                    { label: 'Badges Earned',    value: badges.length,         color: 'text-[#fb7185]' },
                    { label: 'Skills Verified',  value: unlockedSkills.length, color: 'text-[#2dd4bf]' },
                    { label: 'KYC Status',       value: 'Verified',            color: 'text-[#a78bfa]', isText: true },
                  ].map(({ label, value, color, isText }) => (
                    <div key={label} className="flex items-center justify-between py-3.5 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748b]">{label}</span>
                      <span className={`text-sm font-black ${color} flex items-center gap-1.5`}>
                        {isText ? <><CheckCircle size={12} /> {value}</> : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Resume trigger */}
            {resumeData && (
              <Card onClick={() => setShowResumeModal(true)} className="p-5 sm:p-6 group flex-shrink-0 border-[#a78bfa]/20 bg-[#a78bfa]/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-[#a78bfa]/20 border border-[#a78bfa]/30 flex items-center justify-center group-hover:bg-[#a78bfa]/30 transition-all shadow-[0_0_20px_rgba(167,139,250,0.2)]">
                      <FileText size={20} className="text-[#a78bfa]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white group-hover:text-[#a78bfa] tracking-wide transition-colors">Verified Resume</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mt-1">Tap to preview document</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-[#a78bfa]/30 group-hover:bg-[#a78bfa] flex items-center justify-center transition-all shadow-md">
                    <ArrowUpRight size={16} className="text-[#a78bfa] group-hover:text-white group-hover:rotate-12 transition-all" />
                  </div>
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* ── RESUME MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {showResumeModal && resumeData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xl sm:p-6"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: "100%", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%", scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#030712] w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative"
            >
              {/* Inner noise for modal */}
              <div className="noise-overlay opacity-30"></div>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.06] flex-shrink-0 bg-[#0f172a]/80 backdrop-blur-md relative z-20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[1rem] bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center shadow-inner">
                    <FileText size={18} className="text-[#a78bfa]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-wide">Resume Preview</p>
                    <p className="text-[10px] font-bold text-[#64748b] tracking-[0.2em] uppercase mt-0.5">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#a78bfa] hover:bg-[#b89ffb] text-[#030712] text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)] hover:scale-105 active:scale-95"
                  >
                    <Download size={14} />
                    {isDownloading ? 'Saving…' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => setShowResumeModal(false)}
                    className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/[0.1] transition-all hover:rotate-90 active:scale-90"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Resume document wrapper */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#030712] flex justify-center py-8 px-4 sm:px-8 pb-28 sm:pb-8 relative z-20">
                <div
                  ref={resumeRef}
                  className="bg-white text-gray-900 w-full max-w-[210mm] min-h-[297mm] flex-shrink-0 origin-top rounded-2xl shadow-2xl"
                  style={{ fontFamily: "'DM Sans', sans-serif", padding: '14mm 16mm' }}
                >
                  <div className="mb-8 pb-5 border-b-[3px] border-gray-900">
                    <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-2"
                      style={{ fontFamily: "'Sora', sans-serif" }}>
                      {resumeData.full_name || user?.name}
                    </h1>
                    <p className="text-sm font-black tracking-[0.2em] uppercase text-violet-600">
                      {resumeData.professional_title}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="sm:col-span-2 space-y-8">
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
                          <Briefcase size={14} className="text-gray-900" /> Profile
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{resumeData.summary}</p>
                      </section>
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                          <Zap size={14} className="text-gray-900" /> Experience
                        </h4>
                        <div className="space-y-6">
                          {resumeData.experience?.map((job, i) => (
                            <div key={i} className="pl-4 border-l-[3px] border-violet-100 relative">
                              <div className="absolute w-3 h-3 bg-violet-600 rounded-full -left-[7.5px] top-1.5 border-[3px] border-white shadow-sm" />
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                                <h5 className="font-black text-gray-900 text-base">{job.role}</h5>
                                <span className="text-[10px] font-black text-violet-700 bg-violet-50 px-2 py-1 rounded-md tracking-wider mt-1 sm:mt-0 w-fit border border-violet-100">{job.period}</span>
                              </div>
                              <p className="text-sm text-gray-500 font-bold mb-2 uppercase tracking-wide">{job.company}</p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">{job.description}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                    <div className="space-y-8">
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
                          <GraduationCap size={14} className="text-gray-900" /> Education
                        </h4>
                        <div className="space-y-4">
                          {resumeData.education?.map((edu, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <h5 className="font-black text-gray-900 text-sm mb-1">{edu.degree}</h5>
                              <p className="text-xs font-bold text-violet-600">{edu.school}</p>
                              <p className="text-[10px] font-black text-gray-400 tracking-widest mt-2 uppercase">{edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                      <section>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
                          <Terminal size={14} className="text-gray-900" /> Core Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills?.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg tracking-wide shadow-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile sticky action */}
              <div className="sm:hidden absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent z-30 pointer-events-none">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#a78bfa] text-[#030712] text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(167,139,250,0.4)] pointer-events-auto active:scale-95"
                >
                  <Download size={16} />
                  {isDownloading ? 'Processing…' : 'Download PDF'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;