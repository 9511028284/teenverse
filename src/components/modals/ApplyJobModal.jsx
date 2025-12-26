import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Sparkles, Zap, AlertCircle } from 'lucide-react'; // Added Zap and AlertCircle
import * as api from '../../services/dashboard.api';

const ApplyJobModal = ({ onClose, onSubmit, job, user, currentEnergy }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- FEATURE 2: ENERGY LOGIC ---
  const ENERGY_COST = 2;
  const hasEnoughEnergy = currentEnergy >= ENERGY_COST;

  // --- FEATURE 5: MAGIC GENERATOR ---
  const handleMagicDraft = () => {
    // Generate text using the helper from api.js
    const text = api.generateCoverLetter(user.name, job.title, job.category || 'this skill');
    setCoverLetter(text);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasEnoughEnergy) return;
    
    setLoading(true);
    // Pass the event AND the energy cost to the parent handler
    onSubmit(e, ENERGY_COST); 
  };

  return (
    <Modal title={`Apply for: ${job.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- ENERGY COST HEADER --- */}
        <div className={`p-4 rounded-xl border flex justify-between items-center ${hasEnoughEnergy ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasEnoughEnergy ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-500'}`}>
                    <Zap size={20} className={hasEnoughEnergy ? "fill-indigo-600" : ""}/>
                </div>
                <div>
                    <div className="text-xs font-bold uppercase text-gray-500">Application Cost</div>
                    <div className={`font-bold ${hasEnoughEnergy ? 'text-indigo-900' : 'text-red-600'}`}>
                        {ENERGY_COST} Energy Points
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs font-bold uppercase text-gray-500">Your Balance</div>
                <div className="font-bold text-gray-900">{currentEnergy} ⚡</div>
            </div>
        </div>

        {!hasEnoughEnergy && (
            <div className="text-xs text-red-500 flex items-center gap-1 font-bold animate-pulse">
                <AlertCircle size={12}/> You need more energy. Take a quiz in Academy to earn more!
            </div>
        )}

        {/* Budget Display */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/10">
           <span className="text-sm text-gray-500">Client's Budget</span>
           <span className="text-xl font-bold dark:text-white">₹{job.budget}</span>
        </div>

        {/* Cover Letter Input with Magic Button */}
        <div className="relative">
           <div className="flex justify-between items-end mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Cover Letter</label>
              
              {/* MAGIC BUTTON */}
              <button 
                type="button" 
                onClick={handleMagicDraft}
                className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded-full transition-colors"
              >
                <Sparkles size={12}/> Magic Draft
              </button>
           </div>
           
           <textarea 
              name="cover_letter" 
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full h-32 p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Why are you the best fit for this job?"
              required
           ></textarea>
        </div>

        {/* Bid Amount */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Your Bid (₹)</label>
           <input 
             name="bid_amount" 
             type="number" 
             defaultValue={job.budget}
             min="100"
             className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none focus:border-indigo-500"
           />
           <p className="text-[10px] text-gray-400 mt-2">
             Note: A 4% platform fee applies. You will receive ₹{(job.budget * 0.96).toFixed(0)}.
           </p>
        </div>

        <Button 
            disabled={!hasEnoughEnergy || loading} 
            className="w-full py-4 text-lg shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Sending...' : 'Send Proposal 🚀'}
        </Button>
      </form>
    </Modal>
  );
};

export default ApplyJobModal;