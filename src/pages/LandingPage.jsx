import React from 'react';
import { Rocket, Star, Search, PlusCircle, Instagram, Twitter, Linkedin, Send, Moon, Sun } from 'lucide-react';
import Button from '../components/ui/Button';
import { COLORS, CATEGORIES } from '../utils/constants';

const LandingPage = ({ setView, onFeedback, darkMode, toggleTheme }) => (
  <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors duration-300">
    <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-2xl text-gray-900 dark:text-white">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS.primary} flex items-center justify-center text-white shadow-lg`}><Rocket size={20} /></div>
          TeenVerse
        </div>
        <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:scale-110 transition-transform">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Button variant="primary" onClick={() => setView('auth')}>Get Started</Button>
        </div>
      </div>
    </nav>
    <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase mb-8 border border-indigo-100 dark:border-indigo-800"><Star size={12} className="fill-indigo-600 dark:fill-indigo-400"/> The #1 Platform for Teen Freelancers</div>
       <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Turn your <span className="text-indigo-600 dark:text-indigo-400">Passion</span><br/> into <span className="text-emerald-500">Paychecks.</span></h1>
       <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">TeenVerse is the safest ecosystem for teens to build a portfolio, find vetted clients, and earn money securely.</p>
       <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="success" className="h-14 px-8 text-lg" icon={Search} onClick={() => setView('auth')}>Find Work Now</Button>
          <Button variant="secondary" className="h-14 px-8 text-lg" icon={PlusCircle} onClick={() => setView('auth')}>Post a Job</Button>
       </div>
    </section>
    <section className="bg-gray-50 dark:bg-gray-900 py-20 px-6">
      <div className="max-w-7xl mx-auto">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">About Us</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">We are building the future of work for the next generation.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-indigo-600 dark:text-indigo-400 mb-2">For Teens</h3><p className="text-gray-600 dark:text-gray-300">Gain financial independence, build real-world skills, and start your career early.</p></div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-purple-600 dark:text-purple-400 mb-2">For Parents</h3><p className="text-gray-600 dark:text-gray-300">A safe, monitored environment where your child can learn the value of work.</p></div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all"><h3 className="font-bold text-xl text-emerald-600 dark:text-emerald-400 mb-2">For Clients</h3><p className="text-gray-600 dark:text-gray-300">Tap into the digital-native generation for fresh ideas and modern skills.</p></div>
         </div>
         <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Explore Opportunities</h2>
         <div className="grid md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer group">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color} bg-gray-50 dark:bg-gray-800 group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                 <h3 className="font-bold text-gray-900 dark:text-white mb-1">{cat.name}</h3>
                 <p className="text-sm text-gray-400">{cat.count}</p>
              </div>
            ))}
         </div>
      </div>
    </section>
    <section className="py-20 px-6 bg-white dark:bg-gray-950">
       <div className="max-w-3xl mx-auto bg-indigo-900 rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">We Value Your Feedback</h2>
            <p className="text-indigo-200 mb-8">Help us make TeenVerse better for everyone.</p>
            <form onSubmit={onFeedback} className="max-w-md mx-auto space-y-4 text-left">
               <input name="name" placeholder="Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
               <input name="email" placeholder="Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none" required />
               <textarea name="message" placeholder="Message..." className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-300 focus:outline-none min-h-[100px]" required></textarea>
               <button className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 flex items-center justify-center gap-2 text-gray-900">Send Feedback <Send size={18}/></button>
            </form>
          </div>
       </div>
    </section>
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-8">
       <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white"><Rocket size={12}/></div>TeenVerse</div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium"><button className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy</button><button className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms</button><button className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</button></div>
          <div className="flex gap-4"><Instagram size={18} className="text-gray-400 hover:text-pink-600 cursor-pointer"/><Twitter size={18} className="text-gray-400 hover:text-blue-400 cursor-pointer"/><Linkedin size={18} className="text-gray-400 hover:text-blue-700 cursor-pointer"/></div>
       </div>
       <div className="text-center text-xs text-gray-400 mt-8">© 2025 TeenVerse Inc.</div>
    </footer>
  </div>
);

export default LandingPage;