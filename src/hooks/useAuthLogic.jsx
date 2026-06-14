import { useState, useEffect, useRef, useCallback } from 'react';
import { setRememberedSessionPreference, supabase } from '../supabase'; 
import { PASSWORD_SECURITY_ERROR, getPasswordSecurityStatus } from '../utils/passwordSecurity';
import { isValidEmail, normalizeIndianPhone, toMsg91Identifier } from '../utils/validators';
import { getPendingSignupProfile, removePendingSignupProfile, setPendingSignupProfile } from '../utils/pendingSignupProfile';

// Safe environment boundary extractions with clean short-circuits
const CLOUDFLARE_SITE_KEY = typeof window !== 'undefined' ? (import.meta.env.VITE_CLOUDFLARE_SITE_KEY || null) : null;
const AUTH_GENERIC_ERROR = "We couldn't complete this request. Please check your details and try again.";
const LOGIN_ERROR = 'Invalid email or password.';
const RESET_SENT_MESSAGE = 'If this email exists, a recovery code has been sent.';
const TERMS_VERSION = 'v1.0-TeenVerseHub-Terms';

const buildSignupPayload = (source = {}) => {
  const e164Phone = normalizeIndianPhone(source.phone);
  return {
    role: source.role || 'freelancer',
    name: String(source.name || '').trim(),
    email: String(source.email || '').trim().toLowerCase(),
    phone: e164Phone,
    nationality: source.nationality || 'India',
    source: source.source || '',
    dob: source.dob || '',
    gender: source.gender || 'Other',
    org: source.org || '',
    referralCode: source.referralCode || '',
    termsAccepted: source.termsAccepted !== false,
    termsVersion: source.termsVersion || TERMS_VERSION,
  };
};

