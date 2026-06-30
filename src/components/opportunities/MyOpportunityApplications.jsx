import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Loader2 } from 'lucide-react';
import { getMyOpportunityApplications, withdrawMyOpportunityApplication } from '../../services/phase1.api';
import { formatDate } from './opportunityFormat';

const MyOpportunityApplications = ({ userId }) => {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [notice, setNotice] = React.useState('');
  const load = React.useCallback(async () => {
    setLoading(true);
    try { setRows(await getMyOpportunityApplications(userId)); }
    catch (error) { setNotice(error?.message || 'Could not load applications.'); }
    finally { setLoading(false); }
  }, [userId]);
  React.useEffect(() => { void load(); }, [load]);

  const withdraw = async (row) => {
    if (!window.confirm('Withdraw this application?')) return;
    try { await withdrawMyOpportunityApplication(row.id); setNotice('Application withdrawn.'); await load(); }
    catch (error) { setNotice(error?.message || 'Could not withdraw application.'); }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-black">My Applications</h1><p className="mt-1 text-sm font-bold text-slate-500">Track status updates from businesses.</p></div><Link to="/opportunities" className="text-sm font-black text-indigo-600">Browse opportunities</Link></div>
      {notice && <p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm font-bold text-indigo-700">{notice}</p>}
      {loading ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="animate-spin" /></div> : rows.length ? <div className="mt-5 space-y-3">{rows.map((row) => {
        const opportunity = row.opportunities || row.opportunity || {};
        return <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70"><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase">{row.status}</span><h2 className="mt-3 text-lg font-black">{opportunity.title || 'Opportunity'}</h2><p className="mt-1 text-sm font-bold text-slate-500">{opportunity.business_name || 'TeenVerseHub business'} · Applied {formatDate(row.applied_at)}</p>{['applied', 'shortlisted'].includes(row.status) && <button onClick={() => withdraw(row)} className="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase">Withdraw</button>}</article>;
      })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center"><Briefcase className="mx-auto text-indigo-600" /><p className="mt-3 font-black">No applications yet.</p></div>}
    </main>
  );
};

export default MyOpportunityApplications;
