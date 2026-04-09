import React, { useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, Loader2, User, Briefcase, 
  Check, Key, Globe, Gift, ArrowRight, ArrowLeft,
  Rocket, Shield, Sparkles, Palette, Calendar,
  MapPin, Map, Megaphone, ChevronDown, Phone
} from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { StepIndicator, SocialButton, BackButton } from './AuthUI';

// --- CONSTANTS ---
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

const HEAR_ABOUT_OPTIONS = ['YouTube', 'Instagram', 'LinkedIn', 'Friend', 'Other'];

// --- ⚡ NEXT-GEN ANIMATION VARIANTS ---
const viewVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98, filter: "blur(4px)" },
  visible: { 
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 280, damping: 22, staggerChildren: 0.08, delayChildren: 0.1 } 
  },
  exit: { opacity: 0, y: -10, scale: 0.98, filter: "blur(4px)", transition: { duration: 0.2, ease: "easeOut" } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

// --- ICONS ---
const GoogleIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
));

const GithubIcon = memo(() => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-slate-900">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
));

const FloatingSVGIcon = memo(({ Icon, className, delay = 0 }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div 
      animate={prefersReducedMotion ? {} : { y: [0, -12, 0], rotate: [0, 2, -2, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ willChange: "transform" }} 
      className={`absolute pointer-events-none z-0 text-indigo-500/10 ${className}`}
    >
      <Icon size={140} strokeWidth={1} />
    </motion.div>
  );
});

// --- SMART BUTTON COMPONENT ---
const ActionButton = ({ onClick, loading, icon: Icon, children, className }) => (
  <motion.button 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick} 
    disabled={loading} 
    className={`w-full font-black py-4 rounded-2xl transition-colors shadow-lg flex justify-center items-center gap-2 uppercase tracking-widest text-sm relative overflow-hidden group z-10 ${className}`}
  >
     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl"></div>
     <AnimatePresence mode="wait">
       {loading ? (
         <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
           <Loader2 className="animate-spin relative z-10"/>
         </motion.div>
       ) : (
         <motion.span key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative z-10 flex items-center gap-2">
           {children} {Icon && <Icon size={18} className="group-hover:translate-x-1 transition-transform"/>}
         </motion.span>
       )}
     </AnimatePresence>
  </motion.button>
);

// --- LOGIN VIEW ---
export const LoginView = memo(({ state, actions, refs }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <motion.div key="login" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
      <FloatingSVGIcon Icon={Rocket} className="-top-16 -right-8" delay={0.2} />
      
      <motion.div variants={itemVariants} className="mb-8 relative z-10">
         <h2 className="text-4xl font-black mb-2 text-slate-900 tracking-tight">WELCOME <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-500">BACK.</span></h2>
         <p className="text-slate-500 font-medium">Initialize your dashboard session.</p>
      </motion.div>

      <div className="space-y-6 relative z-10">
        <motion.div variants={itemVariants} className="space-y-2 relative">
           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
           <div className="bg-white/90 border border-slate-200/80 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all group shadow-sm backdrop-blur-xl hover:bg-white">
              <Mail size={18} className="text-slate-400 mr-3 group-focus-within:text-indigo-500 transition-colors"/>
              <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 placeholder-slate-400 font-mono" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} />
           </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2 relative z-10">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <button onClick={() => actions.setViewMode('forgot')} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider">Forgot?</button>
           </div>
           <div className="bg-white/90 border border-slate-200/80 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all group shadow-sm backdrop-blur-xl hover:bg-white">
              <Lock size={18} className="text-slate-400 mr-3 group-focus-within:text-indigo-500 transition-colors"/>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 placeholder-slate-400 font-mono" value={state.formData.password} onChange={(e) => actions.updateField('password', e.target.value)} />
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer relative z-20 focus:outline-none">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </motion.button>
           </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
          {state.CLOUDFLARE_SITE_KEY && (
              <div className="mt-6 flex justify-center py-2 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 relative z-10 min-h-[65px] items-center">
                  <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="light" />
              </div>
          )}
            
          <ActionButton onClick={actions.handleFinalSubmit} loading={state.loading} icon={ArrowRight} className="mt-6 bg-slate-900 text-white hover:bg-slate-800">
             Login
          </ActionButton>
      </motion.div>
       
      <motion.div variants={itemVariants} className="flex items-center gap-4 my-8 opacity-60">
         <div className="h-px bg-slate-300 flex-1"></div>
         <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Or access via</span>
         <div className="h-px bg-slate-300 flex-1"></div>
      </motion.div>
       
      <motion.div variants={itemVariants} className="flex gap-4 relative z-10">
         <SocialButton icon={<GoogleIcon />} onClick={() => actions.handleSocialLogin('google')} label="Google" />
         <SocialButton icon={<GithubIcon />} onClick={() => actions.handleSocialLogin('github')} label="GitHub" />
      </motion.div>
       
      <motion.p variants={itemVariants} className="mt-8 text-center text-slate-600 text-sm font-medium relative z-10">
         No access key? <button onClick={() => actions.setViewMode('signup')} className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors ml-1 uppercase tracking-wide text-xs group relative">
             Initialize Signup
             <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-indigo-500 transition-all group-hover:w-full"></span>
         </button>
      </motion.p>
    </motion.div>
  );
});

