import React from 'react';
import { Award, TrendingUp, Activity, ArrowRight, Sparkles, Briefcase, Wallet, Users, Zap } from 'lucide-react';
import Button from '../ui/Button';

const Overview = ({ user, isClient, totalEarnings, jobsCount, applicationsCount, badgesCount, setTab }) => {
  
  // Helper to determine greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* --- HERO SECTION (The "Command Center") --- */}
      <div className="relative overflow-hidden rounded-[32px] bg-gray-900 text-white shadow-2xl group">
         {/* Animated Background Mesh */}
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-50 group-hover:opacity-70 transition-opacity duration-1000"></div>
         <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600 rounded-full blur-[128px] opacity-50 group-hover:opacity-70 transition-opacity duration-1000"></div>
         
         <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wider uppercase mb-4 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  System Online
               </div>
               <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                  {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">{user.name?.split(' ')[0]}</span>
               </h1>
               <p className="text-gray-400 max-w-lg text-lg">
                  {isClient 
                    ? "Your projects are moving fast. Review proposals and keep the momentum going." 
                    : "You're on a roll! Check your latest stats and pick up a new gig today."}
               </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               <Button 
                  className="bg-white text-gray-900 hover:bg-indigo-50 border-none shadow-xl shadow-indigo-900/20 h-12 px-6 text-base" 
                  onClick={() => setTab('jobs')}
                  icon={isClient ? Plus : Search}
               >
                  {isClient ? 'Post New Job' : 'Find Work'}
               </Button>
               <button onClick={() => setTab('profile-card')} className="h-12 px-6 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-bold flex items-center justify-center gap-2 backdrop-blur-md">
                  <Share2 size={18}/> Share Profile
               </button>
            </div>
         </div>
      </div>

      {/* --- BENTO GRID STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
         
         {/* CARD 1: EARNINGS (Large - Spans 2 cols) */}
         <div className="col-span-1 md:col-span-3 lg:col-span-2 bg-white dark:bg-[#1E293B] p-6 rounded-[24px] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-8">
               <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Wallet size={24}/>
               </div>
               <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                  <TrendingUp size={12}/> +12.5%
               </div>
            </div>
            <div>
               <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">{isClient ? 'Total Spent' : 'Total Earnings'}</p>
               <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">₹{totalEarnings.toLocaleString()}</h3>
               <p className="text-xs text-gray-400 mt-2">Last updated just now</p>
            </div>
         </div>

         {/* CARD 2: ACTIVE STATUS (Medium - Spans 2 cols) */}
         <div className="col-span-1 md:col-span-3 lg:col-span-2 bg-white dark:bg-[#1E293B] p-6 rounded-[24px] border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-blue-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-8">
               <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Briefcase size={24}/>
               </div>
               <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                  Active
               </div>
            </div>
            <div>
               <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">{isClient ? 'Active Jobs' : 'Applications Sent'}</p>
               <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{isClient ? jobsCount : applicationsCount}</h3>
               <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full w-[70%]"></div>
               </div>
            </div>
         </div>

         {/* CARD 3: BADGES (Vertical - Spans 1 col but tall on desktop) */}
         <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[24px] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/20 blur-[60px] rounded-full group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
               <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white">
                     <Award size={24}/>
                  </div>
                  <Award size={64} className="text-white/10 absolute top-4 right-4 rotate-12"/>
               </div>
               <div className="mt-8">
                  <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-1">Reputation</p>
                  <h3 className="text-4xl font-black tracking-tight mb-1">{badgesCount} Badges</h3>
                  <p className="text-indigo-100 text-xs opacity-80">You are in the top 5%!</p>
               </div>
               <button onClick={() => setTab('academy')} className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  View All <ArrowRight size={14}/>
               </button>
            </div>
         </div>
         
         {/* CARD 4: QUICK INSIGHT (Wide - Spans Full Width) */}
         <div className="col-span-1 md:col-span-3 lg:col-span-6 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 p-4 rounded-[24px] flex items-center gap-4 overflow-hidden relative">
             <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700">
                <Sparkles className="text-yellow-500" size={20}/>
             </div>
             <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Pro Tip:</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                   {isClient 
                     ? "Posting detailed job descriptions increases proposal quality by 40%. Try using our AI tool!" 
                     : "Freelancers with a verified badge get 3x more clicks. Upgrade to Pro today."}
                </p>
             </div>
             <button onClick={() => setTab(isClient ? 'jobs' : 'pricing')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap pr-4">
                Check it out
             </button>
         </div>

      </div>
    </div>
  );
};

// Helper Icons needed just for this component
const Plus = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const Search = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
import { Share2 } from 'lucide-react'; // Ensure Share2 is imported or passed via props. 
// NOTE: I added Share2 import at the top of this file to be safe.

export default Overview;