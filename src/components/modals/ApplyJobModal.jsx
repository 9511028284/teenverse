import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Sparkles, Zap, AlertCircle, Send, Wand2 } from 'lucide-react';
import * as api from '../../services/dashboard.api';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const ApplyJobModal = ({ onClose, onSubmit, job, user, currentEnergy }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  
  // Mandatory "Educational Purpose" Waiver
  const [educationConsent, setEducationConsent] = useState(false);

  const ENERGY_COST = 2;
  const hasEnoughEnergy = currentEnergy >= ENERGY_COST;

  const handleMagicDraft = async () => {
    setIsMagicLoading(true);
    setTimeout(() => {
        const text = api.generateCoverLetter(user.name, job.title, job.category || 'this skill');
        setCoverLetter(text);
        setIsMagicLoading(false);
    }, 800);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasEnoughEnergy) return;

    // Block submission without consent
    if (!educationConsent) {
        alert("Please confirm this is a skill-building activity.");
        return;
    }

    setLoading(true);
    // ✅ UPDATED: Pass consent to the parent handler
    onSubmit(e, ENERGY_COST, educationConsent); 
  };

  return (
    <Modal title={`Apply: ${job.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- 1. GAMIFIED ENERGY WALLET --- */}
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                hasEnoughEnergy 
                    ? "bg-indigo-900/10 border-indigo-500/30 dark:bg-indigo-500/10" 
                    : "bg-red-500/10 border-red-500/30"
            )}
        >
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-white/10",
                        hasEnoughEnergy ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" : "bg-red-500 text-white"
                    )}>
                        <Zap size={24} className={hasEnoughEnergy ? "fill-yellow-300 text-yellow-300" : ""} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Energy Cost</div>
                        <div className="text-xl font-black dark:text-white flex items-center gap-1">
                            -{ENERGY_COST} <div className="text-sm font-medium text-gray-400 inline ml-1">Points</div>
                        </div>
                    </div>
                </div>
                 
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Remaining</div>
                    <div className={cn("text-xl font-black", hasEnoughEnergy ? "text-green-500" : "text-red-500")}>
                        {hasEnoughEnergy ? currentEnergy - ENERGY_COST : currentEnergy} ⚡
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {!hasEnoughEnergy && (
                <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center gap-2 text-xs font-bold text-red-500 animate-pulse">
                    <AlertCircle size={14}/> Not enough energy! Complete quizzes to recharge.
                </div>
            )}
        </motion.div>
        
        {/* Legal Disclaimer for Gamification */}
        <p className="text-[10px] text-gray-400 text-center -mt-4">
           *Energy is a free engagement tool. No purchase necessary.
        </p>

        {/* --- 2. THE BID & RECEIPT --- */}
        <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-3xl border border-gray-200 dark:border-white/5 space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Your Bid Amount</label>
                <div className="text-xs font-bold text-indigo-500">Client Budget: ₹{job.budget}</div>
            </div>
            
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>
                <input 
                    name="bid_amount" 
                    type="number" 
                    defaultValue={job.budget}
                    min="1"
                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl font-black text-lg outline-none focus:border-indigo-500 dark:text-white transition-all"
                />
            </div>

            {/* Receipt Visualization */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-white/5 p-2 rounded-lg">
                <div className="flex-1 text-center">
                    <strong className="block mb-1 font-normal">Bid</strong>
                    <strong className="text-gray-900 dark:text-white text-sm">₹{job.budget}</strong>
                </div>
                <div className="text-gray-300">-</div>
                <div className="flex-1 text-center text-red-400">
                    <strong className="block mb-1 font-normal">Fee (5%)</strong>
                    <strong>₹{(job.budget * 0.05).toFixed(0)}</strong>
                </div>
                <div className="text-gray-300">=</div>
                <div className="flex-1 text-center text-green-500">
                    <strong className="block mb-1 font-normal">You Get</strong>
                    <strong className="text-sm">₹{(job.budget * 0.95).toFixed(0)}</strong>
                </div>
            </div>
        </div>

        {/* --- 3. MAGIC COVER LETTER --- */}
        <div className="relative group">
           <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cover Letter</label>
              
              <button 
                type="button" 
                onClick={handleMagicDraft}
                disabled={isMagicLoading}
                className="relative overflow-hidden group/btn px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
              >
                <div className="relative z-10 flex items-center gap-1">
                    {isMagicLoading ? <Wand2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                    {isMagicLoading ? 'Generating...' : 'AI Magic Draft'}
                </div>
                <div className="absolute inset-0 bg-white/20 blur-sm -translate-x-full group-hover/btn:animate-[shimmer_1s_infinite]" />
              </button>
           </div>
           
           <textarea 
              name="cover_letter" 
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className={cn(
                  "w-full h-32 p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all dark:text-gray-300",
                  isMagicLoading ? "animate-pulse opacity-70 cursor-wait" : ""
              )}
              placeholder="Why are you the chosen one for this mission?"
              required
           ></textarea>
        </div>

        {/* Mandatory "Safe Harbour" Waiver */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-white/5 flex gap-3 items-start">
            <input 
                type="checkbox" 
                id="edu_consent"
                checked={educationConsent}
                onChange={(e) => setEducationConsent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="edu_consent" className="text-xs text-indigo-900 dark:text-indigo-200 cursor-pointer">
                <strong>Safety Check:</strong> I confirm this task is for skill-building & educational purposes only. I am not entering into an employment contract.
            </label>
        </div>

        {/* --- 4. ACTION BUTTON --- */}
        <button 
            disabled={!hasEnoughEnergy || loading || !educationConsent}
            className="group relative w-full py-4 rounded-2xl bg-[#0F172A] dark:bg-white text-white dark:text-black font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition-opacity" />
            
            <div className="flex items-center justify-center gap-3">
               {loading ? (
                   <>Processing...</>
               ) : (
                   <>
                     Send Proposal <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </>
               )}
            </div>
        </button>

      </form>
    </Modal>
  );
};

export default ApplyJobModal;