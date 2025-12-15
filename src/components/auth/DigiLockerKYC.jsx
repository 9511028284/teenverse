// File: src/components/auth/DigiLockerKYC.jsx
import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle, AlertCircle, Loader2, FileText, ArrowRight } from 'lucide-react';

const DigiLockerKYC = ({ user, onVerificationComplete }) => {
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Input, 2: OTP, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to call your Vercel API
  const callKycApi = async (payload) => {
    try {
      const res = await fetch('/api/verify-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userRole: user.role, // 'freelancer' or 'client'
          ...payload
        })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (aadhaar.length !== 12 || isNaN(aadhaar)) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setLoading(true);
    try {
      // Call Backend API to initiate
      await callKycApi({ step: 'initiate', aadhaar });
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Invalid OTP format');
      return;
    }

    setLoading(true);
    try {
      // Call Backend API to verify and update DB
      await callKycApi({ step: 'verify', otp, aadhaar });
      
      setStep(3);
      // Wait a moment for the animation before redirecting
      setTimeout(() => {
        onVerificationComplete();
      }, 2000);
    } catch (err) {
      setError(err.message || "Verification Failed. Check OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in zoom-in duration-500">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-white">Identity Verification</h2>
        <p className="text-gray-400 text-sm">
          Govt. Mandated KYC via <span className="text-blue-400 font-bold">DigiLocker</span>
        </p>
      </div>

      {/* Step 1: Aadhaar Input */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-3">
             <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
             <p className="text-xs text-gray-400 leading-relaxed">
               Your data is processed securely. We only verify your age and identity status. No biometric data is stored.
             </p>
          </div>

          <div className="group">
             <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Aadhaar Number</label>
             <div className="relative">
               <input 
                 type="text" 
                 maxLength={12}
                 value={aadhaar}
                 onChange={(e) => setAadhaar(e.target.value.replace(/\D/g,''))}
                 placeholder="XXXX XXXX XXXX" 
                 className="w-full bg-black/30 border border-gray-700/50 rounded-xl p-4 pl-12 text-white tracking-widest font-mono text-lg focus:border-emerald-500 focus:bg-black/50 outline-none transition-all"
               />
               <FileText className="absolute left-4 top-4.5 text-gray-500" size={20} />
             </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/50 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
             {loading ? <Loader2 className="animate-spin" /> : <>Verify via DigiLocker <ArrowRight size={18}/></>}
          </button>
        </form>
      )}

      {/* Step 2: OTP Input */}
      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-6">
           <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">OTP sent to mobile linked with Aadhaar ending in <span className="text-white font-mono">xxxx-{aadhaar.slice(-4)}</span></p>
           </div>

           <div className="relative">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="000000"
                className="w-full bg-black/30 border border-emerald-500/50 rounded-xl py-5 text-center text-3xl tracking-[1em] font-mono text-white focus:shadow-[0_0_20px_rgba(16,185,129,0.2)] outline-none transition-all"
              />
           </div>

           {error && <p className="text-red-400 text-sm text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}

           <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/50 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
             {loading ? <Loader2 className="animate-spin" /> : <>Submit OTP <Lock size={18}/></>}
           </button>
           
           <button type="button" onClick={() => {setStep(1); setError('');}} className="w-full text-gray-500 text-sm hover:text-white mt-2">Change Aadhaar Number</button>
        </form>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="text-center py-8 animate-in zoom-in duration-300">
           <div className="inline-flex items-center justify-center p-3 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-500/50 mb-4 animate-bounce">
              <CheckCircle size={32} />
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">Verification Successful!</h3>
           <p className="text-gray-400">Updating your profile and unlocking dashboard...</p>
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/DigiLocker.svg/1200px-DigiLocker.svg.png" alt="Digilocker" className="h-6" />
         <span className="text-xs text-gray-500">Secured by Government of India</span>
      </div>
    </div>
  );
};

export default DigiLockerKYC;