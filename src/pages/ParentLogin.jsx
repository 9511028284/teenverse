import React, { useState } from 'react';
import { supabase } from '../supabase';
import { ShieldCheck, Mail, Loader2 } from 'lucide-react';

const ParentLogin = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Check if this email is actually listed as a parent in your DB
    const { data: isParent, error: checkError } = await supabase
      .from('freelancers')
      .select('parent_email')
      .eq('parent_email', email)
      .maybeSingle();

    if (!isParent) {
      alert("Access Denied: This email is not listed as a parent guardian.");
      setLoading(false);
      return;
    }

    // 2. Send Magic Link (No password required)
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/parent-dashboard', // Redirects here after click
      },
    });

    if (error) {
      alert(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Parent Portal</h1>
        
        {!sent ? (
          <>
            <p className="text-gray-500 mb-8">
              Enter the email address you used for your teen's consent form. We will send you a secure login link.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative text-left">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Parent Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="mom@example.com"
                    required
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Send Secure Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-100">
            <h3 className="font-bold">Check your inbox!</h3>
            <p className="text-sm mt-1">We sent a magic link to <strong>{email}</strong>.<br/>Click it to log in instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentLogin;