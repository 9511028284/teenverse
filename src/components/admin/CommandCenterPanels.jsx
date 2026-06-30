import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Check, CircleDot, PlugZap, Save, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { DASHBOARDS } from './adminDashboard.config';

const cx = (...values) => values.filter(Boolean).join(' ');

export const InsightsPanel = ({ insights }) => {
  if (!insights) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/30">
      <div className="flex items-center gap-2 border-b border-indigo-100 px-5 py-4 dark:border-indigo-900/50">
        <Sparkles size={17} className="text-indigo-600 dark:text-indigo-300" />
        <h2 className="font-bold text-slate-950 dark:text-white">Founder intelligence</h2>
        <span className="ml-auto rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">Data-derived</span>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-3">
        <article className="lg:col-span-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Operating summary</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{insights.summary}</p></article>
        <article className="rounded-xl bg-white/80 p-4 dark:bg-slate-950/40"><p className="text-xs font-bold text-emerald-600">Biggest opportunity</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{insights.opportunity}</p></article>
        <article className="rounded-xl bg-white/80 p-4 dark:bg-slate-950/40"><p className="text-xs font-bold text-rose-600">Biggest risk</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{insights.risk}</p></article>
        <article className="rounded-xl bg-white/80 p-4 dark:bg-slate-950/40"><p className="text-xs font-bold text-indigo-600">Today&apos;s priorities</p><ul className="mt-2 space-y-2">{insights.priorities.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"><CircleDot size={13} className="mt-1 shrink-0 text-indigo-500" />{item}</li>)}</ul></article>
      </div>
      <div className="border-t border-indigo-100 px-5 py-4 dark:border-indigo-900/50"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recommended actions</p><div className="mt-2 flex flex-wrap gap-2">{insights.actions.map((item) => <span key={item} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">{item}</span>)}</div></div>
    </section>
  );
};

const healthTone = (score) => {
  if (score === null || score === undefined) return { label: 'Unavailable', bar: 'bg-slate-300', text: 'text-slate-500' };
  if (score >= 80) return { label: 'Healthy', bar: 'bg-emerald-500', text: 'text-emerald-600' };
  if (score >= 60) return { label: 'Watch', bar: 'bg-amber-500', text: 'text-amber-600' };
  return { label: 'At risk', bar: 'bg-rose-500', text: 'text-rose-600' };
};

export const BusinessHealthPanel = ({ items = [] }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Activity size={17} /></span>
      <div><h2 className="font-bold text-slate-950 dark:text-white">Business health</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Explainable scores calculated only from connected operational signals.</p></div>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const tone = healthTone(item.score);
        return (
          <article key={item.label} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{item.label}</p><span className={`text-xs font-bold ${tone.text}`}>{item.score === null || item.score === undefined ? tone.label : `${item.score}/100 · ${tone.label}`}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${item.score ?? 0}%` }} /></div>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.basis}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">Next: {item.action}</p>
          </article>
        );
      })}
    </div>
  </section>
);

export const ConnectorGrid = ({ connectors = [] }) => (
  <section>
    <div className="mb-3 flex items-center gap-2"><PlugZap size={17} className="text-indigo-600" /><h2 className="font-bold">Connector health</h2></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {connectors.map((connector) => (
        <article key={connector.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <span className={cx('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', connector.status === 'healthy' ? 'bg-emerald-500' : connector.status === 'error' ? 'bg-rose-500' : 'bg-amber-400')} />
            <div className="min-w-0"><p className="font-bold text-slate-900 dark:text-white">{connector.name}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{connector.description}</p></div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] dark:border-slate-800">
            <span className="capitalize text-slate-500">{connector.status?.replaceAll('_', ' ')}</span>
            <span className="font-mono text-slate-400">{connector.latencyMs === null ? connector.endpointEnv : `${connector.latencyMs} ms`}</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">{connector.message}</p>
        </article>
      ))}
    </div>
  </section>
);

const ROLES = ['founder', 'admin', 'finance', 'marketing', 'operations', 'support', 'developer', 'viewer'];

export const PermissionsMatrix = () => {
  const groups = useMemo(() => [...new Set(DASHBOARDS.map((item) => item.group))], []);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-indigo-600" /><h2 className="font-bold">Role access matrix</h2></div><p className="mt-1 text-xs text-slate-500">A check means the role can access at least one module in this group. Row-level security still governs every record.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-950/60"><tr><th className="px-5 py-3 text-left">Module group</th>{ROLES.map((role) => <th key={role} className="px-3 py-3 text-center">{role}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{groups.map((group) => <tr key={group}><td className="px-5 py-3 font-semibold">{group}</td>{ROLES.map((role) => <td key={role} className="px-3 py-3 text-center">{DASHBOARDS.some((item) => item.group === group && item.roles.includes(role)) ? <Check size={15} className="mx-auto text-emerald-500" /> : <span className="text-slate-300">—</span>}</td>)}</tr>)}</tbody></table></div>
    </section>
  );
};

const defaultPreferences = { success: true, warning: true, error: true, information: true, live: true, emailDigest: false };

export const NotificationPreferences = ({ onSaved }) => {
  const [preferences, setPreferences] = useState(() => {
    try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem('command-center-notifications') || '{}') }; } catch { return defaultPreferences; }
  });
  const [schedule, setSchedule] = useState(() => {
    try { return { frequency: 'weekly', dashboard: 'founder', email: '', ...JSON.parse(localStorage.getItem('command-center-report-draft') || '{}') }; } catch { return { frequency: 'weekly', dashboard: 'founder', email: '' }; }
  });

  const save = () => {
    localStorage.setItem('command-center-notifications', JSON.stringify(preferences));
    localStorage.setItem('command-center-report-draft', JSON.stringify(schedule));
    onSaved?.();
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Alert preferences</h2><p className="mt-1 text-xs text-slate-500">Saved locally for offline use until a staff-preferences endpoint is connected.</p><div className="mt-5 space-y-3">{Object.entries(preferences).map(([key, enabled]) => <label key={key} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium capitalize dark:border-slate-800">{key.replace(/([A-Z])/g, ' $1')}<input type="checkbox" checked={enabled} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-indigo-600" /></label>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Scheduled report draft</h2><p className="mt-1 text-xs text-slate-500">Prepare the schedule now; delivery activates when the reporting endpoint is configured.</p><div className="mt-5 space-y-3"><select value={schedule.frequency} onChange={(event) => setSchedule((current) => ({ ...current, frequency: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><select value={schedule.dashboard} onChange={(event) => setSchedule((current) => ({ ...current, dashboard: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">{DASHBOARDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><input type="email" value={schedule.email} onChange={(event) => setSchedule((current) => ({ ...current, email: event.target.value }))} placeholder="Recipient email" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" /><button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><Save size={15} /> Save preferences & draft</button></div></section>
    </div>
  );
};

export const GlobalSearchResults = ({ query, results, searching, onSelect }) => {
  if (!query.trim()) return null;
  return (
    <div className="fixed left-4 right-4 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:absolute md:left-0 md:right-auto md:top-12 md:w-full md:max-w-xl">
      <div className="border-b border-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:border-slate-800">Global search</div>
      <div className="max-h-96 overflow-y-auto p-2">
        {searching ? <p className="px-3 py-5 text-center text-sm text-slate-500">Searching authorized records…</p> : results.length ? results.map((result) => <button key={`${result.type}-${result.id}`} type="button" onClick={() => onSelect(result)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"><Search size={14} className="mt-0.5 shrink-0 text-indigo-500" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{result.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{result.type} · {result.detail}</span></span></button>) : <div className="px-4 py-8 text-center"><AlertTriangle size={18} className="mx-auto text-slate-300" /><p className="mt-2 text-sm text-slate-500">No authorized records found.</p></div>}
      </div>
    </div>
  );
};
