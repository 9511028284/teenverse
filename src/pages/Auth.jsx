import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldAlert, Sparkles, Zap, CheckCircle, Fingerprint } from 'lucide-react';
import { useAuthLogic } from '../hooks/useAuthLogic';
import { Toast, FloatingNotif, LegalFooter } from '../components/auth/AuthUI';
import { LoginView, SignupView, ForgotPasswordView, UpdatePasswordView } from '../components/auth/AuthForms';

// --- MOTION VARIANTS FOR ULTRA-SMOOTH TRANSITIONS ---
const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -20, scale: 0.96, filter: "blur(8px)" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } // Apple-like spring easing
};

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  const { state, actions, refs } = useAuthLogic(onLogin, onSignUpSuccess);
  
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 sm:p-8 font-sans text-gray-100 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* 1. DESIGNER TOUCH: SVG NOISE TEXTURE OVERLAY */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {/* 2. BACKGROUND FX: Cinematic Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute inset-0 origin-center">
             <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[140px] mix-blend-screen pointer-events-none"/>
             <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-600/10 rounded-full blur-[140px] mix-blend-screen pointer-events-none"/>
         </motion.div>
         {/* Subtle Grid Pattern */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <Toast toast={state.toast} />

      {/* MAIN CONTAINER: Frosted Glass Bento Box */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="w-full max-w-[1280px] h-[88vh] bg-[#0a0a0a]/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        
        {/* Close Button */}
        <button onClick={() => setView('home')} className="absolute top-6 right-6 z-50 text-gray-500 hover:text-white transition-all bg-black/20 backdrop-blur-md border border-white/10 p-3 rounded-full hover:bg-white/10 group hover:scale-105">
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300"/>
        </button>

        {/* --- LEFT SIDE (EDITORIAL HERO) --- */}
        <div className="hidden md:flex w-[45%] relative flex-col justify-between p-14 border-r border-white/5 bg-black/40 overflow-hidden group">
          
          <div className="absolute inset-0 z-0 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" alt="Abstract Flow" className="w-full h-full object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 group-hover:opacity-40 transition-all duration-[10s] ease-out"/>
             <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/80 to-transparent"></div>
          </div>
          
          {/* Floating UI Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <FloatingNotif icon={Check} title="Identity Verified" sub="ZK-Proof Secured" delay={1} x={40} y={80} />
            <FloatingNotif icon={Zap} title="System Optimal" sub="Latency: 12ms" delay={3} x={280} y={220} />
          </div>
          
          <div className="relative z-10">
             {/* Logo/Brand mark */}
            <div className="w-12 h-12 bg-indigo-500/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)] mb-8">
                <Fingerprint className="text-indigo-400" size={24}/>
            </div>
            
            {/* Designer Typography */}
            <div className="space-y-2">
                <p className="font-mono text-indigo-400 text-xs tracking-[0.3em] uppercase">Authentication Protocol</p>
                <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.85] pb-2">
                    ENTER <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">THE GRID.</span>
                </h1>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-gray-400 text-lg font-light leading-relaxed max-w-sm border-l border-white/20 pl-6 mb-12">
                Access the decentralized workspace. Where top-tier talent meets verified opportunities.
            </p>
            <LegalFooter mobile={false} />
          </div>
        </div>

        {/* --- RIGHT SIDE (DYNAMIC FORMS) --- */}
        <div className="flex-1 p-6 md:p-16 overflow-y-auto relative flex flex-col justify-center custom-scrollbar">
          {/* Ensure AnimatePresence watches the top-level state changes */}
          <AnimatePresence mode="wait">
            
            {/* 1. PARENT OTP VIEW */}
             {state.showVerify ? (
                 <motion.div 
                    key="verify" 
                    variants={pageTransition} initial="initial" animate="animate" exit="exit"
                    className="text-center my-auto w-full max-w-md mx-auto"
                 >
                     <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-orange-500 border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
                        <ShieldAlert size={36} />
                     </div>
                     <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">Guardian Protocol</h2>
                     <p className="text-gray-400 mb-8 text-sm">Code dispatched to <span className="text-white font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-md">{state.formData.parentEmail}</span></p>
                     
                     <input 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 text-center text-4xl tracking-[0.5em] font-mono text-white focus:border-orange-500 focus:bg-orange-500/5 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all mb-6 placeholder:text-white/10" 
                        placeholder="000000" 
                        maxLength={6} 
                        value={state.otp} 
                        onChange={(e) => actions.setOtp(e.target.value)} 
                     />
                     
                     <div className="mb-8 text-left bg-gradient-to-br from-orange-500/10 to-transparent p-5 rounded-2xl border border-orange-500/20">
                         <label className="flex items-start gap-4 cursor-pointer group">
                            <div className="relative flex items-center mt-0.5">
                                <input type="checkbox" className="peer sr-only" checked={state.parentAgreed} onChange={(e) => actions.setParentAgreed(e.target.checked)}/>
                                <div className="w-5 h-5 border-2 border-white/20 rounded-md peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all group-hover:border-white/40"></div>
                                <Check size={14} className="absolute text-black opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 pointer-events-none"/>
                            </div>
                            <span className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                <span className="font-bold text-orange-400">LEGAL DECLARATION:</span> I am the parent/legal guardian and consent to my child accessing this platform.
                            </span>
                         </label>
                     </div>
                     
                     <button onClick={actions.handleVerifyParentOtp} disabled={state.loading} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transform active:scale-[0.98] uppercase tracking-widest text-sm">
                        {state.loading ? 'Verifying Identity...' : 'Authorize Access'}
                     </button>
                     <button onClick={() => actions.setShowVerify(false)} className="mt-8 text-gray-500 text-xs uppercase tracking-widest hover:text-white transition-colors">Abort & Change Email</button>
                 </motion.div>
             ) : 
             
             /* 2. SUCCESS EMAIL SENT VIEW */
             state.verificationSent ? (
                 <motion.div 
                    key="sent" 
                    variants={pageTransition} initial="initial" animate="animate" exit="exit"
                    className="text-center my-auto w-full max-w-md mx-auto"
                 >
                     <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-400 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                        <CheckCircle size={36} />
                     </div>
                     <h2 className="text-3xl font-bold mb-4 text-white tracking-tight">Transmission Sent</h2>
                     <p className="text-gray-400 mb-8 leading-relaxed">A secure magic link has been deployed to <br/><span className="text-white font-mono mt-2 block">{state.formData.email}</span></p>
                     
                     <button onClick={() => { actions.setVerificationSent(false); actions.setViewMode('login'); }} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] uppercase tracking-widest text-sm">
                        Return to Login
                     </button>
                 </motion.div>
             ) : 
             
             /* 3. CORE AUTHENTICATION FORMS */
             (
                 <motion.div 
                    key={state.viewMode} /* Key is crucial here for AnimatePresence to detect the change */
                    variants={pageTransition} 
                    initial="initial" 
                    animate="animate" 
                    exit="exit"
                    className="w-full max-w-md mx-auto my-auto"
                 >
                    {state.viewMode === 'login' && <LoginView state={state} actions={actions} />}
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