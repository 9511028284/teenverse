import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Star, Zap, Heart, TrendingUp, ArrowRight, CheckCircle, 
  Loader2, DollarSign, ShieldCheck, Lock, Menu, X, 
  Sun, Moon, Instagram, Twitter, Linkedin, Send, Code, Users, Briefcase, AlertTriangle
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
  
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
    background-size: 50px 50px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
  
  .text-stroke { -webkit-text-stroke: 1px rgba(255,255,255,0.2); color: transparent; }
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
    
    // Check if it's a view change
    if (viewMap[cleanTarget]) {
        setView(viewMap[cleanTarget]);
        window.scrollTo(0,0);
        setIsMobileMenuOpen(false);
        return;
    }

    // Check if it's a section scroll
    const sectionIdMap = {
      'safety': 'safety',
      'how it works': 'how it works',
      'explore': 'explore' // Assuming the hero buttons or similar might map here
    };

    const sectionId = sectionIdMap[cleanTarget] || cleanTarget;
    const section = document.getElementById(sectionId);
    
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
    } else {
        // Fallback if no section matches
        setIsMobileMenuOpen(false);
    }
  };

  // --- FIX: Updated Footer Link Logic ---
  const handleFooterLink = (link) => {
      const lower = link.toLowerCase();
      
      // Use .includes() to match "Terms of Service" to "terms", etc.
      if (lower.includes('terms') && onLegalClick) { onLegalClick('terms'); return; }
      if (lower.includes('privacy') && onLegalClick) { onLegalClick('privacy'); return; }
      if (lower.includes('refund') && onLegalClick) { onLegalClick('refunds'); return; }
      
      handleNav(link);
  };

  return (
    <div className={`relative min-h-screen selection:bg-[#ccff00] selection:text-black ${darkMode ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      <Helmet>
        <title>TeenVerseHub – India's Safest Student Freelance Marketplace</title>
        <meta name="description" content="Secure freelancing for teens (14-19) in India. Earn experience with verified clients, escrow payments, and parent supervision." />
      </Helmet>

      <style>{styles}</style>
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* Dynamic Backgrounds */}
      <div className={`fixed inset-0 pointer-events-none ${darkMode ? 'bg-grid-pattern opacity-30' : 'opacity-0'}`}></div>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"></div>
      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1.5 bg-[#ccff00] origin-left z-[100]" />

      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100 }}
        className="fixed w-full z-50 top-0 py-4 px-6"
      >
        <div className="max-w-7xl mx-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex justify-between items-center shadow-2xl relative z-50">
           <div className="flex items-center gap-3 cursor-pointer hover-target" >
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white">
                T<span className="text-[#ccff00]">.</span>
              </div>
              <span className="font-bold tracking-tighter text-xl text-white">TeenVerseHub</span>
           </div>

           {/* Desktop Menu */}
           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-gray-300">
              {['Safety', 'How it Works'].map((item) => (
                <button key={item} onClick={() => handleNav(item)} className="hover:text-[#ccff00] transition-colors hover-target">{item}</button>
              ))}
              <div className="w-px h-4 bg-white/20"></div>
              <button onClick={toggleTheme} className="hover:text-yellow-400 transition-colors hover-target">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
              <button onClick={() => handleNav('auth')} className="bg-white text-black px-6 py-2 rounded-xl hover:bg-[#ccff00] transition-all hover:scale-105 font-black hover-target">
                GET STARTED
              </button>
           </div>
           
           {/* Mobile Toggle */}
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
             {isMobileMenuOpen ? <X /> : <Menu/>}
           </button>
        </div>

        {/* --- FIX: Restored Mobile Menu --- */}
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
                   {['Safety', 'How it Works'].map((item) => (
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
           className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px]" 
         />
         
         <div className="relative z-10 max-w-5xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-mono font-bold tracking-widest mb-8"
            >
              <ShieldCheck size={14} className="text-[#ccff00]" />
              VERIFIED & SECURE PLATFORM
            </motion.div>

            <motion.h1 
              style={{ y: heroY }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }}
              className="text-5xl md:text-8xl font-black leading-[1.1] tracking-tighter mb-8"
            >
              Turn Skills Into <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-green-400">Real Experience.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
            >
              India’s safest marketplace for students (14–19). Earn pocket money, build a portfolio, and learn financial literacy—all with <span className="text-white font-bold">secure escrow payments</span> and parent oversight.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <motion.button 
                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 onClick={() => handleNav('auth')}
                 className="hover-target relative px-10 py-5 bg-[#ccff00] text-black font-black text-lg rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)] transition-shadow"
               >
                  I'M A TEEN <Rocket size={20}/>
               </motion.button>
               <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleNav('auth')} // In real app, goes to Client Signup
                  className="hover-target px-10 py-5 border border-white/10 bg-white/5 backdrop-blur rounded-2xl font-bold text-white hover:bg-white/10 flex items-center gap-3"
               >
                  HIRE GEN Z <ArrowRight size={20}/>
               </motion.button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-xs font-mono text-gray-500">
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/>Verified Users</span>
                <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> 100% Payment Protection</span>
            </div>
         </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section id="how it works" className="py-24 px-6 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
            <RevealOnScroll>
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Safe Work, <span className="text-[#ccff00]">Secure Payments.</span></h2>
                    <p className="text-gray-400">Our escrow system ensures you never work for free.</p>
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
                        <div className={`relative p-6 rounded-2xl border ${step.active ? 'bg-[#111] border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.1)]' : 'bg-black border-white/10'} h-full`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${step.active ? 'bg-[#ccff00] text-black' : 'bg-white/10 text-white'}`}>
                                <step.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                            {i < 3 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-white/20 z-10" />}
                        </div>
                    </RevealOnScroll>
                ))}
            </div>
        </div>
      </section>

      {/* --- TRUST & SAFETY --- */}
      <section id="safety" className="py-32 px-6 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <RevealOnScroll>
                <div className="space-y-8">
                    <div className="inline-block px-3 py-1 bg-indigo-900/30 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        Compliance First
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                        Safety is our <br/>
                        <span className="text-indigo-500">Operating System.</span>
                    </h2>
                    <p className="text-gray-400 text-lg">We've built a walled garden for digital work. No personal contact details shared, strict moderation, and identity checks for everyone.</p>
                    
                    <div className="space-y-6">
                        {[
                            { title: "Identity Verification", desc: "Every user—teen and client—is verified manaully." },
                            
                            { title: "Dispute Resolution", desc: "Our admin team acts as a neutral judge to ensure fair payment." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="mt-1"><CheckCircle className="text-[#ccff00]" size={20}/></div>
                                <div>
                                    <h4 className="text-white font-bold">{item.title}</h4>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </RevealOnScroll>

            <div className="relative h-[600px]">
                {/* Stacked Cards Visualization */}
                <TiltCard className="absolute top-0 right-0 w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                            </div>
                            <div>
                                <div className="text-white font-bold">Rohan K.</div>
                                <div className="text-xs text-green-500 flex items-center gap-1"><ShieldCheck size={10}/> ID Verified</div>
                            </div>
                        </div>
                        <span className="text-xs font-mono text-gray-500">Today, 2:30 PM</span>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-[#111] p-3 rounded-lg rounded-tl-none text-sm text-gray-300 border border-white/5">
                            Here is the final logo file attached. 📁
                        </div>
                        <div className="bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white"><Lock size={14}/></div>
                                <div>
                                    <div className="text-xs text-indigo-300 font-bold uppercase">Escrow Release</div>
                                    <div className="text-white font-bold">₹ 2,500.00</div>
                                </div>
                            </div>
                            <CheckCircle className="text-indigo-400" size={20}/>
                        </div>
                    </div>
                </TiltCard>
                <div className="absolute top-20 right-10 w-full max-w-md bg-[#222] rounded-3xl h-full -z-10 opacity-50 scale-95"></div>
            </div>
         </div>
      </section>

      {/* --- FLIP SECTION: TEENS VS PARENTS --- */}
      <section className="py-24 px-6 bg-white/5 perspective-1000">
         <RevealOnScroll>
           <div className="max-w-5xl mx-auto">
              {/* Toggle Switch */}
              <div className="flex justify-center mb-16">
                 <div className="bg-black p-1 rounded-full border border-white/20 flex relative">
                    <motion.div 
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute top-1 bottom-1 ${activeTab === 'creators' ? 'left-1 w-[140px]' : 'left-[145px] w-[140px]'} bg-[#ccff00] rounded-full`}
                    />
                    <button 
                      onClick={() => setActiveTab('creators')} 
                      className={`relative z-10 px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'creators' ? 'text-black' : 'text-gray-400'}`}
                    >
                      For Teens
                    </button>
                    <button 
                      onClick={() => setActiveTab('parents')} 
                      className={`relative z-10 px-8 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'parents' ? 'text-black' : 'text-gray-400'}`}
                    >
                      For Parents
                    </button>
                 </div>
              </div>

              {/* Content Container */}
              <div className="bg-black border border-white/10 rounded-[3rem] p-8 md:p-16 overflow-hidden relative">
                 <AnimatePresence mode="wait">
                    {activeTab === 'creators' ? (
                        <motion.div 
                            key="creators"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col md:flex-row items-center gap-12"
                        >
                            <div className="flex-1 space-y-6">
                                <h3 className="text-4xl font-black text-white">Your First Paycheck,<br/> <span className="text-[#ccff00]">Your Way.</span></h3>
                                <p className="text-gray-400">Stop working for "exposure". Build a real portfolio with real clients. We handle the invoices and awkward money talks.</p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-sm font-bold text-white"><Star size={18} className="text-[#ccff00]"/> Build a verified CV</li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-white"><Star size={18} className="text-[#ccff00]"/> Guaranteed Payment</li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-white"><Star size={18} className="text-[#ccff00]"/> Learn Financial Literacy</li>
                                </ul>
                                <button onClick={() => handleNav('auth')} className="mt-4 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-[#ccff00] transition-colors">Start Profile</button>
                            </div>
                            <div className="flex-1">
                                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" alt="Teen Creator" className="rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-500" />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="parents"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col md:flex-row-reverse items-center gap-12"
                        >
                            <div className="flex-1 space-y-6">
                                <h3 className="text-4xl font-black text-white">Financial Literacy,<br/> <span className="text-indigo-400">Safely Practiced.</span></h3>
                                <p className="text-gray-400">Give your teen a head start in the digital economy without the risks of the open web. You stay in control.</p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-sm font-bold text-white"><ShieldCheck size={18} className="text-indigo-400"/> Parent Approval Portal</li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-white"><ShieldCheck size={18} className="text-indigo-400"/> Curated, Safe Job Categories</li>
                                    <li className="flex items-center gap-3 text-sm font-bold text-white"><ShieldCheck size={18} className="text-indigo-400"/> No Personal Contact Details Shared</li>
                                </ul>
                                <button onClick={() => handleNav('auth')} className="mt-4 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors">View Safety Hub</button>
                            </div>
                            <div className="flex-1">
                                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" alt="Parent and Teen" className="rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-500" />
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
         </RevealOnScroll>
      </section>

      {/* --- FEEDBACK / SUGGESTIONS --- */}
      <section className="py-24 px-6 border-t border-white/10 bg-black">
        <RevealOnScroll>
           <div className="max-w-3xl mx-auto bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12">
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
      <footer className="bg-black text-white pt-16 pb-8 border-t border-white/10 text-sm">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
               <h3 className="text-xl font-black tracking-tighter">TeenVerseHub<span className="text-[#ccff00]">.</span></h3>
               <p className="text-gray-500 leading-relaxed">
                  Building the safest economy for the next generation. <br/>
                  Registered in uttarpradesh, India 🇮🇳
               </p>
               <div className="flex gap-4">
                  {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                     <a key={i} href="#!" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-all"><Icon size={16}/></a>
                  ))}
               </div>
            </div>
            
            <div>
                <h4 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Company</h4>
                <ul className="space-y-2 text-gray-500">
                    {['About Us', 'Careers', 'Blog', 'Success Stories'].map(l => (
                        <li key={l}><button onClick={() => handleFooterLink(l)} className="hover:text-white transition-colors">{l}</button></li>
                    ))}
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-400 uppercase tracking-wider text-xs mb-4">Legal & Trust</h4>
                <ul className="space-y-2 text-gray-500">
                    {['Terms of Service', 'Privacy Policy', 'Parent Consent Form', 'Safety Guidelines'].map(l => (
                        <li key={l}><button onClick={() => handleFooterLink(l)} className="hover:text-white transition-colors">{l}</button></li>
                    ))}
                </ul>
            </div>

            <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                <h4 className="font-bold text-white text-xs uppercase mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-500"/> Grievance Redressal
                </h4>
                <p className="text-gray-500 text-xs mb-2">For complaints or safety concerns:</p>
                <div className="text-xs text-gray-300 font-mono">
                    <p>Compliance Officer</p>
                    <a href="mailto:support@teenversehub.in" className="hover:text-[#ccff00] underline">support@teenversehub.in</a>
                    <p className="mt-1 text-gray-600">Response time: &lt; 48 hours</p>
                </div>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 font-mono">
            <div>© 2025 TeenVerseHub. All rights reserved.</div>
            <div className="flex items-center gap-2">
               Made with ❤️ for the Future of India.
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;