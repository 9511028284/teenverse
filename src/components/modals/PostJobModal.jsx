import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ChevronRight } from 'lucide-react';
import { LOCAL_CATEGORIES } from '../../utils/constants'; // Move categories to constants

const PostJobModal = ({ onClose, onSubmit }) => {
  return (
    <Modal title="Create New Listing" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Job Title</label>
           <input name="title" type="text" placeholder="e.g. Senior React Developer" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Budget (₹)</label>
              <input name="budget" type="number" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
           </div>
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Duration</label>
              <input name="duration" type="text" placeholder="e.g. 2 Weeks" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
           </div>
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Category</label>
           <div className="relative">
              <select name="category" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none appearance-none focus:ring-2 focus:ring-indigo-500 transition-all">
                {Object.keys(LOCAL_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>
                ))}
             </select>
             <div className="absolute right-4 top-4 pointer-events-none text-gray-500"><ChevronRight size={14} className="rotate-90"/></div>
           </div>
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Description</label>
           <textarea name="description" rows="4" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required></textarea>
        </div>
        <Button className="w-full py-3.5 text-base shadow-lg shadow-indigo-500/30">Publish Job</Button>
      </form>
    </Modal>
  );
};

export default PostJobModal;