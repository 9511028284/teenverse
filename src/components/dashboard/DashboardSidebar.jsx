import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowLeftRight,
  Briefcase,
  ChevronDown,
  Crown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Rocket,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  User,
  UserCircle,
  WandSparkles,
  X,
  Zap
} from 'lucide-react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const PLATFORM_NAME = 'TeenVerseHub';

const SidebarItem = ({
  id,
  icon: Icon,
  label,
  count,
  badge,
  tab,
  setTab,
  setMenuOpen,
  zenMode,
}) => {
  const isActive = tab === id;

  // Contextual icon accents matching the main tab design architecture
  const getDynamicColors = () => {
    if (!isActive) return 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white';
    const mapping = {
      'overview': 'text-indigo-600 dark:text-indigo-400',
      'jobs': 'text-sky-500 dark:text-sky-400',
      'applications': 'text-blue-500 dark:text-blue-400',
      'messages': 'text-fuchsia-500 dark:text-fuchsia-400',
      'posted-jobs': 'text-violet-500 dark:text-violet-400',
      'my-services': 'text-teal-500 dark:text-teal-400',
      'academy': 'text-emerald-500 dark:text-emerald-400',
      'store': 'text-pink-500 dark:text-pink-400',
      'pricing': 'text-amber-500 dark:text-amber-400',
    };
    return mapping[id] || 'text-indigo-600 dark:text-indigo-400';
  };

  return (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setMenuOpen(false);
      }}
      aria-current={isActive ? 'page' : undefined}
      title={zenMode ? label : undefined}
      className={cx(
        'group relative flex min-h-[46px] w-full items-center text-left font-bold text-sm tracking-tight outline-none transition-all duration-300 rounded-2xl relative',
        zenMode ? 'justify-center px-0' : 'gap-3 px-4 py-2.5',
        isActive
          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800/80 dark:text-white border border-slate-200/50 dark:border-white/[0.04] shadow-sm'
          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30 dark:hover:text-slate-200'
      )}
    >
      {/* Dynamic Colored Active Indicator line */}
      {isActive && !zenMode && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-2 w-1 h-5 rounded-full bg-indigo-500 dark:bg-indigo-400"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span className={cx('flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105', getDynamicColors())}>
        <Icon size={zenMode ? 22 : 18} strokeWidth={isActive ? 2.5 : 2} />
      </span>

      {!zenMode && (
        <>
          <span className={cx('min-w-0 flex-1 truncate font-semibold', isActive ? 'font-bold' : '')}>{label}</span>

          {count !== undefined && count !== null && (
            <span className={cx(
              'rounded-xl px-2.5 py-0.5 text-[11px] font-bold shadow-inner border border-slate-200/40 dark:border-white/[0.02]',
              isActive ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200/50 dark:bg-slate-950/60 text-slate-500'
            )}>
              {count}
            </span>
          )}

          {badge && (
            <span className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-sm animate-pulse">
              {badge}
            </span>
          )}
        </>
      )}

      {/* Zen Mode Hover Tooltip */}
      {zenMode && (
        <div className="pointer-events-none absolute left-[74px] z-[80] translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <div className="whitespace-nowrap rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-xl backdrop-blur-md">
            {label}
          </div>
        </div>
      )}
    </button>
  );
};

const SectionLabel = ({ children, zenMode }) => (
  <div className={cx(
    'mb-1.5 mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500/80',
    zenMode ? 'text-center' : 'px-4'
  )}>
    {zenMode ? '•••' : children}
  </div>
);

