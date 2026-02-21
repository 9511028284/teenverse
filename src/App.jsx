import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase'; 
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
import ParentLogin from './pages/ParentLogin'; 
import ParentDashboard from './pages/ParentDashboard'; 

// --- 1. Helper Wrappers ---
const LegalWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  return <Legal page={query.get('page') || 'terms'} onBack={() => navigate('/')} />;
};

const ParentApprovalWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  return <ParentApproval token={query.get('token')} onApprovalComplete={() => navigate('/')} />;
};

// --- 2. Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Compatibility helper
  const setView = (viewName) => {
      switch(viewName) {
          case 'home': navigate('/'); break;
          case 'auth': navigate('/auth'); break;
          case 'dashboard': navigate('/dashboard'); break;
          case 'legal': navigate('/legal'); break;
          case 'admin': navigate('/admin'); break;
          case 'parent-login': navigate('/parent-login'); break;
          case 'parent-dashboard': navigate('/parent-dashboard'); break;
          default: navigate('/'); 
      }
  };

  // Redirect handling for approval tokens
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token && !location.pathname.includes('/parent-approval')) {
       navigate(`/parent-approval?token=${token}`);
    }
  }, [location, navigate]);

  // Auth & Session Logic
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session, attempts = 0) => {
    const currentPath = location.pathname;
    const isPublic = ['/', '/auth', '/legal', '/termsagreement', '/parent-approval', '/parent-login'].some(path => currentPath.startsWith(path));
    
    // Variable to check if they are currently trying to view the terms page
    const isTermsPage = currentPath.startsWith('/termsagreement');

    if (!session) {
      setUser(null);
      if (!isPublic) navigate('/');
      setLoading(false);
      return;
    }

    const u = session.user;

    try {
      // 1. ADMIN
      const { data: adminCheck } = await supabase.from('admins').select('*').eq('email', u.email).maybeSingle();
      if (adminCheck) {
        setUser({ ...u, type: "admin" });
        if (currentPath !== '/admin') navigate('/admin');
        setLoading(false);
        return;
      }

      // 2. CLIENT
      let { data: c } = await supabase.from('clients').select('*').eq('id', u.id).maybeSingle();
      if (c) { 
          setUser({ ...c, type: 'client' }); 
          if (!currentPath.startsWith('/dashboard') && !isTermsPage) navigate('/dashboard');
          setLoading(false);
          return;
      }

      // 3. FREELANCER
      let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.id).maybeSingle();
      if (f) { 
          setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] });
          if (!currentPath.startsWith('/dashboard') && !isTermsPage) navigate('/dashboard');
          setLoading(false);
          return;
      }
        
      // 4. PARENT
      const { data: parentMatch } = await supabase
        .from('parent_consents')
        .select('user_id')
        .eq('parent_email', u.email)
        .maybeSingle();

      if (parentMatch) {
          setUser({ ...u, type: 'parent', teenId: parentMatch.user_id });
          if (!currentPath.startsWith('/parent-dashboard')) navigate('/parent-dashboard');
          setLoading(false);
          return;
      }

      // 5. RETRY
      if (attempts < 3) {
          setTimeout(() => handleSession(session, attempts + 1), 1000);
          return; 
      }

      // 6. FALLBACK
      console.warn("No profile found.");
      setUser(null); 
      navigate('/auth');
      setLoading(false);

    } catch (err) {
      console.error("Profile Error:", err);
      setLoading(false);
    }
  };

  // Theme Logic
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
      if (!error) { showToast('Feedback sent!'); e.target.reset(); } 
      else { showToast('Failed to send feedback', 'error'); }
  };

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
      
      <Routes>
        <Route path="/" element={
            <LandingPage 
                setView={setView} 
                onFeedback={handleFeedback} 
                darkMode={darkMode} 
                toggleTheme={toggleTheme} 
                onLegalClick={(page) => navigate(`/legal?page=${page}`)} 
            />
        } />

        <Route path="/legal" element={<LegalWrapper />} />
        
        {/* FIX: Replaced window.location.reload() with navigate('/dashboard') */}
        <Route path="/termsagreement" element={<TermsAgreement onAgree={() => navigate('/dashboard')} />} />
        
        <Route path="/parent-approval" element={<ParentApprovalWrapper />} />
        
        <Route path="/Auth" element={
            <Auth 
                setView={setView} 
                onLogin={(msg) => showToast(msg)} 
                onSignUpSuccess={() => {
                    supabase.auth.getUser().then(({ data }) => {
                        if(data?.session) handleSession(data.session);
                    });
                }} 
            />
        } />
        <Route path="/parent-login" element={<ParentLogin />} />

        <Route path="/parent-dashboard" element={
            user?.type === 'parent' ? (
                <ParentDashboard 
                    user={user} 
                    onLogout={async () => { await supabase.auth.signOut(); navigate('/'); showToast('Logged out'); }} 
                />
            ) : <Navigate to="/auth" />
        } />

        <Route path="/admin" element={
            user?.type === 'admin' ? (
                <AdminDashboard 
                    user={user} 
                    onLogout={async () => { await supabase.auth.signOut(); navigate('/'); showToast('Logged out'); }} 
                />
            ) : <Navigate to="/auth" />
        } />

        <Route path="/dashboard/*" element={
            user && (user.type === 'client' || user.type === 'freelancer') ? (
                <Dashboard 
                    user={user} 
                    setUser={setUser} 
                    onLogout={async () => { await supabase.auth.signOut(); navigate('/'); showToast('Logged out successfully'); }} 
                    showToast={showToast} 
                    darkMode={darkMode} 
                    toggleTheme={toggleTheme} 
                />
            ) : <Navigate to="/auth" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
   </>
  );
}