import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldAlert, Sparkles, Zap, CheckCircle } from 'lucide-react';
import { useAuthLogic } from '../hooks/useAuthLogic';
import { Toast, FloatingNotif, LegalFooter } from '../components/auth/AuthUI';
import { LoginView, SignupView, ForgotPasswordView, UpdatePasswordView } from '../components/auth/AuthForms';

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  const { state, actions, refs } = useAuthLogic(onLogin, onSignUpSuccess);
  
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-gray-100 relative overflow-hidden">
      
      {/* BACKGROUND FX */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"/>
         <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 15, repeat: Infinity, delay: 2 }} className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"/>
      </div>

      <Toast toast={state.toast} />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }} className="w-full max-w-[1200px] h-[85vh] bg-[#0F172A]/40 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative z-10">
        
        <button onClick={() => setView('home')} className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/5 p-2 rounded-full hover:bg-white/10 group"><X size={20} className="group-hover:rotate-90 transition-transform"/></button>

        {/* LEFT SIDE (HERO) */}
        <div className="hidden md:flex w-[45%] relative flex-col justify-between p-12 bg-[#050505] overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2500&auto=format&fit=crop" alt="3D Abstract" className="w-full h-full object-cover opacity-40 mix-blend-lighten hover:scale-105 transition-transform duration-[10s]"/>
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
          </div>
          <FloatingNotif icon={Check} title="Payment Received" sub="$250.00" delay={1} x={40} y={100} />
          <FloatingNotif icon={Zap} title="New Job Match" sub="UI Design • Remote" delay={3} x={250} y={200} />
          
          <div className="relative z-10 mt-auto">
            <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl mb-8 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]"><Sparkles className="text-indigo-400" size={32}/></div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-6 leading-[0.9]">FUTURE <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">OF WORK.</span></h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed max-w-sm border-l-2 border-indigo-500/50 pl-4">Enter the metaverse of freelancing. Secure payments, verified clients, and a portfolio that works for you.</p>
          </div>
          <div className="relative z-10"><LegalFooter mobile={false} /></div>
        </div>

        {/* RIGHT SIDE (FORMS) */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col justify-center custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
          <AnimatePresence mode="wait">
             {state.showVerify ? (
                 /* PARENT OTP VIEW */
                 <motion.div key="verify" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center my-auto w-full max-w-md mx-auto">
                     <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.2)] animate-pulse"><ShieldAlert size={48} /></div>
                     <h2 className="text-2xl font-bold mb-2 text-white">Guardian Protocol</h2>
                     <p className="text-gray-400 mb-8 text-sm">Code sent to <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{state.formData.parentEmail}</span></p>
                     <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 text-center text-4xl tracking-[0.5em] font-mono text-white focus:border-orange-500 focus:shadow-[0_0_30px_rgba(249,115,22,0.3)] outline-none transition-all mb-6" placeholder="000000" maxLength={6} value={state.otp} onChange={(e) => actions.setOtp(e.target.value)} />
                     <div className="mb-8 text-left bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                         <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center"><input type="checkbox" className="peer sr-only" checked={state.parentAgreed} onChange={(e) => actions.setParentAgreed(e.target.checked)}/><div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"></div><Check size={14} className="absolute text-black opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 pointer-events-none"/></div>
                            <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors"><span className="font-bold text-orange-400">LEGAL DECLARATION:</span> I am the parent/legal guardian. I consent to my child using TeenVerseHub for non-hazardous digital services.</span>
                         </label>
                     </div>
                     <button onClick={actions.handleVerifyParentOtp} disabled={state.loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-900/50 transform active:scale-95 uppercase tracking-widest text-sm">{state.loading ? 'Verifying...' : 'Verify & Consent'}</button>
                     <button onClick={() => actions.setShowVerify(false)} className="mt-6 text-gray-500 text-xs uppercase tracking-wider hover:text-white transition-colors underline">Change Parent Email</button>
                 </motion.div>
             ) : state.verificationSent ? (
                 /* SUCCESS EMAIL SENT */
                 <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full max-w-md mx-auto">
                     <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]"><CheckCircle size={40} /></div>
                     <h2 className="text-3xl font-bold mb-4 text-white">Transmission Sent</h2>
                     <p className="text-gray-400 mb-8">We've deployed a secure magic link to <span className="text-white font-bold">{state.formData.email}</span>.</p>
                     <button onClick={() => { actions.setVerificationSent(false); actions.setViewMode('login'); }} className="text-indigo-400 font-bold uppercase tracking-widest">Return to Base</button>
                 </motion.div>
             ) : (
                 <div className="w-full max-w-md mx-auto">
                    {state.viewMode === 'login' && <LoginView state={state} actions={actions} />}
                    {state.viewMode === 'signup' && <SignupView state={state} actions={actions} refs={refs} />}
                      {state.viewMode === 'update_password' && <UpdatePasswordView state={state} actions={actions} />}
                        {state.viewMode === 'forgot' && <ForgotPasswordView state={state} actions={actions} refs={refs} />}
                 
                 </div>
             )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;