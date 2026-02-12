import React from 'react';
import { Trophy, ShieldCheck, Zap, Award, BookOpen, Star, BrainCircuit } from 'lucide-react';

// --- 🟢 STATIC GENERAL QUIZZES (Hardcoded Content) ---
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
    <div className="animate-fade-in pb-20 space-y-12">
      
      {/* 1. HEADER */}
      <div className="relative rounded-[40px] overflow-hidden bg-[#020617] border border-white/10 shadow-2xl group p-10">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
         
         <div className="relative z-10">
             <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-4">
                TEEN<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">VERSEHUB</span> ACADEMY
             </h2>
             <p className="text-gray-400 max-w-lg font-light leading-relaxed">
                Complete orientation modules to earn XP. Apply for jobs to unlock advanced skill certifications.
             </p>
         </div>
      </div>

      {/* 2. GENERAL TRAINING (STATIC QUIZZES) */}
      <div>
         <div className="flex items-center gap-4 mb-8">
             <div className="h-px bg-white/10 flex-grow"></div>
             <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                 <BrainCircuit className="text-blue-500" /> Basic Orientation
             </h3>
             <div className="h-px bg-white/10 flex-grow"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATIC_QUIZZES.map((quiz) => (
                <button 
                  key={quiz.id}
                  onClick={() => setModal({ type: 'quiz', category: 'general', data: quiz, isGeneral: true })}
                  className="group relative h-full bg-[#0F172A] hover:bg-[#1E293B] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 text-left transition-all hover:-translate-y-1"
                >
                    <div className="absolute top-4 right-4 text-blue-500/20 group-hover:text-blue-500 transition-colors">
                        <Star size={24} fill="currentColor" />
                    </div>
                    
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen size={20} />
                    </div>

                    <h4 className="text-lg font-bold text-white mb-2">{quiz.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">{quiz.description}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500">
                        <span className="flex items-center gap-1 text-yellow-500"><Zap size={10}/> +{quiz.xp} XP</span>
                        <span className="flex items-center gap-1 text-indigo-400"><Trophy size={10}/> No Badge</span>
                    </div>
                </button>
            ))}
         </div>
      </div>

      {/* 3. CERTIFICATES GRID (EARNED ONLY) */}
      {earnedBadges.length > 0 && (
          <div>
             <div className="flex items-center gap-4 mb-8 mt-12">
                 <div className="h-px bg-white/10 flex-grow"></div>
                 <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                     <ShieldCheck className="text-emerald-500" /> Verified Credentials
                 </h3>
                 <div className="h-px bg-white/10 flex-grow"></div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {earnedBadges.map(([key, quiz]) => (
                    <div key={key} className="group relative">
                        <div className="absolute -inset-0.5 rounded-[24px] bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-20 blur"></div>
                        <div className="relative h-full bg-[#09090b] rounded-[22px] p-6 overflow-hidden border border-emerald-500/20">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Award size={80} className="text-emerald-500/10 rotate-12"/>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white leading-none mb-1">{quiz.title}</h4>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Verified Proficient</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-auto">
                                <span className="flex items-center gap-1 text-yellow-500"><Zap size={10}/> Earned</span>
                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                <span>{new Date().toLocaleDateString()}</span>
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