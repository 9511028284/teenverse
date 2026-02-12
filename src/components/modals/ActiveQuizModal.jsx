import React from 'react';
import Modal from '../ui/Modal'; 
import { Trophy, Target, Hash, Zap, ChevronRight, HelpCircle } from 'lucide-react';

const ActiveQuizModal = ({ modalData, currentQuestionIndex, score, setScore, setCurrentQuestionIndex, handleQuizSelection, onClose, showToast }) => {
  if (!modalData?.data) return null;

  const questions = modalData.data.questions;
  const currentQ = questions[currentQuestionIndex];
  
  // 🛑 FIX 1: Handle case where AI returns "question" but Static quizzes return "q"
  const questionText = currentQ.question || currentQ.q; 
  const correctAns = currentQ.correctAnswer || currentQ.a;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const questionHash = `0x${(currentQuestionIndex + 99).toString(16).toUpperCase()}F`;

  const handleOptionClick = (opt) => {
      // 🛑 FIX 2: Check against the correct answer variable
      if (opt === correctAns) {
          setScore(prev => prev + 1);
          showToast("Correct! +10 XP", "success");
      } else {
          showToast("Wrong answer!", "error");
      }

      if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex(prev => prev + 1);
      } else {
          // Quiz Finished
          const finalScore = (score + (opt === correctAns ? 1 : 0));
          const passThreshold = Math.ceil(questions.length * 0.6); // 60% to pass
          const passed = finalScore >= passThreshold;
          
          // 🛑 FIX 3: Pass the 'isGeneral' flag to logic so it knows reward type
          handleQuizSelection(modalData.category, passed, modalData.isGeneral);
          onClose();
      }
  };

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
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
            </div>

            <div className="relative z-10 flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
                    <Hash size={12}/> 
                    <span>ID: {questionHash}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                   <span>Sector {currentQuestionIndex + 1}/{questions.length}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500" 
                     style={{ width: `${progress}%` }}></div>
            </div>

            {/* 🛑 FIX 4: DISPLAY THE QUESTION TEXT HERE */}
            <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-2">
                {questionText}
            </h3>
            {/* ------------------------------------------------ */}

            <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-mono">
                    XP_REWARD: {modalData.isGeneral ? "50" : "500"}
                </span>
                <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
                    DIFFICULTY: LOW
                </span>
            </div>
        </div>

        {/* --- 2. OPTIONS GRID --- */}
        <div className="flex-grow">
            <div className="grid grid-cols-1 gap-3">
               {currentQ.options.map((opt, i) => (
                 <button 
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    className="group relative p-4 rounded-xl bg-gray-50/5 dark:bg-white/5 border border-gray-200/10 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"/>
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-white group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-all font-mono">
                                {String.fromCharCode(65 + i)}
                            </div>
                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors text-sm md:text-base">
                                {opt}
                            </span>
                        </div>
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
                <HelpCircle size={10} /> 60% Required to Pass
            </span>
        </div>

      </div>
    </Modal>
  );
};

export default ActiveQuizModal;