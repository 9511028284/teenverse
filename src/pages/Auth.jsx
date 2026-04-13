import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, CheckCircle, Fingerprint, Sun, Moon, Rocket, Key, Sparkles } from 'lucide-react';
import { useAuthLogic } from '../hooks/useAuthLogic';
import { Toast, LegalFooter } from '../components/auth/AuthUI';
import { LoginView, SignupView, ForgotPasswordView, UpdatePasswordView } from '../components/auth/AuthForms';

const pageTransition = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
};

// --- Global Floating Background Icons ---
const BackgroundFloat = ({ Icon, className, size, delay = 0, duration = 20 }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : {
        y: [0, -40, 0],
        x: [0, 30, 0],
        rotate: [0, 8, -8, 0]
      }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      className={`absolute pointer-events-none z-0 text-[#0f0f0f]/[0.03] dark:text-white/[0.03] ${className}`}
    >
      <Icon size={size} strokeWidth={0.5} />
    </motion.div>
  );
};

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  const { state, actions, refs } = useAuthLogic(onLogin, onSignUpSuccess);
  const prefersReducedMotion = useReducedMotion();
  
  // Theme State Management (Defaulted to true for Dark Mode)
  const [isDark, setIsDark] = useState(true);

  // Sync theme globally to the <html> tag so Tailwind works everywhere
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      document.body.style.backgroundColor = '#050505'; 
    } else {
      html.classList.remove('dark');
      document.body.style.backgroundColor = '#edece8';
    }
  }, [isDark]);

  return (
    <div className="min-h-screen w-full bg-[#edece8] dark:bg-[#050505] flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* Subtle Grain Overlay for Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.05] z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}></div>

      {/* --- Animated Desktop Background Icons --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center hidden md:flex">
         <BackgroundFloat Icon={Rocket} size={450} className="-top-20 -left-32 -rotate-12" delay={0} duration={25} />
         <BackgroundFloat Icon={Key} size={500} className="-bottom-32 -right-20 rotate-12" delay={5} duration={30} />
         <BackgroundFloat Icon={Sparkles} size={300} className="top-10 right-40 rotate-45" delay={2} duration={22} />
      </div>

      <Toast toast={state.toast} />

      {/* MAIN CONTAINER: Desktop Split-Screen Bento Box */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
        style={{ willChange: "transform, opacity" }}
        className="w-full max-w-[1100px] h-[85vh] min-h-[600px] max-h-[800px] bg-white dark:bg-[#0f0f0f] rounded-[28px] border border-[#00000014] dark:border-white/10 shadow-[0_4px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row relative z-20 transition-colors duration-500"
      >
        
        {/* --- WINDOW CONTROLS (THEME TOGGLE + CLOSE) --- */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="text-[#9a9a9a] dark:text-[#a1a1aa] hover:text-[#0f0f0f] dark:hover:text-white transition-all bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-2.5 rounded-full hover:bg-[#edece8] dark:hover:bg-[#222] shadow-sm hover:shadow-md group"
              aria-label="Toggle Theme"
            >
              <motion.div initial={false} animate={{ rotate: isDark ? 180 : 0 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="flex items-center justify-center w-[18px] h-[18px]">
                {isDark ? <Sun size={18} className="text-amber-200" /> : <Moon size={18} />}
              </motion.div>
            </button>

            {/* Close Button */}
            <button 
              onClick={() => setView('home')} 
              className="text-[#9a9a9a] dark:text-[#a1a1aa] hover:text-[#0f0f0f] dark:hover:text-white transition-all bg-[#f5f4f1] dark:bg-[#1a1a1a] border border-black/5 dark:border-white/10 p-2.5 rounded-full hover:bg-[#edece8] dark:hover:bg-[#222] shadow-sm hover:shadow-md group"
              aria-label="Close"
            >
                <X size={18} className="group-hover:rotate-90 transition-transform duration-300"/>
            </button>
        </div>

        {/* --- LEFT SIDE (STYLISH & PROFESSIONAL DESKTOP VIEW) --- */}
        <div className="hidden md:flex w-[45%] bg-[#f5f4f1] dark:bg-[#0a0a0a] relative flex-col justify-between p-12 border-r border-[#00000014] dark:border-white/5 overflow-hidden group transition-colors duration-500">
          
          {/* Background FX: Minimalist Architectural Grid & Soft Glow */}
          <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
             <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-[radial-gradient(circle,rgba(0,0,0,0.03)_0%,transparent_60%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_60%)] rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 mt-4">
            <div className="w-12 h-12 bg-[#0f0f0f] dark:bg-white rounded-xl flex items-center justify-center mb-10 shadow-md transition-colors duration-500">
                <Fingerprint className="text-white dark:text-[#0f0f0f]" size={24}/>
            </div>
            
            <div className="space-y-4">
                <h1 className="text-[2.75rem] font-semibold tracking-[-0.04em] text-[#0f0f0f] dark:text-white leading-[1.1] transition-colors duration-500">
                    Elevate your <br/> trajectory.
                </h1>
                <p className="text-[#9a9a9a] dark:text-[#a1a1aa] text-[0.95rem] font-normal leading-relaxed max-w-[90%] transition-colors duration-500">
                    Access the definitive network where exceptional young talent meets verified, high-tier opportunities. Build your legacy on the grid.
                </p>
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-8 border-t border-black/5 dark:border-white/5 transition-colors duration-500">
             <LegalFooter mobile={false} />
          </div>
        </div>

        {/* --- RIGHT SIDE (DYNAMIC FORMS) --- */}
        <div className="flex-1 p-6 md:p-14 overflow-y-auto relative flex flex-col bg-white dark:bg-[#0f0f0f] custom-scrollbar transition-colors duration-500">
          <AnimatePresence mode="wait">
             
             {/* SUCCESS EMAIL SENT VIEW */}
             {state.verificationSent ? (
                 <motion.div 
                    key="sent" 
                    variants={pageTransition} initial="initial" animate="animate" exit="exit"
                    className="text-center my-auto flex flex-col justify-center items-center w-full max-w-sm mx-auto"
                 >
                     <div className="w-[64px] h-[64px] bg-[#e8faf2] dark:bg-[#e8faf2]/10 rounded-full flex items-center justify-center mx-auto mb-[1.5rem] text-[#1a7a4a] dark:text-[#4ade80] transition-colors duration-500">
                        <CheckCircle size={32} strokeWidth={2.5}/>
                     </div>
                     <h2 className="text-[2rem] font-semibold text-[#0f0f0f] dark:text-white leading-[1.1] tracking-[-0.04em] mb-[0.35rem] transition-colors duration-500">Check your inbox.</h2>
                     <p className="text-[0.9rem] text-[#9a9a9a] dark:text-[#a1a1aa] font-normal mb-8 leading-[1.5] transition-colors duration-500">
                        A secure magic link has been deployed to <br/>
                        <span className="font-mono text-[#0f0f0f] dark:text-white font-medium mt-2 inline-block px-3 py-1 bg-[#f5f4f1] dark:bg-[#1a1a1a] rounded-lg border border-black/10 dark:border-white/10 transition-colors duration-500">
                           {state.formData.email}
                        </span>
                     </p>
                     
                     <button onClick={() => { actions.setVerificationSent(false); actions.setViewMode('login'); }} className="w-full p-[14px] font-medium text-[0.9rem] bg-[#f5f4f1] dark:bg-[#1a1a1a] text-[#0f0f0f] dark:text-white border border-black/10 dark:border-white/10 rounded-[16px] transition-all hover:bg-[#edece8] dark:hover:bg-[#222] active:scale-95 tracking-[-0.01em]">
                        Return to Login
                     </button>
                 </motion.div>
             ) : 
             
             /* CORE AUTHENTICATION FORMS */
             (
                 <motion.div 
                    key={state.viewMode}
                    variants={pageTransition} 
                    initial="initial" 
                    animate="animate" 
                    exit="exit"
                    className="w-full max-w-[420px] mx-auto my-auto flex-1 flex flex-col justify-center py-8"
                 >
                    {state.viewMode === 'login' && <LoginView state={state} actions={actions} refs={refs} />}
                    {state.viewMode === 'signup' && <SignupView state={state} actions={actions} refs={refs} />}
                    {state.viewMode === 'update_password' && <UpdatePasswordView state={state} actions={actions} />}
                    {state.viewMode === 'forgot' && <ForgotPasswordView state={state} actions={actions} refs={refs} />}
                 </motion.div>
             )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;