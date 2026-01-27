import React from 'react';
import { 
  MapPin, Github, Instagram, Linkedin, Globe, 
  Award, Zap, Edit3, Share2, ShieldCheck, Heart, Terminal, Sparkles
} from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// --- LUXURY COMPONENTS ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`relative overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ${className}`}>
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

const UserProfile = ({ user, badges, userLevel, unlockedSkills, onEditProfile, readOnly = false }) => {
  const socials = user?.social_links || { github: '', instagram: '', linkedin: '', website: '' };

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
    <div className="max-w-7xl mx-auto pb-24 space-y-8 text-white animate-fade-in">
      
      {/* 1. HERO SECTION (Holographic Tilt) */}
      <motion.div 
        style={{ rotateX, rotateY, perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        className="relative min-h-[400px] rounded-[40px] border border-white/10 bg-[#050505] overflow-hidden group shadow-2xl"
      >
        {/* Ambient Backlights */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
        
        {/* Cover Image */}
        {user.cover_image && <img src={user.cover_image} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-700" alt="cover"/>}
        
        {/* Content Layer */}
        <div className="relative z-10 p-10 h-full flex flex-col md:flex-row items-end gap-8 mt-20">
          
          {/* Avatar with Energy Ring */}
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
               <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                 {user.name}
               </h1>
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
               <button onClick={onEditProfile} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold uppercase tracking-widest backdrop-blur-md transition-all">
                  Edit Setup
               </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. BENTO GRID STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* About Card */}
        <GlassCard className="p-8 rounded-[32px] lg:col-span-1">
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-400">
             <Heart className="fill-pink-400/20" size={20}/> About
           </h3>
           <p className="text-gray-400 leading-relaxed font-light text-sm">
             {user.bio || "No bio loaded. This user prefers to remain mysterious in the metaverse."}
           </p>
           
           <div className="mt-8 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-widest">Tech Arsenal</h4>
              <div className="flex flex-wrap gap-2">
                {unlockedSkills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
           </div>
        </GlassCard>

        {/* Badges / Achievements */}
        <GlassCard className="p-8 rounded-[32px] lg:col-span-2 relative">
           <div className="absolute top-0 right-0 p-32 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
           
           <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <h3 className="text-2xl font-black italic flex items-center gap-2">
                  <Award className="text-yellow-400" /> ACHIEVEMENTS
                </h3>
                <p className="text-gray-500 text-xs font-mono mt-1">HALL OF FAME // {badges.length} UNLOCKED</p>
              </div>
              <button className="text-xs font-bold text-white/50 hover:text-white transition-colors">VIEW ALL</button>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              {badges.map((badge, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-3 hover:border-indigo-500/50 transition-all duration-300">
                   <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <Award size={28} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
                   <span className="text-[10px] font-bold text-gray-500 group-hover:text-white uppercase text-center px-2">{badge.name}</span>
                </div>
              ))}
              {/* Empty Slots */}
              {[...Array(4 - (badges.length % 4))].map((_, i) => (
                 <div key={i} className="aspect-square rounded-2xl border border-white/5 border-dashed flex items-center justify-center opacity-20">
                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                 </div>
              ))}
           </div>
        </GlassCard>

      </div>
    </div>
  );
};

// Sub-component for clean code
const SocialLink = ({ icon: Icon, href }) => {
    if (!href) return null;
    return (
        <a href={href} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 hover:-translate-y-1 transition-all">
            <Icon size={18}/>
        </a>
    )
}

export default UserProfile;