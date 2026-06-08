import React, { useState } from 'react';
import { 
  PlusCircle, Trash2, Briefcase, ChevronDown, ChevronUp, 
  Users, Eye, Crown, Clock, DollarSign 
} from 'lucide-react';
import Button from '../ui/Button';

// --- HELPER ---
const checkIsElite = (val) => {
    return val === true || String(val).toLowerCase() === 'true' || val === 1 || val === '1';
};

// --- PROJECT CARD COMPONENT ---
const ProjectCard = ({ job, handleDeleteJob }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const description = job?.description || '';
  const isLongDescription = description.length > 100;
  const isElite = checkIsElite(job?.is_elite);

  return (
    <div className={`group relative p-6 rounded-[28px] border backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 flex flex-col h-full ${
        isElite 
        ? 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_6px_20px_rgba(245,158,11,0.06)] dark:from-amber-950/20 dark:to-slate-900/40 dark:border-amber-500/30 dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.08),_0_16px_36px_rgba(0,0,0,0.35)] hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)]' 
        : 'bg-white/95 border-slate-200/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(0,0,0,0.01)] dark:bg-slate-900/40 dark:border-white/[0.05] dark:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.06),_0_16px_36px_rgba(0,0,0,0.25)] hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),_0_16px_32px_rgba(99,102,241,0.06)] dark:hover:shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.12),_0_16px_32px_rgba(99,102,241,0.12)]'
    }`}>
      
      {/* Claymorphic Elite Badge */}
      {isElite && (
          <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-xl flex items-center gap-1.5 text-[10px] font-black shadow-[inset_0_1.5px_2.5px_rgba(255,255,255,0.4),_0_6px_14px_rgba(245,158,11,0.3)] z-20 border border-amber-300 dark:border-amber-500/30">
              <Crown size={11} className="fill-white drop-shadow-sm" /> 
              <span className="tracking-widest uppercase">Elite</span>
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="pr-4">
              <h3 className={`font-black text-base mb-1.5 tracking-tight leading-tight transition-colors ${
                  isElite 
                  ? 'text-amber-950 dark:text-amber-400' 
                  : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}>
                  {job?.title || 'Untitled Project'}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                  <span className={`px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] dark:shadow-none ${
                    isElite 
                    ? 'bg-amber-50 border-amber-200/60 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' 
                    : 'bg-slate-50 border-slate-200/80 text-slate-500 dark:bg-slate-800 dark:border-white/[0.04] dark:text-slate-400'
                  }`}>
                      {job?.category || 'General'}
                  </span>
                  <span className="flex items-center gap-1">
                      <Clock size={11} strokeWidth={2.5} />
                      {job?.created_at ? new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                  </span>
              </div>
          </div>
          <button 
            onClick={() => handleDeleteJob(job?.id)} 
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100 dark:hover:border-red-500/10"
            title="Delete Project"
          >
              <Trash2 size={16} strokeWidth={2.5}/>
          </button>
      </div>

      {/* Description */}
      <div className="mb-6 flex-grow">
         <p className={`text-xs font-medium leading-relaxed ${isExpanded ? '' : 'line-clamp-2'} ${isElite ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
            {description || <span className="italic opacity-50">No description provided.</span>}
         </p>
         {isLongDescription && (
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className={`text-[10px] font-black mt-2.5 uppercase tracking-wider flex items-center gap-0.5 transition-colors ${
                    isElite ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
                }`}
            >
                {isExpanded ? <>Show Less <ChevronUp size={12} strokeWidth={2.5}/></> : <>Read More <ChevronDown size={12} strokeWidth={2.5}/></>}
            </button>
         )}
      </div>

      {/* Stats Footer */}
      <div className={`mt-auto pt-4 border-t flex items-end justify-between ${isElite ? 'border-amber-200/80 dark:border-amber-500/20' : 'border-slate-100 dark:border-white/[0.04]'}`}>
          <div>
              <p className={`text-[10px] uppercase font-black tracking-widest mb-1 ${isElite ? 'text-amber-600/70 dark:text-amber-500/60' : 'text-slate-400 dark:text-slate-500'}`}>
                  Budget
              </p>
              <div className={`flex items-baseline text-2xl font-black font-mono leading-none ${isElite ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  <span className="text-sm font-bold mr-0.5 opacity-60 font-sans">₹</span>
                  {job?.budget || 0}
              </div>
          </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ClientPostedJobs = ({ jobs = [], setModal, handleDeleteJob }) => {
  const safeJobs = jobs || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto px-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active Projects</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your job listings and track incoming applications.</p>
        </div>
        <Button 
            onClick={() => setModal('post-job')} 
            icon={PlusCircle} 
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_20px_rgba(79,70,229,0.2)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),_0_8px_20px_rgba(255,255,255,0.08)] whitespace-nowrap"
        >
            Post New Project
        </Button>
      </div>
      
      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {safeJobs.map((job, index) => (
          <ProjectCard 
             key={job?.id || index} 
             job={job} 
             handleDeleteJob={handleDeleteJob} 
          />
        ))}

        {/* Empty State Card Module */}
        {safeJobs.length === 0 && (
            <div className="col-span-full py-20 border border-dashed border-slate-200/80 rounded-[32px] bg-white/40 dark:bg-slate-900/10 dark:border-white/[0.05] flex flex-col items-center justify-center text-center px-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200/60 dark:bg-slate-900 dark:border-white/[0.05] rounded-2xl flex items-center justify-center mb-5 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.8),_0_4px_12px_rgba(0,0,0,0.01)] dark:shadow-none">
                    <Briefcase size={24} className="text-indigo-500 dark:text-indigo-400" strokeWidth={2.5}/>
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight mb-1">No Active Projects</h3>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-xs mb-6 leading-relaxed">
                    You haven't posted any projects yet. Create a listing to receive proposals from ecosystem creators.
                </p>
                <Button 
                    onClick={() => setModal('post-job')} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_8px_20px_rgba(79,70,229,0.2)]"
                >
                    Post Your First Project
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientPostedJobs;