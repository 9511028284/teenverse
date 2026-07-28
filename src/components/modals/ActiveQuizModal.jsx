import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Clock, FileCheck2, Link as LinkIcon, Save, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import { autosaveSkillChallenge } from '../../services/trust.api';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const normalizeDeliverables = (deliverables) => (
  Array.isArray(deliverables) && deliverables.length
    ? deliverables.map(String).filter(Boolean)
    : ['solution artifact', 'implementation notes', 'quality checklist']
);

const normalizeMandatoryFields = (constraints) => {
  const fields = Array.isArray(constraints?.mandatoryFields) ? constraints.mandatoryFields : [];
  return fields
    .map((field, index) => ({
      id: String(field?.id || `required_${index + 1}`),
      label: String(field?.label || `Required field ${index + 1}`),
      type: ['text', 'textarea', 'checkbox'].includes(String(field?.type)) ? String(field.type) : 'textarea',
      required: field?.required !== false,
      minLength: Math.max(1, Number(field?.minLength || 1)),
      placeholder: String(field?.placeholder || ''),
    }))
    .filter((field) => field.id && field.label);
};

const readStoredDraft = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const ActiveQuizModal = ({ modalData, handleQuizSelection, onClose, showToast }) => {
  const challenge = modalData?.data;
  const userId = modalData?.userId;
  const challengeId = challenge?.id;
  const challengeAutoSave = challenge?.auto_save;
  const draftStorageKey = challengeId ? `teenverse:challenge-draft:${challengeId}` : '';
  const initialDraft = React.useMemo(() => readStoredDraft(draftStorageKey), [draftStorageKey]);
  const savedDraft = initialDraft || challengeAutoSave || {};
  const [artifact, setArtifact] = React.useState(savedDraft?.artifact || '');
  const [notes, setNotes] = React.useState(savedDraft?.notes || '');
  const [linksText, setLinksText] = React.useState((savedDraft?.links || []).join('\n'));
  const [mandatoryValues, setMandatoryValues] = React.useState(savedDraft?.mandatory || {});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [saveState, setSaveState] = React.useState('Ready');
  const [secondsLeft, setSecondsLeft] = React.useState(() => {
    const expiresAt = challenge?.expires_at ? new Date(challenge.expires_at).getTime() : Date.now() + 45 * 60_000;
    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  });

  const deliverables = React.useMemo(() => normalizeDeliverables(challenge?.deliverables), [challenge?.deliverables]);
  const mandatoryFields = React.useMemo(() => normalizeMandatoryFields(challenge?.constraints), [challenge?.constraints]);
  const progress = React.useMemo(() => {
    const total = Math.max(1, Number(challenge?.duration_minutes || 45) * 60);
    return Math.max(0, Math.min(100, ((total - secondsLeft) / total) * 100));
  }, [challenge?.duration_minutes, secondsLeft]);

  React.useEffect(() => {
    const nextDraft = readStoredDraft(draftStorageKey) || challengeAutoSave || {};
    setArtifact(nextDraft?.artifact || '');
    setNotes(nextDraft?.notes || '');
    setLinksText((nextDraft?.links || []).join('\n'));
    setMandatoryValues(nextDraft?.mandatory || {});
  }, [challenge?.id, challengeAutoSave, draftStorageKey]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!draftStorageKey || typeof window === 'undefined' || isSubmitting) return;
    const links = linksText.split('\n').map((link) => link.trim()).filter(Boolean);
    window.localStorage.setItem(draftStorageKey, JSON.stringify({
      artifact,
      notes,
      links,
      mandatory: mandatoryValues,
      savedAt: new Date().toISOString(),
    }));
  }, [artifact, draftStorageKey, isSubmitting, linksText, mandatoryValues, notes]);

  React.useEffect(() => {
    if (!challengeId || !userId || isSubmitting) return undefined;
    setSaveState('Saving');
    const handle = window.setTimeout(async () => {
      try {
        const links = linksText.split('\n').map((link) => link.trim()).filter(Boolean);
        await autosaveSkillChallenge({
          userId,
          challengeId,
          draft: { artifact, notes, links, mandatory: mandatoryValues },
        });
        setSaveState('Saved');
      } catch (error) {
        console.warn('Challenge autosave failed:', error);
        setSaveState('Offline');
      }
    }, 900);
    return () => window.clearTimeout(handle);
  }, [artifact, challengeId, isSubmitting, linksText, mandatoryValues, notes, userId]);

  if (!challenge) return null;

  const submitChallenge = async (event) => {
    event.preventDefault();
    if (secondsLeft <= 0) {
      showToast?.('Challenge time expired. Generate a fresh challenge to continue.', 'error');
      return;
    }

    const links = linksText.split('\n').map((link) => link.trim()).filter(Boolean);
    const missingMandatoryFields = mandatoryFields.filter((field) => {
      if (!field.required) return false;
      if (field.type === 'checkbox') return mandatoryValues[field.id] !== true;
      return String(mandatoryValues[field.id] || '').trim().length < field.minLength;
    });

    if (missingMandatoryFields.length > 0) {
      showToast?.(`Complete required fields first: ${missingMandatoryFields.map((field) => field.label).join(', ')}.`, 'error');
      return;
    }

    if (mandatoryFields.length === 0 && artifact.trim().length < 80 && notes.trim().length < 80 && links.length === 0) {
      showToast?.('Add a meaningful artifact, explanation, or project link before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleQuizSelection(modalData.category, true, modalData.isGeneral, {
        challengeId,
        submission: {
          artifact: artifact.trim(),
          notes: notes.trim(),
          links,
          mandatory: mandatoryValues,
          submittedAtClient: new Date().toISOString(),
        },
      });
      if (draftStorageKey && typeof window !== 'undefined') {
        window.localStorage.removeItem(draftStorageKey);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={(
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-sm font-black uppercase tracking-widest">AI Practical Skill Challenge</span>
        </div>
      )}
      onClose={onClose}
    >
      <form onSubmit={submitChallenge} className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                <Sparkles size={12} /> Unique Challenge
              </div>
              <h3 className="text-lg font-black leading-tight text-slate-950 dark:text-white">{challenge.title}</h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">{challenge.brief}</p>
            </div>
            <div className={cn(
              'shrink-0 rounded-2xl border px-3 py-2 text-center font-mono',
              secondsLeft <= 300
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
                : 'border-slate-200 bg-white/80 text-slate-800 dark:border-white/10 dark:bg-slate-950/60 dark:text-white'
            )}>
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider">
                <Clock size={12} /> Time
              </div>
              <div className="mt-1 text-lg font-black">{formatTime(secondsLeft)}</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/70 dark:bg-slate-900">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {deliverables.slice(0, 3).map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 dark:bg-slate-900 dark:text-indigo-300">
                <FileCheck2 size={15} />
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-white">{item}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Challenge Instructions</label>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <Save size={11} /> {saveState}
            </span>
          </div>
          <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{challenge.instructions}</p>
        </section>

        {mandatoryFields.length > 0 && (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <div className="mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300">Quick Fit Check</h4>
              <p className="mt-1 text-xs font-semibold text-indigo-700/80 dark:text-indigo-200/80">
                Just enough detail to prove you understood the client brief. Short answers are okay.
              </p>
            </div>
            <div className="grid gap-3">
              {mandatoryFields.map((field) => (
                <div key={field.id} className="rounded-2xl border border-white/70 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/40">
                  {field.type === 'checkbox' ? (
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={mandatoryValues[field.id] === true}
                        onChange={(event) => setMandatoryValues((current) => ({ ...current, [field.id]: event.target.checked }))}
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600"
                      />
                      <span>
                        <span className="block text-sm font-black text-slate-900 dark:text-white">{field.label}</span>
                        {field.placeholder && <span className="mt-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{field.placeholder}</span>}
                      </span>
                    </label>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{field.label}</label>
                      {field.type === 'text' ? (
                        <input
                          value={String(mandatoryValues[field.id] || '')}
                          onChange={(event) => setMandatoryValues((current) => ({ ...current, [field.id]: event.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                        />
                      ) : (
                        <textarea
                          value={String(mandatoryValues[field.id] || '')}
                          onChange={(event) => setMandatoryValues((current) => ({ ...current, [field.id]: event.target.value }))}
                          rows={3}
                          placeholder={field.placeholder}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                        />
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Short answer is fine</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <details className="group rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
          <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Optional: add design proof or links
          </summary>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Work Sample</label>
              <textarea
                value={artifact}
                onChange={(event) => setArtifact(event.target.value)}
                rows={5}
                placeholder="Optional: paste a rough concept, design notes, or draft explanation if you already have one."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Extra Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Optional: originality proof, references, checks, or revision notes."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <LinkIcon size={13} /> Links
                </label>
                <textarea
                  value={linksText}
                  onChange={(event) => setLinksText(event.target.value)}
                  rows={3}
                  placeholder="Optional: Figma, Canva, Drive, portfolio, or practice design links."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        </details>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold leading-relaxed text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="mb-1 flex items-center gap-2 font-black uppercase tracking-wider"><ShieldCheck size={14} /> Evaluated Server-Side</div>
          AI reviews quality, originality, plagiarism risk, completeness, instruction following, estimated experience, improvement suggestions, and confidence.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto rounded-xl">Close</Button>
          <Button disabled={isSubmitting || secondsLeft <= 0} className="w-full sm:w-auto bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl">
            {isSubmitting ? 'Evaluating...' : (
              <span className="inline-flex items-center gap-2"><TimerReset size={14} /> Submit Challenge</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ActiveQuizModal;
