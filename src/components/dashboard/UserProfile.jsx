import React, { useRef } from 'react';
import { 
  MapPin, Github, Instagram, Linkedin, Globe, 
  Code, Award, Zap, Edit3, Share2, ShieldCheck, Heart, Terminal, Cpu 
} from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// --- MICRO-COMPONENTS ---

const SocialButton = ({ icon: Icon, href, colorClass }) => {
  if (!href) return null;
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      className={`p-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300 ${colorClass}`}
    >
      <Icon size={20} />
    </a>
  );
};

const SkillTag = ({ skill }) => (
  <div className="relative group px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl overflow-hidden hover:bg-indigo-500/20 transition-colors cursor-default">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
    <span className="relative z-10 text-xs font-bold text-indigo-300 group-hover:text-indigo-200 uppercase tracking-wide">
      {skill}
    </span>
  </div>
);

// --- MAIN COMPONENT ---

const UserProfile = ({ user, badges, userLevel, unlockedSkills, isClient, onEditProfile }) => {
  
  const socials = user?.social_links || { github: '', instagram: '', linkedin: '', website: '' };
  
  // 3D Card Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [2, -2]);
  const rotateY = useTransform(x, [-100, 100], [-2, 2]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-8">
      
      {/* 1. HERO IDENTITY CARD (3D TILT) */}
      <motion.div 
        style={{ rotateX, rotateY, perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative group w-full rounded-[3rem] bg-[#09090b] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black z-0"></div>
          {user.cover_image && <img src={user.cover_image} alt="Cover" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
        </div>

        <div className="relative z-10 px-6 py-12 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8">
          
          {/* Avatar Area */}
          <div className="relative group/avatar">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2.5rem] p-1.5 bg-gradient-to-br from-white/20 to-white/0 border border-white/20 backdrop-blur-md shadow-2xl transform transition-transform duration-500 group-hover/avatar:rotate-3">
               {user.avatar_url ? (
                 <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-[2rem] object-cover bg-gray-800" />
               ) : (
                 <div className="w-full h-full rounded-[2rem] bg-gray-800 flex items-center justify-center text-6xl">👾</div>
               )}
            </div>
            
            {/* Level Badge */}
            <div className="absolute -bottom-3 -right-3 bg-black/80 backdrop-blur-xl border border-yellow-500/50 text-yellow-400 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
               <Zap size={14} className="fill-yellow-400" />
               <span className="text-sm font-black tracking-wider">LVL {userLevel}</span>
            </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                {user.name}
              </h1>
              {badges.some(b => b.name === 'Verified') && <ShieldCheck className="text-blue-400 fill-blue-400/10" size={32}/>}
            </div>
            
            <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500 font-medium">
              @{user.name?.split(' ')[0].toLowerCase()} • <span className="text-indigo-400">{user.tag_line || 'TeenVerse Creator'}</span>
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-4 pt-2 text-sm font-semibold text-gray-500">
               <span className="flex items-center gap-1"><MapPin size={14}/> {user.nationality || 'Metaverse'}</span>
               <span className="w-1 h-1 rounded-full bg-gray-600"></span>
               <span>Joined {new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
             <button onClick={onEditProfile} className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur text-white font-bold transition-all flex items-center gap-2">
               <Edit3 size={18}/> Edit
             </button>
             <button className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2">
               <Share2 size={18}/> Share
             </button>
          </div>
        </div>
      </motion.div>


      {/* 2. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Stats & Bio (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Bio Card */}
          <div className="bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
               <Heart className="text-pink-500 fill-pink-500/20" size={20}/> Bio
             </h3>
             <p className="text-gray-400 leading-relaxed font-medium text-sm">
               {user.bio || "This user is mysterious and hasn't written a bio yet."}
             </p>
             <div className="flex gap-2 mt-6">
               <SocialButton icon={Github} href={socials.github} colorClass="hover:bg-black hover:border-gray-700" />
               <SocialButton icon={Instagram} href={socials.instagram} colorClass="hover:bg-gradient-to-tr hover:from-yellow-400 hover:to-purple-600 hover:border-transparent" />
               <SocialButton icon={Linkedin} href={socials.linkedin} colorClass="hover:bg-blue-600 hover:border-blue-500" />
               <SocialButton icon={Globe} href={socials.website} colorClass="hover:bg-indigo-500 hover:border-indigo-400" />
             </div>
          </div>

          {/* Skills Matrix */}
          <div className="bg-[#09090b] border border-white/10 rounded-[2.5rem] p-8">
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
               <Terminal className="text-emerald-400" size={20}/> Tech Stack
             </h3>
             <div className="flex flex-wrap gap-2">
                {unlockedSkills && unlockedSkills.length > 0 ? (
                  unlockedSkills.map(s => <SkillTag key={s} skill={s} />)
                ) : (
                  <p className="text-gray-500 text-sm italic">No skills unlocked yet.</p>
                )}
             </div>
          </div>
        </div>

        {/* Right Col: Achievements (8 cols) */}
        <div className="lg:col-span-8">
          <div className="h-full bg-gradient-to-br from-[#09090b] to-[#0f172a] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

             <div className="relative z-10 flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-white flex items-center gap-3">
                 <Award className="text-amber-400" size={28}/> Trophy Case
               </h3>
               <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                 {badges.length} / 50 Unlocked
               </span>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {badges.map((badge, i) => (
                 <motion.div 
                   key={i}
                   whileHover={{ scale: 1.05, y: -5 }}
                   className="group relative flex flex-col items-center p-6 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 rounded-3xl transition-all duration-300 cursor-pointer"
                 >
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                    <div className="relative w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
                       <Award size={32} />
                    </div>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white text-center leading-tight">
                      {badge.name}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">{badge.date || 'Earned 2024'}</span>
                 </motion.div>
               ))}
               
               {/* Empty Slots Filler */}
               {[...Array(Math.max(0, 8 - badges.length))].map((_, i) => (
                 <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-6 border border-white/5 border-dashed rounded-3xl opacity-30">
                    <div className="w-12 h-12 rounded-full bg-white/5 mb-2"></div>
                    <div className="w-16 h-2 rounded bg-white/5"></div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;