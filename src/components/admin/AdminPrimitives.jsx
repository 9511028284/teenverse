import React, { memo, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Inbox,
  Search,
} from 'lucide-react';
import { formatMetricValue } from './adminFormatters';

const cx = (...values) => values.filter(Boolean).join(' ');

export const KpiCard = memo(({ metric }) => {
  const unavailable = metric.value === null || metric.value === undefined;
  const positive = Number(metric.change) >= 0;

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/30 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className={cx('mt-2 text-2xl font-bold tracking-tight', unavailable ? 'text-slate-400' : 'text-slate-950 dark:text-white')}>
            {formatMetricValue(metric.value, metric.format)}
          </p>
        </div>
        <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', unavailable ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300')}>
          {unavailable ? <DatabaseZap size={17} /> : <CheckCircle2 size={17} />}
        </span>
      </div>
      <div className="mt-3 flex min-h-5 items-center gap-1.5 text-xs">
        {metric.change !== null && metric.change !== undefined ? (
          <span className={cx('inline-flex items-center gap-1 font-semibold', positive ? 'text-emerald-600' : 'text-rose-600')}>
            {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(Number(metric.change)).toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-400">{unavailable ? 'Integration required' : metric.hint || 'Selected period'}</span>
        )}
      </div>
    </article>
  );
});

