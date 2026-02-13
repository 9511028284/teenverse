import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Briefcase, Check, Key, Globe, Gift, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
// Assuming these exist in your project structure
import { StepIndicator, SocialButton, BackButton } from './AuthUI'; 

// --- ICONS ---
const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);
const GithubIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);

// --- UTILITY: Floating 3D Image Component ---
const Floating3DIcon = ({ src, className, delay = 0 }) => (
  <motion.img 
    src={src} 
    alt="3D Decorative Element"
    animate={{ y: [0, -12, 0], rotate: [-2, 4, -2] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    className={`absolute pointer-events-none drop-shadow-2xl z-20 ${className}`}
  />
);

// --- LOGIN VIEW ---
export const LoginView = ({ state, actions }) => {
  const [showPassword, setShowPassword] = useState(false);
   
  return (
    <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="relative">
      
      {/* GenZ Designer Touch: Floating 3D Elements */}
      <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/rocket.png" className="-top-12 -right-8 w-24 h-24 opacity-80" delay={0.2} />
      
      <div className="mb-8 relative z-10">
         <h2 className="text-4xl font-black mb-2 text-slate-900 dark:text-white tracking-tight">WELCOME <br/><span className="text-indigo-600 dark:text-indigo-400">BACK.</span></h2>
         <p className="text-slate-500 dark:text-gray-400 font-medium">Initialize your dashboard session.</p>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="space-y-2 relative">
           <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/mail.png" className="-left-10 top-6 w-14 h-14 opacity-50 blur-[1px]" delay={0.5} />
           <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest ml-1">Email</label>
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 dark:focus-within:bg-white/10 transition-all group shadow-sm dark:shadow-none">
              <Mail size={18} className="text-slate-400 dark:text-gray-500 mr-3 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors"/>
              <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 font-mono" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} />
           </div>
        </div>

        <div className="space-y-2 relative">
           <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/lock.png" className="-right-8 top-6 w-16 h-16 opacity-70" delay={1} />
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <button onClick={() => actions.setViewMode('forgot')} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors uppercase tracking-wider">Forgot?</button>
           </div>
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 dark:focus-within:bg-white/10 transition-all group shadow-sm dark:shadow-none">
              <Lock size={18} className="text-slate-400 dark:text-gray-500 mr-3 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors"/>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 font-mono" value={state.formData.password} onChange={(e) => actions.updateField('password', e.target.value)} />
              <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-white transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
           </div>
        </div>
      </div>
        
      <button onClick={actions.handleFinalSubmit} disabled={state.loading} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2 transform active:scale-[0.98] uppercase tracking-widest text-sm relative overflow-hidden group">
         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl"></div>
         {state.loading ? <Loader2 className="animate-spin relative z-10"/> : <span className="relative z-10 flex items-center gap-2">Login <ArrowRight size={18}/></span>}
      </button>
       
      <div className="flex items-center gap-4 my-8 opacity-60">
         <div className="h-px bg-slate-300 dark:bg-white/20 flex-1"></div>
         <span className="text-slate-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">Or access via</span>
         <div className="h-px bg-slate-300 dark:bg-white/20 flex-1"></div>
      </div>
       
      <div className="flex gap-4">
         <SocialButton icon={<GoogleIcon />} onClick={() => actions.handleSocialLogin('google')} label="Google" />
         <SocialButton icon={<GithubIcon />} onClick={() => actions.handleSocialLogin('github')} label="GitHub" />
      </div>
       
      <p className="mt-8 text-center text-slate-600 dark:text-gray-400 text-sm font-medium">
         No access key? <button onClick={() => actions.setViewMode('signup')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors ml-1 uppercase tracking-wide text-xs">Initialize Signup</button>
      </p>
    </motion.div>
  );
};

// --- SIGNUP VIEW ---
export const SignupView = ({ state, actions, refs }) => {
  const { step, formData, isPhoneVerified, phoneVerificationId, otpLoading, phoneOtp, socialUser, agreedToTerms } = state;

  return (
    <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col relative">
        <div className="flex justify-between items-center mb-8">
            {step > 1 ? <BackButton onClick={actions.handleBack} label=""/> : <div></div>}
            <StepIndicator step={step} />
            <div className="w-8"></div> 
        </div>

        {/* STEP 1: ROLE */}
        {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 relative">
                <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/star.png" className="-top-10 -right-4 w-20 h-20 opacity-80" delay={0.1} />
                <div><h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">IDENTIFY</h2><p className="text-slate-500 dark:text-gray-400 font-medium">Select your operating mode.</p></div>
                
                <div className="grid gap-4">
                    {['freelancer', 'client'].map((r) => (
                        <button key={r} onClick={() => actions.updateField('role', r)} className={`p-6 rounded-3xl border transition-all text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] duration-300 ${formData.role === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.4)] dark:shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-indigo-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"/>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-4 rounded-2xl ${formData.role === r ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'}`}>{r === 'freelancer' ? <User size={28}/> : <Briefcase size={28}/>}</div>
                                {formData.role === r && <div className="bg-indigo-600 text-white p-1.5 rounded-full shadow-lg"><Check size={16}/></div>}
                            </div>
                            <h3 className="text-2xl font-black capitalize relative z-10 text-slate-900 dark:text-white">{r}</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 relative z-10 font-bold uppercase tracking-wide">{r === 'freelancer' ? 'Access Jobs & Earn' : 'Hire Talent & Manage'}</p>
                        </button>
                    ))}
                </div>
            </motion.div>
        )}

        {/* STEP 2: CREDENTIALS */}
        {step === 2 && !socialUser && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 relative">
                <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/key.png" className="-top-8 -right-4 w-20 h-20 opacity-70" delay={0.3} />
                <div><h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">SECURE ACCESS</h2><p className="text-slate-500 dark:text-gray-400 font-medium">Define your login parameters.</p></div>
                <div className="space-y-4">
                    <input type="email" value={formData.email} onChange={(e) => actions.updateField('email', e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:focus:bg-white/10 outline-none transition-all shadow-sm dark:shadow-none" placeholder="Email Address"/>
                    <input type="password" value={formData.password} onChange={(e) => actions.updateField('password', e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:focus:bg-white/10 outline-none transition-all shadow-sm dark:shadow-none" placeholder="Password"/>
                </div>
            </motion.div>
        )}

        {/* STEP 3: PERSONAL & PHONE */}
        {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 relative">
                <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/paint-palette.png" className="-top-12 -right-6 w-24 h-24 opacity-60" delay={0.5} />
                <div><h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">PROFILE DATA</h2><p className="text-slate-500 dark:text-gray-400 font-medium">Initialize your public persona.</p></div>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <input value={formData.name} onChange={(e) => actions.updateField('name', e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 dark:placeholder-gray-600 shadow-sm dark:shadow-none" placeholder="Full Name"/>
                     
                    {/* Phone Verification Block */}
                    <div className="relative">
                        <div className="flex gap-2">
                            <input 
                                type="tel" 
                                value={formData.phone} 
                                onChange={(e) => { 
                                    if(isPhoneVerified) actions.setIsPhoneVerified(false); 
                                    actions.updateField('phone', e.target.value); 
                                }} 
                                disabled={isPhoneVerified || phoneVerificationId}
                                className={`flex-1 bg-white dark:bg-white/5 border ${isPhoneVerified ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} rounded-2xl p-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 dark:placeholder-gray-600 font-mono shadow-sm dark:shadow-none`} 
                                placeholder="9876543210"
                            />
                            {!isPhoneVerified && !phoneVerificationId && (
                                <button type="button" onClick={actions.handleSendPhoneOtp} disabled={otpLoading} className="bg-slate-900 dark:bg-indigo-600 text-white px-5 rounded-2xl font-bold text-xs uppercase tracking-wider disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-md">
                                    {otpLoading ? <Loader2 className="animate-spin" size={16}/> : 'Verify'}
                                </button>
                            )}
                            {isPhoneVerified && <div className="bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/50 text-green-600 dark:text-green-400 px-5 rounded-2xl flex items-center justify-center"><Check size={20} /></div>}
                        </div>
                        {phoneVerificationId && !isPhoneVerified && (
                            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2">
                                    <input value={phoneOtp} onChange={(e) => actions.setPhoneOtp(e.target.value)} className="flex-1 bg-white dark:bg-black/40 border border-indigo-300 dark:border-indigo-500/50 rounded-xl p-3 text-slate-900 dark:text-white font-mono text-center tracking-widest text-lg focus:border-indigo-500 outline-none" placeholder="123456" maxLength={6}/>
                                    <button type="button" onClick={actions.handlePhoneVerify} disabled={otpLoading} className="bg-green-500 hover:bg-green-600 text-white px-5 rounded-xl font-bold shadow-md">{otpLoading ? <Loader2 className="animate-spin" size={16}/> : <Check size={18}/>}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="relative">
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500"/>
                    <input value={formData.nationality} onChange={(e) => actions.updateField('nationality', e.target.value)} className="w-full pl-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 dark:placeholder-gray-600 shadow-sm dark:shadow-none" placeholder="e.g. India"/>
                </div>
                
                <div className="relative group">
                    <Gift size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors"/>
                    <input value={formData.referralCode} onChange={(e) => actions.updateField('referralCode', e.target.value.toUpperCase())} className="w-full pl-12 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 text-indigo-900 dark:text-white placeholder-indigo-300 dark:placeholder-indigo-300/30 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all uppercase tracking-widest font-mono shadow-sm dark:shadow-none" placeholder="Invite Code"/>
                </div>
            </motion.div>
        )}

        {/* STEP 4: FINAL */}
        {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 relative">
                <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/folder-invoices.png" className="-top-12 -right-4 w-24 h-24 opacity-70" delay={0.2} />
                <div><h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">FINAL PROTOCOL</h2><p className="text-slate-500 dark:text-gray-400 font-medium">Complete registration.</p></div>
                
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.role === 'freelancer' ? (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-white/5 p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest">Date of Birth</label>
                                    {state.age && (
                                        <span className="text-[10px] font-black px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                                            AGE: {state.age}
                                        </span>
                                    )}
                                </div>
                                <input 
                                    type="date" 
                                    value={formData.dob} 
                                    onChange={(e) => actions.updateField('dob', e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-gray-600 rounded-xl p-4 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono transition-colors"
                                />

                                {/* INSTANT GUARDIAN FIELD */}
                                {state.isMinor && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                        <div className="mt-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 p-5 rounded-2xl">
                                            <div className="flex gap-2 items-center mb-3 text-orange-600 dark:text-orange-400">
                                                <ShieldAlert size={18}/>
                                                <span className="text-xs font-black uppercase tracking-widest">Guardian Authorization Required</span>
                                            </div>
                                            <input 
                                                type="email" 
                                                placeholder="Guardian's Email Address" 
                                                value={formData.parentEmail} 
                                                onChange={(e) => actions.updateField('parentEmail', e.target.value)} 
                                                className="w-full bg-white dark:bg-black/50 border border-orange-200 dark:border-gray-700 rounded-xl p-4 text-slate-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none placeholder-slate-400 dark:placeholder-gray-600 transition-all font-mono shadow-sm dark:shadow-none"
                                            />
                                            <p className="text-[10px] text-orange-600/70 dark:text-orange-500/70 mt-3 leading-tight uppercase font-bold tracking-wide">
                                                As you are under 18, a secure verification link will be dispatched to your guardian.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {['Male', 'Female', 'Other'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => actions.updateField('gender', g)}
                                        className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all shadow-sm dark:shadow-none ${formData.gender === g ? 'bg-indigo-600 border-indigo-600 text-white scale-[1.02]' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest ml-1">Company Details</label>
                            <input 
                                placeholder="Organization Name (Optional)" 
                                value={formData.org}
                                onChange={(e) => actions.updateField('org', e.target.value)} 
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder-slate-400 dark:placeholder-gray-600 shadow-sm dark:shadow-none"
                            />
                        </div>
                    )}
                     
                    <div className="pt-4">
                        <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                            <input type="checkbox" className="w-5 h-5 accent-indigo-600 mt-0.5 rounded-md" checked={agreedToTerms} onChange={(e) => actions.setAgreedToTerms(e.target.checked)}/>
                            <span className="text-sm font-medium text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-gray-300">I agree to the <span className="text-indigo-600 dark:text-indigo-400 underline font-bold decoration-2 underline-offset-2">Terms</span> and <span className="text-indigo-600 dark:text-indigo-400 underline font-bold decoration-2 underline-offset-2">Privacy</span>.</span>
                        </label>
                        
                        {state.CLOUDFLARE_SITE_KEY && (
                            <div className="mt-4 flex justify-center bg-slate-100 dark:bg-black/20 p-2 rounded-2xl border border-slate-200 dark:border-white/5">
                                <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="auto" />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}

        <div className="mt-auto pt-8 border-t border-slate-200 dark:border-white/10 flex justify-end">
            {step < 4 ? 
              <button onClick={actions.handleNext} disabled={state.loading} className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-200 px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-slate-900/20 dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-widest text-sm">
                Next <ArrowRight size={18}/>
              </button> 
              : 
              <button onClick={actions.handleFinalSubmit} disabled={state.loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110 px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/30 transition-all transform active:scale-95 flex items-center gap-3 uppercase tracking-widest text-sm">
                {state.loading ? <Loader2 className="animate-spin"/> : 'Initialize'}
              </button>
            }
        </div>
        
        {/* RECAPTCHA CONTAINER */}
        <div id="recaptcha-container"></div>
    </motion.div>
  );
};

// --- FORGOT PASSWORD VIEW ---
export const ForgotPasswordView = ({ state, actions, refs }) => {
  return (
    <motion.div key="forgot-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="relative">
      
      <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white mb-8 text-sm font-bold transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Login
      </button>
       
      {!state.showResetVerify ? (
          <>
              <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/magic-wand.png" className="-top-4 -right-4 w-24 h-24 opacity-70" delay={0.2} />
              <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Reset Access</h2>
              <p className="text-slate-500 dark:text-gray-400 font-medium mb-8">Enter your registered email to receive a One-Time Protocol (OTP).</p>
              
              <form onSubmit={actions.handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 dark:focus-within:bg-white/10 transition-all shadow-sm dark:shadow-none">
                        <Mail size={18} className="text-slate-400 dark:text-gray-500 mr-3"/>
                        <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 font-mono" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} required />
                    </div>
                </div>
                 
                {state.CLOUDFLARE_SITE_KEY && (
                    <div className="flex justify-center py-2 bg-slate-100 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                        <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="auto" />
                    </div>
                )}

                <button type="submit" disabled={state.loading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-gray-200 transition-all shadow-xl shadow-slate-900/20 dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] transform active:scale-95 flex justify-center items-center uppercase tracking-widest text-sm mt-8">
                    {state.loading ? <Loader2 className="animate-spin"/> : 'Send Code'}
                </button>
              </form>
          </>
      ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/shield.png" className="-top-8 -right-4 w-20 h-20 opacity-80" delay={0} />
              <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Verify Identity</h2>
              <p className="text-slate-500 dark:text-gray-400 font-medium mb-8">Enter the 6-digit secure code sent to your inbox.</p>
              
              <div className="relative mb-6 group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors"><Key size={24}/></div>
                  <input className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-gray-700 rounded-2xl py-5 pl-14 pr-4 text-center text-3xl tracking-[0.5em] font-mono text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.2)]" placeholder="000000" maxLength={6} value={state.resetOtp} onChange={(e) => actions.setResetOtp(e.target.value)} />
              </div>
              
              <button onClick={actions.handleVerifyResetOTP} disabled={state.loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/30 flex justify-center items-center transform active:scale-95 transition-all uppercase tracking-widest text-sm">
                  {state.loading ? <Loader2 className="animate-spin"/> : 'Authenticate'}
              </button>
              
              <button onClick={() => actions.setShowResetVerify(false)} className="mt-6 w-full text-center text-sm font-bold text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors">Wrong email? Change it</button>
          </motion.div>
      )}
    </motion.div>
  );
};

// --- UPDATE PASSWORD VIEW ---
export const UpdatePasswordView = ({ state, actions }) => {
  return (
    <motion.div key="update-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="relative">
       <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white mb-8 text-sm font-bold transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Cancel
       </button>
       
       <Floating3DIcon src="https://img.icons8.com/3d-fluency/250/lock.png" className="-top-4 -right-4 w-20 h-20 opacity-80" delay={0.4} />
       <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Override Password</h2>
       <p className="text-slate-500 dark:text-gray-400 font-medium mb-8">Establish a new secure access key.</p>
       
       <form onSubmit={actions.handleUpdatePassword} className="space-y-6">
         <div className="space-y-2">
           <label className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest ml-1">New Password</label>
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 dark:focus-within:bg-white/10 transition-all shadow-sm dark:shadow-none">
             <Lock size={18} className="text-slate-400 dark:text-gray-500 mr-3"/>
             <input type="password" placeholder="Min. 6 characters" className="bg-transparent border-none outline-none w-full py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 font-mono" value={state.newPassword} onChange={(e) => actions.setNewPassword(e.target.value)} required minLength={6}/>
           </div>
         </div>
         
         <button type="submit" disabled={state.loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all transform active:scale-95 uppercase tracking-widest text-sm mt-4">
            {state.loading ? <Loader2 className="animate-spin mx-auto"/> : 'Update Credentials'}
         </button>
       </form>
    </motion.div>
  );
};