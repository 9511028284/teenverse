import React from 'react';
import { 
  DollarSign, Briefcase, Award, TrendingUp, ArrowRight, 
  Gift, Copy, Users, Zap, ShieldCheck 
} from 'lucide-react';

import showToast from '../ui/Toast';

const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1E293B] shadow-xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer group`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      {onClick && <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors"/>}
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
    <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</p>
    {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
  </div>
);

const Overview = ({ user, isClient, totalEarnings, showToast, jobsCount, badgesCount, setTab, referralCount, referralEarnings }) => {
  
  const copyReferral = () => {
    if (user.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      // Simple alert as fallback if showToast isn't passed to Overview
      showToast("Referral Code Copied to Clipboard! 🚀"); 
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{user.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Here is what's happening in your workspace today.</p>
        </div>
        
        {!isClient && (
           <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800">
              <Zap size={16} className="text-indigo-600 dark:text-indigo-400 fill-current" />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{user.energy_points || 0} Energy</span>
           </div>
        )}
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isClient ? "Total Spent" : "Total Earnings"} 
          value={`₹${totalEarnings.toFixed(0)}`} 
          subtitle={isClient ? "Lifetime Investment" : "+12% from last month"}
          icon={DollarSign} 
          color="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard 
          title={isClient ? "Jobs Posted" : "Active Jobs"} 
          value={jobsCount} 
          subtitle={isClient ? "Find talent" : "View applications"}
          icon={Briefcase} 
          color="bg-gradient-to-br from-blue-400 to-blue-600"
          onClick={() => setTab(isClient ? 'posted-jobs' : 'applications')}
        />
        {!isClient && (
          <StatCard 
            title="Badges Earned" 
            value={badgesCount} 
            subtitle="Level up your profile"
            icon={Award} 
            color="bg-gradient-to-br from-amber-400 to-orange-500"
            onClick={() => setTab('profile-card')}
          />
        )}
        <StatCard 
          title="Network Impact" 
          value={referralCount || 0} 
          subtitle={`Earned ₹${referralEarnings || 0}`}
          icon={Users} 
          color="bg-gradient-to-br from-purple-400 to-pink-500"
        />
      </div>

      {/* REFERRAL PROMO CARD (The New Feature) */}
      <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 p-2 rounded-lg"><Gift size={20} className="text-yellow-300"/></span>
              <span className="font-bold text-indigo-100 tracking-wider text-sm uppercase">Refer & Earn</span>
            </div>
            <h3 className="text-3xl font-black mb-2">Get Free Energy ⚡</h3>
            <p className="text-indigo-100 max-w-md">
              Share your unique code. When a friend joins, you BOTH get <span className="font-bold text-white">+50 Energy</span> to apply for more jobs!
            </p>
          </div>

          {/* The Code Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex items-center gap-3 pl-6 pr-2 min-w-[280px]">
            <div className="flex-1">
              <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Your Code</p>
              <p className="text-2xl font-mono font-black tracking-widest text-white">
                 {user.referral_code || "GEN-CODE"} 
              </p>
            </div>
            <button 
              onClick={copyReferral}
              className="bg-white text-indigo-600 p-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"
              title="Copy Code"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Overview;