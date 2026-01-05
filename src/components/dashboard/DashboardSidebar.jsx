import React, { useState } from 'react';
import { 
  Rocket, X, User, ShieldCheck, Maximize2, Minimize2, LogOut, ChevronRight,
  LayoutDashboard, Briefcase, ListChecks, Package, FileText, MessageSquare,
  BookOpen, Sparkles, Share2, Settings, UserCircle, Grid, Menu as MenuIcon, Zap
} from 'lucide-react';
import BadgeItem from './BadgeItem'; // Ensure path is correct

const DashboardSidebar = ({ 
  user, isClient, badges, userLevel, progressPercent, 
  menuOpen, setMenuOpen, zenMode, setZenMode, tab, setTab, onLogout 
}) => {
  
  // Mobile specific state for the "Bento" menu overlay
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- COMPONENT: Desktop Sidebar Item ---
  const SidebarItem = ({ id, icon: Icon, label, color, isMobile }) => {
    const isActive = tab === id;
    return (
      <button 
        onClick={() => {
          setTab(id); 
          if(isMobile) setMobileMenuOpen(false);
          setMenuOpen(false);
        }} 
        className={`group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 
          ${isActive 
            ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 scale-[1.02]' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white hover:pl-5'
          }`}
      >
        <Icon size={isMobile ? 24 : 18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : color || ''}`} />
        {!zenMode && (
          <> 
            <span className="flex-1 text-left font-bold tracking-wide">{label}</span> 
            {isActive && <ChevronRight size={14} className="opacity-80 animate-pulse"/>} 
          </>
        )}
      </button>
    );
  };

  // --- MOBILE BOTTOM DOCK (The "Gen Z" Touch) ---
  const MobileDock = () => (
    <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm">
      <div className="flex justify-between items-center bg-black/80 dark:bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-4 shadow-2xl shadow-indigo-500/20">
        {[
          { id: 'overview', icon: LayoutDashboard },
          { id: 'jobs', icon: Briefcase },
          { id: 'messages', icon: MessageSquare },
          { id: 'profile', icon: UserCircle },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`relative p-2 rounded-full transition-all duration-300 ${tab === item.id ? 'bg-indigo-600 text-white -translate-y-2 shadow-lg shadow-indigo-600/50' : 'text-gray-400 hover:text-white'}`}
          >
            <item.icon size={22} />
            {tab === item.id && <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>}
          </button>
        ))}
        {/* Menu Trigger */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <Grid size={22} />
        </button>
      </div>
    </div>
  );

  // --- MOBILE FULL SCREEN OVERLAY (The "Bento Grid") ---
  const MobileOverlay = () => (
    <div className={`md:hidden fixed inset-0 z-[60] bg-[#0F172A]/95 backdrop-blur-3xl transition-all duration-500 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
      <div className="flex flex-col h-full p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><Rocket size={20} className="animate-bounce"/></div>
             <h2 className="text-2xl font-black text-white">Menu</h2>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-red-500/20 hover:text-red-500 transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* User Card - Widget Style */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 p-5 rounded-3xl mb-8 flex items-center gap-4">
           <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-0.5">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-white font-bold text-xl">
                 {user.name?.[0]}
              </div>
           </div>
           <div>
              <h3 className="text-white font-bold text-lg">{user.name}</h3>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-mono uppercase">
                 <Zap size={12} className="fill-indigo-300"/> Level {userLevel}
              </div>
           </div>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-2 gap-4">
           {/* Primary Actions */}
           <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Apps</div>
           
           {!isClient && (
             <button onClick={() => {setTab('academy'); setMobileMenuOpen(false);}} className="bg-gray-800/50 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-3 hover:bg-indigo-600/20 transition-colors">
               <BookOpen size={28} className="text-emerald-400"/>
               <span className="text-white font-medium">Academy</span>
             </button>
           )}
           
           <button onClick={() => {setTab('records'); setMobileMenuOpen(false);}} className="bg-gray-800/50 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-3 hover:bg-indigo-600/20 transition-colors">
               <ShieldCheck size={28} className="text-blue-400"/>
               <span className="text-white font-medium">Records</span>
           </button>

           <button onClick={() => {setTab('settings'); setMobileMenuOpen(false);}} className="col-span-2 bg-gray-800/50 border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:bg-indigo-600/20 transition-colors">
               <div className="p-2 bg-white/10 rounded-full"><Settings size={20} className="text-gray-300"/></div>
               <span className="text-white font-medium">Settings & Preferences</span>
               <ChevronRight className="ml-auto text-gray-500"/>
           </button>

           <div className="col-span-2 mt-4 pt-4 border-t border-white/10">
             <button onClick={onLogout} className="w-full p-4 bg-red-500/10 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all">
               <LogOut size={20}/> Sign Out
             </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <MobileDock />
      <MobileOverlay />

      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className={`hidden md:flex flex-col h-screen fixed md:static inset-y-0 left-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${zenMode ? 'w-24' : 'w-80'}`}>
        <div className={`flex flex-col h-full m-4 rounded-3xl bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden`}>
          
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between shrink-0">
            <div className={`flex items-center gap-3 transition-all duration-300 ${zenMode ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 hover:rotate-12 transition-transform">
                <Rocket size={20} className="fill-white/20"/>
              </div>
              {!zenMode && (
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                  Teen<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Verse</span>
                </span>
              )}
            </div>
          </div>

          {/* Profile Card (Desktop) */}
          {!zenMode && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-transparent border border-gray-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                 <div className="relative">
                     <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-900 overflow-hidden">
                       <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                         {user.name ? user.name[0] : <User size={20}/>}
                       </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-white dark:border-gray-900 shadow-sm">
                       LVL {userLevel}
                     </div>
                 </div>
                 <div className="overflow-hidden">
                     <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1">
                       {user.name?.split(' ')[0] || 'User'} 
                       {badges.some(b => b.name === 'Verified Teen') && <ShieldCheck size={12} className="text-blue-500"/>}
                     </h3>
                     <p className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">{user.type} Acct.</p>
                 </div>
              </div>
              
               <div className="space-y-1.5">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                   <span>XP Progress</span><span>{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2 overflow-hidden border border-gray-100 dark:border-white/5">
                   <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{width: `${progressPercent}%`}}></div>
                 </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar mask-image-b">
             {zenMode ? (
               <div className="flex flex-col items-center gap-4">
                 {['overview', 'jobs', 'messages', !isClient && 'academy', 'profile'].filter(Boolean).map(t => (
                   <button key={t} onClick={() => setTab(t)} className={`group relative p-3 rounded-2xl transition-all duration-300 ${tab===t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-indigo-500'}`}>
                     {t === 'overview' && <LayoutDashboard size={20}/>}
                     {t === 'jobs' && <Briefcase size={20}/>}
                     {t === 'messages' && <MessageSquare size={20}/>}
                     {t === 'academy' && <BookOpen size={20}/>}
                     {t === 'profile' && <UserCircle size={20}/>}
                     {/* Tooltip on Zen Mode */}
                     <span className="absolute left-14 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                       {t.charAt(0).toUpperCase() + t.slice(1)}
                     </span>
                   </button>
                 ))}
               </div>
             ) : (
               <>
                 <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
                 
                 <div className="mt-6 mb-3 px-4 flex items-center gap-2">
                   <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                   <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">Workspace</span>
                   <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                 </div>
                 
                 <SidebarItem id="jobs" icon={Briefcase} label={isClient ? 'Browse Services' : 'Find Jobs'} />
                 {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Listings" />}
                 {!isClient && <SidebarItem id="my-services" icon={Package} label="My Gigs" />}
                 <SidebarItem id="applications" icon={FileText} label="Orders & Jobs" />
                 <SidebarItem id="messages" icon={MessageSquare} label="Messages" />
                 
                 {!isClient && (
                  <>
                    <div className="mt-6 mb-3 px-4 flex items-center gap-2">
                      <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                      <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">Growth</span>
                      <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                    </div>
                    
                    <SidebarItem id="profile" icon={UserCircle} label="My Profile" color="text-pink-500" />
                    <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                    <SidebarItem id="portfolio" icon={Sparkles} label="AI Portfolio" color="text-violet-500" />
                  </>
                 )}
                 
                 <div className="mt-6 mb-3 px-4 flex items-center gap-2">
                    <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                    <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">System</span>
                    <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
                 </div>
                 
                 <SidebarItem id="records" icon={ShieldCheck} label="My Records" />
                 <SidebarItem id="settings" icon={Settings} label="Settings" />
               </>
             )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
             <div className="flex gap-2">
                <button onClick={() => setZenMode(!zenMode)} className="flex-1 flex items-center justify-center p-2 rounded-xl text-gray-500 hover:bg-white dark:hover:bg-white/10 transition-colors group">
                  {zenMode ? <Maximize2 size={18} className="group-hover:scale-110 transition-transform"/> : <Minimize2 size={18} className="group-hover:scale-110 transition-transform"/>}
                </button>
                <button onClick={onLogout} className="flex-1 flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
                </button>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;