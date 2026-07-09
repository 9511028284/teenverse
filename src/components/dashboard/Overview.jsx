import React, { useState } from 'react';
import { 
  DollarSign, Briefcase, Award, ArrowRight, 
  Gift, Copy, Users, Zap, ShieldAlert, ShieldCheck, Wallet,
  TrendingUp, CheckCircle2, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- ENHANCED BENTO CARD GRID FRAME ---
const GlassCard = ({ children, className, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden rounded-[24px] transition-all duration-300",
      "bg-white border border-slate-200/60 shadow-sm",
      "dark:bg-slate-900/60 dark:border-white/[0.04]",
      onClick ? "cursor-pointer active:scale-[0.99] hover:border-slate-300 dark:hover:border-white/10" : "",
      className
    )}
  >
    {/* Micro-Glow Layer on card hovering states */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none dark:from-indigo-400/5" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

// --- CLEAN STRUCTURAL TICKER PORTAL ---
const TickerItem = ({ label, value, trend }) => (
  <div className={cn(
    "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition-colors",
    "bg-slate-100/60 border-slate-200/50 text-slate-500",
    "dark:bg-slate-900 dark:border-white/[0.03] dark:text-slate-400"
  )}>
    <span>{label}</span>
    <span className="text-slate-950 dark:text-white font-bold">{value}</span>
    <span className={cn(
      "text-[10px]",
      trend === 'up' ? "text-emerald-500 animate-pulse" : "text-indigo-400"
    )}>
      {trend === 'up' ? '▲' : '●'}
    </span>
  </div>
);

// --- ICON ARCHITECTURE HOUSING COMPONENT ---
const StatIcon = ({ icon: Icon, colorClass }) => (
  <div className={cn(
    "p-2.5 rounded-xl flex items-center justify-center text-white shadow-sm",
    colorClass
  )}>
    <Icon size={16} strokeWidth={2.5} />
  </div>
);

// --- MAIN STAGE COMPONENT ---
const Overview = ({ 
  user, isClient, totalEarnings, showToast, jobsCount, 
  badgesCount, setTab, referralCount, referralEarnings, energy, setModal 
}) => {
  
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });
  const [copied, setCopied] = useState(false);
  
  const isKycVerified = user?.is_kyc_verified || user?.kyc_status === 'verified';

  const copyReferral = () => {
    if (user.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (showToast) showToast("Referral code copied! 🚀");
    }
  };

  const stats = [
    {
      title: "Wallet Balance",
      value: `₹${(user?.wallet_balance || 0).toLocaleString()}`,
      subtitle: !isClient ? "Subscription lock mode active" : "Available for checking out",
      icon: Wallet,
      colorClass: "bg-gradient-to-tr from-rose-500 to-pink-500",
      action: null
    },
    {
      title: isClient ? "Total Allocation" : "Total Net Earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      subtitle: isClient ? "Lifetime investment ledger" : "+12% dynamic metrics shift",
      icon: DollarSign,
      colorClass: "bg-gradient-to-tr from-emerald-500 to-teal-500",
      action: null
    },
    {
      title: isClient ? "Job Configurations" : "Active Milestones",
      value: jobsCount,
      subtitle: isClient ? "Talent deployment active" : "Transmitted indexing arrays",
      icon: Briefcase,
      colorClass: "bg-gradient-to-tr from-sky-500 to-blue-500",
      action: () => setTab(isClient ? 'posted-jobs' : 'applications')
    },
    !isClient && {
      title: "Reputation Index",
      value: badgesCount,
      subtitle: "Ecosystem badges unlocked",
      icon: Award,
      colorClass: "bg-gradient-to-tr from-amber-500 to-orange-500",
      action: () => setTab('profile-card')
    },
    {
      title: "Referral Matrix",
      value: referralCount || 0,
      subtitle: `Aggregated returns: ₹${referralEarnings || 0}`,
      icon: Users,
      colorClass: "bg-gradient-to-tr from-violet-500 to-purple-500",
      action: null
    }
  ].filter(Boolean);

  // Dynamic Bento Grid configurations optimized for 14-25 age expectations
  const getBentoClass = (index) => {
    return [
      "md:col-span-6 lg:col-span-4",
      "md:col-span-6 lg:col-span-4",
      "md:col-span-4 lg:col-span-4",
      "md:col-span-4 lg:col-span-6",
      "md:col-span-4 lg:col-span-6"
    ][index] || "md:col-span-4 lg:col-span-4";
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 max-w-7xl mx-auto px-1 select-none">

      {/* ── 1. ENVIRONMENTAL SYSTEM HEADER ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              Overview Port
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight"
            >
              {greeting},{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {user.name?.split(' ')[0]} ✦
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
              className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium mt-1"
            >
              Ecosystem state metrics configured successfully.
            </motion.p>
          </div>

          {/* Verification Indicators & Energy Modules */}
          {!isClient && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="flex items-center gap-2 flex-wrap"
            >
              {/* KYC Status Node */}
              <div
                onClick={() => !isKycVerified && setModal?.('kyc_verification')}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all text-xs font-semibold",
                  isKycVerified
                    ? "bg-emerald-50/60 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-50/60 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-500/10 dark:text-amber-400 cursor-pointer hover:scale-[1.01]"
                )}
              >
                {isKycVerified
                  ? <ShieldCheck size={16} className="text-emerald-500" />
                  : <ShieldAlert size={16} className="text-amber-500 animate-pulse" />
                }
                <div className="leading-tight">
                  <p className="text-slate-900 dark:text-white font-bold">{isKycVerified ? "Verified" : "Verify KYC"}</p>
                </div>
              </div>

              {/* Dynamic Energy Monitor Capsule */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl border bg-indigo-50/60 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-500/10 text-xs font-semibold">
                <Zap size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                <div className="leading-tight flex items-center gap-1.5">
                  <span className="text-slate-400">Energy Pool:</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">{energy}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Endless Seamless Ticker Stream */}
        <div className="pt-2 flex overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 26 }}
            className="flex gap-2 w-max"
          >
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <TickerItem label="Platform Vol" value="+24%" trend="up" />
                <TickerItem label="Missions Indexed" value="128" trend="up" />
                <TickerItem label="System Index Rate" value="₹850/hr" trend="flat" />
                <TickerItem label="Trending Framework" value="Tailwind CSS" trend="up" />
                <TickerItem label="Nodes Online" value="2.4k" trend="up" />
                <TickerItem label="Gigs Validated" value="340" trend="up" />
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── 2. METRIC GRID MATRIX ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {stats.map((stat, i) => (
          <GlassCard 
            key={i} delay={i * 0.04} onClick={stat.action}
            className={cn("p-5 flex flex-col justify-between min-h-[150px]", getBentoClass(i))}
          >
            <div className="flex justify-between items-start">
              <StatIcon icon={stat.icon} colorClass={stat.colorClass} />
              {stat.action && (
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <ArrowRight size={13} className="text-slate-400 dark:text-slate-500 group-hover:text-inherit group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                {stat.title}
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-none mb-1.5">
                {stat.value}
              </p>
              <div className="flex items-center gap-1 min-w-0">
                {stat.subtitle?.includes('+') && <TrendingUp size={11} className="text-emerald-500 shrink-0" />}
                <p className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── 3. REWARD PROTOCOL CONTAINER ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className={cn(
          "w-full rounded-[28px] border overflow-hidden p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6",
          "bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/60 shadow-sm",
          "dark:bg-gradient-to-br dark:from-slate-900/60 dark:via-indigo-950/10 dark:to-slate-900/60 dark:border-white/[0.04]"
        )}
      >
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <Gift size={10} /> Incentive Multiplier
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={10} className="fill-emerald-500 animate-pulse" /> Live Event
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-snug">
            Expand the Network,{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Earn Wallet Balance Cash 💰
            </span>
          </h3>

          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
            Distribute your network access credentials. When peers complete account creation blueprints and {' '}
            <span className="font-bold text-slate-900 dark:text-slate-200 underline decoration-emerald-400 underline-offset-2">
              validate structural KYC status
            </span>
            , wallet balances update immediately: they receive <span className="font-bold text-slate-950 dark:text-white">₹5</span> and your ledger indexes <span className="font-bold text-slate-950 dark:text-white">₹10</span>.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/[0.03] rounded-xl px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 shadow-sm">
              <CheckCircle2 size={11} className="text-emerald-500" /> You balance +₹10
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/[0.03] rounded-xl px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 shadow-sm">
              <CheckCircle2 size={11} className="text-sky-500" /> Peer balance +₹5
            </span>
          </div>
        </div>

        {/* Access Code Verification Interface Box */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="w-full rounded-2xl border border-slate-200/60 bg-white dark:border-white/[0.04] dark:bg-slate-950 p-4 shadow-sm">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                Access Code Node
              </p>
              <p className="text-lg font-mono font-extrabold text-slate-950 dark:text-white tracking-wider truncate">
                {user.referral_code || "GEN-Z-NODE"}
              </p>
            </div>

            <div className="my-3 border-t border-slate-100 dark:border-white/[0.03]" />

            <div className="grid grid-cols-2 gap-2 text-center pb-3">
              <div className="border-r border-slate-100 dark:border-white/[0.03]">
                <p className="text-[10px] text-slate-400 font-medium">Referred</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{referralCount || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Earned</p>
                <p className="text-base font-bold text-emerald-500 mt-0.5">₹{referralEarnings || 0}</p>
              </div>
            </div>

            <button
              onClick={copyReferral}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all select-none flex items-center justify-center gap-2",
                copied
                  ? "bg-emerald-600 shadow-sm"
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm"
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default Overview;