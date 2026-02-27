import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; // Ensure this path matches your project
import { openMsg91Widget } from '../utils/phoneAuth'; // Updated to use the Widget

const CLOUDFLARE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_SITE_KEY;
// Added ENV variables for the MSG91 Widget
const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID;
const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH; 

export const useAuthLogic = (onLogin, onSignUpSuccess) => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('login');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
   
  // Verification
  const [verificationSent, setVerificationSent] = useState(false); 
   
  // Password Reset
  const [showResetVerify, setShowResetVerify] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Agreements & Security
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef();

  // Social & Phone
  const [socialUser, setSocialUser] = useState(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [formData, setFormData] = useState({
    role: 'freelancer', email: '', password: '', name: '', phone: '', 
    nationality: '', dob: '', gender: 'Male', org: '', 
    referralCode: ''
  });
  
  // Age Logic State
  const [age, setAge] = useState(null);

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

  // --- CORE UPDATE LOGIC ---
  const updateField = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Calculate Age Instantly (No useEffect lag)
      if (field === 'dob') {
        if (!value) {
            setAge(null);
            return newData;
        }

        const birthDate = new Date(value);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }

        // STRICT PLATFORM LIMIT: 14 to 19 ONLY
        if (calculatedAge < 14 || calculatedAge > 19) {
          showToast("Platform is exclusive to ages 14 to 19 only.");
          setAge(null);
          return { ...newData, dob: '' }; // Clear the invalid date
        }

        setAge(calculatedAge);
      }
      
      return newData;
    });
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

  // --- HANDLERS ---
  const handleAuthRedirect = async (user) => {
    // 500ms delay prevents Database Trigger race conditions during social logins
    setTimeout(async () => {
        const { data: freelancerData } = await supabase.from('freelancers').select('phone').eq('id', user.id).maybeSingle();
        const { data: clientData } = await supabase.from('clients').select('phone').eq('id', user.id).maybeSingle();

        // Check if they ACTUALLY have a completed profile (Phone is our anchor)
        if ((freelancerData?.phone && freelancerData.phone.length > 5) || (clientData?.phone && clientData.phone.length > 5)) {
           onLogin(`Welcome back!`);
        } else {
           // They don't have a profile yet! Force them to Step 1 to collect details.
           setSocialUser(user);
           setFormData(prev => ({ 
             ...prev, 
             email: user.email, 
             name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0], 
             role: 'freelancer' // Default to freelancer for the UI starting point
           }));
           setViewMode('signup');
           setStep(1); 
        }
    }, 500);
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
        const profileData = { 
            name: formData.name, email: formData.email, phone: formData.phone, 
            phone_verified: true, nationality: formData.nationality, referral_code: myRefCode,
            ...(formData.role === 'client' ? { is_organisation: formData.org } : { dob: formData.dob, age, gender: formData.gender })
        };

        if (!uid) {
            // NEW EMAIL SIGNUP: Wait for email verification. 
            // We pass ALL form data into user_metadata so the DB trigger can grab it.
            const { error } = await supabase.auth.signUp({
                email: formData.email, password: formData.password,
                options: { 
                    data: { full_name: formData.name, role: formData.role, device_fingerprint: deviceMeta, ...profileData },
                    captchaToken, emailRedirectTo: window.location.origin
                } 
            });
            if (error) throw error;
            
            // Show "Email Sent" screen. The database trigger will handle the inserts securely!
            setVerificationSent(true);

        } else {
            // SOCIAL SIGNUP: User is already authenticated! We CAN use .upsert() here safely.
            const table = formData.role === 'client' ? 'clients' : 'freelancers';
            
            await supabase.from('users').upsert({ id: uid, email: formData.email, full_name: formData.name });
            const { error: dbError } = await supabase.from(table).upsert({ id: uid, ...profileData });
            if (dbError) throw dbError;

            // Instantly redirect them
            window.location.href = '/termsagreement';
        }

    } catch (error) {
        throw error; 
    }
  };

  // --- NEW WIDGET HANDLER ---
  const handlePhoneVerification = async () => {
    if (formData.phone.length < 10) return showToast("Enter valid mobile number");
    if (!MSG91_WIDGET_ID) return showToast("Widget ID is missing from environment variables.");

    setOtpLoading(true);
    try {
        // Standardize to +91 if prefix is missing
        const formattedPhone = formData.phone.startsWith('+') 
          ? formData.phone 
          : `+91${formData.phone.replace(/^0+/, '')}`;

        // This single call opens the widget, waits for the user to enter the OTP, and resolves on success
        await openMsg91Widget(formattedPhone, MSG91_WIDGET_ID, MSG91_TOKEN_AUTH);

        setIsPhoneVerified(true);
        updateField('phone', formattedPhone);
        showToast("Phone Verified Successfully!", "success");
    } catch (err) {
        // Triggers if the user closes the modal or validation fails
        showToast(err.message || "Phone verification failed.");
    } finally {
        setOtpLoading(false);
    }
  };

  // --- PASSWORD RESET HANDLERS ---
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
    if (!resetOtp) return showToast("Please enter the OTP.");
    
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
    if (!newPassword || newPassword.length < 6) return showToast("Password must be at least 6 chars.");

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
      viewMode, step, loading, toast, verificationSent,
      showResetVerify, resetOtp, newPassword, agreedToTerms,
      captchaToken, socialUser, isPhoneVerified,
      otpLoading, formData, age, CLOUDFLARE_SITE_KEY
    },
    refs: { turnstileRef },
    actions: {
      setViewMode, setStep, setResetOtp, setNewPassword, setAgreedToTerms,
      setCaptchaToken, updateField, showToast, setIsPhoneVerified, setVerificationSent,
      handleNext, handleBack: () => setStep(s => s - 1), 
      handleFinalSubmit, handlePhoneVerification, 
       
      // Forgot Password Actions
      handleForgotPassword,
      handleVerifyResetOTP,
      handleUpdatePassword,

      handleSocialLogin: async (provider) => {
          setLoading(true);
          const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
          if(error) { showToast(error.message); setLoading(false); }
      }
    }
  };
};