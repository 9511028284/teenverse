import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Star, Zap, Heart, TrendingUp, ArrowRight, CheckCircle, 
  Loader2, DollarSign, Cpu, User, Briefcase, ShieldCheck, Lock, 
  Menu, X, Sun, Moon, Instagram, Twitter, Linkedin, Send, Code, Mail, MapPin, Clock, AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabase'; // Ensure this path matches your project structure

/* --- 1. CSS INJECTION: THE PRODUCTION ENGINE --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');

  :root {
    --primary: #6366f1;
    --acid: #ccff00;
    --client-mode: #d946ef; /* Pink for clients */
  }

  body { 
    font-family: 'Space Grotesk', sans-serif; 
    cursor: none;
    overflow-x: hidden;
  }

  /* REFINED CURSOR */
  .custom-cursor {
    position: fixed;
    top: 0; left: 0;
    width: 20px; height: 20px;
    background: var(--acid);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: exclusion;
    transform: translate(-50%, -50%);
    transition: transform 0.1s cubic-bezier(0.17, 0.67, 0.83, 0.67);
  }
  .custom-cursor.hovered { 
    transform: translate(-50%, -50%) scale(4); 
    background: white; 
    mix-blend-mode: difference;
  }

  /* PRODUCTION NOISE - Subtle texture */
  .bg-noise {
    position: fixed; inset: 0; pointer-events: none; z-index: 40;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E");
  }

  /* GLASSMORPHISM (For Safety Section) */
  .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* MAGNETIC BUTTON EFFECT */
  .magnetic-btn { transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1); }
  .magnetic-btn:active { transform: scale(0.95); }

  /* REFINED GLITCH */
  .glitch-wrapper { position: relative; display: inline-block; }
  .glitch-text::before, .glitch-text::after {
    content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;
  }
  .glitch-text::before {
    color: #ff00ff; z-index: -1; animation: glitch-anim-1 3s infinite linear alternate-reverse;
  }
  .glitch-text::after {
    color: #00ffff; z-index: -2; animation: glitch-anim-2 2s infinite linear alternate-reverse;
  }
  @keyframes glitch-anim-1 { 
    0% { clip-path: inset(20% 0 80% 0); transform: translate(-1px, 1px); }
    100% { clip-path: inset(80% 0 20% 0); transform: translate(1px, -1px); } 
  }
  @keyframes glitch-anim-2 { 
    0% { clip-path: inset(10% 0 90% 0); transform: translate(1px, 1px); } 
    100% { clip-path: inset(90% 0 10% 0); transform: translate(-1px, -1px); } 
  }

  /* ANIMATIONS */
  .animate-marquee { animation: marquee 30s linear infinite; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  
  .animate-float-slow { animation: float 8s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

  .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
  @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
  
  /* RAVE MODE UTILS */
  .rave * { animation: raveFlash 0.12s infinite alternate; }
  @keyframes raveFlash { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg) brightness(1.5); } }
  
  .ripple {
    position: fixed; width: 30px; height: 30px; background: var(--acid);
    border-radius: 50%; transform: scale(0); pointer-events: none;
    animation: rippleAnim 0.6s ease-out;
  }
  @keyframes rippleAnim { 100% { transform: scale(25); opacity: 0; } }
  
  .bg-grid-pattern {
    background-size: 40px 40px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  }
