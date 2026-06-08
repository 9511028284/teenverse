'use client'

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useDashboardLogic } from '../hooks/useDashboardLogic';
import DashboardModals from '../components/dashboard/DashboardModals';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import Jobs from '../components/dashboard/Jobs';
import ClientPostedJobs from '../components/dashboard/ClientPostedJobs';
import Applications from '../components/dashboard/Applications';
import ChatSystem from '../components/features/ChatSystem';
import Portfolio from '../components/dashboard/Portfolio';
import Pricing from '../components/dashboard/Pricing';
import Store from '../components/dashboard/Store';
import SupportHub from '../components/dashboard/SupportHub';
import Records from '../components/dashboard/Records';
import SettingsComp from '../components/dashboard/SettingsComp';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const clientNav = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'jobs', label: 'HireGenie', icon: Sparkles },
  { id: 'posted-jobs', label: 'Projects', icon: ListChecks },
  { id: 'applications', label: 'Orders', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'portfolio', label: 'Workroom', icon: Briefcase },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'pricing', label: 'Pricing', icon: Crown },
  { id: 'records', label: 'Records', icon: ShieldCheck },
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const pageVariants = {
  initial: { opacity: 0, x: -8 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 8 },
};

const serif = { fontFamily: 'var(--font-kibitz, "Cormorant Garamond", "EB Garamond", Georgia, serif)', fontWeight: 300 };
const mono  = { fontFamily: 'var(--font-mono, "Space Mono", ui-monospace, monospace)', fontWeight: 400 };

const getFirstName = (user) => user?.name?.split(' ')?.[0] || 'Client';

const getAppTitle = (app) => (
  app?.title ||
  app?.job_title ||
  app?.jobs?.title ||
  app?.job?.title ||
  (app?.job_id ? `Project ${String(app.job_id).slice(0, 8)}` : 'Project')
);

const getMoney = (value) => `Rs. ${(Number(value) || 0).toLocaleString()}`;

const mapServicesToTalent = (services = []) => (
  services
    .filter((service) => service?.freelancer_id || service?.id)
    .map((service) => ({
      id: service.freelancer_id || service.id,
      freelancer_id: service.freelancer_id || service.id,
      name: service.freelancer_name || service.name || 'TeenVerse creator',
      tag_line: service.title || service.name || 'Available service',
      specialty: service.category || service.service_category || service.description || 'Digital service',
      hourly_rate: Number(service.rate || service.starting_price || service.price || service.hourly_rate) || 0,
      rating: service.rating || '5.0',
      current_plan: service.current_plan,
      avatar_url: service.avatar_url,
      unlocked_skills: service.tags || [service.category].filter(Boolean),
    }))
);

// ─── STYLIZED EXPLICIT CARD COMPONENTS ───────────────────────────────────────
const StatusPill = ({ status }) => {
  const normalized = status || 'Open';
  const styles = {
    Pending: 'border-amber-200/60 bg-amber-50/50 text-amber-700 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-400',
    Accepted: 'border-blue-200/60 bg-blue-50/50 text-blue-700 dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-blue-400',
    Submitted: 'border-violet-200/60 bg-violet-50/50 text-violet-700 dark:border-violet-500/10 dark:bg-violet-500/5 dark:text-violet-400',
    Completed: 'border-emerald-200/60 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400',
    Paid: 'border-emerald-200/60 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400',
    Rejected: 'border-rose-200/60 bg-rose-50/50 text-rose-700 dark:border-rose-500/10 dark:bg-rose-500/5 dark:text-rose-400',
    Open: 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
  };

  return (
    <span className={cx('inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold tracking-tight shrink-0 box-border', styles[normalized] || styles.Open)}>
      {normalized}
    </span>
  );
};

const moneyValue = (value) => Number(value) || 0;

const formatCompactMoney = (value) => {
  const amount = moneyValue(value);
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(amount >= 1000000 ? 1 : 2)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
  return getMoney(amount);
};

const getApplicationAmount = (app) => moneyValue(app.bid_amount || app.price || app.jobs?.budget || app.job?.budget);
const getApplicationDate = (app) => app.paid_at || app.completed_at || app.submitted_at || app.started_at || app.created_at;

const monthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const buildMonthlySeries = (applications = [], jobs = []) => {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 5 + index);
    return {
      key: monthKey(date),
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      spend: 0,
      proposals: 0,
      projects: 0,
    };
  });

  const byKey = new Map(months.map((item) => [item.key, item]));

  applications.forEach((app) => {
    const dateValue = getApplicationDate(app);
    if (!dateValue) return;
    const date = new Date(dateValue);
    const row = Number.isNaN(date.getTime()) ? null : byKey.get(monthKey(date));
    if (!row) return;
    row.proposals += 1;
    if (['Paid', 'Completed', 'Submitted', 'Accepted', 'Processing'].includes(app.status)) {
      row.spend += getApplicationAmount(app);
    }
  });

  jobs.forEach((job) => {
    if (!job.created_at) return;
    const date = new Date(job.created_at);
    const row = Number.isNaN(date.getTime()) ? null : byKey.get(monthKey(date));
    if (row) row.projects += 1;
  });

  return months;
};

const buildCategorySpend = (jobs = [], applications = []) => {
  const categoryMap = new Map();

  jobs.forEach((job) => {
    const key = job.category || job.service_category || 'General';
    categoryMap.set(key, (categoryMap.get(key) || 0) + moneyValue(job.budget || job.price || job.max_budget || job.min_budget));
  });

  if (categoryMap.size === 0) {
    applications.forEach((app) => {
      const key = app.jobs?.category || app.job?.category || app.category || 'General';
      categoryMap.set(key, (categoryMap.get(key) || 0) + getApplicationAmount(app));
    });
  }

  return [...categoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

const GlassPanel = ({ title, subtitle, icon: Icon, action, className = '', children }) => (
  <section className={cx(
    'relative overflow-hidden rounded-2xl border border-white/70 bg-white/[0.62] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.42] dark:shadow-[0_24px_70px_rgba(0,0,0,0.34)] box-border',
    className
  )}>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,255,255,0.12)_48%,rgba(99,102,241,0.08))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_48%,rgba(34,211,238,0.04))]" />
    <div className="relative z-10">
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4 box-border">
          <div className="flex min-w-0 items-start gap-3 box-border">
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/[0.68] text-neutral-800 shadow-sm dark:border-white/10 dark:bg-white/[0.08] dark:text-zinc-100">
                <Icon size={16} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-base font-bold text-neutral-950 dark:text-white">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-zinc-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  </section>
);

const ClientStat = ({ icon: Icon, label, value, helper, tone = 'indigo' }) => {
  const tones = {
    indigo: 'from-indigo-500 to-sky-500 text-indigo-600 dark:text-indigo-300',
    emerald: 'from-emerald-500 to-teal-500 text-emerald-600 dark:text-emerald-300',
    amber: 'from-amber-400 to-orange-500 text-amber-600 dark:text-amber-300',
    rose: 'from-rose-500 to-pink-500 text-rose-600 dark:text-rose-300',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/[0.66] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] box-border">
      <div className={cx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', tones[tone]?.split(' text-')[0] || tones.indigo.split(' text-')[0])} />
      <div className="flex items-start justify-between gap-3 box-border">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500" style={mono}>{label}</p>
          <p className="text-2xl font-bold text-neutral-950 dark:text-zinc-50">{value}</p>
        </div>
        <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.08]', tones[tone]?.replace(/from-\S+ to-\S+ /, '') || 'text-indigo-600')}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-4 text-xs font-medium leading-5 text-neutral-500 dark:text-zinc-400">{helper}</p>
    </div>
  );
};

const EmptyLine = ({ title, body, actionLabel, onAction }) => (
  <div className="rounded-2xl border border-dashed border-white/70 bg-white/40 p-8 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/5 box-border">
    <p className="text-sm font-bold text-neutral-900 dark:text-zinc-200">{title}</p>
    <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-neutral-500 dark:text-zinc-400 font-medium">{body}</p>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-sm box-border"
      >
        <span>{actionLabel}</span>
        <ChevronRight size={14} />
      </button>
    )}
  </div>
);

