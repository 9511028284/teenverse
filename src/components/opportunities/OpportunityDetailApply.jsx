import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Loader2, Lock } from 'lucide-react';
import {
  applyToOpportunity,
  getOpportunityDetail,
  getUserResumeFiles,
  hasUserAppliedToOpportunity,
} from '../../services/phase1.api';
import { formatDate, formatMoney, typeLabels } from './opportunityFormat';

const OpportunityDetailApply = ({ user, portalMode = 'APP_PORTAL' }) => {
  const { id } = useParams();
  const [opportunity, setOpportunity] = React.useState(null);
  const [resumes, setResumes] = React.useState([]);
  const [resumeId, setResumeId] = React.useState('');
  const [coverLetter, setCoverLetter] = React.useState('');
  const [application, setApplication] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const detail = await getOpportunityDetail(id, portalMode);
        if (!active) return;
        setOpportunity(detail);
        if (user?.id) {
          const [files, applied] = await Promise.all([
            getUserResumeFiles(user.id),
            hasUserAppliedToOpportunity(user.id, id),
          ]);
          if (!active) return;
          setResumes(files);
          setResumeId(files[0]?.id || '');
          setApplication(applied.application);
        }
      } catch (error) {
        if (active) setNotice(error?.message || 'This opportunity is unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [id, portalMode, user?.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (coverLetter.trim().length < 20) {
      setNotice('Please write at least 20 characters in your cover letter.');
      return;
    }
    setSubmitting(true);
    setNotice('');
    try {
      const result = await applyToOpportunity({ opportunityId: id, applicantId: user.id, coverLetter, resumeFileId: resumeId || null });
      setApplication(result);
      setNotice('Application submitted successfully.');
    } catch (error) {
      setNotice(error?.message || 'Unable to submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!opportunity) return <main className="mx-auto max-w-4xl p-6"><Link to="/opportunities" className="font-black text-indigo-600">Back to opportunities</Link><p className="mt-5 rounded-2xl bg-rose-50 p-5 font-bold text-rose-700">{notice}</p></main>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/opportunities" className="inline-flex items-center gap-2 text-sm font-black text-indigo-600"><ArrowLeft size={16} /> Back</Link>
      {notice && <p className="mt-4 rounded-2xl bg-indigo-50 p-4 text-sm font-bold text-indigo-700">{notice}</p>}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <p className="text-xs font-black uppercase text-indigo-600">{typeLabels[opportunity.type] || opportunity.type}</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{opportunity.title}</h1>
          <p className="mt-2 font-bold text-slate-500">{opportunity.business_name || 'TeenVerseHub business'}</p>
          <p className="mt-6 whitespace-pre-line text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">{opportunity.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">{(opportunity.skills_required || []).map((skill) => <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{skill}</span>)}</div>
          <p className="mt-6 text-sm font-bold text-slate-500">Deadline: {formatDate(opportunity.application_deadline)} · {formatMoney(opportunity)}</p>
        </article>

        <aside className="h-fit rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="text-lg font-black">Apply</h2>
          {!user?.id ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4"><Lock className="text-indigo-600" size={20} /><p className="mt-2 text-sm font-bold text-slate-600">Login is required to apply.</p><Link to="/login" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">Login to apply</Link></div>
          ) : application && application.status !== 'withdrawn' ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 size={20} /><p className="mt-2">You already applied. Track it in My Applications.</p><Link to="/my-applications" className="mt-3 inline-block underline">View application</Link></div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="block text-xs font-black uppercase text-slate-500">Resume
                {resumes.length ? <select value={resumeId} onChange={(event) => setResumeId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">No resume</option>{resumes.map((file) => <option key={file.id} value={file.id}>{file.original_file_name}</option>)}</select> : <span className="mt-2 block rounded-xl border border-dashed border-slate-200 p-3 normal-case text-slate-500"><FileText size={17} className="mb-2" />Resume upload setup pending. Select an existing resume if available.</span>}
              </label>
              <label className="block text-xs font-black uppercase text-slate-500">Cover letter<textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-medium normal-case" /></label>
              <button disabled={submitting} className="h-11 w-full rounded-xl bg-indigo-600 text-sm font-black text-white disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit application'}</button>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
};

export default OpportunityDetailApply;
