import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Menu, X, Sun, Moon, Instagram, Twitter, Linkedin, 
  ArrowRight, Globe, ShieldCheck, Target, Sparkles, AlertTriangle, HelpCircle
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView, AnimatePresence } from 'framer-motion';

// --- UTILITY: SCROLL REVEAL WRAPPER ---
const RevealOnScroll = ({ children, delay = 0, className = "", width = "w-full" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <div ref={ref} className={`${width} ${className} overflow-hidden`}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// --- CSS STYLES ---
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
`;

const AboutPage = ({ setView, darkMode, toggleTheme, onLegalClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const cursorRef = useRef(null);

  // Parallax effect for hero
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

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

  const handleNav = (target) => {
    if (!setView) return;
    const viewMap = {
        'get started': 'auth',
        'auth': 'auth',
        'home': 'landing',
        'about us': 'about',
        'about': 'about',
        'faq': 'faq',
        'safety': 'safety'
    };
    const cleanTarget = target.toLowerCase();
    if (viewMap[cleanTarget]) {
        setView(viewMap[cleanTarget]);
        window.scrollTo(0,0);
        setIsMobileMenuOpen(false);
    }
  };

  const handleFooterLink = (link) => {
      const lower = link.toLowerCase();
      if (lower.includes('terms') && onLegalClick) { onLegalClick('terms'); return; }
      if (lower.includes('privacy') && onLegalClick) { onLegalClick('privacy'); return; }
      if (lower.includes('refund') && onLegalClick) { onLegalClick('disputes'); return; } 
      if (lower === 'safety center' || lower === 'safety') { handleNav('safety'); return; } 
      if (lower === 'faq') { handleNav('faq'); return; } 
      handleNav(link);
  };

  return (
    <div className={`relative min-h-screen selection:bg-[#ccff00] selection:text-black transition-colors duration-500 ${darkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9ff] text-slate-900'}`}>
      <Helmet>
        <title>About Us – TeenVerseHub</title>
        <meta name="description" content="Learn about TeenVerseHub's mission to empower teenagers to build their future safely." />
      </Helmet>
      <style>{styles}</style>
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* Subtle Background */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${darkMode ? 'bg-grid-pattern text-white opacity-[0.03]' : 'bg-grid-pattern text-indigo-900 opacity-[0.03]'}`}></div>

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

           {/* Desktop Menu - Unified with Home */}
           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
              {['Home', 'About Us', 'Safety', 'FAQ'].map((item) => (
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
           
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`md:hidden p-2 rounded-lg transition-colors ${darkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'}`}>
             {isMobileMenuOpen ? <X /> : <Menu/>}
           </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.2 }}
              className="absolute top-[calc(100%+10px)] left-0 w-full px-4 md:hidden z-40"
            >
              <div className={`border rounded-2xl p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl ${darkMode ? 'bg-[#0a0a0a] border-white/15' : 'bg-white border-indigo-100'}`}>
                 <div className="flex flex-col gap-4">
                   {/* Mobile Menu - Unified with Home */}
                   {['Home', 'About Us', 'Safety', 'FAQ'].map((item) => (
                     <button key={item} onClick={() => handleNav(item)} className={`text-left text-lg font-bold transition-colors flex items-center justify-between group py-2 ${darkMode ? 'text-gray-300 hover:text-[#ccff00]' : 'text-slate-700 hover:text-indigo-600'}`}>
                       {item} <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`} />
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
                 <button onClick={() => handleNav('auth')} className={`w-full py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg ${darkMode ? 'bg-[#ccff00] text-black' : 'bg-indigo-600 text-white'}`}>
                   Get Started <Rocket size={18} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- 🌍 HERO SECTION (Typography Driven) --- */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
         <motion.div style={{ y: heroY }} className="max-w-7xl mx-auto relative z-10">
            <RevealOnScroll>
              <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border text-xs font-mono font-bold tracking-widest mb-10 ${darkMode ? 'border-white/20 bg-white/5 text-gray-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                <Globe size={14} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'} />
                OUR STORY & VISION
              </div>
            </RevealOnScroll>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-end">
              <div className="flex-1">
                <RevealOnScroll delay={0.1}>
                  <h1 className={`text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    We believe age <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">should never</span> <br/>
                    limit talent.
                  </h1>
                </RevealOnScroll>
              </div>
              <div className="flex-1 lg:pb-6">
                <RevealOnScroll delay={0.3}>
                  <p className={`text-xl md:text-2xl font-medium leading-relaxed border-l-4 pl-6 md:pl-8 ${darkMode ? 'border-[#ccff00] text-gray-400' : 'border-indigo-600 text-slate-600'}`}>
                    TeenVerseHub is a platform built to help teenagers learn, earn, and grow in a safe, transparent, and beginner-friendly environment.
                  </p>
                </RevealOnScroll>
              </div>
            </div>
         </motion.div>
      </section>

      {/* --- 💡 OUR STORY (Sticky Scroll UX) --- */}
      <section className={`py-24 md:py-32 px-6 border-t ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 relative">
          
          {/* Left: Sticky Header */}
          <div className="md:w-1/3 relative">
            <div className="sticky top-32 md:top-40">
              <RevealOnScroll>
                <h2 className={`text-4xl md:text-6xl font-black tracking-tight mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  How it <br className="hidden md:block"/><span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Began.</span>
                </h2>
                <p className={`text-lg font-medium ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                  The problem, the gap, and the solution we decided to build.
                </p>
              </RevealOnScroll>
            </div>
          </div>

          {/* Right: Scrolling Story Nodes */}
          <div className="md:w-2/3 space-y-8 md:space-y-24">
            
            {/* Node 1 */}
            <RevealOnScroll>
              <div className={`p-8 md:p-12 rounded-[2rem] border relative overflow-hidden ${darkMode ? 'bg-[#111] border-white/10' : 'bg-slate-50 border-slate-200 shadow-xl shadow-slate-100'}`}>
                <div className={`absolute top-0 right-0 w-1 bg-gradient-to-b from-rose-500 to-transparent h-full`} />
                <span className="text-rose-500 font-mono font-bold tracking-widest text-xs md:text-sm mb-4 block">01 / THE PROBLEM</span>
                <h3 className={`text-2xl md:text-3xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Existing platforms ignore beginners.</h3>
                <p className={`text-base md:text-lg leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  As a teenager, I <strong>(Kashif Khan)</strong> saw how difficult it was for young people to find safe and genuine opportunities online. Most platforms are built for seasoned professionals. Beginners often feel lost, overwhelmed, or entirely ignored.
                </p>
              </div>
            </RevealOnScroll>

            {/* Node 2 */}
            <RevealOnScroll>
              <div className={`p-8 md:p-12 rounded-[2rem] border relative overflow-hidden ${darkMode ? 'bg-[#111] border-white/10' : 'bg-slate-50 border-slate-200 shadow-xl shadow-slate-100'}`}>
                <div className={`absolute top-0 right-0 w-1 bg-gradient-to-b from-amber-500 to-transparent h-full`} />
                <span className="text-amber-500 font-mono font-bold tracking-widest text-xs md:text-sm mb-4 block">02 / THE GAP</span>
                <h3 className={`text-2xl md:text-3xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>No trust, no guidance.</h3>
                <p className={`text-base md:text-lg leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  There was no proper system for teenagers to start earning, no structured guidance, and most importantly, no environment that parents could look at and actually trust.
                </p>
              </div>
            </RevealOnScroll>

            {/* Node 3 */}
            <RevealOnScroll>
              <div className={`p-8 md:p-12 rounded-[2rem] border relative overflow-hidden ${darkMode ? 'bg-[#111] border-[#ccff00]/30' : 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-200 text-white'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-50 ${darkMode ? 'bg-[#ccff00]' : 'bg-indigo-400'}`} />
                <span className={`font-mono font-bold tracking-widest text-xs md:text-sm mb-4 block ${darkMode ? 'text-[#ccff00]' : 'text-indigo-200'}`}>03 / THE SOLUTION</span>
                <h3 className={`text-2xl md:text-3xl font-bold mb-4 md:mb-6 ${darkMode ? 'text-white' : 'text-white'}`}>We built it ourselves.</h3>
                <p className={`text-base md:text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-indigo-50'}`}>
                  Instead of waiting for someone else to solve this, TeenVerseHub was created to give teenagers a place where they can start small, learn by doing, and grow with real opportunities — <strong>without fear, confusion, or risk.</strong>
                </p>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* --- 🎯 MISSION & VISION (Immersive Split Block) --- */}
      <section className="relative px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Dark/Accent Block - Mission */}
            <RevealOnScroll>
              <div className={`p-10 md:p-16 rounded-[3rem] h-full flex flex-col justify-between overflow-hidden relative ${darkMode ? 'bg-[#ccff00] text-black' : 'bg-indigo-900 text-white'}`}>
                <div className="relative z-10">
                  <Target size={40} className="mb-8 opacity-80" />
                  <h3 className="text-4xl md:text-5xl font-black mb-6">Our Mission</h3>
                  <p className="text-xl font-medium mb-12 opacity-90">Creating opportunities for every teenager.</p>
                </div>
                
                <ul className="space-y-6 relative z-10">
                  {['Explore your raw skills', 'Earn your first actual income', 'Gain real-world project experience', 'Build confidence for the future'].map((item, i) => (
                    <li key={i} className="flex items-start md:items-center gap-4 font-bold text-base md:text-lg">
                      <div className={`mt-2 md:mt-0 w-2 h-2 shrink-0 rounded-full ${darkMode ? 'bg-black' : 'bg-[#ccff00]'}`} /> {item}
                    </li>
                  ))}
                </ul>
                
                {/* Decorative oversized shape */}
                <div className={`absolute -bottom-20 -right-20 w-96 h-96 rounded-full blur-[80px] pointer-events-none ${darkMode ? 'bg-white/40' : 'bg-indigo-600'}`} />
              </div>
            </RevealOnScroll>

            {/* Light/Card Block - Vision */}
            <RevealOnScroll delay={0.2}>
              <div className={`p-10 md:p-16 rounded-[3rem] h-full border flex flex-col justify-center relative overflow-hidden ${darkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-100'}`}>
                <Sparkles size={40} className={`mb-8 ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`} />
                <h3 className={`text-4xl md:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Our Vision</h3>
                <p className={`text-lg md:text-2xl leading-relaxed font-medium ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  We envision a world where teenagers don’t have to wait to start their journey. 
                  <br/><br/>
                  We are building a global platform where young individuals can turn their skills into real opportunities — <strong className={darkMode ? 'text-white' : 'text-slate-900'}>safely, confidently, and independently.</strong>
                </p>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* --- 🔒 SAFETY & TRUST (Typography Focus) --- */}
      <section className={`py-24 md:py-32 px-6 border-y ${darkMode ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className={`text-4xl md:text-7xl font-black tracking-tight mb-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Trust is our <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Currency.</span>
            </h2>
            <p className={`text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed mb-16 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              We understand that trust is the foundation—not just for teenagers, but for their guardians. Safety isn't a feature, it's the entire infrastructure.
            </p>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Monitored Interactions", desc: "Advanced systems to protect against scams and misuse." },
              { title: "Guardian Transparency", desc: "Parents stay in the loop with what's happening." },
              { title: "Controlled Environment", desc: "A beginner-friendly space separated from the wild web." }
            ].map((point, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center p-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg ${darkMode ? 'bg-white/5 text-[#ccff00]' : 'bg-white text-indigo-600 shadow-indigo-100'}`}>
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{point.title}</h4>
                  <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{point.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* --- 👨‍💻 MEET THE TEAM (Agency List UX) --- */}
      <section className={`py-24 md:py-32 px-6 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className={`text-4xl md:text-6xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Built by <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Young Minds.</span>
                </h2>
                <p className={`text-lg md:text-xl font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                  A passionate team with a clear vision for the next generation.
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full border text-xs font-bold font-mono inline-flex items-center w-fit gap-2 ${darkMode ? 'border-white/10 bg-white/5 text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <AlertTriangle size={14} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'} />
                Registered under Mohd Asif
              </div>
            </div>
          </RevealOnScroll>

          {/* Minimalist List Rows instead of Cards */}
          <div className={`border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
            {[
              { name: "Kashif Khan", role: "Founder", desc: "A 15-year-old student driven to create safe digital opportunities for teenagers everywhere.", initial: "K", color: "bg-indigo-500" },
              { name: "Subodh", role: "Co-founder", desc: "Leading technical development and driving platform growth to ensure a seamless experience.", initial: "S", color: "bg-purple-500" },
              { name: "Aditya", role: "Co-founder", desc: "Supporting daily operations, execution, and making sure the ecosystem runs smoothly.", initial: "A", color: "bg-blue-500" }
            ].map((member, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className={`group flex flex-col md:flex-row md:items-center justify-between py-10 md:py-12 border-b cursor-pointer transition-colors relative overflow-hidden ${darkMode ? 'border-white/10 hover:bg-white/[0.02]' : 'border-slate-200 hover:bg-slate-50'}`}>
                  
                  {/* Left side: Avatar + Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-8 relative z-10 mb-6 md:mb-0">
                    <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg transition-transform group-hover:scale-110 ${member.color}`}>
                      {member.initial}
                    </div>
                    <div>
                      <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{member.name}</h3>
                      <div className={`font-mono text-xs sm:text-sm tracking-widest font-bold ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`}>{member.role}</div>
                    </div>
                  </div>

                  {/* Right side: Description */}
                  <div className="md:w-1/2 relative z-10 md:pl-0">
                    <p className={`text-base md:text-lg leading-relaxed ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`}>
                      {member.desc}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* --- ✅ TEASER SECTION: Redirect back to Platform/FAQ/Safety --- */}
      <section className={`py-24 px-6 border-t ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Safety & FAQ Navigation Teaser Box */}
            <RevealOnScroll>
              <div className={`p-8 md:p-12 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between h-full ${darkMode ? 'bg-[#111] border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-30 pointer-events-none ${darkMode ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                <div>
                  <ShieldCheck size={36} className={`mb-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h3 className={`text-2xl md:text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Trust & Support</h3>
                  <p className={`text-base md:text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    Got questions? Want to know how we keep teenagers safe? Explore our dedicated Safety Center and FAQ pages.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => handleNav('safety')}
                    className={`inline-flex items-center justify-center gap-2 font-bold w-fit px-6 py-3 rounded-xl transition-all ${darkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-200/50 text-emerald-700 hover:bg-emerald-200'}`}
                  >
                    Safety Hub
                  </button>
                  <button 
                    onClick={() => handleNav('faq')}
                    className={`inline-flex items-center justify-center gap-2 font-bold w-fit px-6 py-3 rounded-xl transition-all ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-200/50 text-blue-700 hover:bg-blue-200'}`}
                  >
                    Read FAQs
                  </button>
                </div>
              </div>
            </RevealOnScroll>

            {/* Platform Navigation CTA Box */}
            <RevealOnScroll delay={0.2}>
              <div className={`p-8 md:p-12 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between h-full ${darkMode ? 'bg-[#111] border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-30 pointer-events-none ${darkMode ? 'bg-indigo-500' : 'bg-indigo-400'}`} />
                <div>
                  <Globe size={36} className={`mb-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className={`text-2xl md:text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ready to explore?</h3>
                  <p className={`text-base md:text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                    Head back to our main platform to discover talented teenagers or to start your own digital journey today.
                  </p>
                </div>
                <button 
                  onClick={() => handleNav('home')}
                  className={`inline-flex items-center justify-center gap-2 font-bold w-fit px-6 py-3 rounded-xl transition-all ${darkMode ? 'bg-[#ccff00]/20 text-[#ccff00] hover:bg-[#ccff00]/30' : 'bg-indigo-200/50 text-indigo-700 hover:bg-indigo-200'}`}
                >
                  Back to Main Page <ArrowRight size={18} />
                </button>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* --- 📣 CALL TO ACTION (Floating Box) --- */}
      <section className={`py-24 px-6 ${darkMode ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
        <RevealOnScroll>
          <div className={`max-w-5xl mx-auto p-10 md:p-20 rounded-[3rem] text-center relative overflow-hidden ${darkMode ? 'bg-[#111] border border-white/10' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-300'}`}>
            <div className="relative z-10">
              <h2 className={`text-4xl md:text-6xl font-black mb-6 ${darkMode ? 'text-white' : 'text-white'}`}>Be Part of the Journey.</h2>
              <p className={`text-lg md:text-2xl mb-10 max-w-2xl mx-auto font-medium ${darkMode ? 'text-gray-400' : 'text-indigo-100'}`}>
                Whether you’re a teenager ready to start, or someone who believes in empowering the next generation.
              </p>
              <button 
                onClick={() => handleNav('auth')} 
                className={`px-8 py-4 md:px-10 md:py-5 font-black text-base md:text-lg rounded-2xl inline-flex items-center gap-3 transition-transform hover:scale-105 shadow-xl ${darkMode ? 'bg-[#ccff00] text-black shadow-[#ccff00]/20' : 'bg-white text-indigo-700 shadow-white/20'}`}
              >
                Join Us Today <ArrowRight size={20} />
              </button>
            </div>
            
            {/* Abstract Background element */}
            <div className={`absolute top-[-50%] left-[-10%] w-[80%] h-[200%] rotate-12 pointer-events-none ${darkMode ? 'bg-white/[0.02]' : 'bg-white/10'}`} />
          </div>
        </RevealOnScroll>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`pt-20 pb-10 border-t ${darkMode ? 'bg-black border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 items-start">
            
            <div className="space-y-6">
              <h3 className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                TeenVerseHub<span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>.</span>
              </h3>
              <div className={`text-sm leading-relaxed space-y-4 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                <p>Empowering creators and digital talent across India. Built for safety, scale, and success.</p>
                <div className={`p-4 rounded-lg border text-xs space-y-2 ${darkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-indigo-50/50 border-indigo-100 text-slate-600'}`}>
                  <p><strong>Disclaimer:</strong> TeenVerseHub is a technology platform connecting clients with freelancers. We do not provide services directly.</p>
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

            <div className="md:pl-8">
              <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Company</h4>
              <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                {['About Us', 'FAQ', 'Careers', 'Blog', 'Contact'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:pl-4">
              <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Legal & Trust</h4>
              <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                {['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Safety Center'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#111] border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
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

export default AboutPage;