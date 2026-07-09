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
  Wand2,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../supabase';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs) { 
  return twMerge(clsx(inputs)); 
}

// Lightweight spring animation config for smooth UI transitions
const smoothSpring = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 0.8
};

/* ─── CONSTANTS ─────────────────────────────────────────────────────────────── */
const ALLOWED_PROOF_DOMAINS = [
  'github.com','www.github.com','behance.net','www.behance.net',
  'dribbble.com','www.dribbble.com','figma.com','www.figma.com',
  'linkedin.com','www.linkedin.com','vercel.app','netlify.app',
  'youtube.com','www.youtube.com',
];

const STEPS = [
  { id:'import',     label:'01', title:'Drop Zone',      desc:'Paste anything — rough notes, links, or wins.',         icon: Sparkles  },
  { id:'journey',    label:'02', title:'Bio Arc',        desc:'The short narrative arc recruiters will remember.',      icon: PenLine   },
  { id:'experience', label:'03', title:'Flex Proof',     desc:'Add a verified project or active team milestone.',       icon: Briefcase },
  { id:'skills',     label:'04', title:'Skills Matrix',  desc:'Log your core framework capabilities.',                 icon: Target    },
  { id:'finish',     label:'05', title:'Level Up',       desc:'Apply AI polish and sync parameters.',                  icon: Wand2     },
];

