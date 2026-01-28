import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, FileText, Briefcase, GraduationCap, User, Save } from 'lucide-react';
import { supabase } from '../../supabase'; 
import { jsPDF } from "jspdf";
import { toPng } from 'html-to-image';
import Button from '../ui/Button';

const ResumeBuilder = ({ user, showToast }) => {
  const [inputText, setInputText] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const resumeRef = useRef(null);

  // --- NEW: Load latest resume on mount ---
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
      // A. Call Edge Function
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-resume', {
        body: { roughText: `My name is ${user.name}. ${inputText}` }
      });

      if (aiError) throw aiError;

      // B. Save to Database (The Record Keeping Step)
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
            user_id: user.id,
            content: aiData // Stores the whole JSON object
        });

      if (dbError) {
          console.error("DB Save Error:", dbError);
          showToast("Resume generated but failed to save to history.", "warning");
      } else {
          showToast("Resume generated & saved!", "success");
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
    
    showToast("Preparing PDF...", "info");
    try {
      const dataUrl = await toPng(resumeRef.current, { quality: 0.95, pixelRatio: 2 });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Resume-${user.name.replace(/\s+/g, '_')}.pdf`);
      showToast("PDF Downloaded!", "success");
    } catch (err) {
      showToast("Download failed.", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      
      {/* LEFT SIDE: INPUT */}
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-lg">
           <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
             <Sparkles className="text-yellow-300" /> AI Resume Architect
           </h2>
           <p className="text-blue-100 text-sm">
             Paste your rough work history. We will generate it and <strong>automatically save</strong> it to your records.
           </p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Your Rough Notes
          </label>
          <textarea 
            className="w-full h-64 p-4 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
            placeholder="e.g. I worked at XYZ Corp from 2021 to 2023..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
          
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="flex-1 py-3"
              icon={Sparkles}
            >
              {isLoading ? 'Architecting & Saving...' : 'Generate Resume'}
            </Button>
            {resumeData && (
              <Button 
                onClick={handleDownloadPDF} 
                variant="outline"
                className="px-6 border-indigo-200 text-indigo-600"
                icon={Download}
              >
                PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PREVIEW */}
      <div className="bg-gray-200 dark:bg-[#0F172A] rounded-3xl p-4 lg:p-8 overflow-y-auto max-h-[800px] shadow-inner flex justify-center">
        {!resumeData ? (
          <div className="flex flex-col items-center justify-center text-gray-400 h-full opacity-60">
            <FileText size={64} className="mb-4" />
            <p>Your resume preview will appear here</p>
          </div>
        ) : (
          <div 
            ref={resumeRef}
            className="bg-white text-gray-800 w-full max-w-[210mm] min-h-[297mm] p-8 shadow-2xl rounded-sm text-sm leading-relaxed"
            style={{ fontFamily: 'Times New Roman, serif' }} 
          >
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-6">
              <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-900 mb-2">
                {resumeData.full_name || user.name}
              </h1>
              <p className="text-lg font-medium text-gray-600 tracking-wider">
                {resumeData.professional_title}
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-8">
              
              {/* Main Column */}
              <div className="col-span-8 space-y-6">
                
                {/* Summary */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                    <User size={14} /> Profile
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {resumeData.summary}
                  </p>
                </section>

                {/* Experience */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <Briefcase size={14} /> Experience
                  </h3>
                  <div className="space-y-5">
                    {resumeData.experience?.map((job, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-gray-900 text-base">{job.role}</h4>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{job.period}</span>
                        </div>
                        <p className="text-indigo-600 font-medium mb-2">{job.company}</p>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{job.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Sidebar Column */}
              <div className="col-span-4 space-y-8 pl-6 border-l border-gray-100">
                
                {/* Skills */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills?.map((skill, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Education */}
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <GraduationCap size={14} /> Education
                  </h3>
                  <div className="space-y-4">
                    {resumeData.education?.map((edu, i) => (
                      <div key={i}>
                        <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.school}</p>
                        <p className="text-gray-400 text-xs mt-1">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;