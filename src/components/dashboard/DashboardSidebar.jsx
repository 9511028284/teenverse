import React from 'react';
import {
  BookOpen,
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
        'group relative flex min-h-[48px] w-full items-center text-left font-bold text-[14px] tracking-tight outline-none transition-all duration-300 ease-out',
        'focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-offset-2',
        zenMode ? 'justify-center rounded-2xl px-0' : 'gap-3 rounded-2xl px-4 py-3',
        isActive
          ? 'bg-neutral-950 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.25),_0_8px_16px_rgba(0,0,0,0.15)] dark:bg-white dark:text-neutral-950 dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),_0_8px_16px_rgba(255,255,255,0.1)]'
          : 'text-neutral-600 hover:bg-white/50 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800/40 dark:hover:text-white'
      )}
    >
      <span
        className={cx(
          'flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-110',
          isActive ? 'text-white dark:text-neutral-950' : 'text-neutral-500 dark:text-neutral-400'
        )}
      >
        <Icon size={zenMode ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
      </span>

      {!zenMode && (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>

          {count !== undefined && count !== null && (
            <span
              className={cx(
                'rounded-full px-2.5 py-0.5 text-xs font-black transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
                isActive
                  ? 'bg-white/20 text-white dark:bg-neutral-950/10 dark:text-neutral-800'
                  : 'bg-neutral-200/60 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
              )}
            >
              {count}
            </span>
          )}

          {badge && (
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.4),_0_4px_8px_rgba(239,68,68,0.25)]">
              {badge}
            </span>
          )}
        </>
      )}

      {zenMode && (
        <div className="pointer-events-none absolute left-[64px] z-[80] translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <div className="whitespace-nowrap rounded-xl border border-white/20 bg-neutral-950/90 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90">
            {label}
          </div>
        </div>
      )}
    </button>
  );
};

const SectionLabel = ({ children, zenMode }) => (
  <div
    className={cx(
      'mb-2 mt-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500',
      zenMode ? 'text-center' : 'px-4'
    )}
  >
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
  energy = 0,
  jobsCount = 0,
  applicationsCount = 0,
}) => {
  const firstName = user?.name?.split(' ')?.[0] || 'User';
  const initial = user?.name?.[0]?.toUpperCase() || <User size={18} />;
  const profileTarget = isClient ? 'settings' : 'profile';
  const safeProgress = Math.max(0, Math.min(100, Number(progressPercent) || 0));

 React.useEffect(() => {
  if (typeof window === 'undefined') return;

  const handleResize = () => {
    if (window.innerWidth < 768 && zenMode) {
      setZenMode(false);
    }
  };

  handleResize();
  window.addEventListener('resize', handleResize);

  // Change "removeModifier" to "removeEventListener"
  return () => window.removeEventListener('resize', handleResize);
}, [zenMode, setZenMode]);

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    {
      id: 'jobs',
      icon: WandSparkles,
      label: isClient ? 'HireGenie' : 'Find Jobs',
      count: isClient ? jobsCount : undefined,
    },
    {
      id: 'applications',
      icon: FileText,
      label: 'Orders & Jobs',
      count: applicationsCount || undefined,
    },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: 'New' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const workspaceItems = isClient
    ? [
        { id: 'posted-jobs', icon: ListChecks, label: 'My Listings', count: jobsCount },
        { id: 'pricing', icon: Crown, label: 'Pricing & Fees' },
        { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
        { id: 'store', icon: ShoppingBag, label: 'Store' },
      ]
    : [
        { id: 'my-services', icon: Package, label: 'My Gigs' },
        { id: 'portfolio', icon: Briefcase, label: 'Portfolio' },
        { id: 'store', icon: ShoppingBag, label: 'Store' },
        { id: 'profile', icon: UserCircle, label: 'My Profile' },
        { id: 'pricing', icon: Crown, label: 'Level Up' },
        { id: 'academy', icon: BookOpen, label: 'Academy' },
        { id: 'resume', icon: FileText, label: 'Resume Builder', badge: 'AI' },
        { id: 'profile-card', icon: Share2, label: 'Share Profile' },
      ];

  const systemItems = [
    { id: 'records', icon: ShieldCheck, label: 'My Records' },
    { id: 'support', icon: HelpCircle, label: 'Help & Support' },
  ];

  const navProps = { tab, setTab, setMenuOpen, zenMode };

  return (
    <>
      {/* Overlay backdrop */}
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={() => setMenuOpen(false)}
        className={cx(
          'fixed inset-0 z-40 bg-neutral-950/20 backdrop-blur-md transition-opacity duration-300 md:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col transition-all duration-300 ease-out md:static md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
          zenMode ? 'w-[290px] md:w-[92px]' : 'w-[290px] md:w-[320px]'
        )}
      >
        {/* Main Panel - Glassmorphic Base */}
        <div
          className={cx(
            'relative flex h-full flex-col overflow-hidden transition-all duration-200',
            'border-r border-white/40 bg-white/70 text-neutral-950 backdrop-blur-xl',
            'dark:border-neutral-800/40 dark:bg-neutral-900/60 dark:text-white',
            'md:m-4 md:rounded-[32px] md:border md:shadow-[0_20px_50px_rgba(0,0,0,0.05)]'
          )}
        >
          {/* Header */}
          <div
            className={cx(
              'relative z-10 flex shrink-0 items-center px-5 pb-2 pt-6',
              zenMode ? 'justify-center md:px-0' : 'justify-between'
            )}
          >
            <button
              type="button"
              onClick={() => zenMode && setZenMode(false)}
              className="flex min-w-0 items-center gap-3 rounded-2xl outline-none"
              aria-label={zenMode ? 'Expand sidebar' : PLATFORM_NAME}
            >
              {/* Claymorphic Rocket Badge */}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white shadow-[inset_0_3px_5px_rgba(255,255,255,0.4),_0_8px_16px_rgba(239,68,68,0.3)] transition-transform duration-300 hover:scale-105">
                <Rocket size={20} strokeWidth={2.5} className="drop-shadow-sm" />
              </span>

              {!zenMode && (
                <span className="min-w-0 text-left">
                  <span className="block truncate text-[20px] font-black tracking-tight text-neutral-950 dark:text-white">
                    {PLATFORM_NAME}
                  </span>
                  
                </span>
              )}
            </button>

            {!zenMode && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZenMode(true)}
                  aria-label="Collapse sidebar"
                  className="hidden h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/60 hover:text-neutral-950 dark:hover:bg-neutral-800/60 dark:hover:text-white md:flex"
                >
                  <PanelLeftClose size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/60 hover:text-neutral-950 dark:hover:bg-neutral-800/60 dark:hover:text-white md:hidden"
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {zenMode && (
            <button
              type="button"
              onClick={() => setZenMode(false)}
              className="relative z-10 mx-auto mt-2 hidden h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/60 hover:text-neutral-950 dark:hover:bg-neutral-800/60 dark:hover:text-white md:flex"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}

          {/* Navigation Items */}
          <nav
            className={cx(
              'relative z-10 flex-1 overflow-y-auto pb-4 pt-2',
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              zenMode ? 'px-3' : 'px-4'
            )}
          >
            <SectionLabel zenMode={zenMode}>Menu</SectionLabel>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <SidebarItem key={item.id} {...item} {...navProps} />
              ))}
            </div>

            <SectionLabel zenMode={zenMode}>
              {isClient ? 'Projects' : 'Workspace'}
            </SectionLabel>
            <div className="space-y-1">
              {workspaceItems.map((item) => (
                <SidebarItem key={item.id} {...item} {...navProps} />
              ))}
            </div>

            <SectionLabel zenMode={zenMode}>System</SectionLabel>
            <div className="space-y-1">
              {systemItems.map((item) => (
                <SidebarItem key={item.id} {...item} {...navProps} />
              ))}
            </div>
          </nav>

          {/* Footer Card Container */}
          <div className={cx('relative z-10 shrink-0 pb-5', zenMode ? 'px-3' : 'px-4')}>
            {!zenMode ? (
              /* Profile Card - Claymorphic Treatment */
              <div className="rounded-[24px] border border-white bg-neutral-100/60 p-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),_0_12px_24px_rgba(0,0,0,0.02)] dark:border-neutral-800/50 dark:bg-neutral-800/40 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),_0_12px_24px_rgba(0,0,0,0.15)]">
                <button
                  type="button"
                  onClick={() => setTab(profileTarget)}
                  className="flex w-full items-center gap-3 text-left outline-none rounded-xl"
                >
                  {/* Clay Avatar Ring */}
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-black text-neutral-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] dark:bg-neutral-700 dark:text-neutral-200 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                    {initial}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-black text-neutral-950 dark:text-white">
                      {firstName}
                    </span>
                    <span className="block truncate text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {user?.email || user?.phone || (isClient ? 'Client Account' : `Level ${userLevel}`)}
                    </span>
                  </span>

                  <ChevronDown size={16} className="shrink-0 text-neutral-400" />
                </button>

                {!isClient && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      <span>XP Progress</span>
                      <span>{safeProgress}%</span>
                    </div>

                    <span className="block h-2 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800">
                      <span
                        className="block h-full rounded-full bg-neutral-950 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] transition-all duration-500 ease-out dark:bg-white"
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
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-sm font-black text-neutral-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] transition hover:scale-105 dark:bg-neutral-800 dark:text-white dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"
                title={firstName}
              >
                {initial}
              </button>
            )}

            {/* Sub-stats block */}
            {!zenMode && (
              <div className="mt-2 flex gap-2">
                {!isClient && (
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-white bg-neutral-100/40 px-3 py-2 text-xs font-bold text-neutral-600 dark:border-neutral-800/40 dark:bg-neutral-800/20 dark:text-neutral-400">
                    <span>Energy</span>
                    <span className="text-neutral-950 dark:text-white">{energy}</span>
                  </div>
                )}

                {badges.length > 0 && (
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-white bg-neutral-100/40 px-3 py-2 text-xs font-bold text-neutral-600 dark:border-neutral-800/40 dark:bg-neutral-800/20 dark:text-neutral-400">
                    <span>Badges</span>
                    <span className="text-neutral-950 dark:text-white">{badges.length}</span>
                  </div>
                )}
              </div>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className={cx(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100/80 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:bg-red-950/20 dark:hover:text-red-400',
                zenMode ? 'h-11 px-0' : 'px-3'
              )}
              title={zenMode ? 'Log out' : undefined}
            >
              <LogOut size={15} />
              {!zenMode && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;