import React from 'react';
import { 
  MapPin, Calendar, Link as LinkIcon, Github, Instagram, Linkedin, 
  Code, Award, Zap, Edit3, MessageCircle, Share2 
} from 'lucide-react';

const UserProfile = ({ user, badges, userLevel, unlockedSkills, isClient }) => {
  
  // Mock Data if not in DB yet
  const stats = [
    { label: "Projects", value: "12", icon: "🚀" },
    { label: "Rating", value: "4.9", icon: "⭐" },
    { label: "Years", value: "1.5", icon: "⏳" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-fade-in-up">
      
      {/* 1. COVER & HEADER */}
      <div className="relative mb-24">
        {/* Cover Image */}
        <div className="h-48 md:h-64 w-full rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden shadow-2xl">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
           <button className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-xl backdrop-blur-md transition-all">
             <Edit3 size={18}/>
           </button>
        </div>

        {/* Profile Pic & Info Overlay */}
        <div className="absolute -bottom-16 left-6 md:left-12 flex items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-gray-900 p-1.5 ring-4 ring-white dark:ring-[#0F172A] shadow-2xl rotate-3 transition-transform group-hover:rotate-0 duration-500">
               <div className="w-full h-full rounded-[1.8rem] bg-gradient-to-br from-gray-800 to-black overflow-hidden flex items-center justify-center text-4xl font-bold text-white">
                 {user.name?.[0]}
               </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-[#0F172A]">
               LVL {userLevel}
            </div>
          </div>
          
          <div className="mb-2 hidden md:block">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
              {user.name} 
              {badges.some(b => b.name === 'Verified') && <span className="text-blue-500 text-xl">✓</span>}
            </h1>
            <p className="text-gray-500 dark:text-gray-300 font-medium flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 font-bold">
                @{user.name?.split(' ')[0].toLowerCase()}
              </span> • <MapPin size={14}/> {user.nationality || 'Remote'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute -bottom-12 right-6 flex gap-3">
           <button className="bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white px-5 py-2.5 rounded-xl font-bold shadow-lg border border-gray-100 dark:border-white/5 flex items-center gap-2 transition-all">
             <Share2 size={18}/> Share
           </button>
           <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all">
             <Edit3 size={18}/> Edit Profile
           </button>
        </div>
      </div>

      {/* Mobile Title Fix */}
      <div className="md:hidden px-4 mb-8 text-center">
         <h1 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h1>
         <p className="text-gray-500 dark:text-gray-400 text-sm">@{user.name?.split(' ')[0].toLowerCase()}</p>
      </div>

      {/* 2. BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 px-4 md:px-0">
        
        {/* LEFT COLUMN (Span 4) */}
        <div className="col-span-12 md:col-span-4 space-y-6">
           {/* Bio Card */}
           <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500" size={18}/> The Vibe
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {user.bio || "Building the future, one pixel at a time. 🚀 Full-stack wizard in training."}
              </p>
              
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex gap-4 justify-center">
                 <a href="#" className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"><Github size={20}/></a>
                 <a href="#" className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-pink-500 hover:text-pink-600 transition-colors"><Instagram size={20}/></a>
                 <a href="#" className="p-2 bg-gray-50 dark:bg-white/5 rounded-full text-blue-500 hover:text-blue-600 transition-colors"><Linkedin size={20}/></a>
              </div>
           </div>

           {/* Skills Stack */}
           <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-40"></div>
              <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
                <Code size={18}/> Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2 relative z-10">
                {unlockedSkills && unlockedSkills.length > 0 ? unlockedSkills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs font-bold hover:bg-white/20 transition-colors cursor-default">
                    {skill}
                  </span>
                )) : <span className="text-gray-400 text-sm italic">No skills verified yet.</span>}
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN (Span 8) */}
        <div className="col-span-12 md:col-span-8 space-y-6">
           
           {/* Stats Row */}
           <div className="grid grid-cols-3 gap-4">
             {stats.map((stat, i) => (
               <div key={i} className="bg-white dark:bg-[#1E293B] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow text-center">
                 <div className="text-2xl mb-1">{stat.icon}</div>
                 <div className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
               </div>
             ))}
           </div>

           {/* Badges Showcase */}
           <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl">
             <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="text-orange-500" size={18}/> Achievements
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {badges.map((badge, i) => (
                 <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-10 h-10 mb-2 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                      <Award size={20}/>
                    </div>
                    <span className="text-xs font-bold text-center dark:text-white">{badge.name}</span>
                 </div>
               ))}
               {badges.length === 0 && <p className="text-sm text-gray-400 col-span-4 text-center py-4">Start completing jobs to earn badges!</p>}
             </div>
           </div>

           {/* Activity Feed / Placeholder */}
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><Calendar size={18}/> Recent Activity</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">This Week</span>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">🚀</div>
                    <div>
                      <p className="font-bold text-sm">Level Up!</p>
                      <p className="text-xs text-indigo-100">Reached Level {userLevel} Developer</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">🎓</div>
                    <div>
                      <p className="font-bold text-sm">Academy Ace</p>
                      <p className="text-xs text-indigo-100">Completed 3 Quizzes</p>
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;