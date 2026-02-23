import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, FileText, Briefcase, GraduationCap, User, Loader2, ArrowRight, Zap, Target, Hexagon } from 'lucide-react';
import { supabase } from '../../supabase'; 
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeBuilder = ({ user, showToast }) => {
  const [inputText, setInputText] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // The ref that will be captured for the PDF
  const resumeRef = useRef(null);

  // Load latest resume on mount
  useEffect(() => {
    const fetchLatestResume = async () => {
      const { data, error } = await supabase
        .from('resumes')
        .select('content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setResumeData(data.content);
      }
    };
    fetchLatestResume();
  }, [user.id]);

  // --- 1. Call AI & Save to DB ---
  const handleGenerate = async () => {
    if (!inputText || inputText.length < 20) {
      showToast("Please provide more details about your experience.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-resume', {
        body: { roughText: `My name is ${user.name}. ${inputText}` }
      });

      if (aiError) throw aiError;

      const { error: dbError } = await supabase
        .from('resumes')
        .insert({ user_id: user.id, content: aiData });

      if (dbError) {
          showToast("Resume generated but failed to save to history.", "warning");
      } else {
          showToast("Masterpiece Generated!", "success");
      }

      setResumeData(aiData);
      
    } catch (err) {
      console.error(err);
      showToast("Failed to generate resume. Try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Download as PDF ---
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    
    showToast("Rendering High-Res PDF...", "info");
    try {
      const dataUrl = await toPng(resumeRef.current, { 
          quality: 1, 
          pixelRatio: 3,
          backgroundColor: '#ffffff'
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (1131 * pdfWidth) / 800; // standard A4 aspect ratio mapped to 800px
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TeenVerse_${user.name.replace(/\s+/g, '_')}_Resume.pdf`);
      showToast("PDF Export Complete 🚀", "success");
    } catch (err) {
      showToast("Download failed.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[calc(100vh-120px)] pb-10 max-w-7xl mx-auto">
      
      {/* ========================================== */}
      {/* LEFT SIDE: COMMAND CENTER (Input) */}
      {/* ========================================== */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="lg:col-span-5 flex flex-col space-y-6"
      >
        {/* Holographic Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#020617] border border-white/10 p-8 shadow-2xl group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  <Sparkles size={12} className="text-yellow-400"/> AI Architect
               </div>
               <h2 className="text-4xl font-black text-white mb-2 tracking-tighter leading-none">
                 Forge Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Legacy.</span>
               </h2>
               <p className="text-gray-400 text-sm leading-relaxed font-light mt-4">
                 Input your chaotic raw data below. Our neural engine will restructure it into an elite, high-converting portfolio asset.
               </p>
            </div>
        </div>

        {/* The Cyber-Input Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#09090b] backdrop-blur-xl p-1.5 rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-xl relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-purple-500/5 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full bg-gray-50 dark:bg-[#050505] rounded-[1.6rem] overflow-hidden">
                <div className="p-5 flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white dark:bg-white/5">
                    <label className="text-xs font-black text-gray-800 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                       <Target size={14} className="text-indigo-500"/> Raw Input Data
                    </label>
                    <span className="text-[10px] font-bold font-mono text-gray-400 bg-gray-200 dark:bg-black px-2 py-1 rounded-md">
                        {inputText.length} CHARS
                    </span>
                </div>
                
                <textarea 
                  className="flex-1 w-full min-h-[300px] p-6 bg-transparent text-sm text-gray-800 dark:text-gray-200 focus:ring-0 outline-none resize-none custom-scrollbar font-mono leading-relaxed placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="> Initialize data dump here...&#10;&#10;E.g., I worked at CyberDyne Systems from 2022-2024.&#10;Built a React frontend that boosted retention by 40%.&#10;Fluent in JavaScript, Python, UI/UX.&#10;Currently a CS Major at MIT."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                ></textarea>
                
                {/* Actions Bar */}
                <div className="p-3 bg-white dark:bg-white/5 border-t border-gray-200 dark:border-white/5">
                  <button 
                    onClick={handleGenerate} 
                    disabled={isLoading || inputText.length < 10}
                    className="w-full py-4 rounded-xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-indigo-500" size={18}/> : <><Sparkles size={16}/> Initiate Synthesis</>}
                  </button>
                </div>
            </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* RIGHT SIDE: STUDIO PREVIEW (Scrollable Canvas) */}
      {/* ========================================== */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="lg:col-span-7 bg-gray-200 dark:bg-[#0a0a0a] border border-gray-300 dark:border-white/5 rounded-[2.5rem] shadow-inner relative flex flex-col overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: '0 0' }} // Subtle Studio Dot Grid
      >
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 px-5 py-3 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2">
                <Hexagon size={16} className="text-indigo-500 fill-indigo-500/20"/>
                <span className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest">Live Output</span>
            </div>
            {resumeData && !isLoading && (
              <button 
                onClick={handleDownloadPDF} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
              >
                <Download size={14}/> Export 4K PDF
              </button>
            )}
        </div>

        {/* The Scrollable Pan Area */}
        <div className="flex-1 w-full h-[600px] lg:h-full overflow-auto custom-scrollbar pt-24 pb-20 px-4 sm:px-10 flex justify-center">
            <AnimatePresence mode="wait">
                
                {/* 1. LOADING STATE */}
                {isLoading && (
                   <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-[800px] h-[1131px] bg-white rounded-sm shadow-2xl p-12 flex flex-col gap-8 relative overflow-hidden shrink-0">
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent w-full h-[10%] animate-[scan_1.5s_ease-in-out_infinite] z-10"></div>
                       <div className="w-2/3 h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                       <div className="w-1/3 h-6 bg-gray-100 rounded-lg animate-pulse mb-8"></div>
                       <div className="w-full h-1 bg-gray-200 mb-8"></div>
                       <div className="w-full h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                       <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse"></div>
                   </motion.div>
                )}

                {/* 2. EMPTY STATE */}
                {!isLoading && !resumeData && (
                  <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center h-full w-full opacity-70 m-auto">
                    <div className="relative w-32 h-32 mb-6">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <div className="w-full h-full border-2 border-dashed border-gray-400 dark:border-white/20 rounded-full flex items-center justify-center bg-white dark:bg-[#050505] shadow-2xl">
                            <FileText size={48} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5}/>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-widest mb-2">Awaiting Data</h3>
                    <p className="text-sm font-medium text-gray-500 max-w-xs">The canvas is blank. Provide input to generate the asset.</p>
                  </motion.div>
                )}

                {/* 3. GENERATED RESUME */}
                {!isLoading && resumeData && (
                  <motion.div 
                    key="resume" 
                    initial={{ opacity: 0, y: 40 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="shrink-0"
                  >
                      {/* --- THE PHYSICAL A4 PAPER --- */}
                      <div 
                        ref={resumeRef}
                        className="bg-white w-[800px] min-h-[1131px] p-14 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-sm text-black relative overflow-hidden"
                        style={{ fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif" }} 
                      >
                        
                        {/* High-End Editorial Header */}
                        <header className="mb-10 relative">
                          <h1 className="text-[3.5rem] font-black tracking-tighter text-black uppercase mb-1 leading-[0.9]">
                            {resumeData.full_name || user.name}
                          </h1>
                          <div className="flex justify-between items-end mt-4">
                              <p className="text-xl font-bold text-indigo-600 tracking-widest uppercase">
                                {resumeData.professional_title || "Professional"}
                              </p>
                              <div className="text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                  {/* EMAILS AND PHONE REMOVED HERE, ONLY SHOWING NATIONALITY/LOCATION */}
                                  <span>{user.nationality || "Global Talent"}</span>
                              </div>
                          </div>
                          {/* Thick Brutalist Divider */}
                          <div className="w-full h-1.5 bg-black mt-6"></div>
                        </header>

                        {/* Two Column Brutalist Layout */}
                        <div className="grid grid-cols-12 gap-12">
                          
                          {/* --- MAIN COLUMN (Experience) --- */}
                          <div className="col-span-8 space-y-10">
                            
                            {/* Summary */}
                            <section>
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-600"></span> Profile Summary
                              </h3>
                              <p className="text-sm text-gray-700 leading-relaxed font-medium text-justify">
                                {resumeData.summary}
                              </p>
                            </section>

                            {/* Experience */}
                            <section>
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black mb-6 flex items-center gap-2">
                                 <span className="w-2 h-2 bg-indigo-600"></span> Professional Experience
                              </h3>
                              <div className="space-y-8">
                                {resumeData.experience?.map((job, index) => (
                                  <div key={index} className="relative">
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-black text-black text-lg uppercase tracking-tight">{job.role}</h4>
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-sm border border-gray-200">
                                        {job.period}
                                      </span>
                                    </div>
                                    <p className="text-sm font-bold text-indigo-600 mb-3 uppercase tracking-wider">{job.company}</p>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{job.description}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                          </div>

                          {/* --- SIDEBAR COLUMN (Skills & Ed) --- */}
                          <div className="col-span-4 space-y-10">
                            
                            {/* Skills */}
                            <section>
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black mb-5 border-b-2 border-black pb-2">
                                Core Skills
                              </h3>
                              <div className="flex flex-col gap-3">
                                {resumeData.skills?.map((skill, i) => (
                                  <div key={i} className="text-sm font-bold text-gray-800 flex items-center gap-3 bg-gray-50 p-2 border border-gray-100 rounded-md">
                                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0"></div> 
                                    <span className="truncate">{skill}</span>
                                  </div>
                                ))}
                              </div>
                            </section>

                            {/* Education */}
                            <section>
                              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black mb-5 border-b-2 border-black pb-2">
                                Education
                              </h3>
                              <div className="space-y-6">
                                {resumeData.education?.map((edu, i) => (
                                  <div key={i} className="bg-gray-50 p-3 border border-gray-100 rounded-md border-l-4 border-l-black">
                                    <h4 className="font-black text-black text-sm leading-tight mb-1 uppercase">{edu.degree}</h4>
                                    <p className="text-xs font-bold text-indigo-600 mb-1">{edu.school}</p>
                                    <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{edu.year}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                          </div>
                        </div>

                      </div>
                  </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>

      {/* Global Style for the scanner animation */}
      <style>{`
        @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(1000%); }
        }
      `}</style>
    </div>
  );
};

export default ResumeBuilder;