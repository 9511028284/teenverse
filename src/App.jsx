import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase } from './supabase';
import Toast from './components/ui/Toast';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminPage'; // <--- IMPORT NEW ADMIN PAGE

export default function TeenVerse() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        // 1. CHECK IF ADMIN
        const { data: adminCheck } = await supabase.from('admins').select('*').eq('email', u.email).single();
        
        if (adminCheck) {
          // User is an Admin!
          setUser({ id: u.uid, email: u.email, name: "Super Admin", type: "admin" });
          setView('admin');
          showToast('Welcome back, Admin.');
          return; 
        }

        // 2. NORMAL USER CHECK
        let { data: c } = await supabase.from('clients').select('*').eq('id', u.uid).single();
        if (c) { setUser({ ...c, type: 'client' }); setView('dashboard'); }
        else {
          let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.uid).single();
          if (f) { setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] }); setView('dashboard'); }
        }
        showToast('Logged in successfully');
      } else { setUser(null); }
    });
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);
  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4000); };
  const handleFeedback = async (e) => { e.preventDefault(); const formData = new FormData(e.target); await supabase.from('feedback').insert([{ name: formData.get('name'), email: formData.get('email'), message: formData.get('message') }]); showToast('Feedback sent!'); e.target.reset(); };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* ROUTING */}
      {view === 'home' && <LandingPage setView={setView} onFeedback={handleFeedback} darkMode={darkMode} toggleTheme={toggleTheme} />}
      {view === 'auth' && <Auth setView={setView} onLogin={(msg) => showToast(msg)} />}
       
      
      {/* ADMIN DASHBOARD */}
      {view === 'admin' && user?.type === 'admin' && <AdminDashboard user={user} onLogout={async () => { await signOut(auth); setView('home'); showToast('Logged out'); }} />}
      
      {/* REGULAR DASHBOARD */}
      {view === 'dashboard' && user && user.type !== 'admin' && <Dashboard user={user} setUser={setUser} onLogout={async () => { await signOut(auth); setView('home'); showToast('Logged out successfully'); }} showToast={showToast} darkMode={darkMode} toggleTheme={toggleTheme} />}
    </>
  );
}