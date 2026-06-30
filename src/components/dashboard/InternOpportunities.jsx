import React from 'react';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  IndianRupee,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import {
  PORTAL_MODES,
  applyToOpportunity,
  getPublicOpportunitiesForPortal,
  getUserOpportunityApplications,
  withdrawOpportunityApplication,
} from '../../services/phase1.api';
import { logSearch } from '../../services/auxiliary.api';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const TYPE_LABELS = {
  internship: 'Internship',
  freelance: 'Freelance',
  part_time: 'Part-time',
  campus_ambassador: 'Campus Ambassador',
  entry_level: 'Entry-level',
  startup_collab: 'Startup Collaboration',
};

const STATUS_STYLES = {
  applied: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
  shortlisted: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
  selected: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
  completed: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300',
};

const formatDate = (value) => {
  if (!value) return 'Rolling';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Rolling';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatStatus = (status = 'applied') => (
  status.charAt(0).toUpperCase() + status.slice(1)
);

const formatMoney = (opportunity) => {
  if (opportunity?.is_paid === false) return 'Unpaid / learning';

  const min = Number(opportunity?.stipend_min);
  const max = Number(opportunity?.stipend_max);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;
  const currency = opportunity?.currency === 'INR' ? 'Rs.' : opportunity?.currency || 'Rs.';

  if (hasMin && hasMax) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (hasMin) return `From ${currency} ${min.toLocaleString()}`;
  if (hasMax) return `Up to ${currency} ${max.toLocaleString()}`;
  return 'Payment not specified';
};

const getApplicationOpportunity = (application) => application?.opportunities || application?.opportunity || null;

