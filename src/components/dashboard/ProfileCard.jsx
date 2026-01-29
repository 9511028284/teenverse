import React, { forwardRef } from 'react';
import { Share2, Download, CheckCircle, Star, Rocket, Hexagon, Crown, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const ProfileCard = forwardRef(({ user, unlockedSkills, badges, userLevel, applications, handleDownloadCard, handleShareToInstagram }, ref) => {
  
  const isVerified = badges.some(b => ['Verified Teen', 'Verified'].includes(b.name));
  const completedJobs = applications?.filter(a => a.status === 'Paid').length || 0;
  
  return (
    <div className="flex flex-col items-center animate-fade-in py-10">
      
      {/* --- THE LUXURY COLLECTIBLE CARD --- */}
      <div 
        ref={ref} 
        className="relative w-[380px] aspect-[4/5] rounded-[48px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] select-none bg-[#020202] group"
      >
        {/* --- 1. PREMIUM BACKGROUND LAYERS --- */}
        
        {/* Real Abstract Texture Image (Blended) */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" 
                alt="Luxury Texture"
                className="w-full h-full object-cover opacity-40 mix-blend-color-dodge grayscale-[20%]"
            />
        </div>

        {/* Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0"></div>
        
        {/* Animated Noise Grain */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
        
        {/* --- 2. ORNAMENTAL BORDERS (The "Lavish" Touch) --- */}
        <div className="absolute inset-4 border border-white/10 rounded-[40px] pointer-events-none z-10"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-amber-500/50 rounded-tr-[32px] pointer-events-none z-10"></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-amber-500/50 rounded-bl-[32px] pointer-events-none z-10"></div>

        {/* --- 3. CONTENT CONTENT --- */}
        <div className="relative z-20 h-full flex flex-col items-center p-8 text-center justify-between">
           
           {/* Top Badge: Elite Status */}
           <div className="w-full flex justify-between items-center opacity-90">
               <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
                  <Hexagon size={14} className="text-amber-400 fill-amber-400"/>
                  <span className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">GENESIS</span>
               </div>
               <Sparkles size={18} className="text-amber-200 animate-pulse"/>
           </div>

           

           {/* User Identity */}
           <div className="space-y-3">
               <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg font-sans">
                 {user.name || "Anonymous"}
               </h2>
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-white/10 backdrop-blur-md">
                   <Crown size={12} className="text-amber-400" />
                   <span className="text-[10px] font-bold text-amber-100 uppercase tracking-[0.2em]">{user.specialty || "Creator"}</span>
               </div>
           </div>

           {/* Glass Stat Block */}
           <div className="w-full grid grid-cols-3 gap-px bg-gradient-to-r from-transparent via-white/10 to-transparent p-px rounded-2xl">
              <div className="bg-black/40 backdrop-blur-md rounded-l-2xl p-3 flex flex-col items-center">
                 <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">LVL</span>
                 <span className="text-xl font-black text-white">{userLevel}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md p-3 flex flex-col items-center border-x border-white/5">
                 <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">Jobs</span>
                 <span className="text-xl font-black text-white">{completedJobs}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md rounded-r-2xl p-3 flex flex-col items-center">
                 <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">Rank</span>
                 <div className="flex items-center gap-1 text-xl font-black text-white">
                    4.9 <Star size={10} className="fill-amber-400 text-amber-400"/>
                 </div>
              </div>
           </div>

           {/* Footer Skills */}
           <div className="w-full">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                 {unlockedSkills.slice(0, 3).map((skill, i) => (
                    <span key={i} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-300 uppercase tracking-widest shadow-sm">
                       {skill}
                    </span>
                 ))}
              </div>
              
              <div className="flex justify-between items-end border-t border-white/10 pt-4 opacity-60">
                  <div className="flex items-center gap-2">
                      <Rocket size={12} className="text-white"/>
                      <span className="text-[8px] text-white font-mono uppercase tracking-[0.2em]">TEENVERSEHUB ID</span>
                  </div>
                  <div className="text-[8px] text-gray-400 font-mono">
                      {new Date().getFullYear()} EDITION
                  </div>
              </div>
           </div>

        </div>
      </div>

      {/* --- PREMIUM ACTIONS --- */}
      <div className="mt-10 flex gap-4 w-full max-w-[380px]">
         <Button 
            className="flex-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 border-none shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)] hover:scale-105 transition-all text-xs uppercase tracking-widest font-bold" 
            icon={Share2} 
            onClick={handleShareToInstagram}
         >
            Story Mode
         </Button>
         
         <Button 
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-md text-xs uppercase tracking-widest font-bold" 
            variant="outline" 
            icon={Download} 
            onClick={handleDownloadCard}
         >
            Save HD
         </Button>
      </div>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;