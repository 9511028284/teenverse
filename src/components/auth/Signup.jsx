import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, User, Briefcase, Check, ChevronRight, Loader2, 
  ShieldAlert, MailCheck, UploadCloud
} from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { supabase } from '../../supabase';
import emailjs from '@emailjs/browser';

// --- CONFIG ---
const EMAIL_CONFIG = {
  SERVICE_ID: "service_yhvj30u",
  TEMPLATE_ID: "template_nr1rd2n",
  PUBLIC_KEY: "_ZOft8l1SLf_-HFiV"
};

const Signup = ({ prefillUser, onSignupSuccess, onSwitchToLogin, setView }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Parent Verification State
  const [showParentVerify, setShowParentVerify] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    role: 'freelancer', 
    email: prefillUser?.email || '',
    password: '',
    name: prefillUser?.displayName || '',
    phone: '',
    nationality: 'India',
    dob: '',
    gender: 'Male',
    upi: '',
    org: '',
    parentEmail: ''
  });

  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  useEffect(() => {
    if (prefillUser) {
      setStep(1); // Start at role selection
    }
  }, [prefillUser]);

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

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleNext = async () => {
    if (step === 1) {
       // Skip password step for social users
       if (prefillUser) setStep(3); else setStep(2);
       return;
    }
    if (step === 2) {
       if (!formData.email || !formData.password) return alert("Fill in credentials");
       setStep(3);
       return;
    }
    if (step === 3) {
       if (!formData.name || !formData.phone) return alert("Fill in personal details");
       // Basic validation...
       setStep(4);
    }
  };

  const handleFinalSubmit = async () => {
    if (!agreedToTerms) return alert("Please agree to terms.");
    
    setLoading(true);
    try {
      if (formData.role === 'freelancer' && age < 13) throw new Error("Must be 13+");

      // Parent Email Verification
      if (formData.role === 'freelancer' && isMinor && !showParentVerify) {
          if (!formData.parentEmail) throw new Error("Parent email required");
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOtp(code);
          await emailjs.send(EMAIL_CONFIG.SERVICE_ID, EMAIL_CONFIG.TEMPLATE_ID, {
              email: formData.parentEmail,
              child_name: formData.name,
              otp: code
          }, EMAIL_CONFIG.PUBLIC_KEY);
          setShowParentVerify(true);
          setLoading(false);
          return;
      }
      
      await createAccount();

    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const verifyParentOtp = async () => {
     if (otp === generatedOtp) {
        await createAccount();
     } else {
        alert("Invalid Code");
     }
  };

  const createAccount = async () => {
    setLoading(true);
    try {
      let uid = "";
      
      if (prefillUser) {
        uid = prefillUser.uid;
      } else {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        uid = cred.user.uid;
        await sendEmailVerification(cred.user);
      }

      // Upload ID (Optional)
      let fileUrl = "";
      if (file) {
        const fileName = `id_${uid}_${Date.now()}`;
        await supabase.storage.from('id_proofs').upload(fileName, file);
        const { data } = supabase.storage.from('id_proofs').getPublicUrl(fileName);
        fileUrl = data.publicUrl;
      }

      const table = formData.role === 'client' ? 'clients' : 'freelancers';
      const dbData = formData.role === 'client' 
         ? { id: uid, name: formData.name, email: formData.email, phone: formData.phone, nationality: formData.nationality, id_proof_url: fileUrl, is_organisation: formData.org, is_kyc_verified: false }
         : { id: uid, name: formData.name, email: formData.email, phone: formData.phone, nationality: formData.nationality, id_proof_url: fileUrl, dob: formData.dob, age: age, gender: formData.gender, upi: formData.upi, parent_email: isMinor ? formData.parentEmail : null, is_parent_verified: isMinor, unlocked_skills: [], is_kyc_verified: false };
      
      const { error } = await supabase.from(table).insert([dbData]);
      if (error) throw error;

      if (!prefillUser) {
        // Email user needs to verify email first
        await signOut(auth);
        alert("Verification email sent! Please verify before logging in.");
        onSwitchToLogin();
      } else {
        // Social user -> Go to KYC
        onSignupSuccess(uid, formData.role);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const StepIndicator = () => (
    <div className="flex gap-2 mb-8 justify-center">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-indigo-500' : 'w-2 bg-gray-700'}`} />
      ))}
    </div>
  );

  if (showParentVerify) {
     return (
        <div className="text-center animate-in zoom-in duration-300">
           <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 border border-orange-500/30">
              <ShieldAlert size={40} />
           </div>
           <h2 className="text-2xl font-bold mb-2">Parent Verification</h2>
           <p className="text-gray-400 mb-8 text-sm">Code sent to <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{formData.parentEmail}</span></p>
           <input className="w-full bg-black/40 border border-gray-700 rounded-xl py-5 text-center text-3xl tracking-[1em] font-mono text-white mb-6" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
           <button onClick={verifyParentOtp} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all">{loading ? 'Verifying...' : 'Complete Registration'}</button>
           <button onClick={() => setShowParentVerify(false)} className="mt-6 text-gray-500 text-sm hover:text-white">Cancel</button>
        </div>
     );
  }

  return (
    <div className="max-w-md mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
           {step > 1 && <button onClick={() => setStep(s => s-1)} className="text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>}
           <StepIndicator />
           <div className="w-5"></div>
        </div>

        {/* --- STEP 1: ROLE --- */}
        {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-500">
                <h2 className="text-3xl font-bold mb-6">Who are you?</h2>
                <div className="grid gap-4">
                    {['freelancer', 'client'].map((r) => (
                        <button key={r} onClick={() => updateField('role', r)} className={`p-6 rounded-2xl border transition-all text-left ${formData.role === r ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-white/5'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-xl ${formData.role === r ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{r === 'freelancer' ? <User size={24}/> : <Briefcase size={24}/>}</div>
                                {formData.role === r && <div className="bg-indigo-500 text-white p-1 rounded-full"><Check size={14}/></div>}
                            </div>
                            <h3 className="text-xl font-bold capitalize">{r}</h3>
                            <p className="text-sm text-gray-400 mt-1">{r === 'freelancer' ? 'I am a teen looking for work.' : 'I want to hire talent.'}</p>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* --- STEP 2: CREDENTIALS (Skipped if Social) --- */}
        {step === 2 && (
           <div className="animate-in slide-in-from-right-8 duration-500 space-y-5">
              <h2 className="text-3xl font-bold mb-6">Credentials</h2>
              <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white" placeholder="Email"/>
              <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white" placeholder="Password"/>
           </div>
        )}

        {/* --- STEP 3: PERSONAL --- */}
        {step === 3 && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-5">
                <h2 className="text-3xl font-bold mb-6">Details</h2>
                <input value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white" placeholder="Full Name"/>
                <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white" placeholder="Phone Number"/>
            </div>
        )}

        {/* --- STEP 4: FINAL --- */}
        {step === 4 && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-4">
                <h2 className="text-3xl font-bold mb-2">Final Step</h2>
                {formData.role === 'freelancer' ? (
                    <>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                        <input type="date" value={formData.dob} onChange={(e) => updateField('dob', e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white"/>
                        {age !== null && <div className={`text-xs font-bold px-2 py-1 inline-block rounded ${isMinor ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>Age: {age}</div>}
                        
                        {isMinor && <input type="email" placeholder="Parent's Email" value={formData.parentEmail} onChange={(e) => updateField('parentEmail', e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white"/>}
                    </>
                ) : (
                    <input placeholder="Organization Name" onChange={(e) => updateField('org', e.target.value)} className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 text-white"/>
                )}

                <div className="flex items-start gap-3 mt-4 p-3 bg-white/5 rounded-xl">
                   <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-4 h-4"/>
                   <label className="text-xs text-gray-400">I agree to the Terms of Service and Privacy Policy.</label>
                </div>
            </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            {step < 4 ? (
                <button onClick={handleNext} className="bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2">Next <ChevronRight size={18}/></button>
            ) : (
                <button onClick={handleFinalSubmit} disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/50">{loading ? <Loader2 className="animate-spin"/> : 'Create Account'}</button>
            )}
        </div>

        {!prefillUser && step === 1 && (
            <div className="mt-8 text-center">
                <button onClick={onSwitchToLogin} className="text-gray-500 text-sm hover:text-white">Already have an account? Log In</button>
            </div>
        )}
    </div>
  );
};

export default Signup;