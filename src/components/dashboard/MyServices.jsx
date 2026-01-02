import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const MyServices = ({ services, setModal, handleDeleteService }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-wide">
          My Gigs
        </h2>
        <Button 
          onClick={() => setModal('create-service')} 
          icon={PlusCircle}
          className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 !text-white !shadow-lg !shadow-indigo-500/30 hover:scale-[1.03] transition-all duration-300"
        >
          Create Gig
        </Button>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
        {services.map(service => (
          <div 
            key={service.id}
            className="relative group rounded-3xl p-6 
            bg-white/60 dark:bg-white/5 
            backdrop-blur-xl 
            border border-white/20 dark:border-white/10 
            shadow-[0_8px_30px_rgb(0,0,0,0.12)]
            hover:shadow-[0_12px_40px_rgb(99,102,241,0.25)]
            hover:-translate-y-1 transition-all duration-300"
          >
            {/* Delete Button */}
            <button 
              onClick={() => handleDeleteService(service.id)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <Trash2 size={18}/>
            </button>

            {/* Title */}
            <h3 className="font-bold text-xl dark:text-white mb-2 tracking-tight">
              {service.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
              {service.description}
            </p>

            {/* Price + Delivery */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                ₹{service.price}
              </span>
              <span className="text-xs text-gray-400 font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-[#1e293b] dark:text-gray-300">
                {service.delivery_time} Delivery
              </span>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {services.length === 0 && (
          <div className="col-span-full text-center py-16 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 text-lg tracking-wide">
            You haven't created any gigs yet ✨
          </div>
        )}
      </div>
    </div>
  );
};

export default MyServices;