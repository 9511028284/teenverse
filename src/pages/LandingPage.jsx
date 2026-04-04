import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Star, Zap, Heart, TrendingUp, ArrowRight, CheckCircle, 
  Loader2, DollarSign, ShieldCheck, Lock, Menu, X, 
  Sun, Moon, Instagram, Twitter, Linkedin, Send, Code, Users, Briefcase, AlertTriangle,
  Layout, Video, PenTool, Globe, Sparkles, Sprout, XCircle, HelpCircle, Wallet, CheckCircle2
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView, AnimatePresence } from 'framer-motion';

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
        rotateY: useTransform(mouseX, [-200, 200], [-7, 7]),
        rotateX: useTransform(mouseY, [-200, 200], [7, -7]),
        transformStyle: "preserve-3d",
      }}
      className={`relative transition-all duration-200 ease-out ${className}`}
    >
      {children}
    </motion.div>
  );
};

// --- 2. UTILITY: SCROLL REVEAL WRAPPER ---
const RevealOnScroll = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- 3. CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  :root { 
    --primary: #6366f1;
    --accent-lime: #ccff00; 
  }
  body { 
    font-family: 'Inter', sans-serif; 
    overflow-x: hidden;
  }
  h1, h2, h3, h4, h5, h6, button { 
    font-family: 'Space Grotesk', sans-serif;
  }
  
  .custom-cursor {
    position: fixed; top: 0; left: 0; width: 20px; height: 20px;
    background: var(--accent-lime); border-radius: 50%; pointer-events: none; z-index: 9999;
    mix-blend-mode: exclusion; transition: transform 0.1s;
  }
  .custom-cursor.hovered { 
    transform: scale(4);
    background: white; mix-blend-mode: difference; 
  }
  
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
`;

const LandingPage = ({ setView, darkMode, toggleTheme, onLegalClick }) => {
  // --- STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('creators');

  // --- ANIMATION HOOKS ---
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
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
  const handleNav = (target) => {
    if (!setView) return;
    const viewMap = {
        'get started': 'auth',
        'auth': 'auth',
        'login': 'auth',
        'start earning': 'auth',
        'parent portal': 'parent-login',
        'hire talent': 'auth',
        'home': 'landing',
        'about us': 'about',
        'faq': 'faq', // ✅ Added FAQ
        'safety': 'safety' // ✅ Added Safety
    };
    const cleanTarget = target.toLowerCase();
    
    if (viewMap[cleanTarget]) {
        setView(viewMap[cleanTarget]);
        window.scrollTo(0,0);
        setIsMobileMenuOpen(false);
        return;
    }

    const sectionIdMap = {
      'how it works': 'how-it-works',
      'explore': 'explore'
    };
    const sectionId = sectionIdMap[cleanTarget] || cleanTarget;
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleFooterLink = (link) => {
      const lower = link.toLowerCase();
      if (lower.includes('terms') && onLegalClick) { onLegalClick('terms'); return; }
      if (lower.includes('privacy') && onLegalClick) { onLegalClick('privacy'); return; }
      if (lower.includes('refund') && onLegalClick) { onLegalClick('disputes'); return; } 
      if (lower === 'safety center' || lower === 'safety') { handleNav('safety'); return; } 
      
      handleNav(link);
  };

  return (
    <div className={`relative min-h-screen selection:bg-[#ccff00] selection:text-black transition-colors duration-500 ${darkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9ff] text-slate-900'}`}>
      
      <Helmet>
        <title>TeenVerseHub – Verified Digital Creator Marketplace</title>
        <meta name="description" content="Secure digital services marketplace for creators in India. Build your portfolio with verified clients and secure payment processing." />
      </Helmet>

      <style>{styles}</style>
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* Dynamic Backgrounds */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${darkMode ? 'bg-grid-pattern text-white opacity-5' : 'bg-grid-pattern text-indigo-900 opacity-5'}`}></div>
      
      {/* Light Mode Floating Elements */}
      {!darkMode && (
        <>
          <div className="fixed top-20 right-[10%] w-64 h-64 bg-indigo-300/30 rounded-full blur-3xl animate-float pointer-events-none" />
          <div className="fixed bottom-20 left-[5%] w-72 h-72 bg-lime-300/30 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
        </>
      )}

      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1.5 bg-[#ccff00] origin-left z-[100]" />

      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100 }}
        className="fixed w-full z-50 top-0 py-4 px-6"
      >
        <div className={`max-w-7xl mx-auto rounded-2xl px-6 py-3 flex justify-between items-center shadow-2xl relative z-50 transition-all ${darkMode ?
        'bg-black/80 backdrop-blur-xl border border-white/10' : 'bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-indigo-100/50'}`}>
           <div className="flex items-center gap-3 cursor-pointer hover-target group" onClick={() => handleNav('home')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white group-hover:rotate-12 transition-transform">
                T<span className="text-[#ccff00]">.</span>
              </div>
              <span className={`font-bold tracking-tighter text-xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>TeenVerseHub</span>
           </div>

           {/* Desktop Menu */}
           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
              {/* ✅ Added Safety & FAQ to Desktop Navbar */}
              {['About Us', 'How it Works', 'Safety', 'FAQ'].map((item) => (
                <button key={item} onClick={() => handleNav(item)} className={`transition-colors hover-target ${darkMode ? 'text-gray-300 hover:text-[#ccff00]' : 'text-slate-600 hover:text-indigo-600'}`}>{item}</button>
              ))}
              <div className={`w-px h-4 ${darkMode ? 'bg-white/20' : 'bg-slate-200'}`}></div>
              <button onClick={toggleTheme} className={`hover-target p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-slate-100 text-indigo-600'}`}>
                {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
              <button onClick={() => handleNav('auth')} className={`px-6 py-2 rounded-xl transition-all hover:scale-105 font-black hover-target ${darkMode ? 'bg-white text-black hover:bg-[#ccff00]' : 'bg-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-200 hover:bg-indigo-700'}`}>
                GET STARTED
              </button>
           </div>
           
           {/* Mobile Toggle */}
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`md:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'}`}>
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
              <div className={`border rounded-2xl p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl ${darkMode ? 'bg-[#0a0a0a] border-white/15' : 'bg-white border-indigo-100'}`}>
                 <div className="flex flex-col gap-4">
                   {/* ✅ Added Safety & FAQ to Mobile Navbar */}
                   {['About Us', 'How it Works', 'Safety', 'FAQ'].map((item) => (
                     <button 
                       key={item} 
                       onClick={() => handleNav(item)} 
                       className={`text-left text-lg font-bold transition-colors flex items-center justify-between group py-2 ${darkMode ? 'text-gray-300 hover:text-[#ccff00]' : 'text-slate-700 hover:text-indigo-600'}`}
                     >
                       {item}
                       <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`} />
                     </button>
                   ))}
                 </div>
                 <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}></div>
                 <div className="flex items-center justify-between font-mono text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Switch Theme</span>
                    <button onClick={toggleTheme} className={`p-3 rounded-full ${darkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600'}`}>
                      {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
                    </button>
                 </div>
                 <button 
                   onClick={() => handleNav('auth')} 
                   className={`w-full py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg ${darkMode ? 'bg-[#ccff00] text-black' : 'bg-indigo-600 text-white'}`}
                 >
                   Get Started <Rocket size={18} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20">
         <motion.div 
           animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none ${darkMode ? 'bg-indigo-600/10' : 'bg-indigo-400/20'}`} 
         />
         
         <div className="relative z-10 max-w-5xl">
            <RevealOnScroll>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold tracking-widest mb-8 ${darkMode ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                <ShieldCheck size={14} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'} />
                VERIFIED & SECURE PLATFORM
              </div>
            </RevealOnScroll>

            <motion.h1 
              style={{ y: heroY }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }}
              className={`text-5xl md:text-8xl font-black leading-[1.1] tracking-tighter mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}
            >
              Turn Skills Into <br/>
              <span className={`text-transparent bg-clip-text ${darkMode ? 'bg-gradient-to-r from-[#ccff00] to-green-400' : 'bg-gradient-to-r from-indigo-600 to-purple-500'}`}>Real Experience.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className={`text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}
            >
              A digital services marketplace for creators and clients. Gain real project experience and build a portfolio—all with <span className={darkMode ? 'text-white font-bold' : 'text-indigo-700 font-bold'}>secure payment processing</span> and accounts operated with guardian consent where required.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <motion.button 
                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 onClick={() => handleNav('auth')}
                 className={`hover-target relative px-10 py-5 font-black text-lg rounded-2xl flex items-center gap-3 transition-shadow ${darkMode ? 'bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)]' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300'}`}
               >
                  I'M A CREATOR <Rocket size={20}/>
               </motion.button>
               <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleNav('auth')}
                  className={`hover-target px-10 py-5 border rounded-2xl font-bold flex items-center gap-3 ${darkMode ? 'border-white/10 bg-white/5 backdrop-blur text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-md'}`}
               >
                  HIRE TALENT <ArrowRight size={20}/>
               </motion.button>
            </div>
            
            <div className={`mt-8 flex items-center justify-center gap-6 text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/>Verified Users</span>
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> 100% Payment Protection</span>
            </div>
         </div>
      </section>

      {/* --- SKILLS GRID SECTION --- */}
      <section className={`relative py-24 px-6 border-y overflow-hidden ${darkMode ? 'bg-[#080808] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none translate-x-1/3 -translate-y-1/3 ${darkMode ? 'bg-[#ccff00]' : 'bg-indigo-400'}`} />
        <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none -translate-x-1/3 translate-y-1/3 ${darkMode ? 'bg-purple-900' : 'bg-pink-300'}`} />

        <div className="max-w-7xl mx-auto relative z-10">
          <RevealOnScroll>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
              <div className="max-w-xl">
                <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Skills in <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Demand.</span>
                </h2>
                <p className={`text-lg ${darkMode ? "text-gray-400" : "text-slate-600"}`}>
                  What are you good at? Start earning with these popular categories.
                </p>
              </div>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Video, label: "Video Editing", color: "bg-blue-500" },
              { icon: Layout, label: "UI Design", color: "bg-purple-500" },
              { icon: PenTool, label: "Content Writing", color: "bg-orange-500" },
              { icon: Code, label: "Web Dev", color: "bg-emerald-500" },
              { icon: Sparkles, label: "AI Art", color: "bg-pink-500" },
              { icon: Globe, label: "Translation", color: "bg-indigo-500" },
              { icon: TrendingUp, label: "Social Media", color: "bg-cyan-500" },
              { icon: Users, label: "Community", color: "bg-rose-500" },
            ].map((item, i) => (
              <RevealOnScroll key={i} delay={i * 0.05}>
                <motion.div 
                  whileHover="hover"
                  initial="initial"
                  variants={{
                    initial: { y: 0, scale: 1 },
                    hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }
                  }}
                  className={`group relative p-6 rounded-2xl border transition-colors overflow-hidden cursor-pointer ${
                    darkMode ? 'bg-[#111] border-white/10 hover:border-white/20' : 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${item.color}`} />
                  
                  <motion.div 
                    variants={{
                      initial: { rotate: 0, scale: 1 },
                      hover: { rotate: [0, -15, 15, -5, 5, 0], scale: 1.1, transition: { duration: 0.6 } }
                    }}
                    className={`relative w-12 h-12 ${item.color} rounded-xl mb-6 flex items-center justify-center text-white shadow-lg z-10`}
                  >
                    <item.icon size={24} />
                  </motion.div>
                  
                  <h4 className={`font-bold text-lg relative z-10 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {item.label}
                  </h4>

                  <motion.div
                    variants={{
                      initial: { x: -15, opacity: 0 },
                      hover: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } }
                    }}
                    className={`absolute bottom-6 right-6 ${darkMode ? 'text-white/50' : 'text-slate-400'}`}
                  >
                    <ArrowRight size={20} />
                  </motion.div>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section id="how-it-works" className={`relative py-24 px-6 overflow-hidden ${darkMode ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] blur-[150px] opacity-20 pointer-events-none ${darkMode ? 'bg-[#ccff00]' : 'bg-indigo-300'}`} />

        <div className="max-w-7xl mx-auto relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Safe Work, <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Secure Payments.</span>
              </h2>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                Our system ensures protected transactions from start to finish.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Briefcase, title: "1. Post & Pitch", desc: "Clients post jobs. Verified creators pitch their skills." },
              { icon: Lock, title: "2. Secure Payments", desc: "Payments are processed securely through our trusted payment gateways.", active: true },
              { icon: Code, title: "3. Create", desc: "Work happens in our monitored, safe chat environment." },
              { icon: DollarSign, title: "4. Get Paid", desc: "Client approves. Funds are securely released." }
            ].map((step, i) => (
              <div key={i} className="relative h-full">
                {i < 3 && (
                  <div className="hidden md:block absolute top-14 -right-8 w-8 h-[2px] overflow-hidden rounded-full z-0">
                    <div className={`absolute inset-0 ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                      className={`absolute inset-0 w-full h-full ${darkMode ? 'bg-gradient-to-r from-transparent via-[#ccff00] to-transparent' : 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent'}`}
                    />
                  </div>
                )}

                <RevealOnScroll delay={i * 0.15}>
                  <motion.div 
                    whileHover="hover"
                    initial="initial"
                    animate={step.active ? "pulse" : "initial"}
                    variants={{
                      initial: { y: 0, scale: 1 },
                      hover: { y: -10, transition: { type: "spring", stiffness: 300, damping: 20 } },
                      pulse: { 
                        boxShadow: darkMode 
                          ? ["0px 0px 0px rgba(204,255,0,0)", "0px 0px 20px rgba(204,255,0,0.15)", "0px 0px 0px rgba(204,255,0,0)"]
                          : ["0px 0px 0px rgba(79,70,229,0)", "0px 10px 30px rgba(79,70,229,0.15)", "0px 0px 0px rgba(79,70,229,0)"],
                        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }
                    }}
                    className={`group relative p-8 rounded-3xl border h-full overflow-hidden z-10 bg-clip-padding backdrop-filter backdrop-blur-sm ${
                      darkMode 
                        ? (step.active ? 'bg-[#1a1a1a] border-[#ccff00]/50' : 'bg-[#111] border-white/10 hover:border-white/20') 
                        : (step.active ? 'bg-white border-indigo-400' : 'bg-white border-slate-200 hover:border-indigo-200')
                    }`}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${darkMode ? 'bg-[#ccff00]' : 'bg-indigo-600'}`} />

                    <motion.div 
                      variants={{
                        initial: { rotate: 0, scale: 1 },
                        hover: { rotate: [0, -10, 10, -5, 5, 0], scale: 1.1, transition: { duration: 0.5 } }
                      }}
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
                        step.active 
                          ? (darkMode ? 'bg-[#ccff00] text-black shadow-[#ccff00]/20' : 'bg-indigo-600 text-white shadow-indigo-500/30') 
                          : (darkMode ? 'bg-white/5 text-white' : 'bg-indigo-50 text-indigo-600')
                      }`}
                    >
                      <step.icon size={26} strokeWidth={step.active ? 2.5 : 2} />
                    </motion.div>
                    
                    <h3 className={`relative z-10 text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    
                    <p className={`relative z-10 text-sm leading-relaxed ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`}>
                      {step.desc}
                    </p>
                  </motion.div>
                </RevealOnScroll>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- WHY TEENVERSEHUB IS DIFFERENT (Bento Box Layout) --- */}
      <section className={`py-24 px-6 relative overflow-hidden ${darkMode ? 'bg-[#050505]' : 'bg-white'}`}>
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none translate-x-1/2 -translate-y-1/2 ${darkMode ? 'bg-[#ccff00]' : 'bg-indigo-400'}`} />

        <div className="max-w-7xl mx-auto relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Why TeenVerseHub is <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Built Differently</span>
              </h2>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-slate-600"}`}>
                Not just another freelance platform — built specifically for teenagers starting their journey.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {[
              { 
                icon: ShieldCheck, title: "Designed for Teen Safety", desc: "Every feature is built keeping teens in mind — from secure chats to monitored interactions.", 
                color: "text-emerald-500", bg: "bg-emerald-500/10", gridClass: "md:col-span-2", flexClass: "flex flex-col sm:flex-row items-start sm:items-center gap-6"
              },
              { 
                icon: Sprout, title: "Beginner-Friendly Start", desc: "No experience? No problem. Start small, learn fast, and grow with real opportunities.", 
                color: "text-blue-500", bg: "bg-blue-500/10", gridClass: "md:col-span-1 md:row-span-2", flexClass: "flex flex-col h-full justify-center gap-6"
              },
              { 
                icon: Users, title: "Guardian Awareness", desc: "We ensure transparency so parents stay informed and confident.", 
                color: "text-purple-500", bg: "bg-purple-500/10", gridClass: "md:col-span-1", flexClass: "flex flex-col gap-4"
              },
              { 
                icon: Briefcase, title: "Real Opportunities", desc: "Get access to actual work — not just a profile sitting idle.", 
                color: "text-orange-500", bg: "bg-orange-500/10", gridClass: "md:col-span-1", flexClass: "flex flex-col gap-4"
              },
              { 
                icon: Zap, title: "No Overwhelming Competition", desc: "Unlike crowded marketplaces, you get a fair chance to grow without fighting veterans.", 
                color: "text-pink-500", bg: "bg-pink-500/10", gridClass: "md:col-span-2 lg:col-span-3", flexClass: "flex flex-col md:flex-row items-start md:items-center gap-6"
              }
            ].map((feature, i) => (
              <RevealOnScroll key={i} delay={i * 0.1} className={feature.gridClass}>
                <motion.div 
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`p-8 rounded-3xl border h-full transition-all group overflow-hidden relative ${
                    darkMode ? 'bg-[#111] border-white/5 hover:border-white/20' : 'bg-slate-50 border-slate-100 hover:shadow-xl hover:shadow-indigo-50 hover:bg-white'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${feature.bg.split('/')[0]}`} />
                  
                  <div className={`relative z-10 ${feature.flexClass}`}>
                    <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${feature.bg} ${feature.color}`}>
                      <feature.icon size={32} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                      <p className={`leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROBLEMS ON OTHER PLATFORMS --- */}
      <section className={`py-24 px-6 border-t relative ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="mb-16">
              <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Why Existing Platforms <br/><span className="text-rose-500">Don’t Work for Teens</span>
              </h2>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-slate-600"}`}>
                Most platforms are built for professionals — not beginners.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: XCircle, title: "Too Competitive", desc: "Teens struggle to get their first client among experienced freelancers." },
              { icon: AlertTriangle, title: "Lack of Safety", desc: "No dedicated protection layer or moderation for young users." },
              { icon: HelpCircle, title: "No Guidance", desc: "Beginners are left confused without direction or support." },
              { icon: Wallet, title: "Hard to Earn First", desc: "Getting started feels impossible without experience or ratings." },
            ].map((problem, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className={`p-6 rounded-2xl border-l-4 h-full ${darkMode ? 'bg-[#111] border-l-rose-500/50' : 'bg-white border-l-rose-400 shadow-sm'}`}>
                  <problem.icon className="text-rose-500 mb-4" size={24} />
                  <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{problem.title}</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{problem.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className={`relative p-8 md:p-12 rounded-3xl overflow-hidden text-center flex flex-col md:flex-row items-center justify-center gap-6 ${darkMode ? 'bg-gradient-to-r from-[#1a1a1a] to-[#222] border border-white/10' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'}`}
            >
              {darkMode && <div className="absolute inset-0 bg-gradient-to-r from-[#ccff00]/10 to-transparent pointer-events-none" />}
              <ArrowRight className={darkMode ? 'text-[#ccff00]' : 'text-indigo-200'} size={40} />
              <h3 className={`text-xl md:text-2xl font-medium max-w-3xl text-left ${darkMode ? 'text-white' : 'text-white'}`}>
                That’s exactly why we built <span className={`font-black ${darkMode ? 'text-[#ccff00]' : 'text-white'}`}>TeenVerseHub</span> — a platform where teens can start safely, confidently, and successfully.
              </h3>
            </motion.div>
          </RevealOnScroll>
        </div>
      </section>

{/* --- COMPARISON TABLE (Pro Upgrade & Mobile Optimized) --- */}
      <section className={`py-16 md:py-24 px-4 sm:px-6 border-t relative overflow-hidden ${darkMode ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                The TeenVerseHub <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Advantage</span>
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className={`relative rounded-2xl md:rounded-3xl border overflow-hidden ${darkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>
              
              {/* Continuous Highlight Pillar */}
              <div className={`absolute top-0 bottom-0 left-1/3 w-1/3 pointer-events-none ${
                darkMode ? 'bg-gradient-to-b from-[#ccff00]/10 via-[#ccff00]/5 to-transparent' : 'bg-gradient-to-b from-indigo-50 via-indigo-50/30 to-transparent'
              }`} />

              {/* Table Header */}
              <div className={`grid grid-cols-3 p-4 sm:p-6 md:p-8 border-b items-end ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <div className={`text-[10px] sm:text-sm md:text-base font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Features
                </div>
                
                <div className="relative text-center flex flex-col items-center justify-center">
                  <span className={`absolute -top-5 md:-top-6 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap ${
                    darkMode ? 'bg-[#ccff00] text-black shadow-[#ccff00]/20' : 'bg-indigo-600 text-white shadow-indigo-500/30'
                  }`}>
                    Built for you
                  </span>
                  <div className={`text-sm sm:text-xl md:text-2xl font-black ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`}>
                    TeenVerseHub
                  </div>
                </div>
                
                <div className={`text-center text-[10px] sm:text-sm md:text-base font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Other <span className="hidden sm:inline">Platforms</span>
                </div>
              </div>

              {/* Table Rows */}
              <div className="flex flex-col">
                {[
                  { feature: "Built for Teens", tvh: "Yes", other: "No", tvhIcon: CheckCircle2, otherIcon: XCircle },
                  { feature: "Beginner Friendly", tvh: "Easy Start", other: "Difficult", tvhIcon: CheckCircle2, otherIcon: AlertTriangle },
                  { feature: "Safety Focus", tvh: "High Priority", other: "Limited", tvhIcon: CheckCircle2, otherIcon: AlertTriangle },
                  { feature: "Guardian Transparency", tvh: "Available", other: "Not Available", tvhIcon: CheckCircle2, otherIcon: XCircle },
                  { feature: "First Earning Support", tvh: "Guided", other: "None", tvhIcon: CheckCircle2, otherIcon: XCircle },
                  { feature: "Competition Level", tvh: "Balanced", other: "Very High", tvhIcon: CheckCircle2, otherIcon: XCircle },
                ].map((row, i) => (
                  <div 
                    key={i} 
                    className={`grid grid-cols-3 p-3 sm:p-5 md:p-6 items-center relative transition-colors group ${
                      darkMode ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50/80 border-slate-100'
                    } ${i !== 5 ? 'border-b' : ''}`}
                  >
                    {/* Feature Name */}
                    <div className={`text-xs sm:text-sm md:text-lg font-medium pl-1 sm:pl-2 md:pl-4 pr-2 leading-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {row.feature}
                    </div>
                    
                    {/* TeenVerseHub Column - Stacks icon and text on mobile */}
                    <div className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center font-bold relative z-10 ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`}>
                      <row.tvhIcon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-[10px] sm:text-sm md:text-base leading-none">{row.tvh}</span>
                    </div>
                    
                    {/* Other Platforms Column - Stacks icon and text on mobile */}
                    <div className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center font-medium ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                      <row.otherIcon className="w-4 h-4 md:w-[18px] md:h-[18px] opacity-50" />
                      <span className="text-[10px] sm:text-sm md:text-base leading-none">{row.other}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <p className={`mt-6 md:mt-8 px-4 text-center text-xs sm:text-sm md:text-base font-medium italic ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              “TeenVerseHub isn’t about competing with professionals — <span className={darkMode ? 'text-white not-italic' : 'text-slate-900 not-italic'}>it’s about helping you become one.</span>”
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* --- FLIP SECTION: CREATORS VS GUARDIANS --- */}
      <section className={`py-24 px-6 perspective-1000 border-t ${darkMode ? 'bg-[#050505] border-white/5' : 'bg-white border-slate-100'}`}>
         <RevealOnScroll>
           <div className="max-w-5xl mx-auto">
              
              {/* Toggle Switch (FIXED LAYOUT) */}
              <div className="flex justify-center mb-16">
                <div className={`p-1 rounded-full border flex relative ${darkMode ? 'bg-black border-white/20' : 'bg-slate-100 border-slate-200'}`}>
                  
                  {/* Creators Button */}
                  <button 
                    onClick={() => setActiveTab('creators')} 
                    className={`relative px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-colors ${
                      activeTab === 'creators' ? (darkMode ? 'text-black' : 'text-indigo-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')
                    }`}
                  >
                    {activeTab === 'creators' && (
                      <motion.div 
                        layoutId="active-tab-indicator"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute inset-0 rounded-full ${darkMode ? 'bg-[#ccff00]' : 'bg-white shadow-md'}`}
                      />
                    )}
                    <span className="relative z-10">For Creators</span>
                  </button>

                  {/* Guardians Button */}
                  <button 
                    onClick={() => setActiveTab('parents')} 
                    className={`relative px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-colors ${
                      activeTab === 'parents' ? (darkMode ? 'text-black' : 'text-indigo-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')
                    }`}
                  >
                    {activeTab === 'parents' && (
                      <motion.div 
                        layoutId="active-tab-indicator"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute inset-0 rounded-full ${darkMode ? 'bg-[#ccff00]' : 'bg-white shadow-md'}`}
                      />
                    )}
                    <span className="relative z-10">For Guardians</span>
                  </button>
                </div>
              </div>

              {/* Content Container */}
              <div className={`border rounded-[3rem] p-8 md:p-16 overflow-hidden relative shadow-2xl ${darkMode ? 'bg-black border-white/10' : 'bg-indigo-50/50 border-indigo-100 shadow-indigo-100/50'}`}>
                 <AnimatePresence mode="wait">
                    {activeTab === 'creators' ? (
                        <motion.div 
                            key="creators"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col md:flex-row items-center gap-12"
                        >
                            <div className="flex-1 space-y-6">
                                <h3 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Your First Project,<br/> <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Your Way.</span></h3>
                                <p className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Stop working for "exposure". Build a real portfolio with real clients. We handle the invoices and awkward money talks.</p>
                                <ul className="space-y-4">
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><Star size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}/> Build a verified CV</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><Star size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}/> Secure Payment Processing</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><Star size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}/> Gain Real Experience</li>
                                </ul>
                                <button onClick={() => handleNav('auth')} className={`mt-4 px-8 py-3 font-bold rounded-xl transition-colors ${darkMode ? 'bg-white text-black hover:bg-[#ccff00]' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}>Start Profile</button>
                            </div>
                            <div className="flex-1">
                                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" alt="Creator" className="rounded-3xl border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-500" />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="parents"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col md:flex-row-reverse items-center gap-12"
                        >
                            <div className="flex-1 space-y-6">
                                <h3 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Digital Skills,<br/> <span className="text-indigo-500">Safely Practiced.</span></h3>
                                <p className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Give creators a head start in the digital economy without the risks of the open web. You stay in control.</p>
                                <ul className="space-y-4">
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><ShieldCheck size={18} className="text-indigo-500"/> Accounts Operated with Guardian Consent</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><ShieldCheck size={18} className="text-indigo-500"/> Curated, Safe Job Categories</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><ShieldCheck size={18} className="text-indigo-500"/> No Personal Contact Details Shared</li>
                                </ul>
                                <button onClick={() => handleNav('safety')} className="mt-4 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">View Safety Hub</button>
                            </div>
                            <div className="flex-1">
                                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" alt="Guardian and Creator" className="rounded-3xl border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-500" />
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
         </RevealOnScroll>
      </section>

      {/* --- ✅ NEW SECTION: SAFETY & FAQ TEASER --- */}
      <section className={`py-24 px-6 border-t ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Safety Teaser Box */}
            <RevealOnScroll>
              <div className={`p-10 md:p-12 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between h-full ${darkMode ? 'bg-[#111] border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-30 pointer-events-none ${darkMode ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                <div>
                  <ShieldCheck size={40} className={`mb-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h3 className={`text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Trust & Safety</h3>
                  <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    We've built TeenVerseHub with a secure, monitored, and parent-approved ecosystem from the ground up. Discover how we protect our community.
                  </p>
                </div>
                <button 
                  onClick={() => handleNav('safety')}
                  className={`inline-flex items-center justify-center gap-2 font-bold w-fit px-6 py-3 rounded-xl transition-all ${darkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-200/50 text-emerald-700 hover:bg-emerald-200'}`}
                >
                  View Safety Hub <ArrowRight size={18} />
                </button>
              </div>
            </RevealOnScroll>

            {/* FAQ Teaser Box */}
            <RevealOnScroll delay={0.2}>
              <div className={`p-10 md:p-12 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between h-full ${darkMode ? 'bg-[#111] border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-30 pointer-events-none ${darkMode ? 'bg-blue-500' : 'bg-blue-400'}`} />
                <div>
                  <HelpCircle size={40} className={`mb-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Got Questions?</h3>
                  <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    How do payments work? Do I need experience? Find answers to all your questions and learn everything you need to know to get started.
                  </p>
                </div>
                <button 
                  onClick={() => handleNav('faq')}
                  className={`inline-flex items-center justify-center gap-2 font-bold w-fit px-6 py-3 rounded-xl transition-all ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-200/50 text-blue-700 hover:bg-blue-200'}`}
                >
                  Read the FAQ <ArrowRight size={18} />
                </button>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* --- TRUSTED PLATFORM FEATURES --- */}
      <section className={`py-12 border-t ${darkMode ? 'bg-black border-white/5' : 'bg-[#f8f9ff] border-slate-200'}`}>
         <RevealOnScroll>
            <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-bold uppercase tracking-wider">
               <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                 <CheckCircle size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-500'} /> Secure Identity Verification
               </span>
               <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                 <Lock size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-500'} /> Secure Payment Processing
               </span>
               <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                 <ShieldCheck size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-500'} /> Protected Communication
               </span>
               <span className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                 <Users size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-500'} /> No Direct Contact Sharing
               </span>
            </div>
         </RevealOnScroll>
      </section>

      {/* --- FEEDBACK / SUGGESTIONS --- */}
      <section className={`py-24 px-6 border-t ${darkMode ? 'bg-black border-white/10' : 'bg-slate-900 border-slate-800'}`}>
        <RevealOnScroll>
           <div className="max-w-3xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl text-center">
               <div className="flex items-center justify-center gap-3 mb-6">
                   <div className="w-3 h-3 rounded-full bg-red-500"/>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                   <div className="w-3 h-3 rounded-full bg-green-500"/>
                   <span className="text-xs font-mono text-gray-500 ml-2">feedback_terminal.exe</span>
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Help us build the future.</h2>
               <p className="text-gray-400 mb-8 text-sm">Found a bug? Want a new feature? We are listening.</p>
               
               <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                   <div className="text-amber-400 font-mono flex items-center justify-center gap-2">
                       <AlertTriangle size={18}/> Feedback system coming soon.
                   </div>
                   <p className="text-gray-400 text-sm mt-3">In the meantime, please email your thoughts to support@teenversehub.in</p>
               </div>
           </div>
        </RevealOnScroll>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`pt-20 pb-10 border-t ${darkMode ? 'bg-black border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 items-start">
            
            {/* 1. Brand & Disclaimer */}
            <div className="space-y-6">
              <h3 className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                TeenVerseHub<span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>.</span>
              </h3>
              <div className={`text-sm leading-relaxed space-y-4 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                <p>Empowering creators and digital talent across India. Built for safety, scale, and success.</p>
                <div className={`p-4 rounded-lg border text-xs space-y-2 ${darkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-indigo-50/50 border-indigo-100 text-slate-600'}`}>
                  <p><strong>Disclaimer:</strong> TeenVerseHub is a technology platform connecting clients with freelancers. We do not provide services directly.</p>
                  <p>Payments are processed through secure third-party payment partners. TeenVerseHub does not hold customer funds.</p>
                </div>
              </div>
              <div className="flex gap-4">
                {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#!" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-white/5 text-white hover:bg-[#ccff00] hover:text-black' : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}>
                    <Icon size={16}/>
                  </a>
                ))}
              </div>
            </div>

            {/* 2. Company Links */}
            <div className="md:pl-8">
              <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Company</h4>
              <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                {/* ✅ Updated Company Links to include FAQ */}
                {['About Us', 'FAQ', 'Careers', 'Blog', 'Contact'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Legal Links */}
            <div className="md:pl-4">
              <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Legal & Trust</h4>
              <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                {/* ✅ Updated Legal Links to include Safety Center */}
                {['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Safety Center'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Legal Entity Card */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h4 className={`font-bold text-xs uppercase mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <AlertTriangle size={14} className="text-amber-500"/> Legal & Contact
              </h4>
              <div className={`text-xs font-mono space-y-2 ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <p className={`font-bold text-sm ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`}>Operated by Mohd Asif</p>
                <p className="opacity-80">(Proprietor)</p>
                <p>Mahoba, Uttar Pradesh, India</p>
                <div className="pt-2">
                  <p className={darkMode ? 'text-gray-500' : 'text-slate-400'}>Support:</p>
                  <a href="mailto:support@teenversehub.in" className={`hover:underline break-all ${darkMode ? 'text-white' : 'text-indigo-600'}`}>
                    support@teenversehub.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono ${darkMode ? 'border-white/10 text-gray-600' : 'border-slate-200 text-slate-500'}`}>
            <div>© {new Date().getFullYear()} TeenVerseHub. All rights reserved.</div>
            <div className="flex items-center gap-2">
              Made with ❤️ for the Future of India.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default
LandingPage;