import React, { useState, useEffect } from 'react';
import { supabase } from './supabase'; // ✅ Using Supabase exclusively
import Toast from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

// Pages
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth'; 
import Dashboard from './pages/Dashboard';
import Legal from './pages/Legal';
import TermsAgreement from './pages/TermsAgreement'; 
import AdminDashboard from './pages/AdminPage';
import ParentApproval from './pages/ParentApproval';

export default function TeenVerse() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [legalPage, setLegalPage] = useState('terms');
  const [approvalToken, setApprovalToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check URL for Parent Approval Token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setApprovalToken(token);
      setView('parent-approval');
    }
  }, []);

  // 2. Main Authentication Listener (Supabase)
  useEffect(() => {
    // A. Check active session immediately
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    checkUser();

    // B. Listen for auth changes (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to process user data from DB
// Helper to process user data from DB
  const handleSession = async (session) => {
    // 1. No Session? Go Home.
    if (!session) {
      if (view !== 'parent-approval' && view !== 'landing' && view !== 'legal' && view !== 'auth') {
         setUser(null);
         setView('home');
      }
      setLoading(false);
      return;
    }

    const u = session.user;

    try {
      // 2. CHECK ADMIN
      const { data: adminCheck } = await supabase.from('admins').select('*').eq('email', u.email).maybeSingle();
      if (adminCheck) {
        setUser({ ...u, type: "admin" });
        setView('admin');
        setLoading(false);
        return; 
      }

      // 3. CHECK IF CLIENT PROFILE EXISTS
      let { data: c } = await supabase.from('clients').select('*').eq('id', u.id).maybeSingle();
      if (c) { 
          setUser({ ...c, type: 'client' }); 
          setView('dashboard'); // ✅ Only go to dashboard if profile exists
          setLoading(false);
          return;
      }

      // 4. CHECK IF FREELANCER PROFILE EXISTS
      let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.id).maybeSingle();
      if (f) { 
          setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] }); 
          setView('dashboard'); // ✅ Only go to dashboard if profile exists
          setLoading(false);
          return;
      }
      
      // 5. 🛑 TRAP: LOGGED IN BUT NO PROFILE (Google/GitHub User)
      // If we reach here, they have a Google Session, but NO database row.
      console.log("User logged in via Social, but profile missing. Redirecting to setup...");
      
      // DO NOT set 'dashboard'. Force 'auth'.
      setUser(null); 
      setView('auth'); 
      setLoading(false);

    } catch (err) {
      console.error("Profile Fetch Error:", err);
      setLoading(false);
    }
  };

  // 3. Dark Mode Logic
  useEffect(() => {
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
      const { error } = await supabase.from('feedback').insert([{ name: formData.get('name'), email: formData.get('email'), message: formData.get('message') }]); 
      if (!error) {
        showToast('Feedback sent!'); 
        e.target.reset(); 
      } else {
        showToast('Failed to send feedback', 'error');
      }
  };

  const handleLegalNavigation = (page) => {
    setLegalPage(page);
    setView('legal');
  };

  // --- RENDER ---
  if (loading) {
      return (
        <div className="h-screen w-screen bg-[#050505] flex items-center justify-center text-indigo-500">
            <Loader2 className="animate-spin w-10 h-10" />
        </div>
      );
  }

  return (
   <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {view === 'home' && <LandingPage setView={setView} onFeedback={handleFeedback} darkMode={darkMode} toggleTheme={toggleTheme} onLegalClick={handleLegalNavigation} />}
      
      {view === 'legal' && <Legal page={legalPage} onBack={() => setView('home')} />}

      {view === 'terms' && <TermsAgreement onAgree={() => window.location.reload()} />}
      
      {view === 'parent-approval' && <ParentApproval token={approvalToken} onApprovalComplete={() => setView('home')} />}
      
      {/* AUTH PAGE: Integrated with the code generated previously */}
      {view === 'auth' && (
          <Auth 
            setView={setView} 
            onLogin={(msg) => { showToast(msg); }} 
            onSignUpSuccess={() => setView('terms')} // Or 'dashboard' based on your flow
          />
      )}
      
      {view === 'admin' && user?.type === 'admin' && <AdminDashboard user={user} onLogout={async () => { await supabase.auth.signOut(); setView('home'); showToast('Logged out'); }} />}
      
      {view === 'dashboard' && user && user.type !== 'admin' && <Dashboard user={user} setUser={setUser} onLogout={async () => { await supabase.auth.signOut(); setView('home'); showToast('Logged out successfully'); }} showToast={showToast} darkMode={darkMode} toggleTheme={toggleTheme} />}
   </>
  );
}