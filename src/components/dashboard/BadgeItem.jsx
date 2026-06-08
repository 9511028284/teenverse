import React from 'react';
import { 
  ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock, 
  Zap, Gem, Crown, Moon, Swords 
} from 'lucide-react';
import { motion } from 'framer-motion';

const BadgeItem = ({ name, iconName }) => {
  // Map string names from the DB to actual Lucide components
  const IconMap = { 
    ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock, 
    Zap, Gem, Crown, Moon, Swords 
  };
  
  const Icon = IconMap[iconName] || Award;

  // --- CONFIGURATION ---
  // Re-engineered for a rich Clay-Glass fusion across Light & Dark states
  const styles = {
    trust: {
      bg: "from-blue-50/90 to-cyan-50/50 dark:from-blue-500/15 dark:to-cyan-500/5",
      border: "border-blue-200/80 dark:border-blue-500/30",
      text: "text-blue-700 dark:text-blue-300",
      glow: "shadow-[0_8px_20px_rgba(59,130,246,0.25)]",
      icon: "text-blue-500 dark:text-cyan-400",
      beam: "bg-blue-400"
    },
    fun: {
      bg: "from-purple-50/90 to-fuchsia-50/50 dark:from-purple-500/15 dark:to-fuchsia-500/5",
      border: "border-purple-200/80 dark:border-purple-500/30",
      text: "text-purple-700 dark:text-purple-300",
      glow: "shadow-[0_8px_20px_rgba(168,85,247,0.25)]",
      icon: "text-purple-500 dark:text-fuchsia-400",
      beam: "bg-fuchsia-400"
    },
    skill: {
      bg: "from-amber-50/90 to-orange-50/50 dark:from-amber-500/15 dark:to-orange-500/5",
      border: "border-amber-200/80 dark:border-amber-500/30",
      text: "text-amber-700 dark:text-amber-300",
      glow: "shadow-[0_8px_20px_rgba(245,158,11,0.25)]",
      icon: "text-amber-500 dark:text-yellow-400",
      beam: "bg-amber-400"
    },
    work: {
      bg: "from-emerald-50/90 to-teal-50/50 dark:from-emerald-500/15 dark:to-teal-500/5",
      border: "border-emerald-200/80 dark:border-emerald-500/30",
      text: "text-emerald-700 dark:text-emerald-300",
      glow: "shadow-[0_8px_20px_rgba(16,185,129,0.25)]",
      icon: "text-emerald-500 dark:text-teal-400",
      beam: "bg-emerald-400"
    },
    safety: {
      bg: "from-slate-100 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900/40",
      border: "border-slate-300/80 dark:border-white/[0.06]",
      text: "text-slate-600 dark:text-slate-300",
      glow: "shadow-[0_8px_16px_rgba(0,0,0,0.05)]",
      icon: "text-slate-500 dark:text-slate-400",
      beam: "bg-slate-400 dark:bg-white"
    },
    
    // SUBSCRIPTION BADGES
    starter: {
      bg: "from-cyan-50 via-blue-50/60 to-transparent dark:from-cyan-500/15 dark:via-blue-500/5 dark:to-transparent",
      border: "border-cyan-300 dark:border-cyan-400/40",
      text: "text-cyan-700 dark:text-cyan-300",
      glow: "shadow-[0_10px_24px_rgba(6,182,212,0.3)]",
      icon: "text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]",
      beam: "bg-cyan-400"
    },
    pro: {
      bg: "from-fuchsia-50 via-purple-50/60 to-transparent dark:from-fuchsia-600/20 dark:via-purple-500/5 dark:to-transparent",
      border: "border-fuchsia-300 dark:border-fuchsia-400/40",
      text: "text-fuchsia-700 dark:text-fuchsia-300",
      glow: "shadow-[0_10px_24px_rgba(217,70,239,0.3)]",
      icon: "text-fuchsia-500 dark:text-fuchsia-400 drop-shadow-[0_0_6px_rgba(217,70,239,0.5)]",
      beam: "bg-fuchsia-400"
    },
    elite: {
      // PREMIUM ULTRA-VIP FIRE GRADIENT
      bg: "from-red-500/10 via-orange-500/10 to-yellow-500/5 dark:from-red-950/40 dark:via-orange-950/20 dark:to-yellow-950/10",
      border: "border-orange-300 dark:border-orange-500/40 ring-1 ring-orange-200/50 dark:ring-yellow-500/10",
      text: "text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500 dark:from-yellow-300 dark:via-orange-400 dark:to-red-400 font-black",
      glow: "shadow-[0_12px_28px_rgba(239,68,68,0.35)]",
      icon: "text-orange-500 dark:text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]",
      beam: "bg-gradient-to-t from-red-500 to-yellow-400"
    },

    // EASTER EGG MODULES
    night: {
      bg: "from-indigo-50 to-slate-100 dark:from-indigo-950/30 dark:to-slate-900/40",
      border: "border-indigo-200/80 dark:border-indigo-500/20",
      text: "text-indigo-700 dark:text-indigo-300",
      glow: "shadow-[0_8px_20px_rgba(99,102,241,0.2)]",
      icon: "text-indigo-500 dark:text-indigo-400",
      beam: "bg-indigo-400"
    },
    weekend: {
      bg: "from-rose-50 to-orange-50 dark:from-rose-500/15 dark:to-orange-500/5",
      border: "border-rose-200/80 dark:border-rose-500/20",
      text: "text-rose-700 dark:text-rose-300",
      glow: "shadow-[0_8px_20px_rgba(244,63,94,0.2)]",
      icon: "text-rose-500 dark:text-rose-400",
      beam: "bg-rose-400"
    }
  };

  // Category Selector Logic
  let cat = 'fun';
  
  if (['Verified Teen', 'Parent Approved', 'KYC Completed', 'Verified'].includes(name)) cat = 'trust';
  if (['First Gig', 'Rising Talent'].includes(name)) cat = 'work';
  if (['Skill Certified', 'Academy Graduate'].includes(name)) cat = 'skill';
  if (['Safe User', 'Community Safe'].includes(name)) cat = 'safety';

  if (name === 'Starter') cat = 'starter';
  if (name === 'Pro') cat = 'pro';
  if (name === 'Elite') cat = 'elite';

  if (name === 'Night Owl') cat = 'night';
  if (name === 'Weekend Warrior') cat = 'weekend';
  if (name === 'Early Adopter') cat = 'skill';

  const style = styles[cat];

  return (
    <motion.div 
      initial="rest"
      whileHover="hover"
      animate="rest"
      className={`relative group overflow-hidden rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} backdrop-blur-md cursor-default select-none transition-colors duration-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]`}
    >
      
      {/* 1. GRAINY TEXTURE OVERLAY */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay pointer-events-none" />

      {/* 2. AMBIENT SHIFT SCANNING BEAM */}
      <motion.div 
        variants={{
          rest: { x: '-150%', opacity: 0 },
          hover: { 
            x: '150%', 
            opacity: [0, 0.4, 0],
            transition: { duration: 1.2, repeat: Infinity, ease: "linear" } 
          }
        }}
        className="absolute inset-0 w-1/2 h-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
      />
      
      {/* 3. CORE VALUE FRAME CONTAINER */}
      <div className="relative z-20 flex items-center gap-2 px-3.5 py-1.5">
        
        {/* Claymorphic micro-scaling icon vector */}
        <motion.div
          variants={{
            rest: { rotate: 0, scale: 1 },
            hover: { rotate: 15, scale: 1.15, transition: { type: "spring", stiffness: 260, damping: 12 } }
          }}
          className={`${style.icon} flex items-center justify-center`}
        >
           <Icon size={14} strokeWidth={2.5} />
        </motion.div>

        {/* Dense scannable tracking headers */}
        <motion.span 
          variants={{
            rest: { letterSpacing: "0.03em" },
            hover: { letterSpacing: "0.06em" }
          }}
          className={`text-[10px] font-black uppercase transition-all duration-200 ${style.text}`}
        >
          {name}
        </motion.span>

        {/* Pulse beacon indicators */}
        <div className="flex h-1.5 w-1.5 relative ml-0.5">
           <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${style.beam}`} />
           <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.beam}`} />
        </div>
      </div>

      {/* 4. ACTIVE VOLUMETRIC BORDER FOOTPRINT GLOW */}
      <motion.div 
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-screen ${style.glow}`}
      />
      
    </motion.div>
  );
};

export default BadgeItem;