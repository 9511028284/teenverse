import React from 'react';
import { 
  MapPin, Link as LinkIcon, Github, Instagram, Linkedin, 
  Code, Award, Zap, Edit3, Share2, Globe, Briefcase, 
  Terminal, ShieldCheck, Heart 
} from 'lucide-react';

const UserProfile = ({ user, badges, userLevel, unlockedSkills, isClient, onEditProfile }) => {
  
  // Parse Social Links safely
  const socials = user?.social_links || { github: '', instagram: '', linkedin: '', website: '' };
  
  // Dynamic Stats based on real data
  const stats = [
    { label: "Level", value: userLevel, icon: <Zap size={20} className="text-yellow-400"/> },
    { label: "Badges", value: badges.length, icon: <Award size={20} className="text-orange-400"/> },
    { label: "Skills", value: unlockedSkills?.length || 0, icon: <Terminal size={20} className="text-pink-400"/> },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-fade-in-up">
      
      {/* --- HERO SECTION --- */}
      <div className="relative mb-20 md:mb-24 group">
        {/* Cover Image */}
        <div className="h-48 md:h-72 w-full rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           {user.cover_image && <img src={user.cover_image} alt="Cover" className="w-full h-full object-cover opacity-80" />}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
           
           <button onClick={onEditProfile} className="absolute top-6 right-6 bg-black/30 hover:bg-black/50 text-white p-3 rounded-2xl backdrop-blur-xl border border-white/10 transition-all hover:scale-105 active:scale-95">
             <Edit3 size={20}/>
           </button>
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 left-6 md:left-12 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] bg-[#0F172A] p-2 ring-4 ring-white dark:ring-[#0F172A] shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
               {user.avatar_url ? (
                 <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-[2rem] object-cover" />
               ) : (
                 <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-gray-800 to-black overflow-hidden flex items-center justify-center text-5xl font-black text-white">
                   {user.name?.[0]}
                 </div>
               )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg border-4 border-white dark:border-[#0F172A] flex items-center gap-1">
               <Zap size={12} className="fill-white"/> LVL {userLevel}
            </div>
          </div>
          
          {/* Text Info */}
          <div className="flex-1 text-center md:text-left mb-2">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white drop-shadow-sm flex items-center justify-center md:justify-start gap-3">
              {user.name} 
              {badges.some(b => b.name === 'Verified') && <ShieldCheck className="text-blue-500 fill-blue-500/20" size={28}/>}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-300 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 font-bold">
                @{user.name?.split(' ')[0].toLowerCase()}
              </span> 
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-sm"><MapPin size={14}/> {user.nationality || 'Remote'}</span>
            </p>
            <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto md:mx-0 italic">
              "{user.tag_line || 'TeenVerse Creator 🚀'}"
            </p>
          </div>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex gap-3 mb-4 mr-12">
             <button className="bg-white/80 dark:bg-[#1E293B]/80 hover:bg-white text-gray-700 dark:text-white px-6 py-3 rounded-2xl font-bold shadow-lg border border-gray-100 dark:border-white/5 backdrop-blur-md flex items-center gap-2 transition-all hover:-translate-y-1">
               <Share2 size={18}/> Share
             </button>
             <button onClick={onEditProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 flex items-center gap-2 transition-all hover:-translate-y-1">
               Edit Profile
             </button>
          </div>
        </div>
      </div>

      {/* --- BENTO GRID CONTENT --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 px-4 md:px-0 mt-24 md:mt-0">
        
        {/* LEFT COLUMN (Details) */}
        <div className="col-span-12 md:col-span-4 space-y-6">
           
           {/* About Card */}
           <div className="bg-white dark:bg-[#1E293B] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Heart className="text-pink-500 fill-pink-500" size={20}/> About Me
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium">
                {user.bio || "No bio yet. Click edit to tell your story! 🚀"}
              </p>
              
              {/* Social Pills */}
              <div className="mt-8 flex flex-wrap gap-3">
                 {socials.github && (
                   <a href={socials.github} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-black hover:text-white transition-all"><Github size={20}/></a>
                 )}
                 {socials.instagram && (
                   <a href={socials.instagram} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-500 hover:text-white transition-all"><Instagram size={20}/></a>
                 )}
                 {socials.linkedin && (
                   <a href={socials.linkedin} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all"><Linkedin size={20}/></a>
                 )}
                 {socials.website && (
                   <a href={socials.website} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-indigo-500 hover:text-white transition-all"><Globe size={20}/></a>
                 )}
                 {!Object.values(socials).some(Boolean) && (
                   <span className="text-xs text-gray-400 italic">No social links added.</span>
                 )}
              </div>
           </div>

           {/* Tech Stack */}
           <div className="bg-[#0F172A] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 relative z-10">
                <Code size={20} className="text-indigo-400"/> Skills
              </h3>
              <div className="flex flex-wrap gap-2 relative z-10">
                {unlockedSkills && unlockedSkills.length > 0 ? unlockedSkills.map(skill => (
                  <span key={skill} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold hover:bg-white/20 hover:scale-105 transition-all cursor-default backdrop-blur-md">
                    {skill}
                  </span>
                )) : <span className="text-gray-400 text-sm italic">Complete Academy quizzes to unlock skills.</span>}
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN (Stats & Activity) */}
        <div className="col-span-12 md:col-span-8 space-y-6">
           
           {/* Stats Row */}
           <div className="grid grid-cols-3 gap-4">
             {stats.map((stat, i) => (
               <div key={i} className="bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                 <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-3 text-2xl">
                   {stat.icon}
                 </div>
                 <div className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</div>
               </div>
             ))}
           </div>

           {/* Badges Showcase */}
           <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-[#1E293B] dark:to-[#0F172A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="text-indigo-500" size={20}/> Earned Badges
               </h3>
               <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-black px-3 py-1 rounded-full">
                 {badges.length} TOTAL
               </span>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {badges.map((badge, i) => (
                 <div key={i} className="group flex flex-col items-center p-4 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 transition-all hover:shadow-lg">
                    <div className="w-14 h-14 mb-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                      <Award size={24}/>
                    </div>
                    <span className="text-xs font-bold text-center dark:text-white leading-tight">{badge.name}</span>
                 </div>
               ))}
               {badges.length === 0 && <p className="text-sm text-gray-400 col-span-4 text-center py-8 italic">Complete jobs and challenges to fill this case!</p>}
             </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;