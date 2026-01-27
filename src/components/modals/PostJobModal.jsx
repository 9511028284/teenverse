import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { 
  ChevronRight, Sparkles, Briefcase, Clock, 
  DollarSign, AlignLeft, Tags 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LOCAL_CATEGORIES } from '../../utils/constants';

// --- UTILS ---
function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- MICRO-COMPONENTS ---
const GlowInput = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
      <Icon size={18} />
    </div>
    <input 
      {...props}
      className={cn(
        "w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl outline-none transition-all duration-300",
        "focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
        "placeholder:text-gray-400 dark:text-white font-medium"
      )}
    />
  </div>
);

const SelectPill = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
      selected 
        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105" 
        : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-indigo-300 dark:hover:border-white/20"
    )}
  >
    {label}
  </button>
);

// --- MAIN COMPONENT ---
const PostJobModal = ({ onClose, onSubmit }) => {
  const [duration, setDuration] = useState('');
  const durationOptions = ["1-3 Days", "1 Week", "2 Weeks", "1 Month"];
  
  return (
    <Modal title="Create New Mission" onClose={onClose}>
      <form onSubmit={onSubmit} className="relative space-y-6">
        
        {/* Decorative Background Blur */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Job Title */}
        <div className="space-y-2">
           <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mission Title</label>
           <GlowInput name="title" icon={Briefcase} placeholder="e.g. Design a Cyberpunk Logo" required />
        </div>

        {/* 2. Budget & Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Bounty (Budget)</label>
              <GlowInput name="budget" type="number" icon={DollarSign} placeholder="5000" required />
           </div>
           
           <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500">
                   <Tags size={18} />
                </div>
                <select 
                  name="category" 
                  className="w-full pl-12 pr-10 py-4 bg-gray-50/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white appearance-none cursor-pointer font-medium transition-all hover:bg-white dark:hover:bg-white/5"
                >
                  {Object.keys(LOCAL_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight size={16} className="rotate-90"/>
                </div>
              </div>
           </div>
        </div>

        {/* 3. Duration Selector */}
        <div className="space-y-2">
           <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Timeline</label>
           <div className="flex flex-wrap gap-2 mb-2">
             {durationOptions.map(opt => (
               <SelectPill key={opt} label={opt} selected={duration === opt} onClick={() => setDuration(opt)} />
             ))}
           </div>
           <GlowInput 
             name="duration" 
             icon={Clock} 
             placeholder="Custom Duration..." 
             value={duration} 
             onChange={(e) => setDuration(e.target.value)} 
             required 
           />
        </div>

        {/* 4. Description */}
        <div className="space-y-2">
           <div className="flex justify-between items-end">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mission Brief</label>
             <div className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
               <Sparkles size={10} /> AI Tips Enabled
             </div>
           </div>
           <div className="relative">
             <div className="absolute top-4 left-4 text-gray-400"><AlignLeft size={18}/></div>
             <textarea 
               name="description" 
               rows="4" 
               className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white resize-none transition-all placeholder:text-gray-400"
               placeholder="Describe the deliverables, requirements, and style..."
               required
             ></textarea>
           </div>
        </div>

        {/* IP Transfer Disclaimer */}
        <div className="text-[10px] text-gray-400 text-center px-4 leading-tight">
          By launching, you agree that Intellectual Property (IP) rights only transfer to you upon full payment completion.
        </div>

        {/* 5. Action Button */}
        <button className="relative w-full group overflow-hidden rounded-2xl bg-indigo-600 p-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]" />
          <div className="relative z-10 flex items-center justify-center gap-2 font-black text-white uppercase tracking-wider text-sm">
             <Briefcase size={18} /> Launch Mission
          </div>
        </button>

      </form>
    </Modal>
  );
};

export default PostJobModal;