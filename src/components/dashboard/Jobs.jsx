import React, { useState } from 'react';
import { Search, MapPin, ArrowUpRight, Sparkles, Filter, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';

// --- LUXURY COMPONENTS ---
const GradientText = ({ children, from = "from-indigo-400", to = "to-cyan-400" }) => (
  <span className={`bg-clip-text text-transparent bg-gradient-to-r ${from} ${to} font-bold`}>
    {children}
  </span>
);

const Jobs = ({ isClient, services, filteredJobs, searchTerm, setSearchTerm, setModal, setActiveChat, setSelectedJob }) => {
  
  const JobCard = ({ data, type }) => {
    // State to handle Read More / Read Less toggle
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine Gradient based on type or ID
    const gradients = [
        "from-[#FF0080] to-[#7928CA]", // Pink/Purple
        "from-[#4158D0] to-[#C850C0]", // Blue/Pink
        "from-[#0093E9] to-[#80D0C7]", // Cyan/Teal
    ];
    const gradient = gradients[data.id % gradients.length];

    // Helper to check length
    const description = data.description || "No encrypted description provided for this mission.";
    const isLongText = description.length > 100;

    return (
      <div className="group relative bg-[#09090b] rounded-[30px] border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col h-full shadow-2xl">
        
        {/* Glow Effect on Hover */}
        <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-[30px] opacity-0 group-hover:opacity-20 blur-md transition duration-500`} />

        {/* Image Area */}
        <div className={`h-36 w-full relative overflow-hidden bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#09090b] to-transparent"></div>
            
            <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{type}</span>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 flex flex-col flex-grow relative z-10">
           <div className="mb-4">
              <h3 className="text-xl font-bold text-white leading-tight mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                  {data.title}
              </h3>
              <p className="text-xs font-mono text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  {isClient ? `By ${data.freelancer_name}` : `Posted by ${data.client_name}`}
              </p>
           </div>

           {/* --- UPDATED DESCRIPTION LOGIC --- */}
           <div className="mb-6 relative">
               <p className={`text-sm text-gray-400 leading-relaxed font-light transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                   {description}
               </p>
               
               {isLongText && (
                   <button 
                       onClick={(e) => {
                           e.stopPropagation();
                           setIsExpanded(!isExpanded);
                       }}
                       className="mt-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-white flex items-center gap-1 transition-colors"
                   >
                       {isExpanded ? (
                           <>Collapse Data <ChevronUp size={10} /></>
                       ) : (
                           <>Decrypt Full <ChevronDown size={10} /></>
                       )}
                   </button>
               )}
           </div>

           {/* Tags */}
           <div className="flex flex-wrap gap-2 mb-6 mt-auto">
               {(data.tags ? data.tags.split(',') : [data.category || 'Gig']).slice(0,3).map((t,i) => (
                   <span key={i} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-300 font-mono uppercase">
                       {t}
                   </span>
               ))}
           </div>

           {/* Footer */}
           <div className="pt-4 border-t border-white/5 flex items-center justify-between">
               <div>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Bounty</p>
                   <p className="text-lg font-black text-white">₹{data.price || data.budget}</p>
               </div>
               
               <button 
                  onClick={() => isClient ? 
                    (setActiveChat({ id: data.freelancer_id, name: data.freelancer_name }), setTab('messages')) : 
                    (setSelectedJob(data), setModal('apply-job'))
                  }
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 hover:rotate-45 transition-all duration-300"
               >
                   <ArrowUpRight size={20} strokeWidth={2.5}/>
               </button>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-8 animate-fade-in pb-20">
      
      {/* --- FLOATING COMMAND BAR --- */}
      <div className="sticky top-6 z-40 mx-auto max-w-2xl px-4">
        <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-30 animate-pulse-slow"></div>
            <div className="relative bg-[#0F172A]/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center shadow-2xl">
                <Search className="ml-4 text-gray-400" size={20}/>
                <input 
                    type="text" 
                    placeholder={isClient ? "Scout for elite talent..." : "Decrypt new missions..."}
                    className="w-full bg-transparent px-4 py-3 outline-none text-white placeholder-gray-500 font-medium font-mono text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="pr-1 flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        <Filter size={18}/>
                    </button>
                    <Button className="rounded-full px-6 bg-white text-black hover:bg-gray-200 font-bold tracking-tight">
                        GO
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* --- TITLE AREA --- */}
      <div className="flex items-end justify-between px-4 mt-8">
          <div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">
                 {isClient ? 'Talent Pool' : 'Mission Board'}
              </h2>
              <p className="text-gray-500 font-mono text-xs mt-1">
                 {filteredJobs.length + services.length} ACTIVE SIGNALS DETECTED
              </p>
          </div>
          <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Live Feed</span>
          </div>
      </div>

      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-4">
        {isClient 
            ? services.map(s => <JobCard key={s.id} data={s} type="Gig" />)
            : filteredJobs.map(j => <JobCard key={j.id} data={j} type="Mission" />)
        }
      </div>

      {/* --- EMPTY STATE --- */}
      {((!isClient && filteredJobs.length === 0) || (isClient && services.length === 0)) && (
        <div className="flex flex-col items-center justify-center py-32 border border-white/5 rounded-[40px] bg-white/5 m-4 border-dashed">
           <div className="w-24 h-24 bg-black rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
               <Briefcase size={32} className="text-gray-600"/>
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Void Detected</h3>
           <p className="text-gray-500 font-mono text-sm">No signals matching your query.</p>
        </div>
      )}

    </div>
  );
};

export default Jobs;