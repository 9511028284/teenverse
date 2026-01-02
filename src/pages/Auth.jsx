import React, { useState, useEffect, useRef } from 'react';
import { 
  X, UploadCloud, ShieldAlert, Mail, ArrowRight, ArrowLeft, 
  User, Briefcase, Check, ChevronRight, Loader2, Lock, 
  Eye, EyeOff, Sparkles, Scale, Gift, MailCheck, RefreshCw
} from 'lucide-react';
import { supabase } from '../supabase'; 
import { Turnstile } from '@marsidev/react-turnstile'; 

// LEGAL: Version control for the consent text.
const CONSENT_VERSION = "v1.0_TEENVERSE_PARENT_AGREEMENT_2025";
const CLOUDFLARE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_SITE_KEY; 

// --- STYLES ---
const styles = `
  @keyframes gradient-xy {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-xy 15s ease infinite;
  }
  .glass-panel {
    background: rgba(22, 27, 44, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.5); border-radius: 10px; }
`;

// --- ICONS ---
const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);
const GithubIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('login'); 
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
   
  // Verification States
  const [showVerify, setShowVerify] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); 
   
  const [otp, setOtp] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [parentAgreed, setParentAgreed] = useState(false);
   
  // 🛡️ SECURITY STATES
  const [captchaToken, setCaptchaToken] = useState(null); 
  const turnstileRef = useRef(); // 🆕 REF TO RESET CAPTCHA

  // Social & Password Update
  const [socialUser, setSocialUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    role: 'freelancer', 
    email: '',
    password: '',
    name: '',
    phone: '',
    nationality: '',
    dob: '',
    gender: 'Male',
    upi: '',
    org: 'No',
    parentEmail: '',
    referralCode: ''
  });

  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  // --- 🔒 DEVICE FINGERPRINTING ---
  const getDeviceFingerprint = () => {
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform
    };
  };

  // --- 1. SUPABASE SESSION & URL HASH CHECK ---
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setViewMode('update_password');
    }

    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          if (hash && hash.includes('type=recovery')) return;

          const user = session.user;
          const { data: freelancerData } = await supabase.from('freelancers').select('id').eq('id', user.id).maybeSingle();
          const { data: clientData } = await supabase.from('clients').select('id').eq('id', user.id).maybeSingle();

          if (freelancerData || clientData) {
             onLogin(`Welcome back!`);
          } else {
             setSocialUser(user);
             setFormData(prev => ({
               ...prev,
               email: user.email,
               name: user.user_metadata?.full_name || user.email.split('@')[0],
               role: 'freelancer'
             }));
             setViewMode('signup');
             setStep(1);
          }
        }
      } catch (err) {
        console.error("Session Check Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [onLogin]);

  // --- AGE CALCULATION ---
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      setIsMinor(calculatedAge < 18);
    }
  }, [formData.dob]);
  
  const checkOtpRateLimit = () => {
    const lastSent = localStorage.getItem('last_otp_sent');
    if (lastSent) {
      const diff = Date.now() - parseInt(lastSent);
      if (diff < 60000) { 
        const wait = Math.ceil((60000 - diff) / 1000);
        alert(`Please wait ${wait} seconds before sending another OTP.`);
        return false;
      }
    }
    return true;
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === 1) {
        if (socialUser) setStep(3);
        else setStep(2);
        return;
    }
    
    if (step === 2) {
        if (!formData.email || !formData.password) return alert("Please fill in credentials");
        setStep(prev => prev + 1);
        return;
    }

    if (step === 3) {
        if (!formData.name || !formData.phone) return alert("Please fill in personal details");
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            return alert("Invalid Phone Number. Please enter a valid 10-digit mobile number starting with 6-9.");
        }

        setLoading(true);
        try {
            const { data: fData } = await supabase.from('freelancers').select('phone').eq('phone', formData.phone).maybeSingle();
            const { data: cData } = await supabase.from('clients').select('phone').eq('phone', formData.phone).maybeSingle();

            if (fData || cData) {
                setLoading(false);
                return alert("This phone number is already registered.");
            }
            
            setLoading(false);
            setStep(prev => prev + 1);
        } catch (error) {
            setLoading(false);
            console.error(error);
            return alert("Unable to verify details. Please check connection.");
        }
    }
  };

  const handleBack = () => {
    if (step === 3 && socialUser) setStep(1);
    else setStep(prev => prev - 1);
  };

  const handleLegalClick = (e, page) => {
    e.preventDefault(); 
    e.stopPropagation();
    setView(page);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if(!formData.email) return alert("Please enter your email address first.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: window.location.origin + '#type=recovery',
        options: { captchaToken } 
      });
      if (error) throw error;
      alert("Password reset link sent to your email!");
      setViewMode('login');
    } catch (err) {
      alert(err.message);
      turnstileRef.current?.reset(); // Reset on error
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!parentAgreed) return alert("Parent/Guardian must explicitly consent to the terms.");
    
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-parent-otp', {
        body: { 
            parentEmail: formData.parentEmail, 
            otp: otp 
        }
    });
    if (error || !data || !data.success) {
        setLoading(false);
        return alert("Invalid or Expired Code. Please check and try again.");
    }

    try {
        await completeSignup();
    } catch (err) {
        alert(err.message);
        setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
       alert("Error updating password: " + error.message);
    } else {
       alert("Password updated successfully! Please log in.");
       setViewMode('login');
       window.history.replaceState(null, '', window.location.pathname);
    }
    setLoading(false);
  };

  const handleSocialLogin = async (providerName) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert("Social Login Failed: " + err.message);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
    });
    setLoading(false);
    if (error) alert(error.message);
    else alert("Verification email resent! Check your spam folder.");
  };

  const handleFinalSubmit = async () => {
    // 🛡️ CAPTCHA CHECK
    if (CLOUDFLARE_SITE_KEY && !captchaToken && viewMode === 'login') {
        return alert("Please complete the security check.");
    }
    if (CLOUDFLARE_SITE_KEY && !captchaToken && viewMode === 'signup' && step === 4) {
        return alert("Please complete the security check.");
    }

    if (viewMode !== 'login' && !agreedToTerms) {
        return alert("You must agree to the Terms & Privacy Policy to continue.");
    }

    setLoading(true);
    try {
      if (viewMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
            options: { captchaToken } 
        });
        if (error) throw error;
        
      } else {
        if (formData.role === 'freelancer') {
            if (!formData.dob) { setLoading(false); return alert("Date of Birth is legally required."); }
            if (age < 13) { setLoading(false); throw new Error("You must be at least 13 years old to join TeenVerse."); }
        }

        if (formData.role === 'freelancer' && isMinor) {
           if (!formData.parentEmail) { setLoading(false); throw new Error("Parent email is required for users under 18."); }
           
            if (!checkOtpRateLimit()) {
                setLoading(false);
                return;
            }

           const { error } = await supabase.functions.invoke('send-parent-otp', {
              body: { parentEmail: formData.parentEmail, childName: formData.name }
           });
           if (error) {
                console.error(error); 
                throw new Error("Failed to send verification code. Please try again.");
           }
           
           localStorage.setItem('last_otp_sent', Date.now().toString());
           setShowVerify(true);
           setLoading(false);
           return;
        }

        await completeSignup();
      }
    } catch (err) {
      alert(err.message);
      // 🆕 AUTO-RESET CAPTCHA ON ERROR
      if (turnstileRef.current) {
          turnstileRef.current.reset();
      }
      setCaptchaToken(null); 
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    let uid = "";
    let email = formData.email;
    const deviceMeta = getDeviceFingerprint(); 

    // --- SCENARIO A: SOCIAL USER (Manual Insert) ---
    if (socialUser) {
        uid = socialUser.id;
        email = socialUser.email;

        const { error: userError } = await supabase.from('users').upsert({
            id: uid,
            email: email,
            full_name: formData.name,
            avatar_url: socialUser.user_metadata?.avatar_url,
            raw_app_meta_data: { device: deviceMeta } 
        });

        if (userError) console.error("User Creation Failed:", userError);

        const table = formData.role === 'client' ? 'clients' : 'freelancers';
        const myRefCode = `${formData.name.split(' ')[0].toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

        const dbData = formData.role === 'client' 
         ? { 
             id: uid, 
             name: formData.name, 
             email: email, 
             phone: formData.phone, 
             nationality: formData.nationality, 
             is_organisation: formData.org,
             referral_code: myRefCode,
             referred_by: formData.referralCode || null
           }
         : { 
             id: uid, 
             name: formData.name, 
             email: email, 
             phone: formData.phone, 
             nationality: formData.nationality, 
             dob: formData.dob, 
             age: age, 
             gender: formData.gender, 
             upi: formData.upi, 
             is_parent_verified: isMinor, 
             unlocked_skills: [],
             referral_code: myRefCode,
             referred_by: formData.referralCode || null
           };

        const { error } = await supabase.from(table).insert([dbData]);
        if (error) {
            console.error("Social DB Insert Failed:", error);
            throw new Error("Could not save profile: " + error.message);
        }
        
        if (isMinor) {
            await supabase.functions.invoke('log-parent-consent', {
                body: {
                    user_id: uid,
                    parent_email: formData.parentEmail,
                    consent_version: CONSENT_VERSION
                }
            });
        }
        
        onSignUpSuccess(); 
        return; 
    }

    // --- SCENARIO B: EMAIL USER ---
    const metadata = {
        full_name: formData.name,
        role: formData.role,
        phone: formData.phone,
        nationality: formData.nationality,
        dob: formData.dob,
        gender: formData.gender,
        org: formData.org || '',
        is_minor: isMinor,
        device_fingerprint: deviceMeta 
    };

    const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { 
            data: metadata,
            captchaToken: captchaToken 
        } 
    });
    
    if (error) throw error;
    if (!data.user) throw new Error("User creation failed.");
    uid = data.user.id;

    if (isMinor && uid) {
        const { error: logError } = await supabase.functions.invoke('log-parent-consent', {
            body: {
                user_id: uid,
                parent_email: formData.parentEmail,
                consent_version: CONSENT_VERSION
            }
        });
        if (logError) console.error("Consent Log Warning:", logError); 
    }

    setVerificationSent(true); 
    setLoading(false);
  };

  // --- SUB-COMPONENTS ---
  const StepIndicator = () => (
    <div className="flex gap-2 mb-8 justify-center">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-2 bg-gray-700'}`} />
      ))}
    </div>
  );

  const SocialButton = ({ icon, onClick, label }) => (
    <button type="button" onClick={onClick} className="flex-1 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 p-3 rounded-xl flex justify-center items-center transition-all duration-300 group relative overflow-hidden" title={label}>
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative transform group-hover:scale-110 transition-transform">{icon}</div>
    </button>
  );

  const LegalFooter = ({ mobile }) => (
    <div className={`mt-8 pt-6 border-t border-white/10 text-[10px] text-gray-500 leading-tight ${mobile ? 'md:hidden' : 'hidden md:block'}`}>
        <p className="mb-2"><Scale size={10} className="inline mr-1"/> Legal Compliance:</p>
        <p>TeenVerseHub is a technology intermediary and marketplace. We do not directly employ freelancers. All work must be digital and non-hazardous.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans text-gray-100 relative overflow-hidden">
      <style>{styles}</style>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f111a] via-[#1a103c] to-[#0f111a] animate-gradient z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none"></div>

      <div className="w-full max-w-5xl h-[85vh] glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        <button onClick={() => setView('home')} className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-full hover:bg-white/10"><X size={20} /></button>

        <div className="hidden md:flex w-2/5 relative overflow-hidden flex-col justify-between p-12 bg-black/20">
          <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/30"><Sparkles className="text-white" /></div>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2 leading-tight">Join the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Revolution.</span></h1>
            <p className="text-indigo-200/60 mt-4 text-lg">Your skills. Your rules. Your money.</p>
          </div>
          <div className="relative z-10"><LegalFooter mobile={false} /></div>
        </div>

        <div className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col justify-center bg-gradient-to-b from-transparent to-black/40">
          {loading && (<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl"><Loader2 size={40} className="animate-spin text-indigo-500" /></div>)}

          {verificationSent ? (
             <div className="max-w-md mx-auto w-full text-center animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]"><MailCheck size={40} /></div>
               <h2 className="text-3xl font-bold mb-4">Check your Email</h2>
               <p className="text-gray-300 mb-2">We've sent a verification link to:</p>
               <div className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 inline-block mb-6 font-mono text-indigo-300">{formData.email}</div>
               
               <button onClick={async () => { 
                   const { data: { session } } = await supabase.auth.getSession(); 
                   if (session) onSignUpSuccess(); 
                   else alert("Please click the verification link in your email first."); 
                 }} 
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 mb-4"
               >
                 I have Verified
               </button>
               
               <button onClick={handleResendEmail} disabled={loading} className="text-xs text-indigo-400 hover:text-indigo-300 underline mb-6 block mx-auto flex items-center gap-1 justify-center">
                 <RefreshCw size={12}/> Didn't receive it? Resend Email
               </button>

               <button onClick={() => { setVerificationSent(false); setViewMode('login'); }} className="text-gray-400 hover:text-white text-sm">Return to Login</button>
             </div>
          ) : (
            <>
              {viewMode === 'update_password' && (
                <div className="max-w-md mx-auto w-full animate-in fade-in zoom-in duration-500">
                  <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm font-bold transition-colors"><ArrowLeft size={16}/> Cancel</button>
                  <h2 className="text-3xl font-bold mb-2">Set New Password</h2>
                  <p className="text-gray-400 mb-6">Enter your new secure password below.</p>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="group">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">New Password</label>
                      <div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4">
                        <Lock size={18} className="text-gray-500 mr-3"/>
                        <input type="password" placeholder="••••••••" className="bg-transparent border-none outline-none w-full py-4 text-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}/>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg">{loading ? <Loader2 className="animate-spin"/> : 'Update Password'}</button>
                  </form>
                </div>
              )}

              {viewMode === 'forgot' && (
                 <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
                   <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm font-bold transition-colors"><ArrowLeft size={16}/> Back to Login</button>
                   <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
                   <form onSubmit={handleForgotPassword} className="space-y-4">
                     <div className="group"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Email Address</label><div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4"><Mail size={18} className="text-gray-500 mr-3"/><input type="email" placeholder="you@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required /></div></div>
                     {CLOUDFLARE_SITE_KEY && (
                         <div className="my-2 flex justify-center">
                             <Turnstile 
                                ref={turnstileRef} 
                                siteKey={CLOUDFLARE_SITE_KEY} 
                                onSuccess={setCaptchaToken} 
                                onExpire={() => setCaptchaToken(null)}
                                theme="dark" 
                             />
                         </div>
                     )}
                     <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-xl transition-all flex justify-center items-center shadow-lg shadow-white/10">{loading ? <Loader2 className="animate-spin"/> : 'Send Reset Link'}</button>
                   </form>
                 </div>
              )}

              {viewMode === 'login' && (
                <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                   <p className="text-gray-400 mb-8">Enter your credentials.</p>
                   <div className="space-y-5">
                     <div className="group"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Email</label><div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4"><Mail size={18} className="text-gray-500 mr-3"/><input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" value={formData.email} onChange={(e) => updateField('email', e.target.value)} /></div></div>
                     <div className="group"><div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label><button onClick={() => setViewMode('forgot')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Forgot?</button></div><div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4"><Lock size={18} className="text-gray-500 mr-3"/><input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" value={formData.password} onChange={(e) => updateField('password', e.target.value)} /><button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
                   </div>
                   
                   {CLOUDFLARE_SITE_KEY && (
                     <div className="mt-6 flex justify-center">
                        <Turnstile 
                            ref={turnstileRef} 
                            siteKey={CLOUDFLARE_SITE_KEY} 
                            onSuccess={setCaptchaToken} 
                            onExpire={() => setCaptchaToken(null)}
                            theme="dark" 
                        />
                     </div>
                   )}

                   <button onClick={handleFinalSubmit} disabled={loading} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin"/> : 'Log In'}</button>
                   <div className="flex items-center gap-4 my-8"><div className="h-px bg-white/10 flex-1"></div><span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Or continue with</span><div className="h-px bg-white/10 flex-1"></div></div>
                   <div className="flex gap-3"><SocialButton icon={<GoogleIcon />} onClick={() => handleSocialLogin('google')} label="Google" /><SocialButton icon={<GithubIcon />} onClick={() => handleSocialLogin('github')} label="GitHub" /></div>
                   <p className="mt-8 text-center text-gray-500 text-sm">Don't have an account? <button onClick={() => setViewMode('signup')} className="text-white font-bold hover:underline">Sign Up</button></p>
                </div>
              )}

              {viewMode === 'signup' && (
                  <div className="max-w-md mx-auto w-full">
                      {showVerify ? (
                       <div className="text-center animate-in zoom-in duration-300">
                           <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                             <ShieldAlert size={40} />
                           </div>
                           <h2 className="text-2xl font-bold mb-2">Guardian Consent Required</h2>
                           <p className="text-gray-400 mb-6 text-sm">We sent a 6-digit code to <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{formData.parentEmail}</span></p>
                           
                           <div className="relative mb-6">
                               <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 text-center text-3xl tracking-[1em] font-mono text-white focus:border-orange-500 focus:shadow-[0_0_20px_rgba(249,115,22,0.2)] outline-none transition-all" placeholder="000000" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                           </div>

                           <div className="mb-8 text-left bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                              <label className="flex items-start gap-3 cursor-pointer">
                                  <input 
                                     type="checkbox" 
                                     className="mt-1 w-5 h-5 rounded border-gray-600 bg-black text-orange-600 focus:ring-orange-500"
                                     checked={parentAgreed}
                                     onChange={(e) => setParentAgreed(e.target.checked)}
                                  />
                                  <span className="text-xs text-gray-300 leading-relaxed">
                                       <span className="font-bold text-orange-400">LEGAL DECLARATION:</span> I am the parent/legal guardian of the above child. I consent to my child using TeenVerseHub for non-hazardous digital services and receiving payments. I have reviewed the platform Terms.
                                  </span>
                              </label>
                           </div>
                         
                           <button onClick={handleVerifyOTP} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-900/50">{loading ? 'Verifying...' : 'Verify & Consent'}</button>
                           <button onClick={() => setShowVerify(false)} className="mt-6 text-gray-500 text-sm hover:text-white transition-colors">Change Parent Email</button>
                       </div>
                    ) : (
                     <>
                      <div className="flex justify-between items-center mb-8">
                           {step > 1 ? <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"><ArrowLeft size={20}/></button> : <div></div>}
                           <StepIndicator />
                           <div className="w-8"></div> 
                      </div>

                        {/* STEP 1: ROLE */}
                        {step === 1 && (
                          <div className="animate-in slide-in-from-right-8 duration-500">
                            <h2 className="text-3xl font-bold mb-2">Who are you?</h2>
                            <p className="text-gray-400 mb-8">Choose how you want to use Teenverse.</p>
                            <div className="grid gap-4">
                              {['freelancer', 'client'].map((r) => (
                                 <button key={r} onClick={() => updateField('role', r)} className={`p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${formData.role === r ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-gray-700 bg-white/5 hover:border-gray-600'}`}>
                                    <div className="flex justify-between items-start mb-2 relative z-10"><div className={`p-3 rounded-xl ${formData.role === r ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{r === 'freelancer' ? <User size={24}/> : <Briefcase size={24}/>}</div>{formData.role === r && <div className="bg-indigo-500 text-white p-1 rounded-full"><Check size={14}/></div>}</div>
                                    <h3 className="text-xl font-bold capitalize relative z-10">{r}</h3>
                                 </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* STEP 2: CREDENTIALS */}
                        {step === 2 && !socialUser && (
                           <div className="animate-in slide-in-from-right-8 duration-500 space-y-5">
                             <div><h2 className="text-3xl font-bold mb-2">Credentials</h2></div>
                             <div className="group"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Email</label><input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all"/></div>
                             <div className="group"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Password</label><input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all"/></div>
                           </div>
                        )}

                        {/* STEP 3: PERSONAL */}
                        {step === 3 && (
                           <div className="animate-in slide-in-from-right-8 duration-500 space-y-5">
                             <div><h2 className="text-3xl font-bold mb-2">Personal Info</h2></div>
                             <div className="group"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Name</label><input value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all"/></div>
                             <div className="group"><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Phone</label><input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all"/></div>
                             <div className="flex gap-4">
                                <div className="flex-1 group">
                                   <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Phone (India)</label>
                                   <input type="tel" maxLength={10} value={formData.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all" placeholder="9876543210"/>
                                </div>
                                <div className="flex-1 group">
                                   <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Country</label>
                                   <input value={formData.nationality} onChange={(e) => updateField('nationality', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-all"/>
                                </div>
                             </div>
                             <div className="group pt-2">
                                <label className="text-xs font-bold text-indigo-400 uppercase ml-1 mb-2 block flex items-center gap-1"><Gift size={14}/> Referral Code (Optional)</label>
                                <input 
                                    value={formData.referralCode} 
                                    onChange={(e) => updateField('referralCode', e.target.value.toUpperCase())} 
                                    className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-white placeholder-indigo-300/50 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest font-mono" 
                                    placeholder="TEEN1234"
                                />
                             </div>
                           </div>
                        )}

                        {/* STEP 4: FINAL */}
                        {step === 4 && (
                           <div className="animate-in slide-in-from-right-8 duration-500">
                             <h2 className="text-3xl font-bold mb-2">Final Step</h2>
                             <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {formData.role === 'freelancer' ? (
                                   <>
                                      <div className="bg-black/30 p-4 rounded-xl border border-gray-700/50">
                                         <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">DOB</label>
                                         <input type="date" value={formData.dob} onChange={(e) => updateField('dob', e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white"/>
                                         {age !== null && <div className={`text-xs mt-2 font-bold px-2 py-1 inline-block rounded ${isMinor ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>Age: {age} {isMinor && "(Parent Verification Required)"}</div>}
                                      </div>
                                      
                                      {isMinor && (
                                         <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl animate-in slide-in-from-top-2">
                                            <div className="flex gap-2 items-center mb-2 text-orange-400"><ShieldAlert size={16}/><span className="text-xs font-bold uppercase">Guardian Email Required</span></div>
                                            <input type="email" placeholder="Parent's Email Address" value={formData.parentEmail} onChange={(e) => updateField('parentEmail', e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"/>
                                         </div>
                                      )}
                                   </>
                                ) : (
                                   <div><label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Organization</label><input placeholder="Optional" onChange={(e) => updateField('org', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white"/></div>
                                )}
                                
                                <div className="flex items-start gap-3 mt-6"><input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} /><label className="text-xs text-gray-400">I agree to Terms & Privacy.</label></div>
                                
                                {/* 🛡️ CLOUDFLARE TURNSTILE WIDGET (SIGNUP) */}
                                {CLOUDFLARE_SITE_KEY && (
                                    <div className="mt-4 flex justify-center">
                                        <Turnstile 
                                            ref={turnstileRef} 
                                            siteKey={CLOUDFLARE_SITE_KEY} 
                                            onSuccess={setCaptchaToken} 
                                            onExpire={() => setCaptchaToken(null)}
                                            theme="dark" 
                                        />
                                    </div>
                                )}
                             </div>
                           </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                           {step < 4 ? <button onClick={handleNext} disabled={loading} className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold">Next</button> : <button onClick={handleFinalSubmit} disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-500 px-8 py-3 rounded-xl font-bold">Create Account</button>}
                        </div>
                         <div className="mt-8 text-center">{!socialUser && <button onClick={() => setViewMode('login')} className="text-gray-500 text-sm hover:text-white">Already have an account? Log In</button>}</div>
                         <LegalFooter mobile={true} />
                  </>
            )}
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default Auth;