const LineChart = ({ data = [] }) => {
  const width = 460;
  const height = 180;
  const padding = 24;
  const maxValue = Math.max(...data.map((item) => item.spend), 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    x: padding + index * step,
    y: height - padding - (item.spend / maxValue) * (height - padding * 2),
  }));
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

  return (
    <div className="box-border">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible" role="img" aria-label="Client spending trend">
        <defs>
          <linearGradient id="clientSpendLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="55%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="clientSpendArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((line) => (
          <line
            key={line}
            x1={padding}
            x2={width - padding}
            y1={padding + line * ((height - padding * 2) / 2)}
            y2={padding + line * ((height - padding * 2) / 2)}
            stroke="currentColor"
            className="text-neutral-200/80 dark:text-white/10"
            strokeWidth="1"
          />
        ))}
        {areaPath && <path d={areaPath} fill="url(#clientSpendArea)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#clientSpendLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((point, index) => (
          <circle key={data[index]?.label || index} cx={point.x} cy={point.y} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" />
        ))}
      </svg>
      <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-bold text-neutral-400 dark:text-zinc-500">
        {data.map((item) => <span key={item.key}>{item.label}</span>)}
      </div>
    </div>
  );
};

const DonutChart = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center box-border">
      <div className="relative mx-auto h-40 w-40">
        <svg viewBox="0 0 110 110" className="-rotate-90">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-neutral-200/80 dark:text-white/10" />
          {total > 0 && data.map((item) => {
            const length = (item.value / total) * circumference;
            const dashOffset = -offset;
            offset += length;
            return (
              <circle
                key={item.label}
                cx="55"
                cy="55"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-neutral-950 dark:text-white">{total}</span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500" style={mono}>orders</span>
        </div>
      </div>
      <div className="space-y-2.5 box-border">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-600 dark:text-zinc-300">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-mono font-bold text-neutral-950 dark:text-white" style={mono}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarList = ({ data = [] }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  if (!data.length) {
    return (
      <EmptyLine
        title="No budget categories yet"
        body="Project budgets will create category allocation analytics."
      />
    );
  }

  return (
    <div className="space-y-4 box-border">
      {data.map((item) => (
        <div key={item.label} className="space-y-2 box-border">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="truncate text-neutral-700 dark:text-zinc-300">{item.label}</span>
            <span className="font-mono font-bold text-neutral-950 dark:text-white" style={mono}>{formatCompactMoney(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200/70 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-indigo-500 to-sky-500"
              style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const PipelineRows = ({ data = [], total }) => (
  <div className="space-y-4 box-border">
    {data.map((item) => {
      const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
      return (
        <div key={item.label} className="space-y-2 box-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <StatusPill status={item.status} />
              <span className="truncate text-xs font-semibold text-neutral-600 dark:text-zinc-300">{item.label}</span>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-950 dark:text-white" style={mono}>{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200/70 dark:bg-white/10">
            <div className={cx('h-full rounded-full', item.bar)} style={{ width: `${Math.max(item.value ? 8 : 0, percent)}%` }} />
          </div>
        </div>
      );
    })}
  </div>
);

// ─── MAIN OVERVIEW CANVAS ────────────────────────────────────────────────────
const ClientHome = ({ user, jobs, applications, totalEarnings, setTab, setModal }) => {
  const pendingApplications = applications.filter((app) => app.status === 'Pending');
  const reviewOrders = applications.filter((app) => ['Submitted', 'Completed'].includes(app.status));
  const activeOrders = applications.filter((app) => ['Accepted', 'Submitted', 'Completed', 'Processing', 'Revision Requested'].includes(app.status));
  const completedOrders = applications.filter((app) => ['Paid', 'Completed'].includes(app.status));
  const rejectedApplications = applications.filter((app) => app.status === 'Rejected');
  const recentApplications = applications.slice(0, 5);
  const recentProjects = jobs.slice(0, 4);

  const totalProposalValue = applications.reduce((sum, app) => sum + getApplicationAmount(app), 0);
  const activeEscrowValue = activeOrders.reduce((sum, app) => sum + getApplicationAmount(app), 0);
  const averageBid = applications.length ? totalProposalValue / applications.length : 0;
  const completionRate = applications.length ? Math.round((completedOrders.length / applications.length) * 100) : 0;
  const proposalRate = jobs.length ? (applications.length / jobs.length).toFixed(1) : applications.length;
  const monthSeries = buildMonthlySeries(applications, jobs);
  const categorySpend = buildCategorySpend(jobs, applications);

  const pipeline = [
    { label: 'New proposals', value: pendingApplications.length, status: 'Pending', bar: 'bg-amber-500' },
    { label: 'Active orders', value: activeOrders.length, status: 'Accepted', bar: 'bg-indigo-500' },
    { label: 'Ready to review', value: reviewOrders.length, status: 'Submitted', bar: 'bg-violet-500' },
    { label: 'Completed', value: completedOrders.length, status: 'Completed', bar: 'bg-emerald-500' },
  ];

  const statusSegments = [
    { label: 'Pending', value: pendingApplications.length, color: '#f59e0b' },
    { label: 'Active', value: activeOrders.length, color: '#4f46e5' },
    { label: 'Review', value: reviewOrders.length, color: '#8b5cf6' },
    { label: 'Completed', value: completedOrders.length, color: '#10b981' },
    { label: 'Rejected', value: rejectedApplications.length, color: '#f43f5e' },
  ];

  return (
    <div className="relative space-y-5 pb-12 box-border">
      <section className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/[0.64] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.48] dark:shadow-[0_28px_80px_rgba(0,0,0,0.38)] box-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_34%),radial-gradient(circle_at_88%_16%,rgba(79,70,229,0.16),transparent_32%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-end box-border">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/[0.64] px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] dark:text-zinc-400" style={mono}>
              <Activity size={13} />
              Client command center
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-950 dark:text-white sm:text-4xl" style={serif}>
                Good to see you, {getFirstName(user)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-zinc-300">
                A clear operating view for hiring velocity, escrow exposure, proposal quality, and delivery movement.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 box-border">
              <span className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-300">
                {completionRate}% completion rate
              </span>
              <span className="rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-400/15 dark:bg-indigo-400/10 dark:text-indigo-300">
                {proposalRate} proposals per project
              </span>
              <span className="rounded-xl border border-sky-200/70 bg-sky-50/70 px-3 py-1.5 text-xs font-bold text-sky-700 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-300">
                Avg bid {formatCompactMoney(averageBid)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.12] bg-neutral-950/[0.92] p-5 text-white shadow-[0_22px_55px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:bg-white/[0.08] box-border">
            <div className="flex items-center justify-between gap-3 box-border">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400" style={mono}>Escrow balance</p>
                <p className="text-3xl font-bold" style={serif}>{getMoney(user?.wallet_balance)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-emerald-300 shadow-inner">
                <Wallet size={19} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab('records')}
              className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/[0.12] box-border"
            >
              <span>Review finance records</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 box-border">
        <ClientStat icon={Briefcase} label="Projects posted" value={jobs.length} helper="Active and historical project briefs." tone="indigo" />
        <ClientStat icon={Users} label="Proposal volume" value={applications.length} helper={`${pendingApplications.length} proposals waiting for review.`} tone="amber" />
        <ClientStat icon={Clock3} label="Escrow exposure" value={formatCompactMoney(activeEscrowValue)} helper={`${activeOrders.length} orders moving through delivery.`} tone="emerald" />
        <ClientStat icon={Wallet} label="Total investment" value={formatCompactMoney(totalEarnings)} helper="Completed paid work from Supabase records." tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] box-border">
        <GlassPanel
          title="Investment trajectory"
          subtitle="Monthly committed and completed order value from client applications."
          icon={TrendingUp}
        >
          <LineChart data={monthSeries} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {monthSeries.slice(-3).map((item) => (
              <div key={item.key} className="rounded-xl border border-white/70 bg-white/[0.45] px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.06]">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500" style={mono}>{item.label}</p>
                <p className="mt-1 text-sm font-bold text-neutral-950 dark:text-white">{formatCompactMoney(item.spend)}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="Order distribution"
          subtitle="Status mix across proposals, live orders, reviews, and completed work."
          icon={BarChart3}
        >
          <DonutChart data={statusSegments} />
        </GlassPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 box-border">
        <GlassPanel title="Pipeline health" subtitle="Volume by operational stage." icon={Target}>
          <PipelineRows data={pipeline} total={applications.length} />
        </GlassPanel>

        <GlassPanel title="Budget allocation" subtitle="Top categories by listed or committed value." icon={BarChart3}>
          <BarList data={categorySpend} />
        </GlassPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] box-border">
        <GlassPanel
          title="Recent proposals and orders"
          subtitle="Newest Supabase application records requiring attention."
          icon={FileText}
          action={(
            <button
              type="button"
              onClick={() => setTab('applications')}
              className="hidden h-8 items-center rounded-lg border border-white/70 bg-white/60 px-3 text-xs font-semibold text-neutral-700 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:text-zinc-300 sm:inline-flex shadow-sm"
            >
              View all
            </button>
          )}
        >
          {recentApplications.length > 0 ? (
            <div className="divide-y divide-neutral-200/60 dark:divide-white/10 box-border">
              {recentApplications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setTab('applications')}
                  className="flex w-full flex-col gap-3 py-3.5 text-left transition hover:bg-white/40 dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between outline-none box-border"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-neutral-950 dark:text-zinc-100">{getAppTitle(app)}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-zinc-400 font-medium">
                      {getMoney(app.bid_amount)} {app.freelancer_name ? `by ${app.freelancer_name}` : ''}
                    </p>
                  </div>
                  <StatusPill status={app.status} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyLine
              title="No proposals yet"
              body="Post a project or use HireGenie to start a conversation with a verified creator."
              actionLabel="Post Project"
              onAction={() => setModal('post-job')}
            />
          )}
        </GlassPanel>

        <GlassPanel
          title="Active project logs"
          subtitle="Recent client listings and planned budget."
          icon={ListChecks}
          action={(
            <button type="button" onClick={() => setTab('posted-jobs')} className="text-xs font-bold text-indigo-600 dark:text-indigo-300 hover:underline">
              Manage
            </button>
          )}
        >
          {recentProjects.length > 0 ? (
            <div className="space-y-2 box-border">
              {recentProjects.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setTab('posted-jobs')}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/[0.52] px-3.5 py-3 text-left transition hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/10 outline-none box-border"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-950 dark:text-zinc-100">{job.title || 'Untitled project'}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-zinc-400 font-medium">{getMoney(job.budget || job.price)}</p>
                  </div>
                  <ChevronRight size={14} className="text-neutral-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyLine
              title="No projects posted"
              body="Create your first listing and start receiving proposals."
              actionLabel="Create Listing"
              onAction={() => setModal('post-job')}
            />
          )}
        </GlassPanel>
      </section>
    </div>
  );
};

// ─── TOP LEVEL FRAME HEADER ──────────────────────────────────────────────────
const ClientHeader = ({
  activeNav,
  darkMode,
  toggleTheme,
  notifications,
  notificationPermission,
  showNotifications,
  setShowNotifications,
  setMenuOpen,
  actions,
  setModal,
}) => {
  const ActiveIcon = activeNav.icon;

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/[0.72] px-4 py-3.5 shadow-[0_12px_36px_rgba(15,23,42,0.05)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.72] dark:shadow-[0_12px_36px_rgba(0,0,0,0.25)] md:px-6 box-border">
      <div className="flex items-center justify-between gap-3 box-border">
        
        <div className="flex min-w-0 items-center gap-3 box-border">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-neutral-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] dark:text-zinc-300 md:hidden box-border"
          >
            <Menu size={16} />
          </button>
          
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-neutral-800 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08] dark:text-zinc-200 sm:flex">
            <ActiveIcon size={16} />
          </div>
          
          <div className="min-w-0 space-y-0.5">
            <h1 className="truncate text-base font-bold text-neutral-900 dark:text-white" style={serif}>{activeNav.label}</h1>
            <p className="hidden truncate text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 sm:block" style={mono}>Client parameter workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 box-border">
          <button
            type="button"
            onClick={() => setModal('post-job')}
            className="hidden h-9 items-center gap-1.5 rounded-xl bg-neutral-950 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:inline-flex box-border"
          >
            <Plus size={14} />
            <span>Post</span>
          </button>

          <div className="flex rounded-xl border border-white/70 bg-white/60 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] box-border">
            <button
              type="button"
              onClick={() => darkMode && toggleTheme()}
              className={cx('flex h-7 w-7 items-center justify-center rounded-lg transition outline-none', !darkMode ? 'bg-white border border-white/80 text-amber-500 shadow-sm dark:bg-white/[0.10]' : 'text-neutral-400')}
              aria-label="Use light theme"
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              onClick={() => !darkMode && toggleTheme()}
              className={cx('flex h-7 w-7 items-center justify-center rounded-lg transition outline-none', darkMode ? 'bg-zinc-950 text-indigo-400 shadow-sm border border-white/10' : 'text-neutral-400')}
              aria-label="Use dark theme"
            >
              <Moon size={14} />
            </button>
          </div>

          <div className="relative box-border">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/70 text-neutral-600 shadow-sm backdrop-blur-xl transition hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:text-zinc-300 dark:hover:bg-white/[0.12] box-border"
              aria-label="Open notifications"
            >
              <Bell size={15} />
              {notifications.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/70 bg-white/[0.84] shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.86] box-border">
                <div className="flex items-center justify-between border-b border-neutral-100/80 px-4 py-3 dark:border-white/10 box-border">
                  <span className="text-xs font-bold text-neutral-900 dark:text-zinc-100">Notifications</span>
                  <button type="button" onClick={actions.handleClearNotifications} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Clear
                  </button>
                </div>
                <div className="border-b border-neutral-100/80 p-2.5 dark:border-white/10 box-border">
                  {notificationPermission === 'granted' ? (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5">Push alerts enabled.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={actions.handleEnablePushNotifications}
                      className="w-full h-8 rounded-lg bg-neutral-950 text-white text-xs font-semibold dark:bg-zinc-100 dark:text-zinc-950 outline-none box-border"
                    >
                      Enable push alerts
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar box-border">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400 dark:text-zinc-500 font-medium">No new notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="border-b border-neutral-100/60 px-4 py-2.5 text-xs text-neutral-500 last:border-0 dark:border-white/10 dark:text-zinc-400">
                        {notification.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

const ClientContent = ({ user, setUser, showToast, logic }) => {
  const { state, setters, actions } = logic;
  const talentList = mapServicesToTalent(state.services);

  if (state.tab === 'overview') {
    return (
      <ClientHome
        user={user}
        jobs={state.jobs}
        applications={state.applications}
        totalEarnings={state.totalEarnings}
        setTab={setters.setTab}
        setModal={setters.setModal}
      />
    );
  }

  if (state.tab === 'jobs') {
    return (
      <Jobs
        user={user}
        showToast={showToast}
        isClient
        freelancersList={talentList}
        filteredJobs={state.filteredJobs}
        searchTerm={state.searchTerm}
        setSearchTerm={setters.setSearchTerm}
        setModal={setters.setModal}
        setTab={setters.setTab}
        setSelectedJob={setters.setSelectedJob}
        parentMode={state.parentMode}
        onAction={actions.handleAppAction}
        setActiveChat={setters.setActiveChat}
      />
    );
  }

  if (state.tab === 'posted-jobs') {
    return <ClientPostedJobs jobs={state.jobs} setModal={setters.setModal} handleDeleteJob={actions.handleDeleteJob} />;
  }

  if (state.tab === 'applications') {
    return (
      <Applications
        user={user}
        applications={state.applications}
        isClient
        parentMode={state.parentMode}
        onAction={actions.handleAppAction}
        onViewTimeline={(app) => setters.setTimelineApp(app)}
        showToast={showToast}
      />
    );
  }

  if (state.tab === 'messages') {
    return (
      <ChatSystem
        user={user}
        activeChat={state.activeChat}
        setActiveChat={setters.setActiveChat}
        onAction={actions.handleAppAction}
        showToast={showToast}
      />
    );
  }

  if (state.tab === 'portfolio') {
    return <Portfolio isClient applications={state.applications} jobs={state.jobs} services={state.services} />;
  }

  if (state.tab === 'store') {
    return <Store user={user} setUser={setUser} />;
  }

  if (state.tab === 'pricing') {
    return <Pricing isClient user={user} onSubscribe={actions.handleSubscribe} />;
  }

  if (state.tab === 'records') {
    return <Records applications={state.applications} onDownloadInvoice={actions.handleInvoiceDownload} />;
  }

  if (state.tab === 'support') {
    return <SupportHub user={user} showToast={showToast} setModal={setters.setModal} isClient />;
  }

  if (state.tab === 'settings') {
    return (
      <SettingsComp
        profileForm={state.profileForm}
        setProfileForm={setters.setProfileForm}
        isClient
        handleUpdateProfile={actions.handleUpdateProfile}
        parentMode={state.parentMode}
        setParentMode={(val) => {
          setters.setParentMode(val);
          actions.logAction?.('PARENT_MODE_TOGGLE', { enabled: val });
        }}
        onOpenKyc={() => setters.setModal('kyc_verification')}
      />
    );
  }

  return (
    <ClientHome
      user={user}
      jobs={state.jobs}
      applications={state.applications}
      totalEarnings={state.totalEarnings}
      setTab={setters.setTab}
      setModal={setters.setModal}
    />
  );
};

// ─── MASTER DASHBOARD COMPONENT EXPORT ────────────────────────────────────────
export const ClientDashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme }) => {
  const logic = useDashboardLogic(user, setUser, showToast);
  const { state, setters } = logic;
  const activeNav = clientNav.find((item) => item.id === state.tab) || clientNav[0];

  if (state.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-neutral-900 dark:bg-zinc-950 dark:text-white select-none">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md">
            <Briefcase className="animate-pulse" size={18} />
          </div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500" style={mono}>Loading client hub metadata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[linear-gradient(135deg,#eef6f3_0%,#f7f8ff_45%,#eef3ff_100%)] text-neutral-900 antialiased dark:bg-[linear-gradient(135deg,#071013_0%,#090b18_48%,#05070d_100%)] dark:text-zinc-50 box-border">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_16%_8%,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(79,70,229,0.16),transparent_30%),radial-gradient(circle_at_70%_88%,rgba(14,165,233,0.12),transparent_32%)] dark:bg-[radial-gradient(circle_at_16%_8%,rgba(20,184,166,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(99,102,241,0.16),transparent_31%),radial-gradient(circle_at_70%_88%,rgba(14,165,233,0.10),transparent_34%)]" />
      <DashboardSidebar
        user={user}
        isClient
        badges={state.badges}
        userLevel={state.userLevel}
        progressPercent={state.progressPercent}
        tab={state.tab}
        setTab={setters.setTab}
        menuOpen={state.menuOpen}
        setMenuOpen={setters.setMenuOpen}
        zenMode={state.zenMode}
        setZenMode={setters.setZenMode}
        onLogout={onLogout}
        energy={state.energy}
        jobsCount={state.jobs.length}
        applicationsCount={state.applications.length}
      />

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden box-border">
        <ClientHeader
          activeNav={activeNav}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          notifications={state.notifications}
          notificationPermission={state.notificationPermission}
          showNotifications={state.showNotifications}
          setShowNotifications={setters.setShowNotifications}
          setMenuOpen={setters.setMenuOpen}
          actions={logic.actions}
          setModal={setters.setModal}
        />

        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 md:px-6 box-border">
          <div className="mx-auto max-w-7xl box-border">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.tab}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="box-border w-full"
              >
                <ClientContent user={user} setUser={setUser} showToast={showToast} logic={logic} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <DashboardModals user={user} logic={logic} showToast={showToast} />
    </div>
  );
};

export default ClientDashboard;
