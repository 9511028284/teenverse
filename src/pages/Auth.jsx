import React, { useState } from 'react';
import { X, UploadCloud, Paperclip } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { supabase } from '../supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Auth = ({ setView, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('freelancer');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    
    try {
      if (isLogin) {
        // LOGIN LOGIC
        await signInWithEmailAndPassword(auth, form.get('email'), form.get('password'));
        onLogin('Welcome back!');
        // No reload needed for login, the App.jsx listener handles it
      } else {
        // SIGN UP LOGIC
        const cred = await createUserWithEmailAndPassword(auth, form.get('email'), form.get('password'));
        
        let fileUrl = "";
        if (file) {
          const fileName = `id_${cred.user.uid}_${Date.now()}`;
          await supabase.storage.from('id_proofs').upload(fileName, file);
          const res = supabase.storage.from('id_proofs').getPublicUrl(fileName);
          fileUrl = res.data.publicUrl;
        }

        let resumeUrl = "";
        if (role === 'freelancer' && resume) {
          const resumeName = `resume_${cred.user.uid}_${Date.now()}`;
          await supabase.storage.from('resumes').upload(resumeName, resume);
          const res = supabase.storage.from('resumes').getPublicUrl(resumeName);
          resumeUrl = res.data.publicUrl;
        }

        const table = role === 'client' ? 'clients' : 'freelancers';
        
        // FIX 1: Ensure 'type' is NOT included here to prevent the DB error
        const data = role === 'client' 
           ? { 
               id: cred.user.uid, 
               name: form.get('name'), 
               email: form.get('email'), 
               phone: form.get('phone'), 
               nationality: form.get('nationality'), 
               id_proof_url: fileUrl, 
               is_organisation: form.get('org') 
             }
           : { 
               id: cred.user.uid, 
               name: form.get('name'), 
               email: form.get('email'), 
               phone: form.get('phone'), 
               nationality: form.get('nationality'), 
               id_proof_url: fileUrl, 
               age: form.get('age'), 
               gender: form.get('gender'), 
               upi: form.get('upi'),
               qualification: form.get('qualification'),
               specialty: form.get('specialty'),
               services: form.get('services'),
               resume_url: resumeUrl,
               unlocked_skills: [] 
             };

        const { error } = await supabase.from(table).insert([data]);
        
        if (error) throw error;

        onLogin('Account created!');
        
        // FIX 2: Force Reload to fix the Redirect Issue
        // This ensures App.jsx re-runs and finds the user in Supabase
        window.location.reload();
      }
    } catch (err) { 
      alert(err.message); 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 overflow-y-auto max-h-[90vh]">
         <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-gray-900 dark:text-white">{isLogin ? 'Welcome' : 'Join Us'}</h2><button onClick={() => setView('home')} className="dark:text-gray-400"><X/></button></div>
         {!isLogin && <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-6"><button onClick={() => setRole('freelancer')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'freelancer' ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Freelancer</button><button onClick={() => setRole('client')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${role === 'client' ? 'bg-white dark:bg-gray-800 shadow-sm dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Client</button></div>}
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
                      <Input name="age" label="Age" />
                      <Input name="gender" label="Gender" type="select" options={["Male", "Female"]} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Input name="qualification" label="Grade/Qualification" placeholder="e.g. 10th Grade" />
                       <Input name="specialty" label="Main Skill" placeholder="e.g. Video Editing" />
                    </div>
                    <Input name="services" label="Services Offered" placeholder="e.g. Python, Logo Design (Comma separated)" />
                    <Input name="upi" label="UPI ID" />
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Upload Resume / CV</label>
                      <label className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                        <Paperclip size={20} className="text-orange-500" /><span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{resume ? resume.name : "Attach Resume (PDF)..."}</span>
                        <input type="file" onChange={(e) => setResume(e.target.files[0])} className="hidden" accept=".pdf,.doc,.docx" />
                      </label>
                    </div>
                  </>
                ) : (
                  <Input name="org" label="Org?" type="select" options={["No", "Yes"]} />
                )}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">{role === 'freelancer' ? "Upload ID Proof" : "Upload Org ID"}</label>
                  <label className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group-focus-within:ring-2 group-focus-within:ring-indigo-500">
                    <UploadCloud size={20} className="text-indigo-500" /><span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{file ? file.name : "Click to upload..."}</span>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" required />
                  </label>
                </div>
              </>
            )}
            <Input name="email" label="Email" required />
            <Input name="password" label="Password" type="password" required />
            <Button className="w-full mt-6" disabled={loading}>{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}</Button>
         </form>
         <div className="mt-6 text-center text-sm"><button onClick={() => setIsLogin(!isLogin)} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{isLogin ? 'Create Account' : 'Log In'}</button></div>
      </div>
    </div>
  );
};

export default Auth;