const InternStat = ({ icon: Icon, label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        <Icon size={18} />
      </span>
    </div>
    <p className="mt-3 text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400">{helper}</p>
  </div>
);

const InternOpportunities = ({ user, showToast, mode = 'browse' }) => {
  const [opportunities, setOpportunities] = React.useState([]);
  const [applications, setApplications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = React.useState(null);
  const [coverLetter, setCoverLetter] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  const activeApplicationByOpportunity = React.useMemo(() => {
    const map = new Map();
    applications.forEach((application) => {
      if (application.status !== 'withdrawn') {
        map.set(application.opportunity_id, application);
      }
    });
    return map;
  }, [applications]);

  const filteredOpportunities = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return opportunities;

    return opportunities.filter((opportunity) => {
      const haystack = [
        opportunity.title,
        opportunity.description,
        opportunity.type,
        opportunity.work_mode,
        opportunity.location,
        ...(opportunity.skills_required || []),
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [opportunities, searchTerm]);

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [publicRows, applicationRows] = await Promise.all([
        getPublicOpportunitiesForPortal(PORTAL_MODES.INTERN),
        getUserOpportunityApplications(user.id),
      ]);

      setOpportunities(publicRows);
      setApplications(applicationRows);
    } catch (error) {
      console.error('Intern dashboard load failed:', error);
      showToast?.('Unable to load internship opportunities.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2 || loading || isApplicationsMode) return undefined;

    const timer = window.setTimeout(() => {
      void logSearch(query, {
        mode,
        source: 'intern_opportunities',
      }, filteredOpportunities.length, { portal: 'intern' });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [filteredOpportunities.length, isApplicationsMode, loading, mode, searchTerm]);

  const openApply = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setCoverLetter('');
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!selectedOpportunity) return;

    if (coverLetter.trim().length < 20) {
      showToast?.('Please write a short cover note before applying.', 'error');
      return;
    }

    setApplying(true);

    try {
      const application = await applyToOpportunity(user.id, selectedOpportunity.id, {
        cover_letter: coverLetter,
      });

      setApplications((current) => [application, ...current]);
      setSelectedOpportunity(null);
      showToast?.('Application submitted successfully.', 'success');
    } catch (error) {
      console.error('Opportunity application failed:', error);
      const duplicate = error?.code === '23505';
      showToast?.(duplicate ? 'You have already applied to this opportunity.' : 'Unable to submit application.', 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async (application) => {
    try {
      const updated = await withdrawOpportunityApplication(application.id, user.id);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      showToast?.('Application withdrawn.', 'success');
    } catch (error) {
      console.error('Withdraw application failed:', error);
      showToast?.('Unable to withdraw application.', 'error');
    }
  };

  const selectedCount = applications.filter((application) => application.status === 'selected').length;
  const activeCount = applications.filter((application) => !['withdrawn', 'rejected'].includes(application.status)).length;
  const isApplicationsMode = mode === 'applications';

  return (
    <div className="space-y-5 pb-12 text-left">
      <section className="relative overflow-hidden rounded-[28px] border border-white bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.14),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(99,102,241,0.14),transparent_30%)]" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
              <Sparkles size={14} />
              Intern portal
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Find verified early-career opportunities
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Browse reviewed internships, ambassador roles, part-time work, and startup collaborations published for students and early talent.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-indigo-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-white"
              placeholder="Search skills, role, location..."
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InternStat icon={Briefcase} label="Open roles" value={opportunities.length} helper="Approved opportunities visible on the intern portal." />
        <InternStat icon={FileText} label="Applications" value={applications.length} helper={`${activeCount} active application${activeCount === 1 ? '' : 's'} in progress.`} />
        <InternStat icon={UserCheck} label="Selections" value={selectedCount} helper="Offers or selected statuses from reviewers." />
      </section>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : isApplicationsMode ? (
        <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50">
          <div className="mb-5">
            <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">My applications</h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Track statuses from posting teams and withdraw applications when needed.</p>
          </div>

          {applications.length ? (
            <div className="space-y-3">
              {applications.map((application) => {
                const opportunity = getApplicationOpportunity(application);
                const canWithdraw = !['withdrawn', 'selected', 'completed', 'rejected'].includes(application.status);

                return (
                  <article key={application.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/40">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', STATUS_STYLES[application.status] || STATUS_STYLES.applied)}>
                          {formatStatus(application.status)}
                        </span>
                        <h3 className="mt-3 text-base font-black text-slate-950 dark:text-white">{opportunity?.title || 'Opportunity'}</h3>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500 dark:text-slate-400">{opportunity?.description || application.cover_letter}</p>
                      </div>

                      {canWithdraw && (
                        <button
                          type="button"
                          onClick={() => handleWithdraw(application)}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm font-bold text-slate-600 dark:text-slate-400 sm:grid-cols-3">
                      <span className="flex items-center gap-2"><CalendarDays size={15} className="text-amber-500" /> Applied {formatDate(application.applied_at)}</span>
                      <span className="flex items-center gap-2"><Globe2 size={15} className="text-sky-500" /> {opportunity?.work_mode || 'remote'}</span>
                      <span className="flex items-center gap-2"><IndianRupee size={15} className="text-emerald-500" /> {formatMoney(opportunity)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/30">
              <ShieldCheck size={28} className="mx-auto text-indigo-500" />
              <h3 className="mt-3 text-base font-black text-slate-950 dark:text-white">No applications yet</h3>
              <p className="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">Apply to a reviewed opportunity and it will appear here.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/50">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Recommended opportunities</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Apply once per opportunity. Businesses review applications from their portal.</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Refresh
            </button>
          </div>

          {filteredOpportunities.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredOpportunities.map((opportunity) => {
                const existingApplication = activeApplicationByOpportunity.get(opportunity.id);

                return (
                  <article key={opportunity.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-950/40">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                        {TYPE_LABELS[opportunity.type] || opportunity.type}
                      </span>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Active
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950 dark:text-white">{opportunity.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{opportunity.description}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(opportunity.skills_required || []).slice(0, 5).map((skill) => (
                        <span key={skill} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 dark:bg-white/5 dark:text-slate-300">{skill}</span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 text-sm font-bold text-slate-600 dark:text-slate-400 sm:grid-cols-2">
                      <span className="flex items-center gap-2"><Globe2 size={15} className="text-sky-500" /> {opportunity.work_mode || 'remote'}</span>
                      <span className="flex items-center gap-2"><CalendarDays size={15} className="text-amber-500" /> Deadline {formatDate(opportunity.application_deadline)}</span>
                      <span className="flex items-center gap-2"><IndianRupee size={15} className="text-emerald-500" /> {formatMoney(opportunity)}</span>
                      <span className="flex items-center gap-2"><Clock3 size={15} className="text-violet-500" /> {opportunity.duration || 'Flexible'}</span>
                    </div>

                    <div className="mt-5">
                      {existingApplication ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-black text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                          <span className="flex items-center gap-2"><CheckCircle2 size={16} /> {formatStatus(existingApplication.status)}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openApply(opportunity)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700"
                        >
                          <Send size={16} />
                          Apply now
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/30">
              <Briefcase size={28} className="mx-auto text-indigo-500" />
              <h3 className="mt-3 text-base font-black text-slate-950 dark:text-white">No matching opportunities</h3>
              <p className="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">Try a different search term or check back after more reviewed roles are published.</p>
            </div>
          )}
        </section>
      )}

      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={submitApplication} className="w-full max-w-xl rounded-[28px] border border-white/20 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Apply to {selectedOpportunity.title}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Write a specific note about why you fit this opportunity.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label="Close application modal"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              rows={7}
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 outline-none transition focus:border-indigo-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              placeholder="Mention your relevant skills, availability, and one example of your work or learning."
            />

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Applications are stored securely and visible to the posting team.</p>
              <button
                type="submit"
                disabled={applying}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {applying ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                Submit application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InternOpportunities;
