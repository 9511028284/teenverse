import React from 'react';
import { Trophy, Lock, Zap, BookOpen, Star, Hexagon, Play, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

const Academy = ({ unlockedSkills, setModal, quizzes }) => {
  
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      
      {/* LEVEL HEADER */}
      <div className="relative rounded-[32px] overflow-hidden bg-[#0f172a] p-8 border border-white/10 shadow-2xl">
         {/* Background Effects */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={20}/>
                  <span className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Current Rank</span>
               </div>
               <h2 className="text-4xl md:text-5xl font-black text-white italic">
                  LEVEL {Math.floor(unlockedSkills.length / 2) + 1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">MAVERICK</span>
               </h2>
               <p className="text-gray-400 mt-2 max-w-md">Complete {4 - (unlockedSkills.length % 4)} more challenges to reach the next tier.</p>
            </div>
            
            <div className="w-full md:w-1/3">
               <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase">
                  <span>XP Progress</span>
                  <span>{((unlockedSkills.length / 4) * 100).toFixed(0)}%</span>
               </div>
               <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 relative">
                      <div className="absolute inset-0 bg-white/30 w-full h-full animate-pulse"></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* SKILL TREE GRID */}
      <div>
         <div className="flex justify-between items-end mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="text-cyan-400"/> Skill Tree
             </h3>
             <span className="text-xs text-gray-500 font-medium">Pass exams to unlock jobs</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(quizzes).map(([key, quiz], index) => {
               const isUnlocked = unlockedSkills.includes(key);
               return (
                  <div key={key} className={`relative group p-1 rounded-[24px] transition-all duration-300 ${isUnlocked ? 'bg-gradient-to-b from-emerald-500 to-teal-500' : 'bg-gray-800 hover:bg-gray-700'}`}>
                     
                     {/* Inner Card */}
                     <div className="h-full bg-[#1e293b] rounded-[22px] p-6 relative overflow-hidden flex flex-col">
                        
                        {/* Status Icon */}
                        <div className="absolute top-4 right-4">
                           {isUnlocked 
                              ? <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400 shadow-lg shadow-emerald-500/20"><Trophy size={18}/></div>
                              : <div className="p-2 bg-gray-700 rounded-full text-gray-500"><Lock size={18}/></div>
                           }
                        </div>

                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isUnlocked ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-gray-700 text-gray-400'}`}>
                           <Hexagon size={28} strokeWidth={2}/>
                        </div>

                        <h4 className="text-xl font-bold text-white mb-2">{quiz.title || `Module ${index + 1}`}</h4>
                        
                        {/* Course Meta Data */}
                        <div className="flex gap-4 text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
                           <span className="flex items-center gap-1"><BookOpen size={12}/> 10 Questions</span>
                           <span className="flex items-center gap-1"><Star size={12}/> {quiz.xp || 1000} XP</span>
                        </div>

                        <p className="text-sm text-gray-400 mb-6 flex-grow leading-relaxed">
                           {isUnlocked ? "You have mastered this skill. Badge added to your profile." : "Prove your knowledge to unlock high-paying jobs in this category."}
                        </p>

                        {!isUnlocked ? (
                           <Button 
                              onClick={() => setModal({ type: 'quiz', category: key, data: quiz })} 
                              className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/50 py-4"
                              icon={Play}
                           >
                              Start Exam
                           </Button>
                        ) : (
                           <div className="w-full py-3 text-center text-xs font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30 rounded-xl bg-emerald-500/5 flex items-center justify-center gap-2">
                              <CheckCircle2 size={14}/> Certified
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