import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Briefcase } from 'lucide-react';

const ApplyJobModal = ({ onClose, onSubmit, job }) => {
  if (!job) return null;

  return (
    <Modal title="Submit Proposal" onClose={onClose}>
       <form onSubmit={onSubmit} className="space-y-5">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                <Briefcase size={20}/>
             </div>
             <div>
                <h4 className="font-bold text-sm dark:text-white line-clamp-1">{job.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Budget: ₹{job.budget}</p>
             </div>
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Your Bid Amount (₹)</label>
             <input name="bid_amount" type="number" defaultValue={job.budget} className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Cover Letter</label>
             <textarea name="cover_letter" rows="5" placeholder="Why are you the best fit for this role?" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required></textarea>
          </div>
          <Button className="w-full py-3.5 text-base shadow-lg shadow-indigo-500/30">Send Proposal</Button>
       </form>
    </Modal>
  );
};

export default ApplyJobModal;