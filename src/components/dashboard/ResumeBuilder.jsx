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

/* ─── constants ─────────────────────────────────────────────────────────────── */

const ALLOWED_PROOF_DOMAINS = [
  'github.com','www.github.com','behance.net','www.behance.net',
  'dribbble.com','www.dribbble.com','figma.com','www.figma.com',
  'linkedin.com','www.linkedin.com','vercel.app','netlify.app',
  'youtube.com','www.youtube.com',
];

const STEPS = [
  { id:'import',     label:'01', title:'Raw Material',   desc:'Paste anything — notes, links, old resume, wins.',    icon: Sparkles  },
  { id:'journey',    label:'02', title:'Your Story',     desc:'The two-line arc recruiters should remember.',        icon: PenLine   },
  { id:'experience', label:'03', title:'Proof Point',    desc:'One real role, project, or achievement.',             icon: Briefcase },
  { id:'skills',     label:'04', title:'Capabilities',   desc:'A skill and the source that backs it.',               icon: Target    },
  { id:'finish',     label:'05', title:'AI Polish',      desc:'Final pass transforms everything into impact prose.', icon: Wand2     },
];

const unwrapFunctionData = (payload) => payload?.success ? payload.data : payload;

const getFunctionErrorMessage = async (error, fallback) => {
  const contextBody = await error?.context?.json?.().catch(() => null);
  return contextBody?.error || error?.message || fallback;
};

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

/* ─── main component ─────────────────────────────────────────────────────────── */

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

  const activeIndex = STEPS.findIndex((s) => s.id === currentStep);
  const activeStep = STEPS[activeIndex] || STEPS[0];
  const riskTone = String(riskLevel || 'low').toLowerCase();

  /* ── scale ── */
  useEffect(() => {
    const update = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.offsetWidth - 64;
        setPreviewScale(w < 800 ? w / 800 : 1);
      }
    };
    setTimeout(update, 50);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── data fetch ── */
  useEffect(() => {
    const fetch_ = async () => {
      if (!user?.id) return;
      const [expRes, skillRes, scoreRes, userRes] = await Promise.all([
        supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('resume_skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.rpc('calculate_trust_score', { p_user: user.id }),
        supabase.from('freelancers').select('journey_statement, trust_score_breakdown, risk_level, social_links').eq('id', user.id).single(),
      ]);
      const { data: platformApps } = await supabase
        .from('applications')
        .select('id, status, bid_amount, updated_at, created_at, freelancer_id, client_id, jobs(title)')
        .eq('freelancer_id', user.id)
        .in('status', ['Accepted','Completed','Paid','Processing'])
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
    fetch_();
  }, [user?.id]);

  /* ── derived ── */
  const resumeData = useMemo(() => {
    const normExps = optimizedResume?.experiences?.length
      ? optimizedResume.experiences.map((j, i) => ({ id:`opt-exp-${i}`, title:j.title||'AI experience', company:j.company||'Self declared', description:j.description||'', start_date:j.start_date||null, end_date:j.end_date||null, is_verified:false, source:'ai' }))
      : [];
    const normSkills = optimizedResume?.skills?.length
      ? optimizedResume.skills.map((s, i) => typeof s === 'string' ? { id:`opt-sk-${i}`, skill_name:s, is_verified:false, source:'ai' } : { id:`opt-sk-${i}`, skill_name:s.skill_name||s.name||String(s), is_verified:false, source:'ai' })
      : [];
    return {
      journey: optimizedResume?.journey_statement || journeyText,
      experiences: normExps.length ? normExps : experiences,
      skills: normSkills.length ? normSkills : skills,
      isOptimized: Boolean(optimizedResume),
    };
  }, [experiences, journeyText, optimizedResume, skills]);

  const groupedExperiences = useMemo(() => {
    const v=[], s=[];
    resumeData.experiences.forEach((j) => (j.is_verified ? v : s).push(j));
    return { verified:v, selfDeclared:s };
  }, [resumeData.experiences]);

  const groupedSkills = useMemo(() => {
    const v=[], s=[];
    resumeData.skills.forEach((sk) => {
      const proof = ['project','certificate','platform','verified'].includes(String(sk.source||'').toLowerCase());
      (sk.is_verified || proof ? v : s).push(sk);
    });
    return { verified:v, selfDeclared:s };
  }, [resumeData.skills]);

  const fallbackTrustBreakdown = useMemo(() => [
    { label:'KYC', value: user?.is_kyc_verified || user?.kyc_status==='verified' ? 30 : 0 },
    { label:'Platform', value: Math.min(platformWork.length * 10, 20) },
    { label:'Verified', value: Math.min(groupedSkills.verified.length * 2 + groupedExperiences.verified.length * 3, 10) },
    { label:'AI data', value: resumeData.isOptimized ? -10 : 0 },
    { label:'Self-declared', value: groupedExperiences.selfDeclared.length > groupedExperiences.verified.length ? -5 : 0 },
  ], [groupedExperiences, groupedSkills, platformWork.length, resumeData.isOptimized, user?.is_kyc_verified, user?.kyc_status]);

  const displayedTrustBreakdown = backendTrustBreakdown.length ? backendTrustBreakdown : fallbackTrustBreakdown;

  const trustBand = useMemo(() => {
    if (trustScore >= 80) return { label:'High Trust', cls:'var(--rb-success)' };
    if (trustScore >= 50) return { label:'Medium Trust', cls:'var(--rb-warning)' };
    return { label:'Low Trust', cls:'var(--rb-danger)' };
  }, [trustScore]);

  const riskFlags = useMemo(() => {
    const f=[];
    if (resumeData.isOptimized) f.push('AI-generated language is always treated as unverified.');
    if (groupedExperiences.selfDeclared.length > groupedExperiences.verified.length) f.push('Most experience is self declared.');
    if (groupedSkills.selfDeclared.length && !groupedSkills.verified.length) f.push('Skills are not proof-backed yet.');
    return f;
  }, [groupedExperiences, groupedSkills, resumeData.isOptimized]);

  const completion = Math.round(((activeIndex + 1) / STEPS.length) * 100);

  /* ── actions ── */
  const refreshTrustScore = async () => {
    if (!user?.id) return;
    const { data } = await supabase.rpc('calculate_trust_score', { p_user: user.id });
    if (data !== null) setTrustScore(data);
  };

  const goToNext = () => setCurrentStep(STEPS[Math.min(activeIndex + 1, STEPS.length - 1)].id);

  const validateProofUrl = async (proofUrl) => {
    if (!proofUrl) return { valid:true, normalizedUrl:null };
    try {
      const parsed = new URL(proofUrl);
      const hostname = parsed.hostname.toLowerCase();
      if (!['http:','https:'].includes(parsed.protocol)) return { valid:false, message:'Proof URL must use http or https.' };
      if (!ALLOWED_PROOF_DOMAINS.includes(hostname)) return { valid:false, message:'Use a trusted source: GitHub, Behance, Figma, LinkedIn, Vercel, or Netlify.' };
      const { data, error } = await supabase.functions.invoke('validate-resume-proof', {
        body: { proofUrl: parsed.toString(), expectedGithubUsername: getGithubHandle(profileSocialLinks) },
      });
      if (error || !data?.valid) return { valid:false, message: data?.reason || error?.message || 'Proof link could not be validated.' };
      return { valid:true, normalizedUrl:data.normalizedUrl||parsed.toString(), domain:data.domain||hostname, metadata:data.metadata||{}, httpStatus:data.httpStatus||200, ownershipVerified:data.ownershipVerified||false };
    } catch { return { valid:false, message:'Proof URL format looks invalid.' }; }
  };

  const buildOptimizerInput = () => {
    const expText = experiences.map((e) => [`Role: ${e.title||'Untitled'}`,`Company: ${e.company||'Independent'}`,`Dates: ${e.start_date||'Unknown'} to ${e.end_date||'Present'}`,`Impact: ${e.description||''}`,e.proof_url?`Proof: ${e.proof_url}`:''].filter(Boolean).join('\n')).join('\n\n');
    const skText = skills.map((s) => s.skill_name).filter(Boolean).join(', ');
    return [
      `Candidate: ${user?.name||'TeenVerse talent'}`,`Specialty: ${user?.specialty||'Independent talent'}`,
      rawImportText?`Raw notes:\n${rawImportText}`:'',journeyText?`Journey statement:\n${journeyText}`:'',
      expText?`Experience:\n${expText}`:'',skText?`Skills:\n${skText}`:'',
      'Optimize into a concise, professional, impact-focused resume.',
      'DO NOT exaggerate claims. DO NOT invent scope, leadership, clients, or measurable results.',
      'If the input is weak, keep writing simple, honest, and specific.',
      'Treat all unverified content as self-declared.',
    ].filter(Boolean).join('\n\n');
  };

  const handleSaveJourney = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('freelancers').update({ journey_statement: journeyText }).eq('id', user.id);
      if (error) throw error;
      showToast('Story saved.', 'success');
      goToNext();
    } catch (err) { showToast(err.message||'Failed to save story.', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    const fd = new FormData(e.target);
    const proofUrl = String(fd.get('proof_url')||'').trim();
    try {
      const v = await validateProofUrl(proofUrl);
      if (!v.valid) { showToast(v.message, 'warning'); return; }
      const { error } = await supabase.rpc('add_experience', {
        p_user:user.id, p_title:fd.get('title'), p_company:fd.get('company'),
        p_start:fd.get('start_date')||null, p_end:fd.get('end_date')||null,
        p_desc:fd.get('description'), p_proof:v.normalizedUrl,
      });
      if (error) throw error;
      const { data } = await supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
      const saved = data?.find((it) => it.proof_url === v.normalizedUrl);
      if (saved && v.normalizedUrl) {
        const pStatus = v.ownershipVerified ? 'verified' : 'pending';
        await supabase.from('resume_experiences').update({ proof_status:pStatus, proof_domain:v.domain, proof_metadata:v.metadata, proof_http_status:v.httpStatus }).eq('id', saved.id);
        await supabase.from('resume_verifications').upsert({ user_id:user.id, section:'experience', reference_id:saved.id, target_type:'experience', target_id:saved.id, status:pStatus, proof_url:v.normalizedUrl, evidence_url:v.normalizedUrl, evidence_domain:v.domain, evidence_metadata:v.metadata, verified_by:v.ownershipVerified?'system':'pending_ownership', source:v.ownershipVerified?'github':'portfolio' }, { onConflict:'target_type,target_id' });
      }
      setExperiences(data||[]);
      await refreshTrustScore();
      showToast('Proof point saved.', 'success');
      e.target.reset();
      goToNext();
    } catch (err) { showToast(err.message||'Failed to add experience.', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    const fd = new FormData(e.target);
    try {
      const { error } = await supabase.rpc('add_skill', { p_user:user.id, p_skill:fd.get('skill_name'), p_source:fd.get('source') });
      if (error) throw error;
      const { data } = await supabase.from('resume_skills').select('*').eq('user_id', user.id);
      setSkills(data||[]);
      await refreshTrustScore();
      showToast('Skill saved.', 'success');
      e.target.reset();
      goToNext();
    } catch (err) { showToast(err.message||'Failed to add skill.', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleOptimizeResume = async () => {
    const input = buildOptimizerInput();
    if (input.length < 120) { showToast('Add more detail before the AI pass.', 'warning'); return; }
    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume', { body: { userId: user.id, roughText: input } });
      if (error) throw new Error(await getFunctionErrorMessage(error, 'Optimization failed.'));
      const resumePayload = unwrapFunctionData(data);
      const norm = {
        ...resumePayload, source:'ai', is_verified:false,
        suspicion_flags: [...(resumePayload?.suspicion_flags||[]),...(/\b(ai|machine learning|blockchain|global|international|scaled|enterprise)\b/i.test(input)?['unverified_high_claim']:[])],
        experiences: (resumePayload?.experiences||[]).map((j) => ({ ...j, source:'ai', is_verified:false })),
        skills: (resumePayload?.skills||[]).map((s) => typeof s==='string' ? { skill_name:s, source:'ai', is_verified:false } : { ...s, source:'ai', is_verified:false }),
      };
      setOptimizedResume(norm);
      if (resumePayload?.journey_statement) setJourneyText(resumePayload.journey_statement);
      showToast('AI optimized. Still marked unverified until proof exists.', 'success');
    } catch (err) { showToast(err.message||'Optimization failed.', 'error'); }
    finally { setIsOptimizing(false); }
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    showToast('Rendering PDF…', 'info');
    try {
      const dataUrl = await toPng(resumeRef.current, {
        quality:1, pixelRatio:2, backgroundColor:'#ffffff', width:800, height:1131,
        style: { transform:'none', transformOrigin:'top left', margin:'0' },
      });
      const pdf = new jsPDF('p','mm','a4');
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(dataUrl, 'PNG', 0, 0, pw, (1131 * pw) / 800);
      pdf.save(`Resume_${(user?.name||'Export').replace(/\s+/g,'_')}.pdf`);
      showToast('Export complete.', 'success');
    } catch (err) { showToast(err.message||'Download failed.', 'error'); }
  };

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="rb-root">

        {/* ── left panel ── */}
        <div className="rb-panel-left">

          {/* identity bar */}
          <div className="rb-identity">
            <div className="rb-identity-main">
              <p className="rb-label">Resume Studio</p>
              <h1 className="rb-name">{user?.name || 'Your Name'}</h1>
              <p className="rb-role">{user?.specialty || 'Independent Talent'}</p>
              <span className={`rb-risk-pill rb-risk-${riskTone}`}>{riskTone} risk</span>
            </div>
            <div className="rb-trust-badge">
              <span className="rb-trust-num" style={{ color: trustBand.cls }}>{trustScore}</span>
              <span className="rb-trust-label">trust</span>
            </div>
          </div>

          {/* progress bar */}
          <div className="rb-progress-bar">
            <div className="rb-progress-fill" style={{ width:`${completion}%` }} />
          </div>

          {/* step tabs */}
          <div className="rb-steps-nav">
            {STEPS.map((step, i) => {
              const done = i < activeIndex;
              const active = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`rb-step-tab ${active ? 'rb-step-active' : done ? 'rb-step-done' : 'rb-step-idle'}`}
                >
                  <span className="rb-step-num">{done ? '✓' : step.label}</span>
                  <span className="rb-step-name">{step.title}</span>
                </button>
              );
            })}
          </div>

          {/* trust breakdown */}
          <div className="rb-trust-grid">
            {displayedTrustBreakdown.map((item) => (
              <div key={item.label} className="rb-trust-cell">
                <span className="rb-trust-cell-val" style={{ color: item.value < 0 ? 'var(--rb-warning)' : 'inherit' }}>
                  {item.value > 0 ? `+${item.value}` : item.value}
                </span>
                <span className="rb-trust-cell-lbl">{item.label}</span>
              </div>
            ))}
          </div>

          {/* risk flags */}
          {riskFlags.length > 0 && (
            <div className="rb-risk-box">
              {riskFlags.map((f) => <p key={f} className="rb-risk-line">⚠ {f}</p>)}
            </div>
          )}

          {/* step content */}
          <div className="rb-step-body">
            <div className="rb-step-header">
              <span className="rb-step-header-num">{activeStep.label}</span>
              <div>
                <h2 className="rb-step-title">{activeStep.title}</h2>
                <p className="rb-step-desc">{activeStep.desc}</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ── import ── */}
              {currentStep === 'import' && (
                <motion.div key="import" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="rb-form-area">
                  <textarea
                    value={rawImportText}
                    onChange={(e) => setRawImportText(e.target.value)}
                    placeholder="Paste notes, a rough resume, school projects, links, achievements, client work, volunteer experience — anything useful."
                    className="rb-textarea"
                    rows={9}
                  />
                  <button type="button" onClick={goToNext} className="rb-btn-primary">
                    Continue <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* ── journey ── */}
              {currentStep === 'journey' && (
                <motion.form key="journey" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} onSubmit={handleSaveJourney} className="rb-form-area">
                  <textarea
                    required
                    value={journeyText}
                    onChange={(e) => setJourneyText(e.target.value)}
                    placeholder="Example: I build polished web experiences for small businesses and student founders, combining React, design instincts, and fast delivery."
                    className="rb-textarea"
                    rows={7}
                  />
                  <button disabled={isLoading} type="submit" className="rb-btn-primary">
                    {isLoading ? <Loader2 className="rb-spin" size={14} /> : <FileCheck2 size={14} />}
                    Save & Continue
                  </button>
                </motion.form>
              )}

              {/* ── experience ── */}
              {currentStep === 'experience' && (
                <motion.form key="experience" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} onSubmit={handleAddExperience} className="rb-form-area">
                  <input required name="title" placeholder="Role or project title" className="rb-input" />
                  <input required name="company" placeholder="Company, client, school, or organization" className="rb-input" />
                  <div className="rb-row-2">
                    <label className="rb-date-label">
                      <span>Start</span>
                      <input type="date" name="start_date" className="rb-input" />
                    </label>
                    <label className="rb-date-label">
                      <span>End</span>
                      <input type="date" name="end_date" className="rb-input" />
                    </label>
                  </div>
                  <textarea required name="description" placeholder="What changed because of your work? Include metrics, tools, outcomes." className="rb-textarea" rows={4} />
                  <div className="rb-input-icon-wrap">
                    <LinkIcon size={14} className="rb-input-icon" />
                    <input name="proof_url" placeholder="Proof URL: GitHub, portfolio, certificate…" className="rb-input rb-input-padded" />
                  </div>
                  <button disabled={isLoading} type="submit" className="rb-btn-primary">
                    {isLoading ? <Loader2 className="rb-spin" size={14} /> : <Layers3 size={14} />}
                    Save & Continue
                  </button>
                </motion.form>
              )}

              {/* ── skills ── */}
              {currentStep === 'skills' && (
                <motion.form key="skills" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} onSubmit={handleAddSkill} className="rb-form-area">
                  <input required name="skill_name" placeholder="Skill: React, Python, motion design…" className="rb-input" />
                  <select required name="source" className="rb-input rb-select">
                    <option value="none">Self-taught</option>
                    <option value="project">Project backed</option>
                    <option value="certificate">Certificate backed</option>
                  </select>
                  <button disabled={isLoading} type="submit" className="rb-btn-accent">
                    {isLoading ? <Loader2 className="rb-spin" size={14} /> : <BadgeCheck size={14} />}
                    Save & Continue
                  </button>
                </motion.form>
              )}

              {/* ── finish ── */}
              {currentStep === 'finish' && (
                <motion.div key="finish" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="rb-form-area">
                  <div className="rb-summary-grid">
                    <div className="rb-summary-cell">
                      <span className="rb-summary-val">{rawImportText ? '✓' : '—'}</span>
                      <span className="rb-summary-lbl">Notes</span>
                    </div>
                    <div className="rb-summary-cell">
                      <span className="rb-summary-val">{experiences.length}</span>
                      <span className="rb-summary-lbl">Proof points</span>
                    </div>
                    <div className="rb-summary-cell">
                      <span className="rb-summary-val">{skills.length}</span>
                      <span className="rb-summary-lbl">Skills</span>
                    </div>
                  </div>
                  <p className="rb-finish-note">
                    AI rewrites your data into impact-first language. Every AI line stays unverified until proof exists.
                  </p>
                  <button type="button" disabled={isOptimizing} onClick={handleOptimizeResume} className="rb-btn-primary">
                    {isOptimizing ? <Loader2 className="rb-spin" size={14} /> : <Wand2 size={14} />}
                    {isOptimizing ? 'Optimizing…' : 'Run AI Polish'}
                  </button>
                  <button type="button" onClick={handleDownloadPDF} className="rb-btn-ghost">
                    <Download size={14} /> Export PDF
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── right panel (resume preview) ── */}
        <div className="rb-panel-right">
          {/* preview toolbar */}
          <div className="rb-preview-bar">
            <div className="rb-preview-bar-left">
              <span className={`rb-dot ${resumeData.isOptimized ? 'rb-dot-ai' : 'rb-dot-live'}`} />
              <span className="rb-preview-label">
                {showVerifiedOnly ? 'Verified only' : resumeData.isOptimized ? 'AI optimized' : 'Live preview'}
              </span>
            </div>
            <div className="rb-preview-bar-right">
              <button
                type="button"
                onClick={() => setShowVerifiedOnly((v) => !v)}
                className={`rb-toggle-btn ${showVerifiedOnly ? 'rb-toggle-verified' : 'rb-toggle-full'}`}
              >
                <ToggleLeft size={12} />
                {showVerifiedOnly ? 'Verified only' : 'Full resume'}
              </button>
              <button type="button" onClick={handleDownloadPDF} className="rb-export-btn">
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          {/* scaled resume canvas */}
          <div ref={previewContainerRef} className="rb-preview-scroll">
            <div style={{ width: 800 * previewScale, height: 1131 * previewScale, position:'relative', flexShrink:0 }}>
              <div style={{ transform:`scale(${previewScale})`, transformOrigin:'top left', position:'absolute', top:0, left:0 }}>
                {/* ── RESUME DOCUMENT ── */}
                <div
                  ref={resumeRef}
                  style={{
                    width:800, height:1131,
                    backgroundColor:'#ffffff',
                    fontFamily:"'DM Sans', 'Helvetica Neue', Helvetica, sans-serif",
                    padding:'56px 56px 56px 56px',
                    boxSizing:'border-box',
                    overflow:'hidden',
                    color:'#0d0d0d',
                  }}
                >
                  {/* resume header */}
                  <div style={{ borderBottom:'3px solid #0d0d0d', paddingBottom:24, marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.24em', textTransform:'uppercase', color:'#888', marginBottom:8 }}>TeenVerseHub · Resume</p>
                      <h1 style={{ fontSize:42, fontWeight:800, lineHeight:1, letterSpacing:'-0.03em', textTransform:'uppercase', margin:0 }}>{user?.name || 'Your Name'}</h1>
                      <p style={{ fontSize:13, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#555', marginTop:10 }}>{user?.specialty || 'Independent Talent'}</p>
                    </div>
                    <div style={{ textAlign:'right', borderLeft:'2px solid #e5e5e5', paddingLeft:20 }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'#888', display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end', marginBottom:6 }}>
                        <ShieldCheck size={12} /> Verified Trust
                      </div>
                      <div style={{ fontSize:36, fontWeight:800, color:'#0d0d0d' }}>{trustScore}</div>
                      <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'#aaa' }}>Score</div>
                    </div>
                  </div>

                  {/* resume body grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:40 }}>
                    {/* main column */}
                    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
                      {/* profile */}
                      <ResumeSection title="Profile">
                        {resumeData.journey
                          ? <p style={{ fontSize:13, lineHeight:1.7, color:'#333', margin:0 }}>{resumeData.journey}</p>
                          : <EmptyText>Add your story above, then run AI polish.</EmptyText>
                        }
                      </ResumeSection>

                      {/* platform verified */}
                      <ResumeSection title="Platform Verified Work">
                        {platformWork.length ? platformWork.map((job) => (
                          <div key={job.id} style={{ borderLeft:'3px solid #16a34a', paddingLeft:14, marginBottom:16 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                              <div>
                                <p style={{ fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:'-0.01em', margin:0 }}>{job.jobs?.title || 'Platform project'}</p>
                                <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#16a34a', margin:'4px 0 0' }}>TeenVerse Verified</p>
                              </div>
                              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', background:'#f0fdf4', color:'#16a34a', padding:'3px 8px', borderRadius:4 }}>{job.status}</span>
                            </div>
                            <p style={{ fontSize:12, color:'#555', lineHeight:1.6, marginTop:8 }}>Completed through TeenVerse. Backed by platform records and payment state.</p>
                          </div>
                        )) : <EmptyText>No platform-verified work yet.</EmptyText>}
                      </ResumeSection>

                      {/* self-declared experience */}
                      {!showVerifiedOnly && (
                        <ResumeSection title="Self Declared Experience">
                          {resumeData.experiences.length ? resumeData.experiences.map((job, i) => (
                            <div key={job.id || `exp-${i}`} style={{ borderLeft:`3px solid ${job.is_verified ? '#16a34a' : '#d97706'}`, paddingLeft:14, marginBottom:16 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                <div>
                                  <p style={{ fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:'-0.01em', margin:0 }}>{job.title}</p>
                                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#555', margin:'4px 0 0' }}>{job.company}</p>
                                </div>
                                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', background: job.is_verified ? '#f0fdf4' : '#fffbeb', color: job.is_verified ? '#16a34a' : '#d97706', padding:'3px 8px', borderRadius:4 }}>
                                  {job.is_verified ? 'Verified' : job.source === 'ai' ? 'AI' : 'Self declared'}
                                </span>
                              </div>
                              <p style={{ fontSize:12, color:'#555', lineHeight:1.6, marginTop:8 }}>{job.description}</p>
                              {!job.is_verified && <p style={{ fontSize:10, fontWeight:600, color:'#b45309', marginTop:6, background:'#fffbeb', padding:'4px 8px', borderRadius:4 }}>AI-generated or manual claim. Not verified.</p>}
                            </div>
                          )) : <EmptyText>Add a role, project, or win.</EmptyText>}
                        </ResumeSection>
                      )}
                    </div>

                    {/* sidebar */}
                    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                      <ResumeSection title="Verified Skills" compact>
                        {groupedSkills.verified.length ? groupedSkills.verified.map((sk, i) => (
                          <div key={sk.id || `vsk-${i}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e5e5e5', padding:'6px 10px', marginBottom:4, borderRadius:4 }}>
                            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{sk.skill_name}</span>
                            <CheckCircle2 size={11} color="#0891b2" />
                          </div>
                        )) : <EmptyText>No proof-backed skills.</EmptyText>}
                      </ResumeSection>

                      {!showVerifiedOnly && groupedSkills.selfDeclared.length > 0 && (
                        <ResumeSection title="Self Declared Skills" compact>
                          {groupedSkills.selfDeclared.map((sk, i) => (
                            <div key={sk.id || `ssk-${i}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #fde68a', background:'#fffbeb', padding:'6px 10px', marginBottom:4, borderRadius:4 }}>
                              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#92400e' }}>{sk.skill_name}</span>
                              <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#d97706' }}>Unverified</span>
                            </div>
                          ))}
                        </ResumeSection>
                      )}

                      <ResumeSection title="Signal" compact>
                        <p style={{ fontSize:11, lineHeight:1.6, color:'#777' }}>Verified content is separated from manual and AI claims so design cannot overstate trust.</p>
                        {resumeData.isOptimized && <p style={{ fontSize:11, color:'#9333ea', borderLeft:'2px solid #9333ea', paddingLeft:8, marginTop:8 }}>AI-generated language present. Not verified.</p>}
                      </ResumeSection>
                    </div>
                  </div>
                </div>
                {/* ── END RESUME ── */}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

/* ─── sub-components ──────────────────────────────────────────────────────── */

const ResumeSection = ({ title, children, compact }) => (
  <div>
    <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.24em', textTransform:'uppercase', color:'#aaa', marginBottom:10, borderBottom: compact ? '1.5px solid #0d0d0d' : 'none', paddingBottom: compact ? 6 : 0 }}>{title}</p>
    {children}
  </div>
);

const EmptyText = ({ children }) => (
  <p style={{ fontSize:12, fontStyle:'italic', color:'#ccc' }}>{children}</p>
);

/* ─── styles ──────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');

  .rb-root {
    --rb-bg:            #f8fafc;
    --rb-panel:         rgba(255,255,255,0.88);
    --rb-panel-solid:   #ffffff;
    --rb-panel-soft:    #f1f5f9;
    --rb-card:          rgba(248,250,252,0.92);
    --rb-card-hover:    #ffffff;
    --rb-preview-bg:    #e2e8f0;
    --rb-input-bg:      #ffffff;
    --rb-border:        rgba(15,23,42,0.10);
    --rb-border-hi:     rgba(15,23,42,0.18);
    --rb-text:          #0f172a;
    --rb-text-soft:     #334155;
    --rb-muted:         #64748b;
    --rb-faint:         #94a3b8;
    --rb-primary:       #6366f1;
    --rb-primary-hi:    #4f46e5;
    --rb-fuchsia:       #d946ef;
    --rb-fuchsia-hi:    #a21caf;
    --rb-teal:          #0f766e;
    --rb-success:       #16a34a;
    --rb-warning:       #d97706;
    --rb-danger:        #e11d48;
    --rb-primary-soft:  rgba(99,102,241,0.10);
    --rb-fuchsia-soft:  rgba(217,70,239,0.10);
    --rb-teal-soft:     rgba(15,118,110,0.10);
    --rb-success-soft:  rgba(22,163,74,0.10);
    --rb-warning-soft:  rgba(217,119,6,0.10);
    --rb-danger-soft:   rgba(225,29,72,0.10);
    --rb-shadow:        0 18px 45px rgba(15,23,42,0.10);
    --rb-shadow-soft:   0 10px 28px rgba(15,23,42,0.08);
    --r-sm:       8px;
    --r-md:       14px;
    --r-lg:       16px;
    font-family: 'DM Sans', sans-serif;
    background:
      linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px),
      linear-gradient(0deg, rgba(15,118,110,0.04) 1px, transparent 1px),
      var(--rb-bg);
    background-size: 28px 28px;
    color: var(--rb-text);
    min-height: 100vh;
    display: grid;
    grid-template-columns: 380px 1fr;
  }

  .dark .rb-root {
    --rb-bg:            #020617;
    --rb-panel:         rgba(15,23,42,0.86);
    --rb-panel-solid:   #0f172a;
    --rb-panel-soft:    rgba(255,255,255,0.04);
    --rb-card:          rgba(255,255,255,0.055);
    --rb-card-hover:    rgba(255,255,255,0.085);
    --rb-preview-bg:    #0b1120;
    --rb-input-bg:      rgba(2,6,23,0.52);
    --rb-border:        rgba(255,255,255,0.08);
    --rb-border-hi:     rgba(255,255,255,0.15);
    --rb-text:          #f8fafc;
    --rb-text-soft:     #cbd5e1;
    --rb-muted:         #94a3b8;
    --rb-faint:         #64748b;
    --rb-primary:       #818cf8;
    --rb-primary-hi:    #a5b4fc;
    --rb-fuchsia:       #e879f9;
    --rb-fuchsia-hi:    #f0abfc;
    --rb-teal:          #2dd4bf;
    --rb-success:       #4ade80;
    --rb-warning:       #fbbf24;
    --rb-danger:        #fb7185;
    --rb-primary-soft:  rgba(129,140,248,0.16);
    --rb-fuchsia-soft:  rgba(232,121,249,0.14);
    --rb-teal-soft:     rgba(45,212,191,0.12);
    --rb-success-soft:  rgba(74,222,128,0.12);
    --rb-warning-soft:  rgba(251,191,36,0.12);
    --rb-danger-soft:   rgba(251,113,133,0.12);
    --rb-shadow:        0 18px 45px rgba(0,0,0,0.28);
    --rb-shadow-soft:   0 12px 30px rgba(0,0,0,0.22);
  }

  /* ── left panel ── */
  .rb-panel-left {
    background: var(--rb-panel);
    border-right: 1px solid var(--rb-border);
    box-shadow: var(--rb-shadow-soft);
    backdrop-filter: blur(22px);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    height: 100vh;
    position: sticky;
    top: 0;
  }

  /* ── identity ── */
  .rb-identity {
    padding: 28px 28px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--rb-border);
  }
  .rb-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--rb-fuchsia);
    margin: 0 0 8px;
  }
  .rb-name {
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
    color: var(--rb-text);
    margin: 0 0 4px;
  }
  .rb-role {
    font-size: 11px;
    font-weight: 500;
    color: var(--rb-muted);
    letter-spacing: 0.06em;
    margin: 0 0 10px;
  }
  .rb-risk-pill {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 1px solid var(--rb-border);
    background: var(--rb-card);
    color: var(--rb-muted);
  }
  .rb-risk-low {
    border-color: rgba(22,163,74,0.28);
    background: var(--rb-success-soft);
    color: var(--rb-success);
  }
  .rb-risk-medium {
    border-color: rgba(217,119,6,0.30);
    background: var(--rb-warning-soft);
    color: var(--rb-warning);
  }
  .rb-risk-high {
    border-color: rgba(225,29,72,0.30);
    background: var(--rb-danger-soft);
    color: var(--rb-danger);
  }
  .rb-trust-badge {
    text-align: center;
    border: 1px solid var(--rb-border-hi);
    border-radius: var(--r-md);
    padding: 10px 14px;
    background:
      linear-gradient(135deg, var(--rb-primary-soft), var(--rb-fuchsia-soft));
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.38);
    min-width: 56px;
  }
  .rb-trust-num {
    display: block;
    font-size: 26px;
    font-weight: 900;
    line-height: 1;
  }
  .rb-trust-label {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rb-muted);
  }

  /* ── progress ── */
  .rb-progress-bar {
    height: 2px;
    background: var(--rb-border);
  }
  .rb-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--rb-primary), var(--rb-fuchsia), var(--rb-teal));
    transition: width 0.4s ease;
    box-shadow: 0 0 18px rgba(99,102,241,0.28);
  }

  /* ── step nav ── */
  .rb-steps-nav {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--rb-border);
  }
  .rb-step-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid var(--rb-border);
    transition: background 0.15s;
  }
  .rb-step-tab:last-child { border-bottom: none; }
  .rb-step-tab:hover { background: var(--rb-card); }
  .rb-step-num {
    font-size: 10px;
    font-weight: 700;
    font-family: 'DM Sans', monospace;
    width: 28px;
    text-align: center;
    letter-spacing: 0.04em;
  }
  .rb-step-name {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .rb-step-active  {
    background: linear-gradient(90deg, var(--rb-primary-soft), transparent);
    box-shadow: inset 3px 0 0 var(--rb-primary);
  }
  .rb-step-active .rb-step-num  { color: var(--rb-primary); }
  .rb-step-active .rb-step-name { color: var(--rb-text); }
  .rb-step-done   .rb-step-num  { color: var(--rb-success); }
  .rb-step-done   .rb-step-name { color: var(--rb-text-soft); }
  .rb-step-idle   .rb-step-num  { color: var(--rb-faint); }
  .rb-step-idle   .rb-step-name { color: var(--rb-muted); }

  /* ── trust grid ── */
  .rb-trust-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    border-bottom: 1px solid var(--rb-border);
  }
  .rb-trust-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 12px 4px;
    border-right: 1px solid var(--rb-border);
  }
  .rb-trust-cell:last-child { border-right: none; }
  .rb-trust-cell-val {
    font-size: 15px;
    font-weight: 900;
    color: var(--rb-text);
  }
  .rb-trust-cell-lbl {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--rb-muted);
    text-align: center;
  }

  /* ── risk box ── */
  .rb-risk-box {
    padding: 12px 28px;
    border-bottom: 1px solid rgba(217,119,6,0.20);
    background: var(--rb-warning-soft);
  }
  .rb-risk-line {
    font-size: 11px;
    color: var(--rb-warning);
    margin: 0 0 4px;
    line-height: 1.5;
  }
  .rb-risk-line:last-child { margin: 0; }

  /* ── step body ── */
  .rb-step-body {
    flex: 1;
    padding: 24px 28px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .rb-step-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .rb-step-header-num {
    font-size: 13px;
    font-weight: 700;
    color: var(--rb-fuchsia);
    opacity: 0.7;
    padding-top: 3px;
    min-width: 24px;
  }
  .rb-step-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--rb-text);
    margin: 0 0 4px;
  }
  .rb-step-desc {
    font-size: 12px;
    color: var(--rb-muted);
    margin: 0;
    line-height: 1.5;
  }

  /* ── form area ── */
  .rb-form-area {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .rb-input {
    width: 100%;
    background: var(--rb-input-bg);
    border: 1px solid var(--rb-border-hi);
    border-radius: var(--r-sm);
    padding: 10px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--rb-text);
    outline: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .rb-input::placeholder { color: var(--rb-faint); }
  .rb-input:focus {
    border-color: var(--rb-primary);
    box-shadow: 0 0 0 3px var(--rb-primary-soft);
  }
  .rb-textarea {
    width: 100%;
    background: var(--rb-input-bg);
    border: 1px solid var(--rb-border-hi);
    border-radius: var(--r-sm);
    padding: 12px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--rb-text);
    line-height: 1.6;
    outline: none;
    resize: none;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .rb-textarea::placeholder { color: var(--rb-faint); }
  .rb-textarea:focus {
    border-color: var(--rb-primary);
    box-shadow: 0 0 0 3px var(--rb-primary-soft);
  }
  .rb-select { cursor: pointer; }
  .rb-select option { background: var(--rb-panel-solid); color: var(--rb-text); }
  .rb-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .rb-date-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rb-date-label span {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--rb-muted);
  }
  .rb-input-icon-wrap { position: relative; }
  .rb-input-icon {
    position: absolute;
    left: 14px; top: 50%;
    transform: translateY(-50%);
    color: var(--rb-muted);
    pointer-events: none;
  }
  .rb-input-padded { padding-left: 38px; }

  /* ── buttons ── */
  .rb-btn-primary, .rb-btn-accent, .rb-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: var(--r-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    border: none;
    transition: box-shadow 0.15s, filter 0.15s, transform 0.1s, background 0.15s, color 0.15s;
  }
  .rb-btn-primary:hover:not(:disabled), .rb-btn-accent:hover:not(:disabled), .rb-btn-ghost:hover:not(:disabled) {
    filter: saturate(1.08) brightness(1.02);
    box-shadow: var(--rb-shadow-soft);
  }
  .rb-btn-primary:active:not(:disabled), .rb-btn-accent:active:not(:disabled), .rb-btn-ghost:active:not(:disabled) { transform: scale(0.97); }
  .rb-btn-primary:disabled, .rb-btn-accent:disabled, .rb-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
  .rb-btn-primary {
    background: linear-gradient(135deg, var(--rb-primary), var(--rb-fuchsia));
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(99,102,241,0.22);
  }
  .rb-btn-accent  {
    background: linear-gradient(135deg, var(--rb-teal), var(--rb-primary));
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(15,118,110,0.20);
  }
  .rb-btn-ghost   {
    background: var(--rb-card);
    border: 1px solid var(--rb-border-hi);
    color: var(--rb-text-soft);
  }

  /* ── summary grid ── */
  .rb-summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .rb-summary-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    background: var(--rb-card);
    border: 1px solid var(--rb-border);
    border-radius: var(--r-sm);
    padding: 14px 8px;
    text-align: center;
  }
  .rb-summary-val {
    font-size: 20px;
    font-weight: 900;
    color: var(--rb-text);
  }
  .rb-summary-lbl {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--rb-muted);
  }
  .rb-finish-note {
    font-size: 12px;
    line-height: 1.6;
    color: var(--rb-muted);
    background: var(--rb-card);
    border: 1px solid var(--rb-border);
    border-radius: var(--r-sm);
    padding: 14px;
    margin: 0;
  }

  /* ── right panel ── */
  .rb-panel-right {
    display: flex;
    flex-direction: column;
    background: var(--rb-preview-bg);
    overflow: hidden;
  }

  /* ── preview bar ── */
  .rb-preview-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid var(--rb-border);
    background: var(--rb-panel);
    backdrop-filter: blur(18px);
    position: sticky;
    top: 0;
    z-index: 10;
    gap: 12px;
    flex-wrap: wrap;
  }
  .rb-preview-bar-left, .rb-preview-bar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .rb-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
  }
  .rb-dot-live { background: var(--rb-success); box-shadow: 0 0 8px var(--rb-success); }
  .rb-dot-ai   { background: var(--rb-fuchsia); box-shadow: 0 0 8px var(--rb-fuchsia); }
  .rb-preview-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--rb-muted);
  }
  .rb-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 10px;
    border-radius: var(--r-sm);
    border: 1px solid;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, border-color 0.15s;
  }
  .rb-toggle-btn:hover { transform: translateY(-1px); }
  .rb-toggle-verified { background: var(--rb-success-soft); border-color: rgba(22,163,74,0.30); color: var(--rb-success); }
  .rb-toggle-full     { background: var(--rb-warning-soft); border-color: rgba(217,119,6,0.30); color: var(--rb-warning); }
  .rb-export-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: var(--r-sm);
    border: none;
    background: var(--rb-panel-solid);
    color: var(--rb-text);
    border: 1px solid var(--rb-border-hi);
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .rb-export-btn:hover { background: var(--rb-card-hover); }

  /* ── preview scroll ── */
  .rb-preview-scroll {
    flex: 1;
    overflow: auto;
    padding: 32px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .rb-preview-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .rb-preview-scroll::-webkit-scrollbar-track { background: transparent; }
  .rb-preview-scroll::-webkit-scrollbar-thumb { background: var(--rb-border-hi); border-radius: 99px; }

  /* ── spin ── */
  .rb-spin { animation: spin 0.85s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── responsive ── */
  @media (max-width: 900px) {
    .rb-root { grid-template-columns: 1fr; }
    .rb-panel-left { position: static; height: auto; }
    .rb-steps-nav { flex-direction: row; overflow-x: auto; }
    .rb-step-tab { padding: 10px 16px; border-bottom: none; border-right: 1px solid var(--rb-border); flex-direction: column; gap: 4px; }
    .rb-trust-grid { grid-template-columns: repeat(5, 1fr); }
  }
`;

export default ResumeBuilder;
