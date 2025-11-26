import React, { forwardRef } from 'react';
import { Rocket, User, Share2, Download, CheckCircle, Star, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

const ProfileCard = forwardRef(({ user, unlockedSkills, badges, userLevel, applications, handleDownloadCard, showToast }, ref) => {
  return (
    <div className="flex flex-col items-center animate-fade-in py-10">
      {/* This DIV is what gets downloaded. 
          We separate the buttons so they don't appear in the image.
      */}
      <div 
        ref={ref} 
        className="relative w-[400px] h-auto rounded-[40px] overflow-hidden shadow-2xl group select-none bg-[#0F172A]"
      >
        {/* --- BACKGROUND LAYERS (Holographic Effect) --- */}
        <div className="absolute inset-0 z-0">
           {/* Noise Texture for "Grainy" look */}
           <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
           
           {/* Animated Conic Gradient */}
           <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,#0F172A_0%,#4F46E5_50%,#C026D3_100%)] animate-spin-slow opacity-40 blur-3xl"></div>
           
           {/* Glow Orbs */}
           <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500 rounded-full blur-[80px] opacity-50 mix-blend-screen"></div>
           <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-600 rounded-full blur-[80px] opacity-50 mix-blend-screen"></div>
        </div>
        
        {/* --- CONTENT LAYER --- */}
        <div className="relative z-10 p-8 bg-white/5 backdrop-blur-xl border border-white/10 h-full flex flex-col items-center text-center">
           
           {/* AVATAR SECTION */}
           <div className="relative mb-4 group-hover:scale-105 transition-transform duration-500">
              {/* Glowing Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              
              {/* Image Container */}
              <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500">
                 <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center overflow-hidden border-4 border-[#0F172A]">
                    {user.name ? (
                        <span className="text-5xl font-black text-white">{user.name[0]}</span>
                    ) : (
                        <User size={40} className="text-gray-400"/>
                    )}
                 </div>
              </div>

              {/* Verified Badge */}
              {badges.includes('Verified') && (
                 <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-[#0F172A] shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                    <CheckCircle size={14} strokeWidth={4} />
                 </div>
              )}
           </div>

           {/* USER INFO */}
           <h2 className="text-3xl font-black text-white tracking-tight mb-1 drop-shadow-md">{user.name || "Guest User"}</h2>
           <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300 font-bold text-xs uppercase tracking-[0.2em] mb-8">
               {user.specialty || "Future Legend"}
           </p>

           {/* STATS GRID */}
           <div className="grid grid-cols-3 gap-3 w-full mb-8">
              {/* Level */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md hover:bg-white/10 transition-colors">
                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Level</div>
                 <div className="text-2xl font-black text-yellow-400 drop-shadow-sm">{userLevel}</div>
              </div>
              {/* Jobs */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md hover:bg-white/10 transition-colors">
                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Jobs</div>
                 <div className="text-2xl font-black text-emerald-400 drop-shadow-sm">
                    {applications ? applications.filter(a => a.status === 'Paid').length : 0}
                 </div>
              </div>
              {/* Rating */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md hover:bg-white/10 transition-colors">
                 <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">Rating</div>
                 <div className="text-2xl font-black text-pink-400 flex justify-center items-center gap-1 drop-shadow-sm">
                    4.9 <Star size={14} className="fill-pink-400 text-pink-400"/>
                 </div>
              </div>
           </div>

           {/* SKILLS (Neon Pills) */}
           <div className="flex flex-wrap justify-center gap-2 mb-8 content-start min-h-[30px]">
              {unlockedSkills.length === 0 && <span className="text-xs text-gray-500 italic">No skills unlocked yet</span>}
              {unlockedSkills.slice(0, 6).map((skill, i) => (
                 <span key={i} className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-400/30 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all cursor-default">
                    {skill}
                 </span>
              ))}
           </div>

           {/* FOOTER BRANDING */}
           <div className="w-full pt-5 border-t border-white/10 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2 text-white">
                 <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/40">
                    <Rocket size={14} className="text-white"/>
                 </div>
                 <span className="font-bold text-sm tracking-wide font-mono">teenversehub.in</span>
              </div>
              {/* QR Code Placeholder for "Tech Feel" */}
              <div className="flex gap-1 opacity-50">
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75"></div>
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-150"></div>
              </div>
           </div>
        </div>
      </div>

      {/* ACTION BUTTONS (Not part of the download) */}
      <div className="mt-8 flex gap-4 w-full max-w-[400px]">
         <Button className="flex-1 bg-white text-gray-900 hover:bg-gray-200 border-none shadow-xl hover:shadow-2xl transition-all" icon={Share2} onClick={() => showToast("Link copied!")}>Share</Button>
         <Button className="flex-1 bg-gray-800 text-white border-gray-700 hover:bg-gray-700 hover:border-gray-600 shadow-lg" variant="outline" icon={Download} onClick={handleDownloadCard}>Download</Button>
      </div>

      {/* Animation Style */}
      <style jsx>{`
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

// Necessary for debugging in React DevTools
ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;