import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Star, Zap, Heart, TrendingUp, ArrowRight, CheckCircle, 
  Loader2, DollarSign, Cpu, ShieldCheck, Lock, Menu, X, 
  Sun, Moon, Instagram, Twitter, Linkedin, Send, Code, AlertTriangle
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView, AnimatePresence } from 'framer-motion';
// import { supabase } from '../supabase'; // Uncomment when backend is ready

// --- MOCK SUPABASE (For demo purposes - remove when real DB is connected) ---
const mockSupabase = {
  from: () => ({
    insert: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Fake network delay
      return { error: null };
    }
  })
};
const supabase = mockSupabase; // Switch this to real import when ready

// --- 1. UTILITY: 3D TILT CARD ---
const TiltCard = ({ children, className }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left - width / 2);
    mouseY.set(clientY - top - height / 2);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      style={{
        rotateY: useTransform(mouseX, [-200, 200], [-5, 5]),
        rotateX: useTransform(mouseY, [-200, 200], [5, -5]),
        transformStyle: "preserve-3d",
      }}
      className={`relative transition-all duration-200 ease-out ${className}`}
    >
      {children}
    </motion.div>
  );
};

// --- 2. UTILITY: SCROLL REVEAL WRAPPER ---
const RevealOnScroll = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// --- 3. CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
  
  :root { --primary: #6366f1; --acid: #ccff00; }
  body { font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }
  
  .custom-cursor {
    position: fixed; top: 0; left: 0; width: 20px; height: 20px;
    background: var(--acid); border-radius: 50%; pointer-events: none; z-index: 9999;
    mix-blend-mode: exclusion; transition: transform 0.1s;
  }
  .custom-cursor.hovered { transform: scale(4); background: white; mix-blend-mode: difference; }
  
  .bg-grid-pattern {
    background-size: 50px 50px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
  
  .text-stroke { -webkit-text-stroke: 1px rgba(255,255,255,0.2); color: transparent; }
  
  /* FLIP CARD UTILS */
  .perspective-1000 { perspective: 1000px; }
  .preserve-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
`;

const LandingPage = ({ setView, darkMode, toggleTheme, onLegalClick }) => {
  // --- STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('creators');
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  
  // --- ANIMATION HOOKS ---
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]); // Parallax for hero text
  const cursorRef = useRef(null);

  // --- EFFECTS ---
  useEffect(() => {
    const moveCursor = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
        cursorRef.current.style.transform = `translate(-50%, -50%)`;
      }
    };
    const addHover = () => cursorRef.current?.classList.add('hovered');
    const removeHover = () => cursorRef.current?.classList.remove('hovered');

    window.addEventListener('mousemove', moveCursor);
    document.querySelectorAll('button, a, input, textarea, .hover-target').forEach(el => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.querySelectorAll('button, a').forEach(el => {
         el.removeEventListener('mouseenter', addHover);
         el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  // --- HANDLERS ---
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackStatus('loading');
    try {
      const { error } = await supabase.from('feedback').insert([feedbackForm]);
      if (error) throw error;
      setFeedbackStatus('success');
      setFeedbackForm({ name: '', email: '', message: '' });
      setTimeout(() => setFeedbackStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setFeedbackStatus('idle'); // In a real app, show error state
    }
  };

  const handleNav = (target) => {
    if (!setView) {
        console.warn("setView prop missing - Navigation disabled");
        return;
    }

    const viewMap = {
        'join cult': 'auth',
        'auth': 'auth',
        'login': 'auth',
        'start earning': 'auth',
        'parent portal': 'parent-login',
        'post job': 'auth',
        'post job free': 'auth',
        'home': 'landing',
    };

    const cleanTarget = target.toLowerCase();

    if (viewMap[cleanTarget]) {
        setView(viewMap[cleanTarget]);
        window.scrollTo(0,0);
        setIsMobileMenuOpen(false);
        return;
    }

    if (['explore', 'ecosystem', 'mentors', 'community'].includes(cleanTarget)) {
        const section = document.getElementById(cleanTarget === 'ecosystem' ? 'explore' : cleanTarget);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        } else {
            alert("Coming Soon! 🚀");
        }
        return;
    }

    alert(`Navigating to: ${target}`);
    setIsMobileMenuOpen(false);
  };

  const handleFooterLink = (link) => {
      const lower = link.toLowerCase();
      if (['terms', 'privacy', 'refunds'].includes(lower) && onLegalClick) {
          onLegalClick(lower);
          return;
      }
      handleNav(link);
  };

  return (
    <div className={`relative min-h-screen selection:bg-[#ccff00] selection:text-black ${darkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* --- 🚀 SEO INJECTION START --- */}
      <Helmet>
        <title>TeenVerseHub – Freelancing Platform for Teenagers in India</title>
        <meta 
          name="description" 
          content="TeenVerseHub is the safest freelancing marketplace for teenagers in India. Earn money online with skills like video editing, coding, and design. No degree required." 
        />
        <meta name="keywords" content="freelancing for teens india, student jobs online, teenversehub, earn money online under 18, video editing jobs for students" />
        <link rel="canonical" href="https://teenversehub.in/" />
      </Helmet>

      {/* 🤖 HIDDEN CONTENT FOR GOOGLEBOT (Do not remove) */}
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: '0' }}>
        <h1>TeenVerseHub – Freelancing Platform for Teenagers in India</h1>
        <p>
          TeenVerseHub is a skill-based freelancing marketplace specifically for teenagers in India.
          Students can earn money online safely by offering services like design,
          content writing, editing, social media, and tech work without degrees
          or upfront investment. Join the Gen Z economy.
        </p>
      </div>
      {/* --- 🚀 SEO INJECTION END --- */}

      <style>{styles}</style>
      
      {/* Custom Cursor */}
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* Dynamic Backgrounds */}
      <div className={`fixed inset-0 pointer-events-none ${darkMode ? 'bg-grid-pattern opacity-30' : 'opacity-0'}`}></div>
      <div className="fixed inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

      {/* Progress Bar */}
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1.5 bg-[#ccff00] origin-left z-[100]" />

      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100 }}
        className="fixed w-full z-50 top-0 py-4 px-6"
      >
        <div className="max-w-7xl mx-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex justify-between items-center shadow-2xl relative z-50">
           <div className="flex items-center gap-3 cursor-pointer hover-target" onClick={() => handleNav('home')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white transform rotate-3 hover:rotate-12 transition-all border border-white/20">
                T<span className="text-[#ccff00]">.</span>
              </div>
              <span className="font-bold tracking-tighter text-xl text-white">TeenVerseHub</span>
           </div>

           {/* Desktop Menu */}
           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-gray-300">
              {['Explore', 'Mentors', 'Community'].map((item) => (
                <button key={item} onClick={() => handleNav(item)} className="hover:text-[#ccff00] transition-colors hover-target">{item}</button>
              ))}
              <div className="w-px h-4 bg-white/20"></div>
              <button onClick={toggleTheme} className="hover:text-yellow-400 transition-colors hover-target">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
              <button onClick={() => handleNav('auth')} className="bg-white text-black px-6 py-2 rounded-xl hover:bg-[#ccff00] transition-all hover:scale-105 font-black hover-target">
                JOIN CULT
              </button>
           </div>
           
           {/* Mobile Toggle */}
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
             {isMobileMenuOpen ? <X /> : <Menu/>}
           </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-[calc(100%+10px)] left-0 w-full px-4 md:hidden z-40"
            >
              <div className="bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl">
                 <div className="flex flex-col gap-4">
                   {['Explore', 'Mentors', 'Community'].map((item) => (
                     <button 
                       key={item} 
                       onClick={() => handleNav(item)} 
                       className="text-left text-lg font-bold text-gray-300 hover:text-[#ccff00] transition-colors flex items-center justify-between group py-2"
                     >
                       {item}
                       <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#ccff00]" />
                     </button>
                   ))}
                 </div>
                 <div className="h-px bg-white/10 w-full"></div>
                 <div className="flex items-center justify-between text-gray-400 font-mono text-sm">
                    <span>Switch Theme</span>
                    <button onClick={toggleTheme} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-white">
                      {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
                    </button>
                 </div>
                 <button 
                   onClick={() => handleNav('auth')} 
                   className="w-full bg-[#ccff00] text-black py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                 >
                   Join Cult <Rocket size={18} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20">
         {/* Animated Blobs */}
         <motion.div 
           animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px]" 
         />
         <motion.div 
           animate={{ rotate: -360, scale: [1, 1.5, 1] }} 
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/20 rounded-full blur-[120px]" 
         />

         <div className="relative z-10 max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ccff00]/30 bg-[#ccff00]/5 text-[#ccff00] text-xs font-mono font-bold tracking-widest mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
              LIVE ECONOMY v2.0
            </motion.div>

            <motion.h1 
              style={{ y: heroY }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }}
              className="text-7xl md:text-[9rem] font-black leading-[0.85] tracking-tighter mb-8 uppercase"
            >
              Don't Just <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-600 hover:text-[#ccff00] transition-colors duration-500 cursor-default">EXIST.</span> <br/>
              <span className="text-transparent text-stroke hover:text-[#ccff00] transition-colors duration-300">Monetize</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 font-medium"
            >
              The first marketplace built strictly for Gen Z. <br/>
              <span className="text-white">No degrees. No corporate BS. Just skills.</span>
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <motion.button 
                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 onClick={() => handleNav('auth')}
                 className="hover-target relative px-10 py-5 bg-[#ccff00] text-black font-black text-lg rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)] transition-shadow"
               >
                  START EARNING <Rocket size={20}/>
               </motion.button>
               <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleNav('explore')}
                  className="hover-target px-10 py-5 border border-white/10 bg-white/5 backdrop-blur rounded-2xl font-bold text-white hover:bg-white/10 flex items-center gap-3"
               >
                  BROWSE GIGS <ArrowRight size={20}/>
               </motion.button>
            </div>
         </div>
      </section>

      {/* --- MARQUEE --- */}
      <div className="relative py-10 bg-black border-y border-white/10 overflow-hidden rotate-[-2deg] scale-105 z-20">
         <motion.div 
           animate={{ x: [0, -1000] }} 
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="flex whitespace-nowrap gap-12"
         >
            {[...Array(10)].map((_,i) => (
               <div key={i} className="flex items-center gap-12 text-4xl font-black uppercase text-white/20">
                  <span>Video Editing</span> <Star className="text-[#ccff00]" size={32} />
                  <span>Web3 Dev</span> <Zap className="text-fuchsia-500" size={32} />
                  <span>AI Art</span> <Heart className="text-indigo-500" size={32} />
               </div>
            ))}
         </motion.div>
      </div>

      {/* --- BENTO GRID (3D Tilt Ecosystem) --- */}
      <section id="explore" className="py-32 px-6 max-w-7xl mx-auto">
        <RevealOnScroll>
            <h2 className="text-center text-4xl md:text-6xl font-black uppercase mb-20">
              The <span className="text-[#ccff00]">Ecosystem</span>
            </h2>
        </RevealOnScroll>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[300px]">
            {/* 1. ESCROW CARD */}
            <div className="md:col-span-2 row-span-2">
              <TiltCard className="h-full bg-[#0F0F0F] rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00] blur-[100px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
                 <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                       <h3 className="text-4xl font-black uppercase italic leading-none text-white">Instant <br/><span className="text-[#ccff00]">Payouts.</span></h3>
                       <p className="text-gray-400 mt-4 max-w-xs">Funds held in escrow. Released the second you deliver. No chasing invoices.</p>
                    </div>
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-2xl flex items-center gap-4 max-w-sm"
                    >
                       <div className="w-12 h-12 bg-[#ccff00] rounded-full flex items-center justify-center text-black"><DollarSign strokeWidth={3}/></div>
                       <div>
                          <div className="text-xs text-gray-400 uppercase font-bold">Payment Received</div>
                          <div className="text-xl font-bold text-white">₹ 12,400.00</div>
                       </div>
                    </motion.div>
                 </div>
              </TiltCard>
            </div>

            {/* 2. STAT CARD */}
            <div className="md:col-span-1">
              <TiltCard className="h-full bg-white text-black rounded-[2.5rem] p-8 flex flex-col justify-between group hover-target">
                 <div className="flex justify-between items-start">
                    <TrendingUp size={40} className="text-indigo-600"/>
                    <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold uppercase">Live</span>
                 </div>
                 <div>
                    <div className="text-6xl font-black tracking-tighter">15k+</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Active Creators</div>
                 </div>
              </TiltCard>
            </div>

            {/* 3. VISUAL CARD */}
            <div className="md:col-span-1 row-span-2">
              <TiltCard className="h-full rounded-[2.5rem] overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Art" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-8">
                    <h4 className="text-2xl font-bold text-white leading-none">Your Portfolio <br/>Is Your Degree.</h4>
                 </div>
              </TiltCard>
            </div>

            {/* 4. TECH STACK */}
            <div className="md:col-span-1">
              <TiltCard className="h-full bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                 <Code size={40} className="text-gray-500 mb-6 group-hover:text-white transition-colors"/>
                 <h3 className="text-2xl font-bold text-white mb-4">Tech First</h3>
                 <div className="flex flex-wrap gap-2">
                    {['Solidity', 'Rust', 'React', 'AI'].map(t => (
                       <span key={t} className="px-3 py-1 bg-black border border-white/10 rounded-lg text-xs font-mono text-gray-400 group-hover:text-[#ccff00]">{t}</span>
                    ))}
                 </div>
              </TiltCard>
            </div>

            {/* 5. SAFETY */}
            <div className="md:col-span-2">
              <TiltCard className="h-full bg-gradient-to-br from-[#111] to-[#000] border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-between group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <ShieldCheck className="text-[#ccff00]" size={32}/>
                       <h3 className="text-2xl font-bold text-white">Mom-Approved Safety</h3>
                    </div>
                    <p className="text-gray-400 text-sm max-w-xs">Identity verification via DigiLocker. Strict client vetting. Zero creep tolerance.</p>
                 </div>
                 <Lock size={100} className="text-white/5 group-hover:text-[#ccff00]/10 transition-colors duration-500"/>
              </TiltCard>
            </div>
         </div>
      </section>

      {/* --- 3D FLIP SECTION: CREATOR VS CLIENT --- */}
      <section className="py-32 px-6 perspective-1000 overflow-hidden">
         <RevealOnScroll>
           <div className="max-w-6xl mx-auto">
              {/* Toggle Switch */}
              <div className="flex justify-center mb-20">
                 <div className="bg-white/5 p-2 rounded-full border border-white/10 backdrop-blur-xl flex gap-2">
                    <button 
                      onClick={() => setActiveTab('creators')} 
                      className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'creators' ? 'bg-[#ccff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                      I'm a Teen
                    </button>
                    <button 
                      onClick={() => setActiveTab('clients')} 
                      className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'clients' ? 'bg-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                      Hiring Talent
                    </button>
                 </div>
              </div>

              {/* 3D Flipping Container */}
              <motion.div 
                 animate={{ rotateY: activeTab === 'creators' ? 0 : 180 }}
                 transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
                 className="relative w-full min-h-[500px] preserve-3d"
              >
                 {/* FRONT SIDE (Creators) */}
                 <div className="absolute inset-0 backface-hidden">
                    <div className="bg-[#111] border border-white/10 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 h-full shadow-2xl">
                       <div className="flex-1 space-y-6">
                          <h2 className="text-5xl md:text-7xl font-black text-white">Monetize <br/><span className="text-[#ccff00]">Obsession.</span></h2>
                          <p className="text-gray-400 text-lg">Stop working for "exposure". Build a portfolio that gets you hired by real brands looking for Gen-Z native talent.</p>
                          <ul className="space-y-3 font-mono text-sm text-gray-300">
                             <li className="flex items-center gap-3"><CheckCircle size={16} className="text-[#ccff00]"/> Keep 95% of earnings</li>
                             <li className="flex items-center gap-3"><CheckCircle size={16} className="text-[#ccff00]"/> Work from your phone</li>
                          </ul>
                       </div>
                       <div className="flex-1 w-full bg-[#1a1a1a] rounded-3xl p-6 border border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500">
                          {/* Mock Chat */}
                          <div className="space-y-4">
                             <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700"/>
                                <div className="bg-[#333] p-3 rounded-2xl rounded-tl-none text-sm text-gray-300">Need a TikTok editor. Budget ₹5k.</div>
                             </div>
                             <div className="flex items-start gap-3 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-[#ccff00]"/>
                                <div className="bg-[#ccff00] text-black font-bold p-3 rounded-2xl rounded-tr-none text-sm shadow-[0_0_15px_rgba(204,255,0,0.3)]">I got you. Check my portfolio. ⚡</div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* BACK SIDE (Clients) */}
                 <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="bg-gradient-to-br from-fuchsia-900/20 to-black border border-fuchsia-500/30 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row-reverse items-center gap-12 h-full shadow-2xl">
                       <div className="flex-1 space-y-6 text-right">
                          <h2 className="text-5xl md:text-7xl font-black text-white">Hire the <br/><span className="text-fuchsia-500">Next Gen.</span></h2>
                          <p className="text-gray-400 text-lg">They know the trends before they happen. Get edits, designs, and code that actually looks modern.</p>
                          <button onClick={() => handleNav('auth')} className="bg-white text-black px-8 py-4 rounded-xl font-black hover:bg-fuchsia-500 hover:text-white transition-all">POST JOB FREE</button>
                       </div>
                       <div className="flex-1 w-full bg-white rounded-3xl p-6 text-black relative">
                          <div className="absolute -top-3 -left-3 bg-black text-white px-3 py-1 text-xs font-bold rounded rotate-[-5deg]">VETTED TALENT</div>
                          {[1,2,3].map((_, i) => (
                             <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                                <div>
                                   <div className="font-bold">Video Editor</div>
                                   <div className="text-xs text-gray-500">Premiere Pro • After Effects</div>
                                </div>
                                <div className="font-mono font-bold text-green-600">₹800/hr</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
         </RevealOnScroll>
      </section>

      {/* --- FEEDBACK TERMINAL --- */}
      <section className="py-24 px-6 border-t border-white/10 relative">
        <RevealOnScroll>
           <div className="max-w-3xl mx-auto">
              <div className="bg-[#050505] border border-white/10 rounded-3xl p-1 overflow-hidden shadow-2xl">
                 <div className="bg-[#111] px-4 py-2 flex items-center gap-2 border-b border-white/5">
                    <div className="flex gap-1.5">
                       <div className="w-3 h-3 rounded-full bg-red-500"/>
                       <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                       <div className="w-3 h-3 rounded-full bg-green-500"/>
                    </div>
                    <div className="text-xs text-gray-500 font-mono ml-2">feedback_terminal.exe</div>
                 </div>
                 
                 <div className="p-8 md:p-12">
                    <h2 className="text-3xl font-bold mb-8 text-white">Transimit Message <span className="animate-pulse">_</span></h2>
                    
                    {feedbackStatus === 'success' ? (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                          <CheckCircle size={64} className="text-green-500 mx-auto mb-4"/>
                          <h3 className="text-2xl font-bold text-white">Transmission Received.</h3>
                          <p className="text-gray-500 font-mono mt-2">Ticket ID: #{Math.floor(Math.random()*9000)+1000}</p>
                       </motion.div>
                    ) : (
                       <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-mono uppercase">User Identity</label>
                                <input 
                                  type="text" 
                                  value={feedbackForm.name}
                                  onChange={e => setFeedbackForm({...feedbackForm, name: e.target.value})}
                                  placeholder="GhostUser01"
                                  className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-[#ccff00] focus:outline-none transition-colors font-mono text-sm"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-mono uppercase">Comms Channel (Email)</label>
                                <input 
                                  type="email" 
                                  value={feedbackForm.email}
                                  onChange={e => setFeedbackForm({...feedbackForm, email: e.target.value})}
                                  placeholder="you@proton.me"
                                  className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-[#ccff00] focus:outline-none transition-colors font-mono text-sm"
                                />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs text-gray-500 font-mono uppercase">Payload</label>
                             <textarea 
                                value={feedbackForm.message}
                                onChange={e => setFeedbackForm({...feedbackForm, message: e.target.value})}
                                placeholder="Report a bug or suggest a feature..."
                                className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-[#ccff00] focus:outline-none transition-colors font-mono text-sm min-h-[120px] resize-none"
                                required
                             />
                          </div>
                          <button 
                             disabled={feedbackStatus === 'loading'}
                             className="w-full bg-white text-black font-black py-4 rounded-lg hover:bg-[#ccff00] transition-colors font-mono uppercase flex items-center justify-center gap-2 hover-target"
                          >
                             {feedbackStatus === 'loading' ? <Loader2 className="animate-spin"/> : <>Execute Send <Send size={16}/></>}
                          </button>
                       </form>
                    )}
                 </div>
              </div>
           </div>
        </RevealOnScroll>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black text-white pt-20 pb-10 border-t border-white/10 relative z-10">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
               <h3 className="text-2xl font-black tracking-tighter">TeenVerseHub<span className="text-[#ccff00]">.</span></h3>
               <p className="text-gray-500 text-sm leading-relaxed">Built by teens, for teens. We are building the safest, most powerful economy for the next generation. From India 🇮🇳 to the world.</p>
               <div className="flex gap-4">
                  {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                     <a key={i} href="#!" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-all hover-target"><Icon size={18}/></a>
                  ))}
               </div>
            </div>
            
            {[
               { title: "Platform", links: ['Explore Gigs', 'Post Job', 'Login', 'Parent Portal'] },
               { title: "Legal", links: ['Terms', 'Privacy', 'Refunds'] },
               { title: "Support", links: ['Safety Center', 'Report Abuse', 'Contact'] },
            ].map((col, i) => (
               <div key={i}>
                  <h4 className="font-bold uppercase tracking-widest text-xs text-gray-600 mb-6">{col.title}</h4>
                  <ul className="space-y-4 text-sm font-medium text-gray-400">
                     {col.links.map(link => (
                        <li key={link}>
                           <button onClick={() => handleFooterLink(link)} className="hover:text-white transition-colors hover:translate-x-1 duration-200 inline-block text-left">
                              {link}
                           </button>
                        </li>
                     ))}
                  </ul>
               </div>
            ))}
         </div>
         
         <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 font-mono">
            <div>© 2025 TeenVerseHub System Operational.</div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Encrypted Connection
            </div>
         </div>
      </footer>
    </div>
  );
};
export default LandingPage;