/* ─── MAIN RESUME COMPONENT ─────────────────────────────────────────────────── */
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
  const [riskLevel, setRiskLevel] = useState(user?.risk_level || 'low');

  const resumeRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  const activeIndex = STEPS.findIndex((s) => s.id === currentStep);
  const activeStep = STEPS[activeIndex] || STEPS[0];
  const riskTone = String(riskLevel || 'low').toLowerCase();

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.offsetWidth - 32;
        setPreviewScale(w < 800 ? w / 800 : 1);
      }
    };
    // Debounce the resize for smoother performance
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScale, 50);
    };
    
    updateScale();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      if (!user?.id) return;
      const [expRes, skillRes, scoreRes, userRes] = await Promise.all([
        supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('resume_skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.rpc('calculate_trust_score', { p_user: user.id }),
        supabase.from('freelancers').select('journey_statement, trust_score_breakdown, risk_level').eq('id', user.id).single(),
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
      if (platformApps) setPlatformWork(platformApps);
    };
    fetch_();
  }, [user?.id]);

  const resumeData = useMemo(() => {
    const normExps = optimizedResume?.experiences?.length
      ? optimizedResume.experiences.map((j, i) => ({ id:`opt-exp-${i}`, title:j.title||'AI experience', company:j.company||'Declared', description:j.description||'', start_date:j.start_date||null, end_date:j.end_date||null, is_verified:false, source:'ai' }))
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
    { label:'KYC Validation', value: user?.is_kyc_verified || user?.kyc_status==='verified' ? 30 : 0 },
    { label:'Platform Connect', value: Math.min(platformWork.length * 10, 20) },
    { label:'Proofs Found', value: Math.min(groupedSkills.verified.length * 2 + groupedExperiences.verified.length * 3, 10) },
  ], [groupedExperiences, groupedSkills, platformWork.length, user?.is_kyc_verified, user?.kyc_status]);

  const displayedTrustBreakdown = backendTrustBreakdown.length ? backendTrustBreakdown : fallbackTrustBreakdown;

  const trustBand = useMemo(() => {
    if (trustScore >= 80) return { label:'Verified Elite', cls:'var(--rb-success)' };
    if (trustScore >= 50) return { label:'Rising Star', cls:'var(--rb-warning)' };
    return { label:'Provisional', cls:'var(--rb-danger)' };
  }, [trustScore]);

  const riskFlags = useMemo(() => {
    const f=[];
    if (resumeData.isOptimized) f.push('AI structural layout active.');
    if (groupedExperiences.selfDeclared.length > groupedExperiences.verified.length) f.push('Declared items exceed links.');
    return f;
  }, [groupedExperiences, resumeData.isOptimized]);

  const completion = Math.round(((activeIndex + 1) / STEPS.length) * 100);

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
      if (!ALLOWED_PROOF_DOMAINS.includes(hostname)) return { valid:false, message:'Use a valid link ecosystem.' };
      return { valid:true, normalizedUrl:parsed.toString(), domain:hostname, metadata:{}, httpStatus:200, ownershipVerified:false };
    } catch { return { valid:false, message:'Check link parameter limits.' }; }
  };

  const handleSaveJourney = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('freelancers').update({ journey_statement: journeyText }).eq('id', user.id);
      if (error) throw error;
      showToast('Bio Arc synchronized.', 'success');
      goToNext();
    } catch (err) { showToast(err.message||'Sync bounds interrupted.', 'error'); }
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
      setExperiences(data||[]);
      await refreshTrustScore();
      showToast('Flex point synchronized.', 'success');
      e.target.reset();
      goToNext();
    } catch (err) { showToast(err.message||'Input loop interrupted.', 'error'); }
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
      showToast('Matrix element added.', 'success');
      e.target.reset();
      goToNext();
    } catch (err) { showToast(err.message||'Matrix sync failure.', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleOptimizeResume = async () => {
    setIsOptimizing(true);
    try {
      setTimeout(() => {
        setOptimizedResume({
          journey_statement: journeyText || "Building cross-chain digital architectures.",
          experiences: experiences.map(e => ({ ...e, description: e.description })),
          skills: skills.map(s => s.skill_name)
        });
        setIsOptimizing(false);
        showToast('AI polish processing absolute framework.', 'success');
      }, 1000);
    } catch { setIsOptimizing(false); }
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    showToast('Compiling framework print arrays...', 'info');
    try {
      const dataUrl = await toPng(resumeRef.current, { quality:1, pixelRatio:2, backgroundColor:'#ffffff', width:800, height:1131 });
      const pdf = new jsPDF('p','mm','a4');
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (1131 * pdf.internal.pageSize.getWidth()) / 800);
      pdf.save(`TeenVerse_Resume_${(user?.name||'Talent').replace(/\s+/g,'_')}.pdf`);
    } catch { showToast('Print array error.', 'error'); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="rb-root selection:bg-indigo-500 selection:text-white">

        {/* ── LEFT PANEL ── */}
        <div className="rb-panel-left">
          
          {/* Identity Widget */}
          <div className="rb-identity">
            <div>
              <p className="rb-label">Identity Engine</p>
              <h1 className="rb-name">{user?.name || 'Talent Deck'}</h1>
              <p className="rb-role">{user?.specialty || 'Creative Operator'}</p>
              <span className={`rb-risk-pill rb-risk-${riskTone}`}>{trustBand.label}</span>
            </div>
            
            <div className="rb-trust-badge">
              <span className="rb-trust-num" style={{ color: trustBand.cls }}>{trustScore}</span>
              <span className="rb-trust-label">Trust XP</span>
            </div>
          </div>

          {/* Gamified Slider Bar */}
          <div className="rb-progress-bar">
            <div className="rb-progress-fill" style={{ width:`${completion}%` }} />
          </div>

          {/* Quest Steps Index */}
          <nav className="rb-steps-nav">
            {STEPS.map((step, i) => {
              const done = i < activeIndex;
              const active = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={cn("rb-step-tab", active && "rb-step-active", done && "rb-step-done")}
                >
                  <span className="rb-step-num">{done ? '✓' : step.label}</span>
                  <span className="rb-step-name">{step.title}</span>
                </button>
              );
            })}
          </nav>

          {/* Parameter Metrics Deck */}
          <div className="rb-trust-grid">
            {displayedTrustBreakdown.slice(0, 3).map((item) => (
              <div key={item.label} className="rb-trust-cell">
                <span className="rb-trust-cell-val">+{item.value}</span>
                <span className="rb-trust-cell-lbl">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Notice Logs */}
          {riskFlags.length > 0 && (
            <div className="rb-risk-box">
              {riskFlags.map((f) => <p key={f} className="rb-risk-line"><AlertTriangle size={12} className="inline mr-1" /> {f}</p>)}
            </div>
          )}

          {/* Core Quest Input Stage */}
          <div className="rb-step-body">
            <div className="rb-step-header">
              <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-white/[0.04]">
                <Zap size={16} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="rb-step-title">{activeStep.title}</h2>
                <p className="rb-step-desc">{activeStep.desc}</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 'import' && (
                <motion.div key="import" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={smoothSpring} className="rb-form-area">
                  <textarea
                    value={rawImportText}
                    onChange={(e) => setRawImportText(e.target.value)}
                    placeholder="Dump rough notes, school project details, community loops, work history lines, wins... anything goes."
                    className="rb-textarea"
                    rows={6}
                  />
                  <button type="button" onClick={goToNext} className="rb-btn-primary">
                    Next Layer <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {currentStep === 'journey' && (
                <motion.form key="journey" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={smoothSpring} onSubmit={handleSaveJourney} className="rb-form-area">
                  <textarea
                    required
                    value={journeyText}
                    onChange={(e) => setJourneyText(e.target.value)}
                    placeholder="e.g., Building frontend interfaces and full-stack utilities for local client networks."
                    className="rb-textarea"
                    rows={5}
                  />
                  <button disabled={isLoading} type="submit" className="rb-btn-primary">
                    {isLoading ? <Loader2 className="rb-spin" size={14} /> : <FileCheck2 size={14} />}
                    Sync Statement
                  </button>
                </motion.form>
              )}

              {currentStep === 'experience' && (
                <motion.form key="experience" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={smoothSpring} onSubmit={handleAddExperience} className="rb-form-area">
                  <input required name="title" placeholder="Project or Role Title" className="rb-input" />
                  <input required name="company" placeholder="Team, Organization, or School Namespace" className="rb-input" />
                  <div className="rb-row-2">
                    <label className="rb-date-label">
                      <span>Initiation Date</span>
                      <input type="date" name="start_date" className="rb-input" />
                    </label>
                    <label className="rb-date-label">
                      <span>Closure Date</span>
                      <input type="date" name="end_date" className="rb-input" />
                    </label>
                  </div>
                  <textarea required name="description" placeholder="Summary output metrics, tool stacks used..." className="rb-textarea" rows={3} />
                  <div className="rb-input-icon-wrap">
                    <LinkIcon size={13} className="rb-input-icon" />
                    <input name="proof_url" placeholder="Proof URL (GitHub, Figma, Behance...)" className="rb-input rb-input-padded" />
                  </div>
                  <button disabled={isLoading} type="submit" className="rb-btn-primary">
                    {isLoading ? <Loader2 className="rb-spin" size={14} /> : <Layers3 size={14} />}
                    Deploy Element
                  </button>
                </motion.form>
              )}

              {currentStep === 'skills' && (
                <motion.form key="skills" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={smoothSpring} onSubmit={handleAddSkill} className="rb-form-area">
                  <input required name="skill_name" placeholder="Framework (React, Next.js, Figma...)" className="rb-input" />
                  <select required name="source" className="rb-input rb-select">
                    <option value="none">Self-Acquired Stack</option>
                    <option value="project">Project Correlated</option>
                    <option value="certificate">Certification Backed</option>
                  </select>
                  <button disabled={isLoading} type="submit" className="rb-btn-accent">
                    {isLoading ? <Loader2 className="rb-spin" size={14} /> : <BadgeCheck size={14} />}
                    Append Module
                  </button>
                </motion.form>
              )}

              {currentStep === 'finish' && (
                <motion.div key="finish" initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={smoothSpring} className="rb-form-area">
                  <div className="rb-summary-grid">
                    <div className="rb-summary-cell">
                      <span className="rb-summary-val">{experiences.length}</span>
                      <span className="rb-summary-lbl">Flex Elements</span>
                    </div>
                    <div className="rb-summary-cell">
                      <span className="rb-summary-val">{skills.length}</span>
                      <span className="rb-summary-lbl">Skills Matrix</span>
                    </div>
                  </div>
                  <button type="button" disabled={isOptimizing} onClick={handleOptimizeResume} className="rb-btn-primary w-full">
                    {isOptimizing ? <Loader2 className="rb-spin" size={14} /> : <Wand2 size={14} />}
                    {isOptimizing ? 'Polishing Matrix...' : 'Execute AI Refactor'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT PANEL (REAL-TIME PREVIEW STAGE) ── */}
        <div className="rb-panel-right">
          <div className="rb-preview-bar">
            <div className="rb-preview-bar-left">
              <span className={cn("rb-dot", resumeData.isOptimized ? 'rb-dot-ai' : 'rb-dot-live')} />
              <span className="rb-preview-label">
                {resumeData.isOptimized ? 'AI Optimized Matrix' : 'Live Blueprint Stage'}
              </span>
            </div>
            
            <div className="rb-preview-bar-right">
              <button type="button" onClick={handleDownloadPDF} className="rb-export-btn">
                <Download size={13} /> Export PDF
              </button>
            </div>
          </div>

          {/* Vector Document Canvas Wrapper */}
          <div ref={previewContainerRef} className="rb-preview-scroll">
            <div style={{ width: 800 * previewScale, height: 1131 * previewScale, position:'relative', flexShrink:0 }}>
              <div style={{ transform:`scale(${previewScale})`, transformOrigin:'top left', position:'absolute', top:0, left:0 }}>
                {/* ── THE PRINT CANVAS DOCUMENT ── */}
                <div
                  ref={resumeRef}
                  style={{
                    width:800, height:1131,
                    backgroundColor:'#ffffff',
                    fontFamily:"'DM Sans', sans-serif",
                    padding:'48px',
                    boxSizing:'border-box',
                    overflow:'hidden',
                    color:'#0f172a',
                  }}
                >
                  {/* Document Branding Grid */}
                  <div style={{ borderBottom:'2px solid #0f172a', paddingBottom:20, marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#94a3b8', marginBottom:6 }}>TeenVerse Portfolio Loop</p>
                      <h1 style={{ fontSize:36, fontWeight:800, lineHeight:1, tracking:'tight', textTransform:'uppercase', margin:0 }}>{user?.name || 'Talent Profile'}</h1>
                      <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginTop:8 }}>{user?.specialty || 'Creative Operator'}</p>
                    </div>
                    
                    <div style={{ textAlign:'right', borderLeft:'1px solid #e2e8f0', paddingLeft:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#64748b', display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end', marginBottom:4 }}>
                        <ShieldCheck size={12} className="text-indigo-500" /> Trust Matrix
                      </div>
                      <div style={{ fontSize:32, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{trustScore}</div>
                    </div>
                  </div>

                  {/* Document Interior Grid Columns */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:32 }}>
                    
                    {/* Main Section */}
                    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                      <ResumeSection title="Operational Focus">
                        {resumeData.journey
                          ? <p style={{ fontSize:12, lineHeight:1.6, color:'#334155', margin:0 }}>{resumeData.journey}</p>
                          : <EmptyText>Operational profiles generate once Bio Arc statements are synced.</EmptyText>
                        }
                      </ResumeSection>

                      <ResumeSection title="Ecosystem Deployment Matrix">
                        {platformWork.length ? platformWork.map((job) => (
                          <div key={job.id} style={{ borderLeft:'2px solid #10b981', paddingLeft:12, marginBottom:12 }}>
                            <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{job.jobs?.title || 'Ecosystem Contract'}</p>
                            <p style={{ fontSize:11, color:'#64748b', lineHeight:1.5, marginTop:4 }}>Validated network delivery asset recorded inside structural multi-party platform history loops.</p>
                          </div>
                        )) : null}

                        {resumeData.experiences.map((job, i) => (
                          <div key={job.id || `exp-${i}`} style={{ borderLeft:`2px solid ${job.is_verified ? '#10b981' : '#f59e0b'}`, paddingLeft:12, marginBottom:12 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{job.title}</p>
                              <span style={{ fontSize:9, fontWeight:700, color: job.is_verified ? '#10b981' : '#f59e0b' }}>{job.company}</span>
                            </div>
                            <p style={{ fontSize:11, color:'#475569', lineHeight:1.5, marginTop:4 }}>{job.description}</p>
                          </div>
                        ))}
                      </ResumeSection>
                    </div>

                    {/* Sidebar Area Section */}
                    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                      <ResumeSection title="Core Capabilities" compact>
                        {resumeData.skills.map((sk, i) => (
                          <div key={sk.id || `sk-${i}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e2e8f0', padding:'4px 8px', marginBottom:4, borderRadius:6 }}>
                            <span style={{ fontSize:11, fontWeight:600 }}>{sk.skill_name}</span>
                            <CheckCircle2 size={10} className="text-indigo-500" />
                          </div>
                        ))}
                      </ResumeSection>
                    </div>

                  </div>
                </div>
                {/* ── END CANVAS ── */}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

const ResumeSection = ({ title, children, compact }) => (
  <div>
    <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#94a3b8', marginBottom:8, borderBottom: compact ? '1px solid #e2e8f0' : 'none', paddingBottom: compact ? 4 : 0 }}>{title}</p>
    {children}
  </div>
);

const EmptyText = ({ children }) => (
  <p style={{ fontSize:11, fontStyle:'italic', color:'#cbd5e1' }}>{children}</p>
);

/* ─── DYNAMIC SHIFT CSS ─────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .rb-root {
    --rb-bg:            #f8fafc;
    --rb-panel:         #ffffff;
    --rb-card:          #f1f5f9;
    --rb-preview-bg:    #edf2f7;
    --rb-input-bg:      #ffffff;
    --rb-border:        rgba(15,23,42,0.06);
    --rb-border-hi:     rgba(15,23,42,0.12);
    --rb-text:          #0f172a;
    --rb-muted:         #64748b;
    --rb-primary:       #6366f1;
    --rb-fuchsia:       #d946ef;
    --rb-teal:          #0f766e;
    --rb-success:       #10b981;
    --rb-warning:       #f59e0b;
    --rb-danger:        #ef4444;
    --rb-primary-soft:  rgba(99,102,241,0.08);
    --rb-shadow-soft:   0 4px 20px rgba(15,23,42,0.04);
    --r-sm:       12px;
    --r-md:       16px;
    font-family: 'DM Sans', sans-serif;
    background: var(--rb-bg);
    min-height: 100vh;
    display: grid;
    grid-template-columns: 360px 1fr;
  }

  .dark .rb-root {
    --rb-bg:            #090d16;
    --rb-panel:         #111726;
    --rb-card:          rgba(255,255,255,0.03);
    --rb-preview-bg:    #05080f;
    --rb-input-bg:      #090d16;
    --rb-border:        rgba(255,255,255,0.04);
    --rb-border-hi:     rgba(255,255,255,0.08);
    --rb-text:          #f8fafc;
    --rb-muted:         #94a3b8;
    --rb-primary:       #818cf8;
    --rb-fuchsia:       #e879f9;
    --rb-teal:          #2dd4bf;
    --rb-success:       #34d399;
    --rb-warning:       #fbbf24;
    --rb-danger:        #f87171;
    --rb-primary-soft:  rgba(129,140,248,0.12);
  }

  .rb-panel-left {
    background: var(--rb-panel);
    border-right: 1px solid var(--rb-border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    height: 100vh;
    position: sticky;
    top: 0;
  }

  .rb-identity {
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--rb-border);
  }
  .rb-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--rb-primary);
  }
  .rb-name {
    font-size: 20px;
    font-weight: 800;
    color: var(--rb-text);
    margin: 4px 0 2px;
  }
  .rb-role {
    font-size: 12px;
    font-weight: 500;
    color: var(--rb-muted);
  }
  .rb-risk-pill {
    display: inline-flex;
    margin-top: 6px;
    border-radius: 8px;
    padding: 3px 8px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--rb-primary-soft);
    color: var(--rb-primary);
  }

  .rb-trust-badge {
    text-align: center;
    border: 1px solid var(--rb-border-hi);
    border-radius: var(--r-sm);
    padding: 8px 12px;
    background: var(--rb-card);
  }
  .rb-trust-num {
    display: block;
    font-size: 22px;
    font-weight: 800;
  }
  .rb-trust-label {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--rb-muted);
  }

  .rb-progress-bar {
    height: 3px;
    background: var(--rb-border);
  }
  .rb-progress-fill {
    height: 100%;
    background: var(--rb-primary);
    transition: width 0.3s ease;
  }

  .rb-steps-nav {
    display: flex;
    flex-direction: column;
  }
  .rb-step-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid var(--rb-border);
    font-size: 13px;
    font-weight: 600;
    color: var(--rb-muted);
    transition: background-color 0.2s ease;
  }
  .rb-step-tab:hover { background: var(--rb-card); }
  .rb-step-num { font-size: 11px; font-weight: 700; color: var(--rb-muted); width: 20px; }
  .rb-step-active { background: var(--rb-primary-soft); color: var(--rb-text); border-left: 3px solid var(--rb-primary); }
  .rb-step-active .rb-step-num { color: var(--rb-primary); }
  .rb-step-done .rb-step-num { color: var(--rb-success); }

  .rb-trust-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-bottom: 1px solid var(--rb-border);
    background: var(--rb-card);
  }
  .rb-trust-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 4px;
    border-right: 1px solid var(--rb-border);
  }
  .rb-trust-cell:last-child { border-right: none; }
  .rb-trust-cell-val { font-size: 14px; font-weight: 700; color: var(--rb-text); }
  .rb-trust-cell-lbl { font-size: 9px; font-weight: 500; color: var(--rb-muted); text-transform: uppercase; }

  .rb-risk-box { padding: 8px 24px; background: rgba(245,158,11,0.06); border-bottom: 1px solid var(--rb-border); }
  .rb-risk-line { font-size: 11px; color: var(--rb-warning); margin: 0; }

  .rb-step-body { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
  .rb-step-header { display: flex; gap: 12px; align-items: center; }
  .rb-step-title { font-size: 18px; font-weight: 800; color: var(--rb-text); margin: 0; }
  .rb-step-desc { font-size: 12px; color: var(--rb-muted); margin: 2px 0 0; }

  .rb-form-area { display: flex; flex-direction: column; gap: 12px; }
  .rb-input, .rb-textarea {
    width: 100%;
    background: var(--rb-input-bg);
    border: 1px solid var(--rb-border-hi);
    border-radius: var(--r-sm);
    padding: 10px 14px;
    font-size: 13px;
    color: var(--rb-text);
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .rb-input:focus, .rb-textarea:focus { border-color: var(--rb-primary); box-shadow: 0 0 0 2px var(--rb-primary-soft); }
  .rb-textarea { resize: none; }
  .rb-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .rb-date-label { display: flex; flex-direction: column; gap: 4px; font-size: 10px; font-weight: 600; color: var(--rb-muted); }
  
  .rb-input-icon-wrap { position: relative; }
  .rb-input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--rb-muted); }
  .rb-input-padded { padding-left: 34px; }

  .rb-btn-primary, .rb-btn-accent {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px;
    border-radius: var(--r-sm);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    color: #ffffff;
    transition: opacity 0.2s ease, transform 0.1s ease;
  }
  .rb-btn-primary { background: var(--rb-primary); }
  .rb-btn-accent { background: var(--rb-teal); }
  .rb-btn-primary:hover, .rb-btn-accent:hover { opacity: 0.9; }
  .rb-btn-primary:active, .rb-btn-accent:active { transform: scale(0.98); }

  .rb-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .rb-summary-cell { background: var(--rb-card); padding: 12px; border-radius: var(--r-sm); text-align: center; border: 1px solid var(--rb-border); }
  .rb-summary-val { display: block; font-size: 18px; font-weight: 700; }
  .rb-summary-lbl { font-size: 10px; font-weight: 500; color: var(--rb-muted); text-transform: uppercase; }

  .rb-panel-right { background: var(--rb-preview-bg); display: flex; flex-direction: column; overflow: hidden; }
  .rb-preview-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: var(--rb-panel); border-bottom: 1px solid var(--rb-border); }
  .rb-preview-bar-left { display: flex; align-items: center; gap: 8px; }
  .rb-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rb-success); }
  .rb-dot-ai { background: var(--rb-fuchsia); }
  .rb-preview-label { font-size: 11px; font-weight: 700; color: var(--rb-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .rb-export-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--rb-input-bg); border: 1px solid var(--rb-border-hi); padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: 8px; color: var(--rb-text); cursor: pointer; transition: background-color 0.2s; }
  .rb-export-btn:hover { background: var(--rb-card); }

  .rb-preview-scroll { flex: 1; overflow: auto; padding: 16px; display: flex; justify-content: center; align-items: flex-start; }
  .rb-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 800px) {
    .rb-root { grid-template-columns: 1fr; }
    .rb-panel-left { height: auto; position: static; }
    .rb-steps-nav { flex-direction: row; overflow-x: auto; }
    .rb-step-tab { padding: 12px; flex-shrink: 0; border-bottom: none; }
  }
`;

export default ResumeBuilder;