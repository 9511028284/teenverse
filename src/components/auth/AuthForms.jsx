import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Briefcase, Check, Key, Globe, Gift, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { StepIndicator, SocialButton, BackButton } from './AuthUI';

// --- ICONS ---
const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);
const GithubIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);

// --- LOGIN VIEW ---
export const LoginView = ({ state, actions }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <div className="mb-8">
         <h2 className="text-4xl font-black mb-2 text-white">WELCOME BACK</h2>
         <p className="text-gray-400">Initialize your dashboard session.</p>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
           <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all group focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Mail size={18} className="text-gray-500 mr-3 group-focus-within:text-indigo-400 transition-colors"/>
              <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600 font-mono" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} />
           </div>
        </div>
        <div className="space-y-2">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <button onClick={() => actions.setViewMode('forgot')} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">Forgot?</button>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all group focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Lock size={18} className="text-gray-500 mr-3 group-focus-within:text-indigo-400 transition-colors"/>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600 font-mono" value={state.formData.password} onChange={(e) => actions.updateField('password', e.target.value)} />
              <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
           </div>
        </div>
      </div>
       
      <button onClick={actions.handleFinalSubmit} disabled={state.loading} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2 transform active:scale-[0.98] uppercase tracking-widest text-sm">
         {state.loading ? <Loader2 className="animate-spin"/> : <>Login <ArrowRight size={18}/></>}
      </button>
      
      <div className="flex items-center gap-4 my-8 opacity-60">
         <div className="h-px bg-white/20 flex-1"></div>
         <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Or access via</span>
         <div className="h-px bg-white/20 flex-1"></div>
      </div>
      
      <div className="flex gap-4">
         <SocialButton icon={<GoogleIcon />} onClick={() => actions.handleSocialLogin('google')} label="Google" />
         <SocialButton icon={<GithubIcon />} onClick={() => actions.handleSocialLogin('github')} label="GitHub" />
      </div>
      
      <p className="mt-8 text-center text-gray-400 text-sm">
         No access key? <button onClick={() => actions.setViewMode('signup')} className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition-colors ml-1 uppercase tracking-wide text-xs">Initialize Signup</button>
      </p>
    </motion.div>
  );
};

