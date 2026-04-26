import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Download,
  FileCheck2,
  Layers3,
  Link as LinkIcon,
  Loader2,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
  ToggleLeft,
  Wand2,
} from 'lucide-react';
import { supabase } from '../../supabase';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';

const ALLOWED_PROOF_DOMAINS = [
  'github.com', 'www.github.com', 'behance.net', 'www.behance.net',
  'dribbble.com', 'www.dribbble.com', 'figma.com', 'www.figma.com',
  'linkedin.com', 'www.linkedin.com', 'vercel.app', 'netlify.app',
  'youtube.com', 'www.youtube.com',
];

const STEPS = [
  { id: 'import', label: 'Import', title: 'Drop the raw material', summary: 'Paste old resume notes, projects, wins, links, or anything you want the AI to understand.', icon: Sparkles },
  { id: 'journey', label: 'Story', title: 'Shape the story', summary: 'Write the short professional arc recruiters should remember.', icon: PenLine },
  { id: 'experience', label: 'Proof', title: 'Add one proof point', summary: 'Capture a real role, project, client, internship, or achievement.', icon: Briefcase },
  { id: 'skills', label: 'Skills', title: 'Lock in capabilities', summary: 'Add a skill and the source behind it.', icon: Target },
  { id: 'finish', label: 'Finish', title: 'AI resume optimizer', summary: 'One final pass turns everything into a polished, impact-first resume.', icon: Wand2 },
];

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-cyan-300';

const compactButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

const MotionDiv = motion.div;
const MotionForm = motion.form;

const getGithubHandle = (socialLinks) => {
  const github = socialLinks?.github;
  if (!github) return null;

  try {
    const parsed = new URL(github);
    return parsed.pathname.split('/').filter(Boolean)[0] || null;
  } catch {
    return String(github).replace(/^@/, '').trim() || null;
  }
};

const ResumeBuilder = ({ user, showToast }) => {
  const [currentStep, setCurrentStep] = useState('import');
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [rawImportText, setRawImportText] = useState('');
  const [trustScore, setTrustScore] = useState(user?.trust_score || 0);
  const [journeyText, setJourneyText] = useState(user?.journey_statement || '');
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);
  const [platformWork, setPlatformWork] = useState([]);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [backendTrustBreakdown, setBackendTrustBreakdown] = useState(user?.trust_score_breakdown || []);
  const [profileSocialLinks, setProfileSocialLinks] = useState(user?.social_links || {});
  const [riskLevel, setRiskLevel] = useState(user?.risk_level || 'low');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);

  const resumeRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  const activeIndex = STEPS.findIndex((step) => step.id === currentStep);
  const activeStep = STEPS[activeIndex] || STEPS[0];
  const ActiveIcon = activeStep.icon;

  // --- Dynamic Scaler Hook ---
  // Calculates scale to ensure the 800px page fits within the container with padding.
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const parentWidth = previewContainerRef.current.offsetWidth;
        // Reserve 64px total for surrounding padding (32px left/right)
        const availableWidth = parentWidth - 64; 
        if (availableWidth < 800) {
          setPreviewScale(availableWidth / 800);
        } else {
          setPreviewScale(1);
        }
      }
    };
    setTimeout(updateScale, 50); // Ensure DOM is painted
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const fetchTrustData = async () => {
      if (!user?.id) return;

      const [expRes, skillRes, scoreRes, userRes] = await Promise.all([
        supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('resume_skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.rpc('calculate_trust_score', { p_user: user.id }),
        supabase
          .from('freelancers')
          .select('journey_statement, trust_score_breakdown, risk_level, social_links')
          .eq('id', user.id)
          .single(),
      ]);
      const { data: platformApps } = await supabase
        .from('applications')
        .select('id, status, bid_amount, updated_at, created_at, freelancer_id, client_id, jobs(title)')
        .eq('freelancer_id', user.id)
        .in('status', ['Accepted', 'Completed', 'Paid', 'Processing'])
        .order('updated_at', { ascending: false })
        .limit(4);

      if (expRes.data) setExperiences(expRes.data);
      if (skillRes.data) setSkills(skillRes.data);
      if (scoreRes.data !== null) setTrustScore(scoreRes.data);
      if (userRes.data?.journey_statement) setJourneyText(userRes.data.journey_statement);
      if (Array.isArray(userRes.data?.trust_score_breakdown)) setBackendTrustBreakdown(userRes.data.trust_score_breakdown);
      if (userRes.data?.risk_level) setRiskLevel(userRes.data.risk_level);
      if (userRes.data?.social_links) setProfileSocialLinks(userRes.data.social_links);
      if (platformApps) setPlatformWork(platformApps);
    };

    fetchTrustData();
  }, [user?.id]);

  const resumeData = useMemo(() => {
    const normalizedOptimizedExperiences = optimizedResume?.experiences?.length
      ? optimizedResume.experiences.map((job, index) => ({
          id: `optimized-exp-${index}`,
          title: job.title || 'AI-generated experience',
          company: job.company || 'Self declared',
          description: job.description || '',
          start_date: job.start_date || null,
          end_date: job.end_date || null,
          is_verified: false,
          source: 'ai',
        }))
      : [];

    const normalizedOptimizedSkills = optimizedResume?.skills?.length
      ? optimizedResume.skills.map((skill, index) =>
          typeof skill === 'string'
            ? { id: `optimized-skill-${index}`, skill_name: skill, is_verified: false, source: 'ai' }
            : { id: `optimized-skill-${index}`, skill_name: skill.skill_name || skill.name || String(skill), is_verified: false, source: 'ai' },
        )
      : [];

    const experienceSource = normalizedOptimizedExperiences.length ? normalizedOptimizedExperiences : experiences;
    const skillSource = normalizedOptimizedSkills.length ? normalizedOptimizedSkills : skills;

    return {
      journey: optimizedResume?.journey_statement || journeyText,
      experiences: experienceSource,
      skills: skillSource,
      isOptimized: Boolean(optimizedResume),
    };
  }, [experiences, journeyText, optimizedResume, skills]);

  const groupedExperiences = useMemo(() => {
    const verified = [];
    const selfDeclared = [];
    resumeData.experiences.forEach((job) => {
      if (job.is_verified) verified.push(job);
      else selfDeclared.push(job);
    });
    return { verified, selfDeclared };
  }, [resumeData.experiences]);

  const groupedSkills = useMemo(() => {
    const verified = [];
    const selfDeclared = [];
    resumeData.skills.forEach((skill) => {
      const hasProofSource = ['project', 'certificate', 'platform', 'verified'].includes(String(skill.source || '').toLowerCase());
      if (skill.is_verified || hasProofSource) verified.push(skill);
      else selfDeclared.push(skill);
    });
    return { verified, selfDeclared };
  }, [resumeData.skills]);

  const fallbackTrustBreakdown = useMemo(() => {
    const kycPoints = user?.is_kyc_verified || user?.kyc_status === 'verified' ? 30 : 0;
    const verifiedWorkPoints = Math.min(platformWork.length * 10, 20);
    const verifiedSkillsPoints = Math.min(groupedSkills.verified.length * 2 + groupedExperiences.verified.length * 3, 10);
    const aiPenalty = resumeData.isOptimized ? -10 : 0;
    const selfDeclaredPenalty = groupedExperiences.selfDeclared.length > groupedExperiences.verified.length ? -5 : 0;

    return [
      { label: 'KYC', value: kycPoints },
      { label: 'Platform work', value: verifiedWorkPoints },
      { label: 'Verified proof', value: verifiedSkillsPoints },
      { label: 'AI data', value: aiPenalty },
      { label: 'Self declared weight', value: selfDeclaredPenalty },
    ];
  }, [groupedExperiences.selfDeclared.length, groupedExperiences.verified.length, groupedSkills.verified.length, platformWork.length, resumeData.isOptimized, user?.is_kyc_verified, user?.kyc_status]);

  const displayedTrustBreakdown = backendTrustBreakdown.length ? backendTrustBreakdown : fallbackTrustBreakdown;

  const trustBand = useMemo(() => {
    if (trustScore >= 80) return { label: 'High Trust', className: 'text-emerald-300', tone: 'bg-emerald-400/10 border-emerald-300/30' };
    if (trustScore >= 50) return { label: 'Medium Trust', className: 'text-amber-300', tone: 'bg-amber-400/10 border-amber-300/30' };
    return { label: 'Low Trust', className: 'text-rose-300', tone: 'bg-rose-400/10 border-rose-300/30' };
  }, [trustScore]);

  const riskFlags = useMemo(() => {
    const flags = [];
    if (resumeData.isOptimized) flags.push('AI-generated language is always treated as unverified.');
    if (groupedExperiences.selfDeclared.length > groupedExperiences.verified.length) flags.push('Most experience is self declared, so profile trust should stay conservative.');
    if (groupedSkills.selfDeclared.length && !groupedSkills.verified.length) flags.push('Skills are not proof-backed yet.');
    return flags;
  }, [groupedExperiences.selfDeclared.length, groupedExperiences.verified.length, groupedSkills.selfDeclared.length, groupedSkills.verified.length, resumeData.isOptimized]);

  const completion = Math.round(((activeIndex + 1) / STEPS.length) * 100);

  const refreshTrustScore = async () => {
    if (!user?.id) return;
    const { data } = await supabase.rpc('calculate_trust_score', { p_user: user.id });
    if (data !== null) setTrustScore(data);
  };

  const goToStep = (stepId) => setCurrentStep(stepId);
  const goToNext = () => setCurrentStep(STEPS[Math.min(activeIndex + 1, STEPS.length - 1)].id);

  const validateProofUrl = async (proofUrl) => {
    if (!proofUrl) return { valid: true, normalizedUrl: null };
    try {
      const parsed = new URL(proofUrl);
      const hostname = parsed.hostname.toLowerCase();
      if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, message: 'Proof URL must use http or https.' };
      if (!ALLOWED_PROOF_DOMAINS.includes(hostname)) return { valid: false, message: 'Use a trusted proof source like GitHub, Behance, Figma, LinkedIn, Vercel, or Netlify.' };
      
      const { data, error } = await supabase.functions.invoke('validate-resume-proof', {
        body: {
          proofUrl: parsed.toString(),
          expectedGithubUsername: getGithubHandle(profileSocialLinks),
        },
      });
      if (error || !data?.valid) return { valid: false, message: data?.reason || error?.message || 'Proof link could not be validated.' };
      
      return {
        valid: true,
        normalizedUrl: data.normalizedUrl || parsed.toString(),
        domain: data.domain || hostname,
        metadata: data.metadata || {},
        httpStatus: data.httpStatus || 200,
        ownershipVerified: data.ownershipVerified || false,
      };
    } catch {
      return { valid: false, message: 'Proof URL format looks invalid.' };
    }
  };

  const buildOptimizerInput = () => {
    const experienceText = experiences.map((exp) => [
      `Role: ${exp.title || 'Untitled'}`, `Company: ${exp.company || 'Independent'}`,
      `Dates: ${exp.start_date || 'Unknown'} to ${exp.end_date || 'Present'}`,
      `Impact: ${exp.description || ''}`, exp.proof_url ? `Proof: ${exp.proof_url}` : '',
    ].filter(Boolean).join('\n')).join('\n\n');

    const skillsText = skills.map((skill) => skill.skill_name).filter(Boolean).join(', ');

    return [
      `Candidate: ${user?.name || 'TeenVerse talent'}`, `Specialty: ${user?.specialty || 'Independent talent'}`,
      rawImportText ? `Raw notes:\n${rawImportText}` : '', journeyText ? `Journey statement:\n${journeyText}` : '',
      experienceText ? `Experience:\n${experienceText}` : '', skillsText ? `Skills:\n${skillsText}` : '',
      'Optimize this into a concise, professional, impact-focused resume.',
      'DO NOT exaggerate claims. DO NOT invent scope, leadership, clients, or measurable results.',
      'If the input is weak, keep the writing simple, honest, and specific.',
      'Treat all unverified content as self-declared and keep that uncertainty visible in wording.',
    ].filter(Boolean).join('\n\n');
  };

  const handleSaveJourney = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('freelancers').update({ journey_statement: journeyText }).eq('id', user.id);
      if (error) throw error;
      showToast('Story saved. Moving to proof points.', 'success');
      goToNext();
    } catch (err) { showToast(err.message || 'Failed to save story.', 'error'); } 
    finally { setIsLoading(false); }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    const formData = new FormData(e.target);
    const proofUrl = String(formData.get('proof_url') || '').trim();

    try {
      const validation = await validateProofUrl(proofUrl);
      if (!validation.valid) { showToast(validation.message, 'warning'); return; }

      const { error } = await supabase.rpc('add_experience', {
        p_user: user.id, p_title: formData.get('title'), p_company: formData.get('company'),
        p_start: formData.get('start_date') || null, p_end: formData.get('end_date') || null,
        p_desc: formData.get('description'), p_proof: validation.normalizedUrl,
      });
      if (error) throw error;

      const { data } = await supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
      const savedExperience = data?.find((item) => item.proof_url === validation.normalizedUrl);

      if (savedExperience && validation.normalizedUrl) {
        const proofStatus = validation.ownershipVerified ? 'verified' : 'pending';

        await supabase
          .from('resume_experiences')
          .update({
            proof_status: proofStatus,
            proof_domain: validation.domain,
            proof_metadata: validation.metadata,
            validation_http_status: validation.httpStatus,
          })
          .eq('id', savedExperience.id);

        await supabase.from('resume_verifications').upsert(
          {
            user_id: user.id,
            section: 'experience',
            reference_id: savedExperience.id,
            target_type: 'experience',
            target_id: savedExperience.id,
            status: proofStatus,
            proof_url: validation.normalizedUrl,
            evidence_url: validation.normalizedUrl,
            evidence_domain: validation.domain,
            evidence_metadata: validation.metadata,
            verified_by: validation.ownershipVerified ? 'system' : 'pending_ownership',
            source: validation.ownershipVerified ? 'github' : 'portfolio',
          },
          { onConflict: 'target_type,target_id' },
        );
      }

      setExperiences(data || []);
      await refreshTrustScore();
      showToast('Proof point saved. Next up: skills.', 'success');
      e.target.reset();
      goToNext();
    } catch (err) { showToast(err.message || 'Failed to add experience.', 'error'); } 
    finally { setIsLoading(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    const formData = new FormData(e.target);

    try {
      const { error } = await supabase.rpc('add_skill', {
        p_user: user.id, p_skill: formData.get('skill_name'), p_source: formData.get('source'),
      });
      if (error) throw error;

      const { data } = await supabase.from('resume_skills').select('*').eq('user_id', user.id);
      setSkills(data || []);
      await refreshTrustScore();
      showToast('Skill saved. Ready for the AI finish.', 'success');
      e.target.reset();
      goToNext();
    } catch (err) { showToast(err.message || 'Failed to add skill.', 'error'); } 
    finally { setIsLoading(false); }
  };

  const handleOptimizeResume = async () => {
    const optimizerInput = buildOptimizerInput();
    if (optimizerInput.length < 120) { showToast('Add a little more detail before the final AI pass.', 'warning'); return; }

    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume', { body: { roughText: optimizerInput } });
      if (error) throw error;

      const normalizedData = {
        ...data, source: 'ai', is_verified: false,
        suspicion_flags: [
          ...((data?.suspicion_flags || [])),
          ...(/\b(ai|machine learning|blockchain|global|international|scaled|enterprise)\b/i.test(optimizerInput)
            ? ['unverified_high_claim']
            : []),
        ],
        experiences: (data?.experiences || []).map((job) => ({ ...job, source: 'ai', is_verified: false })),
        skills: (data?.skills || []).map((skill) => typeof skill === 'string' ? { skill_name: skill, source: 'ai', is_verified: false } : { ...skill, source: 'ai', is_verified: false }),
      };
      setOptimizedResume(normalizedData);
      if (data?.journey_statement) setJourneyText(data.journey_statement);
      showToast('AI optimized the full resume, but it remains marked unverified until proof exists.', 'success');
    } catch (err) { showToast(err.message || 'AI optimization failed.', 'error'); } 
    finally { setIsOptimizing(false); }
  };

  // --- THE PDF EXPORT FIX ---
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    showToast('Rendering resume PDF...', 'info');
    try {
      const dataUrl = await toPng(resumeRef.current, {
        quality: 1,
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        width: 800,
        height: 1131,
        style: {
          transform: 'none',       // Override responsive scale to capture true dimensions
          transformOrigin: 'top left',
          margin: '0',
        }
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (1131 * pdfWidth) / 800;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TeenVerse_${(user?.name || 'Resume').replace(/\s+/g, '_')}_Optimized_Resume.pdf`);
      showToast('Export complete.', 'success');
    } catch (err) {
      showToast(err.message || 'Download failed.', 'error');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-120px)] max-w-7xl grid-cols-1 gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-12 lg:px-8">
      <MotionDiv
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-5"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#080b12]">
          <div className="bg-slate-950 px-5 py-6 text-white sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
                  <ShieldCheck size={13} />
                  Guided builder
                </div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Impact Resume Studio</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                  Fast pages, fewer decisions, and a final AI polish that turns rough experience into recruiter-ready impact.
                </p>
              </div>
              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                <div className="text-3xl font-black text-cyan-200">{trustScore}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trust</div>
              </div>
            </div>

            <div className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${trustBand.tone}`}>
              <ShieldCheck size={13} className={trustBand.className} />
              <span className={trustBand.className}>{trustBand.label}</span>
              <span className="text-slate-400">Risk: {riskLevel}</span>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${completion}%` }} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {displayedTrustBreakdown.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className={`text-sm font-black ${item.value >= 0 ? 'text-white' : 'text-amber-300'}`}>
                    {item.value > 0 ? `+${item.value}` : item.value}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 border-b border-slate-200 dark:border-white/10">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isDone = index < activeIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={`flex flex-col items-center gap-1 border-r border-slate-200 px-2 py-3 text-[10px] font-black uppercase tracking-[0.14em] last:border-r-0 dark:border-white/10 ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-200'
                      : isDone
                        ? 'text-emerald-600 dark:text-emerald-300'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-cyan-200 dark:bg-white dark:text-slate-950">
                <ActiveIcon size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{activeStep.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{activeStep.summary}</p>
              </div>
            </div>

            {riskFlags.length > 0 && (
              <div className="mb-5 rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Inconsistent Data Detected</p>
                <div className="mt-2 space-y-2 text-sm leading-6">
                  {riskFlags.map((flag) => (
                    <p key={flag}>Warning: {flag}</p>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {currentStep === 'import' && (
                <MotionDiv
                  key="import"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="space-y-4"
                >
                  <textarea
                    value={rawImportText}
                    onChange={(e) => setRawImportText(e.target.value)}
                    placeholder="Paste notes, a rough resume, school projects, links, achievements, client work, volunteer experience, or anything else the optimizer should use."
                    className={`${inputClass} min-h-[260px] resize-none leading-6`}
                  />
                  <button
                    type="button"
                    onClick={goToNext}
                    className={`${compactButtonClass} w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200`}
                  >
                    Continue to story
                    <ArrowRight size={15} />
                  </button>
                </MotionDiv>
              )}

              {currentStep === 'journey' && (
                <MotionForm
                  key="journey"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleSaveJourney}
                  className="space-y-4"
                >
                  <textarea
                    required
                    value={journeyText}
                    onChange={(e) => setJourneyText(e.target.value)}
                    placeholder="Example: I build polished web experiences for small businesses and student founders, combining React, design instincts, and fast delivery."
                    className={`${inputClass} min-h-[240px] resize-none leading-6`}
                  />
                  <button
                    disabled={isLoading}
                    type="submit"
                    className={`${compactButtonClass} w-full bg-cyan-600 text-white hover:bg-cyan-700`}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={15} /> : <FileCheck2 size={15} />}
                    Save and next
                  </button>
                </MotionForm>
              )}

              {currentStep === 'experience' && (
                <MotionForm
                  key="experience"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleAddExperience}
                  className="space-y-4"
                >
                  <input required name="title" placeholder="Role or project title" className={inputClass} />
                  <input required name="company" placeholder="Company, client, school, or organization" className={inputClass} />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Start</span>
                      <input type="date" name="start_date" className={inputClass} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">End</span>
                      <input type="date" name="end_date" className={inputClass} />
                    </label>
                  </div>
                  <textarea
                    required
                    name="description"
                    placeholder="What changed because of your work? Include metrics, scope, users, tools, or outcomes."
                    className={`${inputClass} min-h-[120px] resize-none leading-6`}
                  />
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input name="proof_url" placeholder="Proof URL: portfolio, GitHub, live site, certificate" className={`${inputClass} pl-11`} />
                  </div>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className={`${compactButtonClass} w-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950`}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={15} /> : <Layers3 size={15} />}
                    Save proof and next
                  </button>
                </MotionForm>
              )}

              {currentStep === 'skills' && (
                <MotionForm
                  key="skills"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  onSubmit={handleAddSkill}
                  className="space-y-4"
                >
                  <input required name="skill_name" placeholder="Skill: React, Python, motion design, client communication" className={inputClass} />
                  <select required name="source" className={inputClass}>
                    <option value="none">Self-taught</option>
                    <option value="project">Project backed</option>
                    <option value="certificate">Certificate backed</option>
                  </select>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className={`${compactButtonClass} w-full bg-amber-500 text-slate-950 hover:bg-amber-400`}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={15} /> : <BadgeCheck size={15} />}
                    Save skill and finish
                  </button>
                </MotionForm>
              )}

              {currentStep === 'finish' && (
                <MotionDiv
                  key="finish"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-3 gap-3">
                    <Metric label="Notes" value={rawImportText ? 'Ready' : 'Empty'} />
                    <Metric label="Proof" value={experiences.length} />
                    <Metric label="Skills" value={skills.length} />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Finish runs a strict AI rewrite using your notes, saved story, proof points, and skills. It is instructed not to exaggerate and every AI line stays marked unverified until proof exists.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isOptimizing}
                    onClick={handleOptimizeResume}
                    className={`${compactButtonClass} w-full bg-fuchsia-600 text-white hover:bg-fuchsia-700`}
                  >
                    {isOptimizing ? <Loader2 className="animate-spin" size={15} /> : <Wand2 size={15} />}
                    Finish with AI optimize
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className={`${compactButtonClass} w-full border border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white`}
                  >
                    <Download size={15} />
                    Export resume PDF
                  </button>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="lg:col-span-7"
      >
        <div className="relative flex h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner dark:border-white/10 dark:bg-[#06080d] lg:h-full">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${resumeData.isOptimized ? 'bg-fuchsia-500' : 'bg-cyan-500'}`} />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 dark:text-white">
                {showVerifiedOnly ? 'Verified-only preview' : resumeData.isOptimized ? 'Optimized preview' : 'Live preview'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVerifiedOnly((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                  showVerifiedOnly
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                <ToggleLeft size={13} />
                {showVerifiedOnly ? 'Verified only' : 'Full resume'}
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                <Download size={13} />
                Export
              </button>
            </div>
          </div>

          {/* THE ABSOLUTE SCALED WRAPPER FIX */}
          <div 
            ref={previewContainerRef}
            className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar"
          >
            {/* Outer wrapper takes up the exact mathematical scaled size. 
              flexShrink-0 ensures flexbox doesn't randomly compress it.
            */}
            <div 
              style={{
                width: 800 * previewScale,
                height: 1131 * previewScale,
                position: 'relative',
                flexShrink: 0
              }}
            >
              {/* Inner wrapper applies the scale without breaking flow */}
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              >
                {/* ACTUAL RESUME DOCUMENT 
                  Hardcoded to 800x1131 (Standard A4 ratio)
                */}
                <div
                  ref={resumeRef}
                  className="h-[1131px] w-[800px] bg-white p-14 text-black shadow-[0_20px_60px_-24px_rgba(15,23,42,0.55)] box-border overflow-hidden"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif" }}
                >
                  <header className="border-b-4 border-slate-950 pb-7">
                    <div className="flex items-start justify-between gap-8">
                      <div>
                        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-cyan-700">TeenVerse resume</p>
                        <h1 className="max-w-[520px] text-[54px] font-black uppercase leading-[0.9] tracking-tight">
                          {user?.name || 'Your Name'}
                        </h1>
                        <p className="mt-4 text-lg font-black uppercase tracking-[0.2em] text-slate-600">
                          {user?.specialty || 'Independent Talent'}
                        </p>
                      </div>
                      <div className="w-40 border-l-2 border-slate-200 pl-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          <ShieldCheck size={14} />
                          Transparency first
                        </div>
                        <div className="mt-2 text-4xl font-black text-slate-950">{trustScore}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trust score</div>
                      </div>
                    </div>
                  </header>

                  <div className="grid grid-cols-12 gap-10 pt-9">
                    <main className="col-span-8 space-y-9">
                      <ResumeSection title="Profile">
                        {resumeData.journey ? (
                          <p className="whitespace-pre-wrap text-[14px] font-medium leading-7 text-slate-700">{resumeData.journey}</p>
                        ) : (
                          <EmptyResumeText>Add your story, then finish with AI optimization.</EmptyResumeText>
                        )}
                      </ResumeSection>

                      <ResumeSection title="Platform verified work">
                        {platformWork.length ? (
                          <div className="space-y-7">
                            {platformWork.map((job) => (
                              <article key={job.id} className="border-l-2 border-emerald-600 pl-5">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="text-lg font-black uppercase tracking-tight text-slate-950">{job.jobs?.title || 'Platform project'}</h4>
                                    <p className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-emerald-700">TeenVerse platform verified</p>
                                  </div>
                                  <span className="rounded-md bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                    {job.status}
                                  </span>
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-6 text-slate-700">
                                  Work completed through TeenVerse. This item is backed by platform records and payment/application state.
                                </p>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <EmptyResumeText>No platform-verified work yet.</EmptyResumeText>
                        )}
                      </ResumeSection>

                      {!showVerifiedOnly && (
                        <ResumeSection title="Self declared experience">
                          {resumeData.experiences.length ? (
                            <div className="space-y-7">
                              {resumeData.experiences.map((job, index) => (
                                <article key={job.id || `optimized-exp-${index}`} className="border-l-2 border-slate-950 pl-5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-950">{job.title}</h4>
                                      <p className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-cyan-700">{job.company}</p>
                                    </div>
                                    <span
                                      className={`rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                        job.is_verified
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      {job.is_verified ? 'Verified' : job.source === 'ai' ? 'AI generated' : 'Self declared'}
                                    </span>
                                  </div>
                                  <p className="mt-3 whitespace-pre-wrap text-[13px] font-medium leading-6 text-slate-700">{job.description}</p>
                                  {!job.is_verified && (
                                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">
                                      AI-generated or manual claim. Not verified.
                                    </p>
                                  )}
                                </article>
                              ))}
                            </div>
                          ) : (
                            <EmptyResumeText>Add at least one role, project, or win.</EmptyResumeText>
                          )}
                        </ResumeSection>
                      )}
                    </main>

                    <aside className="col-span-4 space-y-8">
                      <ResumeSection title="Verified skills" compact>
                        {groupedSkills.verified.length ? (
                          <div className="space-y-2">
                            {groupedSkills.verified.map((skill, index) => (
                              <div
                                key={skill.id || `skill-${index}`}
                                className="flex items-center justify-between gap-3 border border-slate-200 px-3 py-2"
                              >
                                <span className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-700">
                                  {skill.skill_name}
                                </span>
                                <CheckCircle2 size={13} className="shrink-0 text-cyan-700" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyResumeText>No proof-backed skills yet.</EmptyResumeText>
                        )}
                      </ResumeSection>

                      {!showVerifiedOnly && (
                        <ResumeSection title="Self declared skills" compact>
                          {groupedSkills.selfDeclared.length ? (
                            <div className="space-y-2">
                              {groupedSkills.selfDeclared.map((skill, index) => (
                                <div
                                  key={skill.id || `self-skill-${index}`}
                                  className="flex items-center justify-between gap-3 border border-amber-200 bg-amber-50 px-3 py-2"
                                >
                                  <span className="text-[12px] font-black uppercase tracking-[0.1em] text-amber-900">
                                    {skill.skill_name}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Unverified</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyResumeText>No unverified skills listed.</EmptyResumeText>
                          )}
                        </ResumeSection>
                      )}

                      <ResumeSection title="Signal" compact>
                        <div className="space-y-3 text-[12px] font-bold leading-5 text-slate-600">
                          <p>Verified content is separated from manual and AI claims so the design cannot overstate trust.</p>
                          {resumeData.isOptimized && (
                            <p className="border-l-2 border-fuchsia-500 pl-3 text-fuchsia-700">AI-generated language present. Not verified.</p>
                          )}
                        </div>
                      </ResumeSection>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MotionDiv>
      
      {/* Global CSS for scrollbar (if not already handled in index.css) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}} />
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
    <div className="text-lg font-black text-slate-950 dark:text-white">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
  </div>
);

const ResumeSection = ({ title, children, compact = false }) => (
  <section>
    <h3
      className={`mb-4 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.24em] text-slate-950 ${
        compact ? 'border-b-2 border-slate-950 pb-2' : ''
      }`}
    >
      {!compact && <span className="h-2 w-2 bg-cyan-600" />}
      {title}
    </h3>
    {children}
  </section>
);

const EmptyResumeText = ({ children }) => <p className="text-[13px] font-semibold italic leading-6 text-slate-400">{children}</p>;

export default ResumeBuilder;
