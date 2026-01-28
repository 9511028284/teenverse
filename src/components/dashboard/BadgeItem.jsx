import React from 'react';
import { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const BadgeItem = ({ name, iconName }) => {
  const IconMap = { ShieldCheck, FileCheck, Rocket, Award, Briefcase, Lock };
  const Icon = IconMap[iconName] || Award;

  // --- CONFIGURATION ---
  // We define deep color palettes for the "Cyber-Luxe" look
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
    }
  };

  // Logic to determine category
  let cat = 'fun';
  if (['Verified Teen', 'Parent Approved', 'KYC Completed', 'Verified'].includes(name)) cat = 'trust';
  if (['First Gig', 'Rising Talent'].includes(name)) cat = 'work';
  if (['Skill Certified', 'Academy Graduate'].includes(name)) cat = 'skill';
  if (['Safe User', 'Community Safe'].includes(name)) cat = 'safety';

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

      {/* 2. SCANNING BEAM (The "Crazy" Part) */}
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
          className={`${style.icon} drop-shadow-[0_0_8px_currentColor]`}
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
        <div className="flex h-1.5 w-1.5 relative">
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