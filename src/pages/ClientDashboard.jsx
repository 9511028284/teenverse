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
  XCircle,
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

const cn = (...classes) => classes.filter(Boolean).join(' ');

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
  initial: { opacity: 0, y: 12, scale: 0.99 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -12, scale: 0.99 },
};

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
    Pending: 'border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
    Accepted: 'border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400',
    Submitted: 'border-violet-200 bg-violet-50/50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400',
    Completed: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    Paid: 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    Rejected: 'border-red-200 bg-red-50/50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400',
    Open: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/[0.04] dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span className={cn('inline-flex items-center rounded-xl border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none', styles[normalized] || styles.Open)}>
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
  <section className={cn(
    'relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/95 p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_20px_rgba(99,102,241,0.02)] backdrop-blur-xl dark:border-white/[0.05] dark:bg-slate-900/40 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)] text-left',
    className
  )}>
    <div className="relative z-10">
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-white/[0.03] text-slate-800 dark:text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none">
                <Icon size={18} strokeWidth={2.5} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500 leading-normal">{subtitle}</p>}
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
    indigo: 'from-indigo-500 to-sky-500 text-indigo-600 dark:text-indigo-400',
    emerald: 'from-emerald-500 to-teal-500 text-emerald-600 dark:text-emerald-400',
    amber: 'from-amber-400 to-orange-500 text-amber-600 dark:text-amber-400',
    rose: 'from-rose-500 to-pink-500 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200/60 bg-white/95 p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(0,0,0,0.01)] dark:border-white/[0.05] dark:bg-slate-900/40 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)] text-left">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', tones[tone]?.split(' text-')[0] || tones.indigo.split(' text-')[0])} />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/40 dark:bg-slate-950 dark:border-white/[0.03] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none', tones[tone]?.split(' text-')[1] || 'text-indigo-600')}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
      </div>
      <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 leading-normal">{helper}</p>
    </div>
  );
};

