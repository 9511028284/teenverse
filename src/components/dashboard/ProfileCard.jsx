import React, { forwardRef } from 'react';
import { Rocket, User, Share2, Download, CheckCircle, Star, Shield, Lock, Instagram } from 'lucide-react';
import Button from '../ui/Button';

const ProfileCard = forwardRef(({ user, unlockedSkills, badges, userLevel, applications, handleDownloadCard, handleShareToInstagram, showToast }, ref) => {
  
  // Logic to determine verification
  const isVerified = badges.some(b => 
    ['Verified Teen', 'Parent Approved', 'KYC Completed', 'Verified'].includes(b.name)
  );

  const completedJobs = applications?.filter(a => a.status === 'Paid').length || 0;
  const rating = completedJobs === 0 ? 'New' : '4.9';

  return (
    <div className="flex flex-col items-center animate-fade-in py-10">
      
      {/* CAPTURE AREA */}
      <div 
        ref={ref} 
        className="relative w-[400px] rounded-[40px] overflow-hidden shadow-2xl group select-none bg-[#0F172A]"
        style={{ aspectRatio: '4/5' }}
      >
        {/* --- BACKGROUND LAYERS --- */}
        <div className="absolute inset-0 z-0">
           {/* Noise Texture */}
           <div className="absolute top-0 left-0 w-full h-full opacity-20 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
           
           {/* Animated Gradient Blob */}
           <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#0F172A_0%,#312e81_50%,#701a75_100%)] animate-spin-slow opacity-50 blur-3xl"></div>
           
           <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/30 rounded-full blur-[80px] mix-blend-screen"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/30 rounded-full blur-[80px] mix-blend-screen"></div>
           
           <div className="absolute bottom-20 right-4 text-white/5 text-6xl font-black rotate-[-15deg] pointer-events-none">
              TVH
           </div>
        </div>
        
        {/* --- CONTENT LAYER --- */}
        <div className="relative z-10 p-8 bg-white/5 backdrop-blur-xl border border-white/10 h-full flex flex-col items-center text-center">
           
           {/* AVATAR SECTION */}
           <div className="relative mb-4 mt-2 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500">
                 <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center overflow-hidden border-4 border-[#0F172A]">
                    {user.name ? (
                        <span className="text-5xl font-black text-white">{user.name[0]}</span>
                    ) : (
                        <User size={40} className="text-gray-400"/>
                    )}
                 </div>
              </div>
              {isVerified && (
                 <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1.5 rounded-full border-4 border-[#0F172A] shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center">
                    <CheckCircle size={14} strokeWidth={4} />
                 </div>
              )}
           </div>

           {/* USER IDENTITY */}
           <h2 className="text-3xl font-black text-white tracking-tight mb-1 drop-shadow-md">
             {user.name || "Guest User"}
           </h2>
           <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
               {user.specialty || "Teen Freelancer"}
           </p>

           {/* STATS GRID */}
           <div className="grid grid-cols-3 gap-3 w-full mb-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
                 <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Level</div>
                 <div className="text-xl font-black text-yellow-400">{userLevel}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
                 <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Jobs</div>
                 <div className="text-xl font-black text-emerald-400">{completedJobs}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
                 <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Rating</div>
                 <div className="text-xl font-black text-pink-400 flex justify-center items-center gap-1">
                    {rating} {rating !== 'New' && <Star size={12} className="fill-pink-400 text-pink-400"/>}
                 </div>
              </div>
           </div>

           {/* SKILLS */}
           <div className="flex flex-wrap justify-center gap-2 mb-auto content-start">
              {unlockedSkills.length === 0 && <span className="text-[10px] text-gray-500 italic">No skills verified yet</span>}
              {unlockedSkills.slice(0, 5).map((skill, i) => (
                 <span key={i} className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-500/10 border border-indigo-400/30 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                    {skill}
                 </span>
              ))}
           </div>

           {/* FOOTER */}
           <div className="w-full pt-4 border-t border-white/10 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2 text-white">
                 <div className="bg-white/10 p-1 rounded-md">
                    <Rocket size={12} className="text-white"/>
                 </div>
                 <div className="flex flex-col items-start leading-none">
                    <span className="font-bold text-xs tracking-wide">teenversehub.in</span>
                    <span className="text-[8px] text-gray-400 font-medium mt-0.5">Escrow Protected</span>
                 </div>
              </div>
              
              <div className="flex gap-1 opacity-50">
                 <div className="w-1 h-1 bg-white rounded-full"></div>
                 <div className="w-1 h-1 bg-white rounded-full"></div>
                 <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
           </div>
        </div>
      </div>

      {/* --- ACTION BUTTONS (Updated) --- */}
      <div className="mt-8 flex gap-4 w-full max-w-[400px]">
         <Button 
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none shadow-xl hover:shadow-2xl transition-all" 
            icon={Share2} 
            onClick={handleShareToInstagram} // <--- Calls the new share function
         >
            Share
         </Button>
         
         <Button 
            className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700 shadow-lg" 
            variant="outline" 
            icon={Download} 
            onClick={handleDownloadCard}     // <--- Calls the new download function
         >
            Download
         </Button>
      </div>

      {/* FIX: Removed 'jsx' attribute to prevent console warnings */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;