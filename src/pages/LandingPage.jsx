import React, { useState } from 'react';
import { Rocket, Star, Search, PlusCircle, Instagram, Twitter, Linkedin, Send, Moon, Sun, FileText, Lock, AlertTriangle, Menu, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { COLORS, CATEGORIES } from '../utils/constants';

const LandingPage = ({ setView, onFeedback, darkMode, toggleTheme, onLegalClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-300 font-sans">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2 font-black text-2xl text-gray-900 dark:text-white">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white shadow-lg`}>
              <Rocket size={20} />
            </div>
            TeenVerse
          </div>

          {/* Desktop Actions (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Button variant="primary" onClick={() => setView('auth')}>Get Started</Button>
          </div>

          {/* Mobile Actions (Hamburger + Theme) */}
          <div className="flex md:hidden items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-gray-900 dark:text-white p-1 focus:outline-none"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-2xl p-6 flex flex-col animate-in slide-in-from-top-5 fade-in duration-200">
            <div className="flex flex-col gap-4">
              <Button variant="primary" className="w-full justify-center py-3" onClick={() => { setView('auth'); setIsMenuOpen(false); }}>
                Get Started
              </Button>
              
            </div>
          </div>
        )}
      </nav>
      
      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase mb-8 border border-indigo-100 dark:border-indigo-800">
            <Star size={12} className="fill-indigo-600 dark:fill-indigo-400"/> The #1 Platform for Teen Freelancers
         </div>
         
         {/* Adjusted text size for mobile (text-4xl) vs desktop (text-7xl) */}
         <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
           Turn your <span className="text-indigo-600 dark:text-indigo-400">Passion</span><br className="hidden sm:block"/> into <span className="text-emerald-500">Paychecks.</span>
         </h1>
         
         <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
           TeenVerse is the safest ecosystem for teens to build a portfolio, find vetted clients, and earn money securely.
         </p>
         
         <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Button variant="success" className="h-12 sm:h-14 px-8 text-lg w-full sm:w-auto justify-center" icon={Search} onClick={() => setView('auth')}>Find Work Now</Button>
            <Button variant="secondary" className="h-12 sm:h-14 px-8 text-lg w-full sm:w-auto justify-center" icon={PlusCircle} onClick={() => setView('auth')}>Post a Job</Button>
         </div>
      </section>
  
      {/* ================= ABOUT US ================= */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 sm:py-20 px-6">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">About Us</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">We are building the future of work for the next generation.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-20">
              <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
                <h3 className="font-bold text-xl text-indigo-600 dark:text-indigo-400 mb-2">For Teens</h3>
                <p className="text-gray-600 dark:text-gray-300">Gain financial independence, build real-world skills, and start your career early.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
                <h3 className="font-bold text-xl text-purple-600 dark:text-purple-400 mb-2">For Parents</h3>
                <p className="text-gray-600 dark:text-gray-300">A safe, monitored environment where your child can learn the value of work.</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all">
                <h3 className="font-bold text-xl text-emerald-600 dark:text-emerald-400 mb-2">For Clients</h3>
                <p className="text-gray-600 dark:text-gray-300">Tap into the digital-native generation for fresh ideas and modern skills.</p>
              </div>
           </div>
        </div>
      </section>
  
      {/* ================= FEEDBACK ================= */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white dark:bg-gray-950">
         <div className="max-w-3xl mx-auto bg-indigo-900 rounded-3xl p-6 sm:p-10 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">We Value Your Feedback</h2>
              <p className="text-indigo-200 mb-8">Help us make TeenVerse better for everyone.</p>
              <form onSubmit={onFeedback} className="max-w-md mx-auto space-y-4 text-left">
                 <input name="name" placeholder="Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
                 <input name="email" placeholder="Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
                 <textarea name="message" placeholder="Message..." className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none min-h-[100px]" required></textarea>
                 <button className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2 text-gray-900 transition-colors">
                    Send Feedback <Send size={18}/>
                 </button>
              </form>
            </div>
         </div>
      </section>
  
      {/* ================= FOOTER ================= */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white"><Rocket size={12}/></div>
                TeenVerse
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium text-center">
               <button onClick={() => onLegalClick('privacy')} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1"><Lock size={14}/> Privacy Policy</button>
               <button onClick={() => onLegalClick('terms')} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1"><FileText size={14}/> Terms & Conditions</button>
               <button onClick={() => onLegalClick('disclaimer')} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1"><AlertTriangle size={14}/> Disclaimer</button>
            </div>
  
            <div className="flex gap-4">
                <Instagram size={18} className="text-gray-400 hover:text-pink-600 cursor-pointer transition-colors"/>
                <Twitter size={18} className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors"/>
                <Linkedin size={18} className="text-gray-400 hover:text-blue-700 cursor-pointer transition-colors"/>
            </div>
         </div>
         <div className="text-center text-xs text-gray-400 mt-8 px-4">© 2025 TeenVerse Inc. • Compliant with Child Labor Regulations</div>
      </footer>
    </div>
  );
};

export default LandingPage;