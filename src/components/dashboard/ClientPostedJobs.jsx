import React, { useState } from 'react';
import { PlusCircle, Trash2, Calendar, Briefcase, ChevronDown, ChevronUp, Users, Eye } from 'lucide-react';
import Button from '../ui/Button';

// Internal component
const JobBlueprint = ({ job, handleDeleteJob }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group relative bg-[#0F172A] p-1 rounded-[24px] transition-all hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-purple-500/20">
      
      {/* Border Gradient Line */}
      <div className="absolute inset-0 rounded-[24px] border border-white/10 group-hover:border-indigo-500/50 transition-colors pointer-events-none"></div>

      <div className="bg-[#020617] rounded-[22px] p-6 h-full flex flex-col relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
              <div>
                  <h3 className="font-bold text-lg text-white mb-1 group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 uppercase tracking-wider">{job.category}</span>
                      <span>•</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
              </div>
              <button 
                onClick={() => handleDeleteJob(job.id)} 
                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Decommission Job"
              >
                  <Trash2 size={16}/>
              </button>
          </div>

          {/* Description */}
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
             <p className={`text-sm text-gray-400 leading-relaxed font-light ${isExpanded ? '' : 'line-clamp-2'}`}>
                {job.description}
             </p>
             {job.description.length > 80 && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="text-[10px] font-bold text-indigo-400 mt-2 uppercase tracking-wide flex items-center gap-1 hover:text-indigo-300"
                >
                    {isExpanded ? <>Collapse <ChevronUp size={10}/></> : <>Expand Data <ChevronDown size={10}/></>}
                </button>
             )}
          </div>

          {/* Stats Footer */}
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
             <div>
                 <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Budget</p>
                 <span className="text-lg font-black text-white">₹{job.budget}</span>
             </div>
             
             <div className="flex gap-2">
                 <div className="flex flex-col items-center px-3 py-1 rounded-lg bg-gray-800/50 border border-gray-700/50">
                     <Eye size={12} className="text-gray-400 mb-0.5"/>
                     <span className="text-[10px] font-bold text-white">24</span>
                 </div>
                 <div className="flex flex-col items-center px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                     <Users size={12} className="text-indigo-400 mb-0.5"/>
                     <span className="text-[10px] font-bold text-white">5</span>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

const ClientPostedJobs = ({ jobs, setModal, handleDeleteJob }) => {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">MY OPERATIONS</h2>
          <p className="text-sm text-gray-400 font-mono mt-1">Manage active recruitment protocols.</p>
        </div>
        <Button onClick={() => setModal('post-job')} icon={PlusCircle} className="bg-white text-black hover:bg-gray-200">
            Initialise New Job
        </Button>
      </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {jobs.map(job => (
          <JobBlueprint key={job.id} job={job} handleDeleteJob={handleDeleteJob} />
        ))}

        {jobs.length === 0 && (
            <div className="col-span-full py-20 border border-dashed border-white/10 rounded-[32px] bg-white/5 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-black rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <Briefcase size={24} className="text-gray-600"/>
                </div>
                <h3 className="font-bold text-xl text-white mb-2">No Active Operations</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-8">Your command center is empty. Post a job to start receiving proposals from elite talent.</p>
                <Button onClick={() => setModal('post-job')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Create First Mission
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientPostedJobs;