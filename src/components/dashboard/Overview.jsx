import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Briefcase, Award, TrendingUp, ArrowRight, 
  Gift, Copy, Users, Zap, ShieldCheck, Activity, Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- MICRO-COMPONENTS ---

const GlassCard = ({ children, className, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden rounded-3xl border border-white/10 bg-gray-900/40 backdrop-blur-xl shadow-2xl transition-all duration-300",
      onClick ? "cursor-pointer hover:border-indigo-500/30 hover:shadow-indigo-500/10" : "",
      className
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const TickerItem = ({ label, value, trend }) => (
  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium text-gray-400 whitespace-nowrap">
    <span>{label}</span>
    <span className="text-white font-bold">{value}</span>
    <span className={cn("text-[10px]", trend === 'up' ? "text-green-400" : "text-indigo-400")}>
      {trend === 'up' ? '▲' : '●'}
    </span>
  </div>
);

// --- MAIN COMPONENT ---

const Overview = ({ 
  user, isClient, totalEarnings, showToast, jobsCount, 
  badgesCount, setTab, referralCount, referralEarnings 
}) => {
  
  const [greeting, setGreeting] = useState('Welcome back');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const copyReferral = () => {
    if (user.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      if (showToast) showToast("Code Copied! 🚀");
    }
  };

  const stats = [
    {
      title: isClient ? "Total Investment" : "Total Earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      subtitle: isClient ? "Lifetime Spend" : "+12% this month",
      icon: DollarSign,
      color: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
      action: null
    },
    {
      title: isClient ? "Jobs Posted" : "Active Missions",
      value: jobsCount,
      subtitle: isClient ? "Finding talent" : "Applications sent",
      icon: Briefcase,
      color: "from-blue-400 to-indigo-500",
      shadow: "shadow-blue-500/20",
      action: () => setTab(isClient ? 'posted-jobs' : 'applications')
    },
    !isClient && {
      title: "Reputation",
      value: badgesCount,
      subtitle: "Badges unlocked",
      icon: Award,
      color: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
      action: () => setTab('profile-card')
    },
    {
      title: "Network Effect",
      value: referralCount || 0,
      subtitle: `Earned ₹${referralEarnings || 0}`,
      icon: Users,
      color: "from-purple-400 to-pink-500",
      shadow: "shadow-purple-500/20",
      action: null
    }
  ].filter(Boolean);

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      
      {/* 1. HERO HEADER */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
             <motion.div 
               initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2 mb-2"
             >
                <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  Workspace
                </span>
                <span className="text-gray-500 text-xs font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
             </motion.div>
             
             <motion.h1 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="text-4xl md:text-6xl font-black text-white tracking-tight"
             >
               {greeting}, <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                 {user.name?.split(' ')[0]}
               </span>
             </motion.h1>
          </div>

          {!isClient && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="p-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <div className="bg-gray-900 rounded-xl px-5 py-3 flex items-center gap-3">
                 <div className="relative">
                   <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse"></div>
                   <Zap size={24} className="text-yellow-400 relative z-10 fill-yellow-400" />
                 </div>
                 <div>
                   <div className="text-2xl font-black text-white leading-none">{user.energy_points || 0}</div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Energy Points</div>
                 </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Live Ticker Bar */}
        <div className="mt-8 flex overflow-hidden mask-image-r">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
            className="flex gap-3"
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                 <TickerItem label="Market Vol" value="+24%" trend="up" />
                 <TickerItem label="New Jobs" value="128" trend="up" />
                 <TickerItem label="Avg. Rate" value="₹850/hr" trend="flat" />
                 <TickerItem label="Top Skill" value="React Native" trend="up" />
                 <TickerItem label="Active Users" value="2.4k" trend="up" />
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 2. BENTO GRID STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <GlassCard key={i} delay={i * 0.1} onClick={stat.action} className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white ${stat.shadow} shadow-lg`}>
                <stat.icon size={20} />
              </div>
              {stat.action && <ArrowRight size={18} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"/>}
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</p>
              <p className="text-3xl font-black text-white tracking-tight mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-indigo-300 transition-colors">{stat.subtitle}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 3. FEATURED: REFERRAL "NEON TICKET" */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="relative mt-4 rounded-[2rem] overflow-hidden bg-gray-900 border border-white/10"
      >
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50 opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-2 mb-4">
               <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                 <Gift size={12} /> Double Rewards
               </span>
             </div>
             <h3 className="text-3xl md:text-4xl font-black text-white mb-3">Invite Friends, <br/>Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Infinite Energy ⚡</span></h3>
             <p className="text-gray-400 text-lg leading-relaxed">
               Share your unique code. When a friend joins, you BOTH get <span className="text-white font-bold">+50 Energy</span>. It's a win-win for the squad.
             </p>
          </div>

          <div className="w-full md:w-auto">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-3xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl">
              <div className="px-6 py-4 text-center sm:text-left">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Your Access Code</p>
                <p className="text-3xl font-mono font-black text-white tracking-widest">
                  {user.referral_code || "GEN-Z-CODE"}
                </p>
              </div>
              <button 
                onClick={copyReferral}
                className="w-full sm:w-auto h-16 px-8 rounded-2xl bg-white text-black hover:bg-indigo-50 font-black text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
              >
                <Copy size={20} /> Copy
              </button>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default Overview;