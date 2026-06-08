import React from 'react';
import { Trophy, ShieldCheck, Zap, Award, BookOpen, Star, BrainCircuit } from 'lucide-react';

// --- STATIC GENERAL QUIZZES ---
const STATIC_QUIZZES = [
  {
    id: 'intro_freelance',
    title: "Freelancing 101",
    description: "Learn the absolute basics of being your own boss.",
    xp: 50,
    energy: 2,
    questions: [
      { q: "What is a freelancer?", options: ["A full-time employee", "Self-employed contractor", "A volunteer", "An intern"], a: "Self-employed contractor" },
      { q: "Who handles your taxes?", options: ["The Client", "The Government automatically", "You (The Freelancer)", "Your parents"], a: "You (The Freelancer)" },
      { q: "What is a 'deadline'?", options: ["The date payment is due", "The date work must be submitted", "The date you start work", "A suggestion"], a: "The date work must be submitted" },
      { q: "Can you work for multiple clients?", options: ["Yes", "No, only one", "Only if they know each other", "Illegal"], a: "Yes" },
      { q: "What do you send to get paid?", options: ["A text message", "An Invoice", "A selfie", "A thank you note"], a: "An Invoice" }
    ]
  },
  {
    id: 'safety_first',
    title: "Digital Safety",
    description: "How to stay safe and avoid scams online.",
    xp: 50,
    energy: 2,
    questions: [
      { q: "A client asks for your password. Do you give it?", options: ["Yes", "Only if they pay extra", "NEVER", "Maybe"], a: "NEVER" },
      { q: "Where should you communicate?", options: ["On the Platform", "WhatsApp", "Instagram DM", "Snapchat"], a: "On the Platform" },
      { q: "A client wants to pay outside the app. Good idea?", options: ["Yes, saves fees", "No, high risk of scam", "Yes, it's faster", "Only if cash"], a: "No, high risk of scam" },
      { q: "What is 'Phishing'?", options: ["A sport", "Fake emails stealing data", "Coding style", "A payment method"], a: "Fake emails stealing data" },
      { q: "Should you download random .exe files?", options: ["Yes", "No", "Only if they look cool", "If the client says so"], a: "No" }
    ]
  },
  {
    id: 'client_manners',
    title: "Pro Communication",
    description: "Talk like a pro to win more jobs.",
    xp: 50,
    energy: 2,
    questions: [
      { q: "How do you start a message?", options: ["Yo", "Hey dude", "Hi [Name],", "Listen here"], a: "Hi [Name]," },
      { q: "You are going to be late. What do you do?", options: ["Ghost them", "Inform them ASAP", "Lie about it", "Submit incomplete work"], a: "Inform them ASAP" },
      { q: "The client hates your work. You:", options: ["Argue back", "Ask for feedback politely", "Delete account", "Cry"], a: "Ask for feedback politely" },
      { q: "Should you use ALL CAPS?", options: ["YES IT LOOKS COOL", "No, it looks like shouting", "Sometimes", "Only for titles"], a: "No, it looks like shouting" },
      { q: "How quickly should you reply?", options: ["Within 24 hours", "Next week", "Whenever I feel like it", "Never"], a: "Within 24 hours" }
    ]
  },
  {
    id: 'money_smart',
    title: "Money Smarts",
    description: "Understanding value, earnings and savings.",
    xp: 50,
    energy: 2,
    questions: [
      { q: "If a job pays ₹500, is it all profit?", options: ["Yes", "No, there are fees/expenses", "Only on Tuesdays", "If cash"], a: "No, there are fees/expenses" },
      { q: "What is a 'Budget'?", options: ["A cheap item", "A plan for spending/saving", "A type of bird", "A bank"], a: "A plan for spending/saving" },
      { q: "Should you spend all your earnings immediately?", options: ["Yes, YOLO", "No, save some", "Buy candy only", "Give it away"], a: "No, save some" },
      { q: "Why do platform fees exist?", options: ["To steal money", "To cover server/support costs", "For fun", "No reason"], a: "To cover server/support costs" },
      { q: "What is Escrow?", options: ["A crow", "Money held safely until work is done", "A loan", "A tax"], a: "Money held safely until work is done" }
    ]
  }
];

