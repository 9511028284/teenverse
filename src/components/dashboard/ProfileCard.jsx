import React, { forwardRef } from 'react';
import { Share2, Download, CheckCircle, Star, Rocket, Hexagon } from 'lucide-react';
import Button from '../ui/Button';

const ProfileCard = forwardRef(({ user, unlockedSkills, badges, userLevel, applications, handleDownloadCard, handleShareToInstagram }, ref) => {
  
  const isVerified = badges.some(b => ['Verified Teen', 'Verified'].includes(b.name));
  const completedJobs = applications?.filter(a => a.status === 'Paid').length || 0;
  
  return (
    <div className="flex flex-col items-center animate-fade-in py-10">
      
      {/* --- THE COLLECTIBLE CARD --- */}
      <div 
        ref={ref} 
        className="relative w-[380px] aspect-[4/5] rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] select-none bg-black group"
      >
        {/* HOLOGRAPHIC LAYERS */}
        {/* 1. Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a]"></div>
        
        {/* 2. Noise Texture */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        {/* 3. Animated Blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-pink-500 rounded-full blur-[80px] opacity-40 mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute top-[40%] -right-20 w-64 h-64 bg-cyan-500 rounded-full blur-[80px] opacity-40 mix-blend-screen"></div>
        
        {/* 4. CONTENT FRAME */}
        <div className="absolute inset-3 border border-white/20 rounded-[32px] backdrop-blur-sm flex flex-col items-center p-6 text-center z-10">
           
           {/* Top Badge */}
           <div className="w-full flex justify-between items-start mb-4 opacity-80">
               <Hexagon size={24} className="text-white fill-white/10"/>
               <div className="text-[8px] font-bold text-white uppercase tracking-[0.3em] rotate-90 origin-top-right translate-x-4">
                  TEENVERSE // GENESIS
               </div>
           </div>

           {/* Avatar */}
           <div className="relative mb-6">
              <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-400 to-pink-500 rounded-full blur opacity-75"></div>
              <div className="relative w-28 h-28 rounded-full border-4 border-black bg-gray-900 overflow-hidden">
                  {user.name ? (
                     <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white bg-gradient-to-b from-gray-700 to-gray-900">{user.name[0]}</div>
                  ) : <div className="w-full h-full bg-gray-800"/>}
              </div>
              {isVerified && (
                 <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-4 border-black shadow-lg">
                    <CheckCircle size={16} strokeWidth={3} />
                 </div>
              )}
           </div>

           {/* User Info */}
           <h2 className="text-3xl font-black text-white tracking-tighter mb-1 drop-shadow-lg">
             {user.name || "Guest"}
           </h2>
           <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-indigo-200 font-bold text-xs uppercase tracking-widest mb-8">
               {user.specialty || "Full Stack Creator"}
           </p>

           {/* Stats Row */}
           <div className="grid grid-cols-3 divide-x divide-white/10 w-full bg-white/5 rounded-2xl border border-white/10 p-4 backdrop-blur-md mb-6">
              <div>
                 <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">LVL</div>
                 <div className="text-xl font-black text-yellow-400">{userLevel}</div>
              </div>
              <div>
                 <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">Gigs</div>
                 <div className="text-xl font-black text-emerald-400">{completedJobs}</div>
              </div>
              <div>
                 <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">Rank</div>
                 <div className="text-xl font-black text-pink-400 flex items-center justify-center gap-1">
                    4.9 <Star size={10} className="fill-pink-400"/>
                 </div>
              </div>
           </div>

           {/* Skills Footer */}
           <div className="mt-auto w-full">
              <div className="flex flex-wrap justify-center gap-2">
                 {unlockedSkills.slice(0, 4).map((skill, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-white/10 border border-white/5 text-[8px] font-bold text-indigo-200 uppercase tracking-wide">
                       {skill}
                    </span>
                 ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 w-full flex justify-between items-center opacity-60">
                  <div className="flex items-center gap-1 text-[8px] text-white font-mono">
                      <Rocket size={10} /> POWERED BY TEENVERSE
                  </div>
                  <div className="flex gap-1">
                      {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-white rounded-full"></div>)}
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* --- ACTIONS --- */}
      <div className="mt-8 flex gap-4 w-full max-w-[380px]">
         <Button 
            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 border-none shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:scale-105" 
            icon={Share2} 
            onClick={handleShareToInstagram}
         >
            Story Mode
         </Button>
         
         <Button 
            className="flex-1 bg-white/10 border-white/10 text-white hover:bg-white/20" 
            variant="outline" 
            icon={Download} 
            onClick={handleDownloadCard}
         >
            Save Asset
         </Button>
      </div>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;