const chartBounds = (series) => {
  const values = series.map((point) => Number(point.value) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  return { min, max, span: Math.max(max - min, 1) };
};

export const LineChart = memo(({ title, subtitle, series = [], format = 'number' }) => {
  const points = useMemo(() => {
    if (!series.length) return '';
    const { min, span } = chartBounds(series);
    return series.map((point, index) => {
      const x = series.length === 1 ? 50 : (index / (series.length - 1)) * 100;
      const y = 92 - (((Number(point.value) || 0) - min) / span) * 76;
      return `${x},${y}`;
    }).join(' ');
  }, [series]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {series.length > 0 && <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">{formatMetricValue(series.at(-1)?.value, format)}</span>}
      </div>
      {series.length ? (
        <div className="mt-5">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-48 w-full overflow-visible" role="img" aria-label={`${title} trend chart`}>
            <defs>
              <linearGradient id={`gradient-${title.replace(/\W/g, '')}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.26" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[20, 40, 60, 80].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="0.5" />)}
            <polygon points={`0,100 ${points} 100,100`} fill={`url(#gradient-${title.replace(/\W/g, '')})`} />
            <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
            <span>{series[0]?.label}</span>
            <span>{series.at(-1)?.label}</span>
          </div>
        </div>
      ) : <EmptyState compact title="No trend data" description="Events will appear once this integration starts recording data." />}
    </section>
  );
});

export const BarChart = memo(({ title, subtitle, series = [], format = 'number' }) => {
  const max = Math.max(...series.map((item) => Number(item.value) || 0), 1);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-5 space-y-3">
        {series.length ? series.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
              <span className="truncate font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatMetricValue(item.value, format)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(2, ((Number(item.value) || 0) / max) * 100)}%` }} />
            </div>
          </div>
        )) : <EmptyState compact title="No breakdown available" description="No matching records were returned for this period." />}
      </div>
    </section>
  );
});

const normalizeCell = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const DataTable = memo(({ title, description, rows = [], columns = [], pageSize = 10, actions, selectable = false, bulkActions = [], filterKey }) => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: columns[0]?.key || '', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(() => new Set());

  const rowKey = (row, index = 0) => String(row.id || row.user_id || `${row.type || 'row'}-${index}`);
  const filterOptions = useMemo(() => filterKey ? [...new Set(rows.map((row) => normalizeCell(row[filterKey])).filter((value) => value !== '—'))].sort() : [], [filterKey, rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const scoped = filter === 'all' ? rows : rows.filter((row) => normalizeCell(row[filterKey]) === filter);
    const matching = term ? scoped.filter((row) => columns.some((column) => normalizeCell(row[column.key]).toLowerCase().includes(term))) : scoped;
    return [...matching].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      const direction = sort.direction === 'asc' ? 1 : -1;
      return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true }) * direction;
    });
  }, [columns, filter, filterKey, query, rows, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const selectedRows = rows.filter((row, index) => selected.has(rowKey(row, index)));
  const visibleKeys = visible.map((row, index) => rowKey(row, page * pageSize + index));
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selected.has(key));

  const toggleSort = (key) => {
    setPage(0);
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-950 dark:text-white">{title}</h3>
          {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
        {filterOptions.length > 0 && <select aria-label={`Filter ${title}`} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(0); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="all">All {filterKey}</option>{filterOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select>}
        <label className="relative block sm:w-64">
          <span className="sr-only">Search {title}</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search table…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        </div>
      </div>

      {selectable && selected.size > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-5 py-3 dark:border-indigo-900/50 dark:bg-indigo-950/20"><span className="mr-2 text-xs font-bold text-indigo-700 dark:text-indigo-200">{selected.size} selected</span>{bulkActions.map((action) => <button key={action.label} type="button" onClick={() => action.onSelect(selectedRows)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">{action.label}</button>)}<button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-slate-500">Clear</button></div>}

      {visible.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                {selectable && <th className="w-12 px-5 py-3"><input aria-label="Select visible rows" type="checkbox" checked={allVisibleSelected} onChange={() => setSelected((current) => { const next = new Set(current); visibleKeys.forEach((key) => allVisibleSelected ? next.delete(key) : next.add(key)); return next; })} className="h-4 w-4 accent-indigo-600" /></th>}
                {columns.map((column) => (
                  <th key={column.key} className="px-5 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 hover:text-indigo-600">
                      {column.label}
                      {sort.key === column.key && (sort.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                    </button>
                  </th>
                ))}
                {actions && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((row, index) => (
                <tr key={row.id || row.user_id || `${page}-${index}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  {selectable && <td className="px-5 py-3"><input aria-label={`Select row ${rowKey(row, index)}`} type="checkbox" checked={selected.has(rowKey(row, page * pageSize + index))} onChange={() => { const key = rowKey(row, page * pageSize + index); setSelected((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; }); }} className="h-4 w-4 accent-indigo-600" /></td>}
                  {columns.map((column) => <td key={column.key} className="max-w-xs truncate px-5 py-3 text-slate-600 dark:text-slate-300">{column.render ? column.render(row[column.key], row) : normalizeCell(row[column.key])}</td>)}
                  {actions && <td className="px-5 py-3 text-right">{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No records found" description={query ? 'Try a different search term.' : 'No records matched the selected date range.'} />}

      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
        <span>{filtered.length} records</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-slate-700"><ChevronLeft size={14} /></button>
          <span>Page {page + 1} of {totalPages}</span>
          <button type="button" aria-label="Next page" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 dark:border-slate-700"><ChevronRight size={14} /></button>
        </div>
      </div>
    </section>
  );
});

export const StatusGrid = ({ items = [] }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <article key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <span className={cx('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', item.status === 'healthy' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : item.status === 'error' ? 'bg-rose-500' : 'bg-slate-300')} />
        <div><p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p></div>
      </article>
    ))}
  </div>
);

export const EmptyState = ({ title, description, compact = false }) => (
  <div className={cx('flex flex-col items-center justify-center text-center', compact ? 'min-h-36 py-5' : 'min-h-56 p-8')}>
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Inbox size={19} /></span>
    <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
    <AlertCircle className="text-rose-600" />
    <p className="mt-3 font-bold text-rose-900 dark:text-rose-200">Dashboard data could not be loaded</p>
    <p className="mt-1 max-w-md text-sm text-rose-700 dark:text-rose-300">{message}</p>
    {onRetry && <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Try again</button>}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-5" aria-label="Loading dashboard">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>
    <div className="grid gap-5 xl:grid-cols-2"><div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" /></div>
  </div>
);
