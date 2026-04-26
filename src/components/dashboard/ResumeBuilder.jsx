import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Download, ShieldCheck, Briefcase, 
  Loader2, Link as LinkIcon, CheckCircle2, 
  Target, Flame, Wand2, Zap
} from 'lucide-react';
import { supabase } from '../../supabase'; 
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeBuilder = ({ user, showToast }) => {
  const [activeTab, setActiveTab] = useState('magic');
  const [isLoading, setIsLoading] = useState(false);
  
  // One-Shot AI State
  const [rawImportText, setRawImportText] = useState("");
  const [isForging, setIsForging] = useState(false);
  const expDescRef = useRef(null);
  
  // Structured Data States
  const [trustScore, setTrustScore] = useState(user?.trust_score || 0);
  const [journeyText, setJourneyText] = useState(user?.journey_statement || "");
  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState([]);
  
  const resumeRef = useRef(null);

  // --- 0. Load Data on Mount ---
  useEffect(() => {
    const fetchTrustData = async () => {
      if (!user?.id) return;
      const [expRes, skillRes, scoreRes, userRes] = await Promise.all([
        supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
        supabase.from('resume_skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.rpc('calculate_trust_score', { p_user: user.id }),
        supabase.from('freelancers').select('journey_statement').eq('id', user.id).single()
      ]);

      if (expRes.data) setExperiences(expRes.data);
      if (skillRes.data) setSkills(skillRes.data);
      if (scoreRes.data !== null) setTrustScore(scoreRes.data);
      if (userRes.data?.journey_statement) setJourneyText(userRes.data.journey_statement);
    };
    fetchTrustData();
  }, [user.id]);

  // --- 1. THE 1-TOKEN MASTER FORGE ---
  const handleMasterForge = async () => {
    if (!rawImportText || rawImportText.length < 30) {
        return showToast("Pour a bit more of your story into the terminal first!", "warning");
    }

    setIsForging(true);
    showToast("AI Neural Engine analyzing your profile... 🤖", "info");

    try {
        const { data: aiData, error } = await supabase.functions.invoke('generate-resume', {
            body: { roughText: rawImportText }
        });
        if (error) throw error;

        showToast("Structuring data... 🧱", "info");

        // Save Journey
        if (aiData.journey_statement) {
            await supabase.from('freelancers').update({ journey_statement: aiData.journey_statement }).eq('id', user.id);
            setJourneyText(aiData.journey_statement);
        }

        // Save Experiences
        if (aiData.experiences && aiData.experiences.length > 0) {
            for (const exp of aiData.experiences) {
                await supabase.rpc('add_experience', {
                    p_user: user.id, p_title: exp.title, p_company: exp.company,
                    p_start: exp.start_date || null, p_end: exp.end_date || null,
                    p_desc: exp.description, p_proof: null 
                });
            }
        }

        // Save Skills
        if (aiData.skills && aiData.skills.length > 0) {
            for (const skill of aiData.skills) {
                await supabase.rpc('add_skill', { p_user: user.id, p_skill: skill, p_source: 'none' });
            }
        }

        showToast("Masterpiece Forged! 🚀", "success");
        setRawImportText(""); 
        
        // Refresh local state to show PDF
        const [newExps, newSkills, scoreRes] = await Promise.all([
            supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
            supabase.from('resume_skills').select('*').eq('user_id', user.id),
            supabase.rpc('calculate_trust_score', { p_user: user.id })
        ]);
        
        setExperiences(newExps.data || []);
        setSkills(newSkills.data || []);
        if (scoreRes.data !== null) setTrustScore(scoreRes.data);
        
        setActiveTab('experience');

    } catch (err) {
        console.error(err);
        showToast("Forge failed: " + err.message, "error");
    } finally {
        setIsForging(false);
    }
  };

  // --- 2. Manual Database Handlers ---
  const handleSaveJourney = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const { error } = await supabase.from('freelancers').update({ journey_statement: journeyText }).eq('id', user.id);
        if (error) throw error;
        showToast("Origin Story Saved! 📖", "success");
    } catch (err) { showToast("Failed to save.", "error"); } 
    finally { setIsLoading(false); }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    try {
      const { error } = await supabase.rpc('add_experience', {
        p_user: user.id, p_title: formData.get('title'), p_company: formData.get('company'),
        p_start: formData.get('start_date') || null, p_end: formData.get('end_date') || null,
        p_desc: formData.get('description'), p_proof: formData.get('proof_url') || null
      });
      if (error) throw error;
      showToast("Experience added to ledger.", "success");
      e.target.reset();
      const { data } = await supabase.from('resume_experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
      setExperiences(data || []);
      refreshTrustScore();
    } catch (err) { showToast(err.message, "error"); } 
    finally { setIsLoading(false); }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    try {
      const { error } = await supabase.rpc('add_skill', { p_user: user.id, p_skill: formData.get('skill_name'), p_source: formData.get('source') });
      if (error) throw error;
      showToast("Skill logged securely.", "success");
      e.target.reset();
      const { data } = await supabase.from('resume_skills').select('*').eq('user_id', user.id);
      setSkills(data || []);
      refreshTrustScore();
    } catch (err) { showToast(err.message, "error"); } 
    finally { setIsLoading(false); }
  };

  const refreshTrustScore = async () => {
    const { data } = await supabase.rpc('calculate_trust_score', { p_user: user.id });
    if (data !== null) setTrustScore(data);
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    showToast("Rendering High-Res PDF...", "info");
    try {
      const dataUrl = await toPng(resumeRef.current, { quality: 1, pixelRatio: 3, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (1131 * pdfWidth) / 800; 
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TeenVerse_${user.name.replace(/\s+/g, '_')}_Portfolio.pdf`);
      showToast("Export Complete 🚀", "success");
    } catch (err) { showToast("Download failed.", "error"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[calc(100vh-120px)] pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* ========================================== */}
      {/* LEFT SIDE: DATA INPUT TERMINAL */}
      {/* ========================================== */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 flex flex-col space-y-4 sm:space-y-6">
        
        {/* Trust Score Header */}
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-[#020617] border border-white/10 p-5 sm:p-8 shadow-2xl flex justify-between items-center">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
               <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tighter leading-none">Career Forge</h2>
               <p className="text-gray-400 text-[10px] sm:text-xs font-mono mt-2 flex items-center gap-1.5"><ShieldCheck size={14} className="text-indigo-400" /> Identity Protected</p>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center bg-white/5 border border-white/10 w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                <span className="text-2xl sm:text-3xl font-black text-indigo-400 tracking-tighter">{trustScore}</span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gray-400 font-bold mt-[-2px]">Trust</span>
            </div>
        </div>

        {/* Responsive Tab Navigation */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-xl sm:rounded-2xl">
            {['magic', 'journey', 'experience', 'skills'].map((t) => (
                <button
                    key={t} onClick={() => setActiveTab(t)}
                    className={`flex-1 py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all ${
                        activeTab === t ? 'bg-white dark:bg-[#09090b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    {t === 'magic' ? <span className="flex items-center justify-center gap-1"><Sparkles size={12}/> Auto Forge</span> : t}
                </button>
            ))}
        </div>

        {/* Form Area */}
        <div className="flex-1 bg-white dark:bg-[#09090b] backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-xl relative overflow-hidden">
            <AnimatePresence mode="wait">
                
                {/* 1. MAGIC IMPORT TAB (One-Shot) */}
                {activeTab === 'magic' && (
                    <motion.div key="magic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={18} className="text-purple-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Neural Engine</h3>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">
                            Dump your raw notes, old resume, and origin story here. Our AI will extract, maximize impact, and secure it all into your ledger instantly.
                        </p>
                        
                        <textarea 
                            value={rawImportText} onChange={(e) => setRawImportText(e.target.value)}
                            placeholder="I started coding games at 14. I also worked at a local cafe from Jan 2023 to May 2023. I know Python and React..." 
                            className="w-full flex-1 min-h-[180px] sm:min-h-[200px] bg-gray-50 dark:bg-white/5 border border-purple-200 dark:border-purple-500/20 rounded-xl px-4 py-4 text-sm resize-none focus:ring-2 focus:ring-purple-500/50 outline-none dark:text-white leading-relaxed custom-scrollbar transition-all"
                        ></textarea>

                        <button onClick={handleMasterForge} disabled={isForging} className="w-full py-3.5 sm:py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 mt-auto active:scale-[0.98]">
                            {isForging ? <Loader2 className="animate-spin" size={16}/> : <><Wand2 size={16}/> Forge Profile</>}
                        </button>
                    </motion.div>
                )}

                {/* 2. JOURNEY FORM (Manual) */}
                {activeTab === 'journey' && (
                    <motion.form key="journey" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleSaveJourney} className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-2">
                            <Flame size={18} className="text-orange-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Your Origin Story</h3>
                        </div>
                        
                        <textarea 
                            required value={journeyText} onChange={(e) => setJourneyText(e.target.value)}
                            placeholder="I started my journey when I was 14..." 
                            className="w-full flex-1 min-h-[200px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm resize-none focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white leading-relaxed custom-scrollbar transition-all"
                        ></textarea>

                        <button disabled={isLoading} type="submit" className="w-full py-3.5 sm:py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 mt-auto">
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : "Update Journey"}
                        </button>
                    </motion.form>
                )}

                {/* 3. EXPERIENCE FORM (Manual Ledger) */}
                {activeTab === 'experience' && (
                    <motion.form key="exp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleAddExperience} className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase size={16} className="text-indigo-500"/> 
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Add Experience</h3>
                        </div>

                        <input required name="title" placeholder="Role (e.g. Freelance Developer)" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white transition-all" />
                        <input required name="company" placeholder="Company / Client Name" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white transition-all" />
                        
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Start Date</label>
                                <input type="date" name="start_date" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-500 focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white transition-all" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">End Date</label>
                                <input type="date" name="end_date" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-500 focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white transition-all" />
                            </div>
                        </div>

                        <textarea required ref={expDescRef} name="description" placeholder="What did you achieve?" className="w-full h-[90px] sm:h-[100px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white transition-all"></textarea>
                        
                        <div className="relative">
                            <LinkIcon size={16} className="absolute left-4 top-3.5 text-gray-400" />
                            <input name="proof_url" placeholder="Proof URL (GitHub, Live Site)" className="w-full bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white placeholder-indigo-400/70 transition-all" />
                        </div>

                        <button disabled={isLoading} type="submit" className="w-full py-3.5 sm:py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 mt-auto">
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : "Add to Ledger"}
                        </button>
                    </motion.form>
                )}

                {/* 4. SKILLS FORM (Manual) */}
                {activeTab === 'skills' && (
                    <motion.form key="skills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleAddSkill} className="space-y-4 flex flex-col h-full">
                         <div className="flex items-center gap-2 mb-2">
                            <Target size={16} className="text-indigo-500"/> 
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Register Skill</h3>
                         </div>
                         <input required name="skill_name" placeholder="Skill (e.g. React.js, Video Editing)" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white transition-all" />
                         <select required name="source" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none dark:text-white appearance-none transition-all">
                            <option value="none">Self-Taught (Unverified)</option>
                            <option value="project">Project Backed</option>
                            <option value="certificate">External Certificate</option>
                         </select>
                         <button disabled={isLoading} type="submit" className="w-full py-3.5 sm:py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 mt-auto">
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : "Log Skill"}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* RIGHT SIDE: EDITORIAL PDF PREVIEW */}
      {/* ========================================== */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 bg-gray-200 dark:bg-[#0a0a0a] border border-gray-300 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-inner relative flex flex-col overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '0 0' }}>
        
        {/* Floating Action Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${trustScore > 0 ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-[10px] sm:text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest">Live Preview</span>
            </div>
            <button onClick={handleDownloadPDF} className="px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg active:scale-95">
                <Download size={12}/> <span className="hidden sm:inline">Export 4K PDF</span><span className="sm:hidden">Export</span>
            </button>
        </div>

        {/* The Scrollable Canvas (Mobile Friendly Panning) */}
        <div className="flex-1 w-full h-[500px] lg:h-full overflow-x-auto overflow-y-auto custom-scrollbar pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-10 flex justify-start sm:justify-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 w-[800px]">
                  <div ref={resumeRef} className="bg-white w-[800px] min-h-[1131px] p-10 sm:p-14 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] rounded-sm text-black relative overflow-hidden" style={{ fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif" }}>
                    
                    {/* Header */}
                    <header className="mb-8 relative">
                      <div className="flex justify-between items-end">
                          <div>
                              <h1 className="text-4xl sm:text-[3.5rem] font-black tracking-tighter text-black uppercase mb-1 leading-[0.9]">{user.name}</h1>
                              <p className="text-lg sm:text-xl font-bold text-indigo-600 tracking-widest uppercase mt-3">{user.specialty || "Independent Talent"}</p>
                          </div>
                          {trustScore > 0 && (
                              <div className="text-right pb-1">
                                  <span className="flex items-center justify-end gap-1.5 text-[9px] sm:text-[10px] font-black text-indigo-800 uppercase tracking-widest"><ShieldCheck size={14} className="text-indigo-600"/> Platform Verified</span>
                                  <span className="text-xs sm:text-sm font-bold text-gray-500">Trust Score: {trustScore}</span>
                              </div>
                          )}
                      </div>
                      <div className="w-full h-1 sm:h-1.5 bg-black mt-6"></div>
                    </header>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-12 gap-8 sm:gap-10">
                      
                      <div className="col-span-8 space-y-8 sm:space-y-10">
                        {/* Origin Story Section */}
                        {journeyText && (
                            <section>
                              <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-black mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600"></span> Origin Story</h3>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium text-justify whitespace-pre-wrap">{journeyText}</p>
                            </section>
                        )}

                        {/* Professional Ledger */}
                        <section>
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-black mb-6 flex items-center gap-2"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600"></span> Professional Ledger</h3>
                          {experiences.length === 0 ? (
                              <p className="text-xs sm:text-sm text-gray-400 italic">No experiences logged yet.</p>
                          ) : (
                              <div className="space-y-6 sm:space-y-8">
                                {experiences.map((job) => (
                                  <div key={job.id} className="relative">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="flex items-center gap-2">
                                          <h4 className="font-black text-black text-base sm:text-lg uppercase tracking-tight">{job.title}</h4>
                                          {job.is_verified && <span title="Verified" className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 bg-indigo-100 rounded-full text-indigo-600"><CheckCircle2 size={10} strokeWidth={3}/></span>}
                                      </div>
                                      <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-2 sm:px-3 py-1 rounded-sm border border-gray-200">
                                        {job.start_date ? new Date(job.start_date).getFullYear() : 'N/A'} - {job.end_date ? new Date(job.end_date).getFullYear() : 'Present'}
                                      </span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-bold text-indigo-600 mb-2 sm:mb-3 uppercase tracking-wider">{job.company}</p>
                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{job.description}</p>
                                  </div>
                                ))}
                              </div>
                          )}
                        </section>
                      </div>

                      <div className="col-span-4 space-y-8 sm:space-y-10">
                        {/* Skills */}
                        <section>
                          <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-black mb-4 sm:mb-5 border-b-2 border-black pb-2">Capabilities</h3>
                          {skills.length === 0 ? (
                              <p className="text-[11px] sm:text-xs text-gray-400 italic">Awaiting capabilities...</p>
                          ) : (
                              <div className="flex flex-col gap-2 sm:gap-3">
                                {skills.map((skill) => (
                                  <div key={skill.id} className="text-xs sm:text-sm font-bold text-gray-800 flex items-center justify-between bg-gray-50 p-2 border border-gray-100 rounded-md">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${skill.is_verified ? 'bg-indigo-600' : 'bg-gray-400'}`}></div> 
                                        <span className="truncate">{skill.skill_name}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                          )}
                        </section>
                      </div>
                    </div>
                  </div>
              </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResumeBuilder;