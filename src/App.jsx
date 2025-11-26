import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { supabase } from './supabase';
import Toast from './components/ui/Toast';
import { Loader2 } from 'lucide-react'; // Added for loading state

// Pages
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Legal from './pages/Legal';
import TermsAgreement from './pages/TermsAgreement'; 
import AdminDashboard from './pages/AdminPage';
import ParentApproval from './pages/ParentApproval';
import ChatSystem from './components/features/ChatSystem'; // Import ChatSystem directly for testing if needed

export default function TeenVerse() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [legalPage, setLegalPage] = useState('terms');
  const [approvalToken, setApprovalToken] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  // 1. Check URL for Parent Approval Token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setApprovalToken(token);
      setView('parent-approval');
    }
  }, []);

  // 2. Main Authentication Listener (Firebase + Supabase Profile Fetch)
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
     
      if (u) {
         if (view === 'terms') return;


        // A. CHECK ADMIN
        const { data: adminCheck } = await supabase
          .from('admins')
          .select('*')
          .eq('email', u.email)
          .maybeSingle();
        
        if (adminCheck) {
          setUser({ id: u.uid, email: u.email, name: "Super Admin", type: "admin" });
          setView('admin');
          showToast('Welcome Admin!');
          setLoading(false);
          return; 
        }

        // B. CHECK CLIENT
        let { data: c } = await supabase
          .from('clients')
          .select('*')
          .eq('id', u.uid) // Note: Ensure your DB uses text IDs or matches Firebase UIDs
          .maybeSingle();

        if (c) { 
            setUser({ ...c, type: 'client' }); 
            setView('dashboard'); 
            setLoading(false);
            return;
        }

        // C. CHECK FREELANCER
        let { data: f } = await supabase
          .from('freelancers')
          .select('*')
          .eq('id', u.uid)
          .maybeSingle();
        
        if (f) { 
            setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] }); 
            setView('dashboard'); 
        }
        
        // If user exists in Firebase but not in DB yet (New Signup)
        if (!c && !f && !adminCheck) {
             // Handle new user case if needed, or keep them on Auth/Setup
             // For now, we assume they are valid if they passed auth
             setUser({ id: u.uid, email: u.email, name: u.displayName || "New User" });
        }
        
      } else { 
        // User Logged Out
        if (view !== 'parent-approval') {
            setUser(null); 
            if (view !== 'landing' && view !== 'auth' && view !== 'legal') setView('home'); 
        }
      }
      setLoading(false);
    });
  }, [view]); 

  // 3. Dark Mode Logic
  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);
  
  const showToast = (message, type = 'success') => { 
      setToast({ message, type }); 
      setTimeout(() => setToast(null), 4000); 
  };

  const handleFeedback = async (e) => { 
      e.preventDefault(); 
      const formData = new FormData(e.target); 
      // Ensure 'feedback' table exists and accepts anon inserts or handles RLS
      await supabase.from('feedback').insert([{ name: formData.get('name'), email: formData.get('email'), message: formData.get('message') }]); 
      showToast('Feedback sent!'); 
      e.target.reset(); 
  };

  const handleLegalNavigation = (page) => {
    setLegalPage(page);
    setView('legal');
  };

  // --- RENDER ---
  

  return (
   <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {view === 'home' && <LandingPage setView={setView} onFeedback={handleFeedback} darkMode={darkMode} toggleTheme={toggleTheme} onLegalClick={handleLegalNavigation} />}
      
      {/* FIX: Pass legalPage prop to Legal component */}
      {view === 'legal' && <Legal page={legalPage} onBack={() => setView('home')} />}

      {view === 'terms' && <TermsAgreement onAgree={() => window.location.reload()} />}
      {view === 'parent-approval' && <ParentApproval token={approvalToken} onApprovalComplete={() => setView('home')} />}
      {view === 'auth' && <Auth setView={setView} onLogin={(msg) => showToast(msg)} onSignUpSuccess={() => setView('terms')} />}
      {view === 'admin' && user?.type === 'admin' && <AdminDashboard user={user} onLogout={async () => { await signOut(auth); setView('home'); showToast('Logged out'); }} />}
      {view === 'dashboard' && user && user.type !== 'admin' && <Dashboard user={user} setUser={setUser} onLogout={async () => { await signOut(auth); setView('home'); showToast('Logged out successfully'); }} showToast={showToast} darkMode={darkMode} toggleTheme={toggleTheme} />}
    </>
  );
}