const EmptyLine = ({ title, body, actionLabel, onAction }) => (
  <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/40 dark:border-white/10 dark:bg-slate-950/20 p-8 text-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
    <p className="text-sm font-black text-slate-900 dark:text-zinc-200 tracking-tight">{title}</p>
    <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-slate-400 dark:text-slate-500">{body}</p>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-black uppercase tracking-wider text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-950 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.2)]"
      >
        <span>{actionLabel}</span>
        <ChevronRight size={14} strokeWidth={2.5} />
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
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible" role="img" aria-label="Client spending trend">
        <defs>
          <linearGradient id="clientSpendLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="55%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="clientSpendArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
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
            className="text-slate-100 dark:text-white/[0.04]"
            strokeWidth="1"
          />
        ))}
        {areaPath && <path d={areaPath} fill="url(#clientSpendArea)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#clientSpendLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
        {points.map((point, index) => (
          <circle key={data[index]?.label || index} cx={point.x} cy={point.y} r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" />
        ))}
      </svg>
      <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-black uppercase font-mono text-slate-400 dark:text-slate-500 pt-1">
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
    <div className="grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto h-40 w-40">
        <svg viewBox="0 0 110 110" className="-rotate-90">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-white/[0.04]" />
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
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono leading-none">{total}</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">orders</span>
        </div>
      </div>
      <div className="space-y-2.5 text-left">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-mono font-black text-slate-900 dark:text-white">{item.value}</span>
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
        body="Project briefs initialization generates categorical asset statistics."
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2 text-left">
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <span className="truncate text-slate-700 dark:text-slate-400">{item.label}</span>
            <span className="font-mono font-black text-slate-900 dark:text-white">{formatCompactMoney(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.04] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-indigo-500 to-sky-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const PipelineRows = ({ data = [], total }) => (
  <div className="space-y-4">
    {data.map((item) => {
      const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
      return (
        <div key={item.label} className="space-y-2 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <StatusPill status={item.status} />
              <span className="truncate text-xs font-black text-slate-500 dark:text-slate-400">{item.label}</span>
            </div>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.04]">
            <div className={cn('h-full rounded-full transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]', item.bar)} style={{ width: `${Math.max(item.value ? 8 : 0, percent)}%` }} />
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
    <div className="relative space-y-5 pb-12 text-left">

      {/* Welcome Banner Card */}
      <section className="relative overflow-hidden rounded-[32px] border border-white bg-white/70 p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_12px_36px_rgba(0,0,0,0.03)] backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-900/40 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_20px_40px_rgba(0,0,0,0.3)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.12),transparent_34%),radial-gradient(circle_at_88%_16%,rgba(79,70,229,0.12),transparent_32%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] dark:shadow-none">
              <Activity size={13} strokeWidth={2.5} />
              Client Control Center
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight sm:text-4xl">
                Good to see you, {getFirstName(user)}
              </h1>
              <p className="mt-2.5 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Operating portal metrics for monitoring active hiring tracks, escrow balances, incoming Proposals, and contract revisions velocity cycles.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400">
                {completionRate}% completion rate
              </span>
              <span className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:border-indigo-500/10 dark:bg-indigo-500/5 dark:text-indigo-400">
                {proposalRate} proposals per project
              </span>
              <span className="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-1 text-[11px] font-bold text-sky-700 dark:border-sky-500/10 dark:bg-sky-500/5 dark:text-sky-400">
                Avg bid {formatCompactMoney(averageBid)}
              </span>
            </div>
          </div>

          {/* Escrow Balance Plate - Claymorphic accent */}
          <div className="rounded-2xl border border-white bg-slate-100 p-5 text-slate-900 dark:border-white/[0.05] dark:bg-slate-950 dark:text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_12px_28px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Escrow balance</p>
                <p className="text-2xl font-black font-mono leading-none">{getMoney(user?.wallet_balance)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200/60 text-emerald-600 dark:bg-slate-900 dark:border-white/[0.04] dark:text-emerald-400 shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6)] dark:shadow-none shrink-0">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTab('records')}
              className="mt-5 flex w-full items-center justify-between rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-3.5 py-2 text-xs font-black uppercase tracking-wider transition hover:scale-[1.01] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"
            >
              <span>Review financial statements</span>
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ClientStat icon={Briefcase} label="Projects posted" value={jobs.length} helper="Active and historical project briefs." tone="indigo" />
        <ClientStat icon={Users} label="Proposal volume" value={applications.length} helper={`${pendingApplications.length} proposals waiting for review.`} tone="amber" />
        <ClientStat icon={Clock3} label="Escrow exposure" value={formatCompactMoney(activeEscrowValue)} helper={`${activeOrders.length} orders moving through delivery.`} tone="emerald" />
        <ClientStat icon={Wallet} label="Total investment" value={formatCompactMoney(totalEarnings)} helper="Completed paid work from database records." tone="rose" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <GlassPanel
          title="Investment trajectory"
          subtitle="Monthly committed and completed order values calculated across user listings."
          icon={TrendingUp}
        >
          <LineChart data={monthSeries} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {monthSeries.slice(-3).map((item) => (
              <div key={item.key} className="rounded-xl border border-slate-200/60 bg-slate-50/40 px-3 py-2.5 dark:border-white/[0.04] dark:bg-slate-950/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white font-mono">{formatCompactMoney(item.spend)}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="Order distribution"
          subtitle="Status composition mix aggregated tracking real-time contract entries."
          icon={BarChart3}
        >
          <DonutChart data={statusSegments} />
        </GlassPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <GlassPanel title="Pipeline health" subtitle="Total operational tracking breakdown indexed by system stage tags." icon={Target}>
          <PipelineRows data={pipeline} total={applications.length} />
        </GlassPanel>

        <GlassPanel title="Budget allocation" subtitle="Primary service categories indexed by budget valuation listings." icon={BarChart3}>
          <BarList data={categorySpend} />
        </GlassPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <GlassPanel
          title="Recent proposals and orders"
          subtitle="Newest operational application vectors requiring platform review action."
          icon={FileText}
          action={(
            <button
              type="button"
              onClick={() => setTab('applications')}
              className="hidden h-8 items-center rounded-lg border border-slate-200/80 bg-slate-50 px-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex"
            >
              View all
            </button>
          )}
        >
          {recentApplications.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {recentApplications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setTab('applications')}
                  className="flex w-full flex-col gap-3 py-3.5 text-left transition hover:bg-slate-50/50 dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between outline-none"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white tracking-tight">{getAppTitle(app)}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-bold">
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
              body="Post an active project parameters brief to receive inbound proposals from verified creators."
              actionLabel="Post Project"
              onAction={() => setModal('post-job')}
            />
          )}
        </GlassPanel>

        <GlassPanel
          title="Active project logs"
          subtitle="Recent client listings and registered protect budgets metrics."
          icon={ListChecks}
          action={(
            <button type="button" onClick={() => setTab('posted-jobs')} className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2">
              Manage
            </button>
          )}
        >
          {recentProjects.length > 0 ? (
            <div className="space-y-2">
              {recentProjects.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setTab('posted-jobs')}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 text-left transition hover:-translate-y-0.5 shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.6),_0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-md dark:border-white/[0.04] dark:bg-slate-900/60 dark:hover:bg-slate-800 outline-none"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-900 dark:text-white tracking-tight">{job.title || 'Untitled Project Operational Brief'}</p>
                    <p className="mt-0.5 text-[11px] font-bold font-mono text-slate-400 dark:text-slate-500">{getMoney(job.budget || job.price)}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" strokeWidth={2.5} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyLine
              title="No projects posted"
              body="Initialize your first project specification brief to start accumulating proposal bids."
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
    <header className="sticky top-0 z-30 px-4 md:px-6 pt-4 md:pt-6 pb-2">
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-white/[0.04] rounded-[24px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),_0_8px_32px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),_0_12px_36px_rgba(0,0,0,0.2)] px-5 py-3.5 flex justify-between items-center">

        {/* Left Elements Section */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 bg-slate-50 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400 transition hover:bg-slate-100 md:hidden"
          >
            <Menu size={16} strokeWidth={2.5} />
          </button>

          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/40 dark:bg-slate-800/60 dark:border-white/[0.04] text-slate-800 dark:text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-none sm:flex">
            <ActiveIcon size={18} strokeWidth={2.5} />
          </div>

          <div className="min-w-0 text-left">
            <h1 className="truncate text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">{activeNav.label}</h1>
            <p className="hidden truncate text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5 sm:block">
              Client workspace module
            </p>
          </div>
        </div>

        {/* Right Controls Actions Grid Row */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setModal('post-job')}
            className="hidden h-9 items-center gap-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider px-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_6px_14px_rgba(79,70,229,0.2)] transition hover:bg-indigo-700 dark:bg-white dark:text-slate-950 sm:inline-flex"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Post Project</span>
          </button>

          {/* Theme slider indent block element switch */}
          <div className="flex rounded-full border border-slate-200/50 bg-slate-100 p-0.5 shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.05)] dark:border-white/[0.03] dark:bg-slate-950/60 dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)]">
            <button
              type="button"
              onClick={() => darkMode && toggleTheme()}
              className={cn('flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 outline-none', !darkMode ? 'bg-white text-amber-500 shadow-[0_3px_8px_rgba(0,0,0,0.06),_inset_0_1px_1px_rgba(255,255,255,0.9)]' : 'text-slate-400 hover:text-slate-200')}
              aria-label="Use light theme"
            >
              <Sun size={14} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => !darkMode && toggleTheme()}
              className={cn('flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 outline-none', darkMode ? 'bg-slate-800 text-indigo-400 shadow-[0_3px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.08)]' : 'text-slate-500 hover:text-slate-800')}
              aria-label="Use dark theme"
            >
              <Moon size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-400 hover:bg-slate-50 shadow-sm"
              aria-label="Open notifications overlay panel"
            >
              <Bell size={16} />
              {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl dark:border-white/[0.06] dark:bg-slate-900 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Notifications</span>
                  <button type="button" onClick={actions.handleClearNotifications} className="text-xs font-black text-indigo-500 hover:text-indigo-600">
                    Clear All
                  </button>
                </div>

                <div className="p-3 border-b border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900">
                  {notificationPermission === 'granted' ? (
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-center">Push alerts enabled on this device.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={actions.handleEnablePushNotifications}
                      className="w-full h-8 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 shadow-md transition-colors dark:bg-indigo-500"
                    >
                      Enable Push Alerts
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">No new warnings indexed</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="border-b border-slate-50 dark:border-white/5 p-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 last:border-none flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span className="text-left">{n.message}</span>
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
        setModal={setModal => setters.setModal(setModal)}
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
        setParentMode={actions.handleParentModeChange}
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
export const ClientDashboard = ({ user, setUser, onLogout, showToast, darkMode, toggleTheme, initialTab, onSwitchDashboardRole, roleSwitching, onDashboardReady }) => {
  const logic = useDashboardLogic(user, setUser, showToast);
  const { state, setters } = logic;
  const { setTab } = setters;
  const initialTabAppliedRef = React.useRef(false);
  const activeNav = clientNav.find((item) => item.id === state.tab) || clientNav[0];

  React.useEffect(() => {
    if (!initialTab || initialTabAppliedRef.current) return;
    initialTabAppliedRef.current = true;
    setTab(initialTab);
  }, [initialTab, setTab]);

  React.useEffect(() => {
    if (!state.isLoading) onDashboardReady?.();
  }, [state.isLoading, onDashboardReady]);

  if (state.isLoading) {
    if (roleSwitching) {
      return (
        <div className="h-screen bg-[#F4F6FA] dark:bg-[#070A14]" aria-hidden="true" />
      );
    }

    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F6FA] text-slate-900 dark:bg-[#070A14] dark:text-white select-none">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200/60 dark:bg-slate-900 dark:border-white/[0.04] text-slate-800 dark:text-white shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.6)] dark:shadow-none">
            <Briefcase className="animate-pulse text-indigo-600 dark:text-indigo-400" size={20} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Loading Client Ledger Elements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#F4F6FA] text-slate-900 antialiased dark:bg-[#070A14] dark:text-white box-border">

      {/* BACKGROUND ACCENT RADIUS BLURS */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30 dark:opacity-40" aria-hidden="true">
        <div className="absolute top-[-10%] right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-300/40 via-transparent to-transparent dark:from-indigo-900/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-300/30 via-transparent to-transparent dark:from-purple-900/20 blur-3xl" />
      </div>

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
        onSwitchDashboardRole={onSwitchDashboardRole}
        roleSwitching={roleSwitching}
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

        {/* Viewport Core Render Container Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto max-w-7xl pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.tab}
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
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