// --- SIGNUP VIEW ---
// --- SIGNUP VIEW ---
export const SignupView = memo(({ state, actions, refs }) => {
  const { step, formData, isPhoneVerified, otpLoading, socialUser, agreedToTerms } = state;
  
  return (
    <motion.div key="signup" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col relative w-full max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-8 relative z-10">
            {step > 1 ? (
                <BackButton onClick={actions.handleBack} label=""/>
            ) : (
                <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-bold transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Login
                </button>
            )}
            <StepIndicator step={step} />
            <div className="w-16"></div> 
        </div>

        <AnimatePresence mode="wait">
            {/* STEP 1: ROLE */}
            {step === 1 && (
                <motion.div key="step1" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 relative">
                    <FloatingSVGIcon Icon={Sparkles} className="-top-10 -right-4" delay={0.1} />
                    <motion.div variants={itemVariants} className="relative z-10 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-black mb-2 text-slate-900 tracking-tight">IDENTIFY</h2>
                        <p className="text-slate-500 font-medium text-lg">Select your operating mode.</p>
                    </motion.div>
                    
                    <div className="grid gap-5 relative z-10">
                        {['freelancer', 'client'].map((r) => (
                            <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={r} onClick={() => actions.updateField('role', r)} className={`p-6 rounded-3xl border transition-all text-left relative overflow-hidden group duration-300 ${formData.role === r ? 'border-indigo-500 bg-indigo-50 shadow-md ring-4 ring-indigo-500/10' : 'border-slate-200 bg-white/90 backdrop-blur-xl hover:border-indigo-300 shadow-sm'}`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"/>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`p-4 rounded-2xl transition-colors duration-300 ${formData.role === r ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>{r === 'freelancer' ? <User size={28}/> : <Briefcase size={28}/>}</div>
                                    <AnimatePresence>
                                        {formData.role === r && (
                                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }} className="bg-indigo-600 text-white p-1.5 rounded-full shadow-md"><Check size={16}/></motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <h3 className="text-2xl font-black capitalize relative z-10 text-slate-900">{r}</h3>
                                <p className="text-sm text-slate-500 mt-1 relative z-10 font-bold uppercase tracking-wide">{r === 'freelancer' ? 'Access Jobs & Earn' : 'Hire Talent & Manage'}</p>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* STEP 2: CREDENTIALS */}
            {step === 2 && !socialUser && (
                <motion.div key="step2" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8 relative">
                    <FloatingSVGIcon Icon={Key} className="-top-8 -right-4" delay={0.3} />
                    <motion.div variants={itemVariants} className="relative z-10 text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-black mb-2 text-slate-900 tracking-tight">SECURE ACCESS</h2>
                        <p className="text-slate-500 font-medium text-lg">Define your login parameters.</p>
                    </motion.div>
                    <div className="space-y-5 relative z-10">
                        <motion.div variants={itemVariants} className="relative group">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <input type="email" value={formData.email} onChange={(e) => actions.updateField('email', e.target.value)} className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl py-4 pl-12 pr-4 min-h-[56px] text-slate-900 placeholder-slate-400 font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm hover:bg-white text-lg" placeholder="Email Address"/>
                        </motion.div>
                        <motion.div variants={itemVariants} className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <input type="password" value={formData.password} onChange={(e) => actions.updateField('password', e.target.value)} className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl py-4 pl-12 pr-4 min-h-[56px] text-slate-900 placeholder-slate-400 font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm hover:bg-white text-lg" placeholder="Password"/>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {/* STEP 3: PERSONAL & LOCATION */}
            {step === 3 && (
                <motion.div key="step3" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 relative">
                    <FloatingSVGIcon Icon={Palette} className="-top-12 -right-6" delay={0.5} />
                    <motion.div variants={itemVariants} className="relative z-10 text-center md:text-left mb-6">
                        <h2 className="text-3xl md:text-4xl font-black mb-2 text-slate-900 tracking-tight">PROFILE DATA</h2>
                        <p className="text-slate-500 font-medium text-lg">Initialize your public persona.</p>
                    </motion.div>
                    
                    <div className="grid md:grid-cols-2 gap-5 relative z-10">
                        {/* ⚡ FIXED: Added icon and matching padding to Name */}
                        <motion.div variants={itemVariants} className="relative group">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <input value={formData.name || ''} onChange={(e) => actions.updateField('name', e.target.value)} className="w-full pl-12 pr-4 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl py-4 min-h-[56px] text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 shadow-sm hover:bg-white" placeholder="Full Name"/>
                        </motion.div>
                         
                        {/* ⚡ FIXED: Phone & Verify Button Layout now matches perfectly */}
                        <motion.div variants={itemVariants} className="flex gap-3 items-center">
                            <div className="relative group flex-1 min-w-0">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                                <input 
                                    type="tel" value={formData.phone || ''} 
                                    onChange={(e) => { if(isPhoneVerified) actions.setIsPhoneVerified(false); actions.updateField('phone', e.target.value); }} 
                                    disabled={isPhoneVerified}
                                    className={`w-full pl-12 pr-4 bg-white/90 backdrop-blur-xl border ${isPhoneVerified ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-slate-200/80 text-slate-900'} rounded-2xl py-4 min-h-[56px] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 font-mono shadow-sm hover:bg-white`} 
                                    placeholder="9876543210"
                                />
                            </div>
                            <AnimatePresence mode="wait">
                                {!isPhoneVerified ? (
                                    <motion.button 
                                        key="verify-btn" 
                                        initial={{ opacity: 0, width: 0 }} 
                                        animate={{ opacity: 1, width: 'auto' }} 
                                        exit={{ opacity: 0, width: 0 }} 
                                        type="button" 
                                        onClick={actions.handlePhoneVerification} 
                                        disabled={otpLoading} 
                                        // ⚡ Locked height to match input
                                        className="shrink-0 min-w-[120px] min-h-[56px] bg-slate-900 text-white px-6 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center overflow-hidden whitespace-nowrap"
                                    >
                                        {otpLoading ? <Loader2 className="animate-spin" size={18}/> : 'Verify'}
                                    </motion.button>
                                ) : (
                                    <motion.div key="success-icon" initial={{ scale: 0 }} animate={{ scale: 1, type: "spring" }} className="shrink-0 min-w-[64px] min-h-[56px] bg-green-100 border border-green-300 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
                                        <Check size={24} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 relative z-10">
                        <motion.div variants={itemVariants} className="relative group">
                            <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"/>
                            <input value="India" readOnly className="w-full pl-12 bg-indigo-50/80 backdrop-blur-xl border border-indigo-100 rounded-2xl p-4 min-h-[56px] text-indigo-900 outline-none font-bold shadow-sm cursor-not-allowed" />
                        </motion.div>

                        <motion.div variants={itemVariants} className="relative group">
                            <Map size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <select value={formData.state || ''} onChange={(e) => actions.updateField('state', e.target.value)} className="w-full pl-12 pr-10 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl py-4 min-h-[56px] text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm appearance-none cursor-pointer hover:bg-white">
                                <option value="" disabled className="text-slate-400">Select State/UT</option>
                                {INDIAN_STATES.map(state => (
                                    <option key={state} value={state} className="text-slate-900">{state}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                        </motion.div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-5 relative z-10">
                        <motion.div variants={itemVariants} className="relative group">
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                            <input value={formData.pincode || ''} onChange={(e) => actions.updateField('pincode', e.target.value.replace(/\D/g, ''))} maxLength={6} className="w-full pl-12 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 min-h-[56px] text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 font-mono shadow-sm tracking-widest hover:bg-white" placeholder="Pincode"/>
                        </motion.div>

                        <motion.div variants={itemVariants} className="relative group">
                            <Gift size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors"/>
                            <input value={formData.referralCode || ''} onChange={(e) => actions.updateField('referralCode', e.target.value.toUpperCase())} className="w-full pl-12 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 min-h-[56px] text-indigo-900 placeholder-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all uppercase tracking-widest font-mono shadow-sm" placeholder="Invite Code"/>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {/* STEP 4: FINAL */}
            {step === 4 && (
                <motion.div key="step4" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 relative flex flex-col h-full">
                    <FloatingSVGIcon Icon={Shield} className="-top-12 -right-4" delay={0.2} />
                    <motion.div variants={itemVariants} className="relative z-10 text-center md:text-left shrink-0">
                        <h2 className="text-3xl md:text-4xl font-black mb-2 text-slate-900 tracking-tight">FINAL PROTOCOL</h2>
                        <p className="text-slate-500 font-medium text-lg">Complete registration.</p>
                    </motion.div>
                    
                    <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-3 custom-scrollbar relative z-10 pb-6 flex-1">
                        {formData.role === 'freelancer' ? (
                            <motion.div variants={itemVariants} className="space-y-5">
                                <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date of Birth</label>
                                        <AnimatePresence>
                                            {state.age && (
                                                <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                                                    AGE: {state.age}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Calendar className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <input type="date" value={formData.dob || ''} onChange={(e) => actions.updateField('dob', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 min-h-[56px] text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono transition-colors cursor-pointer appearance-none hover:bg-white relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <motion.button whileTap={{ scale: 0.95 }} key={g} onClick={() => actions.updateField('gender', g)} className={`py-4 rounded-2xl border text-sm font-black uppercase tracking-wider transition-all shadow-sm ${formData.gender === g ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white/90 border-slate-200/80 text-slate-500 hover:bg-slate-50 backdrop-blur-xl'}`}>
                                            {g}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div variants={itemVariants} className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 block">Company Details</label>
                                <div className="relative group">
                                    <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                                    <input placeholder="Organization Name (Optional)" value={formData.org || ''} onChange={(e) => actions.updateField('org', e.target.value)} className="w-full pl-12 pr-4 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 min-h-[64px] text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm hover:bg-white" />
                                </div>
                            </motion.div>
                        )}
                         
                        <motion.div variants={itemVariants} className="pt-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-3 block">How did you hear about TeenerseHub?</label>
                            <div className="relative group">
                                <Megaphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"/>
                                <select value={formData.source || ''} onChange={(e) => actions.updateField('source', e.target.value)} className="w-full pl-12 pr-10 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl py-4 min-h-[56px] text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm appearance-none cursor-pointer hover:bg-white">
                                    <option value="" disabled className="text-slate-400">Select a platform</option>
                                    {HEAR_ABOUT_OPTIONS.map(opt => (
                                        <option key={opt} value={opt} className="text-slate-900">{opt}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-4">
                            <label className="flex items-center gap-4 cursor-pointer group p-5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all">
                                <motion.input whileTap={{ scale: 0.8 }} type="checkbox" className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer shrink-0" checked={agreedToTerms} onChange={(e) => actions.setAgreedToTerms(e.target.checked)}/>
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 leading-tight">I agree to the <span className="text-indigo-600 underline font-bold decoration-2 underline-offset-2">Terms</span> and <span className="text-indigo-600 underline font-bold decoration-2 underline-offset-2">Privacy</span>.</span>
                            </label>
                            
                            {state.CLOUDFLARE_SITE_KEY && (
                                <div className="mt-5 flex justify-center bg-slate-50/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/80 min-h-[65px] items-center">
                                    <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="light" />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div layout className="mt-auto pt-8 border-t border-slate-200 flex justify-end relative z-10 shrink-0">
            {step < 4 ? 
              <ActionButton onClick={actions.handleNext} loading={state.loading} icon={ArrowRight} className="bg-slate-900 text-white hover:bg-slate-800 w-auto px-10 min-w-[160px]">
                Next
              </ActionButton> 
              : 
              <ActionButton onClick={actions.handleFinalSubmit} loading={state.loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110 w-auto px-10 min-w-[200px] shadow-md">
                Initialize
              </ActionButton>
            }
        </motion.div>
    </motion.div>
  );
});
// --- FORGOT PASSWORD VIEW ---
export const ForgotPasswordView = memo(({ state, actions, refs }) => {
  return (
    <motion.div key="forgot-pw" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
      <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 text-sm font-bold transition-colors group relative z-10">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Login
      </button>
       
      <AnimatePresence mode="wait">
        {!state.showResetVerify ? (
            <motion.div key="email-step" variants={viewVariants} initial="hidden" animate="visible" exit="exit">
                <FloatingSVGIcon Icon={Key} className="-top-4 -right-4" delay={0.2} />
                <motion.div variants={itemVariants} className="relative z-10">
                  <h2 className="text-3xl font-black mb-2 text-slate-900">Reset Access</h2>
                  <p className="text-slate-500 font-medium mb-8">Enter your registered email to receive a One-Time Protocol.</p>
                </motion.div>
                
                <form onSubmit={actions.handleForgotPassword} className="space-y-6 relative z-10">
                  <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all shadow-sm hover:bg-white">
                          <Mail size={18} className="text-slate-400 mr-3"/>
                          <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 placeholder-slate-400 font-mono" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} required />
                      </div>
                  </motion.div>
                   
                  <motion.div variants={itemVariants}>
                      {state.CLOUDFLARE_SITE_KEY && (
                          <div className="flex justify-center py-2 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 mb-6 min-h-[65px] items-center">
                              <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="light" />
                          </div>
                      )}
                      <ActionButton loading={state.loading} className="bg-slate-900 text-white hover:bg-slate-800">
                          Send Code
                      </ActionButton>
                  </motion.div>
                </form>
            </motion.div>
        ) : (
            <motion.div key="otp-step" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
                <FloatingSVGIcon Icon={Shield} className="-top-8 -right-4" delay={0} />
                <motion.div variants={itemVariants} className="relative z-10">
                  <h2 className="text-3xl font-black mb-2 text-slate-900">Verify Identity</h2>
                  <p className="text-slate-500 font-medium mb-8">Enter the 6-digit secure code sent to your inbox.</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative mb-6 group z-10">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Key size={24}/></div>
                    <input className="w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl py-5 pl-14 pr-4 text-center text-3xl tracking-[0.5em] font-mono text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm hover:bg-white" placeholder="000000" maxLength={6} value={state.resetOtp} onChange={(e) => actions.setResetOtp(e.target.value)} />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                    <ActionButton onClick={actions.handleVerifyResetOTP} loading={state.loading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                        Authenticate
                    </ActionButton>
                </motion.div>
                
                <motion.button variants={itemVariants} onClick={() => actions.setShowResetVerify(false)} className="mt-6 w-full text-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors relative z-10">
                    Wrong email? Change it
                </motion.button>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// --- UPDATE PASSWORD VIEW ---
export const UpdatePasswordView = memo(({ state, actions }) => {
  return (
    <motion.div key="update-pw" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="relative">
       <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 text-sm font-bold transition-colors group relative z-10">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Cancel
       </button>
       
       <FloatingSVGIcon Icon={Lock} className="-top-4 -right-4" delay={0.4} />
       
       <motion.div variants={itemVariants} className="relative z-10">
         <h2 className="text-3xl font-black mb-2 text-slate-900">Override Password</h2>
         <p className="text-slate-500 font-medium mb-8">Establish a new secure access key.</p>
       </motion.div>
       
       <form onSubmit={actions.handleUpdatePassword} className="space-y-6 relative z-10">
         <motion.div variants={itemVariants} className="space-y-2">
           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all shadow-sm hover:bg-white">
             <Lock size={18} className="text-slate-400 mr-3"/>
             <input type="password" placeholder="Min. 6 characters" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 placeholder-slate-400 font-mono" value={state.newPassword} onChange={(e) => actions.setNewPassword(e.target.value)} required minLength={6}/>
           </div>
         </motion.div>
         
         <motion.div variants={itemVariants}>
             <ActionButton loading={state.loading} className="bg-indigo-600 hover:bg-indigo-700 text-white mt-4 shadow-md">
                Update Credentials
             </ActionButton>
         </motion.div>
       </form>
    </motion.div>
  );
});