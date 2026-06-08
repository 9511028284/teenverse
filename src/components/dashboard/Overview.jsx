import React, { useState } from 'react';
import { 
  DollarSign, Briefcase, Award, ArrowRight, 
  Gift, Copy, Users, Zap, ShieldAlert, ShieldCheck, Wallet,
  TrendingUp, CheckCircle2, Sparkles
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
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden rounded-[24px] transition-all duration-300 ease-out",
      // LIGHT MODE: Soft Claymorphic Glass
      "bg-white/90 border border-slate-100 backdrop-blur-md",
      "shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_20px_rgba(99,102,241,0.04)]",
      "hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_16px_36px_rgba(99,102,241,0.1)] hover:border-indigo-200/60",
      // DARK MODE: Ultra-Premium Cosmic Depth + Inner Clay Cushion
      "dark:bg-slate-900/50 dark:border-white/[0.05] dark:backdrop-blur-xl",
      "dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_8px_32px_rgba(0,0,0,0.25)]",
      "dark:hover:border-indigo-500/30 dark:hover:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.15),_0_20px_40px_rgba(99,102,241,0.15)]",
      onClick ? "cursor-pointer active:scale-[0.98]" : "",
      className
    )}
  >
    {/* Ambient illumination on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none dark:from-indigo-500/10" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const TickerItem = ({ label, value, trend }) => (
  <div className={cn(
    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200",
    "bg-slate-50 border-slate-200/80 text-slate-500 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]",
    "dark:bg-slate-800/40 dark:border-white/[0.04] dark:text-slate-400 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
  )}>
    <span>{label}</span>
    <span className="text-slate-900 dark:text-white font-black">{value}</span>
    <span className={cn(
      "text-[10px] font-bold",
      trend === 'up' ? "text-emerald-500 animate-pulse" : "text-indigo-400"
    )}>
      {trend === 'up' ? '▲' : '●'}
    </span>
  </div>
);

const StatIcon = ({ icon: Icon, colorClass }) => (
  <div className={cn(
    "p-3 rounded-2xl flex items-center justify-center transition-all duration-300 text-white",
    "shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_6px_14px_rgba(0,0,0,0.1)]",
    "dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),_0_8px_16px_rgba(0,0,0,0.2)]",
    colorClass
  )}>
    <Icon size={20} strokeWidth={2.5} />
  </div>
);

// --- MAIN COMPONENT ---

const Overview = ({ 
  user, isClient, totalEarnings, showToast, jobsCount, 
  badgesCount, setTab, referralCount, referralEarnings, energy, setModal 
}) => {
  
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  });
  const [copied, setCopied] = useState(false);
  
  const isKycVerified = user?.is_kyc_verified || user?.kyc_status === 'verified';

  const copyReferral = () => {
    if (user.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      if (showToast) showToast("Code Copied! 🚀");
    }
  };

  const stats = [
    {
      title: "Wallet Balance",
      value: `₹${(user?.wallet_balance || 0).toLocaleString()}`,
      subtitle: !isClient ? "Usable for subscriptions only" : "Available for checkout",
      icon: Wallet,
      colorClass: "bg-gradient-to-br from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600",
      action: null
    },
    {
      title: isClient ? "Total Investment" : "Total Earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      subtitle: isClient ? "Lifetime Spend" : "+12% this month",
      icon: DollarSign,
      colorClass: "bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600",
      action: null
    },
    {
      title: isClient ? "Jobs Posted" : "Active Missions",
      value: jobsCount,
      subtitle: isClient ? "Finding talent" : "Applications sent",
      icon: Briefcase,
      colorClass: "bg-gradient-to-br from-sky-400 to-indigo-500 dark:from-sky-500 dark:to-indigo-600",
      action: () => setTab(isClient ? 'posted-jobs' : 'applications')
    },
    !isClient && {
      title: "Reputation",
      value: badgesCount,
      subtitle: "Badges unlocked",
      icon: Award,
      colorClass: "bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600",
      action: () => setTab('profile-card')
    },
    {
      title: "Network Effect",
      value: referralCount || 0,
      subtitle: `Earned ₹${referralEarnings || 0}`,
      icon: Users,
      colorClass: "bg-gradient-to-br from-violet-400 to-purple-500 dark:from-violet-500 dark:to-purple-600",
      action: null
    }
  ].filter(Boolean);

  const getBentoClass = (index, total) => {
    if (total === 5) {
      return [
        "sm:col-span-2 lg:col-span-6",
        "sm:col-span-2 lg:col-span-6",
        "sm:col-span-1 lg:col-span-4",
        "sm:col-span-1 lg:col-span-4",
        "sm:col-span-2 lg:col-span-4"
      ][index];
    }
    return "sm:col-span-1 lg:col-span-3";
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 max-w-7xl mx-auto px-0">

      {/* ── 1. HERO HEADER ── */}
      <div className="relative">
        <div className="flex flex-col gap-4">

          {/* Top row: badge + date */}
          <motion.div 
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border bg-indigo-50/50 border-indigo-200/60 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] dark:shadow-none">
              Workspace
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono font-bold">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </motion.div>

          {/* Greeting + Badges row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]"
              >
                {greeting},{' '}
                <br className="hidden xs:block sm:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400">
                  {user.name?.split(' ')[0]} ✦
                </span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                className="mt-2 text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium"
              >
                Here's what's happening in your world today.
              </motion.p>
            </div>

            {/* KYC + Energy badges */}
            {!isClient && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="flex flex-row gap-2.5 flex-wrap"
              >
                {/* KYC badge */}
                <div
                  onClick={() => !isKycVerified && setModal?.('kyc_verification')}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all select-none duration-200",
                    "shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_12px_rgba(0,0,0,0.02)]",
                    "dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_8px_20px_rgba(0,0,0,0.2)]",
                    isKycVerified
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/20 dark:text-emerald-400 cursor-default"
                      : "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/40 dark:border-amber-500/20 dark:text-amber-400 cursor-pointer hover:scale-[1.02] active:scale-95"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    {!isKycVerified && <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 animate-pulse rounded-full" />}
                    {isKycVerified
                      ? <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 relative z-10" />
                      : <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 relative z-10" />
                    }
                  </div>
                  <div className="leading-none">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {isKycVerified ? "Verified" : "Action Required"}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      {isKycVerified ? "Identity Secured" : "Complete KYC"}
                    </div>
                  </div>
                </div>

                {/* Energy badge */}
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-500/20 select-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse rounded-full" />
                    <Zap size={20} className="text-yellow-500 dark:text-yellow-400 relative z-10 fill-yellow-500 dark:fill-yellow-400" />
                  </div>
                  <div className="leading-none">
                    <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{energy}</div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Energy</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Ticker Bar */}
        <div className="mt-6 flex overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 22 }}
            className="flex gap-2.5 w-max"
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <TickerItem label="Market Vol" value="+24%" trend="up" />
                <TickerItem label="New Jobs" value="128" trend="up" />
                <TickerItem label="Avg. Rate" value="₹850/hr" trend="flat" />
                <TickerItem label="Top Skill" value="React Native" trend="up" />
                <TickerItem label="Active Users" value="2.4k" trend="up" />
                <TickerItem label="Gigs Live" value="340" trend="up" />
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── 2. BENTO GRID STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        {stats.map((stat, i) => (
          <GlassCard 
            key={i} 
            delay={i * 0.06}
            onClick={stat.action}
            className={cn("p-6 flex flex-col justify-between min-h-[170px]", getBentoClass(i, stats.length))}
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-4">
              <StatIcon icon={stat.icon} colorClass={stat.colorClass} />
              {stat.action && (
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                  <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-inherit group-hover:translate-x-0.5 transition-all" />
                </div>
              )}
            </div>

            {/* Bottom Info */}
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">
                {stat.title}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                {stat.value}
              </p>
              <div className="flex items-center gap-1.5">
                {stat.subtitle?.includes('+') && (
                  <TrendingUp size={12} className="text-emerald-500 flex-shrink-0" />
                )}
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors truncate">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── 3. REFERRAL CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative w-full rounded-[28px] border overflow-hidden",
          "bg-gradient-to-br from-indigo-50/60 via-violet-50/40 to-pink-50/60 border-indigo-100/80 shadow-[inset_0_3px_6px_rgba(255,255,255,0.9)]",
          "dark:bg-gradient-to-br dark:from-[#111625] dark:via-[#161233] dark:to-[#111625] dark:border-white/[0.05] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),_0_20px_40px_rgba(0,0,0,0.3)]"
        )}
        style={{ isolation: 'isolate' }}
      >
        {/* Blurs */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/20 dark:bg-violet-500/20 rounded-full blur-[70px] -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-400/15 dark:bg-pink-500/15 rounded-full blur-[50px] translate-y-1/3 -translate-x-1/4" />
        </div>

        {/* Content Layout */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

          {/* Left Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200/60 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                <Gift size={11} /> Double Rewards
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <Sparkles size={12} className="fill-emerald-500 dark:fill-emerald-400 animate-pulse" /> Limited Offer
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.2] mb-3 tracking-tight">
              Invite Friends,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400">
                Get Wallet Cash 💰
              </span>
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
              Share your code. When a friend signs up and{' '}
              <span className="font-bold text-slate-900 dark:text-white underline decoration-emerald-400 decoration-2 underline-offset-2">
                completes KYC
              </span>
              , they get <span className="font-black text-slate-900 dark:text-white">₹5</span> and
              you earn <span className="font-black text-slate-900 dark:text-white">₹10</span> — straight to your wallets!
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-sm">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" /> You earn ₹10
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-sm">
                <CheckCircle2 size={12} className="text-sky-500 flex-shrink-0" /> Friend gets ₹5
              </span>
              {referralCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 backdrop-blur-sm shadow-sm">
                  <Users size={12} className="flex-shrink-0" /> {referralCount} referred
                </span>
              )}
            </div>
          </div>

          {/* Right Claymorphic Code Box */}
          <div className="w-full md:w-[300px] md:flex-shrink-0">
            <div className={cn(
              "w-full rounded-[24px] border overflow-hidden transition-all duration-300",
              "bg-white border-slate-200/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_12px_28px_rgba(99,102,241,0.06)]",
              "dark:bg-slate-900 dark:border-white/[0.07] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_16px_36px_rgba(0,0,0,0.35)]"
            )}>

              {/* Code value */}
              <div className="px-6 pt-5 pb-4">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.18em] mb-1">
                  Your Access Code
                </p>
                <p className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-widest break-all leading-tight">
                  {user.referral_code || "GEN-Z-CODE"}
                </p>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-6" />

              {/* Internal Stats Summary */}
              <div className="grid grid-cols-2 px-6 py-4 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="border-r border-slate-100 dark:border-white/[0.06] pr-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Referred</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{referralCount || 0}</p>
                </div>
                <div className="pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Earned</p>
                  <p className="text-xl font-black text-emerald-500 dark:text-emerald-400 mt-0.5">₹{referralEarnings || 0}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-6" />

              {/* Action Button */}
              <div className="p-4">
                <button
                  onClick={copyReferral}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 text-white",
                    "transition-all duration-300 active:scale-[0.96] select-none",
                    copied
                      ? "bg-emerald-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_20px_rgba(16,185,129,0.3)]"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_20px_rgba(79,70,229,0.25)] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),_0_8px_20px_rgba(99,102,241,0.3)]"
                  )}
                >
                  {copied
                    ? <><CheckCircle2 size={16} className="flex-shrink-0" /> Copied!</>
                    : <><Copy size={16} className="flex-shrink-0" /> Copy Code</>
                  }
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

    </div>
  );
};

export default Overview;
