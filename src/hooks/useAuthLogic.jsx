import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { initRecaptcha, sendPhoneOtp, verifyPhoneOtp } from '../utils/phoneAuth';

// LEGAL: Version control
const CONSENT_VERSION = "v1.0_TEENVERSE_PARENT_AGREEMENT_2025";
const CLOUDFLARE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_SITE_KEY;

export const useAuthLogic = (onLogin, onSignUpSuccess) => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Verification
  const [showVerify, setShowVerify] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  // Password Reset
  const [showResetVerify, setShowResetVerify] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Agreements & Security
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [parentAgreed, setParentAgreed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef();

  // Social & Phone
  const [socialUser, setSocialUser] = useState(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneVerificationId, setPhoneVerificationId] = useState(null);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [formData, setFormData] = useState({
    role: 'freelancer', email: '', password: '', name: '', phone: '', 
    nationality: '', dob: '', gender: 'Male', org: '', 
    parentEmail: '', referralCode: ''
  });
  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  // --- HELPERS ---
  const showToast = (msg, type = 'error') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getDeviceFingerprint = () => ({ 
    userAgent: navigator.userAgent, 
    language: navigator.language, 
    screenSize: `${window.screen.width}x${window.screen.height}`, 
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
    platform: navigator.platform 
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- EFFECTS ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) handleAuthRedirect(session.user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && viewMode !== 'update_password') {
        handleAuthRedirect(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'signup') {
      setTimeout(() => {
         try { initRecaptcha('recaptcha-container'); } 
         catch (e) { console.warn("Recaptcha Init:", e); }
      }, 1000);
    }
  }, [viewMode]);

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

  // --- HANDLERS ---
  const handleAuthRedirect = async (user) => {
    const { data: freelancerData } = await supabase.from('freelancers').select('phone').eq('id', user.id).maybeSingle();
    const { data: clientData } = await supabase.from('clients').select('phone').eq('id', user.id).maybeSingle();

    if ((freelancerData?.phone && freelancerData.phone.length > 5) || (clientData?.phone && clientData.phone.length > 5)) {
       onLogin(`Welcome back!`);
    } else {
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

  const handleNext = async () => {
    if (step === 1) return socialUser ? setStep(3) : setStep(2);
    if (step === 2) {
        if (!formData.email || !formData.password) return showToast("Please fill in credentials");
        return setStep(3);
    }
    if (step === 3) {
        if (!isPhoneVerified) return showToast("Verify mobile number via OTP to continue.");
        setLoading(true);
        try {
            const userId = socialUser?.id || '00000000-0000-0000-0000-000000000000';
            const { data: fData } = await supabase.from('freelancers').select('phone').eq('phone', formData.phone).neq('id', userId).maybeSingle();
            const { data: cData } = await supabase.from('clients').select('phone').eq('phone', formData.phone).neq('id', userId).maybeSingle();
            if (fData || cData) throw new Error("Phone number already registered.");
            setStep(4);
        } catch (error) {
            showToast(error.message);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleFinalSubmit = async () => {
    if (viewMode !== 'login' && !agreedToTerms) return showToast("Agree to Terms & Privacy.");
    
    setLoading(true);
    try {
      if (viewMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email, password: formData.password, options: { captchaToken } 
        });
        if (error) throw error;
      } else {
        if (formData.role === 'freelancer' && isMinor) {
           if (!formData.parentEmail) throw new Error("Parent email required for minors.");
           const { error } = await supabase.functions.invoke('send-parent-otp', {
              body: { parentEmail: formData.parentEmail, childName: formData.name }
           });
           if (error) throw new Error("Failed to send parent code.");
           setShowVerify(true);
           return; // Stop here, wait for OTP
        }
        await completeSignup();
      }
    } catch (err) {
      showToast(err.message);
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken(null); 
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    const deviceMeta = getDeviceFingerprint(); 
    const myRefCode = `${formData.name.split(' ')[0].toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
    let uid = socialUser?.id;

    try {
        if (!uid) {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email, password: formData.password,
                options: { 
                    data: { full_name: formData.name, role: formData.role, device_fingerprint: deviceMeta },
                    captchaToken, emailRedirectTo: window.location.origin
                } 
            });
            if (error) throw error;
            uid = data.user.id;
        }

        // Create Profile
        const table = formData.role === 'client' ? 'clients' : 'freelancers';
        const dbData = { 
            id: uid, name: formData.name, email: formData.email, phone: formData.phone, 
            phone_verified: true, nationality: formData.nationality, referral_code: myRefCode,
            ...(formData.role === 'client' ? { is_organisation: formData.org } : { dob: formData.dob, age, gender: formData.gender, is_parent_verified: isMinor })
        };
        
        await supabase.from('users').upsert({ id: uid, email: formData.email, full_name: formData.name });
        const { error: dbError } = await supabase.from(table).upsert(dbData);
        if (dbError) throw dbError;

        if (isMinor) {
            await supabase.functions.invoke('log-parent-consent', {
                body: { user_id: uid, parent_email: formData.parentEmail, consent_version: CONSENT_VERSION, otp }
            });
        }
        
        socialUser ? onSignUpSuccess() : setVerificationSent(true);

    } catch (error) {
        throw error; 
    }
  };

  const handlePhoneVerify = async () => {
      setOtpLoading(true);
      try {
          const verifiedNumber = await verifyPhoneOtp(phoneVerificationId, phoneOtp);
          setIsPhoneVerified(true);
          updateField('phone', verifiedNumber); 
          setPhoneVerificationId(null); 
          showToast("Phone Verified Successfully!", "success");
      } catch (err) {
          showToast("Invalid OTP code");
      } finally {
          setOtpLoading(false);
      }
  };

  const handleSendPhoneOtp = async () => {
      if (formData.phone.length < 10) return showToast("Enter valid mobile number");
      setOtpLoading(true);
      try {
          const confirmation = await sendPhoneOtp(formData.phone);
          setPhoneVerificationId(confirmation);
          showToast("OTP sent to mobile", "success");
      } catch (err) {
          showToast(err.message || "Failed to send OTP");
          initRecaptcha('recaptcha-container');
      } finally {
          setOtpLoading(false);
      }
  };

  // --- PASSWORD RESET LOGIC ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if(!formData.email) return showToast("Enter email first");
    if (CLOUDFLARE_SITE_KEY && !captchaToken) return showToast("Security check required");

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-reset', {
        body: { action: 'send', email: formData.email.trim() }
      });
      if (error) throw error;
      
      setShowResetVerify(true);
      showToast("OTP sent to your email!", "success");
    } catch (err) {
      showToast(err.message || "Failed to send OTP");
      if (turnstileRef.current) turnstileRef.current.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    if(!resetOtp) return showToast("Enter the code");
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { action: 'verify', email: formData.email.trim(), otp: resetOtp.trim() }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Invalid Code");

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
    if(newPassword.length < 6) return showToast("Password too short");
    
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { 
                action: 'reset_password', 
                email: formData.email.trim(),
                otp: resetOtp.trim(), // Re-send OTP for double verification security
                new_password: newPassword
            }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Update failed");

        showToast("Password updated! Please log in.", "success");
        setResetOtp('');
        setNewPassword('');
        setViewMode('login');
    } catch (err) {
       showToast(err.message);
    } finally {
       setLoading(false);
    }
  };

  // Return everything needed by UI
  return {
    state: {
      viewMode, step, loading, toast, showVerify, verificationSent, otp,
      showResetVerify, resetOtp, newPassword, agreedToTerms, parentAgreed,
      captchaToken, socialUser, isPhoneVerified, phoneVerificationId, phoneOtp,
      otpLoading, formData, age, isMinor, CLOUDFLARE_SITE_KEY
    },
    refs: { turnstileRef },
    actions: {
      setViewMode, setStep, setOtp, setResetOtp, setNewPassword, setAgreedToTerms,
      setParentAgreed, setCaptchaToken, setPhoneOtp, updateField, showToast, setIsPhoneVerified,
      handleNext, handleBack: () => setStep(s => s - 1), 
      handleFinalSubmit, handlePhoneVerify, handleSendPhoneOtp,
      
      // Forgot Password Actions
      handleForgotPassword,
      handleVerifyResetOTP,
      handleUpdatePassword,

      handleVerifyParentOtp: async (e) => {
          e.preventDefault(); 
          if (!parentAgreed) return showToast("Guardian must consent.");
          setLoading(true);
          const { data, error } = await supabase.functions.invoke('verify-parent-otp', {
              body: { parentEmail: formData.parentEmail, otp }
          });
          if (error || !data?.success) { setLoading(false); return showToast("Invalid Code"); }
          try { await completeSignup(); } catch (err) { showToast(err.message); setLoading(false); }
      },
      handleSocialLogin: async (provider) => {
          setLoading(true);
          const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
          if(error) { showToast(error.message); setLoading(false); }
      }
    }
  };
};