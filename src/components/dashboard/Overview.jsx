import React from 'react';
import { Award, TrendingUp, Briefcase, ArrowRight, Sparkles, Wallet, Zap, Share2, Search, Plus } from 'lucide-react';
import Button from '../ui/Button';

const Overview = ({ user, isClient, totalEarnings, jobsCount, applicationsCount, badgesCount, setTab }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      
      {/* GLOBAL NOISE OVERLAY (Optional but recommended for the vibe) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* --- HERO SECTION: The "Holographic" Command Center --- */}
      <div className="relative overflow-hidden rounded-[40px] bg-[#0f172a] border border-white/10 shadow-2xl group min-h-[320px] flex flex-col justify-center">
         
         {/* Dynamic Gradient Blobs */}
         <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/40 rounded-full blur-[100px] group-hover:bg-purple-500/50 transition-all duration-1000 animate-pulse-slow"></div>
         <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/40 rounded-full blur-[100px] group-hover:bg-indigo-500/50 transition-all duration-1000"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

         <div className="relative z-10 px-10 py-8 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                 <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300 tracking-widest uppercase">System Online</span>
               </div>
               
               <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
                  {greeting}, <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                    {user.name?.split(' ')[0] || 'Creator'}
                  </span>.
               </h1>
               
               <p className="text-indigo-200/80 text-lg font-medium leading-relaxed">
                  {isClient 
                    ? "Your projects are accelerating. The talent pool is active."
                    : "The market is hot. Your next big opportunity is waiting."}
               </p>
            </div>

            {/* Floating Action Glass */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-3 w-full md:w-auto min-w-[240px] transform md:rotate-2 hover:rotate-0 transition-all duration-500">
               <Button 
                  className="w-full bg-white text-black hover:bg-indigo-50 h-14 text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  onClick={() => setTab('jobs')}
                  icon={isClient ? Plus : Search}
               >
                  {isClient ? 'Post New Job' : 'Find Work'}
               </Button>
               <button 
                  onClick={() => setTab('profile-card')}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
               >
                  <Share2 size={18}/> Share Profile
               </button>
            </div>
         </div>
      </div>

      {/* --- BENTO GRID STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
         
         {/* CARD 1: EARNINGS (Gradient Mesh) */}
         <div className="col-span-1 md:col-span-3 lg:col-span-4 relative overflow-hidden rounded-[32px] bg-[#1e1b4b] border border-indigo-500/20 p-8 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                   <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-300 border border-indigo-500/30">
                      <Wallet size={28} />
                   </div>
                   <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                      <TrendingUp size={12}/> +12.5%
                   </div>
                </div>
                <p className="text-indigo-300/60 font-mono text-xs uppercase tracking-widest mb-1">{isClient ? 'Total Spent' : 'Lifetime Earnings'}</p>
                <h3 className="text-5xl font-black text-white tracking-tighter">
                   ₹{(totalEarnings/1000).toFixed(1)}k
                </h3>
            </div>
         </div>

         {/* CARD 2: ACTIVE STATUS (Dark Tech) */}
         <div className="col-span-1 md:col-span-3 lg:col-span-4 relative overflow-hidden rounded-[32px] bg-[#0f172a] border border-white/10 p-8 group hover:border-blue-500/50 transition-colors duration-300">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
            <div className="flex justify-between items-start mb-12">
               <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                  <Briefcase size={28}/>
               </div>
               <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div>
               <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-1">{isClient ? 'Active Jobs' : 'Applications'}</p>
               <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black text-white tracking-tighter">{isClient ? jobsCount : applicationsCount}</h3>
                  <span className="text-sm text-gray-500 font-medium">pending</span>
               </div>
            </div>
         </div>

         {/* CARD 3: BADGES (Vertical Call to Action) */}
         <div className="col-span-1 md:col-span-6 lg:col-span-4 relative overflow-hidden rounded-[32px] bg-gradient-to-br from-fuchsia-600 to-purple-800 p-8 text-white shadow-xl flex flex-col justify-between group">
             {/* Spinning Star Decoration */}
             <div className="absolute -top-10 -right-10 opacity-20 animate-spin-slow">
                 <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
             </div>
             
             <div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                    <Award size={24} className="text-white"/>
                </div>
                <h3 className="text-3xl font-bold mb-2">Level Up</h3>
                <p className="text-fuchsia-100/80 text-sm leading-relaxed mb-6">You have {badgesCount} badges. Complete 2 more quests to reach "Elite" status.</p>
             </div>
             
             <button onClick={() => setTab('academy')} className="w-full py-4 bg-white text-fuchsia-900 font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                Go to Academy <ArrowRight size={16}/>
             </button>
         </div>

      </div>
    </div>
  );
};
export default Overview;