const Academy = ({ unlockedSkills, setModal, quizzes }) => {
  const earnedBadges = Object.entries(quizzes).filter(([key]) => unlockedSkills.includes(key));

  return (
    <div className="animate-fade-in pb-20 space-y-8 sm:space-y-12">
      
      {/* 1. HERO ACADEMY BANNER */}
      <div className="relative rounded-[32px] overflow-hidden bg-slate-900 border border-slate-200/60 dark:border-white/[0.05] shadow-[inset_0_3px_6px_rgba(255,255,255,0.1),_0_12px_28px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_20px_40px_rgba(0,0,0,0.4)] p-8 sm:p-10">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none dark:bg-indigo-500/10" />
         
         <div className="relative z-10 space-y-2">
             <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Ecosystem Education
             </span>
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none pt-1">
                TEENVERSE<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">HUB</span> ACADEMY
             </h2>
             <p className="text-slate-400 max-w-lg text-xs sm:text-sm font-medium leading-relaxed pt-1">
                Complete orientation modules to earn critical account energy. Apply for real-world projects to unlock verifiable skill badges.
             </p>
         </div>
      </div>

      {/* 2. GENERAL TRAINING MODULES */}
      <div className="space-y-6">
         <div className="flex items-center gap-4">
             <div className="h-px bg-slate-200 dark:bg-white/[0.05] flex-grow" />
             <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <BrainCircuit size={14} className="text-indigo-500" /> Basic Orientation
             </h3>
             <div className="h-px bg-slate-200 dark:bg-white/[0.05] flex-grow" />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATIC_QUIZZES.map((quiz) => (
                <button 
                  key={quiz.id}
                  onClick={() => setModal({ type: 'quiz', category: 'general', data: quiz, isGeneral: true })}
                  className="group relative flex flex-col justify-between bg-white border border-slate-200/60 dark:bg-slate-900/40 dark:border-white/[0.05] rounded-[24px] p-6 text-left transition-all duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_12px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_16px_32px_rgba(99,102,241,0.08)] dark:hover:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.12),_0_16px_32px_rgba(99,102,241,0.12)] hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:-translate-y-0.5"
                >
                    <div className="absolute top-5 right-5 text-slate-200 dark:text-white/[0.03] group-hover:text-indigo-500/40 transition-colors duration-300">
                        <Star size={20} fill="currentColor" />
                    </div>
                    
                    <div>
                      {/* Icon Shield Container */}
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] dark:shadow-none transition-transform duration-300 group-hover:scale-105">
                          <BookOpen size={18} strokeWidth={2.5} />
                      </div>

                      <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight mb-1.5">{quiz.title}</h4>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500 leading-normal mb-5 line-clamp-2">{quiz.description}</p>
                    </div>
                    
                    {/* Footnote badging details */}
                    <div className="flex items-center gap-3 text-[10px] font-bold font-mono pt-2 border-t border-slate-100 dark:border-white/[0.04] w-full">
                        <span className="flex items-center gap-1 text-yellow-500"><Zap size={10} fill="currentColor"/> +{quiz.xp} XP</span>
                        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500"><Trophy size={10}/> Base Cert</span>
                    </div>
                </button>
            ))}
         </div>
      </div>

      {/* 3. CERTIFICATES GRID (EARNED CREDENTIALS ONLY) */}
      {earnedBadges.length > 0 && (
          <div className="space-y-6">
             <div className="flex items-center gap-4 mt-4">
                 <div className="h-px bg-slate-200 dark:bg-white/[0.05] flex-grow" />
                 <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                     <ShieldCheck size={14} className="text-emerald-500" /> Verified Credentials
                 </h3>
                 <div className="h-px bg-slate-200 dark:bg-white/[0.05] flex-grow" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedBadges.map(([key, quiz]) => (
                    <div key={key} className="group relative" style={{ isolation: 'isolate' }}>
                        
                        {/* Glow Layer */}
                        <div className="absolute -inset-px rounded-[24px] bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-0 group-hover:opacity-15 blur-md transition-opacity duration-500 pointer-events-none" />
                        
                        {/* Core Certificate Base Plate */}
                        <div className="relative h-full bg-white border border-slate-200/80 rounded-[24px] p-5 overflow-hidden transition-all duration-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(16,185,129,0.02)] dark:bg-slate-900/60 dark:border-emerald-500/20 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_12px_28px_rgba(0,0,0,0.3)]">
                            
                            {/* Watermarked Icon Motif Background */}
                            <div className="absolute -bottom-2 -right-2 p-0 text-emerald-500/[0.03] dark:text-emerald-500/[0.02] pointer-events-none select-none transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                                <Award size={110} strokeWidth={1} />
                            </div>

                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 flex items-center justify-center shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.6)] dark:shadow-none">
                                    <ShieldCheck size={22} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate mb-1">{quiz.title}</h4>
                                    <span className="inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                        Verified Proficient
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                                <span className="flex items-center gap-1 text-yellow-500"><Zap size={11} fill="currentColor"/> Active</span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                <span className="font-mono text-[9px] font-black">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};

export default Academy;