import React, { useState, useEffect } from 'react';
import { 
  X, UploadCloud, ShieldAlert, Mail, ArrowRight, ArrowLeft, 
  User, Briefcase, Check, ChevronRight, Loader2, Lock, Smartphone, Globe
} from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '../supabase';
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
const EMAIL_CONFIG = {
  SERVICE_ID: "service_mf8vcvm",
  TEMPLATE_ID: "template_nr1rd2n",
  PUBLIC_KEY: "ZOft8l1SLf-HFiV"
};

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  // --- STATE MANAGEMENT ---
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  
  // OTP Logic
  const [showVerify, setShowVerify] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);

  // Unified Form Data State
  const [formData, setFormData] = useState({
    role: 'freelancer', // freelancer | client
    email: '',
    password: '',
    name: '',
    phone: '',
    nationality: '',
    dob: '',
    gender: 'Male',
    upi: '',
    org: 'No',
    parentEmail: ''
  });

  // Computed Values
  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);

  // --- EFFECTS ---
  
  // Calculate Age whenever DOB changes
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

  // --- HELPERS ---

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Basic Validation per step can go here
    if (step === 2 && (!formData.email || !formData.password)) return alert("Please fill in credentials");
    if (step === 3 && (!formData.name || !formData.phone)) return alert("Please fill in personal details");
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  // --- SUBMISSION LOGIC ---

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onLogin('Welcome back!');
      } else {
        // --- SIGNUP LOGIC ---
        
        // Age Gate
        if (formData.role === 'freelancer' && age < 13) {
           throw new Error("You must be at least 13 years old to join.");
        }

        // Minor Verification Check
        if (formData.role === 'freelancer' && isMinor) {
           if (!formData.parentEmail) throw new Error("Parent email is required for minors.");
           
           // Generate OTP
           const code = Math.floor(100000 + Math.random() * 900000).toString();
           setGeneratedOtp(code);
           
           // Send Email
           await emailjs.send(
             EMAIL_CONFIG.SERVICE_ID, 
             EMAIL_CONFIG.TEMPLATE_ID, 
             {
               email: formData.parentEmail,
               child_name: formData.name,
               otp: code,
               message: "Please verify your child's Teenverse account."
             }, 
             EMAIL_CONFIG.PUBLIC_KEY
           );

           setShowVerify(true);
           setLoading(false);
           return; 
        }

        await completeSignup();
      }
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      setLoading(true);
      try {
        await completeSignup();
      } catch (err) {
        alert(err.message);
        setLoading(false);
      }
    } else {
      alert("Invalid Code");
    }
  };

  const completeSignup = async () => {
    // 1. Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

    // 2. Upload ID (If exists)
    let fileUrl = "";
    if (file) {
      const fileName = `id_${cred.user.uid}_${Date.now()}`;
      await supabase.storage.from('id_proofs').upload(fileName, file);
      const res = supabase.storage.from('id_proofs').getPublicUrl(fileName);
      fileUrl = res.data.publicUrl;
    }

    // 3. Supabase Insert
    const table = formData.role === 'client' ? 'clients' : 'freelancers';
    
    const dbData = formData.role === 'client' 
       ? { 
           id: cred.user.uid, 
           name: formData.name, 
           email: formData.email, 
           phone: formData.phone, 
           nationality: formData.nationality, 
           id_proof_url: fileUrl, 
           is_organisation: formData.org 
         }
       : { 
           id: cred.user.uid, 
           name: formData.name, 
           email: formData.email, 
           phone: formData.phone, 
           nationality: formData.nationality, 
           id_proof_url: fileUrl, 
           dob: formData.dob, 
           age: age, 
           gender: formData.gender, 
           upi: formData.upi,
           parent_email: isMinor ? formData.parentEmail : null,
           is_parent_verified: isMinor,
           unlocked_skills: [] 
         };

    const { error } = await supabase.from(table).insert([dbData]);
    if (error) throw error;

    onSignUpSuccess();
  };

  // --- UI COMPONENTS ---

  const StepIndicator = () => (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-4 font-sans text-gray-100">
      
      <div className="w-full max-w-5xl h-[85vh] bg-[#161b2c] rounded-3xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* CLOSE BUTTON */}
        <button onClick={() => setView('home')} className="absolute top-6 right-6 z-20 text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>

        {/* LEFT PANEL: VISUALS (Desktop Only) */}
        <div className="hidden md:flex w-2/5 relative bg-indigo-900 overflow-hidden flex-col justify-between p-12">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f111a]"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2">Teenverse.</h1>
            <p className="text-indigo-200">Where ambition meets opportunity.</p>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-sm text-gray-200 italic">"I made my first ₹5k designing logos here. The safety features for teens are amazing."</p>
                <div className="mt-3 flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-indigo-500"></div>
                   <span className="text-xs font-bold">Rohan, 17</span>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT PANEL: INTERACTIVE FORM */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col justify-center">
          
          {/* LOGIN VIEW */}
          {isLogin ? (
            <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
               <p className="text-gray-400 mb-8">Enter your credentials to access your workspace.</p>
               
               <div className="space-y-4">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-1 flex items-center px-4 focus-within:border-indigo-500 transition-colors">
                    <Mail size={18} className="text-gray-500 mr-3"/>
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      className="bg-transparent border-none outline-none w-full py-3 text-white placeholder-gray-500"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-1 flex items-center px-4 focus-within:border-indigo-500 transition-colors">
                    <Lock size={18} className="text-gray-500 mr-3"/>
                    <input 
                      type="password" 
                      placeholder="Password"
                      className="bg-transparent border-none outline-none w-full py-3 text-white placeholder-gray-500"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                    />
                  </div>
               </div>

               <button 
                  onClick={handleFinalSubmit} 
                  disabled={loading}
                  className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex justify-center items-center gap-2"
               >
                  {loading ? <Loader2 className="animate-spin"/> : 'Log In'}
               </button>

               <p className="mt-6 text-center text-gray-500 text-sm">
                 New here? <button onClick={() => setIsLogin(false)} className="text-indigo-400 hover:underline">Create an account</button>
               </p>
            </div>
          ) : (
            
            // SIGNUP MULTI-STEP VIEW
            <div className="max-w-md mx-auto w-full">
               
               {/* OTP OVERLAY */}
               {showVerify ? (
                  <div className="text-center animate-in zoom-in duration-300">
                     <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                        <ShieldAlert size={32} />
                     </div>
                     <h2 className="text-2xl font-bold mb-2">Parent Verification</h2>
                     <p className="text-gray-400 mb-6 text-sm">We sent a 6-digit code to <span className="text-white">{formData.parentEmail}</span></p>
                     
                     <input 
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl py-4 text-center text-2xl tracking-widest font-mono mb-4 focus:border-orange-500 outline-none transition-colors"
                        placeholder="000 000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                     />
                     <button onClick={handleVerifyOTP} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl">
                        {loading ? 'Verifying...' : 'Complete Registration'}
                     </button>
                     <button onClick={() => setShowVerify(false)} className="mt-4 text-gray-500 text-sm">Cancel</button>
                  </div>
               ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      {step > 1 ? (
                        <button onClick={handleBack} className="text-gray-400 hover:text-white"><ArrowLeft size={20}/></button>
                      ) : <div></div>}
                      <StepIndicator />
                    </div>

                    {/* STEP 1: ROLE SELECTION */}
                    {step === 1 && (
                      <div className="animate-in slide-in-from-right-8 duration-500">
                        <h2 className="text-3xl font-bold mb-2">Who are you?</h2>
                        <p className="text-gray-400 mb-8">Choose how you want to use Teenverse.</p>
                        
                        <div className="grid gap-4">
                          <button 
                            onClick={() => updateField('role', 'freelancer')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.role === 'freelancer' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                          >
                             <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-lg ${formData.role === 'freelancer' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'}`}><User size={24}/></div>
                                {formData.role === 'freelancer' && <Check className="text-indigo-400"/>}
                             </div>
                             <h3 className="text-xl font-bold">Freelancer</h3>
                             <p className="text-sm text-gray-400 mt-1">I am a teen (13-19) looking for work.</p>
                          </button>

                          <button 
                            onClick={() => updateField('role', 'client')}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${formData.role === 'client' ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                          >
                             <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-lg ${formData.role === 'client' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400'}`}><Briefcase size={24}/></div>
                                {formData.role === 'client' && <Check className="text-indigo-400"/>}
                             </div>
                             <h3 className="text-xl font-bold">Client</h3>
                             <p className="text-sm text-gray-400 mt-1">I want to hire talent.</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: CREDENTIALS */}
                    {step === 2 && (
                       <div className="animate-in slide-in-from-right-8 duration-500">
                         <h2 className="text-3xl font-bold mb-2">Account Basics</h2>
                         <p className="text-gray-400 mb-8">Let's secure your account.</p>
                         <div className="space-y-4">
                            <div>
                               <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Email</label>
                               <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="name@example.com"/>
                            </div>
                            <div>
                               <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Password</label>
                               <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="••••••••"/>
                            </div>
                         </div>
                       </div>
                    )}

                    {/* STEP 3: PROFILE INFO */}
                    {step === 3 && (
                       <div className="animate-in slide-in-from-right-8 duration-500">
                         <h2 className="text-3xl font-bold mb-2">About You</h2>
                         <p className="text-gray-400 mb-8">How should we address you?</p>
                         <div className="space-y-4">
                            <div>
                               <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Full Name</label>
                               <input value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-colors"/>
                            </div>
                            <div className="flex gap-4">
                               <div className="flex-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Phone</label>
                                  <input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-colors"/>
                               </div>
                               <div className="flex-1">
                                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Country</label>
                                  <input value={formData.nationality} onChange={(e) => updateField('nationality', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none transition-colors"/>
                               </div>
                            </div>
                         </div>
                       </div>
                    )}

                    {/* STEP 4: DETAILS & VERIFICATION (Dynamic based on Role) */}
                    {step === 4 && (
                       <div className="animate-in slide-in-from-right-8 duration-500">
                         <h2 className="text-3xl font-bold mb-2">Final Details</h2>
                         <p className="text-gray-400 mb-6">Almost there!</p>
                         
                         <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {formData.role === 'freelancer' ? (
                               <>
                                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Date of Birth</label>
                                     <input type="date" value={formData.dob} onChange={(e) => updateField('dob', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"/>
                                     {age !== null && (
                                        <div className={`text-xs mt-2 font-medium ${isMinor ? 'text-orange-400' : 'text-green-400'}`}>
                                           Age: {age} {isMinor && "(Parent Verification Required)"}
                                        </div>
                                     )}
                                  </div>

                                  {isMinor && (
                                     <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                                        <div className="flex gap-2 items-center mb-2 text-orange-400">
                                           <ShieldAlert size={16}/>
                                           <span className="text-xs font-bold uppercase">Minor Account Protection</span>
                                        </div>
                                        <input type="email" placeholder="Parent's Email Address" value={formData.parentEmail} onChange={(e) => updateField('parentEmail', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"/>
                                     </div>
                                  )}

                                  <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Upload ID (Verified later)</label>
                                     <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer hover:bg-gray-800/50 hover:border-indigo-500 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                           <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                                           <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{file ? file.name : "Click to upload ID"}</span></p>
                                        </div>
                                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                                     </label>
                                  </div>
                               </>
                            ) : (
                               // Client Fields
                               <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Organization Name</label>
                                  <input placeholder="Company Name (Optional)" onChange={(e) => updateField('org', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none"/>
                               </div>
                            )}
                         </div>
                       </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                       {step < 4 ? (
                          <button onClick={handleNext} className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                             Next <ChevronRight size={18}/>
                          </button>
                       ) : (
                          <button onClick={handleFinalSubmit} disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/50">
                             {loading ? <Loader2 className="animate-spin"/> : 'Create Account'}
                          </button>
                       )}
                    </div>
                    
                    <div className="mt-6 text-center">
                       <button onClick={() => setIsLogin(true)} className="text-gray-500 text-sm hover:text-white transition-colors">Already have an account? Log In</button>
                    </div>

                  </>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
