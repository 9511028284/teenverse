import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, X, User, ShieldCheck, Maximize2, Minimize2, LogOut, ChevronRight,
  LayoutDashboard, Briefcase, ListChecks, Package, FileText, MessageSquare,
  BookOpen, Sparkles, Share2, Settings, UserCircle, Zap, Crown, Bell
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- MICRO-COMPONENTS ---

// 1. Animated Logo with Glitch Effect on Hover
const GenZLogo = ({ zenMode }) => (
  <div className="relative group cursor-pointer">
    <div className={cn("flex items-center gap-3 transition-all duration-500", zenMode ? "justify-center" : "")}>
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-40 animate-pulse group-hover:opacity-70 transition-opacity"/>
        <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-300">
          <Rocket size={24} className="text-indigo-400 fill-indigo-400/20 group-hover:-translate-y-1 transition-transform" />
        </div>
      </div>
      
      {!zenMode && (
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tighter text-white">
            Teen<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">Verse</span>
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
            Future Ready
          </span>
        </div>
      )}
    </div>
  </div>
);

// 2. Holographic User Card (Gamified)
const HolographicCard = ({ user, badges, userLevel, progressPercent, zenMode }) => {
  if (zenMode) return (
    <div className="mx-auto w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px] ring-2 ring-indigo-500/30">
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="User" className="rounded-full w-full h-full object-cover" />
    </div>
  );

  return (
    <motion.div 
      whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
      className="relative mx-4 mt-6 overflow-hidden rounded-3xl bg-gray-900/40 border border-white/10 backdrop-blur-xl group"
    >
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-pink-600/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 blur-[50px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gray-800 to-black p-1 border border-white/10 shadow-lg">
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                 {user.avatar ? 
                    <img src={user.avatar} className="w-full h-full object-cover" alt="avi"/> : 
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xl">👾</div>
                 }
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-black/80 backdrop-blur-md border border-yellow-500/50 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
              <Zap size={10} className="fill-yellow-400" /> LVL {userLevel}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate flex items-center gap-1.5">
              {user.name} 
              {badges.some(b => b.name === 'Verified') && <ShieldCheck size={14} className="text-blue-400" />}
            </h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                 {user.type}
               </span>
               <span className="text-[10px] text-gray-400">Rank #420</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Next Level</span>
            <span className="text-white">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-white/30 w-full -translate-x-full animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 3. Navigation Item with Magnetic Hover & Active Pill
const NavItem = ({ id, icon: Icon, label, isActive, onClick, zenMode, color = "text-indigo-400" }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative w-full group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 mb-1 outline-none",
        zenMode ? "justify-center px-0" : ""
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)]"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-4 w-full">
        <div className={cn(
          "transition-transform duration-300 group-hover:scale-110",
          isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-400"
        )}>
           <Icon size={zenMode ? 24 : 20} className={cn(isActive ? "animate-bounce-subtle" : "")} strokeWidth={isActive ? 2.5 : 2} />
        </div>

        {!zenMode && (
          <span className={cn(
            "text-sm font-semibold tracking-wide transition-colors duration-200",
            isActive ? "text-white" : "text-gray-400 group-hover:text-white"
          )}>
            {label}
          </span>
        )}

        {!zenMode && isActive && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-auto"
          >
            <ChevronRight size={16} className="text-white/70" />
          </motion.div>
        )}
      </div>
    </button>
  );
};


// --- MAIN COMPONENT ---

const DashboardSidebar = ({ 
  user = { name: 'Alex Star', type: 'Creator' }, 
  isClient = false, 
  badges = [], 
  userLevel = 12, 
  progressPercent = 65, 
  menuOpen, 
  setMenuOpen, 
  zenMode, 
  setZenMode, 
  tab, 
  setTab, 
  onLogout 
}) => {
  
  // Section separator with gradient text
  const Separator = ({ label }) => (
    !zenMode && (
      <div className="mt-6 mb-2 px-6 flex items-center gap-4 opacity-60">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text text-transparent">
          {label}
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-800 to-transparent"/>
      </div>
    )
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: zenMode ? 100 : 320,
          translateX: menuOpen ? 0 : '-100%' 
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 h-screen md:h-auto flex flex-col",
          "md:translate-x-0" // Reset transform for desktop
        )}
      >
        <div className="h-full m-0 md:my-4 md:ml-4 rounded-none md:rounded-[2.5rem] bg-[#09090b] relative overflow-hidden flex flex-col shadow-2xl border-r md:border border-white/5">
          
          {/* Glass Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
          
          {/* Ambient Glows */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-20 p-6 flex items-center justify-between shrink-0">
             <GenZLogo zenMode={zenMode} />
             <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400"><X /></button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 relative z-20">
            <HolographicCard 
              user={user} 
              badges={badges} 
              userLevel={userLevel} 
              progressPercent={progressPercent}
              zenMode={zenMode}
            />

            <div className="mt-8 px-4 space-y-1">
              <LayoutGroup>
                <NavItem id="overview" icon={LayoutDashboard} label="Dashboard" isActive={tab === 'overview'} onClick={() => setTab('overview')} zenMode={zenMode} />
                
                <Separator label="Workspace" />
                <NavItem id="jobs" icon={Briefcase} label={isClient ? 'Browse Talent' : 'Job Board'} isActive={tab === 'jobs'} onClick={() => setTab('jobs')} zenMode={zenMode} />
                <NavItem id="messages" icon={MessageSquare} label="Messages" isActive={tab === 'messages'} onClick={() => setTab('messages')} zenMode={zenMode} />
                <NavItem id="applications" icon={FileText} label="Contracts" isActive={tab === 'applications'} onClick={() => setTab('applications')} zenMode={zenMode} />

                {!isClient && (
                  <>
                    <Separator label="Growth" />
                    <NavItem id="profile" icon={UserCircle} label="My Brand" isActive={tab === 'profile'} onClick={() => setTab('profile')} zenMode={zenMode} />
                    <NavItem id="portfolio" icon={Sparkles} label="AI Portfolio" isActive={tab === 'portfolio'} onClick={() => setTab('portfolio')} zenMode={zenMode} />
                    <NavItem id="academy" icon={BookOpen} label="Creator Academy" isActive={tab === 'academy'} onClick={() => setTab('academy')} zenMode={zenMode} />
                  </>
                )}

                <Separator label="System" />
                <NavItem id="settings" icon={Settings} label="Settings" isActive={tab === 'settings'} onClick={() => setTab('settings')} zenMode={zenMode} />
              </LayoutGroup>
            </div>
          </div>

          {/* Footer Control Deck */}
          <div className="relative z-20 p-4 mx-4 mb-4 mt-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <button 
                onClick={() => setZenMode(!zenMode)} 
                className="flex-1 p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all group flex justify-center"
                title={zenMode ? "Expand" : "Zen Mode"}
              >
                {zenMode ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              
              {!zenMode && <div className="w-[1px] h-6 bg-white/10" />}
              
              <button 
                onClick={onLogout} 
                className="flex-1 p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all group flex justify-center"
                title="Logout"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </motion.aside>
    </>
  );
};

export default DashboardSidebar;