import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Briefcase, Award, ArrowRight, 
  Gift, Copy, Users, Zap, 
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
      "relative group overflow-hidden rounded-3xl transition-all duration-300",
      // LIGHT MODE: White bg, subtle gray border, soft shadow
      "bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200",
      // DARK MODE: Dark glass, white opacity border, glow shadow
      "dark:bg-gray-900/40 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-2xl dark:hover:border-indigo-500/30 dark:hover:shadow-indigo-500/10",
      onClick ? "cursor-pointer" : "",
      className
    )}
  >
    {/* Hover Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const TickerItem = ({ label, value, trend }) => (
  <div className={cn(
    "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
    // LIGHT MODE
    "bg-white border-gray-200 text-gray-600 shadow-sm",
    // DARK MODE
    "dark:bg-white/5 dark:border-white/5 dark:text-gray-400 dark:shadow-none"
  )}>
    <span>{label}</span>
    <span className="text-gray-900 dark:text-white font-bold">{value}</span>
    <span className={cn("text-[10px]", trend === 'up' ? "text-green-500 dark:text-green-400" : "text-indigo-500 dark:text-indigo-400")}>
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
      // LIGHT: Soft colorful bg, DARK: Neon gradient
      colorClass: "bg-emerald-100 text-emerald-700 dark:bg-gradient-to-br dark:from-emerald-400 dark:to-teal-500 dark:text-white",
      action: null
    },
    {
      title: isClient ? "Jobs Posted" : "Active Missions",
      value: jobsCount,
      subtitle: isClient ? "Finding talent" : "Applications sent",
      icon: Briefcase,
      colorClass: "bg-blue-100 text-blue-700 dark:bg-gradient-to-br dark:from-blue-400 dark:to-indigo-500 dark:text-white",
      action: () => setTab(isClient ? 'posted-jobs' : 'applications')
    },
    !isClient && {
      title: "Reputation",
      value: badgesCount,
      subtitle: "Badges unlocked",
      icon: Award,
      colorClass: "bg-amber-100 text-amber-700 dark:bg-gradient-to-br dark:from-amber-400 dark:to-orange-500 dark:text-white",
      action: () => setTab('profile-card')
    },
    {
      title: "Network Effect",
      value: referralCount || 0,
      subtitle: `Earned ₹${referralEarnings || 0}`,
      icon: Users,
      colorClass: "bg-purple-100 text-purple-700 dark:bg-gradient-to-br dark:from-purple-400 dark:to-pink-500 dark:text-white",
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
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400">
                  Workspace
                </span>
                <span className="text-gray-500 dark:text-gray-500 text-xs font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
             </motion.div>
             
             <motion.h1 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight"
             >
               {greeting}, <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-x">
                 {user.name?.split(' ')[0]}
               </span>
             </motion.h1>
          </div>

          {!isClient && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="p-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl dark:shadow-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl px-5 py-3 flex items-center gap-3">
                 <div className="relative">
                   <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse"></div>
                   <Zap size={24} className="text-yellow-500 dark:text-yellow-400 relative z-10 fill-yellow-500 dark:fill-yellow-400" />
                 </div>
                 <div>
                   <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">{user.energy_points || 0}</div>
                   <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Energy Points</div>
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
              <div className={cn("p-3 rounded-2xl shadow-sm", stat.colorClass)}>
                <stat.icon size={20} />
              </div>
              {stat.action && <ArrowRight size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all"/>}
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">{stat.subtitle}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 3. FEATURED: REFERRAL "NEON TICKET" */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={cn(
          "relative mt-4 rounded-[2rem] overflow-hidden border",
          // LIGHT MODE: Soft gradient background
          "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-100",
          // DARK MODE: Deep dark bg
          "dark:bg-gray-900 dark:border-white/10"
        )}
      >
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/5 via-purple-900/5 to-pink-900/5 dark:from-indigo-900/50 dark:via-purple-900/50 dark:to-pink-900/50 opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-2 mb-4">
               <span className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20 border px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                 <Gift size={12} /> Double Rewards
               </span>
             </div>
             <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
               Invite Friends, <br/>Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-300 dark:to-amber-500">Infinite Energy ⚡</span>
             </h3>
             <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
               Share your unique code. When a friend joins, you BOTH get <span className="text-gray-900 dark:text-white font-bold">+50 Energy</span>. It's a win-win for the squad.
             </p>
          </div>

          <div className="w-full md:w-auto">
            <div className={cn(
              "p-2 rounded-3xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl",
              // LIGHT: White glass
              "bg-white/60 backdrop-blur-xl border border-white",
              // DARK: Dark glass
              "dark:bg-black/40 dark:backdrop-blur-xl dark:border-white/10"
            )}>
              <div className="px-6 py-4 text-center sm:text-left">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Your Access Code</p>
                <p className="text-3xl font-mono font-black text-gray-900 dark:text-white tracking-widest">
                  {user.referral_code || "GEN-Z-CODE"}
                </p>
              </div>
              <button 
                onClick={copyReferral}
                className={cn(
                  "w-full sm:w-auto h-16 px-8 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl",
                  // LIGHT BUTTON: Dark with white text
                  "bg-gray-900 text-white hover:bg-black shadow-gray-200",
                  // DARK BUTTON: White with black text
                  "dark:bg-white dark:text-black dark:hover:bg-indigo-50 dark:shadow-white/10"
                )}
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