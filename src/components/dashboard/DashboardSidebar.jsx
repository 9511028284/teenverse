import React from 'react';
import { 
  Rocket, X, User, ShieldCheck, Maximize2, Minimize2, LogOut, ChevronRight,
  LayoutDashboard, Briefcase, ListChecks, Package, FileText, MessageSquare,
  BookOpen, Sparkles, Share2, Settings
} from 'lucide-react';
import BadgeItem from './BadgeItem'; // Ensure path is correct

const DashboardSidebar = ({ 
  user, isClient, badges, userLevel, progressPercent, 
  menuOpen, setMenuOpen, zenMode, setZenMode, tab, setTab, onLogout 
}) => {
  
  const SidebarItem = ({ id, icon: Icon, label, color }) => (
    <button 
      onClick={() => {setTab(id); setMenuOpen(false);}} 
      className={`group relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${tab === id ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'}`}
    >
      <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${tab === id ? 'text-white' : color || ''}`} />
      {!zenMode && (
        <> <span className="flex-1 text-left">{label}</span> {tab === id && <ChevronRight size={14} className="opacity-80 animate-pulse"/>} </>
      )}
    </button>
  );

  return (
    <aside className={`fixed md:static inset-y-0 left-0 z-50 transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-in-out flex flex-col h-screen ${zenMode ? 'md:w-24' : 'md:w-80'}`}>
      <div className={`flex flex-col h-full m-0 md:m-4 rounded-none md:rounded-3xl bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-r md:border border-gray-200 dark:border-white/5 shadow-2xl md:shadow-xl overflow-hidden`}>
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between shrink-0">
          <div className={`flex items-center gap-3 transition-all duration-300 ${zenMode ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0"><Rocket size={20} className="fill-white/20"/></div>
            {!zenMode && <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Teen<span className="text-indigo-600">VerseHub</span></span>}
          </div>
          <button onClick={() => setMenuOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24}/></button>
        </div>

        {/* User Profile Snippet */}
        {!zenMode && (
          <div className="mx-4 mt-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5 group hover:border-indigo-100 transition-colors">
            <div className="flex items-center gap-3 mb-3">
               <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 p-0.5 ring-2 ring-indigo-100 dark:ring-indigo-900 overflow-hidden">
                     <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{user.name ? user.name[0] : <User size={20}/>}</div>
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white dark:border-gray-900">Lv.{userLevel}</div>
               </div>
               <div className="overflow-hidden">
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1">{user.name?.split(' ')[0] || 'User'} {badges.some(b => b.name === 'Verified Teen') && <ShieldCheck size={12} className="text-blue-500"/>}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.type} Account</p>
               </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
               {badges.length > 0 ? (
                 badges.slice(0, 3).map((b, i) => (
                   <BadgeItem key={i} name={b.name} iconName={b.icon} />
                 ))
               ) : (
                 <span className="text-[10px] text-gray-400 italic">No badges earned yet.</span>
               )}
               {badges.length > 3 && <span className="text-[10px] text-gray-400">+{badges.length - 3} more</span>}
            </div>
            
             <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider"><span>XP Progress</span><span>{Math.round(progressPercent)}%</span></div>
               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden"><div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div></div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
           {zenMode ? (
             <div className="flex flex-col items-center gap-4">
               {['overview', 'jobs', 'messages', !isClient && 'academy'].filter(Boolean).map(t => (
                 <button key={t} onClick={() => setTab(t)} className={`p-3 rounded-2xl transition-all ${tab===t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                   {t === 'overview' && <LayoutDashboard size={20}/>}
                   {t === 'jobs' && <Briefcase size={20}/>}
                   {t === 'messages' && <MessageSquare size={20}/>}
                   {t === 'academy' && <BookOpen size={20}/>}
                 </button>
               ))}
             </div>
           ) : (
             <>
               <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" />
               <div className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Workspace</div>
               <SidebarItem id="jobs" icon={Briefcase} label={isClient ? 'Browse Services' : 'Find Jobs'} />
               {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Listings" />}
               {!isClient && <SidebarItem id="my-services" icon={Package} label="My Gigs" />}
               <SidebarItem id="applications" icon={FileText} label="Orders & Jobs" />
               <SidebarItem id="messages" icon={MessageSquare} label="Messages" />
               {!isClient && (
                <>
                  <div className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Growth</div>
                  <SidebarItem id="academy" icon={BookOpen} label="Academy" />
                  <SidebarItem id="portfolio" icon={Sparkles} label="AI Portfolio" color="text-violet-500" />
                  <SidebarItem id="profile-card" icon={Share2} label="Share Profile" />
                </>
               )}
               <div className="mt-6 mb-2 px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">System</div>
               <SidebarItem id="records" icon={ShieldCheck} label="My Records" />
               <SidebarItem id="settings" icon={Settings} label="Settings" />
             </>
           )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
           <div className="flex gap-2">
              <button onClick={() => setZenMode(!zenMode)} className="flex-1 flex items-center justify-center p-2 rounded-xl text-gray-500 hover:bg-white dark:hover:bg-white/10 transition-colors">{zenMode ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}</button>
              <button onClick={onLogout} className="flex-1 flex items-center justify-center p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut size={18}/></button>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;