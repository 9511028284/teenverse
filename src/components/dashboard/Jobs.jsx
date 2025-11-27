import React from 'react';
import { Search, PlusCircle, Clock } from 'lucide-react';
import Button from '../ui/Button';

const Jobs = ({ 
  isClient, 
  services, 
  filteredJobs, 
  searchTerm, 
  setSearchTerm, 
  setModal, 
  setActiveChat, 
  setTab, 
  setSelectedJob, 
  parentMode 
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center 
      bg-white/60 dark:bg-white/5 backdrop-blur-xl 
      p-5 rounded-3xl border border-white/20 dark:border-white/10 
      shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
          <input 
            type="text" 
            placeholder={isClient ? "Search gigs..." : "Search jobs..."}
            className="w-full bg-white/70 dark:bg-[#0F172A] 
            pl-10 pr-4 py-3 rounded-2xl tracking-wide
            border border-gray-200 dark:border-gray-600 
            outline-none focus:border-indigo-500 
            dark:text-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Client View → Shows Freelancer Services */}
        {isClient && services.map(service => (
          <div 
            key={service.id}
            className="p-6 rounded-3xl
            bg-white/60 dark:bg-white/5 
            backdrop-blur-xl 
            border border-white/20 dark:border-white/10
            shadow-[0_8px_30px_rgb(0,0,0,0.10)]
            hover:shadow-[0_12px_40px_rgb(99,102,241,0.25)]
            hover:-translate-y-[2px]
            transition-all duration-300 group"
          >
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl dark:text-white 
                group-hover:text-indigo-500 dark:group-hover:text-indigo-400 
                transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {service.freelancer_name}
                </p>
              </div>

              <span className="font-bold text-lg 
              bg-gradient-to-r from-indigo-500 to-purple-600 
              text-white px-4 py-1.5 rounded-xl shadow">
                ₹{service.price}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
              {service.description}
            </p>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 flex gap-1 items-center">
                <Clock size={14}/> {service.delivery_time}
              </span>
              <Button 
                className="py-2 px-4 text-xs rounded-xl"
                onClick={() => {
                  setActiveChat({ 
                    id: service.freelancer_id, 
                    name: service.freelancer_name, 
                    defaultMessage: `Hi, I'm interested in your gig: ${service.title}` 
                  });
                  setTab('messages');
                }}>
                Contact Seller
              </Button>
            </div>

          </div>
        ))}

        {/* Freelancer View → Shows Jobs */}
        {!isClient && filteredJobs.map(job => (
          <div 
            key={job.id}
            className="p-6 rounded-3xl
            bg-white/60 dark:bg-white/5 
            backdrop-blur-xl 
            border border-white/20 dark:border-white/10
            shadow-[0_8px_30px_rgb(0,0,0,0.10)]
            hover:shadow-[0_12px_40px_rgb(99,102,241,0.25)]
            hover:-translate-y-[2px]
            transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-xl dark:text-white 
              group-hover:text-indigo-500 dark:group-hover:text-indigo-400 
              transition-colors">
                {job.title}
              </h3>

              <span className="text-xs font-semibold px-4 py-1.5 rounded-full
              bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                ₹{job.budget}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
              {job.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.tags?.split(',').map((tag, i) => (
                <span key={i} 
                  className="text-xs bg-gray-100 dark:bg-gray-700 
                  text-gray-600 dark:text-gray-300 
                  px-3 py-1 rounded-xl font-medium">
                  {tag.trim()}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">
                Posted by {job.client_name}
              </span>

              {!isClient && (
                <Button 
                  size="sm" 
                  className="rounded-xl"
                  onClick={() => { setSelectedJob(job); setModal('apply-job'); }}>
                  Apply Now
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* No Jobs Found */}
        {!isClient && filteredJobs.length === 0 && (
          <div className="col-span-full text-center py-16 
          text-gray-400 border-2 border-dashed 
          border-gray-300 dark:border-gray-700 rounded-3xl">
            No jobs found matching your search 🚫
          </div>
        )}

      </div>
    </div>
  );
};

export default Jobs;