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
    className={`relative overflow-hidden bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-[32px] ${className} ${onClick ? 'cursor-pointer hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98] transition-all duration-300' : ''}`}
  >
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
    {children}
  </div>
);

const NeonBadge = ({ icon: Icon, text, color }) => (
  <div className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border bg-${color}-500/10 border-${color}-500/20 text-${color}-400 shadow-[0_0_15px_rgba(var(--${color}),0.3)] backdrop-blur-md`}>
    <Icon size={14} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{text}</span>
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

      if (data && !error) setResumeData(data.content);
    };
    fetchResume();
  }, [user.id]);

  // --- 2. Download Logic ---
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

  // Parallax Logic (Only impacts desktop where mouse moves)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e) => {
    // Check if it's a touch device, if so bypass to prevent jitter
    if(window.innerWidth < 768) return; 
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 md:space-y-8 text-white animate-fade-in relative px-4 sm:px-6 lg:px-8">
      
      {/* 1. HERO SECTION */}
      <motion.div 
        style={{ rotateX, rotateY, perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        className="relative min-h-[350px] md:min-h-[400px] rounded-[32px] md:rounded-[40px] border border-white/10 bg-[#050505] overflow-hidden group shadow-2xl transition-all duration-300"
      >
        <div className="absolute -top-[20%] -left-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/30 rounded-full blur-[100px] md:blur-[120px] mix-blend-screen animate-pulse-slow pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/20 rounded-full blur-[100px] md:blur-[120px] mix-blend-screen pointer-events-none"></div>
        
        {user.cover_image && <img src={user.cover_image} className="absolute inset-0 w-full h-full object-cover opacity-30 md:opacity-40 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none" alt="cover"/>}
        
        <div className="relative z-10 p-6 md:p-10 h-full flex flex-col md:flex-row items-center md:items-end text-center md:text-left gap-6 md:gap-8 mt-12 md:mt-20">
          
          {/* Avatar Area */}
          <div className="relative shrink-0 mt-4 md:mt-0">
             <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-500 rounded-full md:rounded-[2.5rem] blur opacity-75 md:group-hover:opacity-100 transition duration-1000 animate-tilt"></div>
             <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full md:rounded-[2.5rem] bg-black overflow-hidden border-2 md:border-4 border-black">
                <img src={user.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full object-cover" alt="avatar" />
             </div>
             <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 z-20">
                <NeonBadge icon={Zap} text={`Level ${userLevel}`} color="yellow" />
             </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 w-full flex flex-col items-center md:items-start mb-2">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
               <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                 {user.name}
               </h1>
               {badges.some(b => b.name === 'Verified') && <ShieldCheck className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] mt-1 md:mt-0" size={28}/>}
            </div>
            
            <p className="text-base md:text-lg font-medium text-gray-400 flex flex-wrap justify-center md:justify-start items-center gap-2 mt-2 md:mt-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-sm">@{user.name?.split(' ')[0].toLowerCase()}</span>
              <span className="hidden md:inline-block w-1.5 h-1.5 bg-gray-600 rounded-full"></span>
              <span className="font-mono text-sm tracking-wide bg-white/5 px-3 py-1 rounded-full border border-white/10">{user.tag_line || 'Digital Creator'}</span>
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 mt-6">
                <SocialLink icon={Github} href={socials.github} />
                <SocialLink icon={Instagram} href={socials.instagram} />
                <SocialLink icon={Linkedin} href={socials.linkedin} />
            </div>
          </div>

          {!readOnly && (
            <div className="w-full md:w-auto mt-4 md:mt-0">
               <button onClick={onEditProfile} className="w-full md:w-auto px-8 py-3.5 md:py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-sm font-bold uppercase tracking-widest backdrop-blur-md transition-all active:scale-95 shadow-lg flex justify-center items-center gap-2">
                 <Edit3 size={16}/> Edit Setup
               </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. BENTO GRID STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* About Card */}
        <GlassCard className="p-6 md:p-8 lg:col-span-1 flex flex-col">
           <h3 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2 text-pink-400"><Heart className="fill-pink-400/20" size={20}/> About</h3>
           <p className="text-gray-300 leading-relaxed font-light text-sm flex-1">
             {user.bio || "No bio loaded. This user prefers to remain mysterious in the metaverse."}
           </p>
           
           <div className="mt-8 pt-6 border-t border-white/5">
              <h4 className="text-[10px] md:text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest flex items-center gap-2">
                <Terminal size={12}/> Tech Arsenal
              </h4>
              <div className="flex flex-wrap gap-2">
                {unlockedSkills.length > 0 ? unlockedSkills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs font-mono text-cyan-300 cursor-default shadow-sm">{skill}</span>
                )) : <span className="text-xs text-gray-600 italic">No verified skills yet.</span>}
              </div>
           </div>
        </GlassCard>

        {/* Badges */}
        <GlassCard className="p-6 md:p-8 lg:col-span-2 relative">
           <div className="absolute top-0 right-0 p-32 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 relative z-10 gap-2">
             <div>
               <h3 className="text-xl md:text-2xl font-black italic flex items-center gap-2 text-white">
                 <Award className="text-yellow-400" size={24}/> ACHIEVEMENTS
               </h3>
               <p className="text-gray-500 text-[10px] md:text-xs font-mono mt-1 tracking-widest uppercase">Hall of Fame // {badges.length} Unlocked</p>
             </div>
           </div>
           
           <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4 relative z-10">
              {badges.map((badge, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-2 md:gap-3 hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 shadow-md">
                   <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                   <Award size={24} className="text-gray-500 group-hover:text-indigo-400 transition-colors drop-shadow-sm md:w-7 md:h-7" />
                   <span className="text-[9px] md:text-[10px] font-bold text-gray-400 group-hover:text-white uppercase text-center px-1 leading-tight">{badge.name}</span>
                </div>
              ))}
              {/* Empty Badge Slots */}
              {[...Array(Math.max(0, 4 - (badges.length % 4 || 4)))].map((_, i) => (
                 <div key={i} className="aspect-square rounded-2xl border border-white/5 border-dashed flex items-center justify-center opacity-30 bg-black/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                 </div>
              ))}
           </div>
        </GlassCard>

        {/* --- 3. RESUME TRIGGER CARD --- */}
        {resumeData && (
          <GlassCard 
            onClick={() => setShowResumeModal(true)}
            className="p-5 md:p-6 lg:col-span-3 flex items-center justify-between group"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all duration-300 shadow-inner">
                   <FileText size={24} />
                </div>
                <div>
                   <h3 className="text-base md:text-lg font-bold text-white group-hover:text-blue-100 transition-colors">Verified Resume</h3>
                   <p className="text-xs md:text-sm text-gray-400 mt-0.5">Click to preview document</p>
                </div>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-xs md:text-sm font-bold text-blue-400 border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all">
                PREVIEW <Eye size={16} />
             </div>
          </GlassCard>
        )}

      </div>

      {/* --- 4. RESUME MODAL (Mobile-First overlay) --- */}
      <AnimatePresence>
        {showResumeModal && resumeData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center md:p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col border-0 md:border md:border-white/10 relative"
            >
              
              {/* Desktop Header (Hidden on Mobile) */}
              <div className="hidden md:flex p-5 border-b border-white/10 justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="text-blue-400" size={20}/></div>
                   <span className="font-bold text-lg text-white tracking-wide">Resume Preview</span>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={handleDownloadPDF} 
                     disabled={isDownloading}
                     className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                   >
                     {isDownloading ? 'Saving...' : 'Download PDF'} <Download size={16}/>
                   </button>
                   <button onClick={() => setShowResumeModal(false)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
                     <X size={20}/>
                   </button>
                </div>
              </div>

              {/* Mobile Header (Hidden on Desktop) */}
              <div className="md:hidden flex p-4 border-b border-white/10 justify-between items-center bg-black/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-20">
                <span className="font-bold text-white tracking-wide flex items-center gap-2"><FileText size={16} className="text-blue-400"/> Resume</span>
                <button onClick={() => setShowResumeModal(false)} className="p-2 bg-white/10 rounded-full text-white">
                  <X size={18}/>
                </button>
              </div>

              {/* Resume Paper Content (Scrollable Panning Area) */}
              <div className="overflow-auto flex-1 pt-20 pb-24 md:pt-8 md:pb-8 bg-gray-950 flex md:justify-center items-start custom-scrollbar touch-pan-x touch-pan-y relative z-10">
                 
                 {/* The Actual Document - Exact A4 Dimensions Preserved for PDF */}
                 <div ref={resumeRef} className="bg-white text-gray-900 p-8 sm:p-10 rounded shadow-2xl w-[210mm] min-h-[297mm] shrink-0 mx-4 md:mx-auto origin-top transition-transform">
                    {/* --- Resume Document UI --- */}
                    <div className="border-b-2 border-gray-900 pb-5 mb-6">
                       <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-gray-900 mb-1 leading-none">{resumeData.full_name || user.name}</h1>
                       <p className="text-base sm:text-lg font-bold text-indigo-700 tracking-widest uppercase">{resumeData.professional_title}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                       <div className="col-span-2 space-y-6">
                          <section>
                             <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1.5 flex items-center gap-2"><Briefcase size={14}/> Profile</h4>
                             <p className="text-sm text-gray-700 leading-relaxed font-medium">{resumeData.summary}</p>
                          </section>

                          <section>
                             <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1.5 flex items-center gap-2"><Zap size={14}/> Experience</h4>
                             <div className="space-y-5">
                                {resumeData.experience?.map((job, i) => (
                                   <div key={i} className="relative pl-4 border-l-2 border-gray-200">
                                      <div className="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full -left-[6px] top-1.5 border-2 border-white"></div>
                                      <div className="flex justify-between items-start mb-0.5">
                                         <h5 className="font-bold text-gray-900 text-base leading-tight">{job.role}</h5>
                                         <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap ml-2 bg-gray-100 px-2 py-0.5 rounded-sm">{job.period}</span>
                                      </div>
                                      <p className="text-sm text-indigo-700 font-bold mb-2">{job.company}</p>
                                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                                   </div>
                                ))}
                             </div>
                          </section>
                       </div>

                       <div className="space-y-6">
                          <section>
                             <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1.5 flex items-center gap-2"><GraduationCap size={14}/> Education</h4>
                             <div className="space-y-4">
                                {resumeData.education?.map((edu, i) => (
                                   <div key={i}>
                                      <h5 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">{edu.degree}</h5>
                                      <p className="text-xs font-semibold text-indigo-700">{edu.school}</p>
                                      <p className="text-[10px] font-medium text-gray-500 mt-1">{edu.year}</p>
                                   </div>
                                ))}
                             </div>
                          </section>

                          <section>
                             <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1.5 flex items-center gap-2"><Terminal size={14}/> Core Skills</h4>
                             <div className="flex flex-wrap gap-1.5">
                                {resumeData.skills?.map((skill, i) => (
                                   <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 text-[10px] sm:text-xs font-bold rounded flex-auto text-center border border-gray-200">
                                      {skill}
                                   </span>
                                ))}
                             </div>
                          </section>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Mobile Sticky Bottom Action Bar (Hidden on Desktop) */}
              <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 z-20 pb-8">
                  <button 
                     onClick={handleDownloadPDF} 
                     disabled={isDownloading}
                     className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-blue-600 active:bg-blue-700 text-white rounded-2xl text-base font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                   >
                     {isDownloading ? 'Processing PDF...' : 'Download Resume'} <Download size={20}/>
                   </button>
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
        <a href={href} target="_blank" rel="noreferrer" className="p-3 md:p-3.5 bg-white/[0.05] border border-white/10 rounded-xl md:rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-95 hover:-translate-y-1 transition-all duration-300 shadow-sm">
            <Icon size={18} className="md:w-5 md:h-5"/>
        </a>
    )
}

export default UserProfile;