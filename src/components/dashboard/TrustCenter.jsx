import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  Loader2,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Trophy,
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import {
  acceptTrial,
  approveTrial,
  createTrial,
  fetchTrustCenterData,
  matchApplicantsForJob,
  recalculateTrustScore,
  reviewTrial,
  submitTrial,
  verifyPortfolio,
} from '../../services/trust.api';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not recorded'
    : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

const getLatestBreakdown = (user, history) => (
  Array.isArray(user?.trust_score_breakdown) && user.trust_score_breakdown.length
    ? user.trust_score_breakdown
    : history?.[0]?.breakdown || []
);

const TrustSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {[0, 1, 2].map((item) => (
      <div key={item} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-slate-900/50" />
    ))}
  </div>
);

const BreakdownBar = ({ item }) => {
  const value = Math.max(0, Math.min(100, Number(item.value) || 0));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label || item.key}</span>
        <span className="font-mono text-sm font-black text-slate-950 dark:text-white">{Math.round(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            value >= 75 ? 'bg-emerald-500' : value >= 45 ? 'bg-amber-500' : 'bg-rose-500'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">Weight {item.weight || 0}%</p>
    </div>
  );
};

const TrustCenter = ({ user, jobs = [], applications = [], showToast, setUser }) => {
  const isClient = user?.type === 'client';
  const [data, setData] = React.useState({ history: [], challenges: [], verifications: [], trials: [], matches: [] });
  const [isLoading, setIsLoading] = React.useState(true);
  const [busyAction, setBusyAction] = React.useState('');
  const [portfolioModal, setPortfolioModal] = React.useState(null);
  const [trialModal, setTrialModal] = React.useState(null);
  const [matchResults, setMatchResults] = React.useState(null);
  const [selectedJobId, setSelectedJobId] = React.useState(jobs?.[0]?.id || '');

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      setData(await fetchTrustCenterData(user));
    } catch (error) {
      showToast?.(error.message || 'Trust Center sync failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, user]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!selectedJobId && jobs?.[0]?.id) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);

  const breakdown = getLatestBreakdown(user, data.history);
  const latestChallenge = data.challenges?.[0];
  const latestVerification = data.verifications?.[0];
  const score = Number(user?.trust_score || data.history?.[0]?.score || 0);

  const runRecalculate = async () => {
    setBusyAction('recalculate');
    try {
      const result = await recalculateTrustScore(user.id);
      setUser?.((prev) => ({
        ...prev,
        trust_score: result.score,
        trust_score_breakdown: result.breakdown,
      }));
      showToast?.('Trust score recalculated.', 'success');
      await loadData();
    } catch (error) {
      showToast?.(error.message || 'Could not recalculate trust score.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const startPortfolioVerification = async () => {
    setBusyAction('portfolio');
    try {
      const verification = await verifyPortfolio({ userId: user.id });
      setPortfolioModal({ questions: verification.questions || [], answers: {} });
    } catch (error) {
      showToast?.(error.message || 'Could not start portfolio verification.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const submitPortfolioAnswers = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const answers = Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));
    setBusyAction('portfolio-submit');
    try {
      const result = await verifyPortfolio({
        userId: user.id,
        questions: portfolioModal.questions,
        answers,
      });
      const verification = result.verification || result;
      setUser?.((prev) => ({
        ...prev,
        verified_skills: verification.verified_skills || prev.verified_skills,
        confidence_scores: verification.confidence_scores || prev.confidence_scores,
        project_analysis: verification.project_analysis || prev.project_analysis,
        technical_summary: verification.technical_summary || prev.technical_summary,
        trust_score: result.trust?.score ?? prev.trust_score,
        trust_score_breakdown: result.trust?.breakdown ?? prev.trust_score_breakdown,
      }));
      showToast?.('Portfolio verification completed.', 'success');
      setPortfolioModal(null);
      await loadData();
    } catch (error) {
      showToast?.(error.message || 'Portfolio verification failed.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const runApplicantMatch = async () => {
    if (!selectedJobId) {
      showToast?.('Select a job first.', 'error');
      return;
    }
    setBusyAction('match');
    try {
      const result = await matchApplicantsForJob(selectedJobId);
      setMatchResults(result.rankings || []);
      showToast?.('Applicants ranked with trust signals.', 'success');
      await loadData();
    } catch (error) {
      showToast?.(error.message || 'Applicant ranking failed.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const submitCreateTrial = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const applicationId = String(formData.get('applicationId') || '');
    const selectedApplication = applications.find((app) => String(app.id) === applicationId);
    setBusyAction('trial-create');
    try {
      await createTrial({
        applicationId,
        jobId: selectedApplication?.job_id || selectedJobId || null,
        freelancerId: selectedApplication?.freelancer_id || formData.get('freelancerId'),
        title: formData.get('title'),
        brief: formData.get('brief'),
        amount: Number(formData.get('amount') || 0),
        acceptanceCriteria: String(formData.get('acceptanceCriteria') || '').split('\n').map((item) => item.trim()).filter(Boolean),
      });
      showToast?.('Paid trial invited.', 'success');
      setTrialModal(null);
      await loadData();
    } catch (error) {
      showToast?.(error.message || 'Could not create paid trial.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const runTrialAction = async (trial, action, payload = {}) => {
    setBusyAction(`${action}:${trial.id}`);
    try {
      if (action === 'accept') await acceptTrial(trial.id);
      if (action === 'review') await reviewTrial(trial.id);
      if (action === 'approve') await approveTrial({ trialId: trial.id, ...payload });
      showToast?.('Trial updated.', 'success');
      await loadData();
    } catch (error) {
      showToast?.(error.message || 'Trial update failed.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const submitTrialWork = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusyAction('trial-submit');
    try {
      await submitTrial({
        trialId: trialModal.id,
        submission: {
          summary: formData.get('summary'),
          links: String(formData.get('links') || '').split('\n').map((item) => item.trim()).filter(Boolean),
        },
      });
      showToast?.('Trial submitted.', 'success');
      setTrialModal(null);
      await loadData();
    } catch (error) {
      showToast?.(error.message || 'Trial submission failed.', 'error');
    } finally {
      setBusyAction('');
    }
  };

  if (isLoading) return <TrustSkeleton />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6 pb-12">
      <section className="rounded-[28px] border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={14} /> Trust Center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Verified trust intelligence.</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
              Server-calculated score history, challenge evidence, portfolio verification, applicant matching, and paid trial evidence.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isClient && (
              <Button onClick={startPortfolioVerification} disabled={busyAction === 'portfolio'} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
                {busyAction === 'portfolio' ? 'Preparing...' : 'Verify Portfolio'}
              </Button>
            )}
            <Button onClick={runRecalculate} disabled={busyAction === 'recalculate'} variant="outline" className="rounded-xl">
              <RefreshCw size={14} /> Recalculate
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 dark:border-white/10 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Dynamic Trust Score</span>
            <Trophy className="text-amber-500" size={20} />
          </div>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-6xl font-black tracking-tight text-slate-950 dark:text-white">{Math.round(score)}</span>
            <span className="mb-2 text-sm font-black text-slate-400">/100</span>
          </div>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
            Last challenge: {latestChallenge?.challenge_score ? `${Math.round(latestChallenge.challenge_score)} score` : 'not completed yet'}.
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
            Portfolio: {latestVerification?.status ? latestVerification.status.replace('_', ' ') : 'not verified yet'}.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {breakdown.length ? breakdown.map((item) => <BreakdownBar key={item.key || item.label} item={item} />) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm font-bold text-slate-400 dark:border-white/10 md:col-span-2 xl:col-span-4">
              No breakdown is available yet. Run a recalculation after completing trust evidence.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white"><BarChart3 size={18} /> Score History</h2>
          </div>
          <div className="space-y-3">
            {data.history.length ? data.history.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{row.reason?.replaceAll('_', ' ') || 'Recalculated'}</p>
                  <p className="text-xs font-semibold text-slate-400">{formatDate(row.created_at)}</p>
                </div>
                <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-300">{row.score}</span>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-400 dark:border-white/10">No score changes recorded yet.</p>}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white"><ClipboardCheck size={18} /> Evidence Ledger</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <EvidenceTile icon={TimerReset} label="Challenges" value={data.challenges.length} helper={latestChallenge?.evaluation_date ? `Latest ${formatDate(latestChallenge.evaluation_date)}` : 'No evaluated challenge'} />
            <EvidenceTile icon={FileQuestion} label="Portfolio Checks" value={data.verifications.length} helper={latestVerification?.technical_summary || 'No verification report'} />
            <EvidenceTile icon={Star} label="Paid Trials" value={data.trials.length} helper="Converted trials create verified experience." />
            <EvidenceTile icon={CheckCircle2} label="Verified Skills" value={(user?.verified_skills || []).length} helper={(user?.verified_skills || []).slice(0, 3).join(', ') || 'No verified skills yet'} />
          </div>
        </div>
      </section>

      {isClient && (
        <section className="rounded-[28px] border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white"><Radar size={18} /> AI Applicant Matching</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Ranks real applicants for one of your posted jobs using trust evidence.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold dark:border-white/10 dark:bg-slate-950">
                <option value="">Select job</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
              </select>
              <Button onClick={runApplicantMatch} disabled={busyAction === 'match'} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
                {busyAction === 'match' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Rank Applicants
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {(matchResults || data.matches?.[0]?.rankings || []).slice(0, 6).map((row) => (
              <div key={`${row.applicationId}-${row.freelancerId}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-black text-slate-950 dark:text-white">{row.freelancerName}</h3>
                  <span className="rounded-xl bg-emerald-50 px-2 py-1 font-mono text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{row.overallMatch}%</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{row.explanation}</p>
                <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-indigo-500">{row.recommendation?.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white"><ShieldCheck size={18} /> Paid Trial Workflow</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Create, accept, submit, AI-review, approve, and convert trials into verified evidence.</p>
          </div>
          {isClient && <Button onClick={() => setTrialModal({ type: 'create' })} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Create Trial</Button>}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.trials.length ? data.trials.map((trial) => (
            <TrialCard key={trial.id} trial={trial} isClient={isClient} busyAction={busyAction} onAction={runTrialAction} onSubmit={() => setTrialModal({ type: 'submit', ...trial })} />
          )) : <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm font-bold text-slate-400 dark:border-white/10">No paid trials yet.</p>}
        </div>
      </section>

      {portfolioModal && (
        <Modal title="Portfolio Follow-Up" onClose={() => setPortfolioModal(null)}>
          <form onSubmit={submitPortfolioAnswers} className="space-y-4">
            <p className="text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">Answer context-specific questions so AI can verify project ownership and skill confidence.</p>
            {portfolioModal.questions.map((question, index) => (
              <div key={question.id || index} className="space-y-1.5">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400">{question.question}</label>
                <textarea name={question.id || `q${index}`} required rows={3} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950" />
              </div>
            ))}
            <Button disabled={busyAction === 'portfolio-submit'} className="w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Submit Verification</Button>
          </form>
        </Modal>
      )}

      {trialModal?.type === 'create' && (
        <Modal title="Create Paid Trial" onClose={() => setTrialModal(null)}>
          <form onSubmit={submitCreateTrial} className="space-y-4">
            <select name="applicationId" required className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950">
              <option value="">Choose applicant</option>
              {applications.filter((app) => app.freelancer_id).map((app) => (
                <option key={app.id} value={app.id}>{app.freelancer_name || 'Freelancer'} - {app.jobs?.title || app.title || app.job_title || 'Project'}</option>
              ))}
            </select>
            <input name="title" required placeholder="Trial title" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950" />
            <textarea name="brief" required rows={4} placeholder="Small paid task brief..." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950" />
            <textarea name="acceptanceCriteria" rows={3} placeholder="One acceptance criterion per line" className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950" />
            <input name="amount" required type="number" min="0" step="1" placeholder="Amount" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950" />
            <Button disabled={busyAction === 'trial-create'} className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Invite Freelancer</Button>
          </form>
        </Modal>
      )}

      {trialModal?.type === 'submit' && (
        <Modal title="Submit Paid Trial" onClose={() => setTrialModal(null)}>
          <form onSubmit={submitTrialWork} className="space-y-4">
            <textarea name="summary" required rows={5} placeholder="Summarize the work completed, decisions, and test evidence." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950" />
            <textarea name="links" rows={4} placeholder="Evidence links, one per line" className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold dark:border-white/10 dark:bg-slate-950" />
            <Button disabled={busyAction === 'trial-submit'} className="w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Submit Trial</Button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

const EvidenceTile = ({ icon: Icon, label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
    <div className="mb-3 flex items-center justify-between">
      <Icon size={17} className="text-indigo-500" />
      <span className="font-mono text-lg font-black text-slate-950 dark:text-white">{value}</span>
    </div>
    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">{label}</h3>
    <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{helper}</p>
  </div>
);

const TrialCard = ({ trial, isClient, busyAction, onAction, onSubmit }) => {
  const isBusy = busyAction.endsWith(`:${trial.id}`);
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-950 dark:text-white">{trial.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{trial.brief}</p>
        </div>
        <span className="rounded-xl bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-300">{trial.status}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
        <span className="font-mono text-sm font-black text-slate-950 dark:text-white">₹{Number(trial.amount || 0).toFixed(0)}</span>
        <div className="flex flex-wrap gap-2">
          {!isClient && trial.status === 'invited' && <Button size="sm" disabled={isBusy} onClick={() => onAction(trial, 'accept')} className="rounded-xl">Accept</Button>}
          {!isClient && trial.status === 'accepted' && <Button size="sm" onClick={onSubmit} className="rounded-xl bg-indigo-600 text-white">Submit</Button>}
          {isClient && trial.status === 'submitted' && <Button size="sm" disabled={isBusy} onClick={() => onAction(trial, 'review')} className="rounded-xl bg-indigo-600 text-white">AI Review</Button>}
          {isClient && trial.status === 'ai_reviewed' && <Button size="sm" disabled={isBusy} onClick={() => onAction(trial, 'approve', { rating: Math.max(1, Math.min(5, Number(trial.ai_score || 80) / 20)) })} className="rounded-xl bg-emerald-600 text-white">Approve</Button>}
        </div>
      </div>
      {trial.ai_review?.summary && <p className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">{trial.ai_review.summary}</p>}
    </article>
  );
};

export default TrustCenter;
