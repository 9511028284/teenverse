import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Rocket, Menu, X, Sun, Moon, Instagram, Twitter, Linkedin, 
  ArrowRight, HelpCircle, Plus, Minus, MessageCircle, AlertTriangle
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

// --- FAQ DATA ---
const faqs = [
  { q: "Is TeenVerseHub safe for teenagers?", a: "Yes. TeenVerseHub is designed with safety as a top priority. We focus on secure interactions, monitored activity, and a controlled environment suitable for teenagers." },
  { q: "What is the minimum age to join?", a: "TeenVerseHub is designed for teenagers. Specific age requirements may vary, but the platform is focused on young individuals starting their journey." },
  { q: "Do I need experience to start?", a: "No. You can start as a beginner. TeenVerseHub is built to help you learn, grow, and gain experience over time." },
  { q: "How can I start earning?", a: "You can start by creating your profile, showcasing your skills, and applying for opportunities available on the platform." },
  { q: "How do payments work?", a: "Payments are handled securely through the platform to ensure safety for both users and clients." },
  { q: "Can parents be involved?", a: "Yes. TeenVerseHub promotes transparency and aims to build trust with both teenagers and their guardians." },
  { q: "Is there any fee to join?", a: "You can start with basic access. Additional features or plans may be introduced as the platform grows." },
  { q: "What kind of work can I do?", a: "You can explore different categories like content creation, design, editing, and more based on your skills." }
];

const FaqPage = ({ setView, darkMode, toggleTheme, onLegalClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

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
        'contact': 'contact' // Assuming you have or will have a contact page
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
      handleNav(link);
  };

  return (
    <div className={`relative min-h-screen selection:bg-[#ccff00] selection:text-black transition-colors duration-500 ${darkMode ? 'bg-[#050505] text-white' : 'bg-[#f8f9ff] text-slate-900'}`}>
      <Helmet>
        <title>FAQ – TeenVerseHub</title>
        <meta name="description" content="Frequently Asked Questions about TeenVerseHub. Everything you need to know." />
      </Helmet>
      <style>{styles}</style>
      <div ref={cursorRef} className="custom-cursor hidden md:block"></div>

      {/* Subtle Background */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${darkMode ? 'bg-grid-pattern text-white opacity-[0.03]' : 'bg-grid-pattern text-indigo-900 opacity-[0.03]'}`}></div>
      
      {/* Ambient Glows */}
      <div className={`fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full blur-[150px] pointer-events-none transition-opacity duration-700 ${darkMode ? 'bg-[#ccff00]/5' : 'bg-indigo-400/10'}`} />

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

           <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider">
              {['Home', 'About Us', 'FAQ'].map((item) => (
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
                   {['Home', 'About Us', 'FAQ'].map((item) => (
                     <button key={item} onClick={() => handleNav(item)} className={`text-left text-lg font-bold transition-colors flex items-center justify-between group py-2 ${darkMode ? 'text-gray-300 hover:text-[#ccff00]' : 'text-slate-700 hover:text-indigo-600'}`}>
                       {item} <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}`} />
                     </button>
                   ))}
                 </div>
                 <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}></div>
                 <button onClick={() => handleNav('auth')} className={`w-full py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg ${darkMode ? 'bg-[#ccff00] text-black' : 'bg-indigo-600 text-white'}`}>
                   Get Started <Rocket size={18} />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- SPLIT LAYOUT FAQ SECTION --- */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 relative">
          
          {/* LEFT COLUMN: Sticky Header & Contact CTA */}
          <div className="lg:w-[40%] relative">
            <div className="sticky top-32 space-y-8">
              <RevealOnScroll>
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border text-xs font-mono font-bold tracking-widest mb-4 ${darkMode ? 'border-white/20 bg-white/5 text-gray-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                  <HelpCircle size={14} className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'} />
                  SUPPORT DESK
                </div>
                
                <h1 className={`text-5xl md:text-6xl font-black leading-[1.05] tracking-tighter mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Frequently <br/>
                  <span className={darkMode ? 'text-[#ccff00]' : 'text-indigo-600'}>Asked Questions.</span>
                </h1>
                
                <p className={`text-xl font-medium leading-relaxed mb-10 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                  Everything you need to know about TeenVerseHub.
                </p>
              </RevealOnScroll>

              {/* Contact CTA Box */}
              <RevealOnScroll delay={0.2}>
                <div className={`p-8 rounded-[2rem] border relative overflow-hidden ${darkMode ? 'bg-[#111] border-white/10' : 'bg-indigo-50 border-indigo-100 shadow-xl shadow-indigo-100/50'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-indigo-600 shadow-sm'}`}>
                    <MessageCircle size={24} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Still have questions?</h3>
                  <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>We're happy to help you out.</p>
                  
                  <button 
                    onClick={() => handleNav('contact')} 
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-[#ccff00] text-black hover:bg-yellow-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}
                  >
                    Visit Contact Page <ArrowRight size={18} />
                  </button>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Accordion */}
          <div className="lg:w-[60%] space-y-4 pt-4 lg:pt-0">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <RevealOnScroll key={index} delay={index * 0.05}>
                  <motion.div 
                    className={`border rounded-3xl overflow-hidden transition-colors ${
                      darkMode 
                        ? (isOpen ? 'bg-[#111] border-[#ccff00]/30' : 'bg-[#0a0a0a] border-white/10 hover:border-white/20') 
                        : (isOpen ? 'bg-white border-indigo-400 shadow-xl shadow-indigo-100' : 'bg-white border-slate-200 hover:border-slate-300')
                    }`}
                  >
                    <button 
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                    >
                      <h3 className={`text-xl md:text-2xl font-bold pr-8 ${
                        darkMode 
                          ? (isOpen ? 'text-[#ccff00]' : 'text-white') 
                          : (isOpen ? 'text-indigo-600' : 'text-slate-900')
                      }`}>
                        {faq.q}
                      </h3>
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${
                        darkMode 
                          ? (isOpen ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-white') 
                          : (isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500')
                      }`}>
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <div className={`px-6 md:px-8 pb-8 pt-0 text-lg leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                </RevealOnScroll>
              );
            })}
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className={`pt-20 pb-10 border-t ${darkMode ? 'bg-black border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
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
                {['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Safety Guidelines'].map(l => (
                  <li key={l}>
                    <button onClick={() => handleFooterLink(l)} className={`transition-colors ${darkMode ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

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

export default FaqPage;