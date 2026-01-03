import React, { useState, useEffect, useRef } from 'react';
import { 
  X, UploadCloud, ShieldAlert, Mail, ArrowRight, ArrowLeft, 
  User, Briefcase, Check, ChevronRight, Loader2, Lock, 
  Eye, EyeOff, Sparkles, Scale, Gift, MailCheck, RefreshCw, Key // Fixed: Key instead of KeyRound
} from 'lucide-react';
import { supabase } from '../supabase'; 
import { Turnstile } from '@marsidev/react-turnstile'; 

const CONSENT_VERSION = "v1.0_TEENVERSE_PARENT_AGREEMENT_2025";
const CLOUDFLARE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_SITE_KEY; 

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

const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);
const GithubIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  const [viewMode, setViewMode] = useState('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification States
  const [showVerify, setShowVerify] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false); 
  const [otp, setOtp] = useState('');

  // 🆕 OTP PASSWORD RESET STATES
  const [showResetVerify, setShowResetVerify] = useState(false);
  const [resetOtp, setResetOtp] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [parentAgreed, setParentAgreed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef();
  const [socialUser, setSocialUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    role: 'freelancer', email: '', password: '', name: '', phone: '', nationality: '', dob: '', gender: 'Male', upi: '', org: 'No', parentEmail: '', referralCode: ''
  });
  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  const getDeviceFingerprint = () => ({ userAgent: navigator.userAgent, language: navigator.language, screenSize: `${window.screen.width}x${window.screen.height}`, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, platform: navigator.platform });

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (viewMode === 'update_password') return;
          const user = session.user;
          const { data: freelancerData } = await supabase.from('freelancers').select('id').eq('id', user.id).maybeSingle();
          const { data: clientData } = await supabase.from('clients').select('id').eq('id', user.id).maybeSingle();
          if (freelancerData || clientData) onLogin(`Welcome back!`);
          else { setSocialUser(user); setFormData(prev => ({ ...prev, email: user.email, name: user.user_metadata?.full_name || user.email.split('@')[0], role: 'freelancer' })); setViewMode('signup'); setStep(1); }
        }
      } catch (err) { console.error("Session Check Error:", err); } 
      finally { setLoading(false); }
    };
    checkSession();
  }, [onLogin, viewMode]);

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
    if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
        alert(`Please wait ${Math.ceil((60000 - (Date.now() - parseInt(lastSent))) / 1000)} seconds.`);
        return false;
    }
    return true;
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // 📧 🆕 STEP 1: SEND RESET OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if(!formData.email) return alert("Please enter your email address first.");
    if (CLOUDFLARE_SITE_KEY && !captchaToken) return alert("Please complete the security check.");

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-reset', {
        body: { action: 'send', email: formData.email.trim() }
      });
      if (error) throw error;
      setShowResetVerify(true);
      alert("OTP sent! Check your email.");
    } catch (err) {
      alert(err.message || "Failed to send OTP");
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔐 🆕 STEP 2: VERIFY CODE (No Login Yet)
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

        alert("Code Verified! Please set your new password.");
        setShowResetVerify(false);
        setViewMode('update_password'); 
        // ⚠️ Important: We keep resetOtp in state because we need it for Step 3

    } catch (err) {
        alert(err.message);
    } finally {
        setLoading(false);
    }
  };

  // 🛠️ 🆕 STEP 3: UPDATE PASSWORD (Admin Override via OTP)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { 
                action: 'reset_password', 
                email: formData.email.trim(),
                otp: resetOtp.trim(), // Re-send OTP for security check
                new_password: newPassword
            }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Failed to update password");

        alert("Password updated successfully! Please log in.");
        setResetOtp(''); // Now safe to clear
        setViewMode('login');

    } catch (err) {
       alert(err.message);
    } finally {
       setLoading(false);
    }
  };
  
  // --- SUB-COMPONENTS ---
  const StepIndicator = () => (<div className="flex gap-2 mb-8 justify-center">{[1, 2, 3, 4].map(i => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-2 bg-gray-700'}`} />))}</div>);
  const SocialButton = ({ icon, onClick, label }) => (<button type="button" onClick={onClick} className="flex-1 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 p-3 rounded-xl flex justify-center items-center transition-all duration-300 group relative overflow-hidden" title={label}><div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div><div className="relative transform group-hover:scale-110 transition-transform">{icon}</div></button>);
  const LegalFooter = ({ mobile }) => (<div className={`mt-8 pt-6 border-t border-white/10 text-[10px] text-gray-500 leading-tight ${mobile ? 'md:hidden' : 'hidden md:block'}`}><p className="mb-2"><Scale size={10} className="inline mr-1"/> Legal Compliance:</p><p>TeenVerseHub is a technology intermediary.</p></div>);

  // STUBS for unchanged functions
  const handleVerifyOTP = async (e) => { e.preventDefault(); /* ... (Reuse your existing logic for signup parent verification) ... */ };
  const handleSocialLogin = async (p) => { /* ... */ };
  const handleResendEmail = async () => { /* ... */ };
  const handleFinalSubmit = async () => { /* ... */ };
  const handleNext = async () => { /* ... */ };
  const handleBack = () => { /* ... */ };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans text-gray-100 relative overflow-hidden">
      <style>{styles}</style>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f111a] via-[#1a103c] to-[#0f111a] animate-gradient z-0"></div>
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
             <div className="max-w-md mx-auto w-full text-center">
               <h2 className="text-3xl font-bold mb-4">Check Email</h2>
               <button onClick={() => { setVerificationSent(false); setViewMode('login'); }} className="text-gray-400 hover:text-white text-sm">Return to Login</button>
             </div>
          ) : (
            <>
              {viewMode === 'update_password' && (
                <div className="max-w-md mx-auto w-full animate-in fade-in zoom-in duration-500">
                  <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm font-bold transition-colors"><ArrowLeft size={16}/> Cancel</button>
                  <h2 className="text-3xl font-bold mb-2">Set New Password</h2>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4">
                        <Lock size={18} className="text-gray-500 mr-3"/>
                        <input type="password" placeholder="New Password" className="bg-transparent border-none outline-none w-full py-4 text-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}/>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg">Update Password</button>
                  </form>
                </div>
              )}

              {viewMode === 'forgot' && (
                 <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-300">
                   <button onClick={() => setViewMode('login')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 text-sm font-bold transition-colors"><ArrowLeft size={16}/> Back to Login</button>
                   
                   {!showResetVerify ? (
                       <>
                           <h2 className="text-3xl font-bold mb-2">Reset Password</h2>
                           <form onSubmit={handleForgotPassword} className="space-y-4">
                             <div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4">
                                 <Mail size={18} className="text-gray-500 mr-3"/>
                                 <input type="email" placeholder="Email Address" className="bg-transparent border-none outline-none w-full py-4 text-white" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required />
                             </div>
                             {CLOUDFLARE_SITE_KEY && (<div className="my-2 flex justify-center"><Turnstile ref={turnstileRef} siteKey={CLOUDFLARE_SITE_KEY} onSuccess={setCaptchaToken} theme="dark" /></div>)}
                             <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg">Send OTP</button>
                           </form>
                       </>
                   ) : (
                       <div className="animate-in fade-in zoom-in duration-300">
                           <h2 className="text-3xl font-bold mb-2">Enter OTP</h2>
                           <div className="relative mb-6">
                               <div className="absolute left-4 top-5 text-gray-500"><Key size={24}/></div>
                               <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 pl-12 pr-4 text-center text-3xl tracking-[0.5em] font-mono text-white focus:border-indigo-500 outline-none" placeholder="000000" maxLength={6} value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} />
                           </div>
                           <button onClick={handleVerifyResetOTP} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg">Verify Code</button>
                           <button onClick={() => setShowResetVerify(false)} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-white">Wrong email?</button>
                       </div>
                   )}
                 </div>
              )}

              {viewMode === 'login' && (
                  <div className="max-w-md mx-auto w-full">
                      {/* ... existing login code ... */}
                      <button onClick={() => setViewMode('forgot')} className="text-indigo-400">Forgot Password?</button>
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
