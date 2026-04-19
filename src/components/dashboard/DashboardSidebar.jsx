import React from 'react';
import { 
  Rocket, X, User, ShieldCheck, LogOut, ChevronRight, ChevronLeft,
  LayoutDashboard, Briefcase, ListChecks, Package, FileText, MessageSquare,
  BookOpen, Share2, UserCircle, Settings, Zap, Crown, HelpCircle, WandSparkles,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import BadgeItem from './BadgeItem'; // Ensure this path matches your project structure

const DashboardSidebar = ({ 
  user, isClient, badges, userLevel, progressPercent, 
  menuOpen, setMenuOpen, zenMode, setZenMode, tab, setTab, onLogout, energy 
}) => {
  
  // 🚀 UNIFIED SIDEBAR ITEM
  const SidebarItem = ({ id, icon: Icon, label, color, badge }) => {
    const isActive = tab === id;
    
    return (
      <button 
        onClick={() => {setTab(id); setMenuOpen(false);}} 
        className={`group relative flex items-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          zenMode 
            ? 'w-12 h-12 justify-center mx-auto rounded-2xl' 
            : 'w-full gap-3 px-4 py-3.5 rounded-2xl'
        } ${
          isActive 
            ? 'bg-white text-indigo-700 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 ring-1 ring-slate-900/5 ' +
              'dark:bg-[#0F172A] dark:text-white dark:shadow-lg dark:shadow-indigo-500/20 dark:border-white/10 dark:ring-0 ' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white ' + 
              (!zenMode && 'hover:translate-x-1')
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full shadow-sm" />
        )}
        
        <Icon size={zenMode ? 22 : 18} className={`transition-transform duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-110' : `group-hover:scale-110 ${color || ''}`}`} />
        
        {!zenMode && (
          <> 
            <span className="flex-1 text-left text-sm font-bold">{label}</span> 
            {badge && (
               <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md shadow-pink-500/20 tracking-wide">
                 {badge}
               </span>
            )}
            {isActive && <ChevronRight size={14} className="opacity-80 animate-pulse text-indigo-400 dark:text-white/80"/>} 
          </>
        )}

        {/* 🌟 FLOATING TOOLTIP */}
        {zenMode && (
          <div className="absolute left-16 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
              {label}
              {badge && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
            </div>
          </div>
        )}
      </button>
    );
  };

  const getTopBadges = () => {
      const rankMap = {
          'Elite': 100, 'Pro': 90, 'Starter': 80, 'Verified': 70,
          'Verified Teen': 70, 'Parent Approved': 60, 'KYC Completed': 50,
          'Night Owl': 40, 'Weekend Warrior': 40, 'Early Adopter': 40,
          'First Gig': 30, 'Skill Certified': 10
      };
      return [...badges].sort((a, b) => (rankMap[b.name] || 0) - (rankMap[a.name] || 0)).slice(0, 3); 
  };
  const displayBadges = getTopBadges();

  return (
    <>
      <div 
        onClick={() => setMenuOpen(false)}
        className={`md:hidden fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <aside className={`fixed md:static inset-y-0 left-0 z-50 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col h-screen ${zenMode ? 'md:w-[88px]' : 'md:w-[300px] w-[280px]'}`}>
        
        {/* 🧊 PREMIUM GLASS CONTAINER */}
        <div className={`flex flex-col h-full m-0 md:m-4 rounded-r-3xl md:rounded-[2.5rem] bg-white/60 dark:bg-[#020617]/70 backdrop-blur-3xl border-r md:border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-2xl overflow-visible relative transition-all duration-400`}>
          
          {/* 🚀 THE EDGE TOGGLE (Sits on the right border) */}
          <button 
            onClick={() => setZenMode(!zenMode)}
            className="hidden md:flex absolute -right-4 top-12 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-white shadow-md z-50 transition-transform hover:scale-110 active:scale-95"
          >
            {zenMode ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
          </button>

          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-100/40 via-purple-50/40 to-transparent dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-transparent -z-10 pointer-events-none overflow-hidden rounded-t-[2.5rem]"></div>

          {/* Header */}
          <div 
            onClick={() => zenMode && setZenMode(false)} 
            className={`p-6 pb-2 flex items-center shrink-0 mt-2 transition-colors ${zenMode ? 'justify-center px-0 cursor-pointer hover:opacity-80' : 'justify-between cursor-default'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0 ring-2 ring-white/50 dark:ring-black/50">
                <Rocket size={22} className="fill-white/20"/>
              </div>
              {!zenMode && (
                <span className="font-black text-xl tracking-tight text-slate-800 dark:text-white truncate">
                  Teen<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-400">VerseHub</span>
                </span>
              )}
            </div>
            {!zenMode && (
              <button onClick={() => setMenuOpen(false)} className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 rounded-full">
                <X size={18} strokeWidth={3}/>
              </button>
            )}
          </div>

          {/* USER BENTO CARD */}
          {!zenMode ? (
            <div className="mx-4 mt-5 p-4 rounded-[1.5rem] bg-white/80 dark:bg-[#0F172A]/80 border border-white dark:border-white/5 group hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="relative">
                     <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 p-0.5 ring-2 ring-indigo-50 dark:ring-indigo-500/30 overflow-hidden shadow-sm group-hover:ring-indigo-200 transition-all">
                       <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg">
                         {user.name ? user.name[0] : <User size={20}/>}
                       </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border-2 border-white dark:border-[#0F172A] tracking-wide">
                       Lv.{userLevel}
                     </div>
                 </div>
                 <div className="overflow-hidden">
                     <h3 className="text-[15px] font-black text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                       {user.name?.split(' ')[0] || 'User'} 
                       {badges.some(b => b.name === 'Verified Teen') && <ShieldCheck size={14} className="text-blue-500 drop-shadow-sm"/>}
                     </h3>
                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize bg-slate-100 dark:bg-black/30 px-2 py-0.5 rounded-md inline-block mt-1">
                       {user.type || user.role}
                     </p>
                 </div>
              </div>
              
              {!isClient && (
                <div className="flex items-center gap-3 mb-4 bg-slate-50/50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 relative z-10">
                   <div className="bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded-lg text-amber-500 shadow-inner">
                      <Zap size={16} fill="currentColor"/>
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1.5 text-slate-500 dark:text-slate-400 tracking-wider">
                         <span>Energy</span>
                         <span className="text-amber-500 dark:text-amber-400">{energy}/20</span>
                      </div>
                      <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                         <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${(energy / 20) * 100}%` }}></div>
                      </div>
                   </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                 {displayBadges.length > 0 ? (
                   displayBadges.map((b, i) => (
                     <div key={i} className="hover:scale-105 transition-transform"><BadgeItem name={b.name} iconName={b.icon} /></div>
                   ))
                 ) : (
                   <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-lg">No badges yet 🌱</span>
                 )}
                 {badges.length > 3 && <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black ml-1 self-center bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg">+{badges.length - 3}</span>}
              </div>
              
               <div className="space-y-1.5 relative z-10">
                 <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                   <span>XP Progress</span>
                   <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="w-full bg-slate-200/60 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                   <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700 ease-out" style={{width: `${progressPercent}%`}}></div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-6 mb-4 relative cursor-pointer group" onClick={() => setTab('profile')}>
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-500/30 overflow-hidden shadow-md group-hover:scale-110 transition-transform">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg">
                    {user.name ? user.name[0] : <User size={20}/>}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 w-4 h-4 rounded-full border-2 border-white dark:border-[#020617]"></div>
            </div>
          )}

          {/* 🧭 NAVIGATION SCROLL AREA */}
          <div className={`flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar ${zenMode ? 'px-2' : 'px-4'}`}>
              
              <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
              
              <div className={`mt-6 mb-2 ${zenMode ? 'mx-auto w-6' : 'px-4 flex items-center gap-2'} text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest`}>
                 {!zenMode && <span>Workspace</span>}
                 <div className="h-[2px] rounded-full bg-slate-200 dark:bg-slate-800/50 flex-1"></div>
              </div>
              
              <SidebarItem id="jobs" icon={WandSparkles} label={isClient ? 'HireGenie' : 'Find Jobs'} />
              {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Listings" />}
              {isClient && <SidebarItem id="pricing" icon={Crown} label="Pricing & Fees" />}
              {!isClient && <SidebarItem id="my-services" icon={Package} label="My Gigs" />}
              <SidebarItem id="applications" icon={FileText} label="Orders & Jobs" />
              <SidebarItem id="messages" icon={MessageSquare} label="Messages" badge="New" /> 
            
              {!isClient && (
              <>
                <div className={`mt-6 mb-2 ${zenMode ? 'mx-auto w-6' : 'px-4 flex items-center gap-2'} text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest`}>
                  {!zenMode && <span>Growth</span>}
                  <div className="h-[2px] rounded-full bg-slate-200 dark:bg-slate-800/50 flex-1"></div>
                </div>
                <SidebarItem id="profile" icon={UserCircle} label="My Profile" color="text-pink-500 dark:text-pink-400" />
                <SidebarItem id="pricing" icon={Crown} label="Level Up" color="text-amber-500 dark:text-amber-400" />
                <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                <SidebarItem id="resume" icon={FileText} label="Resume Builder" color="text-pink-500 dark:text-pink-400" badge="AI" /> 
                <SidebarItem id="profile-card" icon={Share2} label="Share Profile" />
              </>
              )}
              
              <div className={`mt-6 mb-2 ${zenMode ? 'mx-auto w-6' : 'px-4 flex items-center gap-2'} text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest`}>
                {!zenMode && <span>System</span>}
                <div className="h-[2px] rounded-full bg-slate-200 dark:bg-slate-800/50 flex-1"></div>
              </div>
              <SidebarItem id="records" icon={ShieldCheck} label="My Records" />
              <SidebarItem id="support" icon={HelpCircle} label="Help & Support" color="text-indigo-500 dark:text-indigo-400" />
              <SidebarItem id="settings" icon={Settings} label="Settings" />
          </div>

          {/* Footer Actions */}
          <div className={`p-4 bg-white/40 dark:bg-white/5 backdrop-blur-md border-t border-slate-100 dark:border-white/5 ${zenMode ? 'flex flex-col gap-3' : 'flex gap-3'}`}>
              
              {/* Bottom Expand/Collapse button with explicit tooltip */}
              <button 
                onClick={() => setZenMode(!zenMode)} 
                className="hidden group md:flex flex-1 items-center justify-center p-3 rounded-2xl text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:hover:shadow-none transition-all active:scale-95 relative"
              >
                {zenMode ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}
                
                {zenMode && (
                  <div className="absolute left-16 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50">
                    <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      Expand Menu
                    </div>
                  </div>
                )}
              </button>

              <button 
                onClick={onLogout} 
                className="flex-1 group flex items-center justify-center p-3 rounded-2xl text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 shadow-sm shadow-rose-100/50 dark:shadow-none relative"
              >
                <LogOut size={18}/>
                {zenMode && (
                  <div className="absolute left-16 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50">
                    <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                      Log Out
                    </div>
                  </div>
                )}
              </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;