import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  CreditCard,
  Download,
  FileDown,
  FileSpreadsheet,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Printer,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  UsersRound,
  Wrench,
  WifiOff,
  X,
} from 'lucide-react';
import Toast from '../ui/Toast';
import { fetchAdminAnalyticsSnapshot, searchCommandCenter, subscribeToAdminActivity, updateOperationsRecord } from '../../services/adminAnalytics.api';
import { getCommandCenterTelemetry, getConnectorHealth } from '../../services/commandCenter/connectors';
import { buildDashboardModel } from './adminDashboard.model';
import { DASHBOARDS, DATE_PRESETS, getAdminRole, getVisibleDashboards, resolveDateRange } from './adminDashboard.config';
import {
  BarChart,
  DashboardSkeleton,
  DataTable,
  EmptyState,
  ErrorState,
  KpiCard,
  LineChart,
  StatusGrid,
} from './AdminPrimitives';
import { ConnectorGrid, GlobalSearchResults, InsightsPanel, NotificationPreferences, PermissionsMatrix } from './CommandCenterPanels';
import { formatMetricValue } from './adminFormatters';

const ICONS = {
  founder: LayoutDashboard,
  marketing: BarChart3,
  'user-growth': UsersRound,
  marketplace: BriefcaseBusiness,
  revenue: CircleDollarSign,
  payments: CreditCard,
  operations: Wrench,
  support: Headphones,
  product: Activity,
  ai: Bot,
  infrastructure: Building2,
  security: ShieldCheck,
  team: Users,
  executive: Sparkles,
  live: Activity,
};

const GROUP_ICONS = {
  Overview: LayoutDashboard,
  Marketing: BarChart3,
  Marketplace: BriefcaseBusiness,
  Finance: CircleDollarSign,
  Operations: Wrench,
  'Product Analytics': Activity,
  AI: Bot,
  Infrastructure: Building2,
  Security: ShieldCheck,
  Support: Headphones,
  Team: Users,
  Settings: ShieldCheck,
};

const cx = (...values) => values.filter(Boolean).join(' ');

