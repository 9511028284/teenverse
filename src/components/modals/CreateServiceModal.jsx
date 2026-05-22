import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { LOCAL_CATEGORIES } from '../../utils/constants';

const CreateServiceModal = ({ onClose, onSubmit }) => {
  return (
    <Modal title="Setup New Gig" onClose={onClose}>
        <form onSubmit={onSubmit} className="space-y-5">
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Gig Title</label>
            <input name="title" type="text" placeholder="e.g. I will design your logo" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Price (₹)</label><input name="price" type="number" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Delivery</label><input name="delivery_time" type="text" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Category</label>
            <div className="relative">
                <select name="category" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none appearance-none">
                {Object.keys(LOCAL_CATEGORIES).map(cat => <option key={cat} value={cat}>{LOCAL_CATEGORIES[cat]}</option>)}
                </select>
            </div>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Description</label>
            <textarea name="description" rows="4" className="w-full p-3.5 bg-gray-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" required></textarea>
        </div>
        <Button className="w-full py-3.5 shadow-lg shadow-indigo-500/30">Create Gig</Button>
        </form>
    </Modal>
  );
};

export default CreateServiceModal;