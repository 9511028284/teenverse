import React from 'react';
import {
  Rocket,
  X,
  User,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  Package,
  FileText,
  MessageSquare,
  BookOpen,
  Share2,
  UserCircle,
  Settings,
  ShoppingBag,
  Zap,
  Crown,
  HelpCircle,
  WandSparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import BadgeItem from './BadgeItem';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const theme = {
  iconShell:
    'bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_45%,#0f766e_100%)] shadow-[0_18px_45px_rgba(99,102,241,0.28)] dark:shadow-[0_0_30px_rgba(99,102,241,0.4)]',
  active:
    'bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.82))] text-slate-950 border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04] dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.6),rgba(15,23,42,0.8))] dark:text-white dark:border-white/10 dark:shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] dark:ring-white/5',
  muted:
    'text-slate-500 hover:text-slate-950 hover:bg-white/58 hover:shadow-[0_12px_30px_rgba(15,23,42,0.055)] dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)]',
  cypressText: 'text-[#0f766e] dark:text-[#5eead4] dark:drop-shadow-[0_0_8px_rgba(94,234,212,0.4)]',
};

const SidebarItem = ({
  id,
  icon: Icon,
  label,
  color,
  badge,
  zenMode,
  tab,
  setTab,
  setMenuOpen,
}) => {
  const isActive = tab === id;

  return (
    <button
      type="button"
      onClick={() => {
        setTab(id);
        setMenuOpen(false);
      }}
      title={zenMode ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        'group relative flex items-center overflow-visible border border-transparent outline-none',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        zenMode
          ? 'mx-auto h-12 w-12 justify-center rounded-[1.15rem]'
          : 'min-h-[46px] w-full gap-3 rounded-[1.15rem] px-3.5 py-3',
        isActive ? theme.active : theme.muted,
        !isActive && !zenMode ? 'hover:translate-x-0.5' : ''
      )}
    >
      {isActive && (
        <>
          <span className="absolute inset-y-2 -left-2 w-1 rounded-r-full bg-[linear-gradient(180deg,#6366f1,#8b5cf6,#0f766e)] shadow-[0_0_18px_rgba(99,102,241,0.45)] dark:shadow-[0_0_20px_rgba(139,92,246,0.6)]" />
          <span className="absolute inset-0 -z-10 rounded-[1.15rem] bg-[radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.13),transparent_34%),radial-gradient(circle_at_82%_80%,rgba(15,118,110,0.12),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(45,212,191,0.1),transparent_45%)]" />
        </>
      )}

      <span
        className={cx(
          'flex shrink-0 items-center justify-center transition-all duration-300',
          zenMode ? 'h-9 w-9 rounded-xl' : 'h-8 w-8 rounded-xl',
          isActive
            ? 'bg-white/75 text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300 dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]'
            : `text-slate-400 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-teal-300 dark:group-hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] ${color || ''}`
        )}
      >
        <Icon size={zenMode ? 20 : 18} strokeWidth={2.15} className="transition-transform duration-300 group-hover:scale-110" />
      </span>

      {!zenMode && (
        <>
          <span className="min-w-0 flex-1 truncate text-left text-[13.5px] font-semibold tracking-[-0.01em]">
            {label}
          </span>

          {badge && (
            <span className="rounded-full bg-[linear-gradient(135deg,#fb7185,#ec4899)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(236,72,153,0.25)] dark:shadow-[0_0_12px_rgba(236,72,153,0.5)]">
              {badge}
            </span>
          )}

          {isActive && <ChevronRight size={15} className="text-indigo-400 dark:text-teal-300 dark:drop-shadow-[0_0_5px_rgba(94,234,212,0.5)]" />}
        </>
      )}

      {zenMode && (
        <div className="pointer-events-none absolute left-16 z-50 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <div className="relative flex items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/92 px-3 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl dark:border-indigo-500/30 dark:bg-slate-900/95 dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            {label}
            {badge && <span className="h-1.5 w-1.5 rounded-full bg-pink-400 dark:shadow-[0_0_8px_rgba(244,114,182,0.8)]" />}
          </div>
        </div>
      )}
    </button>
  );
};

const SectionLabel = ({ children, zenMode }) => (
  <div
    className={cx(
      'mb-2 mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500',
      zenMode ? 'mx-auto w-7 justify-center px-0' : 'px-4'
    )}
  >
    {!zenMode && <span className="shrink-0">{children}</span>}
    <span className="h-px flex-1 rounded-full bg-[linear-gradient(90deg,rgba(148,163,184,0.5),rgba(15,118,110,0.28),transparent)] dark:bg-[linear-gradient(90deg,rgba(99,102,241,0.3),rgba(45,212,191,0.2),transparent)]" />
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
}) => {
  const navProps = { zenMode, tab, setTab, setMenuOpen };
  const safeProgress = Math.max(0, Math.min(100, Number(progressPercent) || 0));
  const energyPercent = Math.max(0, Math.min(100, (Number(energy) || 0) * 5));

  const getTopBadges = () => {
    const rankMap = {
      Elite: 100,
      Pro: 90,
      Starter: 80,
      Verified: 70,
      'Verified Teen': 70,
      'Parent Approved': 60,
      'KYC Completed': 50,
      'Night Owl': 40,
      'Weekend Warrior': 40,
      'Early Adopter': 40,
      'First Gig': 30,
      'Skill Certified': 10,
    };

    return [...badges]
      .sort((a, b) => (rankMap[b.name] || 0) - (rankMap[a.name] || 0))
      .slice(0, 3);
  };

  const displayBadges = getTopBadges();
  const firstName = user?.name?.split(' ')?.[0] || 'User';
  const initial = user?.name?.[0]?.toUpperCase() || <User size={18} />;

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={() => setMenuOpen(false)}
        className={cx(
          'fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-md transition-opacity duration-300 md:hidden dark:bg-black/70',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
          zenMode ? 'md:w-[92px]' : 'w-[292px] md:w-[316px]'
        )}
      >
        <div
          className={cx(
            'relative m-0 flex h-full flex-col overflow-visible rounded-r-[2rem] border-r border-white/70',
            'bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(248,250,252,0.72)_48%,rgba(237,249,247,0.7))]',
            'shadow-[18px_0_70px_rgba(15,23,42,0.08)] backdrop-blur-3xl',
            'dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(9,9,11,0.85),rgba(15,23,42,0.75)_50%,rgba(2,25,24,0.65))] dark:shadow-[18px_0_70px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.05)]',
            'md:m-4 md:rounded-[2rem] md:border'
          )}
        >
          {/* Enhanced Dark Mode Ambient Orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-r-[2rem] md:rounded-[2rem]">
            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-indigo-200/45 blur-3xl dark:bg-indigo-600/25 dark:blur-[100px]" />
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-teal-200/45 blur-3xl dark:bg-teal-500/20 dark:blur-[100px]" />
            <div className="absolute bottom-12 left-10 h-44 w-44 rounded-full bg-fuchsia-100/55 blur-3xl dark:bg-fuchsia-600/15 dark:blur-[80px]" />
          </div>

          <button
            type="button"
            onClick={() => setZenMode(!zenMode)}
            aria-label={zenMode ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-4 top-10 z-[60] hidden h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/85 text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all hover:scale-105 hover:text-indigo-600 active:scale-95 dark:border-white/15 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:text-teal-300 dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] md:flex"
          >
            {zenMode ? <ChevronRight size={17} strokeWidth={2.35} /> : <ChevronLeft size={17} strokeWidth={2.35} />}
          </button>

          <div
            onClick={() => zenMode && setZenMode(false)}
            className={cx(
              'flex shrink-0 items-center px-5 pb-3 pt-6 transition-all',
              zenMode ? 'cursor-pointer justify-center px-0 hover:opacity-90' : 'justify-between'
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] text-white ring-1 ring-white/55 dark:ring-white/20', theme.iconShell)}>
                <Rocket size={21} strokeWidth={2.35} className="drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              </div>

              {!zenMode && (
                <div className="min-w-0 leading-none">
                  <h2 className="truncate text-[21px] font-black tracking-[-0.045em] text-slate-950 dark:text-white">
                    Teen
                    <span className="bg-[linear-gradient(90deg,#6366f1,#8b5cf6,#0f766e)] bg-clip-text text-transparent dark:bg-[linear-gradient(90deg,#818cf8,#a78bfa,#2dd4bf)] dark:drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]">
                      Verse
                    </span>
                    Hub
                  </h2>
                 
                </div>
              )}
            </div>

            {!zenMode && (
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/65 text-slate-500 shadow-sm backdrop-blur-xl transition-all hover:bg-white hover:text-slate-950 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 dark:hover:text-white md:hidden"
              >
                <X size={19} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {!zenMode ? (
            <div className="group relative mx-4 mt-3 overflow-hidden rounded-[1.65rem] border border-white/75 bg-white/68 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.075)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_70px_rgba(99,102,241,0.12)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_22px_60px_rgba(0,0,0,0.4)] dark:hover:bg-white/[0.06] dark:hover:shadow-[0_25px_70px_rgba(99,102,241,0.2)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(15,118,110,0.11),transparent_32%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(20,184,166,0.1),transparent_40%)]" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-white p-0.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)] ring-1 ring-indigo-100 transition-all group-hover:ring-teal-200 dark:bg-slate-900 dark:ring-indigo-500/30 dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#8b5cf6,#0f766e)] text-lg font-black text-white">
                      {initial}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm dark:border-slate-900 dark:shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                    Lv.{userLevel}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1.5 truncate text-[15px] font-black tracking-[-0.025em] text-slate-950 dark:text-white">
                    <span className="truncate">{firstName}</span>
                    {badges.some((b) => b.name === 'Verified Teen') && (
                      <ShieldCheck size={15} className="shrink-0 text-[#0f766e] drop-shadow-sm dark:text-teal-400 dark:drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
                    )}
                  </h3>
                  <p className="mt-1 inline-flex rounded-full border border-slate-200/80 bg-white/60 px-2.5 py-1 text-[11px] font-bold capitalize text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                    {user.type || user.role || 'Member'}
                  </p>
                </div>
              </div>

              {!isClient && (
                <div className="relative z-10 mt-4 rounded-2xl border border-white/65 bg-white/55 p-3 backdrop-blur-xl dark:border-white/5 dark:bg-black/20 dark:shadow-inner">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                        <Zap size={14} fill="currentColor" />
                      </span>
                      Energy
                    </div>
                    <span className="text-[11px] font-black text-amber-500 dark:text-amber-300 dark:drop-shadow-[0_0_5px_rgba(252,211,77,0.5)]">{energy}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 shadow-inner dark:bg-slate-900/80 dark:ring-1 dark:ring-white/5">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#facc15,#fb923c)] transition-all duration-700 ease-out dark:shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                      style={{ width: `${energyPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="relative z-10 mt-4 flex flex-wrap items-center gap-1.5">
                {displayBadges.length > 0 ? (
                  displayBadges.map((b, i) => (
                    <div key={`${b.name}-${i}`} className="transition-transform hover:scale-105">
                      <BadgeItem name={b.name} iconName={b.icon} />
                    </div>
                  ))
                ) : (
                  <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-400 dark:bg-white/10 dark:text-slate-400">
                    No badges yet 🌱
                  </span>
                )}
                {badges.length > 3 && (
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-[#0f766e] dark:bg-teal-500/20 dark:text-teal-200 dark:shadow-[0_0_8px_rgba(45,212,191,0.3)]">
                    +{badges.length - 3}
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-4 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <span>XP Progress</span>
                  <span className={theme.cypressText}>{Math.round(safeProgress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200/75 shadow-inner dark:bg-slate-900/80 dark:ring-1 dark:ring-white/5">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#6366f1,#8b5cf6,#0f766e)] transition-all duration-700 ease-out dark:shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    style={{ width: `${safeProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTab('profile')}
              className="group relative mx-auto mb-4 mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-white p-0.5 shadow-[0_12px_35px_rgba(15,23,42,0.12)] ring-1 ring-indigo-100 transition-all hover:scale-105 dark:bg-slate-900 dark:ring-indigo-500/40 dark:shadow-[0_0_25px_rgba(99,102,241,0.25)]"
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#6366f1,#8b5cf6,#0f766e)] text-lg font-black text-white">
                {initial}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-teal-400 dark:border-slate-900 dark:shadow-[0_0_10px_rgba(45,212,191,0.6)]" />
            </button>
          )}

          <nav className={cx('custom-scrollbar flex-1 overflow-y-auto py-5', zenMode ? 'px-2' : 'px-4')}>
            <div className="space-y-1">
              <SidebarItem id="overview" icon={LayoutDashboard} label="Dashboard" {...navProps} />

              <SectionLabel zenMode={zenMode}>Workspace</SectionLabel>
              <SidebarItem id="jobs" icon={WandSparkles} label={isClient ? 'HireGenie' : 'Find Jobs'} {...navProps} />
              {isClient && <SidebarItem id="posted-jobs" icon={ListChecks} label="My Listings" {...navProps} />}
              {isClient && <SidebarItem id="pricing" icon={Crown} label="Pricing & Fees" {...navProps} />}
              {!isClient && <SidebarItem id="my-services" icon={Package} label="My Gigs" {...navProps} />}
              <SidebarItem id="applications" icon={FileText} label="Orders & Jobs" {...navProps} />
              <SidebarItem id="store" icon={ShoppingBag} label="Store" color="text-teal-500 dark:text-teal-300 dark:drop-shadow-[0_0_8px_rgba(45,212,191,0.35)]" {...navProps} />
              <SidebarItem id="messages" icon={MessageSquare} label="Messages" badge="New" {...navProps} />

              {!isClient && (
                <>
                  <SectionLabel zenMode={zenMode}>Growth</SectionLabel>
                  <SidebarItem id="profile" icon={UserCircle} label="My Profile" color="text-fuchsia-500 dark:text-fuchsia-400 dark:drop-shadow-[0_0_8px_rgba(232,121,249,0.3)]" {...navProps} />
                  <SidebarItem id="pricing" icon={Crown} label="Level Up" color="text-amber-500 dark:text-amber-400 dark:drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" {...navProps} />
                  <SidebarItem id="academy" icon={BookOpen} label="Academy" {...navProps} />
                  <SidebarItem id="resume" icon={FileText} label="Resume Builder" color="text-fuchsia-500 dark:text-fuchsia-400" badge="AI" {...navProps} />
                  <SidebarItem id="profile-card" icon={Share2} label="Share Profile" {...navProps} />
                </>
              )}

              <SectionLabel zenMode={zenMode}>System</SectionLabel>
              <SidebarItem id="records" icon={ShieldCheck} label="My Records" {...navProps} />
              <SidebarItem id="support" icon={HelpCircle} label="Help & Support" color="text-indigo-500 dark:text-indigo-400 dark:drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]" {...navProps} />
              <SidebarItem id="settings" icon={Settings} label="Settings" {...navProps} />
            </div>
          </nav>

          <div className={cx('border-t border-white/65 bg-white/38 p-4 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.02]', zenMode ? 'flex flex-col gap-3' : 'grid grid-cols-[auto_1fr] gap-3')}>
            <button
              type="button"
              onClick={() => setZenMode(!zenMode)}
              className="group relative hidden h-11 items-center justify-center rounded-2xl border border-white/75 bg-white/58 px-3 text-slate-500 shadow-sm backdrop-blur-xl transition-all hover:bg-white hover:text-indigo-600 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-teal-300 dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] md:flex"
            >
              {zenMode ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}

              {zenMode && (
                <div className="pointer-events-none absolute left-16 z-50 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <div className="whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/92 px-3 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
                    Expand Menu
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/70 bg-rose-50/75 px-3 text-rose-600 shadow-sm backdrop-blur-xl transition-all hover:bg-rose-100 hover:text-rose-700 active:scale-95 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 dark:hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
            >
              <LogOut size={17} />
              {!zenMode && <span className="text-sm font-bold tracking-[-0.01em]">Log out</span>}

              {zenMode && (
                <div className="pointer-events-none absolute left-16 z-50 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <div className="whitespace-nowrap rounded-xl border border-rose-500/30 bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-2xl dark:bg-rose-900/95">
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