`;

const LandingPage = ({ setView, darkMode, toggleTheme, onLegalClick }) => {
  // --- STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('creators');
  
  // Feedback State with Name/Email support
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  
  // Custom Cursor State
  const cursorRef = useRef(null);
  
  /* === CRAZY MODE PATCH === */
  const [raveMode, setRaveMode] = useState(false);
  const [colorPulse, setColorPulse] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    
    const moveCursor = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    const addHoverClass = () => cursorRef.current?.classList.add('hovered');
    const removeHoverClass = () => cursorRef.current?.classList.remove('hovered');

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', moveCursor);

    // Add hover effects to all buttons and links
    document.querySelectorAll('button, a, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', addHoverClass);
      el.addEventListener('mouseleave', removeHoverClass);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  // --- HANDLERS ---
  const handleNav = (target) => {
    setView(target);
    setIsMobileMenuOpen(false);
    window.scrollTo(0,0);
  };

  // --- SUPABASE DATABASE HANDLER ---
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackStatus('loading');
  
    try {
      // Insert into public.feedback table
      const { error } = await supabase
        .from('feedback')
        .insert([
          { 
            name: feedbackForm.name, 
            email: feedbackForm.email, 
            message: feedbackForm.message 
          }
        ]);
  
      if (error) throw error;
  
      // Success state
      setFeedbackStatus('success');
      setFeedbackForm({ name: '', email: '', message: '' }); // Reset form
      
      // Reset status after delay
      setTimeout(() => setFeedbackStatus('idle'), 3000);
  
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to send message. Please try again.'); 
      setFeedbackStatus('idle');
    }
  };

  // Rave mode keyboard toggle
  useEffect(() => {
    const listener = (e) => {
      if (e.key.toLowerCase() === "r") setRaveMode(prev => !prev);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Ripple effect
  const createRipple = (e) => {
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  useEffect(() => {
      window.addEventListener("click", createRipple);
      return () => window.removeEventListener("click", createRipple);
  }, []);

  return (
    <div className={`relative min-h-screen transition-colors duration-300 overflow-x-hidden selection:bg-[#ccff00] selection:text-black ${darkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <style>{styles}</style>
      
      {/* --- CUSTOM CURSOR --- */}
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* CRAZY MODE STATE CONTROLLER */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-500 ${raveMode ? "rave" : ""} ${colorPulse ? "hue-rotate-180" : ""}`}></div>

      {/* --- NOISE & BACKGROUND GRID --- */}
      <div className="bg-noise mix-blend-overlay"></div>
      <div className={`fixed inset-0 pointer-events-none ${darkMode ? 'bg-grid-pattern opacity-20' : 'opacity-0'}`}></div>

      {/* --- SCROLL PROGRESS BAR --- */}
      <div className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-[#ccff00] z-[70]" style={{ width: `${scrolled ? '100%' : '0%'}`, transition: 'width 0.5s ease-out' }}></div>

      {/* --- NAVBAR --- */}
      <nav className={`fixed w-full z-50 top-0 transition-all duration-500 ${scrolled ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-white/10' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNav('home')}>
             <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-indigo-600 rounded-lg rotate-3 group-hover:rotate-12 transition-transform"></div>
                <div className="absolute inset-0 bg-black border border-white/20 rounded-lg flex items-center justify-center text-white font-black z-10">
                  T<span className="text-[#ccff00]">.</span>
                </div>
             </div>
             <span className="font-bold text-xl tracking-tighter">TeenVerseHub</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-sm uppercase tracking-wider">
            {['Explore', 'Mentors', 'Community'].map((item) => (
              <button key={item} onClick={() => handleNav(item.toLowerCase())} className="relative group overflow-hidden">
                <span className="group-hover:-translate-y-full block transition-transform duration-300">{item}</span>
                <span className="absolute top-0 left-0 translate-y-full group-hover:translate-y-0 block transition-transform duration-300 text-[#ccff00]">{item}</span>
              </button>
            ))}
            
            <div className="h-4 w-px bg-white/20 mx-2"></div>
            
            <button onClick={toggleTheme} className="hover:scale-110 transition-transform">
              {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
            </button>
            
            <button onClick={() => handleNav('auth')} className="bg-white text-black px-6 py-2 rounded-none font-black hover:bg-[#ccff00] hover:scale-105 transition-all skew-x-[-10deg] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              <span className="block skew-x-[10deg]">Join Cult</span>
            </button>
          </div>
          
          <button className="md:hidden z-50 relative" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X size={32} className="text-white"/> : <Menu size={32}/>}
          </button>
        </div>
      </nav>

      {/* --- MOBILE MENU --- */}
      <div className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 transition-transform duration-500 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         {['HOME', 'FIND WORK', 'POST JOB', 'LOGIN'].map((item, i) => (
           <button key={i} onClick={() => handleNav('home')} className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 hover:to-[#ccff00] transition-all italic tracking-tighter">
             {item}
           </button>
         ))}
         <div className="flex gap-8 mt-8">
            <button onClick={toggleTheme} className="p-4 rounded-full bg-white/10"><Sun size={24} className="text-white"/></button>
            <button onClick={() => onLegalClick('privacy')} className="p-4 rounded-full bg-white/10"><Lock size={24} className="text-white"/></button>
         </div>
      </div>

      {/* --- HERO SECTION: IDENTITY --- */}
      <section className="pt-48 pb-24 px-6 relative overflow-hidden flex flex-col items-center text-center">
         {/* Refined Blobs */}
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

         <div className="z-10 max-w-6xl relative">
            {/* Live Stat Pill */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-10 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
               </span>
               <span className="text-xs font-mono font-bold tracking-widest text-gray-400">LIVE ECONOMY</span>
            </div>

            {/* Typography */}
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] mb-8 uppercase animate-fade-in-up" style={{animationDelay: '0.2s'}}>
               Don't Just <br/>
               <span className="glitch-wrapper">
                 <span className="glitch-text text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500" data-text="EXIST.">EXIST.</span>
               </span> <br/>
               <span className="text-[#ccff00]">Monetize It.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium animate-fade-in-up" style={{animationDelay: '0.3s'}}>
               The first marketplace built strictly for Gen Z. <br/>
               <span className="text-white">No corporate BS. Instant payouts.</span>
            </p>

            {/* Magnetic CTA Area */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
               <button onClick={() => handleNav('auth')} className="magnetic-btn relative px-12 py-6 bg-[#ccff00] text-black font-black text-xl rounded-2xl overflow-hidden group hover:shadow-[0_0_40px_rgba(204,255,0,0.3)] transition-all">
                  <span className="relative z-10 flex items-center gap-3">JOIN THE CULT <Rocket size={24}/></span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               </button>
               
               <button onClick={() => handleNav('explore')} className="magnetic-btn px-10 py-6 border border-white/10 rounded-2xl font-bold hover:bg-white/5 hover:border-white/30 transition-all flex items-center gap-3 text-white">
                  EXPLORE GIGS <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
               </button>
            </div>
         </div>
      </section>

      {/* --- ROTATED MARQUEE --- */}
      <div className="relative z-20 bg-indigo-600 rotate-[-1deg] scale-105 border-y-4 border-black dark:border-white py-4 shadow-2xl">
         <div className="flex w-[200%] animate-marquee">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 mx-4 text-white font-black text-2xl uppercase tracking-tighter whitespace-nowrap">
                  Video Editing <Star className="fill-yellow-400 text-black w-6 h-6"/> 
                  Crypto <Zap className="fill-white text-black w-6 h-6"/> 
                  Design <Heart className="fill-pink-500 text-black w-6 h-6"/>
              </div>
            ))}
         </div>
      </div>

      {/* --- BENTO GRID: THE ECOSYSTEM --- */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[280px]">
           
           {/* Card 1: MONEY (High Contrast) */}
           <div className="md:col-span-2 row-span-2 bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-10 relative overflow-hidden group hover:border-[#ccff00]/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#ccff00] blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <h3 className="text-5xl font-black mb-4 uppercase italic leading-none">Instant <br/><span className="text-[#ccff00]">Escrow.</span></h3>
                   <p className="text-gray-400 text-lg max-w-sm mt-4">We hold the client's money before you start. You get paid the second you deliver.</p>
                </div>

                {/* Animated Payment Notification */}
                <div className="mt-8 bg-neutral-900/80 border border-white/10 rounded-xl p-4 flex items-center gap-4 backdrop-blur-md max-w-xs transform group-hover:-translate-y-2 transition-transform duration-500">
                   <div className="w-12 h-12 bg-[#ccff00] rounded-full flex items-center justify-center text-black font-bold"><CheckCircle size={24}/></div>
                   <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Payment Released</div>
                      <div className="text-xl font-bold text-white">₹ 8,500.00</div>
                   </div>
                </div>
              </div>
           </div>

           {/* Card 2: STATS (Clean) */}
           <div className="md:col-span-1 bg-white text-black rounded-[2rem] p-8 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-start">
                  <TrendingUp size={40} className="text-indigo-600"/>
                  <div className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full uppercase">Live</div>
              </div>
              <div>
                 <div className="text-6xl font-black tracking-tighter">15k+</div>
                 <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Active Teens</div>
              </div>
           </div>

           {/* Card 3: VISUAL (Vibe) */}
           <div className="md:col-span-1 row-span-2 rounded-[2rem] overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" alt="Abstract" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                 <h4 className="text-white font-bold text-2xl leading-none mb-2">Create <br/>Authority.</h4>
                 <p className="text-gray-300 text-xs font-mono">YOUR PORTFOLIO IS YOUR DEGREE</p>
              </div>
           </div>

           {/* Card 4: CATEGORIES (Tech) */}
           <div className="md:col-span-1 bg-neutral-900 border border-white/10 rounded-[2rem] p-8 text-white relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <Code size={48} className="mb-6 text-gray-600 group-hover:text-indigo-400 transition-colors"/>
              <h3 className="text-2xl font-bold mb-4">Dev & No-Code</h3>
              <div className="flex flex-wrap gap-2">
                 {['React', 'Framer', 'Web3', 'Solidity'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono hover:bg-white/10 cursor-default">{tag}</span>
                 ))}
              </div>
           </div>

           {/* Card 5: SAFETY (Glassmorphism) */}
           <div className="md:col-span-2 glass-panel rounded-[2rem] p-8 flex items-center justify-between group">
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="text-[#ccff00]" size={32}/>
                    <h3 className="text-2xl font-bold text-white">Mom-Approved Safety</h3>
                 </div>
                 <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                    Identity verification via DigiLocker. <br/>
                    Strict client vetting. No creeping. <br/>
                    We ban sketchy clients instantly.
                 </p>
              </div>
              <div className="hidden sm:block opacity-10 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-10 group-hover:translate-x-0">
                 <Lock size={120} className="text-white"/>
              </div>
           </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section className="py-24 bg-neutral-900/50 relative">
        <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-black text-center mb-16 uppercase">How to <span className="text-[#ccff00]">Level Up</span></h2>
            <div className="relative border-l-2 border-white/20 pl-8 space-y-12">
                {[
                    { title: "Create Profile", desc: "Link your GitHub/Portfolio. Verify age via DigiLocker.", icon: <User /> },
                    { title: "Apply for Gigs", desc: "Pitch to clients. No cover letters, just show your work.", icon: <Briefcase /> },
                    { title: "Get Paid", desc: "Money hits your escrow. Submit work. Get funds released instantly.", icon: <DollarSign /> }
                ].map((step, idx) => (
                    <div key={idx} className="relative group">
                        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-black border-4 border-indigo-600 group-hover:border-[#ccff00] transition-colors"></div>
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className="text-gray-400">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- CREATOR / CLIENT TOGGLE: DUAL REALITY --- */}
      <section className="py-24 px-6 relative">
         {/* Background Ambience Shift */}
         <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${activeTab === 'clients' ? 'opacity-20 bg-fuchsia-900/20' : 'opacity-0'}`}></div>

         <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex justify-center mb-16">
               <div className="bg-black/40 p-1.5 rounded-full border border-white/10 backdrop-blur-md inline-flex">
                  <button 
                    onClick={() => setActiveTab('creators')} 
                    className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-300 ${activeTab === 'creators' ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.4)]' : 'text-gray-500 hover:text-white'}`}
                  >
                    I'm a Teen
                  </button>
                  <button 
                    onClick={() => setActiveTab('clients')} 
                    className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-300 ${activeTab === 'clients' ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'text-gray-500 hover:text-white'}`}
                  >
                    Hiring Talent
                  </button>
               </div>
            </div>

            <div className="min-h-[400px]">
               {activeTab === 'creators' ? (
                 <div className="flex flex-col md:flex-row gap-16 items-center animate-fade-in-up">
                    <div className="flex-1 space-y-8">
                       <h2 className="text-5xl md:text-6xl font-black leading-tight">Monetize your <br/><span className="text-[#ccff00]">Obsession.</span></h2>
                       <p className="text-gray-400 text-lg">Stop doing free work for exposure. Build a portfolio that gets you hired by real brands.</p>
                       <ul className="space-y-4 font-mono text-sm text-gray-300">
                          <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#ccff00] rounded-full"></div> Keep 95% of your earnings.</li>
                          <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#ccff00] rounded-full"></div> Work from your phone.</li>
                          <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#ccff00] rounded-full"></div> No degree required.</li>
                       </ul>
                    </div>
                    {/* Chat Mockup - Creator View */}
                    <div className="flex-1 w-full bg-[#111] rounded-3xl p-8 border border-white/10 shadow-2xl relative rotate-1 hover:rotate-0 transition-transform duration-500">
                       <div className="space-y-6">
                          <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0"></div>
                             <div className="bg-[#222] p-4 rounded-2xl rounded-tl-none text-sm text-gray-200">
                                Need a 30s TikTok edit. Fast paced, Alex Hormozi style captions. Budget is ₹2k.
                             </div>
                          </div>
                          <div className="flex items-start gap-4 flex-row-reverse">
                             <div className="w-10 h-10 rounded-full bg-indigo-500 flex-shrink-0"></div>
                             <div className="bg-[#ccff00] p-4 rounded-2xl rounded-tr-none text-sm text-black font-medium shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                                I got you. Check my portfolio. I can deliver by tonight. ⚡
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col md:flex-row-reverse gap-16 items-center animate-fade-in-up">
                    <div className="flex-1 space-y-8">
                       <h2 className="text-5xl md:text-6xl font-black leading-tight">Hire the <br/><span className="text-fuchsia-500">Next Gen.</span></h2>
                       <p className="text-gray-400 text-lg">They know the trends before they are trends. Get edits, designs, and code that actually looks modern.</p>
                       <button onClick={() => handleNav('auth')} className="bg-white text-black px-8 py-4 font-black rounded-xl hover:bg-fuchsia-500 hover:text-white transition-all shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
                          POST A JOB FREE
                       </button>
                    </div>
                    {/* Talent Pool Mockup */}
                    <div className="flex-1 w-full bg-white text-black rounded-3xl p-8 border border-gray-200 shadow-[0_0_60px_rgba(255,255,255,0.1)] relative">
                       <div className="absolute -top-4 -right-4 bg-black text-white px-4 py-2 rounded-lg font-bold rotate-6">VETTED</div>
                       <div className="space-y-4">
                          {[
                             { role: "Video Editor", rate: "₹800/hr", skills: ["Premiere", "CapCut"] },
                             { role: "UI Designer", rate: "₹1200/hr", skills: ["Figma", "Spline"] },
                             { role: "React Dev", rate: "₹1500/hr", skills: ["Next.js", "Tailwind"] }
                          ].map((job, i) => (
                             <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center group hover:border-black transition-colors cursor-pointer">
                                <div>
                                   <div className="font-bold text-lg">{job.role}</div>
                                   <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                      {job.skills.map(s => <span key={s}>{s}</span>)}
                                   </div>
                                </div>
                                <span className="font-mono font-bold text-green-600">{job.rate}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>
         </div>
      </section>

      {/* --- FEEDBACK (Functional + Database Connected) --- */}
      <section className="py-24 px-6 relative border-t border-white/10">
         <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-10">DROP A MESSAGE 🎤</h2>
            
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
               {feedbackStatus === 'success' ? (
                  <div className="py-12 animate-fade-in-up">
                     <CheckCircle size={64} className="mx-auto text-green-500 mb-4"/>
                     <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                     <p className="text-gray-500">We'll probably read it.</p>
                  </div>
               ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
                     {/* Name and Email Inputs */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Who are you?</label>
                           <input 
                              type="text"
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] transition-colors"
                              placeholder="Name (Optional)"
                              value={feedbackForm.name}
                              onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">Contact Info</label>
                           <input 
                              type="email"
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] transition-colors"
                              placeholder="Email (for reply)"
                              value={feedbackForm.email}
                              onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                           />
                        </div>
                     </div>

                     {/* Message Textarea */}
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-2 mb-1 block">The Juice</label>
                        <textarea 
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ccff00] transition-colors resize-none min-h-[150px]"
                           placeholder="Found a bug? Want a feature? Just venting?"
                           value={feedbackForm.message}
                           onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                           required
                        ></textarea>
                     </div>

                     <button 
                        disabled={feedbackStatus === 'loading'}
                        className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-[#ccff00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {feedbackStatus === 'loading' ? <Loader2 className="animate-spin"/> : <>SEND IT <Send size={18}/></>}
                     </button>
                  </form>
               )}
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      {/* --- FOOTER: TRUST & IDENTITY --- */}
      <footer className="border-t border-white/10 bg-black pt-20 pb-10 relative overflow-hidden">
         {/* Decorative background glow */}
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/10 blur-[120px] pointer-events-none"></div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            
            {/* TOP GRID: 5 COLUMNS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
               
               {/* 1. IDENTITY BLOCK (Span 4) */}
               <div className="lg:col-span-4 space-y-6">
                  <div className="flex items-center gap-2 group cursor-default">
                     <div className="w-8 h-8 bg-indigo-600 rounded-lg rotate-3 group-hover:rotate-12 transition-transform"></div>
                     <span className="font-black text-2xl tracking-tighter text-white">TeenVerseHub<span className="text-[#ccff00]">.</span></span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                     Built by teens. Protected by design. <br/>
                     We are building the safest, most powerful economy for the next generation. From India 🇮🇳 to the world.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono text-green-500 border border-green-900/30 bg-green-900/10 px-3 py-1 rounded-full w-fit">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                     SYSTEM OPERATIONAL • v1.0
                  </div>
               </div>

               {/* 2. PRODUCT (Span 2) */}
               <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">Platform</h4>
                  <ul className="space-y-3 text-sm text-gray-500 font-medium">
                     {['Explore Gigs', 'Post a Job', 'Academy', 'Community', 'Login'].map(item => (
                        <li key={item}>
                           <button onClick={() => handleNav(item.toLowerCase())} className="hover:text-[#ccff00] transition-colors hover:translate-x-1 duration-300 block">
                              {item}
                           </button>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* 3. TRUST & SAFETY (Span 2) - CRITICAL */}
               <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                     <ShieldCheck size={16} className="text-[#ccff00]"/> Safety
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-500 font-medium">
                     <li><button onClick={() => onLegalClick('safety')} className="hover:text-white transition-colors">Safety Center</button></li>
                     <li><button onClick={() => onLegalClick('parents')} className="hover:text-white transition-colors">Parent Guide</button></li>
                     <li><button onClick={() => onLegalClick('escrow')} className="hover:text-white transition-colors">Escrow Protection</button></li>
                     <li><button onClick={() => onLegalClick('report')} className="hover:text-red-400 transition-colors flex items-center gap-2"><AlertTriangle size={12}/> Report Abuse</button></li>
                  </ul>
               </div>

               {/* 4. LEGAL (Span 2) */}
               <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">Legal</h4>
                  <ul className="space-y-3 text-sm text-gray-500 font-medium">
                     <li><button onClick={() => onLegalClick('terms')} className="hover:text-white transition-colors">Terms of Use</button></li>
                     <li><button onClick={() => onLegalClick('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                     <li><button onClick={() => onLegalClick('refunds')} className="hover:text-white transition-colors">Refund Policy</button></li>
                     <li className="pt-2 text-[10px] text-gray-600 leading-tight">
                        Designed in compliance with Indian IT & child safety norms.
                     </li>
                  </ul>
               </div>

               {/* 5. CONTACT (Span 2) */}
               <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">Connect</h4>
                  <div className="flex gap-4 mb-4">
                     {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                        <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#ccff00] hover:text-black hover:scale-110 transition-all">
                           <Icon size={18}/>
                        </a>
                     ))}
                  </div>
                  <div className="space-y-2 text-sm text-gray-500">
                     <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                        <Mail size={14}/> support@teenverse.in
                     </div>
                     <div className="flex items-center gap-2 text-xs">
                        <Clock size={14}/> Replies in 24-48 hrs
                     </div>
                  </div>
               </div>
            </div>

            {/* BOTTOM STRIP */}
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="text-gray-600 text-xs font-mono">
                  © 2025 TeenVerseHub • All rights reserved • <span className="text-green-900">Encrypted</span>
               </div>
               
               {/* GEN-Z SIGNATURE */}
               <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <span className="text-[#ccff00]">{`{`}</span> 
                  Skill {'>'} Degree 
                  <span className="text-[#ccff00]">{`}`}</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;