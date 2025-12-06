import React, { useState, useEffect, useRef } from 'react';
import { 
  Rocket, Star, Search, PlusCircle, Instagram, Twitter, Linkedin, Send, Moon, Sun, 
  FileText, Lock, AlertTriangle, Menu, X, Zap, ShieldCheck, Globe, Code, Heart, 
  TrendingUp, ArrowRight, CheckCircle, Loader2, MousePointer2, Music, Video, DollarSign, Cpu,User, Briefcase
} from 'lucide-react';
import Button from '../components/ui/Button'; 
import { CATEGORIES } from '../utils/constants'; 

/* --- 1. CSS INJECTION: THE CHAOS ENGINE --- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');

  :root {
    --primary: #6366f1;
    --acid: #07A3B2;
    --neon-pink: #ff00ff;
  }

  body { 
    font-family: 'Space Grotesk', sans-serif; 
    cursor: none; /* Hide default cursor for the custom one */
  }

  /* CUSTOM CURSOR */
  .custom-cursor {
    position: fixed;
    top: 0; left: 0;
    width: 20px; height: 20px;
    background: var(--acid);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    transform: translate(-50%, -50%);
    transition: transform 0.1s ease;
  }
  .custom-cursor.hovered { transform: translate(-50%, -50%) scale(3); background: white; mix-blend-mode: normal; opacity: 0.2; }

  /* NOISE TEXTURE */
  .bg-noise {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 40;
    opacity: 0.04;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E");
  }

  /* GLITCH TEXT */
  .glitch-wrapper { position: relative; display: inline-block; }
  .glitch-text::before, .glitch-text::after {
    content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;
  }
  .glitch-text::before {
    color: #ff00ff; z-index: -1; animation: glitch-anim-1 2s infinite linear alternate-reverse;
  }
  .glitch-text::after {
    color: #00ffff; z-index: -2; animation: glitch-anim-2 3s infinite linear alternate-reverse;
  }
  @keyframes glitch-anim-1 { 0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 2px); } 100% { clip-path: inset(80% 0 20% 0); transform: translate(2px, -2px); } }
  @keyframes glitch-anim-2 { 0% { clip-path: inset(10% 0 90% 0); transform: translate(2px, 2px); } 100% { clip-path: inset(90% 0 10% 0); transform: translate(-2px, -2px); } }

  /* ANIMATIONS */
  .animate-marquee { animation: marquee 25s linear infinite; }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  
  .animate-float { animation: float 6s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }

  /* Rave Mode */
.rave * {
  animation: raveFlash 0.12s infinite alternate;
}
@keyframes raveFlash {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg) brightness(1.5); }
}

/* Ripple Explosion */
.ripple {
  position: fixed;
  width: 30px;
  height: 30px;
  background: #ccff00;
  border-radius: 50%;
  transform: scale(0);
  pointer-events: none;
  animation: rippleAnim 0.6s ease-out;
}
@keyframes rippleAnim {
  100% {
    transform: scale(25);
    opacity: 0;
  }
}

