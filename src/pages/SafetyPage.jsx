import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Menu, X, Sun, Moon, Instagram, Twitter, Linkedin, 
  ArrowRight, ShieldCheck, Search, MessageSquareLock, Users, 
  ShieldAlert, Flag, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion, useScroll, useSpring, useInView, AnimatePresence } from 'framer-motion';

// --- UTILITY: SCROLL REVEAL WRAPPER ---
const RevealOnScroll = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
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

const SafetyPage = ({ setView, darkMode, toggleTheme, onLegalClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const cursorRef = useRef(null);

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
        'safety': 'safety',
        'contact': 'contact'
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
      if (lower.includes('about')) { handleNav('about'); return; }
      if (lower.includes('faq')) { handleNav('faq'); return; }
      if (lower.includes('safety')) { handleNav('safety'); return; }
      handleNav(link);
  };

  const safetyFeatures = [
    { id: "01", icon: ShieldCheck, title: "Safe Environment", desc: "We are committed to creating a platform where teenagers can interact and work without fear. Our system is designed to reduce risks and ensure a controlled experience.", colSpan: "md:col-span-2 lg:col-span-2" },
    { id: "02", icon: Search, title: "Monitoring & Moderation", desc: "Activities on the platform are monitored to prevent misuse, inappropriate behavior, or scams. We continuously improve our systems to keep the environment safe.", colSpan: "md:col-span-1 lg:col-span-1" },
    { id: "03", icon: MessageSquareLock, title: "Secure Communication", desc: "All interactions happen within the platform to maintain transparency and reduce external risks.", colSpan: "md:col-span-1 lg:col-span-1" },
    { id: "04", icon: Users, title: "Transparency for Guardians", desc: "We understand the importance of parental trust. TeenVerseHub promotes transparency so guardians can feel confident about their child’s activities.", colSpan: "md:col-span-2 lg:col-span-2" },
    { id: "05", icon: ShieldAlert, title: "Scam Prevention", desc: "We take strict measures to reduce scams and fraudulent behavior. Users are encouraged to follow platform guidelines and report suspicious activity.", colSpan: "md:col-span-2 lg:col-span-2" },
    { id: "06", icon: Flag, title: "Reporting System", desc: "If something feels wrong, users can report it easily. Our team reviews reports and takes necessary action quickly.", colSpan: "md:col-span-1 lg:col-span-1" },
  ];

  return (
    <div className={`relative min-h-screen selection:bg-emerald-400 selection:text-black transition-colors duration-500 ${darkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9ff] text-slate-900'}`}>
      <Helmet>
        <title>Trust & Safety – TeenVerseHub</title>
        <meta name="description" content="Your safety is our priority. Discover how TeenVerseHub provides a secure and trustworthy environment for teenagers." />
      </Helmet>
      <style>{styles}</style>
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* Ambient Safety Glows (Emerald/Green focused for trust) */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${darkMode ? 'bg-grid-pattern text-white opacity-[0.02]' : 'bg-grid-pattern text-emerald-900 opacity-[0.03]'}`}></div>
      <div className={`fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[150px] pointer-events-none transition-opacity duration-700 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-400/20'}`} />

      <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-1.5 bg-emerald-400 origin-left z-[100]" />

      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 100 }}
        className="fixed w-full z-50 top-0 py-4 px-6"
      >
        <div className={`max-w-7xl mx-auto rounded-2xl px-6 py-3 flex justify-between items-center shadow-2xl relative z-50 transition-all ${darkMode ? 'bg-black/80 backdrop-blur-xl border border-white/10' : 'bg-white/80 backdrop-blur-xl border border-emerald-100 shadow-emerald-100/50'}`}>
           <div className="flex items-center gap-3 cursor-pointer hover-target group" onClick={() => handleNav('home')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white group-hover:rotate-12 transition-transform">
                T<span className="text-[#ccff00]">.</span>
              </div>
              <span className={`font-bold tracking-tighter text-xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>TeenVerseHub</span>
           </div>

           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
              {['Home', 'About Us', 'FAQ'].map((item) => (
                <button key={item} onClick={() => handleNav(item)} className={`transition-colors hover-target ${darkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-600'}`}>{item}</button>
              ))}
              <div className={`w-px h-4 ${darkMode ? 'bg-white/20' : 'bg-slate-200'}`}></div>
              <button onClick={toggleTheme} className={`hover-target p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-slate-100 text-indigo-600'}`}>
                {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
              <button onClick={() => handleNav('auth')} className={`px-6 py-2 rounded-xl transition-all hover:scale-105 font-black hover-target ${darkMode ? 'bg-white text-black hover:bg-emerald-400' : 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-200 hover:bg-emerald-600'}`}>
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
              <div className={`border rounded-2xl p-6 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl ${darkMode ? 'bg-[#0a0a0a] border-white/15' : 'bg-white border-emerald-100'}`}>
                 <div className="flex flex-col gap-4">
                   {['Home', 'About Us', 'FAQ'].map((item) => (
                     <button key={item} onClick={() => handleNav(item)} className={`text-left text-lg font-bold transition-colors flex items-center justify-between group py-2 ${darkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-slate-700 hover:text-emerald-600'}`}>
                       {item} <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                     </button>
                   ))}
                 </div>
                 <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}></div>
                 <button onClick={() => handleNav('auth')} className={`w-full py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg ${darkMode ? 'bg-emerald-400 text-black' : 'bg-emerald-600 text-white'}`}>
                   Get Started <Rocket size={18} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- 🛡️ HERO SECTION (Security Focused) --- */}
      <section className="relative pt-48 pb-20 px-6 overflow-hidden text-center">
         <div className="max-w-4xl mx-auto relative z-10">
            <RevealOnScroll>
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-8 shadow-2xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20' : 'bg-emerald-100 text-emerald-600 shadow-emerald-200'}`}
              >
                <ShieldCheck size={48} strokeWidth={2.5} />
              </motion.div>
              
              <h1 className={`text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Your Safety is <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Our Priority.</span>
              </h1>
              
              <p className={`text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                TeenVerseHub is built to provide a secure and trustworthy environment for teenagers to learn and earn.
              </p>
            </RevealOnScroll>
         </div>
      </section>

      {/* --- 🧩 DYNAMIC SAFETY GRID --- */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 auto-rows-min">
            
            {safetyFeatures.map((feature, i) => (
              <RevealOnScroll key={i} delay={i * 0.1} className={feature.colSpan}>
                <motion.div 
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`p-8 md:p-12 rounded-[2rem] border h-full relative overflow-hidden group ${
                    darkMode 
                      ? 'bg-[#111] border-white/5 hover:border-emerald-500/30' 
                      : 'bg-white border-slate-200 hover:border-emerald-300 shadow-lg shadow-slate-200/50 hover:shadow-emerald-100'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none ${darkMode ? 'bg-emerald-500' : 'bg-emerald-300'}`} />
                  
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${darkMode ? 'bg-white/5 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        <feature.icon size={28} />
                      </div>
                      <span className={`font-mono text-xl font-bold opacity-30 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {feature.id}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                      <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </RevealOnScroll>
            ))}

            {/* Point 7: Full Width Banner inside the grid */}
            <RevealOnScroll delay={0.2} className="md:col-span-3 lg:col-span-3">
              <div className={`p-8 md:p-12 rounded-[2rem] border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 ${
                darkMode ? 'bg-gradient-to-r from-[#0a1a10] to-[#111] border-emerald-500/20' : 'bg-gradient-to-r from-emerald-600 to-teal-700 border-transparent shadow-xl shadow-emerald-200 text-white'
              }`}>
                <div className="flex items-center gap-6">
                  <div className={`shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white'}`}>
                    <RefreshCw size={32} />
                  </div>
                  <div>
                    <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-white'}`}>Continuous Improvement</h3>
                    <p className={`text-lg max-w-2xl ${darkMode ? 'text-gray-400' : 'text-emerald-50'}`}>
                      Safety is not a one-time feature — it’s an ongoing effort. We regularly update our systems to improve protection and trust.
                    </p>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* --- 📢 CLOSING CALL TO ACTION --- */}
      <section className={`py-24 px-6 border-t mt-12 ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <RevealOnScroll>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className={`text-3xl md:text-5xl font-black mb-6 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              TeenVerseHub is not just about opportunities — <br className="hidden md:block"/>
              <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>it’s about creating them safely.</span>
            </h2>
            
            <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg shadow-lg mt-8 ${darkMode ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'}`}>
              <CheckCircle2 className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
              Your journey matters, and your safety comes first.
            </div>
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
            </div>

            <div className="md:pl-8">
              <h4 className={`font-bold uppercase tracking-widest text-xs mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-900'}`}>Company</h4>
              <ul className={`space-y-3 text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                {['About Us', 'FAQ', 'Careers', 'Contact'].map(l => (
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
                {['Terms of Service', 'Privacy Policy', 'Safety Guidelines'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleFooterLink(l === 'Safety Guidelines' ? 'safety' : l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
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

export default SafetyPage;