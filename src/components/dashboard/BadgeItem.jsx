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
  // Deep color palettes for the "Cyber-Luxe" look
  const styles = {
    trust: {
      bg: "from-blue-500/20 to-cyan-500/5",
      border: "border-blue-400/50",
      text: "text-blue-300",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
      icon: "text-cyan-400",
      beam: "bg-blue-400"
    },
    fun: {
      bg: "from-purple-500/20 to-fuchsia-500/5",
      border: "border-purple-400/50",
      text: "text-purple-300",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
      icon: "text-fuchsia-400",
      beam: "bg-fuchsia-400"
    },
    skill: {
      bg: "from-amber-500/20 to-orange-500/5",
      border: "border-amber-400/50",
      text: "text-amber-300",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]",
      icon: "text-yellow-400",
      beam: "bg-amber-400"
    },
    work: {
      bg: "from-emerald-500/20 to-teal-500/5",
      border: "border-emerald-400/50",
      text: "text-emerald-300",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      icon: "text-teal-400",
      beam: "bg-emerald-400"
    },
    safety: {
      bg: "from-gray-800 to-gray-900",
      border: "border-gray-500/50",
      text: "text-gray-300",
      glow: "shadow-[0_0_15px_rgba(255,255,255,0.1)]",
      icon: "text-gray-400",
      beam: "bg-white"
    },
    
    // 🚀 NEW: SUBSCRIPTION BADGES
    starter: {
      bg: "from-cyan-500/20 via-blue-500/10 to-transparent",
      border: "border-cyan-400/60",
      text: "text-cyan-300",
      glow: "shadow-[0_0_25px_rgba(6,182,212,0.6)]",
      icon: "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]",
      beam: "bg-cyan-400"
    },
    pro: {
      bg: "from-fuchsia-600/30 via-purple-500/10 to-transparent",
      border: "border-fuchsia-400/60",
      text: "text-fuchsia-300",
      glow: "shadow-[0_0_25px_rgba(217,70,239,0.6)]",
      icon: "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]",
      beam: "bg-fuchsia-400"
    },
    elite: {
      // 🔥 THE FIRE / VIP AESTHETIC 🔥
      bg: "from-red-900/60 via-orange-600/30 to-yellow-500/10",
      border: "border-orange-500/70 ring-1 ring-yellow-500/30",
      text: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.8)]",
      icon: "text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,1)]",
      beam: "bg-gradient-to-t from-red-500 to-yellow-400"
    },

    // 🐣 NEW: EASTER EGG BADGES
    night: {
      bg: "from-indigo-900/60 to-slate-900/40",
      border: "border-indigo-400/50",
      text: "text-indigo-300",
      glow: "shadow-[0_0_20px_rgba(99,102,241,0.5)]",
      icon: "text-indigo-400",
      beam: "bg-indigo-400"
    },
    weekend: {
      bg: "from-rose-500/20 to-orange-500/5",
      border: "border-rose-400/50",
      text: "text-rose-300",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.5)]",
      icon: "text-rose-400",
      beam: "bg-rose-400"
    }
  };

  // Logic to determine category
  let cat = 'fun'; // Default
  
  // Standard Categories
  if (['Verified Teen', 'Parent Approved', 'KYC Completed', 'Verified'].includes(name)) cat = 'trust';
  if (['First Gig', 'Rising Talent'].includes(name)) cat = 'work';
  if (['Skill Certified', 'Academy Graduate'].includes(name)) cat = 'skill';
  if (['Safe User', 'Community Safe'].includes(name)) cat = 'safety';

  // Premium Subscription Categories
  if (name === 'Starter') cat = 'starter';
  if (name === 'Pro') cat = 'pro';
  if (name === 'Elite') cat = 'elite';

  // Time-Based Easter Egg Categories
  if (name === 'Night Owl') cat = 'night';
  if (name === 'Weekend Warrior') cat = 'weekend';
  if (name === 'Early Adopter') cat = 'skill'; // Uses the amber styling

  const style = styles[cat];

  return (
    <motion.div 
      initial="rest"
      whileHover="hover"
      animate="rest"
      className={`relative group overflow-hidden rounded-lg border ${style.border} bg-gradient-to-br ${style.bg} backdrop-blur-md cursor-default select-none`}
    >
      
      {/* 1. NOISE TEXTURE OVERLAY */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* 2. SCANNING BEAM */}
      <motion.div 
        variants={{
          rest: { x: '-150%', opacity: 0 },
          hover: { 
            x: '150%', 
            opacity: [0, 1, 0],
            transition: { duration: 1, repeat: Infinity, ease: "linear" } 
          }
        }}
        className={`absolute inset-0 w-1/2 h-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10`}
      />
      
      {/* 3. CONTENT CONTAINER */}
      <div className={`relative z-20 flex items-center gap-2 px-3 py-1.5`}>
        
        {/* Animated Icon */}
        <motion.div
          variants={{
            rest: { rotate: 0, scale: 1 },
            hover: { rotate: 360, scale: 1.2, transition: { type: "spring", stiffness: 200 } }
          }}
          className={`${style.icon}`}
        >
           <Icon size={14} strokeWidth={3} />
        </motion.div>

        {/* Text with dynamic tracking */}
        <motion.span 
          variants={{
            rest: { letterSpacing: "0.05em" },
            hover: { letterSpacing: "0.1em" }
          }}
          className={`text-[10px] font-black uppercase ${style.text}`}
        >
          {name}
        </motion.span>

        {/* Status Dot (Blinking) */}
        <div className="flex h-1.5 w-1.5 relative ml-1">
           <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.beam}`}></span>
           <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.beam}`}></span>
        </div>
      </div>

      {/* 4. ACTIVE BORDER GLOW */}
      <motion.div 
        className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${style.glow}`}
        style={{ boxShadow: `inset 0 0 10px ${style.border}` }}
      />
      
    </motion.div>
  );
};

export default BadgeItem;