const downloadBlob = (name, content, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const exportRows = (dashboard, model, format) => {
  const rows = model.table?.rows?.length
    ? model.table.rows
    : model.metrics.map((item) => ({ Metric: item.label, Value: formatMetricValue(item.value, item.format) }));
  const keys = rows.length ? Object.keys(rows[0]).filter((key) => !['record', 'raw_data', 'details', 'metadata'].includes(key)) : ['Metric', 'Value'];
  const safe = (value) => String(value ?? '').replaceAll('"', '""');
  const delimiter = format === 'excel' ? '\t' : ',';
  const content = [keys.join(delimiter), ...rows.map((row) => keys.map((key) => format === 'excel' ? safe(row[key]) : `"${safe(row[key])}"`).join(delimiter))].join('\n');
  downloadBlob(`${dashboard.id}-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xls' : 'csv'}`, content, format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8');
};

const exportPdf = async (dashboard, model) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.setFontSize(17);
  doc.text(dashboard.label, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, 14, 25);
  doc.setTextColor(20);
  let y = 36;
  model.metrics.forEach((item) => {
    if (y > 280) { doc.addPage(); y = 18; }
    doc.text(`${item.label}: ${formatMetricValue(item.value, item.format)}`, 14, y);
    y += 7;
  });
  doc.save(`${dashboard.id}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const ConfirmDialog = ({ action, onCancel, onConfirm, busy }) => {
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h2 id="confirm-title" className="text-lg font-bold text-slate-950 dark:text-white">Confirm operation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700">Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

const ExportMenu = ({ dashboard, model }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Download size={15} /> Export <ChevronDown size={13} /></button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <button type="button" onClick={() => { exportRows(dashboard, model, 'csv'); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileDown size={15} /> CSV export</button>
          <button type="button" onClick={() => { exportRows(dashboard, model, 'excel'); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileSpreadsheet size={15} /> Excel export</button>
          <button type="button" onClick={() => { void exportPdf(dashboard, model); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><FileDown size={15} /> PDF export</button>
          <button type="button" onClick={() => { window.print(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Printer size={15} /> Print view</button>
        </div>
      )}
    </div>
  );
};

const NotificationCenter = ({ items }) => {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const [severity, setSeverity] = useState('all');
  const [source, setSource] = useState('all');
  const unread = read ? 0 : items.length;
  const sources = [...new Set(items.map((item) => item.source))];
  const visible = items.filter((item) => (severity === 'all' || item.severity === severity) && (source === 'all' || item.source === source));
  return (
    <div className="relative">
      <button type="button" aria-label={`Notifications, ${unread} unread`} onClick={() => { setOpen((value) => !value); setRead(true); }} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <Bell size={17} />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800"><span className="font-bold">Notifications</span><div className="mt-2 flex gap-2"><select aria-label="Filter notifications by severity" value={severity} onChange={(event) => setSeverity(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="all">All severity</option><option value="error">Errors</option><option value="warning">Warnings</option><option value="information">Info</option><option value="success">Success</option></select><select aria-label="Filter notifications by source" value={source} onChange={(event) => setSource(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"><option value="all">All sources</option>{sources.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
          <div className="max-h-80 overflow-auto p-2">
            {visible.length ? visible.map((item, index) => <div key={`${item.source}-${item.message}-${index}`} className="rounded-xl px-3 py-3 text-sm leading-5 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><div className="mb-1 flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.source}</span><span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', item.severity === 'error' ? 'bg-rose-100 text-rose-700' : item.severity === 'warning' ? 'bg-amber-100 text-amber-700' : item.severity === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700')}>{item.severity}</span></div>{item.message}</div>) : <EmptyState compact title="All clear" description="No alerts match this severity filter." />}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardContent = ({ dashboard, model, livePaused, onToggleLive, onRequestAction, onPreferencesSaved }) => {
  const requestBulk = (rows, status, predicate) => {
    const eligible = rows.filter(predicate);
    if (!eligible.length) return;
    onRequestAction({ batch: eligible.map((row) => ({ type: row.type, id: row.id, status })), message: `${status === 'verified' ? 'Approve' : status === 'rejected' ? 'Reject' : status === 'reviewing' ? 'Move into review' : 'Resolve'} ${eligible.length} selected record${eligible.length === 1 ? '' : 's'}? Every change will be audited.` });
  };
  const bulkActions = [
    { label: 'Approve KYC', onSelect: (rows) => requestBulk(rows, 'verified', (row) => row.type?.includes('kyc')) },
    { label: 'Reject KYC', onSelect: (rows) => requestBulk(rows, 'rejected', (row) => row.type?.includes('kyc')) },
    { label: 'Review reports', onSelect: (rows) => requestBulk(rows, 'reviewing', (row) => row.type === 'report') },
    { label: 'Resolve reports', onSelect: (rows) => requestBulk(rows, 'resolved', (row) => row.type === 'report') },
  ];

  return (
  <div className="space-y-6">
    {dashboard.id === 'live' && (
      <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
        <div><p className="text-sm font-bold text-indigo-950 dark:text-indigo-100">Realtime stream</p><p className="text-xs text-indigo-700 dark:text-indigo-300">{livePaused ? 'New events are paused locally.' : 'Listening for Supabase changes.'}</p></div>
        <button type="button" onClick={onToggleLive} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">{livePaused ? <Play size={15} /> : <Pause size={15} />}{livePaused ? 'Resume' : 'Pause'}</button>
      </div>
    )}

    {model.alerts?.length > 0 && <div className="grid gap-2">{model.alerts.map((alert) => <div key={alert} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">{alert}</div>)}</div>}

    {model.insights && <InsightsPanel insights={model.insights} />}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{model.metrics.map((item) => <KpiCard key={item.label} metric={item} />)}</div>

    {model.charts?.length > 0 && <div className="grid gap-5 xl:grid-cols-2">{model.charts.map((chart) => chart.type === 'bar' ? <BarChart key={chart.title} {...chart} /> : <LineChart key={chart.title} {...chart} />)}</div>}

    {model.statuses?.length > 0 && <StatusGrid items={model.statuses} />}

    {model.connectors && <ConnectorGrid connectors={model.connectors} />}

    {model.permissions && <PermissionsMatrix />}

    {model.notificationPreferences && <NotificationPreferences onSaved={onPreferencesSaved} />}

    {model.integrations?.length > 0 && (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Integration backlog</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">These values are intentionally not mocked.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{model.integrations.map((item) => <div key={item} className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item}</div>)}</div>
      </section>
    )}

    {model.table && <DataTable key={`${dashboard.id}-${model.table.title}`} {...model.table} selectable={model.table.operational} bulkActions={model.table.operational ? bulkActions : []} filterKey={dashboard.id === 'live' ? 'source' : model.table.operational ? 'queue' : undefined} actions={model.table.operational ? (row) => (
      <div className="inline-flex gap-1.5">
        {row.type.includes('kyc') && row.status !== 'verified' && <button type="button" onClick={() => onRequestAction({ type: row.type, id: row.id, status: 'verified', message: `Approve KYC for ${row.subject}?` })} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">Approve</button>}
        {row.type.includes('kyc') && row.status !== 'rejected' && <button type="button" onClick={() => onRequestAction({ type: row.type, id: row.id, status: 'rejected', message: `Reject KYC for ${row.subject}?` })} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700">Reject</button>}
        {row.type === 'report' && row.status !== 'reviewing' && <button type="button" onClick={() => onRequestAction({ type: 'report', id: row.id, status: 'reviewing', message: `Move report ${row.id} into review?` })} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700">Review</button>}
        {row.type === 'report' && row.status !== 'resolved' && <button type="button" onClick={() => onRequestAction({ type: 'report', id: row.id, status: 'resolved', message: `Resolve report ${row.id}?` })} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">Resolve</button>}
        {row.type.includes('kyc') && <button type="button" onClick={() => onRequestAction({ type: 'profile', id: row.id, status: 'suspended', message: `Suspend account ${row.subject}? This affects platform access.` })} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">Suspend</button>}
      </div>
    ) : undefined} />}

    {!model.table && !model.charts?.length && !model.statuses?.length && !model.connectors && !model.permissions && !model.notificationPreferences && <EmptyState title="No connected visualization yet" description="The dashboard contract is ready; connect one of the listed integrations to populate it." />}
  </div>
  );
};

export default function AdminDashboardModule({ user, onLogout }) {
  const role = getAdminRole(user);
  const visibleDashboards = useMemo(() => getVisibleDashboards(role), [role]);
  const initialDashboard = visibleDashboards.some((item) => item.id === 'founder') ? 'founder' : visibleDashboards[0]?.id;
  const [activeId, setActiveId] = useState(initialDashboard);
  const [preset, setPreset] = useState('30d');
  const [customDates, setCustomDates] = useState({ from: '', to: '' });
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('admin-theme') === 'dark');
  const [navSearch, setNavSearch] = useState('');
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [livePaused, setLivePaused] = useState(false);
  const [liveRows, setLiveRows] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const searchRef = useRef(null);

  const activeDashboard = visibleDashboards.find((item) => item.id === activeId) || visibleDashboards[0] || DASHBOARDS[0];
  const dateRange = useMemo(() => resolveDateRange(preset, customDates), [customDates, preset]);

  const load = useCallback(async () => {
    if (preset === 'custom' && (!customDates.from || !customDates.to)) return;
    setLoading(true);
    setError('');
    try {
      const [analytics, connectorHealth, externalTelemetry] = await Promise.all([fetchAdminAnalyticsSnapshot(dateRange), getConnectorHealth(), getCommandCenterTelemetry(dateRange)]);
      setSnapshot({ ...analytics, connectorHealth, externalTelemetry });
    } catch (loadError) {
      setError(loadError.message || 'Analytics service failed.');
    } finally {
      setLoading(false);
    }
  }, [customDates.from, customDates.to, dateRange, preset]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('admin-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    const query = globalQuery.trim();
    if (query.length < 2) {
      setGlobalResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const allowed = new Set(visibleDashboards.map((item) => item.id));
        const results = await searchCommandCenter(query);
        if (!cancelled) setGlobalResults(results.filter((result) => allowed.has(result.module)));
      } catch {
        if (!cancelled) setGlobalResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [globalQuery, visibleDashboards]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setMobileSidebar(false);
        setProfileOpen(false);
        setPendingAction(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => subscribeToAdminActivity((event) => {
    if (!livePaused) setLiveRows((rows) => [event, ...rows].slice(0, 250));
  }), [livePaused]);

  const model = useMemo(() => snapshot ? buildDashboardModel(activeDashboard.model || activeDashboard.id, snapshot, liveRows, activeDashboard.id) : null, [activeDashboard.id, activeDashboard.model, liveRows, snapshot]);
  const groups = useMemo(() => {
    const filtered = visibleDashboards.filter((item) => item.label.toLowerCase().includes(navSearch.toLowerCase()));
    return filtered.reduce((result, item) => ({ ...result, [item.group]: [...(result[item.group] || []), item] }), {});
  }, [navSearch, visibleDashboards]);

  const notifications = useMemo(() => [
    ...(model?.alerts || []).map((message) => ({ source: activeDashboard.group, severity: 'warning', message })),
    ...(snapshot?.issues || []).map((issue) => ({ source: issue.source, severity: 'error', message: issue.message || 'Analytics source unavailable' })),
    ...(!online ? [{ source: 'Browser', severity: 'information', message: 'Offline mode is active. The last loaded snapshot remains available.' }] : []),
  ], [activeDashboard.group, model, online, snapshot]);

  const runOperation = async () => {
    if (!pendingAction) return;
    setActionBusy(true);
    try {
      const actions = pendingAction.batch || [pendingAction];
      for (const action of actions) await updateOperationsRecord(action);
      setToast({ message: `${actions.length} operation${actions.length === 1 ? '' : 's'} saved and added to the audit log.`, type: 'success' });
      setPendingAction(null);
      await load();
    } catch (operationError) {
      setToast({ message: operationError.message || 'Operation failed.', type: 'error' });
    } finally {
      setActionBusy(false);
    }
  };

  if (!visibleDashboards.length) return <ErrorState message="Your staff role does not grant access to any analytics dashboard." />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmDialog action={pendingAction} busy={actionBusy} onCancel={() => setPendingAction(null)} onConfirm={() => void runOperation()} />

      {mobileSidebar && <button type="button" aria-label="Close navigation" onClick={() => setMobileSidebar(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={cx('fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900', sidebarCollapsed ? 'w-[76px]' : 'w-[280px]', mobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-black text-white">TV</span>
          {!sidebarCollapsed && <div className="min-w-0"><p className="truncate text-sm font-bold">TeenVerse</p><p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Command Center</p></div>}
          <button type="button" aria-label="Close sidebar" onClick={() => setMobileSidebar(false)} className="ml-auto lg:hidden"><X size={18} /></button>
        </div>
        {!sidebarCollapsed && <label className="relative mx-3 mt-3"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder="Find dashboard…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" /></label>}
        <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-4" aria-label="Admin dashboards">
          {Object.entries(groups).map(([group, items]) => <div key={group} className="mb-4">{!sidebarCollapsed && <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group}</p>}{items.map((item) => { const Icon = ICONS[item.id] || ICONS[item.model] || GROUP_ICONS[item.group] || MoreHorizontal; return <button key={item.id} type="button" title={sidebarCollapsed ? item.label : undefined} onClick={() => { setActiveId(item.id); setMobileSidebar(false); }} className={cx('mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition', activeDashboard.id === item.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800', sidebarCollapsed && 'justify-center px-0')}><Icon size={17} className="shrink-0" />{!sidebarCollapsed && <span className="truncate">{item.label.replace(' Dashboard', '')}</span>}</button>;})}</div>)}
        </nav>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <button type="button" onClick={() => setSidebarCollapsed((value) => !value)} className="hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:flex">{sidebarCollapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}</button>
        </div>
      </aside>

      <div className={cx('transition-[margin] duration-200', sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[280px]')}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
          <button type="button" aria-label="Open navigation" onClick={() => setMobileSidebar(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 lg:hidden dark:border-slate-700"><Menu size={18} /></button>
          <div className="relative min-w-0 flex-1"><label className="relative block max-w-xl"><span className="sr-only">Global search</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input ref={searchRef} value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Search Command Center…  /" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900" /></label><GlobalSearchResults query={globalQuery} results={globalResults} searching={searching} onSelect={(result) => { setActiveId(result.module); setGlobalQuery(''); setGlobalResults([]); }} /></div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" aria-label="Toggle theme" onClick={() => setDark((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <NotificationCenter items={notifications} />
            <div className="relative">
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">{(user?.name || user?.email || 'A').charAt(0).toUpperCase()}</span><span className="hidden text-left sm:block"><span className="block max-w-28 truncate text-xs font-bold">{user?.name || user?.email || 'Admin'}</span><span className="block text-[10px] capitalize text-slate-400">{role}</span></span><ChevronDown size={12} /></button>
              {profileOpen && <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"><button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"><LogOut size={15} /> Sign out</button></div>}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1680px] p-4 sm:p-6 lg:p-8">
          {!online && <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"><WifiOff size={16} /> Offline — showing the last in-memory snapshot. Mutating actions may fail until connectivity returns.</div>}
          <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Analytics & operations</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{activeDashboard.label}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{model?.description || 'Loading live operational intelligence…'}</p></div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <label className="relative"><CalendarRange size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={preset} onChange={(event) => setPreset(event.target.value)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium outline-none dark:border-slate-700 dark:bg-slate-900">{DATE_PRESETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {preset === 'custom' && <><input type="date" value={customDates.from} onChange={(event) => setCustomDates((value) => ({ ...value, from: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900" /><input type="date" value={customDates.to} onChange={(event) => setCustomDates((value) => ({ ...value, to: event.target.value }))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900" /></>}
              <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"><RefreshCcw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              {model && <ExportMenu dashboard={activeDashboard} model={model} />}
            </div>
          </div>

          {loading && !snapshot ? <DashboardSkeleton /> : error && !snapshot ? <ErrorState message={error} onRetry={() => void load()} /> : model ? <DashboardContent dashboard={activeDashboard} model={model} livePaused={livePaused} onToggleLive={() => setLivePaused((value) => !value)} onRequestAction={setPendingAction} onPreferencesSaved={() => setToast({ message: 'Preferences and report draft saved locally.', type: 'success' })} /> : <DashboardSkeleton />}

          <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><span>Data refreshed {snapshot?.measuredAt ? new Date(snapshot.measuredAt).toLocaleString('en-IN') : '—'}</span><span>{snapshot?.issues?.length || 0} source warnings · {snapshot?.apiLatencyMs || 0} ms fetch</span></footer>
        </main>
      </div>
    </div>
  );
}
