import React from 'react';
import { PlusCircle, Trash2, Calendar, Briefcase } from 'lucide-react';
import Button from '../ui/Button';

const ClientPostedJobs = ({ jobs, setModal, handleDeleteJob }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">My Posted Jobs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your active job listings.</p>
        </div>
        <Button onClick={() => setModal('post-job')} icon={PlusCircle}>Post New Job</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map(job => (
          <div key={job.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group hover:shadow-md transition-all">
            <button 
                onClick={() => handleDeleteJob(job.id)} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Job"
            >
                <Trash2 size={18}/>
            </button>
            
            <div className="mb-4">
                <h3 className="font-bold text-lg dark:text-white mb-1">{job.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={12}/> Posted {new Date(job.created_at).toLocaleDateString()}
                </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
               <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-1 rounded-md font-bold">
                 {job.category}
               </span>
               <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-md">
                 {job.job_type}
               </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                {job.description}
            </p>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
               <div>
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Budget</p>
                   <span className="text-lg font-bold text-gray-900 dark:text-white">₹{job.budget}</span>
               </div>
               <div className="text-right">
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</p>
                   <span className="text-sm font-medium dark:text-gray-300">{job.duration}</span>
               </div>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-gray-400 bg-gray-50/50 dark:bg-[#1E293B]/50">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Briefcase size={32} className="opacity-40"/>
                </div>
                <h3 className="font-bold text-lg dark:text-gray-300 mb-2">No Active Jobs</h3>
                <p className="text-sm mb-6 max-w-xs text-center">You haven't posted any jobs yet. Create one to start receiving proposals!</p>
                <Button onClick={() => setModal('post-job')} variant="outline">Post Your First Job</Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientPostedJobs;