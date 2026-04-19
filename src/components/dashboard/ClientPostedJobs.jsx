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
    <div className={`group relative p-6 rounded-[24px] border transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${
        isElite 
        ? 'bg-amber-50/30 dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-[#0B0F19] border-amber-200 dark:border-amber-500/30 hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] shadow-md' 
        : 'bg-white dark:bg-[#0B0F19] border-gray-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-xl'
    }`}>
      
      {/* Elite Badge */}
      {isElite && (
          <div className="absolute -top-3 -left-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black shadow-lg shadow-amber-500/30 z-20 border border-amber-300">
              <Crown size={12} className="fill-white" /> 
              <span className="tracking-wider">ELITE</span>
          </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="pr-4">
              <h3 className={`font-bold text-lg mb-1.5 leading-tight transition-colors ${
                  isElite 
                  ? 'text-amber-900 dark:text-amber-400' 
                  : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }`}>
                  {job?.title || 'Untitled Project'}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 uppercase tracking-wider font-bold">
                      {job?.category || 'General'}
                  </span>
                  <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {job?.created_at ? new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                  </span>
              </div>
          </div>
          <button 
            onClick={() => handleDeleteJob(job?.id)} 
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
            title="Delete Project"
          >
              <Trash2 size={18}/>
          </button>
      </div>

      {/* Description */}
      <div className="mb-6 flex-grow">
         <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'} ${isElite ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {description || <span className="italic opacity-50">No description provided.</span>}
         </p>
         {isLongDescription && (
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className={`text-[11px] font-bold mt-2 uppercase tracking-wide flex items-center gap-1 transition-colors ${
                    isElite ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
                }`}
            >
                {isExpanded ? <>Show Less <ChevronUp size={12}/></> : <>Read More <ChevronDown size={12}/></>}
            </button>
         )}
      </div>

      {/* Stats Footer */}
      <div className={`mt-auto pt-4 border-t flex items-end justify-between ${isElite ? 'border-amber-200 dark:border-amber-500/20' : 'border-gray-100 dark:border-white/10'}`}>
          <div>
              <p className={`text-[10px] uppercase font-bold tracking-widest mb-0.5 ${isElite ? 'text-amber-600/70 dark:text-amber-500/70' : 'text-gray-400'}`}>
                  Budget
              </p>
              <div className={`flex items-center text-xl font-black ${isElite ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                  <span className="text-sm font-bold mr-0.5 opacity-70">₹</span>
                  {job?.budget || 0}
              </div>
          </div>
          
         
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ClientPostedJobs = ({ jobs = [], setModal, handleDeleteJob }) => {
  
  // Extra safety net
  const safeJobs = jobs || [];

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Active Projects</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Manage your job listings and track incoming applications.</p>
        </div>
        <Button 
            onClick={() => setModal('post-job')} 
            icon={PlusCircle} 
            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-all shadow-xl shadow-black/10 dark:shadow-white/10 whitespace-nowrap"
        >
            Post New Project
        </Button>
      </div>
      
      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {safeJobs.map((job, index) => (
          <ProjectCard 
             key={job?.id || index} 
             job={job} 
             handleDeleteJob={handleDeleteJob} 
          />
        ))}

        {/* Empty State */}
        {safeJobs.length === 0 && (
            <div className="col-span-full py-24 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[32px] bg-gray-50 dark:bg-[#0B0F19] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center mb-6 shadow-sm">
                    <Briefcase size={28} className="text-indigo-500 dark:text-indigo-400"/>
                </div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">No Active Projects</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
                    You haven't posted any projects yet. Create a listing to start receiving proposals from top-tier talent.
                </p>
                <Button 
                    onClick={() => setModal('post-job')} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
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