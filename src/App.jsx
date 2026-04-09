import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase'; 
import Toast from './components/ui/Toast';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Loader2 } from 'lucide-react';

// --- Pages (Only App/Dashboard logic remains) ---
import Auth from './pages/Auth'; 
import Dashboard from './pages/Dashboard';
import TermsAgreement from './pages/TermsAgreement'; 
import AdminDashboard from './pages/AdminPage'; // Assuming this import was missing in your snippet but used in LegalWrapper

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

  // ⚡ OPTIMIZATION: Instant Scroll Restoration
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  // --- SMART ROUTING CROSS-DOMAIN ---
  const setView = (viewName) => {
      switch(viewName) {
          // If a button in the app tries to go to a marketing page, send them back to the Next.js site!
          case 'home': 
          case 'about': 
          case 'about us':
          case 'faq': 
          case 'safety': 
              window.location.href = 'https://teenversehub.in'; 
              break;
              
          // If they try to access parent routes, teleport them to the subdomain
          case 'parent-login': 
          case 'parent-dashboard': 
          case 'parent portal':
              window.location.href = 'https://parent.teenversehub.in'; 
              break;

          // Internal App Routing
          case 'auth': navigate('/'); break; // Auth is now the root page
          case 'dashboard': navigate('/dashboard'); break;
          case 'legal': navigate('/legal'); break;
          case 'admin': navigate('/admin'); break;
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
    
    // ✅ Auth/Login is now at '/'
    const isPublic = ['/', '/legal', '/termsagreement', '/parent-approval'].some(path => currentPath === path || currentPath.startsWith(path + '/'));
    const isTermsPage = currentPath.startsWith('/termsagreement');

    if (!session) {
      setUser(null);
      if (!isPublic) navigate('/'); // Boot unauthorized users back to Auth
      setLoading(false);
      return;
    }

    const u = session.user;

    try {
      // 1. ADMIN
      const { data: adminCheck } = await supabase.from('admins').select('*').eq('email', u.email).maybeSingle();
      if (adminCheck) {
        setUser({ ...u, type: "admin" });
        if (currentPath === '/' || (!currentPath.startsWith('/admin') && !isPublic)) {
            navigate('/admin');
        }
        setLoading(false);
        return;
      }

      // 2. CLIENT
      let { data: c } = await supabase.from('clients').select('*').eq('id', u.id).maybeSingle();
      if (c) { 
          setUser({ ...c, type: 'client' }); 
          if (currentPath === '/' || (!currentPath.startsWith('/dashboard') && !isTermsPage && !isPublic)) {
              navigate('/dashboard');
          }
          setLoading(false);
          return;
      }

      // 3. FREELANCER
      let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.id).maybeSingle();
      if (f) { 
          setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] });
          if (currentPath === '/' || (!currentPath.startsWith('/dashboard') && !isTermsPage && !isPublic)) {
              navigate('/dashboard');
          }
          setLoading(false);
          return;
      }
        
      // 4. PARENT (Instantly teleport them to the Parent Portal Subdomain)
      const { data: parentMatch } = await supabase
        .from('parent_consents')
        .select('user_id')
        .eq('parent_email', u.email)
        .maybeSingle();

      if (parentMatch) {
          window.location.href = 'https://parent.teenversehub.in';
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
      if (currentPath !== '/') navigate('/');
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

 if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center text-indigo-500">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
 }

  return (
   <>
      <SpeedInsights />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <Routes>
        {/* ✅ ROOT IS NOW AUTH / LOGIN */}
        <Route path="/" element={
            <Auth 
                setView={setView} 
                onLogin={(msg) => showToast(msg)} 
                onSignUpSuccess={() => {
                    supabase.auth.getSession().then(({ data }) => {
                        if(data?.session) handleSession(data.session);
                    });
                }} 
            />
        } />

        {/* Legal & Onboarding */}
        <Route path="/legal" element={<LegalWrapper />} />
        <Route path="/termsagreement" element={<TermsAgreement onAgree={() => navigate('/dashboard')} />} />
        <Route path="/parent-approval" element={<ParentApprovalWrapper />} />

        {/* Secure Dashboards */}
        <Route path="/admin" element={
            user?.type === 'admin' ? (
                <AdminDashboard 
                    user={user} 
                    onLogout={async () => { await supabase.auth.signOut(); navigate('/'); showToast('Logged out'); }} 
                />
            ) : <Navigate to="/" />
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
            ) : <Navigate to="/" />
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
   </>
  );
}