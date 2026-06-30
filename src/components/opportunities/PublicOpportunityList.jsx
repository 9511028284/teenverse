import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CalendarDays, Loader2, MapPin, Search } from 'lucide-react';
import { getPublicOpportunitiesForPortal } from '../../services/phase1.api';
import { formatDate, formatMoney, typeLabels } from './opportunityFormat';

const PublicOpportunityList = ({ portalMode = 'APP_PORTAL' }) => {
  const [rows, setRows] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await getPublicOpportunitiesForPortal(portalMode));
    } catch (loadError) {
      console.error('Public opportunity load failed:', loadError);
      setRows([]);
      setError('Could not load active opportunities right now.');
    } finally {
      setLoading(false);
    }
  }, [portalMode]);

  React.useEffect(() => { void load(); }, [load]);

  const visibleRows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => [row.title, row.description, row.type, row.location, ...(row.skills_required || [])]
      .filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [query, rows]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Approved opportunities</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Find your next opportunity</h1>
        <label className="relative mt-5 block max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, skills, or location" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-slate-950" />
        </label>
      </section>

      {error && <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</p>}
      {loading ? (
        <div className="mt-5 flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : visibleRows.length ? (
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleRows.map((row) => (
            <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase text-indigo-700">{typeLabels[row.type] || row.type}</span>
              <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{row.title}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">{row.business_name || 'TeenVerseHub business'}</p>
              <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{row.description}</p>
              <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500 sm:grid-cols-2">
                <span className="flex items-center gap-2"><CalendarDays size={15} /> {formatDate(row.application_deadline)}</span>
                <span className="flex items-center gap-2"><MapPin size={15} /> {row.location || row.work_mode || 'Flexible'}</span>
                <span className="flex items-center gap-2"><Briefcase size={15} /> {formatMoney(row)}</span>
              </div>
              <Link to={`/opportunities/${row.id}`} className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700">View details</Link>
            </article>
          ))}
        </section>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">No active opportunities match your search.</div>
      )}
    </main>
  );
};

export default PublicOpportunityList;
