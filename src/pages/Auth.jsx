import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShieldAlert, Mail, ArrowLeft, 
  User, Briefcase, Check, Loader2, Lock, 
  Eye, EyeOff, Sparkles, Scale, Gift, Key, ArrowRight,
  TrendingUp, Globe, Zap, ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabase'; 
import { Turnstile } from '@marsidev/react-turnstile'; 
import { motion, AnimatePresence } from 'framer-motion';

// LEGAL: Version control for the consent text.
const CONSENT_VERSION = "v1.0_TEENVERSE_PARENT_AGREEMENT_2025";

// 🛡️ SAFE ENV ACCESS
const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`REACT_APP_${key.replace('VITE_', '')}`];
  }
  return '';
};

const CLOUDFLARE_SITE_KEY = getEnv('VITE_CLOUDFLARE_SITE_KEY'); 

// --- ICONS ---
const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);
const GithubIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);

// --- FLOATING NOTIFICATION COMPONENT ---
const FloatingNotif = ({ icon: Icon, title, sub, delay, x, y }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20, x: 0 }}
        animate={{ 
            opacity: [0, 1, 1, 0], 
            y: [0, -10, -10, -20],
            x: [0, x, x, x + 10]
        }}
        transition={{ 
            duration: 5, 
            delay: delay, 
            repeat: Infinity, 
            repeatDelay: 8 
        }}
        className="absolute z-20 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex items-center gap-3 shadow-2xl w-48 pointer-events-none"
        style={{ top: y, left: x }}
    >
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
            <Icon size={14} />
        </div>
        <div>
            <div className="text-[10px] font-bold text-gray-300 uppercase">{title}</div>
            <div className="text-xs font-bold text-white">{sub}</div>
        </div>
    </motion.div>
);

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null); 
  
  // Verification States
  const [showVerify, setShowVerify] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); 
  const [otp, setOtp] = useState('');

  // Password Reset States
  const [showResetVerify, setShowResetVerify] = useState(false);
  const [resetOtp, setResetOtp] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [parentAgreed, setParentAgreed] = useState(false);
    
  // Security States
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef();

  // Social & Password Update
  const [socialUser, setSocialUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    role: 'freelancer', email: '', password: '', name: '', phone: '', nationality: '', dob: '', gender: 'Male', upi: '', org: 'No', parentEmail: '', referralCode: ''
  });
  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  // --- DEVICE FINGERPRINT ---
  const getDeviceFingerprint = () => ({ 
    userAgent: navigator.userAgent, 
    language: navigator.language, 
    screenSize: `${window.screen.width}x${window.screen.height}`, 
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
    platform: navigator.platform 
  });

  // --- HELPER: CUSTOM TOAST ---
  const showToast = (msg, type = 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- 1. SUPABASE SESSION LISTENER ---
  useEffect(() => {
    // Check initial session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) handleAuthRedirect(session.user);
    };
    checkUser();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && viewMode !== 'update_password') {
        handleAuthRedirect(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [viewMode]); 

  // --- 🔥 REDIRECT LOGIC ---
  const handleAuthRedirect = async (user) => {
    const { data: freelancerData } = await supabase.from('freelancers').select('phone, referral_code').eq('id', user.id).maybeSingle();
    const { data: clientData } = await supabase.from('clients').select('phone, referral_code').eq('id', user.id).maybeSingle();

    const isFreelancerComplete = freelancerData && freelancerData.phone && freelancerData.phone.length > 5;
    const isClientComplete = clientData && clientData.phone && clientData.phone.length > 5;

    if (isFreelancerComplete || isClientComplete) {
       onLogin(`Welcome back!`);
    } else {
       console.log("Incomplete Profile Detected. Redirecting to Signup...");
       setSocialUser(user);
       setFormData(prev => ({ 
         ...prev, 
         email: user.email, 
         name: user.user_metadata?.full_name || user.email?.split('@')[0], 
         role: clientData ? 'client' : 'freelancer' 
       }));
       setViewMode('signup');
       setStep(1); 
    }
  };

  // --- AGE CALCULATION ---
  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) calculatedAge--;
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
        showToast(`Please wait ${wait} seconds before sending another OTP.`);
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
        if (!formData.email || !formData.password) return showToast("Please fill in credentials");
        setStep(prev => prev + 1);
        return;
    }
    if (step === 3) {
        if (!formData.name || !formData.phone) return showToast("Please fill in personal details");
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            return showToast("Enter a valid 10-digit mobile number (6-9 start).");
        }
        setLoading(true);
        try {
            const userId = socialUser?.id || '00000000-0000-0000-0000-000000000000';
            const { data: fData } = await supabase.from('freelancers').select('phone').eq('phone', formData.phone).neq('id', userId).maybeSingle();
            const { data: cData } = await supabase.from('clients').select('phone').eq('phone', formData.phone).neq('id', userId).maybeSingle();
            if (fData || cData) {
                setLoading(false);
                return showToast("Phone number already registered.");
            }
            setLoading(false);
            setStep(prev => prev + 1);
        } catch (error) {
            setLoading(false);
            return showToast("Connection error. Try again.");
        }
    }
  };

  const handleBack = () => {
    if (step === 3 && socialUser) setStep(1);
    else setStep(prev => prev - 1);
  };

  // 📧 PASSWORD RESET
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if(!formData.email) return showToast("Enter your email address first.");
    if (CLOUDFLARE_SITE_KEY && !captchaToken) return showToast("Please complete the security check.");

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-reset', {
        body: { action: 'send', email: formData.email.trim() }
      });
      if (error) throw error;
      setShowResetVerify(true);
      showToast("OTP sent! Check your email.", "success");
    } catch (err) {
      showToast(err.message || "Failed to send OTP");
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { 
              action: 'verify', 
              email: formData.email.trim(), 
              otp: resetOtp.trim() 
            }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Invalid or Expired Code");

        showToast("Code Verified!", "success");
        setShowResetVerify(false);
        setViewMode('update_password'); 
    } catch (err) {
        showToast(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { 
                action: 'reset_password', 
                email: formData.email.trim(),
                otp: resetOtp.trim(),
                new_password: newPassword
            }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Failed to update password");

        showToast("Password updated! Please log in.", "success");
        setResetOtp('');
        setViewMode('login');
    } catch (err) {
       showToast(err.message);
    } finally {
       setLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e) => { 
    e.preventDefault(); 
    if (!parentAgreed) return showToast("Parent/Guardian must explicitly consent.");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-parent-otp', {
        body: { parentEmail: formData.parentEmail, otp: otp }
    });
    if (error || !data || !data.success) {
        setLoading(false);
        return showToast("Invalid or Expired Code.");
    }
    try { await completeSignup(); } catch (err) { showToast(err.message); setLoading(false); }
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
      showToast("Social Login Failed: " + err.message);
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (viewMode !== 'login' && !agreedToTerms) return showToast("Agree to Terms & Privacy to continue.");

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
            if (!formData.dob) { setLoading(false); return showToast("Date of Birth is required."); }
            if (age < 13) { setLoading(false); throw new Error("Must be 13+ to join."); }
        }
        if (formData.role === 'freelancer' && isMinor) {
           if (!formData.parentEmail) { setLoading(false); throw new Error("Parent email required for minors."); }
           if (!checkOtpRateLimit()) { setLoading(false); return; }
           
           const { error } = await supabase.functions.invoke('send-parent-otp', {
              body: { parentEmail: formData.parentEmail, childName: formData.name }
           });
           
           if (error) throw new Error("Failed to send code. Try again.");
           localStorage.setItem('last_otp_sent', Date.now().toString());
           setShowVerify(true);
           setLoading(false);
           return;
        }
        await completeSignup();
      }
    } catch (err) {
      showToast(err.message);
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken(null); 
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    let uid = "";
    let email = formData.email;
    const deviceMeta = getDeviceFingerprint(); 
    const myRefCode = `${formData.name.split(' ')[0].toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    try {
        if (socialUser) {
            uid = socialUser.id;
            email = socialUser.email;
            
            await supabase.from('users').upsert({
                id: uid,
                email: email,
                full_name: formData.name,
                avatar_url: socialUser.user_metadata?.avatar_url,
                raw_app_meta_data: { device: deviceMeta } 
            });

            const table = formData.role === 'client' ? 'clients' : 'freelancers';
            const dbData = formData.role === 'client' 
             ? { id: uid, name: formData.name, email: email, phone: formData.phone, nationality: formData.nationality, is_organisation: formData.org, referral_code: myRefCode, referred_by: formData.referralCode || null }
             : { id: uid, name: formData.name, email: email, phone: formData.phone, nationality: formData.nationality, dob: formData.dob, age: age, gender: formData.gender, upi: formData.upi, is_parent_verified: isMinor, unlocked_skills: [], referral_code: myRefCode, referred_by: formData.referralCode || null };
            
            const { error } = await supabase.from(table).upsert(dbData);
            if (error) throw new Error("Could not save profile: " + error.message);
            
            if (isMinor) {
                await supabase.functions.invoke('log-parent-consent', {
                    body: { 
                        user_id: uid, 
                        parent_email: formData.parentEmail, 
                        consent_version: CONSENT_VERSION,
                        otp: otp 
                    }
                });
            }
            onSignUpSuccess(); 
            return;
        }

        const metadata = {
            full_name: formData.name, 
            role: formData.role, 
            phone: formData.phone, 
            nationality: formData.nationality, 
            dob: formData.dob, 
            age: age,
            gender: formData.gender, 
            org: formData.org || '', 
            is_minor: isMinor, 
            referral_code: myRefCode,
            device_fingerprint: deviceMeta 
        };

        const { data, error } = await supabase.auth.signUp({
            email: formData.email, 
            password: formData.password, 
            options: { 
                data: metadata, 
                captchaToken: captchaToken,
                emailRedirectTo: window.location.origin
            } 
        });

        if (error) throw error;
        if (!data.user) throw new Error("User creation failed.");
        
        uid = data.user.id;
        
        if (isMinor && uid) {
            await supabase.functions.invoke('log-parent-consent', {
                body: { 
                    user_id: uid, 
                    parent_email: formData.parentEmail, 
                    consent_version: CONSENT_VERSION,
                    otp: otp 
                }
            });
        }
        
        setVerificationSent(true); 

    } catch (error) {
        throw error; 
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const StepIndicator = () => (
      <div className="flex gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map(i => (
              <motion.div 
                  key={i} 
                  layout 
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-2 bg-gray-800'}`} 
              />
          ))}
      </div>
  );
  
  const SocialButton = ({ icon, onClick, label }) => (
      <button 
          type="button" 
          onClick={onClick} 
          className="flex-1 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 p-4 rounded-xl flex justify-center items-center transition-all duration-300 group relative overflow-hidden" 
          title={label}
      >
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative transform group-hover:scale-110 transition-transform">{icon}</div>
      </button>
  );

  const LegalFooter = ({ mobile }) => (
      <div className={`mt-8 pt-6 border-t border-white/10 text-[10px] text-gray-500 leading-tight ${mobile ? 'md:hidden' : 'hidden md:block'}`}>
          <p className="mb-2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity cursor-default">
              <Scale size={10} className="text-indigo-400"/> Legal Protocol: TeenVerseHub is a technology intermediary.
          </p>
          <p className="opacity-50">© 2025 TeenVerse Protocol. All rights secured.</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans text-gray-100 relative overflow-hidden">
      
      {/* --- AMAZING BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
         <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
         />
         <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 15, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
         />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] z-0"></div>
      </div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
             initial={{ opacity: 0, y: -20, x: 20 }}
             animate={{ opacity: 1, y: 0, x: 0 }}
             exit={{ opacity: 0, x: 20 }}
             className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
             {toast.type === 'success' ? <Check size={20}/> : <ShieldAlert size={20}/>}
             <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.8, type: "spring" }}
         className="w-full max-w-[1200px] h-[85vh] bg-[#0F172A]/40 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        
        {/* CLOSE BUTTON */}
        <button onClick={() => setView('home')} className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/5 p-2 rounded-full hover:bg-white/10 group">
           <X size={20} className="group-hover:rotate-90 transition-transform"/>
        </button>

        {/* --- LEFT SIDE: HERO ENVIRONMENT (Desktop Only) --- */}
        <div className="hidden md:flex w-[45%] relative flex-col justify-between p-12 bg-[#050505] overflow-hidden">
          
          {/* Abstract 3D Background */}
          <div className="absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2500&auto=format&fit=crop" alt="3D Abstract" className="w-full h-full object-cover opacity-40 mix-blend-lighten hover:scale-105 transition-transform duration-[10s]"/>
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
          </div>
          
          {/* Floating Workspace Simulations */}
          <FloatingNotif icon={Check} title="Payment Received" sub="$250.00" delay={1} x={40} y={100} />
          <FloatingNotif icon={Zap} title="New Job Match" sub="UI Design • Remote" delay={3} x={250} y={200} />
          <FloatingNotif icon={ShieldCheck} title="Contract Secured" sub="Escrow Locked" delay={5} x={60} y={300} />

          <div className="relative z-10 mt-auto">
            <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl mb-8 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
               <Sparkles className="text-indigo-400" size={32}/>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
              FUTURE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">OF WORK.</span>
            </h1>
            <p className="text-gray-400 text-lg font-light leading-relaxed max-w-sm border-l-2 border-indigo-500/50 pl-4">
              Enter the metaverse of freelancing. Secure payments, verified clients, and a portfolio that works for you.
            </p>
          </div>
          <div className="relative z-10"><LegalFooter mobile={false} /></div>
        </div>

        {/* --- RIGHT SIDE: INTERFACE --- */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col justify-center custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
          
          {loading && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0F172A]/90 backdrop-blur-sm rounded-r-[32px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                    <Loader2 size={48} className="relative z-10 animate-spin text-indigo-400 mb-4" />
                </div>
                <span className="text-indigo-300 font-mono text-xs uppercase tracking-widest animate-pulse">Establishing Secure Uplink...</span>
             </div>
          )}

          <AnimatePresence mode="wait">
             {verificationSent ? (
                <motion.div 
                   key="verify-sent"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="max-w-md mx-auto w-full text-center"
                >
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                     <Mail size={40} />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-white">Transmission Sent</h2>
                  <p className="text-gray-400 mb-8 leading-relaxed">We've deployed a secure magic link to <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{formData.email}</span>. Activate to proceed.</p>
                  <button onClick={() => { setVerificationSent(false); setViewMode('login'); }} className="text-indigo-400 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest">
                     <ArrowLeft size={16}/> Return to Base
                  </button>
                </motion.div>
             ) : (
                <div className="w-full max-w-md mx-auto">
                   
                   {/* VIEW: UPDATE PASSWORD */}
                   {viewMode === 'update_password' && (
                     <motion.div key="update-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                       <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-sm font-bold transition-colors group"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Cancel</button>
                       <h2 className="text-3xl font-bold mb-2 text-white">Override Password</h2>
                       <p className="text-gray-400 mb-8">Establish a new secure access key.</p>
                       <form onSubmit={handleUpdatePassword} className="space-y-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                           <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                             <Lock size={18} className="text-gray-500 mr-3"/>
                             <input type="password" placeholder="Min. 6 characters" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}/>
                           </div>
                         </div>
                         <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all transform active:scale-95 uppercase tracking-widest text-sm">{loading ? <Loader2 className="animate-spin"/> : 'Update Credentials'}</button>
                       </form>
                     </motion.div>
                   )}

                   {/* VIEW: FORGOT PASSWORD */}
                   {viewMode === 'forgot' && (
                      <motion.div key="forgot-pw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-sm font-bold transition-colors group"><ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Login</button>
                        
                        {!showResetVerify ? (
                            <>
                                <h2 className="text-3xl font-bold mb-2 text-white">Reset Access</h2>
                                <p className="text-gray-400 mb-8">Enter your registered email to receive a One-Time Protocol (OTP).</p>
                                <form onSubmit={handleForgotPassword} className="space-y-6">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                                      <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                          <Mail size={18} className="text-gray-500 mr-3"/>
                                          <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required />
                                      </div>
                                  </div>
                                  
                                  {CLOUDFLARE_SITE_KEY && (
                                      <div className="flex justify-center py-2 bg-black/20 rounded-xl">
                                          <Turnstile ref={turnstileRef} siteKey={CLOUDFLARE_SITE_KEY} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken(null)} theme="dark" />
                                      </div>
                                  )}

                                  <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] transform active:scale-95 flex justify-center items-center uppercase tracking-widest text-sm">
                                      {loading ? <Loader2 className="animate-spin"/> : 'Send Code'}
                                  </button>
                                </form>
                            </>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                <h2 className="text-3xl font-bold mb-2 text-white">Verify Identity</h2>
                                <p className="text-gray-400 mb-8">Enter the 6-digit secure code sent to your inbox.</p>
                                <div className="relative mb-6 group">
                                    <div className="absolute left-4 top-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors"><Key size={24}/></div>
                                    <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 pl-12 pr-4 text-center text-3xl tracking-[0.5em] font-mono text-white focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] outline-none transition-all" placeholder="000000" maxLength={6} value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} />
                                </div>
                                <button onClick={handleVerifyResetOTP} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center transform active:scale-95 transition-all uppercase tracking-widest text-sm">
                                    {loading ? <Loader2 className="animate-spin"/> : 'Authenticate'}
                                </button>
                                <button onClick={() => setShowResetVerify(false)} className="mt-6 w-full text-center text-sm text-gray-500 hover:text-white transition-colors">Wrong email? Change it</button>
                            </motion.div>
                        )}
                      </motion.div>
                   )}

                   {/* VIEW: LOGIN */}
                   {viewMode === 'login' && (
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
                                <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600 font-mono" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                                <button onClick={() => { setViewMode('forgot'); setShowResetVerify(false); }} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider">Forgot?</button>
                             </div>
                             <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all group focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <Lock size={18} className="text-gray-500 mr-3 group-focus-within:text-indigo-400 transition-colors"/>
                                <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600 font-mono" value={formData.password} onChange={(e) => updateField('password', e.target.value)} />
                                <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                             </div>
                          </div>
                        </div>
                        
                        <button onClick={handleFinalSubmit} disabled={loading} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2 transform active:scale-[0.98] uppercase tracking-widest text-sm">
                           {loading ? <Loader2 className="animate-spin"/> : <>Login <ArrowRight size={18}/></>}
                        </button>
                        
                        <div className="flex items-center gap-4 my-8 opacity-60">
                           <div className="h-px bg-white/20 flex-1"></div>
                           <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Or access via</span>
                           <div className="h-px bg-white/20 flex-1"></div>
                        </div>
                        
                        <div className="flex gap-4">
                           <SocialButton icon={<GoogleIcon />} onClick={() => handleSocialLogin('google')} label="Google" />
                           <SocialButton icon={<GithubIcon />} onClick={() => handleSocialLogin('github')} label="GitHub" />
                        </div>
                        
                        <p className="mt-8 text-center text-gray-400 text-sm">
                           No access key? <button onClick={() => setViewMode('signup')} className="text-indigo-400 font-bold hover:text-indigo-300 hover:underline transition-colors ml-1 uppercase tracking-wide text-xs">Initialize Signup</button>
                        </p>
                     </motion.div>
                   )}

                   {/* VIEW: SIGNUP */}
                   {viewMode === 'signup' && (
                      <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
                           {showVerify ? (
                             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center my-auto">
                                 <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.2)] animate-pulse">
                                    <ShieldAlert size={48} />
                                 </div>
                                 <h2 className="text-2xl font-bold mb-2 text-white">Guardian Protocol</h2>
                                 <p className="text-gray-400 mb-8 text-sm max-w-xs mx-auto">Age verification required. Code sent to <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{formData.parentEmail}</span></p>
                                 
                                 <div className="relative mb-6">
                                     <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 text-center text-4xl tracking-[0.5em] font-mono text-white focus:border-orange-500 focus:shadow-[0_0_30px_rgba(249,115,22,0.3)] outline-none transition-all" placeholder="000000" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                                 </div>

                                 <div className="mb-8 text-left bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                                     <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer sr-only" checked={parentAgreed} onChange={(e) => setParentAgreed(e.target.checked)}/>
                                            <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"></div>
                                            <Check size={14} className="absolute text-black opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 pointer-events-none"/>
                                        </div>
                                        <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                            <span className="font-bold text-orange-400">LEGAL DECLARATION:</span> I am the parent/legal guardian. I consent to my child using TeenVerseHub for non-hazardous digital services.
                                        </span>
                                     </label>
                                 </div>
                               
                                 <button onClick={handleVerifyOTP} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-900/50 transform active:scale-95 uppercase tracking-widest text-sm">{loading ? 'Verifying...' : 'Verify & Consent'}</button>
                                 <button onClick={() => setShowVerify(false)} className="mt-6 text-gray-500 text-xs uppercase tracking-wider hover:text-white transition-colors underline">Change Parent Email</button>
                             </motion.div>
                           ) : (
                             <>
                              <div className="flex justify-between items-center mb-8">
                                   {step > 1 ? <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg group"><ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/></button> : <div></div>}
                                   <StepIndicator />
                                   <div className="w-8"></div> 
                              </div>

                               {/* STEP 1: ROLE */}
                               {step === 1 && (
                                 <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                   <div>
                                       <h2 className="text-3xl font-black mb-2 text-white">IDENTIFY</h2>
                                       <p className="text-gray-400">Select your operating mode.</p>
                                   </div>
                                   <div className="grid gap-4">
                                     {['freelancer', 'client'].map((r) => (
                                         <button key={r} onClick={() => updateField('role', r)} className={`p-6 rounded-2xl border transition-all text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] duration-300 ${formData.role === r ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
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

                               {/* STEP 2: CREDENTIALS */}
                               {step === 2 && !socialUser && (
                                  <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div><h2 className="text-3xl font-black mb-2 text-white">SECURE ACCESS</h2><p className="text-gray-400">Define your login parameters.</p></div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                        <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                            <Mail size={18} className="text-gray-500 mr-3"/>
                                            <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full bg-transparent border-none outline-none py-4 text-white placeholder-gray-600 font-mono" placeholder="name@example.com"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                                        <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                            <Lock size={18} className="text-gray-500 mr-3"/>
                                            <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="w-full bg-transparent border-none outline-none py-4 text-white placeholder-gray-600 font-mono" placeholder="••••••••"/>
                                        </div>
                                    </div>
                                  </motion.div>
                               )}

                               {/* STEP 3: PERSONAL */}
                               {step === 3 && (
                                  <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <div><h2 className="text-3xl font-black mb-2 text-white">PROFILE DATA</h2><p className="text-gray-400">Initialize your public persona.</p></div>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                                            <input value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 focus:bg-white/10 outline-none transition-all placeholder-gray-600" placeholder="John Doe"/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Mobile</label>
                                            <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 focus:bg-white/10 outline-none transition-all placeholder-gray-600 font-mono" placeholder="9876543210"/>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Region</label>
                                        <div className="relative">
                                            <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                                            <input value={formData.nationality} onChange={(e) => updateField('nationality', e.target.value)} className="w-full pl-12 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 focus:bg-white/10 outline-none transition-all placeholder-gray-600" placeholder="e.g. India"/>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                         <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Gift size={12}/> Invite Code (Optional)</label>
                                         <input value={formData.referralCode} onChange={(e) => updateField('referralCode', e.target.value.toUpperCase())} className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-white placeholder-indigo-300/30 focus:border-indigo-500 outline-none transition-all uppercase tracking-widest font-mono" placeholder="TEEN1234"/>
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
                                                 <input type="date" value={formData.dob} onChange={(e) => updateField('dob', e.target.value)} className="w-full bg-black/40 border border-gray-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono"/>
                                                 
                                                 <AnimatePresence>
                                                    {age !== null && (
                                                        <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className={`text-xs font-bold px-3 py-2 mt-2 rounded-lg flex items-center gap-2 ${isMinor ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                                                            {isMinor ? <ShieldAlert size={14}/> : <Check size={14}/>}
                                                            Age Verified: {age} {isMinor && "(Parental Consent Required)"}
                                                        </motion.div>
                                                    )}
                                                 </AnimatePresence>
                                              </div>
                                              
                                              {isMinor && (
                                                   <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl">
                                                      <div className="flex gap-2 items-center mb-3 text-orange-400"><ShieldAlert size={18}/><span className="text-xs font-bold uppercase tracking-wider">Parent/Guardian Email</span></div>
                                                      <p className="text-gray-400 text-xs mb-3">We need to verify with a parent that you are allowed to use this platform.</p>
                                                      <input type="email" placeholder="parent@example.com" value={formData.parentEmail} onChange={(e) => updateField('parentEmail', e.target.value)} className="w-full bg-black/40 border border-gray-600 rounded-lg p-3 text-white focus:border-orange-500 outline-none placeholder-gray-500 font-mono"/>
                                                   </motion.div>
                                              )}
                                           </>
                                        ) : (
                                            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Organization Name</label>
                                                <input placeholder="Company Name (Optional)" onChange={(e) => updateField('org', e.target.value)} className="w-full bg-black/40 border border-gray-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"/>
                                            </div>
                                        )}
                                        
                                        <div className="pt-4">
                                            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-colors">
                                                <div className="relative flex items-center mt-0.5">
                                                    <input type="checkbox" className="peer sr-only" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}/>
                                                    <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all"></div>
                                                    <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 pointer-events-none"/>
                                                </div>
                                                <span className="text-xs text-gray-400 group-hover:text-gray-300">I agree to the <span className="text-indigo-400 underline">Terms of Service</span> and <span className="text-indigo-400 underline">Privacy Policy</span>.</span>
                                            </label>
                                            
                                            {CLOUDFLARE_SITE_KEY && (
                                                <div className="mt-4 flex justify-center bg-black/20 p-2 rounded-xl">
                                                     <Turnstile ref={turnstileRef} siteKey={CLOUDFLARE_SITE_KEY} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken(null)} theme="dark" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                  </motion.div>
                               )}

                               <div className="mt-auto pt-8 border-t border-white/10 flex justify-end">
                                 {step < 4 ? <button onClick={handleNext} disabled={loading} className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-wider text-sm">Next <ArrowRight size={16}/></button> : <button onClick={handleFinalSubmit} disabled={loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110 px-8 py-3 rounded-xl font-bold shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all transform active:scale-95 flex items-center gap-2 uppercase tracking-wider text-sm">{loading ? <Loader2 className="animate-spin"/> : <>Initialize <RocketIcon/></>}</button>}
                               </div>
                                <div className="mt-6 text-center">{!socialUser && <button onClick={() => setViewMode('login')} className="text-gray-500 text-sm hover:text-white transition-colors">Already have an account? <span className="text-indigo-400 font-bold underline">Log In</span></button>}</div>
                                <LegalFooter mobile={true} />
                             </>
                           )}
                      </motion.div>
                   )}
                </div>
             )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const RocketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4-1 4-1"/><path d="M12 15v5s3.03-.55 4-2c1.1-1.62 1-4 1-4"/></svg>
)

export default Auth;