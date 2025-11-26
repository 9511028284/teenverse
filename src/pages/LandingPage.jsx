import React, { useState } from 'react';
import { 
  Rocket, Star, Search, PlusCircle, Instagram, Twitter, Linkedin, Send, Moon, Sun, 
  FileText, Lock, AlertTriangle, Menu, X, Zap, ShieldCheck, Globe, Code, PenTool, Video, Music 
} from 'lucide-react';
import Button from '../components/ui/Button';
import { COLORS, CATEGORIES } from '../utils/constants';

const LandingPage = ({ setView, onFeedback, darkMode, toggleTheme, onLegalClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-[#0B1120] min-h-screen transition-colors duration-300 font-sans overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 top-0 border-b border-gray-100 dark:border-white/5 bg-white/70 dark:bg-[#0B1120]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-gray-900 dark:text-white cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Rocket size={20} className="animate-pulse" />
            </div>
            TeenVerse<span className="text-indigo-500">.</span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform">
                {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-indigo-600"/>}
            </button>
            <Button variant="primary" onClick={() => setView('auth')} className="shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5">
              Get Started <Zap size={16} className="fill-white"/>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-600 dark:text-gray-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28}/> : <Menu size={28}/>}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#0B1120] border-b border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4 shadow-2xl animate-fade-in">
            <Button variant="primary" onClick={() => setView('auth')} className="w-full justify-center py-3">Log In / Sign Up</Button>
            <div className="flex justify-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={toggleTheme} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                {darkMode ? <><Sun size={18}/> Light Mode</> : <><Moon size={18}/> Dark Mode</>}
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* --- HERO SECTION --- */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
         {/* Floating Blobs */}
         <div className="absolute top-20 left-[-10%] w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
         <div className="absolute bottom-20 right-[-10%] w-96 h-96 bg-indigo-500/30 rounded-full blur-[120px] -z-10 animate-pulse delay-1000"></div>

         <div className="max-w-5xl mx-auto text-center z-10 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-8 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span> The #1 Platform for Gen Z
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
               Turn your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">Hobby</span><br/> 
               into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Hustle.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
               Forget boring internships. Build your portfolio, find cool clients, and earn real cash on the safest marketplace built just for teens.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Button variant="success" className="h-14 px-8 text-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 scale-100 hover:scale-105 transition-all" icon={Search} onClick={() => setView('auth')}>Find Work</Button>
               <Button variant="outline" className="h-14 px-8 text-lg bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10" icon={PlusCircle} onClick={() => setView('auth')}>Post a Job</Button>
            </div>
         </div>
      </section>

      {/* --- BENTO GRID (Why Us) --- */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-[#0F172A]/50">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why TeenVerse Hits Different 🚀</h2>
              <p className="text-gray-500 dark:text-gray-400">We aren't just a job board. We're a launchpad.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl hover:-translate-y-2 transition-transform duration-300">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                    <Zap size={28}/>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Instant Payouts</h3>
                 <p className="text-gray-500 dark:text-gray-400">No waiting 30 days. Get paid via UPI as soon as the job is approved. Fast & Secure.</p>
              </div>
              {/* Card 2 */}
              <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl hover:-translate-y-2 transition-transform duration-300 md:scale-105 z-10 relative">
                 <div className="absolute -top-4 right-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Most Loved</div>
                 <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                    <ShieldCheck size={28}/>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">100% Safe</h3>
                 <p className="text-gray-500 dark:text-gray-400">Verified clients, parent co-pilot mode, and encrypted chats. We take safety seriously.</p>
              </div>
              {/* Card 3 */}
              <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl hover:-translate-y-2 transition-transform duration-300">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                    <Globe size={28}/>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remote First</h3>
                 <p className="text-gray-500 dark:text-gray-400">Work from your bedroom, a cafe, or Mars (if there's wifi). Freedom is the goal.</p>
              </div>
           </div>
        </div>
      </section>

      {/* --- CATEGORIES SCROLL --- */}
      <section className="py-24 px-6 overflow-hidden">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-10">Trending Skills 🔥</h2>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
               {CATEGORIES.map((cat, i) => (
                 <div key={i} className="group flex items-center gap-4 p-4 pr-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} bg-gray-50 dark:bg-gray-800 group-hover:scale-110 transition-transform`}>
                       {cat.icon}
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400">{cat.count}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- FEEDBACK (Glass Card) --- */}
      <section className="py-24 px-6 relative">
         <div className="max-w-4xl mx-auto bg-gray-900 dark:bg-gradient-to-br dark:from-indigo-900/50 dark:to-purple-900/50 rounded-[40px] p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden border border-white/10">
            {/* Decorative Noise */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Have your say 🎤</h2>
              <p className="text-indigo-200 mb-10 max-w-lg mx-auto">We are building this FOR you. Drop your ideas, rants, or feature requests below.</p>
              
              <form onSubmit={onFeedback} className="max-w-md mx-auto space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <input name="name" placeholder="Name" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all backdrop-blur-md" required />
                    <input name="email" placeholder="Email" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all backdrop-blur-md" required />
                 </div>
                 <textarea name="message" placeholder="Type your message..." className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 transition-all min-h-[100px] resize-none backdrop-blur-md" required></textarea>
                 <button className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                    Send It <Send size={18}/>
                 </button>
              </form>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white dark:bg-[#0B1120] border-t border-gray-100 dark:border-white/5 py-16">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xl">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Rocket size={16}/></div>
               TeenVerse
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
               <button onClick={() => onLegalClick('privacy')} className="hover:text-indigo-500 transition-colors flex items-center gap-2"><Lock size={14}/> Privacy</button>
               <button onClick={() => onLegalClick('terms')} className="hover:text-indigo-500 transition-colors flex items-center gap-2"><FileText size={14}/> Terms</button>
               <button onClick={() => onLegalClick('disclaimer')} className="hover:text-indigo-500 transition-colors flex items-center gap-2"><AlertTriangle size={14}/> Safety</button>
            </div>

            <div className="flex gap-4">
              <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-pink-500 hover:text-white dark:hover:bg-pink-600 cursor-pointer transition-all duration-300"><Instagram size={20}/></div>
              <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-blue-400 hover:text-white dark:hover:bg-blue-500 cursor-pointer transition-all duration-300"><Twitter size={20}/></div>
              <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-blue-700 hover:text-white dark:hover:bg-blue-600 cursor-pointer transition-all duration-300"><Linkedin size={20}/></div>
            </div>
         </div>
         <div className="text-center text-xs text-gray-400 mt-12 opacity-50">
           © 2025 TeenVerse Inc. • Built by Teens, For Teens.
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;