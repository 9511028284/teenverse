import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Sparkles, Zap, AlertCircle, Send, Wand2, CheckCircle2, DollarSign, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs) { return twMerge(clsx(inputs)); }

const ApplyJobModal = ({ onClose, onSubmit, job, user, currentEnergy, setSelectedJob }) => {
  if (!job) return null;
  
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [educationConsent, setEducationConsent] = useState(false);
  const [bidAmount, setBidAmount] = useState(job.budget || 0);

  // 🚀 DYNAMIC COMMISSION LOGIC
  const getCommissionRate = (plan) => {
    switch (plan) {
      case 'Elite': return 0.03;   // 3%
      case 'Pro': return 0.035;    // 3.5%
      case 'Starter': return 0.04; // 4%
      default: return 0.05;        // 5% (Basic)
    }
  };

  const planName = user?.current_plan || 'Basic';
  const commissionRate = getCommissionRate(planName);
  const platformFee = bidAmount * commissionRate;
  const payoutAmount = bidAmount - platformFee;

  const ENERGY_COST = 2;
  const hasEnoughEnergy = currentEnergy >= ENERGY_COST;

  // --- 1. THE AI ENGINE ---
  const typeWriterEffect = (text) => {
    let i = 0;
    setCoverLetter(""); 
    const speed = 15; 

    const type = () => {
      if (i < text.length) {
        setCoverLetter((prev) => prev + text.charAt(i));
        i++;
        setTimeout(type, speed);
      } else {
        setIsMagicLoading(false);
      }
    };
    type();
  };

  const handleMagicDraft = () => {
    if (isMagicLoading) return;
    setIsMagicLoading(true);

    const templates = [
      `Hi ${job.client_name || 'Hiring Manager'},\n\nI saw your listing for "${job.title}" and I'm super excited about it! 🚀\n\nI am a skilled ${user.specialty || 'freelancer'} with experience in ${job.category || 'this field'}. I've handled similar projects before and I'm confident I can deliver exactly what you need within the ${job.duration || 'timeline'}.\n\nMy approach is creative, efficient, and detail-oriented. You can check out my portfolio to see my past work.\n\nLooking forward to creating something awesome together!\n\nBest,\n${user.name}`,
      `Hey there! 👋\n\nI'm ${user.name}, and I'd love to help you with "${job.title}".\n\nI understand you're looking for someone who can execute this with quality and speed. I have strong skills in ${job.tags || 'the required tech stack'} and I'm ready to start immediately.\n\nI'm happy to do this for ₹${bidAmount}. Let's chat more about your vision!\n\nCheers,\n${user.name}`
    ];

    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    setTimeout(() => { typeWriterEffect(selectedTemplate); }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasEnoughEnergy || !educationConsent) return;

    setLoading(true);
    setTimeout(() => {
        onSubmit(e, ENERGY_COST, educationConsent); 
        setLoading(false);
    }, 1000);
  };

  return (
    <Modal title={`Apply: ${job.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        {/* --- 1. GAMIFIED ENERGY WALLET --- */}
        <div className={cn(
            "relative overflow-hidden rounded-[24px] border p-5 transition-all duration-300 group",
            hasEnoughEnergy ? "bg-[#09090b] border-indigo-500/30" : "bg-red-950/20 border-red-500/30"
        )}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10",
                        hasEnoughEnergy ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "bg-red-900/50 text-red-200"
                    )}>
                        <Zap size={24} className={hasEnoughEnergy ? "fill-yellow-300 text-yellow-300" : ""} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Energy Cost</div>
                        <div className="text-xl font-black text-white flex items-center gap-1">
                            -{ENERGY_COST} <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">PTS</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Balance</div>
                    <div className={cn("text-xl font-black", hasEnoughEnergy ? "text-emerald-400" : "text-red-400")}>
                        {hasEnoughEnergy ? currentEnergy - ENERGY_COST : currentEnergy} ⚡
                    </div>
                </div>
            </div>
        </div>

        {/* --- 2. THE BID & RECEIPT --- */}
        <div className="bg-[#09090b] p-6 rounded-[24px] border border-white/10 space-y-5">
            <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={14} /> Your Bid
                </label>
                {/* 🚀 Show Badge for their commission rate */}
                <div className="flex gap-2">
                  <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Percent size={10}/> {commissionRate * 100}% Fee ({planName})
                  </div>
                  <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
                      Budget: ₹{job.budget}
                  </div>
                </div>
            </div>
            
            <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl group-focus-within:text-white transition-colors">₹</div>
                <input 
                    name="bid_amount" 
                    type="number" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min="1"
                    className="w-full pl-10 pr-4 py-4 bg-black/50 border border-white/10 rounded-2xl font-black text-2xl text-white outline-none focus:border-indigo-500 transition-all"
                />
            </div>

            {/* Receipt Visualization with Dynamic Math */}
            <div className="flex items-center justify-between text-[10px] font-mono border-t border-dashed border-white/10 pt-4">
                <div className="text-center">
                    <span className="text-gray-500 block mb-1">BID AMOUNT</span>
                    <span className="text-white font-bold text-sm">₹{Number(bidAmount).toLocaleString()}</span>
                </div>
                <div className="text-gray-600">-</div>
                <div className="text-center">
                    <span className="text-gray-500 block mb-1">FEE ({(commissionRate * 100).toFixed(1)}%)</span>
                    <span className="text-red-400 font-bold text-sm">₹{platformFee.toFixed(0)}</span>
                </div>
                <div className="text-gray-600">=</div>
                <div className="text-center">
                    <span className="text-gray-500 block mb-1">YOUR PAYOUT</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{payoutAmount.toFixed(0)}</span>
                </div>
            </div>
        </div>

        {/* --- 3. MAGIC COVER LETTER --- */}
        <div className="relative">
           <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cover Letter</label>
              <button 
                type="button" 
                onClick={handleMagicDraft}
                disabled={isMagicLoading}
                className="relative overflow-hidden px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <div className="relative z-10 flex items-center gap-1.5">
                    {isMagicLoading ? <Wand2 size={12} className="animate-spin"/> : <Sparkles size={12} className="fill-white"/>}
                    {isMagicLoading ? 'Synthesizing...' : 'AI Auto-Draft'}
                </div>
              </button>
           </div>
           
           <div className="relative">
               <textarea 
                 name="cover_letter" 
                 value={coverLetter}
                 onChange={(e) => setCoverLetter(e.target.value)}
                 className={cn(
                     "w-full h-40 p-5 bg-[#09090b] border border-white/10 rounded-[24px] text-sm leading-relaxed text-gray-300 focus:text-white focus:border-indigo-500 outline-none resize-none transition-all font-light",
                     isMagicLoading && "animate-pulse"
                 )}
                 placeholder="Tell them why you are the best fit..."
                 required
               ></textarea>
           </div>
        </div>

        {/* Educational Waiver */}
        <div 
            onClick={() => setEducationConsent(!educationConsent)}
            className={cn(
                "p-4 rounded-xl border flex gap-3 items-start cursor-pointer transition-all duration-300",
                educationConsent ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/10"
            )}
        >
            <div className={cn(
                "mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                educationConsent ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-500 text-transparent"
            )}>
                <CheckCircle2 size={14} strokeWidth={4} />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wide mb-1">Educational Protocol</p>
                <p className="text-xs text-gray-500 leading-tight">
                    I confirm this task is for skill-building purposes only. I understand this is a simulated environment.
                </p>
            </div>
        </div>

        {/* --- 4. ACTION BUTTON --- */}
        <button 
            disabled={!hasEnoughEnergy || loading || !educationConsent}
            className="group relative w-full py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest disabled:opacity-50 overflow-hidden transition-all hover:-translate-y-1"
        >
            <div className="flex items-center justify-center gap-2">
               {loading ? <>Processing Protocol...</> : (
                   <>
                      Send Proposal <Send size={16} strokeWidth={2.5} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </>
               )}
            </div>
        </button>

      </form>
    </Modal>
  );
};

export default ApplyJobModal;