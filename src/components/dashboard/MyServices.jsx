import React from 'react';
import { PlusCircle, Trash2, Clock } from 'lucide-react';
import Button from '../ui/Button';

const MyServices = ({ services, setModal, handleDeleteService }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">My Gigs</h2>
        <Button onClick={() => setModal('create-service')} icon={PlusCircle}>Create Gig</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group">
            <button onClick={() => handleDeleteService(service.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
            <h3 className="font-bold text-lg dark:text-white mb-2">{service.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{service.description}</p>
            <div className="flex justify-between items-center font-bold">
              <span className="text-indigo-600 dark:text-indigo-400">₹{service.price}</span>
              <span className="text-xs text-gray-400 font-normal">{service.delivery_time} Delivery</span>
            </div>
          </div>
        ))}
        {services.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">You haven't created any gigs yet.</div>}
      </div>
    </div>
  );
};

export default MyServices;