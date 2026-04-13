import React from 'react';
import { 
  Rocket, X, User, ShieldCheck, Maximize2, Minimize2, LogOut, ChevronRight,
  LayoutDashboard, Briefcase, ListChecks, Package, FileText, MessageSquare,
  BookOpen, Sparkles, Share2, UserCircle, Settings, Zap, Crown, HelpCircle
} from 'lucide-react';
import BadgeItem from './BadgeItem'; // Ensure this path matches your project structure

const DashboardSidebar = ({ 
  user, isClient, badges, userLevel, progressPercent, 
  menuOpen, setMenuOpen, zenMode, setZenMode, tab, setTab, onLogout, energy 
}) => {
  
  const SidebarItem = ({ id, icon: Icon, label, color, badge }) => (
    <button 
      onClick={() => {setTab(id); setMenuOpen(false);}} 
      className={`group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
        tab === id 
        // LIGHT MODE ACTIVE: Crisp white card popping off the mist background
        ? 'bg-white text-indigo-700 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-slate-200/50 ' +
        // DARK MODE ACTIVE: Cyber-luxe gradient
        'dark:bg-gradient-to-r dark:from-indigo-600 dark:to-violet-600 dark:text-white dark:shadow-lg dark:shadow-indigo-500/30 dark:border-transparent' 
        // INACTIVE STATES: Soft text that darkens on hover
        : 'text-slate-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'
      }`}
    >
      <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${tab === id ? 'text-indigo-600 dark:text-white' : color || ''}`} />
      {!zenMode && (
        <> 
          <span className="flex-1 text-left">{label}</span> 
          {badge && (
             <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{badge}</span>
          )}
          {tab === id && <ChevronRight size={14} className="opacity-80 animate-pulse text-indigo-400 dark:text-white/80"/>} 
        </>
      )}
    </button>
  );

  // 🚀 BADGE SORTING LOGIC: Rank by exclusivity/importance
  const getTopBadges = () => {
      const rankMap = {
          'Elite': 100,
          'Pro': 90,
          'Starter': 80,
          'Verified': 70,
          'Verified Teen': 70,
          'Parent Approved': 60,
          'KYC Completed': 50,
          'Night Owl': 40,
          'Weekend Warrior': 40,
          'Early Adopter': 40,
          'First Gig': 30,
          'Skill Certified': 10
      };

      return [...badges]
          .sort((a, b) => (rankMap[b.name] || 0) - (rankMap[a.name] || 0)) // Sort by highest rank
          .slice(0, 3); // Take top 3
  };

  const displayBadges = getTopBadges();

  return (
    <aside className={`fixed md:static inset-y-0 left-0 z-50 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-in-out flex flex-col h-screen ${zenMode ? 'md:w-24' : 'md:w-80'}`}>
      
      {/* MIST BACKGROUND CONTAINER 
        Light Mode: Soft gradient from slate-50 to slate-100 with blur
        Dark Mode: Deep dark #0F172A
      */}
      <div className={`flex flex-col h-full m-0 md:m-4 rounded-none md:rounded-[2rem] bg-gradient-to-b from-slate-50/95 to-slate-100/95 dark:from-[#0F172A]/90 dark:to-[#0F172A]/90 backdrop-blur-2xl border-r md:border border-slate-200/60 dark:border-white/5 shadow-2xl md:shadow-xl overflow-hidden`}>
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between shrink-0">
          <div className={`flex items-center gap-3 transition-all duration-300 ${zenMode ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0"><Rocket size={20} className="fill-white/20"/></div>
            {!zenMode && <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">Teen<span className="text-indigo-600">VerseHub</span></span>}
          </div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden text-slate-400 hover:text-red-500"><X size={24}/></button>
        </div>

        {/* User Profile Snippet */}
        {!zenMode && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 mb-3">
               <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-900 overflow-hidden shadow-sm">
                     <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{user.name ? user.name[0] : <User size={20}/>}</div>
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white dark:border-gray-900">Lv.{userLevel}</div>
               </div>
               <div className="overflow-hidden">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate flex items-center gap-1">{user.name?.split(' ')[0] || 'User'} {badges.some(b => b.name === 'Verified Teen') && <ShieldCheck size={12} className="text-blue-500"/>}</h3>
                   <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">{user.type || user.role} Account</p>
               </div>
            </div>
            
            {/* ENERGY BAR */}
            {!isClient && (
              <div className="flex items-center gap-2 mb-3 bg-white/80 dark:bg-white/5 p-2 rounded-lg border border-slate-200/60 dark:border-white/5">
                 <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-md text-amber-500">
                    <Zap size={14} fill="currentColor"/>
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-slate-500 dark:text-gray-400">
                       <span>Energy</span>
                       <span>{energy}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(energy / 20) * 100}%` }}></div>
                    </div>
                 </div>
              </div>
            )}
            
            {/* 🚀 FILTERED BADGES SECTION */}
            <div className="flex flex-wrap gap-1.5 mb-3">
               {displayBadges.length > 0 ? (
                 displayBadges.map((b, i) => (
                   <BadgeItem key={i} name={b.name} iconName={b.icon} />
                 ))
               ) : (
                 <span className="text-[10px] text-slate-400 italic">No badges earned yet.</span>
               )}
               {badges.length > 3 && <span className="text-[10px] text-slate-400 font-bold ml-1 self-center">+{badges.length - 3}</span>}
            </div>
            
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider"><span>XP Progress</span><span>{Math.round(progressPercent)}%</span></div>
               <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div></div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
           {zenMode ? (
             <div className="flex flex-col items-center gap-4">
               {['overview', 'jobs', 'messages', !isClient && 'pricing', !isClient && 'academy'].filter(Boolean).map(t => (
                 <button key={t} onClick={() => setTab(t)} className={`p-3 rounded-2xl transition-all ${tab===t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-white hover:shadow-sm dark:hover:bg-white/5'}`}>
                   {t === 'overview' && <LayoutDashboard size={20}/>}
                   {t === 'jobs' && <Briefcase size={20}/>}
                   {t === 'messages' && <MessageSquare size={20}/>}
                   {t === 'pricing' && <Crown size={20}/>}
                   {t === 'academy' && <BookOpen size={20}/>}
                   {t === 'profile' && <UserCircle size={20}/>}
                 </button>
               ))}
             </div>
           ) : (
             <>
               <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
               
               <div className="mt-6 mb-2 px-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Workspace</div>
               <SidebarItem id="jobs" icon={Briefcase} label={isClient ? 'Browse Services' : 'Find Jobs'} />
               {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Listings" />}
               {isClient && <SidebarItem id="pricing" icon={Crown} label="Pricing & Fees" />}
               {!isClient && <SidebarItem id="my-services" icon={Package} label="My Gigs" />}
               <SidebarItem id="applications" icon={FileText} label="Orders & Jobs" />
               
               <SidebarItem id="messages" icon={MessageSquare} label="Messages" badge="New" /> 
              
               {!isClient && (
                <>
                  <div className="mt-6 mb-2 px-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Growth</div>
                  <SidebarItem id="profile" icon={UserCircle} label="My Profile" color="text-pink-500" />
                  <SidebarItem id="pricing" icon={Crown} label="Level Up" color="text-amber-500" />
                  <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                  <SidebarItem id="resume" icon={FileText} label="Resume Builder" color="text-pink-500" badge="New" /> 
                  <SidebarItem id="profile-card" icon={Share2} label="Share Profile" />
                </>
               )}
               
               <div className="mt-6 mb-2 px-4 text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">System</div>
               <SidebarItem id="records" icon={ShieldCheck} label="My Records" />
               {/* 🚀 NEW SUPPORT TAB */}
<SidebarItem id="support" icon={HelpCircle} label="Help & Community" color="text-indigo-500" />
               <SidebarItem id="settings" icon={Settings} label="Settings" />
             </>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-md">
           <div className="flex gap-2">
              <button onClick={() => setZenMode(!zenMode)} className="flex-1 flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm dark:hover:shadow-none transition-all">{zenMode ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}</button>
              <button onClick={onLogout} className="flex-1 flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 hover:shadow-sm dark:hover:bg-red-900/20 dark:hover:shadow-none transition-all"><LogOut size={18}/></button>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;