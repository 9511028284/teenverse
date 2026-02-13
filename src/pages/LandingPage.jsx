import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Star, Zap, Heart, TrendingUp, ArrowRight, CheckCircle, 
  Loader2, DollarSign, ShieldCheck, Lock, Menu, X, 
  Sun, Moon, Instagram, Twitter, Linkedin, Send, Code, Users, Briefcase, AlertTriangle,
  Layout, Video, PenTool, Globe, Sparkles
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView, AnimatePresence } from 'framer-motion';

// --- MOCK SUPABASE (For demo purposes) ---
const mockSupabase = {
  from: () => ({
    insert: async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { error: null };
    }
  })
};
const supabase = mockSupabase; 

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
const RevealOnScroll = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// --- 3. CSS STYLES ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  :root { --primary: #6366f1; --accent-lime: #ccff00; }
  body { font-family: 'Inter', sans-serif; overflow-x: hidden; }
  h1, h2, h3, h4, h5, h6, button { font-family: 'Space Grotesk', sans-serif; }
  
  .custom-cursor {
    position: fixed; top: 0; left: 0; width: 20px; height: 20px;
    background: var(--accent-lime); border-radius: 50%; pointer-events: none; z-index: 9999;
    mix-blend-mode: exclusion; transition: transform 0.1s;
  }
  .custom-cursor.hovered { transform: scale(4); background: white; mix-blend-mode: difference; }
  
  .bg-grid-pattern {
    background-size: 40px 40px;
    background-image: linear-gradient(to right, currentColor 1px, transparent 1px),
                      linear-gradient(to bottom, currentColor 1px, transparent 1px);
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
  const [feedbackStatus, setFeedbackStatus] = useState('idle');
  const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', message: '' });
  
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
      setFeedbackStatus('idle');
    }
  };

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
    };
    const cleanTarget = target.toLowerCase();
    
    if (viewMap[cleanTarget]) {
        setView(viewMap[cleanTarget]);
        window.scrollTo(0,0);
        setIsMobileMenuOpen(false);
        return;
    }

    const sectionIdMap = {
      'safety': 'safety',
      'how it works': 'how it works',
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
      if (lower.includes('refund') && onLegalClick) { onLegalClick('refunds'); return; }
      handleNav(link);
  };

  return (
    <div className={`relative min-h-screen selection:bg-[#ccff00] selection:text-black transition-colors duration-500 ${darkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9ff] text-slate-900'}`}>
      
      <Helmet>
        <title>TeenVerseHub – India's Safest Student Freelance Marketplace</title>
        <meta name="description" content="Secure freelancing for teens (14-19) in India. Earn experience with verified clients, escrow payments, and parent supervision." />
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
        <div className={`max-w-7xl mx-auto rounded-2xl px-6 py-3 flex justify-between items-center shadow-2xl relative z-50 transition-all ${darkMode ? 'bg-black/80 backdrop-blur-xl border border-white/10' : 'bg-white/80 backdrop-blur-xl border border-indigo-100 shadow-indigo-100/50'}`}>
           <div className="flex items-center gap-3 cursor-pointer hover-target group" onClick={() => handleNav('home')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white group-hover:rotate-12 transition-transform">
                T<span className="text-[#ccff00]">.</span>
              </div>
              <span className={`font-bold tracking-tighter text-xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>TeenVerseHub</span>
           </div>

           {/* Desktop Menu */}
           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
              {['Safety', 'How it Works'].map((item) => (
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
                   {['Safety', 'How it Works'].map((item) => (
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
              India’s safest marketplace for students (14–19). Earn pocket money, build a portfolio, and learn financial literacy—all with <span className={darkMode ? 'text-white font-bold' : 'text-indigo-700 font-bold'}>secure escrow payments</span> and parent oversight.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <motion.button 
                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 onClick={() => handleNav('auth')}
                 className={`hover-target relative px-10 py-5 font-black text-lg rounded-2xl flex items-center gap-3 transition-shadow ${darkMode ? 'bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)]' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300'}`}
               >
                  I'M A TEEN <Rocket size={20}/>
               </motion.button>
               <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleNav('auth')}
                  className={`hover-target px-10 py-5 border rounded-2xl font-bold flex items-center gap-3 ${darkMode ? 'border-white/10 bg-white/5 backdrop-blur text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-md'}`}
               >
                  HIRE GEN Z <ArrowRight size={20}/>
               </motion.button>
            </div>
            
            <div className={`mt-8 flex items-center justify-center gap-6 text-xs font-mono ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/>Verified Users</span>
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> 100% Payment Protection</span>
            </div>
         </div>
      </section>

      {/* --- SKILLS GRID SECTION --- */}
      <section className={`py-24 px-6 border-y ${darkMode ? 'bg-[#080808] border-white/5' : 'bg-white border-slate-100'}`}>
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
              <div className="max-w-xl">
                <h2 className={`text-3xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Skills in <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Demand.</span></h2>
                <p className={darkMode ? "text-gray-400" : "text-slate-500"}>What are you good at? Start earning with these popular categories.</p>
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
                  whileHover={{ y: -5 }}
                  className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-[#111] border-white/5 hover:border-[#ccff00]/50' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50'}`}
                >
                  <div className={`w-12 h-12 ${item.color} rounded-xl mb-4 flex items-center justify-center text-white shadow-lg`}>
                    <item.icon size={24} />
                  </div>
                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.label}</h4>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section id="how it works" className={`py-24 px-6 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto">
            <RevealOnScroll>
                <div className="text-center mb-16">
                    <h2 className={`text-3xl md:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Safe Work, <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Secure Payments.</span></h2>
                    <p className={darkMode ? 'text-gray-400' : 'text-slate-500'}>Our escrow system ensures you never work for free.</p>
                </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { icon: Briefcase, title: "1. Post & Pitch", desc: "Clients post jobs. Verified teens pitch their skills." },
                    { icon: Lock, title: "2. Escrow Lock", desc: "Client deposits funds. Money is locked securely BEFORE work starts.", active: true },
                    { icon: Code, title: "3. Create", desc: "Work happens in our monitored, safe chat environment." },
                    { icon: DollarSign, title: "4. Get Paid", desc: "Client approves. Funds are instantly released to your wallet." }
                ].map((step, i) => (
                    <RevealOnScroll key={i} delay={i * 0.1}>
                        <div className={`relative p-8 rounded-3xl border transition-all h-full ${
                          darkMode 
                            ? (step.active ? 'bg-[#111] border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.1)]' : 'bg-black border-white/10') 
                            : (step.active ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white border-slate-200 shadow-sm')
                        }`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${step.active ? (darkMode ? 'bg-[#ccff00] text-black' : 'bg-indigo-600 text-white') : (darkMode ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600')}`}>
                                <step.icon size={24} />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{step.desc}</p>
                            {i < 3 && <div className={`hidden md:block absolute top-1/2 -right-4 w-8 h-px z-10 ${darkMode ? 'bg-white/20' : 'bg-slate-300'}`} />}
                        </div>
                    </RevealOnScroll>
                ))}
            </div>
        </div>
      </section>

      {/* --- FLIP SECTION: TEENS VS PARENTS --- */}
      <section className={`py-24 px-6 perspective-1000 border-t ${darkMode ? 'bg-[#050505] border-white/5' : 'bg-white border-slate-100'}`}>
         <RevealOnScroll>
           <div className="max-w-5xl mx-auto">
              {/* Toggle Switch */}
              <div className="flex justify-center mb-16">
                 <div className={`p-1 rounded-full border flex relative ${darkMode ? 'bg-black border-white/20' : 'bg-slate-100 border-slate-200'}`}>
                    <motion.div 
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute top-1 bottom-1 ${activeTab === 'creators' ? 'left-1 w-[140px]' : 'left-[145px] w-[140px]'} rounded-full ${darkMode ? 'bg-[#ccff00]' : 'bg-white shadow-md'}`}
                    />
                    <button 
                      onClick={() => setActiveTab('creators')} 
                      className={`relative z-10 px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'creators' ? (darkMode ? 'text-black' : 'text-indigo-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}
                    >
                      For Teens
                    </button>
                    <button 
                      onClick={() => setActiveTab('parents')} 
                      className={`relative z-10 px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'parents' ? (darkMode ? 'text-black' : 'text-indigo-600') : (darkMode ? 'text-gray-400' : 'text-slate-500')}`}
                    >
                      For Parents
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
                                <h3 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Your First Paycheck,<br/> <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Your Way.</span></h3>
                                <p className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Stop working for "exposure". Build a real portfolio with real clients. We handle the invoices and awkward money talks.</p>
                                <ul className="space-y-4">
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><Star size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}/> Build a verified CV</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><Star size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}/> Guaranteed Payment</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><Star size={18} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}/> Learn Financial Literacy</li>
                                </ul>
                                <button onClick={() => handleNav('auth')} className={`mt-4 px-8 py-3 font-bold rounded-xl transition-colors ${darkMode ? 'bg-white text-black hover:bg-[#ccff00]' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}>Start Profile</button>
                            </div>
                            <div className="flex-1">
                                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" alt="Teen Creator" className="rounded-3xl border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-500" />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="parents"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col md:flex-row-reverse items-center gap-12"
                        >
                            <div className="flex-1 space-y-6">
                                <h3 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Financial Literacy,<br/> <span className="text-indigo-500">Safely Practiced.</span></h3>
                                <p className={darkMode ? 'text-gray-400' : 'text-slate-600'}>Give your teen a head start in the digital economy without the risks of the open web. You stay in control.</p>
                                <ul className="space-y-4">
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><ShieldCheck size={18} className="text-indigo-500"/> Parent Approval Portal</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><ShieldCheck size={18} className="text-indigo-500"/> Curated, Safe Job Categories</li>
                                    <li className={`flex items-center gap-3 text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}><ShieldCheck size={18} className="text-indigo-500"/> No Personal Contact Details Shared</li>
                                </ul>
                                <button onClick={() => handleNav('auth')} className="mt-4 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">View Safety Hub</button>
                            </div>
                            <div className="flex-1">
                                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" alt="Parent and Teen" className="rounded-3xl border border-white/10 shadow-2xl hover:scale-[1.02] transition-transform duration-500" />
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
         </RevealOnScroll>
      </section>

      {/* --- FEEDBACK / SUGGESTIONS (Kept terminal style for both modes for cool factor) --- */}
      <section className={`py-24 px-6 border-t ${darkMode ? 'bg-black border-white/10' : 'bg-slate-900 border-slate-800'}`}>
        <RevealOnScroll>
           <div className="max-w-3xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
               <div className="flex items-center gap-3 mb-6">
                   <div className="w-3 h-3 rounded-full bg-red-500"/>
                   <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                   <div className="w-3 h-3 rounded-full bg-green-500"/>
                   <span className="text-xs font-mono text-gray-500 ml-2">feedback_terminal.exe</span>
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Help us build the future.</h2>
               <p className="text-gray-400 mb-8 text-sm">Found a bug? Want a new feature? We are listening.</p>
               
               {feedbackStatus === 'success' ? (
                   <div className="text-green-400 font-mono flex items-center gap-2"><CheckCircle size={16}/> Message received. Ticket #{Math.floor(Math.random()*9000)+1000}</div>
               ) : (
                   <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                       <input 
                         className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm focus:border-[#ccff00] outline-none font-mono"
                         placeholder="Your Name (Optional)"
                         value={feedbackForm.name}
                         onChange={e => setFeedbackForm({...feedbackForm, name: e.target.value})}
                       />
                       <textarea 
                         className="w-full bg-black border border-white/20 rounded-lg p-3 text-white text-sm focus:border-[#ccff00] outline-none font-mono h-32 resize-none"
                         placeholder="What features do you want to see?"
                         required
                         value={feedbackForm.message}
                         onChange={e => setFeedbackForm({...feedbackForm, message: e.target.value})}
                       />
                       <button className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-[#ccff00] transition-colors flex items-center gap-2 text-sm">
                          {feedbackStatus === 'loading' ? <Loader2 className="animate-spin" size={16}/> : <>SEND <Send size={16}/></>}
                       </button>
                   </form>
               )}
           </div>
        </RevealOnScroll>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`pt-20 pb-10 border-t ${darkMode ? 'bg-black border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
               <h3 className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>TeenVerseHub<span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>.</span></h3>
               <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                  Empowering the next generation of Indian creators. Built for safety, scale, and student success.
               </p>
               <div className="flex gap-4">
                  {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                     <a key={i} href="#!" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${darkMode ? 'bg-white/5 text-white hover:bg-[#ccff00] hover:text-black' : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}><Icon size={18}/></a>
                  ))}
               </div>
            </div>
            
            <div>
                <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Company</h4>
                <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                    {['About Us', 'Careers', 'Blog', 'Success Stories'].map(l => (
                        <li key={l}><button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>{l}</button></li>
                    ))}
                </ul>
            </div>

            <div>
                <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Legal & Trust</h4>
                <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                    {['Terms of Service', 'Privacy Policy', 'Parent Consent Form', 'Safety Guidelines'].map(l => (
                        <li key={l}><button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>{l}</button></li>
                    ))}
                </ul>
            </div>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h4 className={`font-bold text-xs uppercase mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <AlertTriangle size={14} className="text-amber-500"/> Grievance Redressal
                </h4>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>For complaints or safety concerns:</p>
                <div className={`text-xs font-mono ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                    <p>Compliance Officer</p>
                    <a href="mailto:support@teenversehub.in" className={`hover:underline ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`}>support@teenversehub.in</a>
                    <p className={`mt-1 ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>Response time: &lt; 48 hours</p>
                </div>
            </div>
         </div>
         
         <div className={`max-w-7xl mx-auto px-6 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono ${darkMode ? 'border-white/10 text-gray-600' : 'border-slate-200 text-slate-500'}`}>
            <div>© 2026 TeenVerseHub. All rights reserved.</div>
            <div className="flex items-center gap-2">
               Made with ❤️ for the Future of India.
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;