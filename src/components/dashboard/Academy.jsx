import React from 'react';
import { Trophy, Lock, Zap, BookOpen, Hexagon, Play, CheckCircle2 } from 'lucide-react';

const Academy = ({ unlockedSkills, setModal, quizzes }) => {
  
  return (
    <div className="animate-fade-in pb-20 space-y-12">
      
      {/* 1. PROGRESS DASHBOARD (Futuristic Header) */}
      <div className="relative rounded-[40px] overflow-hidden bg-[#020617] border border-white/10 shadow-2xl group">
         {/* Dynamic Noise & Gradient */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-yellow-500/20 to-orange-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
         
         <div className="relative z-10 p-10 flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Zap size={12} className="fill-yellow-400"/> Current Rank
               </div>
               <h2 className="text-6xl font-black text-white italic tracking-tighter">
                  LEVEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">{Math.floor(unlockedSkills.length / 2) + 1}</span>
               </h2>
               <p className="text-gray-400 max-w-md font-light text-sm leading-relaxed">
                  Complete <span className="text-white font-bold">{4 - (unlockedSkills.length % 4)} challenges</span> to initiate rank ascension.
               </p>
            </div>
            
            {/* XP Bar */}
            <div className="w-full md:w-1/3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
               <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                  <span>Experience</span>
                  <span className="text-white">{((unlockedSkills.length / 4) * 100).toFixed(0)}%</span>
               </div>
               <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-600 relative shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                    style={{ width: `${(unlockedSkills.length / 4) * 100}%` }}
                  >
                      <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 2. SKILL NODES (Hexagon Grid) */}
      <div>
         <div className="flex items-center gap-4 mb-8">
             <div className="h-px bg-white/10 flex-grow"></div>
             <h3 className="text-2xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                 <Hexagon className="text-emerald-500 fill-emerald-500/20" /> Skill Matrix
             </h3>
             <div className="h-px bg-white/10 flex-grow"></div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(quizzes).map(([key, quiz], index) => {
               const isUnlocked = unlockedSkills.includes(key);
               
               return (
                  <div key={key} className="group relative">
                     {/* Border Gradient Animation */}
                     <div className={`absolute -inset-0.5 rounded-[24px] bg-gradient-to-br ${isUnlocked ? 'from-emerald-400 to-cyan-500' : 'from-gray-700 to-gray-800'} opacity-50 blur transition duration-500 group-hover:opacity-100`}></div>
                     
                     <div className="relative h-full bg-[#09090b] rounded-[22px] p-6 flex flex-col overflow-hidden">
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                           {isUnlocked 
                              ? <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Trophy size={16}/></div>
                              : <div className="p-2 bg-white/5 rounded-lg text-gray-600 border border-white/5"><Lock size={16}/></div>
                           }
                        </div>

                        {/* Icon Node */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 border ${isUnlocked ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                           <Hexagon size={32} strokeWidth={1.5} />
                        </div>

                        <h4 className="text-xl font-bold text-white mb-1">{quiz.title}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">
                           <span className="flex items-center gap-1"><BookOpen size={10}/> 10 Qs</span>
                           <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                           <span className="flex items-center gap-1 text-yellow-500"><Zap size={10}/> {quiz.xp || 1000} XP</span>
                        </div>

                        <p className="text-sm text-gray-400 mb-8 flex-grow leading-relaxed font-light border-l-2 border-gray-800 pl-3">
                           {isUnlocked ? "Proficiency verified. Digital certificate minted to blockchain profile." : "Pass the assessment to unlock high-value contracts in this sector."}
                        </p>

                        {/* Action Button */}
                        {!isUnlocked ? (
                           <button 
                              onClick={() => setModal({ type: 'quiz', category: key, data: quiz })} 
                              className="w-full py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                           >
                              <Play size={12} fill="currentColor" /> Initialize Exam
                           </button>
                        ) : (
                           <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                               <CheckCircle2 size={14}/> Mastered
                           </div>
                        )}
                     </div>
                  </div>
               )
            })}
         </div>
      </div>
    </div>
  );
};

export default Academy;