import React from 'react';
import { 
  Rocket, X, User, ShieldCheck, Maximize2, Minimize2, LogOut, ChevronRight,
  LayoutDashboard, Briefcase, ListChecks, Package, FileText, MessageSquare,
  BookOpen, Sparkles, Share2, Settings, UserCircle, Zap
} from 'lucide-react';
import BadgeItem from './BadgeItem'; // Ensure path is correct

const DashboardSidebar = ({ 
  user, isClient, badges, userLevel, progressPercent, 
  menuOpen, setMenuOpen, zenMode, setZenMode, tab, setTab, onLogout 
}) => {
  
  // --- COMPONENT: Sidebar Item ---
  const SidebarItem = ({ id, icon: Icon, label, color }) => {
    const isActive = tab === id;
    return (
      <button 
        onClick={() => {
          setTab(id); 
          setMenuOpen(false);
        }} 
        className={`group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ease-out
          ${isActive 
            ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] animate-gradient text-white shadow-lg shadow-indigo-500/40 ring-1 ring-white/20 scale-[1.02] translate-x-1' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white hover:pl-6'
          }`}
      >
        <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : color || ''}`} />
        {!zenMode && (
          <> 
            <span className="flex-1 text-left font-bold tracking-wide">{label}</span> 
            {isActive && <ChevronRight size={14} className="opacity-80 animate-pulse"/>} 
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* --- MAIN SIDEBAR --- */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) 
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col h-screen 
        ${zenMode ? 'w-24' : 'w-80'}`}
      >
        <div className={`flex flex-col h-full m-0 md:m-4 rounded-none md:rounded-3xl bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-2xl border-r md:border border-gray-200 dark:border-white/5 shadow-2xl md:shadow-xl overflow-hidden`}>
          
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between shrink-0">
            <div className={`flex items-center gap-3 transition-all duration-300 ${zenMode ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 hover:rotate-12 transition-transform duration-500 cursor-pointer">
                <Rocket size={20} className="fill-white/20"/>
              </div>
              {!zenMode && (
                <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">
                  Teen<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Verse</span>
                </span>
              )}
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={() => setMenuOpen(false)} 
              className="md:hidden p-2 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X size={20}/>
            </button>
          </div>

          {/* User Profile Snippet */}
          {!zenMode && (
            <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-transparent border border-gray-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

              <div className="flex items-center gap-3 mb-3 relative z-10">
                 <div className="relative">
                     <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-900 overflow-hidden">
                       <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                         {user.name ? user.name[0] : <User size={20}/>}
                       </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-md border border-white dark:border-gray-900 shadow-sm flex items-center gap-0.5">
                       <Zap size={8} className="fill-yellow-400 text-yellow-400"/> {userLevel}
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
              
               <div className="space-y-1.5 relative z-10">
                 <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                   <span>XP Progress</span><span>{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-gray-100 dark:border-white/5">
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
                     {/* Hover Tooltip */}
                     <span className="absolute left-14 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 pointer-events-none shadow-xl">
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
                    
                    {/* --- NEW PROFILE TAB HERE --- */}
                    <SidebarItem id="profile" icon={UserCircle} label="My Profile" color="text-pink-500" />
                    <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                    <SidebarItem id="portfolio" icon={Sparkles} label="AI Portfolio" color="text-violet-500" />
                    <SidebarItem id="profile-card" icon={Share2} label="Share Profile" />
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

          {/* Footer Actions */}
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