/* Particle Canvas */
.particle {
  position: fixed;
  border-radius: 50%;
  background: #ccff00;
  mix-blend-mode: screen;
  z-index: 2;
}

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
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackForm, setFeedbackForm] = useState({ message: '' });
  
  // Custom Cursor State
  const cursorRef = useRef(null);
  
  /* === CRAZY MODE PATCH === */
  const [raveMode, setRaveMode] = useState(false);
  const [colorPulse, setColorPulse] = useState(false);
  const particlesRef = useRef([]);

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

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackStatus('loading');
    setTimeout(() => {
      setFeedbackStatus('success');
      setTimeout(() => setFeedbackStatus('idle'), 3000);
    }, 1500);
  };

  // Neon Particles Initialization
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 40; i++) { // Kept low for performance
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 2 + Math.random() * 4,
        dx: -0.5 + Math.random(),
        dy: -0.5 + Math.random(),
      });
    }
    particlesRef.current = particles;

    // Use a simpler interval for React state update to avoid heavy re-renders
    // In production, use HTML Canvas for this. Here we use CSS transitions.
  }, []);

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

      {/* --- MOBILE MENU (Cyberpunk Drawer) --- */}
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

      {/* --- HERO SECTION --- */}
      <section className="pt-48 pb-24 px-6 relative overflow-hidden flex flex-col items-center text-center">
         {/* Blobs */}
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-30 animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600 rounded-full blur-[150px] opacity-30 animate-pulse delay-1000"></div>

         <div className="z-10 max-w-6xl relative">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-float cursor-default">
               <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9ECC7] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D9ECC7]"></span>
               </span>
               <span className="text-xs font-mono text-gray-400">LIVE: 14,203 TEENS EARNING</span>
            </div>

            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8 uppercase">
               Don't Just <br/>
               <span className="glitch-wrapper">
                 <span className="glitch-text text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" data-text="EXIST.">EXIST.</span>
               </span> <br/>
               Start <span className="relative inline-block text-gray-500">
                  Earning
                  <svg className="absolute w-full h-4 -bottom-1 left-0 text-[#ccff00]" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
               </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium">
               The marketplace for Gen Z. No boomers. No corporate BS. Just skills, gigs, and <span className="text-[#ccff00] font-bold">instant cash</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
               <button onClick={() => handleNav('auth')} className="relative px-10 py-5 bg-[#ccff00] text-black font-black text-lg rounded-xl overflow-hidden group hover:scale-105 transition-transform">
                  <span className="relative z-10 flex items-center gap-2">START HUSTLING <Rocket size={20}/></span>
                  <div className="absolute inset-0 bg-white mix-blend-overlay opacity-0 group-hover:opacity-50 transition-opacity"></div>
               </button>
               <button onClick={() => handleNav('explore')} className="px-10 py-5 border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
                  BROWSE GIGS <ArrowRight size={20}/>
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

      {/* --- BENTO GRID (The Meat) --- */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[280px]">
           
           {/* Card 1: Main Value Prop */}
           <div className="md:col-span-2 row-span-2 bg-[#111] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-5xl font-black mb-4 uppercase italic">Instant <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-500">Payouts.</span></h3>
              <p className="text-gray-400 text-lg max-w-md">Forget "Net 30". Get paid via UPI the second your job is approved. We hold the money in escrow so you never get ghosted.</p>
              
              <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 max-w-sm backdrop-blur-md animate-float">
                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold"><DollarSign/></div>
                 <div>
                    <div className="text-xs text-gray-400 uppercase">Payment Received</div>
                    <div className="text-xl font-bold text-white">₹ 4,500.00</div>
                 </div>
              </div>
           </div>

           {/* Card 2: Stats */}
           <div className="md:col-span-1 bg-white dark:bg-gray-100 rounded-[2.5rem] p-8 text-black flex flex-col justify-between group hover:-translate-y-2 transition-transform">
              <TrendingUp size={48} className="text-indigo-600"/>
              <div>
                 <div className="text-6xl font-black tracking-tighter">15k+</div>
                 <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Verified Teens</div>
              </div>
           </div>

           {/* Card 3: Image */}
           <div className="md:col-span-1 row-span-2 rounded-[2.5rem] overflow-hidden relative group">
              <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80" alt="Tech" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                 <h4 className="text-white font-bold text-xl">Future of Work</h4>
                 <p className="text-gray-300 text-sm">Built by Gen Z, for Gen Z.</p>
              </div>
           </div>

           {/* Card 4: Categories */}
           <div className="md:col-span-1 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <Cpu size={48} className="mb-4 opacity-50 group-hover:opacity-100 transition-opacity"/>
              <h3 className="text-2xl font-bold mb-2">Tech & Code</h3>
              <div className="flex flex-wrap gap-2 mt-4">
                 <span className="px-3 py-1 bg-black/20 rounded-lg text-xs font-mono">React</span>
                 <span className="px-3 py-1 bg-black/20 rounded-lg text-xs font-mono">Python</span>
                 <span className="px-3 py-1 bg-black/20 rounded-lg text-xs font-mono">Web3</span>
              </div>
           </div>

           {/* Card 5: Safety */}
           <div className="md:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-[#ccff00]/50 transition-all">
              <div>
                 <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><ShieldCheck className="text-[#ccff00]"/> Mom-Approved</h3>
                 <p className="text-gray-500 text-sm max-w-sm">Strict verification. No sketchy clients. Your safety is our #1 priority.</p>
              </div>
              <div className="hidden sm:block opacity-20 group-hover:opacity-100 transition-opacity">
                 <Lock size={64}/>
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

      {/* --- CREATOR / CLIENT TOGGLE (Interactive) --- */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
         <div className="flex justify-center mb-16">
            <div className="bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
               {['creators', 'clients'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveTab(tab)} 
                   className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-[#ccff00] text-black shadow-lg shadow-[#ccff00]/20' : 'text-gray-400 hover:text-white'}`}
                 >
                   For {tab}
                 </button>
               ))}
            </div>
         </div>

         <div className="min-h-[400px]">
            {activeTab === 'creators' ? (
              <div className="flex flex-col md:flex-row gap-12 items-center animate-fade-in">
                 <div className="flex-1 space-y-6">
                    <h2 className="text-5xl font-black">Monetize your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-400">Obsession.</span></h2>
                    <p className="text-gray-400 text-lg">Stop doing free work for exposure. Build a portfolio that gets you hired by real brands.</p>
                    <ul className="space-y-4">
                       <li className="flex items-center gap-3 text-lg font-bold"><CheckCircle className="text-[#ccff00]"/> Keep 95% of your earnings.</li>
                       <li className="flex items-center gap-3 text-lg font-bold"><CheckCircle className="text-[#ccff00]"/> Work from your phone.</li>
                    </ul>
                 </div>
                 <div className="flex-1 bg-[#1a1a1a] rounded-3xl p-6 border-l-4 border-[#ccff00] relative rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                    <div className="absolute -top-4 -right-4 bg-red-500 text-white font-bold px-4 py-1 rounded-full text-xs">HOT</div>
                    {/* Mock Chat */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600"></div>
                          <div className="bg-[#2f3136] p-3 rounded-xl text-sm text-gray-200">Can you edit this reel like an Iman Gadzhi video?</div>
                       </div>
                       <div className="flex items-center gap-3 flex-row-reverse">
                          <div className="w-10 h-10 rounded-full bg-indigo-500"></div>
                          <div className="bg-indigo-600 p-3 rounded-xl text-sm text-white">Easy. Give me 2 hours. 🚀</div>
                       </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row-reverse gap-12 items-center animate-fade-in">
                 <div className="flex-1 space-y-6">
                    <h2 className="text-5xl font-black">Hire the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Next Gen.</span></h2>
                    <p className="text-gray-400 text-lg">They know the trends before they are trends. Get edits, designs, and code that actually looks modern.</p>
                    <Button onClick={() => handleNav('auth')} className="bg-white text-black hover:bg-pink-500 hover:text-white border-0">Post a Job Free</Button>
                 </div>
                 <div className="flex-1 bg-white text-black rounded-3xl p-8 border border-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-xl">Talent Pool</h3>
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-${i*200}`}></div>)}
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                          <span className="font-bold">Video Editor</span>
                          <span className="text-green-600 font-mono font-bold">₹800/hr</span>
                       </div>
                       <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                          <span className="font-bold">UI Designer</span>
                          <span className="text-green-600 font-mono font-bold">₹1200/hr</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </section>

      {/* --- FEEDBACK (Functional) --- */}
      <section className="py-24 px-6 relative border-t border-white/10">
         <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-10">DROP A MESSAGE 🎤</h2>
            
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
               {feedbackStatus === 'success' ? (
                  <div className="py-12 animate-fade-in">
                     <CheckCircle size={64} className="mx-auto text-green-500 mb-4"/>
                     <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                     <p className="text-gray-500">We'll probably read it.</p>
                  </div>
               ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                     <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ccff00] transition-colors resize-none min-h-[150px]"
                        placeholder="Found a bug? Want a feature? Just venting?"
                        value={feedbackForm.message}
                        onChange={(e) => setFeedbackForm({message: e.target.value})}
                        required
                     ></textarea>
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
      <footer className="border-t border-white/10 bg-black pt-16 pb-8">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-center md:text-left">
               <div className="font-black text-2xl tracking-tighter mb-2">TeenVerse.</div>
               <p className="text-gray-500 text-sm">Mahoba to the 🌍.<br/>Built by teens.</p>
            </div>
            <div className="flex gap-6">
               {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black hover:scale-110 transition-all cursor-pointer">
                     <Icon size={20}/>
                  </div>
               ))}
            </div>
            <div className="flex gap-6 text-sm font-bold text-gray-500">
               <button onClick={() => onLegalClick('privacy')} className="hover:text-white">Privacy</button>
               <button onClick={() => onLegalClick('terms')} className="hover:text-white">Terms</button>
               <button onClick={() => onLegalClick('safety')} className="hover:text-white">Safety</button>
            </div>
         </div>
         <div className="text-center text-xs text-gray-600 font-mono">
            © 2025 TeenVerse Inc. System Operational.
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;