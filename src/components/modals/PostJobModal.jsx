import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { 
  ChevronRight, Sparkles, Briefcase, Clock, 
  DollarSign, AlignLeft, Tags, Paperclip, Crown, ShieldCheck, ChevronDown  
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCAL_CATEGORIES } from '../../utils/constants';

// --- UTILS ---
function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- MICRO-COMPONENTS ---
const ModernInput = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
      <Icon size={18} />
    </div>
    <input 
      {...props}
      className={cn(
        "w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/10 rounded-xl outline-none transition-all duration-200 shadow-sm",
        "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400",
        "placeholder:text-gray-400 dark:text-white text-sm font-medium text-gray-900"
      )}
    />
  </div>
);

const SelectPill = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 border",
      selected 
        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20" 
        : "bg-white dark:bg-[#0B0F19] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
    )}
  >
    {label}
  </button>
);

// --- MAIN COMPONENT ---
const PostJobModal = ({ onClose, onSubmit }) => {
  const [duration, setDuration] = useState('');
  const durationOptions = ["1-3 Days", "1 Week", "2 Weeks", "1 Month"];
  
  const [baseBudget, setBaseBudget] = useState('');
  const [isElite, setIsElite] = useState(false);
  
  // 🚀 NEW: Dynamic Minimum Budget Logic
  const minBudget = isElite ? 500 : 100;

  // Smart Toggle: Auto-bumps budget to 500 if they switch to Elite while too low
  const handleEliteToggle = () => {
      const nextEliteState = !isElite;
      setIsElite(nextEliteState);
      
      if (nextEliteState && baseBudget !== '' && Number(baseBudget) < 500) {
          setBaseBudget('500');
      }
  };

  // Secure Intercept for Form Submission
  const handleSafeSubmit = (e) => {
      e.preventDefault();
      if(onSubmit) onSubmit(e);
  };
  
  return (
    <Modal title="Post a New Project" onClose={onClose}>
      <form onSubmit={handleSafeSubmit} className="relative space-y-6">
        
        {/* CRITICAL: HIDDEN INPUTS FOR DATABASE */}
        <input type="hidden" name="budget" value={Number(baseBudget || 0) + (isElite ? 20 : 0)} />
        <input type="hidden" name="is_elite" value={isElite ? "true" : "false"} />

        {/* 1. Job Title */}
        <div className="space-y-1.5">
           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Project Title</label>
           <ModernInput name="title" icon={Briefcase} placeholder="e.g., Senior React Developer for E-commerce" required />
        </div>

        {/* 2. Budget & Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest transition-all">
                  Budget (Min ₹{minBudget})
              </label>
              <ModernInput 
                type="number" 
                icon={DollarSign} 
                placeholder={String(minBudget)} 
                min={minBudget} 
                value={baseBudget}
                onChange={(e) => setBaseBudget(e.target.value)}
                required 
              />
           </div>
           
           <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                   <Tags size={18} />
                </div>
                <select 
                  name="category" 
                  required
                  className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-900 dark:text-white appearance-none cursor-pointer font-medium transition-all shadow-sm"
                >
                  <option value="" disabled selected>Select Category...</option>
                  {Object.keys(LOCAL_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={16} />
                </div>
              </div>
           </div>
        </div>

        {/* 3. ELITE JOB UPGRADE TOGGLE */}
        <div 
            onClick={handleEliteToggle}
            className={cn(
                "p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer transition-all duration-200 gap-4",
                isElite 
                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/50 shadow-sm" 
                : "bg-gray-50 dark:bg-[#0B0F19] border-gray-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-700/50"
            )}
        >
           <div className="flex items-start gap-3">
               <div className={cn("p-2 rounded-lg mt-0.5 transition-colors", isElite ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-gray-200 dark:bg-gray-800 text-gray-500")}>
                   <Crown size={18} />
               </div>
               <div>
                   <h4 className={cn("text-sm font-bold", isElite ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-white")}>
                       Make it an Elite Project
                   </h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                       Attract top-tier talent, bypass normal filters, and pin to the top of the job board. (+₹20 fee)
                   </p>
               </div>
           </div>
           
           <div className="flex items-center gap-3 self-end sm:self-center">
               {isElite && baseBudget && (
                   <span className="text-xs font-black text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-right-2">
                       Total: ₹{Number(baseBudget) + 20}
                   </span>
               )}
               {/* Apple-style Toggle Switch */}
               <div className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 relative", isElite ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-700")}>
                   <div className={cn("w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm", isElite ? "translate-x-6" : "translate-x-0")} />
               </div>
           </div>
        </div>

        {/* 4. Duration Selector */}
        <div className="space-y-1.5">
           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Expected Timeline</label>
           <div className="flex flex-wrap gap-2 mb-3">
             {durationOptions.map(opt => (
               <SelectPill key={opt} label={opt} selected={duration === opt} onClick={() => setDuration(opt)} />
             ))}
           </div>
           <ModernInput 
             name="duration" 
             icon={Clock} 
             placeholder="Or type custom duration (e.g., 3 Months)" 
             value={duration} 
             onChange={(e) => setDuration(e.target.value)} 
             required 
           />
        </div>

        {/* 5. Description */}
        <div className="space-y-1.5">
           <div className="flex justify-between items-end">
             <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Project Details</label>
             <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
               <Sparkles size={10} /> AI Enhanced
             </div>
           </div>
           <div className="relative">
             <div className="absolute top-4 left-4 text-gray-400"><AlignLeft size={18}/></div>
             <textarea 
               name="description" 
               rows="5" 
               className="w-full pl-11 pr-4 py-4 bg-white dark:bg-[#0B0F19] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-gray-900 dark:text-white resize-none transition-all shadow-sm placeholder:text-gray-400"
               placeholder="Describe the deliverables, technical requirements, and your expectations..."
               required
             ></textarea>
           </div>
        </div>

        {/* 6. Professional File Upload */}
        <div className="space-y-1.5">
           <div className="flex justify-between items-end">
             <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Reference Files</label>
             <span className="text-[10px] text-gray-400 font-medium">Max 5 Files (10MB)</span>
           </div>
           <div className="relative group cursor-pointer border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#0B0F19] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-400 transition-colors">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-hover:text-indigo-600 transition-colors">
               <Paperclip size={18} />
             </div>
             <input
               type="file"
               name="attachments"
               multiple
               accept="image/*,.pdf,.doc,.docx,.mp3"
               onClick={(e) => e.stopPropagation()}
               className="w-full pl-11 pr-4 py-3 outline-none text-sm text-gray-600 dark:text-gray-300 cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-500/20 dark:file:text-indigo-300 transition-all"
             />
           </div>
        </div>

        {/* Professional Disclaimer */}
        <div className="flex items-start gap-2 bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10">
           <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
           <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
             By posting, you agree to our Terms of Service. Intellectual Property (IP) rights transfer to you automatically upon full payment release through our secure escrow.
           </p>
        </div>

        {/* Action Button */}
        <button type="submit" className="w-full rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black py-4 font-bold text-sm transition-all hover:bg-gray-800 dark:hover:bg-gray-200 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
          Post Project <ChevronRight size={16} />
        </button>

      </form>
    </Modal>
  );
};

export default PostJobModal;