const DashboardSidebar = ({
  user = {},
  isClient,
  badges = [],
  userLevel = 1,
  progressPercent = 0,
  menuOpen,
  setMenuOpen,
  zenMode,
  setZenMode,
  tab,
  setTab,
  onLogout,
  onSwitchDashboardRole,
  roleSwitching,
  energy = 0,
  jobsCount = 0,
  applicationsCount = 0,
}) => {
  const firstName = user?.name?.split(' ')?.[0] || 'User';
  const initial = user?.name?.[0]?.toUpperCase() || <User size={16} />;
  const profileTarget = isClient ? 'settings' : 'profile';
  const safeProgress = Math.max(0, Math.min(100, Number(progressPercent) || 0));
  const switchTargetRole = isClient ? 'freelancer' : 'client';
  const isSwitchingThisRole = roleSwitching === switchTargetRole;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth < 768 && zenMode) setZenMode(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zenMode, setZenMode]);

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'jobs', icon: WandSparkles, label: isClient ? 'HireGenie' : 'Explore Gigs', count: isClient ? jobsCount : undefined },
    { id: 'applications', icon: FileText, label: 'Applications', count: applicationsCount || undefined },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: 'Live' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const workspaceItems = isClient
    ? [
        { id: 'posted-jobs', icon: ListChecks, label: 'My Listings', count: jobsCount },
        { id: 'pricing', icon: Crown, label: 'Fee Structures' },
        { id: 'portfolio', icon: Briefcase, label: 'Showcase Hub' },
        { id: 'store', icon: ShoppingBag, label: 'Store' },
      ]
    : [
        { id: 'my-services', icon: Package, label: 'My Hub' },
        { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
        { id: 'store', icon: ShoppingBag, label: 'Store' },
        { id: 'profile', icon: UserCircle, label: 'Public Space' },
        { id: 'pricing', icon: Crown, label: 'Level Up' },
        { id: 'academy', icon: BookOpen, label: 'Academy Modules' },
        { id: 'resume', icon: FileText, label: 'AI Resume Engine', badge: 'New' },
        { id: 'profile-card', icon: Share2, label: 'Share Identity' },
      ];

  const systemItems = [
    { id: 'records', icon: ShieldCheck, label: 'Ledger Records' },
    { id: 'support', icon: HelpCircle, label: 'Help Desk' },
  ];

  const navProps = { tab, setTab, setMenuOpen, zenMode };

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/20 dark:bg-black/40 backdrop-blur-md md:hidden w-full h-full border-none outline-none"
          />
        )}
      </AnimatePresence>

      <aside className={cx(
        'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col transition-all duration-300 ease-out md:static md:translate-x-0',
        menuOpen ? 'translate-x-0' : '-translate-x-full',
        zenMode ? 'w-[280px] md:w-[88px]' : 'w-[280px] md:w-[300px]'
      )}>
        
        {/* Main Side Deck Frame */}
        <div className={cx(
          'relative flex h-full flex-col overflow-hidden transition-all duration-300',
          'border-r border-slate-200/60 bg-white/80 text-slate-900 backdrop-blur-xl',
          'dark:border-white/[0.04] dark:bg-slate-900/60 dark:text-slate-100',
          'md:my-4 md:ml-4 md:mr-0 md:rounded-[28px] md:border md:shadow-sm'
        )}>
          
          {/* Deck Header */}
          <div className={cx(
            'relative z-10 flex shrink-0 items-center px-5 pb-2 pt-5',
            zenMode ? 'justify-center md:px-0' : 'justify-between'
          )}>
            <button
              type="button"
              onClick={() => zenMode && setZenMode(false)}
              className="flex min-w-0 items-center gap-3 rounded-2xl outline-none group text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-105">
                <Rocket size={16} className="drop-shadow-sm" />
              </span>

              {!zenMode && (
                <span className="min-w-0">
                  <span className="block truncate text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {PLATFORM_NAME}
                  </span>
                </span>
              )}
            </button>

            {!zenMode && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setZenMode(true)}
                  aria-label="Collapse sidebar"
                  className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 md:flex transition-colors"
                >
                  <PanelLeftClose size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 md:hidden transition-colors"
                  aria-label="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {zenMode && (
            <button
              type="button"
              onClick={() => setZenMode(false)}
              className="relative z-10 mx-auto mt-2 hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 md:flex transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {/* Scrolling Index Core */}
          <nav className={cx(
            'relative z-10 flex-1 overflow-y-auto pb-4 pt-2',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            zenMode ? 'px-2' : 'px-3'
          )}>
            <SectionLabel zenMode={zenMode}>Menu</SectionLabel>
            <div className="space-y-0.5">
              {menuItems.map((item) => <SidebarItem key={item.id} {...item} {...navProps} />)}
            </div>

            <SectionLabel zenMode={zenMode}>
              {isClient ? 'Enterprise Hub' : 'Ecosystem Stage'}
            </SectionLabel>
            <div className="space-y-0.5">
              {workspaceItems.map((item) => <SidebarItem key={item.id} {...item} {...navProps} />)}
            </div>

            <SectionLabel zenMode={zenMode}>Core Protocol</SectionLabel>
            <div className="space-y-0.5">
              {systemItems.map((item) => <SidebarItem key={item.id} {...item} {...navProps} />)}
            </div>
          </nav>

          {/* Interactive Dynamic Action Base */}
          <div className={cx('relative z-10 shrink-0 pb-4 border-t border-slate-100 dark:border-white/[0.03] pt-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md', zenMode ? 'px-2' : 'px-3')}>
            {!zenMode ? (
              <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 p-3 dark:border-white/[0.03] dark:bg-slate-950/40 shadow-inner">
                <button
                  type="button"
                  onClick={() => setTab(profileTarget)}
                  className="flex w-full items-center gap-2.5 text-left outline-none group rounded-xl"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200 shadow-sm border border-slate-300/30 dark:border-white/[0.04]">
                    {initial}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {firstName}
                    </span>
                    <span className="block truncate text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                      {user?.email || (isClient ? 'Manager Account' : `Tier Level ${userLevel}`)}
                    </span>
                  </span>

                  <ChevronDown size={14} className="shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>

                {!isClient && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/30 dark:border-white/[0.02]">
                    <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      <span>Ecosystem Progress</span>
                      <span>{safeProgress}%</span>
                    </div>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm transition-all duration-500 ease-out"
                        style={{ width: `${safeProgress}%` }}
                      />
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTab(profileTarget)}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white shadow-sm transition hover:scale-105"
                title={firstName}
              >
                {initial}
              </button>
            )}

            {/* Micro Gamified Tracker Elements */}
            {!zenMode && (
              <div className="mt-2 flex gap-1.5">
                {!isClient && (
                  <div className="flex flex-1 items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-white/[0.02] px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Zap size={10} className="fill-amber-500 text-amber-500 animate-pulse"/> Energy</span>
                    <span className="text-slate-950 dark:text-white font-mono">{energy}</span>
                  </div>
                )}

                {badges.length > 0 && (
                  <div className="flex flex-1 items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-white/[0.02] px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    <span className="text-slate-500 dark:text-slate-400">Badges</span>
                    <span className="text-slate-950 dark:text-white font-mono">{badges.length}</span>
                  </div>
                )}
              </div>
            )}

          

            {/* Disconnect System Trigger */}
            <button
              type="button"
              onClick={onLogout}
              className={cx(
                'mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all',
                zenMode ? 'h-9 px-0' : 'px-3'
              )}
              title={zenMode ? 'Log out' : undefined}
            >
              <LogOut size={13} />
              {!zenMode && <span>Disconnect Portal</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;