// --- SIGNUP VIEW ---
export const SignupView = ({ state, actions, refs }) => {
  const { step, formData, isPhoneVerified, phoneVerificationId, otpLoading, phoneOtp, socialUser, agreedToTerms } = state;

  return (
    <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
            {step > 1 ? <BackButton onClick={actions.handleBack} label=""/> : <div></div>}
            <StepIndicator step={step} />
            <div className="w-8"></div> 
        </div>

        {/* STEP 1: ROLE */}
        {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div><h2 className="text-3xl font-black mb-2 text-white">IDENTIFY</h2><p className="text-gray-400">Select your operating mode.</p></div>
                <div className="grid gap-4">
                    {['freelancer', 'client'].map((r) => (
                        <button key={r} onClick={() => actions.updateField('role', r)} className={`p-6 rounded-2xl border transition-all text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] duration-300 ${formData.role === r ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"/>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-3 rounded-xl ${formData.role === r ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{r === 'freelancer' ? <User size={24}/> : <Briefcase size={24}/>}</div>
                                {formData.role === r && <div className="bg-indigo-500 text-white p-1 rounded-full shadow-lg"><Check size={14}/></div>}
                            </div>
                            <h3 className="text-xl font-bold capitalize relative z-10 text-white">{r}</h3>
                            <p className="text-xs text-gray-500 mt-1 relative z-10 font-medium uppercase tracking-wide">{r === 'freelancer' ? 'Access Jobs & Earn' : 'Hire Talent & Manage'}</p>
                        </button>
                    ))}
                </div>
            </motion.div>
        )}

        {/* STEP 2: CREDENTIALS (Skipped if Social) */}
        {step === 2 && !socialUser && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div><h2 className="text-3xl font-black mb-2 text-white">SECURE ACCESS</h2><p className="text-gray-400">Define your login parameters.</p></div>
                <div className="space-y-4">
                    <input type="email" value={formData.email} onChange={(e) => actions.updateField('email', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 font-mono focus:border-indigo-500 focus:bg-white/10 outline-none transition-all" placeholder="Email Address"/>
                    <input type="password" value={formData.password} onChange={(e) => actions.updateField('password', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 font-mono focus:border-indigo-500 focus:bg-white/10 outline-none transition-all" placeholder="Password"/>
                </div>
            </motion.div>
        )}

        {/* STEP 3: PERSONAL & PHONE */}
        {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div><h2 className="text-3xl font-black mb-2 text-white">PROFILE DATA</h2><p className="text-gray-400">Initialize your public persona.</p></div>
                <div className="grid md:grid-cols-2 gap-4">
                    <input value={formData.name} onChange={(e) => actions.updateField('name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all placeholder-gray-600" placeholder="Full Name"/>
                    
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
                                className={`flex-1 bg-white/5 border ${isPhoneVerified ? 'border-green-500 text-green-400' : 'border-white/10 text-white'} rounded-xl p-4 focus:border-indigo-500 outline-none transition-all placeholder-gray-600 font-mono`} 
                                placeholder="9876543210"
                            />
                            {!isPhoneVerified && !phoneVerificationId && (
                                <button type="button" onClick={actions.handleSendPhoneOtp} disabled={otpLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50">
                                    {otpLoading ? <Loader2 className="animate-spin" size={16}/> : 'Verify'}
                                </button>
                            )}
                            {isPhoneVerified && <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 rounded-xl flex items-center justify-center"><Check size={20} /></div>}
                        </div>
                        {phoneVerificationId && !isPhoneVerified && (
                            <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-2">
                                    <input value={phoneOtp} onChange={(e) => actions.setPhoneOtp(e.target.value)} className="flex-1 bg-black/40 border border-indigo-500/50 rounded-lg p-2 text-white font-mono text-center tracking-widest text-lg focus:border-indigo-400 outline-none" placeholder="123456" maxLength={6}/>
                                    <button type="button" onClick={actions.handlePhoneVerify} disabled={otpLoading} className="bg-green-600 hover:bg-green-500 text-white px-4 rounded-lg font-bold">{otpLoading ? <Loader2 className="animate-spin" size={16}/> : <Check size={18}/>}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input value={formData.nationality} onChange={(e) => actions.updateField('nationality', e.target.value)} className="w-full pl-12 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all placeholder-gray-600" placeholder="e.g. India"/>
                </div>
                <div className="relative">
                    <Gift size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input value={formData.referralCode} onChange={(e) => actions.updateField('referralCode', e.target.value.toUpperCase())} className="w-full pl-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-white placeholder-indigo-300/30 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest font-mono" placeholder="Invite Code"/>
                </div>
            </motion.div>
        )}

        {/* STEP 4: FINAL */}
        {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div><h2 className="text-3xl font-black mb-2 text-white">FINAL PROTOCOL</h2><p className="text-gray-400">Complete registration.</p></div>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.role === 'freelancer' ? (
                        <>
                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={(e) => actions.updateField('dob', e.target.value)} className="w-full bg-black/40 border border-gray-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono"/>
                                {state.isMinor && (
                                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl animate-in slide-in-from-top-2">
                                        <div className="flex gap-2 items-center mb-2 text-orange-400"><ShieldAlert size={16}/><span className="text-xs font-bold uppercase">Guardian Email Required</span></div>
                                        <input type="email" placeholder="Parent's Email" value={formData.parentEmail} onChange={(e) => actions.updateField('parentEmail', e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"/>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <input placeholder="Organization (Optional)" onChange={(e) => actions.updateField('org', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 outline-none"/>
                    )}
                    
                    <div className="pt-4">
                        <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-colors">
                            <input type="checkbox" className="w-5 h-5 accent-indigo-500" checked={agreedToTerms} onChange={(e) => actions.setAgreedToTerms(e.target.checked)}/>
                            <span className="text-xs text-gray-400 group-hover:text-gray-300">I agree to the <span className="text-indigo-400 underline">Terms</span> and <span className="text-indigo-400 underline">Privacy</span>.</span>
                        </label>
                        {state.CLOUDFLARE_SITE_KEY && (
                            <div className="mt-4 flex justify-center bg-black/20 p-2 rounded-xl">
                                <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="dark" />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}

        <div className="mt-auto pt-8 border-t border-white/10 flex justify-end">
            {step < 4 ? <button onClick={actions.handleNext} disabled={state.loading} className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-wider text-sm">Next <ArrowRight size={16}/></button> : <button onClick={actions.handleFinalSubmit} disabled={state.loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110 px-8 py-3 rounded-xl font-bold shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all transform active:scale-95 flex items-center gap-2 uppercase tracking-wider text-sm">{state.loading ? <Loader2 className="animate-spin"/> : 'Initialize'}</button>}
        </div>
        
        {/* RECAPTCHA CONTAINER */}
        <div id="recaptcha-container"></div>
    </motion.div>
  );
};

// --- FORGOT PASSWORD VIEW ---
export const ForgotPasswordView = ({ state, actions, refs }) => {
  return (
    <motion.div key="forgot-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-sm font-bold transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Login
      </button>
      
      {!state.showResetVerify ? (
          <>
              <h2 className="text-3xl font-black mb-2 text-white">Reset Access</h2>
              <p className="text-gray-400 mb-8">Enter your registered email to receive a One-Time Protocol (OTP).</p>
              <form onSubmit={actions.handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Mail size={18} className="text-gray-500 mr-3"/>
                        <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600 font-mono" value={state.formData.email} onChange={(e) => actions.updateField('email', e.target.value)} required />
                    </div>
                </div>
                
                {state.CLOUDFLARE_SITE_KEY && (
                    <div className="flex justify-center py-2 bg-black/20 rounded-xl">
                        <Turnstile ref={refs.turnstileRef} siteKey={state.CLOUDFLARE_SITE_KEY} onSuccess={actions.setCaptchaToken} onExpire={() => actions.setCaptchaToken(null)} theme="dark" />
                    </div>
                )}

                <button type="submit" disabled={state.loading} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] transform active:scale-95 flex justify-center items-center uppercase tracking-widest text-sm">
                    {state.loading ? <Loader2 className="animate-spin"/> : 'Send Code'}
                </button>
              </form>
          </>
      ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <h2 className="text-3xl font-black mb-2 text-white">Verify Identity</h2>
              <p className="text-gray-400 mb-8">Enter the 6-digit secure code sent to your inbox.</p>
              <div className="relative mb-6 group">
                  <div className="absolute left-4 top-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors"><Key size={24}/></div>
                  <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 pl-12 pr-4 text-center text-3xl tracking-[0.5em] font-mono text-white focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] outline-none transition-all" placeholder="000000" maxLength={6} value={state.resetOtp} onChange={(e) => actions.setResetOtp(e.target.value)} />
              </div>
              <button onClick={actions.handleVerifyResetOTP} disabled={state.loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center transform active:scale-95 transition-all uppercase tracking-widest text-sm">
                  {state.loading ? <Loader2 className="animate-spin"/> : 'Authenticate'}
              </button>
              <button onClick={() => actions.setShowResetVerify(false)} className="mt-6 w-full text-center text-sm text-gray-500 hover:text-white transition-colors">Wrong email? Change it</button>
          </motion.div>
      )}
    </motion.div>
  );
};

// --- UPDATE PASSWORD VIEW ---
export const UpdatePasswordView = ({ state, actions }) => {
  return (
    <motion.div key="update-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
       <button onClick={() => actions.setViewMode('login')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-sm font-bold transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Cancel
       </button>
       <h2 className="text-3xl font-black mb-2 text-white">Override Password</h2>
       <p className="text-gray-400 mb-8">Establish a new secure access key.</p>
       <form onSubmit={actions.handleUpdatePassword} className="space-y-6">
         <div className="space-y-2">
           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
           <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
             <Lock size={18} className="text-gray-500 mr-3"/>
             <input type="password" placeholder="Min. 6 characters" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600 font-mono" value={state.newPassword} onChange={(e) => actions.setNewPassword(e.target.value)} required minLength={6}/>
           </div>
         </div>
         <button type="submit" disabled={state.loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all transform active:scale-95 uppercase tracking-widest text-sm">
            {state.loading ? <Loader2 className="animate-spin"/> : 'Update Credentials'}
         </button>
       </form>
    </motion.div>
  );
};