import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Github, Instagram, Linkedin, Globe, 
  Award, Zap, Edit3, Share2, ShieldCheck, Heart, Terminal, Sparkles, 
  FileText, Briefcase, GraduationCap, Eye, Download, X
} from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase'; 
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';

// --- LUXURY COMPONENTS ---

const GlassCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ${className} ${onClick ? 'cursor-pointer hover:border-white/20 transition-all' : ''}`}
  >
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
    {children}
  </div>
);

const NeonBadge = ({ icon: Icon, text, color }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-${color}-500/10 border-${color}-500/20 text-${color}-400 shadow-[0_0_15px_rgba(var(--${color}),0.3)]`}>
    <Icon size={12} className={`drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`} />
    <span className="text-[10px] font-bold uppercase tracking-widest">{text}</span>
  </div>
);

const UserProfile = ({ user, badges, userLevel, unlockedSkills, onEditProfile, readOnly = false, showToast }) => {
  const socials = user?.social_links || { github: '', instagram: '', linkedin: '', website: '' };
  
  const [resumeData, setResumeData] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const resumeRef = useRef(null);

  // --- 1. Fetch Resume on Mount ---
  useEffect(() => {
    const fetchResume = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('resumes')
        .select('content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setResumeData(data.content);
      }
    };

    fetchResume();
  }, [user.id]);

  // --- 2. Download Logic (Reused) ---
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsDownloading(true);
    if(showToast) showToast("Generating PDF...", "info");
    
    try {
      const dataUrl = await toPng(resumeRef.current, { quality: 0.95, pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Resume-${user.name.replace(/\s+/g, '_')}.pdf`);
      if(showToast) showToast("Download Complete!", "success");
    } catch (err) {
      console.error(err);
      if(showToast) showToast("Download failed.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  // Parallax Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-8 text-white animate-fade-in relative">
      
      {/* 1. HERO SECTION */}
      <motion.div 
        style={{ rotateX, rotateY, perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        className="relative min-h-[400px] rounded-[40px] border border-white/10 bg-[#050505] overflow-hidden group shadow-2xl"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
        
        {user.cover_image && <img src={user.cover_image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-700" alt="cover"/>}
        
        <div className="relative z-10 p-10 h-full flex flex-col md:flex-row items-end gap-8 mt-20">
          <div className="relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-500 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 animate-tilt"></div>
             <div className="relative w-44 h-44 rounded-[2.5rem] bg-black overflow-hidden border-4 border-black">
                <img src={user.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" alt="avatar" />
             </div>
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <NeonBadge icon={Zap} text={`Level ${userLevel}`} color="yellow" />
             </div>
          </div>

          <div className="flex-1 mb-2">
            <div className="flex items-center gap-3">
               <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">{user.name}</h1>
               {badges.some(b => b.name === 'Verified') && <ShieldCheck className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" size={32}/>}
            </div>
            <p className="text-lg font-medium text-gray-400 flex items-center gap-2 mt-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">@{user.name?.split(' ')[0].toLowerCase()}</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
              <span className="font-mono text-sm">{user.tag_line || 'Digital Creator'}</span>
            </p>
            <div className="flex gap-4 mt-6">
                <SocialLink icon={Github} href={socials.github} />
                <SocialLink icon={Instagram} href={socials.instagram} />
                <SocialLink icon={Linkedin} href={socials.linkedin} />
            </div>
          </div>

          {!readOnly && (
            <div className="flex gap-3">
               <button onClick={onEditProfile} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold uppercase tracking-widest backdrop-blur-md transition-all">Edit Setup</button>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. BENTO GRID STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* About Card */}
        <GlassCard className="p-8 rounded-[32px] lg:col-span-1 flex flex-col">
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-400"><Heart className="fill-pink-400/20" size={20}/> About</h3>
           <p className="text-gray-400 leading-relaxed font-light text-sm flex-1">
             {user.bio || "No bio loaded. This user prefers to remain mysterious in the metaverse."}
           </p>
           
           <div className="mt-8 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest">Tech Arsenal</h4>
              <div className="flex flex-wrap gap-2">
                {unlockedSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-default">{skill}</span>
                ))}
              </div>
           </div>
        </GlassCard>

        {/* Badges */}
        <GlassCard className="p-8 rounded-[32px] lg:col-span-2 relative">
           <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="flex justify-between items-end mb-8 relative z-10">
             <div>
               <h3 className="text-2xl font-black italic flex items-center gap-2"><Award className="text-yellow-400" /> ACHIEVEMENTS</h3>
               <p className="text-gray-500 text-xs font-mono mt-1">HALL OF FAME // {badges.length} UNLOCKED</p>
             </div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              {badges.map((badge, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-3 hover:border-indigo-500/50 transition-all duration-300">
                   <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <Award size={28} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
                   <span className="text-[10px] font-bold text-gray-500 group-hover:text-white uppercase text-center px-2">{badge.name}</span>
                </div>
              ))}
              {[...Array(Math.max(0, 4 - (badges.length % 4)))].map((_, i) => (
                 <div key={i} className="aspect-square rounded-2xl border border-white/5 border-dashed flex items-center justify-center opacity-20"><div className="w-2 h-2 rounded-full bg-white/20"></div></div>
              ))}
           </div>
        </GlassCard>

        {/* --- 3. RESUME TRIGGER CARD (Updated) --- */}
        {resumeData && (
          <GlassCard 
            onClick={() => setShowResumeModal(true)}
            className="p-6 rounded-[32px] lg:col-span-3 flex items-center justify-between group hover:bg-white/10 transition-colors"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                   <FileText size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">Verified Resume</h3>
                   <p className="text-xs text-gray-400">Click to preview or download PDF</p>
                </div>
             </div>
             <div className="flex items-center gap-2 text-sm font-bold text-blue-400">
                PREVIEW <Eye size={16} />
             </div>
          </GlassCard>
        )}

      </div>

      {/* --- 4. RESUME MODAL (Overlay) --- */}
      <AnimatePresence>
        {showResumeModal && resumeData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
              className="bg-[#1E1E1E] w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-3">
                   <FileText className="text-blue-400" size={20}/>
                   <span className="font-bold text-white">Resume Preview</span>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={handleDownloadPDF} 
                     disabled={isDownloading}
                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                   >
                     {isDownloading ? 'Saving...' : 'Download PDF'} <Download size={16}/>
                   </button>
                   <button onClick={() => setShowResumeModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                     <X size={20}/>
                   </button>
                </div>
              </div>

              {/* Resume Paper Content */}
              <div className="overflow-y-auto p-8 bg-gray-900 custom-scrollbar">
                 <div ref={resumeRef} className="bg-white text-gray-800 p-10 rounded-sm shadow-xl max-w-[210mm] mx-auto min-h-[297mm]">
                    {/* --- Resume Structure --- */}
                    <div className="border-b-2 border-gray-800 pb-6 mb-6">
                       <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-900 mb-1">{resumeData.full_name || user.name}</h1>
                       <p className="text-lg font-medium text-indigo-700 tracking-wider uppercase">{resumeData.professional_title}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="md:col-span-2 space-y-6">
                          <section>
                             <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b pb-1">Profile</h4>
                             <p className="text-sm text-gray-700 leading-relaxed">{resumeData.summary}</p>
                          </section>

                          <section>
                             <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b pb-1">Experience</h4>
                             <div className="space-y-5">
                                {resumeData.experience?.map((job, i) => (
                                   <div key={i}>
                                      <div className="flex justify-between items-baseline">
                                         <h5 className="font-bold text-gray-900 text-base">{job.role}</h5>
                                         <span className="text-xs font-medium text-gray-500">{job.period}</span>
                                      </div>
                                      <p className="text-sm text-indigo-700 font-semibold mb-1">{job.company}</p>
                                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                                   </div>
                                ))}
                             </div>
                          </section>
                       </div>

                       <div className="space-y-8">
                          <section>
                             <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b pb-1">Education</h4>
                             <div className="space-y-3">
                                {resumeData.education?.map((edu, i) => (
                                   <div key={i}>
                                      <h5 className="font-bold text-gray-900 text-sm">{edu.degree}</h5>
                                      <p className="text-xs text-gray-600">{edu.school}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{edu.year}</p>
                                   </div>
                                ))}
                             </div>
                          </section>

                          <section>
                             <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b pb-1">Skills</h4>
                             <div className="flex flex-wrap gap-2">
                                {resumeData.skills?.map((skill, i) => (
                                   <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-sm border border-gray-200">
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

const SocialLink = ({ icon: Icon, href }) => {
    if (!href) return null;
    return (
        <a href={href} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 hover:-translate-y-1 transition-all">
            <Icon size={18}/>
        </a>
    )
}

export default UserProfile;