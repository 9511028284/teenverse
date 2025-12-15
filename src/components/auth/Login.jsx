import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, GithubAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth } from '../../firebase';

const Login = ({ onLogin, onSwitchToSignup, onSwitchToForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleSocialLogin = async (providerName) => {
    setLoading(true);
    try {
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // --- ICONS ---
  const GoogleIcon = () => (<svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>);

  return (
    <div className="max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
       <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
       <p className="text-gray-400 mb-8">Enter your credentials to access your workspace.</p>
       
       <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block group-focus-within:text-indigo-400 transition-colors">Email</label>
            <div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4 transition-all focus-within:border-indigo-500 focus-within:bg-black/50 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Mail size={18} className="text-gray-500 mr-3"/>
              <input type="email" placeholder="name@example.com" className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="group">
            <div className="flex justify-between items-center mb-2">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1 group-focus-within:text-indigo-400 transition-colors">Password</label>
               <button type="button" onClick={onSwitchToForgot} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Forgot?</button>
            </div>
            <div className="bg-black/30 border border-gray-700/50 rounded-xl flex items-center px-4 transition-all focus-within:border-indigo-500 focus-within:bg-black/50 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Lock size={18} className="text-gray-500 mr-3"/>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="bg-transparent border-none outline-none w-full py-4 text-white placeholder-gray-600" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
             {loading ? <Loader2 className="animate-spin"/> : 'Log In'}
          </button>
       </form>

       <div className="flex items-center gap-4 my-8">
         <div className="h-px bg-white/10 flex-1"></div>
         <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Or continue with</span>
         <div className="h-px bg-white/10 flex-1"></div>
       </div>

       <div className="flex gap-3">
          <button onClick={() => handleSocialLogin('google')} className="flex-1 bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 p-3 rounded-xl flex justify-center items-center transition-all">
             <GoogleIcon />
          </button>
          {/* Add other providers here */}
       </div>

       <p className="mt-8 text-center text-gray-500 text-sm">
         Don't have an account? <button onClick={onSwitchToSignup} className="text-white font-bold hover:underline">Sign Up</button>
       </p>
    </div>
  );
};

export default Login;