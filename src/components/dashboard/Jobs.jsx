import React from 'react';
import { Search, MapPin, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const Jobs = ({ isClient, services, filteredJobs, searchTerm, setSearchTerm, setModal, setActiveChat, setTab, setSelectedJob }) => {
  
  // Unified Card Component for both Services and Jobs
  const Card = ({ title, subtitle, price, tags, description, footerAction, footerText, imageGradient }) => (
    <div className="group relative w-full h-full bg-white dark:bg-[#0f172a] rounded-[32px] border border-gray-200 dark:border-white/5 p-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)]">
      
      {/* Top Image/Gradient Area */}
      <div className={`h-32 rounded-[24px] ${imageGradient} relative overflow-hidden mb-4`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
           {isClient ? 'Gig' : 'Project'}
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col h-[calc(100%-9rem)]">
        {/* Title & Price */}
        <div className="flex justify-between items-start mb-3">
           <h3 className="font-bold text-lg leading-tight dark:text-white line-clamp-2 w-3/4 group-hover:text-indigo-500 transition-colors">
             {title}
           </h3>
           <div className="text-right">
             <span className="block text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">
               ₹{price}
             </span>
           </div>
        </div>

        {/* Subtitle/Meta */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono">
           <Sparkles size={12} className="text-indigo-400"/>
           {subtitle}
        </div>

        {/* Tags "Stickers" */}
        <div className="flex flex-wrap gap-2 mb-6">
           {tags.slice(0, 3).map((tag, i) => (
             <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
               {tag}
             </span>
           ))}
        </div>

        {/* Action Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
           <span className="text-xs font-medium text-gray-400">Instant Apply</span>
           <button 
             onClick={footerAction}
             className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
           >
             <ArrowUpRight size={20} />
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in min-h-screen">
      
      {/* --- FLOATING SEARCH BAR --- */}
      <div className="sticky top-4 z-30 mx-auto max-w-2xl">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl rounded-full p-2 flex items-center shadow-xl border border-white/20">
                <Search className="ml-4 text-gray-400" size={20}/>
                <input 
                    type="text" 
                    placeholder={isClient ? "Find the perfect talent..." : "Search for your next mission..."}
                    className="w-full bg-transparent px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button className="rounded-full px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition-transform">
                    Search
                </Button>
            </div>
        </div>
      </div>

      {/* --- GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 px-2">
        
        {/* CLIENT VIEW: FREELANCER GIGS */}
        {isClient && services.map((service, index) => (
          <Card 
            key={service.id}
            title={service.title}
            price={service.price}
            subtitle={`By ${service.freelancer_name}`}
            tags={['Design', service.delivery_time, 'Verified']} // Mock tags
            description={service.description}
            imageGradient={`bg-gradient-to-br ${index % 2 === 0 ? 'from-pink-500 to-rose-500' : 'from-indigo-500 to-blue-500'}`}
            footerAction={() => {
                setActiveChat({ id: service.freelancer_id, name: service.freelancer_name, defaultMessage: service.title });
                setTab('messages');
            }}
          />
        ))}

        {/* FREELANCER VIEW: JOBS */}
        {!isClient && filteredJobs.map((job, index) => (
          <Card 
            key={job.id}
            title={job.title}
            price={job.budget}
            subtitle={`Posted by ${job.client_name} • ${job.duration}`}
            tags={job.tags ? job.tags.split(',') : [job.category, job.job_type]}
            description={job.description}
            imageGradient={`bg-gradient-to-br ${index % 2 === 0 ? 'from-emerald-400 to-cyan-500' : 'from-orange-400 to-red-500'}`}
            footerAction={() => {
                setSelectedJob(job);
                setModal('apply-job');
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {((!isClient && filteredJobs.length === 0) || (isClient && services.length === 0)) && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
           <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
               <Search size={32} className="text-gray-400"/>
           </div>
           <p className="text-lg font-medium dark:text-white">Nothing found in this dimension.</p>
        </div>
      )}

    </div>
  );
};

export default Jobs;