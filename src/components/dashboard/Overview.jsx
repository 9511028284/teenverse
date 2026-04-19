import React, { useState, useEffect } from 'react';
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
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden rounded-2xl transition-all duration-300",
      // LIGHT MODE: crisp white, warm shadow
      "bg-white border border-slate-100 shadow-[0_2px_16px_0_rgba(99,102,241,0.07)] hover:shadow-[0_8px_32px_0_rgba(99,102,241,0.14)] hover:border-indigo-200",
      // DARK MODE: rich slate glass, cool glow
      "dark:bg-[#0F172A] dark:border-white/[0.07] dark:shadow-none dark:hover:border-indigo-500/40 dark:hover:shadow-[0_0_40px_0_rgba(99,102,241,0.12)]",
      onClick ? "cursor-pointer active:scale-[0.98]" : "",
      className
    )}
  >
    {/* Hover tint */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-transparent to-purple-50/30 dark:from-indigo-900/20 dark:via-transparent dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const TickerItem = ({ label, value, trend }) => (
  <div className={cn(
    "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors shrink-0",
    "bg-white border-slate-200 text-slate-500 shadow-sm",
    "dark:bg-white/[0.05] dark:border-white/[0.07] dark:text-slate-400"
  )}>
    <span>{label}</span>
    <span className="text-slate-900 dark:text-white font-bold">{value}</span>
    <span className={cn(
      "text-[10px] font-bold",
      trend === 'up' ? "text-emerald-500" : "text-indigo-400 dark:text-indigo-400"
    )}>
      {trend === 'up' ? '▲' : '●'}
    </span>
  </div>
);

// Stat icon container
const StatIcon = ({ icon: Icon, colorClass }) => (
  <div className={cn("p-2.5 rounded-xl shadow-sm flex items-center justify-center", colorClass)}>
    <Icon size={18} strokeWidth={2} />
  </div>
);

// --- MAIN COMPONENT ---

const Overview = ({ 
  user, isClient, totalEarnings, showToast, jobsCount, 
  badgesCount, setTab, referralCount, referralEarnings, energy, setModal 
}) => {
  
  const [greeting, setGreeting] = useState('Welcome back');
  const [copied, setCopied] = useState(false);
  
  const isKycVerified = user?.is_kyc_verified || user?.kyc_status === 'verified';
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

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
      // Light: warm pink tint | Dark: vivid rose-pink gradient
      colorClass: "bg-rose-100 text-rose-600 dark:bg-gradient-to-br dark:from-rose-500 dark:to-pink-600 dark:text-white",
      accentLight: "from-rose-50 to-pink-50",
      accentDark: "dark:from-rose-900/20 dark:to-pink-900/10",
      action: null
    },
    {
      title: isClient ? "Total Investment" : "Total Earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      subtitle: isClient ? "Lifetime Spend" : "+12% this month",
      icon: DollarSign,
      // Light: fresh emerald | Dark: emerald → teal
      colorClass: "bg-emerald-100 text-emerald-700 dark:bg-gradient-to-br dark:from-emerald-500 dark:to-teal-500 dark:text-white",
      accentLight: "from-emerald-50 to-teal-50",
      accentDark: "dark:from-emerald-900/20 dark:to-teal-900/10",
      action: null
    },
    {
      title: isClient ? "Jobs Posted" : "Active Missions",
      value: jobsCount,
      subtitle: isClient ? "Finding talent" : "Applications sent",
      icon: Briefcase,
      // Light: sky blue | Dark: blue → indigo
      colorClass: "bg-sky-100 text-sky-700 dark:bg-gradient-to-br dark:from-sky-500 dark:to-indigo-500 dark:text-white",
      accentLight: "from-sky-50 to-indigo-50",
      accentDark: "dark:from-sky-900/20 dark:to-indigo-900/10",
      action: () => setTab(isClient ? 'posted-jobs' : 'applications')
    },
    !isClient && {
      title: "Reputation",
      value: badgesCount,
      subtitle: "Badges unlocked",
      icon: Award,
      // Light: warm amber | Dark: amber → orange
      colorClass: "bg-amber-100 text-amber-700 dark:bg-gradient-to-br dark:from-amber-400 dark:to-orange-500 dark:text-white",
      accentLight: "from-amber-50 to-orange-50",
      accentDark: "dark:from-amber-900/20 dark:to-orange-900/10",
      action: () => setTab('profile-card')
    },
    {
      title: "Network Effect",
      value: referralCount || 0,
      subtitle: `Earned ₹${referralEarnings || 0}`,
      icon: Users,
      // Light: soft violet | Dark: violet → purple
      colorClass: "bg-violet-100 text-violet-700 dark:bg-gradient-to-br dark:from-violet-500 dark:to-purple-600 dark:text-white",
      accentLight: "from-violet-50 to-purple-50",
      accentDark: "dark:from-violet-900/20 dark:to-purple-900/10",
      action: null
    }
  ].filter(Boolean);

  // Bento grid layout
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
        <div className="flex flex-col gap-5">

          {/* Top row: badge + date */}
          <motion.div 
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/25 dark:text-indigo-400">
              Workspace
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </motion.div>

          {/* Greeting + Badges row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]"
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

            {/* KYC + Energy badges — stack on mobile */}
            {!isClient && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="flex flex-row sm:flex-row gap-2 flex-wrap"
              >
                {/* KYC badge */}
                <div
                  onClick={() => !isKycVerified && setModal('kyc_verification')}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all select-none",
                    isKycVerified
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-500/30 cursor-default"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-500/30 cursor-pointer hover:scale-[1.02] active:scale-95"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    {!isKycVerified && <div className="absolute inset-0 bg-amber-400 blur-md opacity-50 animate-pulse rounded-full" />}
                    {isKycVerified
                      ? <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 relative z-10" />
                      : <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 relative z-10" />
                    }
                  </div>
                  <div className="leading-none">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {isKycVerified ? "Verified" : "Action Required"}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                      {isKycVerified ? "Identity Secured" : "Complete KYC"}
                    </div>
                  </div>
                </div>

                {/* Energy badge */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-500/30">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-50 animate-pulse rounded-full" />
                    <Zap size={20} className="text-yellow-500 dark:text-yellow-400 relative z-10 fill-yellow-500 dark:fill-yellow-400" />
                  </div>
                  <div className="leading-none">
                    <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{energy}</div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Energy</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Ticker Bar ── */}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <GlassCard 
            key={i} 
            delay={i * 0.08}
            onClick={stat.action}
            className={cn("p-5 sm:p-6 flex flex-col justify-between", getBentoClass(i, stats.length))}
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-5 sm:mb-6">
              <StatIcon icon={stat.icon} colorClass={stat.colorClass} />
              {stat.action && (
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <ArrowRight size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              )}
            </div>

            {/* Bottom: value + labels */}
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">
                {stat.title}
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                {stat.value}
              </p>
              <div className="flex items-center gap-1.5">
                {stat.subtitle?.includes('+') && (
                  <TrendingUp size={11} className="text-emerald-500 flex-shrink-0" />
                )}
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors truncate">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── 3. REFERRAL CARD — MOBILE CONTAINED ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          // Solid contained box — no overflow bleed on mobile
          "relative w-full rounded-2xl border",
          "bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 border-indigo-100",
          "dark:bg-gradient-to-br dark:from-[#0f0c29] dark:via-[#1a1040] dark:to-[#0f0c29] dark:border-white/[0.08]"
        )}
        style={{ isolation: 'isolate' }}
      >
        {/* Decorative blobs — clipped inside the card, no overflow */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-0 right-0 w-56 h-56 bg-violet-400/20 dark:bg-violet-500/25 rounded-full blur-[64px] -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-400/15 dark:bg-pink-500/20 rounded-full blur-[48px] translate-y-1/3 -translate-x-1/4" />
        </div>

        {/* Content — stacks vertically on mobile, side-by-side on md+ */}
        <div className="relative z-10 p-5 sm:p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

          {/* ── Left: headline + description ── */}
          <div className="flex-1 min-w-0">
            {/* Badge pills */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                <Gift size={11} /> Double Rewards
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                <Sparkles size={11} className="fill-emerald-500 dark:fill-emerald-400" /> Limited Offer
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.2] mb-2">
              Invite Friends,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400">
                Get Wallet Cash 💰
              </span>
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Share your code. When a friend signs up and{' '}
              <span className="font-bold text-slate-900 dark:text-white underline decoration-emerald-400 decoration-2 underline-offset-2">
                completes KYC
              </span>
              , they get <span className="font-black text-slate-900 dark:text-white">₹5</span> and
              you earn <span className="font-black text-slate-900 dark:text-white">₹10</span> — straight to your wallets!
            </p>

            {/* Reward pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 backdrop-blur-sm">
                <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" /> You earn ₹10
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 backdrop-blur-sm">
                <CheckCircle2 size={11} className="text-sky-500 flex-shrink-0" /> Friend gets ₹5
              </span>
              {referralCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 rounded-full px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 backdrop-blur-sm">
                  <Users size={11} className="flex-shrink-0" /> {referralCount} referred
                </span>
              )}
            </div>
          </div>

          {/* ── Right: code box — always full-width on mobile ── */}
          <div className="w-full md:w-[280px] md:flex-shrink-0">
            <div className={cn(
              "w-full rounded-2xl border overflow-hidden",
              "bg-white/90 backdrop-blur-xl border-slate-200/80 shadow-[0_4px_24px_rgba(99,102,241,0.12)]",
              "dark:bg-slate-900/80 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_4px_32px_rgba(0,0,0,0.35)]"
            )}>

              {/* Code label + value */}
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.18em] mb-1">
                  Your Access Code
                </p>
                <p className="text-2xl font-mono font-black text-slate-900 dark:text-white tracking-widest break-all leading-tight">
                  {user.referral_code || "GEN-Z-CODE"}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 dark:bg-white/[0.07] mx-5" />

              {/* Stats row */}
              <div className="grid grid-cols-2 px-5 py-3">
                <div className="border-r border-slate-100 dark:border-white/[0.07] pr-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Referred</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{referralCount || 0}</p>
                </div>
                <div className="pl-4">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Earned</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{referralEarnings || 0}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 dark:bg-white/[0.07] mx-5" />

              {/* Copy button */}
              <div className="p-4">
                <button
                  onClick={copyReferral}
                  className={cn(
                    "w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2",
                    "transition-all duration-200 active:scale-[0.97] select-none",
                    copied
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 dark:bg-indigo-500 dark:hover:bg-indigo-400"
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