export const useAuthLogic = (onLogin, onSessionReady) => {
  // ─── CORE VIEW STATE MACHINERY ─────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [verificationSent, setVerificationSent] = useState(false); 
   
  // Credential Recovery & Update State
  const [showResetVerify, setShowResetVerify] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Security Interlocks
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);
  const turnstileRef = useRef(null);
  const completingPendingSignupRef = useRef(false);

  // Social Connections & Phone OTP State
  const [socialUser, setSocialUser] = useState(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpReqId, setPhoneOtpReqId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAction, setOtpAction] = useState(null);

  // Consolidated Onboarding Identity Object Schema
  const [formData, setFormData] = useState({
    role: 'freelancer', email: '', password: '', name: '', phone: '', 
    nationality: 'India', source: '', dob: '', gender: 'Male', org: '', 
    referralCode: ''
  });
  
  const [age, setAge] = useState(null);

  // ─── MECHANICS & DISPATCH INTERACTION ENGINE ───────────────────────────────
  const showToast = useCallback((msg, type = 'error') => {
    setToast({ message: msg, type });
  }, []);

  // Resilient defensive hardware footprint audit
  const getDeviceFingerprint = () => {
    if (typeof window === 'undefined') return {};
    return { 
      userAgent: navigator.userAgent || 'unknown', 
      language: navigator.language || 'en', 
      screenSize: `${window.screen?.width || 0}x${window.screen?.height || 0}`, 
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', 
      platform: navigator.userAgentData?.platform || navigator.platform || 'unknown'
    };
  };

  const getPhoneIdentifiers = (phone = formData.phone) => {
    const e164Phone = normalizeIndianPhone(phone);
    return {
      msg91Identifier: toMsg91Identifier(e164Phone),
      e164Phone,
      localPhone: e164Phone.slice(3),
    };
  };

  const getSignupPayload = () => ({
    ...buildSignupPayload(formData),
    termsAccepted: agreedToTerms,
    termsVersion: TERMS_VERSION,
  });

  const validateSignupPayload = () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      throw new Error('Enter your full name.');
    }

    if (!isValidEmail(formData.email)) {
      throw new Error('Enter a valid email address.');
    }

    if (!formData.source) {
      throw new Error('Please select how you discovered TeenVerseHub.');
    }

    if (formData.role === 'freelancer' && (!formData.dob || !age)) {
      throw new Error('Select your date of birth.');
    }

    getPhoneIdentifiers();
  };

  const completeSignupProfile = async (payload = null) => {
    const signupPayload = payload || getSignupPayload();
    if (!payload) validateSignupPayload();

    const { data, error } = await supabase.functions.invoke('complete-signup', {
      body: signupPayload,
    });

    if (error || !data?.success) {
      throw new Error(data?.error || AUTH_GENERIC_ERROR);
    }

    return data;
  };

  const checkPhoneVerification = useCallback(async (phone) => {
    if (!phone) return false;
    const { data, error } = await supabase.functions.invoke('check-phone-verification', {
      body: { phone },
    });

    if (error || !data?.success) return false;
    return Boolean(data.verified);
  }, []);

  // Centralized data cleaning engine
  const updateField = (field, value) => {
    let sanitizedValue = value;

    // Direct input mutators
    if (field === 'referralCode') sanitizedValue = value.toUpperCase().trim();
    if (field === 'email') sanitizedValue = value.toLowerCase().trim();
    if (field === 'phone') sanitizedValue = value.replace(/\D/g, '');

    setFormData(prev => {
      const nextData = { ...prev, [field]: sanitizedValue };

      // Invalidate existing verifications on change
      if (field === 'phone') {
        setIsPhoneVerified(false);
        setPhoneOtpSent(false);
        setPhoneOtp('');
        setPhoneOtpReqId('');
      }
      
      // Strict calendar threshold checker
      if (field === 'dob') {
        if (!sanitizedValue) {
          setAge(null);
          return nextData;
        }

        const birthDate = new Date(sanitizedValue);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }

        // Fixed data mismatch vulnerability
        if (calculatedAge < 14 || calculatedAge > 25) {
          showToast("Platform registration is limited to ages 14 to 25.");
          setAge(null); 
          return { ...nextData, dob: '' }; 
        }

        setAge(calculatedAge);
      }
      
      return nextData;
    });
  };

  const handleAuthRedirect = useCallback(async (user) => {
    try {
      const { data: freelancerData } = await supabase.from('freelancers').select('phone').eq('id', user.id).maybeSingle();
      const { data: clientData } = await supabase.from('clients').select('phone').eq('id', user.id).maybeSingle();

      if (freelancerData?.phone?.length > 5 || clientData?.phone?.length > 5) {
         onLogin(`Welcome back!`);
      } else {
         const pendingProfile = getPendingSignupProfile();

         const pendingMatchesUser = pendingProfile?.email?.toLowerCase?.() === user.email?.toLowerCase?.();

         if (pendingMatchesUser && pendingProfile?.phone && !completingPendingSignupRef.current) {
           completingPendingSignupRef.current = true;
           setLoading(true);

           try {
             const { data, error } = await supabase.functions.invoke('complete-signup', {
               body: buildSignupPayload(pendingProfile),
             });
             if (error || !data?.success) throw new Error(data?.error || AUTH_GENERIC_ERROR);
             removePendingSignupProfile();
             window.location.href = '/termsagreement';
             return;
           } catch (error) {
             const message = error?.message || AUTH_GENERIC_ERROR;
             const needsPhoneVerification = /phone verification/i.test(message);
             showToast(needsPhoneVerification ? "Phone verification expired. Please verify your mobile number again." : message);
             if (needsPhoneVerification) {
               setSocialUser(user);
               setFormData(prev => ({
                 ...prev,
                 ...pendingProfile,
                 email: user.email || pendingProfile.email || '',
               }));
               setIsPhoneVerified(false);
               if (pendingProfile?.dob) {
                 const birthDate = new Date(pendingProfile.dob);
                 const today = new Date();
                 let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                 const monthDifference = today.getMonth() - birthDate.getMonth();
                 if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
                 setAge(calculatedAge);
               }
               setViewMode('signup');
               setStep(3);
               return;
             }
           } finally {
             setLoading(false);
             completingPendingSignupRef.current = false;
           }
         }

         setSocialUser(user);
         setFormData(prev => ({ 
           ...prev, 
           ...(pendingMatchesUser ? pendingProfile : {}),
           email: user.email || pendingProfile?.email || '', 
           name: pendingProfile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '', 
           role: pendingProfile?.role || 'freelancer' 
         }));
         if (pendingMatchesUser && pendingProfile?.phone) {
           setIsPhoneVerified(await checkPhoneVerification(pendingProfile.phone));
         }
         if (pendingMatchesUser && pendingProfile?.dob) {
           const birthDate = new Date(pendingProfile.dob);
           const today = new Date();
           let calculatedAge = today.getFullYear() - birthDate.getFullYear();
           const monthDifference = today.getMonth() - birthDate.getMonth();
           if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
           setAge(calculatedAge);
         }
         setViewMode('signup');
         setStep(pendingMatchesUser ? 4 : 1); 
      }
    } catch {
      showToast("Session redirection fault encountered.");
    }
  }, [checkPhoneVerification, onLogin, showToast]);

  // ─── AUTH INTERLOCK EVENTS ──────────────────────────────────────────────────
  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) handleAuthRedirect(session.user);
    };
    checkActiveSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && viewMode !== 'update_password') {
        handleAuthRedirect(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [handleAuthRedirect, viewMode]);

  // Clear toast memory cleanly
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleNext = async () => {
    if (step === 1) return socialUser ? setStep(3) : setStep(2);
    if (step === 2) {
        if (!isValidEmail(formData.email) || !formData.password) return showToast("Enter a valid email and password.");
        if (!getPasswordSecurityStatus(formData.password).isStrong) return showToast(PASSWORD_SECURITY_ERROR);
        return setStep(3);
    }
    if (step === 3) {
        if (!isPhoneVerified) return showToast("Verify mobile number via OTP to continue.");
        try {
            const { e164Phone } = getPhoneIdentifiers();
            setFormData(prev => ({ ...prev, phone: e164Phone }));
            setStep(4);
        } catch (error) {
            showToast(error.message || "Enter a valid mobile number.");
        }
    }
  };

  const handleFinalSubmit = async () => {
    if (viewMode === 'login') {
      if (!isValidEmail(formData.email) || !formData.password) return showToast(LOGIN_ERROR);
    }

    if (viewMode !== 'login') {
      if (!agreedToTerms) return showToast("You must review and accept the Terms & Privacy configuration.");
      try {
        validateSignupPayload();
      } catch (error) {
        return showToast(error.message || AUTH_GENERIC_ERROR);
      }
    }
    
    setLoading(true);
    try {
      if (viewMode === 'login') {
        setRememberedSessionPreference(rememberMe);
        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email.trim().toLowerCase(), password: formData.password, options: { captchaToken } 
        });
        if (error) throw new Error(LOGIN_ERROR);
      } else {
        await completeSignup();
      }
      turnstileRef.current?.reset?.();
      setCaptchaToken(null);
    } catch (err) {
      showToast(err.message || AUTH_GENERIC_ERROR);
      turnstileRef.current?.reset?.();
      setCaptchaToken(null); 
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async () => {
    const deviceMeta = getDeviceFingerprint(); 
    let currentUid = socialUser?.id;
    const signupPayload = getSignupPayload();

    if (!currentUid) {
        if (!getPasswordSecurityStatus(formData.password).isStrong) throw new Error(PASSWORD_SECURITY_ERROR);
        if (!isValidEmail(formData.email)) throw new Error("Enter a valid email address.");

        const { data, error } = await supabase.auth.signUp({
            email: formData.email, password: formData.password,
            options: { 
                data: { full_name: formData.name, role: formData.role, device_fingerprint: deviceMeta },
                captchaToken, emailRedirectTo: window.location.origin
            } 
        });
        if (error) throw new Error(AUTH_GENERIC_ERROR);

        if (data?.session) {
          await completeSignupProfile();
          window.location.href = '/termsagreement';
          return;
        }

        if (typeof window !== 'undefined') {
          setPendingSignupProfile(signupPayload);
        }
        setVerificationSent(true);
    } else {
        await completeSignupProfile();
        if (typeof window !== 'undefined') {
          removePendingSignupProfile();
        }


        window.location.href = '/termsagreement';
    }
  };

  // ─── THIRD-PARTY SMS AUTH DISPATCHERS ───────────────────────────────────────
  const handleSendPhoneOtp = async () => {
    if (CLOUDFLARE_SITE_KEY && !captchaToken) return showToast("Please complete the security check.");

    setOtpLoading(true);
    setOtpAction('send');
    try {
        const { msg91Identifier, e164Phone } = getPhoneIdentifiers();
        const { data, error } = await supabase.functions.invoke('send-phone-otp', {
          body: { phone: e164Phone, identifier: msg91Identifier, captchaToken },
        });
        if (error || !data?.success) throw new Error(data?.error || "Failed to send OTP.");

        setPhoneOtpSent(true);
        setPhoneOtpReqId(data.reqId || '');
        setPhoneOtp('');
        setIsPhoneVerified(false);
        setFormData(prev => ({ ...prev, phone: e164Phone }));
        showToast("OTP sent to your mobile number.", "success");
        turnstileRef.current?.reset?.();
        setCaptchaToken(null);
    } catch (err) {
        showToast(err.message || "We couldn't send the OTP. Please try again.");
    } finally {
        setOtpLoading(false);
        setOtpAction(null);
    }
  };

  const handleRetryPhoneOtp = async () => {
    if (!phoneOtpSent) return handleSendPhoneOtp();

    setOtpLoading(true);
    setOtpAction('retry');
    try {
      const { e164Phone } = getPhoneIdentifiers();
      const { data, error } = await supabase.functions.invoke('retry-phone-otp', {
        body: { phone: e164Phone, reqId: phoneOtpReqId, channel: null },
      });
      if (error || !data?.success) throw new Error(data?.error || "Failed to resend OTP.");
      if (data.reqId) setPhoneOtpReqId(data.reqId);
      showToast("OTP resent successfully.", "success");
    } catch (err) {
      showToast(err.message || "We couldn't resend the OTP. Please try again.");
    } finally {
      setOtpLoading(false);
      setOtpAction(null);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtpSent) return showToast("Send OTP first.");
    if (!phoneOtp || phoneOtp.trim().length < 4) return showToast("Enter the OTP sent to your mobile.");

    setOtpLoading(true);
    setOtpAction('verify');
    try {
      const { e164Phone } = getPhoneIdentifiers();
      const { data, error } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone: e164Phone, otp: phoneOtp.trim(), reqId: phoneOtpReqId },
      });
      if (error || !data?.success) throw new Error(data?.error || "Phone verification failed.");

      setFormData(prev => ({ ...prev, phone: e164Phone }));
      setIsPhoneVerified(true);
      setPhoneOtp('');
      showToast("Phone verified successfully.", "success");
    } catch (err) {
        showToast(err.message || "Phone verification failed.");
    } finally {
        setOtpLoading(false);
        setOtpAction(null);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if(!isValidEmail(formData.email)) return showToast("Enter a valid email address.");
    if (CLOUDFLARE_SITE_KEY && !captchaToken) return showToast("Please complete the security check.");

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('request-reset', {
        body: { action: 'send', email: formData.email.trim() }
      });
      if (error) throw error;
        
      setShowResetVerify(true);
      showToast(RESET_SENT_MESSAGE, "success");
      turnstileRef.current?.reset?.();
      setCaptchaToken(null);
    } catch {
      showToast(RESET_SENT_MESSAGE, "success");
      setShowResetVerify(true);
      turnstileRef.current?.reset?.();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    if (!resetOtp) return showToast("Please enter the recovery code.");
    
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { action: 'verify', email: formData.email.trim(), otp: resetOtp.trim() }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Invalid or Expired Recovery Token");

        showToast("Code verified.", "success");
        setShowResetVerify(false);
        setViewMode('update_password'); 
    } catch {
        showToast("Invalid or expired recovery code.");
    } finally {
        setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!getPasswordSecurityStatus(newPassword).isStrong) return showToast(PASSWORD_SECURITY_ERROR);

    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke('request-reset', {
            body: { action: 'reset_password', email: formData.email.trim(), otp: resetOtp.trim(), new_password: newPassword }
        });

        if (error || !data || !data.success) throw new Error(data?.error || "Failed to rewrite authentication credentials.");

        showToast("Password updated. Please log in with your new password.", "success");
        setResetOtp('');
        setNewPassword('');
        setViewMode('login');
    } catch {
       showToast(AUTH_GENERIC_ERROR);
    } finally {
       setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    const credential = response?.credential;
    if (!credential) {
      showToast("Google did not return a valid sign-in token.");
      return;
    }

    setGoogleLoading(true);
    try {
      setRememberedSessionPreference(rememberMe);

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
      });

      if (error) {
        console.error("Google login error:", error.message);
        throw new Error("Google sign-in failed. Please try again.");
      }

      const [
        { data: { session }, error: sessionError },
        { data: { user }, error: userError },
      ] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      if (sessionError) throw sessionError;
      if (userError) throw userError;
      if (!session?.user && !user) throw new Error("Google sign-in did not create a session.");

      if (session && onSessionReady) {
        await onSessionReady(session);
      } else {
        await handleAuthRedirect(session?.user || user);
      }
    } catch (error) {
      console.error("Google login error:", error);
      showToast(error?.message || AUTH_GENERIC_ERROR);
    } finally {
      setGoogleLoading(false);
    }
  }, [handleAuthRedirect, onSessionReady, rememberMe, showToast]);

  const handleGithubLogin = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      showToast(AUTH_GENERIC_ERROR);
      setLoading(false);
    }
  }, [showToast]);

  return {
    state: {
      viewMode, step, loading, toast, verificationSent,
      googleLoading,
      showResetVerify, resetOtp, newPassword, agreedToTerms,
      captchaToken, rememberMe, socialUser, isPhoneVerified,
      phoneOtpSent, phoneOtp, phoneOtpReqId,
      otpLoading, otpAction, formData, age, CLOUDFLARE_SITE_KEY
    },
    refs: { turnstileRef },
    actions: {
      setViewMode, setStep, setResetOtp, setShowResetVerify, setNewPassword, setAgreedToTerms,
      setCaptchaToken, setRememberMe, setPhoneOtp, updateField, showToast, setIsPhoneVerified, setVerificationSent,
      handleNext, handleBack: () => setStep(s => s - 1), 
      handleFinalSubmit, handleSendPhoneOtp, handleRetryPhoneOtp, handleVerifyPhoneOtp, 
      handleForgotPassword, handleVerifyResetOTP, handleUpdatePassword,
      handleGoogleCredentialResponse, handleGithubLogin,
    }
  };
};
