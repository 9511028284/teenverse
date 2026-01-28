import React from 'react';
import Modal from '../ui/Modal'; 
import { Trophy, Target, Hash, Zap, ChevronRight, HelpCircle } from 'lucide-react';

const ActiveQuizModal = ({ modalData, currentQuestionIndex, score, setScore, setCurrentQuestionIndex, handleQuizSelection, onClose, showToast }) => {
  if (!modalData?.data) return null;

  const questions = modalData.data.questions;
  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Generate a fake "hash" for the question to make it look technical
  const questionHash = `0x${(currentQuestionIndex + 99).toString(16).toUpperCase()}F`;

  return (
    <Modal 
      title={
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="uppercase tracking-widest text-sm font-black italic">PROTOCOL: {modalData.data.title}</span>
        </div>
      } 
      onClose={() => { onClose(); setCurrentQuestionIndex(0); setScore(0); }}
    >
      <div className="relative z-10 space-y-8 min-h-[400px] flex flex-col">
        
        {/* --- 1. HUD HEADER (Progress & Stats) --- */}
        <div className="bg-[#020617] rounded-2xl p-4 border border-white/10 relative overflow-hidden">
            {/* Background Grid/Noise */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            
            <div className="relative z-10 flex justify-between items-end mb-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Target size={10} /> Progress Tracker
                    </span>
                    <span className="text-xl font-black text-white">
                        {String(currentQuestionIndex + 1).padStart(2, '0')} <span className="text-gray-600 text-sm">/ {String(questions.length).padStart(2, '0')}</span>
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Trophy size={10} /> Current Yield
                    </span>
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        {score * 100} XP
                    </span>
                </div>
            </div>

            {/* Futuristic Progress Bar */}
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 relative transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                </div>
            </div>
        </div>

        {/* --- 2. THE QUESTION TERMINAL --- */}
        <div className="flex-grow">
            <div className="flex items-center gap-2 mb-4 opacity-50">
                <Hash size={12} className="text-indigo-400"/>
                <span className="text-[10px] font-mono text-indigo-400">{questionHash} // DECRYPTING...</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8">
               {currentQ.q}
            </h3>

            {/* --- 3. OPTIONS (Interactive Blocks) --- */}
            <div className="grid gap-3">
               {currentQ.options.map((opt, i) => (
                 <button 
                   key={i} 
                   onClick={() => {
                     const isCorrect = opt === currentQ.a;
                     if (isCorrect) setScore(score + 1);
                     
                     // Next Question or Finish
                     if (currentQuestionIndex + 1 < questions.length) {
                       setCurrentQuestionIndex(currentQuestionIndex + 1);
                     } else {
                       // FINISH LOGIC
                       const finalScore = score + (isCorrect ? 1 : 0);
                       if (finalScore >= 7) { 
                         handleQuizSelection(modalData.category, true); 
                       } else {
                         showToast(`System Failure. Score: ${finalScore}/10. Rebooting...`, "error");
                         onClose();
                         setCurrentQuestionIndex(0);
                         setScore(0);
                       }
                     }
                   }} 
                   className="group relative w-full text-left p-[1px] rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none"
                 >
                    {/* Gradient Border on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Button Content */}
                    <div className="relative bg-[#0F172A] hover:bg-[#0F172A]/95 rounded-[11px] p-5 border border-white/5 flex items-center justify-between group-hover:border-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-white group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-all font-mono">
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors text-sm md:text-base">
                                {opt}
                            </span>
                        </div>
                        
                        {/* Hover Arrow */}
                        <ChevronRight className="text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" size={18}/>
                    </div>
                 </button>
               ))}
            </div>
        </div>

        {/* Footer Hints */}
        <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1">
                <Zap size={10} className="text-yellow-500"/> Live Session
            </span>
            <span className="flex items-center gap-1 opacity-50">
                <HelpCircle size={10} /> 70% Required to Pass
            </span>
        </div>

      </div>
    </Modal>
  );
};

export default ActiveQuizModal;