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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
          <input 
            type="text" 
            placeholder={isClient ? "Search for services..." : "Search jobs..."}
            className="w-full bg-gray-50 dark:bg-[#0F172A] pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-indigo-500 dark:text-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
       
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CLIENT VIEW: Show Services */}
        {isClient && services.map(service => (
          <div key={service.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="font-bold text-lg dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{service.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">by {service.freelancer_name}</p></div>
              <span className="font-black text-lg bg-gray-50 dark:bg-gray-800 dark:text-white px-3 py-1 rounded-lg">₹{service.price}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{service.description}</p>
            <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-1"><Clock size={14}/> {service.delivery_time}</div>
              <Button className="py-2 px-4 text-xs" onClick={() => {
                setActiveChat({ id: service.freelancer_id, name: service.freelancer_name, defaultMessage: `Hi, I'm interested in your gig: ${service.title}` });
                setTab('messages');
              }}>Contact Seller</Button>
            </div>
          </div>
        ))}

        {/* FREELANCER VIEW: Show Jobs */}
        {!isClient && filteredJobs.map(job => (
          <div key={job.id} className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.title}</h3>
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">₹{job.budget}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{job.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {job.tags?.split(',').map((tag, i) => (
                <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">{tag.trim()}</span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400">Posted by {job.client_name}</span>
              {!isClient && (
                <Button size="sm" onClick={() => { setSelectedJob(job); setModal('apply-job'); }}>Apply Now</Button>
              )}
            </div>
          </div>
        ))}
        {!isClient && filteredJobs.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">No jobs found matching your search.</div>}
      </div>
    </div>
  );
};

export default Jobs;