import React, { useState, useEffect } from 'react';
import { X, UploadCloud, ShieldAlert, Mail } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '../supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import emailjs from '@emailjs/browser';

const Auth = ({ setView, onLogin, onSignUpSuccess }) => {
  // --- EXISTING STATE ---
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('freelancer');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  // --- NEW AGE & VERIFICATION STATE ---
  const [dob, setDob] = useState('');
  const [age, setAge] = useState(null);
  const [isMinor, setIsMinor] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  
  // OTP State
  const [showVerify, setShowVerify] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [pendingData, setPendingData] = useState(null); // To store form data while verifying

  // --- EMAILJS CONFIG (Replace with your keys) ---
  const EMAIL_CONFIG = {
    SERVICE_ID: "service_mf8vcvm",
    TEMPLATE_ID: "template_nr1rd2n",
    PUBLIC_KEY: "_ZOft8l1SLf_-HFiV"
  };

  // Calculate Age on DOB Change
  useEffect(() => {
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      setIsMinor(calculatedAge < 18);
    }
  }, [dob]);

  // --- THE CORE SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // We convert FormData to a plain object to manipulate it easily
    const formData = new FormData(e.target);
    const dataObj = Object.fromEntries(formData.entries());

    try {
      if (isLogin) {
        // --- LOGIN FLOW (Unchanged) ---
        await signInWithEmailAndPassword(auth, dataObj.email, dataObj.password);
        onLogin('Welcome back!');
      } else {
        // --- SIGNUP FLOW ---
        
        // 1. CHECK IF MINOR (Freelancers only)
        if (role === 'freelancer' && isMinor) {
           if (!parentEmail) {
             alert("Parent email is required for users under 18.");
             setLoading(false);
             return;
           }

           // Prepare data for later execution
           setPendingData(dataObj);

           // Generate and Send OTP
           const code = Math.floor(100000 + Math.random() * 900000).toString();
           setGeneratedOtp(code);

           const templateParams = {
             email: parentEmail,
             child_name: dataObj.name,
             otp: code,
             message: "Please verify your child's account request."
           };

           await emailjs.send(
             EMAIL_CONFIG.SERVICE_ID, 
             EMAIL_CONFIG.TEMPLATE_ID, 
             templateParams, 
             EMAIL_CONFIG.PUBLIC_KEY
           );

           // Switch UI to OTP mode
           setShowVerify(true);
           setLoading(false);
           return; // STOP HERE until verified
        }

        // 2. IF ADULT OR CLIENT, PROCEED DIRECTLY
        await completeSignup(dataObj);
      }
    } catch (err) { 
      alert(err.message); 
      setLoading(false); 
    }
  };

  // --- OTP VERIFICATION HANDLER ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      setLoading(true);
      try {
        // OTP Correct? Execute the pending signup
        await completeSignup(pendingData);
      } catch (err) {
        alert(err.message);
        setLoading(false);
      }
    } else {
      alert("Invalid Code. Please ask your parent for the code sent to their email.");
    }
  };

  // --- REUSABLE SIGNUP LOGIC (Moved here from handleSubmit) ---
  const completeSignup = async (formDataObj) => {
    // Create Auth User
    const cred = await createUserWithEmailAndPassword(auth, formDataObj.email, formDataObj.password);
    
    let fileUrl = "";
    if (file) {
      const fileName = `id_${cred.user.uid}_${Date.now()}`;
      await supabase.storage.from('id_proofs').upload(fileName, file);
      const res = supabase.storage.from('id_proofs').getPublicUrl(fileName);
      fileUrl = res.data.publicUrl;
    }

    const table = role === 'client' ? 'clients' : 'freelancers';
    
    const data = role === 'client' 
       ? { 
           id: cred.user.uid, 
           name: formDataObj.name, 
           email: formDataObj.email, 
           phone: formDataObj.phone, 
           nationality: formDataObj.nationality, 
           id_proof_url: fileUrl, 
           is_organisation: formDataObj.org 
         }
       : { 
           id: cred.user.uid, 
           name: formDataObj.name, 
           email: formDataObj.email, 
           phone: formDataObj.phone, 
           nationality: formDataObj.nationality, 
           id_proof_url: fileUrl, 
           dob: dob, // Store DOB
           age: age, // Store Calculated Age
           gender: formDataObj.gender, 
           upi: formDataObj.upi,
           parent_email: isMinor ? parentEmail : null, // Store Parent Email if minor
           is_parent_verified: isMinor, // Flag to show they were verified
           unlocked_skills: [] 
         };

    const { error } = await supabase.from(table).insert([data]);
    if (error) throw error;

    onSignUpSuccess(); 
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 overflow-y-auto max-h-[90vh]">
         
         {/* HEADER */}
         <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white">
             {showVerify ? 'Verify Parent' : (isLogin ? 'Welcome' : 'Join Us')}
           </h2>
           <button onClick={() => setView('home')} className="dark:text-gray-400"><X/></button>
         </div>

         {/* --- OTP VERIFICATION VIEW --- */}
         {showVerify ? (
           <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in fade-in">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center">
                <Mail className="mx-auto text-orange-500 mb-2" />
                <p className="text-sm text-gray-700">
                  We sent a code to <span className="font-bold">{parentEmail}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ask your parent for the code to complete signup.
                </p>
              </div>
              
              <Input 
                name="otp" 
                label="Enter Verification Code" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                required
              />
              
              <Button className="w-full mt-4" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>
              <button 
                type="button" 
                onClick={() => { setShowVerify(false); setLoading(false); }} 
                className="w-full text-center text-sm text-gray-500 mt-2 hover:underline"
              >
                Go Back
              </button>
           </form>
         ) : (
           // --- STANDARD FORM ---
           <>
             {!isLogin && (
               <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6">
                 <button onClick={() => setRole('freelancer')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'freelancer' ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Freelancer</button>
                 <button onClick={() => setRole('client')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'client' ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Client</button>
               </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <Input name="name" label="Name" required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input name="phone" label="Phone" required />
                      <Input name="nationality" label="Country" required />
                    </div>
                    
                    {role === 'freelancer' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          {/* CHANGED: Age input to DOB input */}
                          <div className="group">
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date of Birth</label>
                             <input 
                               type="date" 
                               name="dob"
                               value={dob}
                               onChange={(e) => setDob(e.target.value)}
                               required 
                               className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                             />
                          </div>
                          <Input name="gender" label="Gender" type="select" options={["Male", "Female"]} />
                        </div>
                        
                        {/* AGE INDICATOR */}
                        {age !== null && (
                          <div className={`text-xs px-2 py-1 rounded ${isMinor ? 'text-orange-600' : 'text-green-600'}`}>
                            Age: {age} {isMinor && "(Parent Verification Required)"}
                          </div>
                        )}

                        {/* NEW: Parent Email Input (Only if Minor) */}
                        {isMinor && (
                          <div className="animate-in slide-in-from-top-2 fade-in">
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-xl mb-3 flex items-start gap-2">
                              <ShieldAlert size={16} className="text-orange-500 mt-0.5 shrink-0"/>
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                You are under 18. We must verify your parent's email.
                              </p>
                            </div>
                            <Input 
                              name="parentEmail" 
                              label="Parent's Email" 
                              type="email"
                              value={parentEmail}
                              onChange={(e) => setParentEmail(e.target.value)}
                              required={isMinor}
                            />
                          </div>
                        )}

                        <Input name="upi" label="UPI ID" />
                      </>
                    ) : (
                      <Input name="org" label="Org?" type="select" options={["No", "Yes"]} />
                    )}
                    
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{role === 'freelancer' ? "Upload ID Proof" : "Upload Org ID"}</label>
                      <label className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group-focus-within:ring-2 group-focus-within:ring-indigo-500">
                        <UploadCloud size={20} className="text-indigo-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{file ? file.name : "Click to upload..."}</span>
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" required />
                      </label>
                    </div>
                  </>
                )}
                <Input name="email" label="Email" required />
                <Input name="password" label="Password" type="password" required />
                <Button className="w-full mt-6" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Log In' : (isMinor && role === 'freelancer' ? 'Verify & Create' : 'Create Account'))}
                </Button>
             </form>
             <div className="mt-6 text-center text-sm">
               <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                 {isLogin ? 'Create Account' : 'Log In'}
               </button>
             </div>
           </>
         )}
      </div>
    </div>
  );
};

export default Auth;