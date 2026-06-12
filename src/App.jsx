import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase'; 
import Toast from './components/ui/Toast';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Loader2, ShieldCheck } from 'lucide-react';
import { normalizeExpiredSubscription } from './utils/subscription';
import { normalizeIndianPhone } from './utils/validators';
import { getPendingSignupProfile, removePendingSignupProfile } from './utils/pendingSignupProfile';

// --- Pages (Only App/Dashboard logic remains) ---
import Auth from './pages/Auth'; 
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import TermsAgreement from './pages/TermsAgreement'; 
import AdminDashboard from './pages/AdminPage';
import PlatformAIAssistant from './components/features/PlatformAIAssistant';

const buildPendingSignupPayload = (profile = {}) => ({
  role: profile.role || 'freelancer',
  name: String(profile.name || '').trim(),
  email: String(profile.email || '').trim().toLowerCase(),
  phone: normalizeIndianPhone(profile.phone),
  nationality: profile.nationality || 'India',
  source: profile.source || '',
  dob: profile.dob || '',
  gender: profile.gender || 'Other',
  org: profile.org || '',
  referralCode: profile.referralCode || '',
  termsAccepted: profile.termsAccepted !== false,
  termsVersion: profile.termsVersion || 'v1.0-TeenVerseHub-Terms',
});

// --- 1. Helper Wrappers ---
const LegalWrapper = () => {
  const navigate = useNavigate();
  return <TermsAgreement onAgree={() => navigate('/')} />;
};

const ParentApprovalWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-black text-gray-950 dark:text-white">Parent approval</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Parent approvals are handled in the dedicated parent portal. Continue there to review or approve this request.
        </p>
        {token && (
          <p className="mt-4 break-all rounded-xl bg-gray-50 px-3 py-2 text-xs font-mono text-gray-500 dark:bg-white/5 dark:text-gray-400">
            Token: {token}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => { window.location.href = 'https://parent.teenversehub.in'; }}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Open parent portal
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const completingPendingSignupRef = useRef(false);

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
          case 'dashboard': navigate(user?.type === 'client' ? '/client-dashboard' : '/dashboard'); break;
          case 'legal': window.location.href = 'http://teenversehub.in/legal#official-documents'; break;
          case 'admin': navigate('/admin'); break;
          default: navigate('/'); 
      }
  };

  const handleTermsAccepted = useCallback(async () => {
    if (user?.id) {
      const acceptedAt = new Date().toISOString();
      const termsVersion = 'v1.0-TeenVerseHub-Terms';
      const { error } = await supabase
        .from('users')
        .update({
          terms_accepted_at: acceptedAt,
          terms_version: termsVersion,
          terms_user_agent: navigator.userAgent || 'unknown',
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser((prev) => prev ? ({
        ...prev,
        terms_accepted_at: acceptedAt,
        terms_version: termsVersion,
      }) : prev);
    }

    navigate(user?.type === 'client' ? '/client-dashboard' : '/dashboard');
  }, [navigate, user?.id, user?.type]);

  // Redirect handling for approval tokens
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token && !location.pathname.includes('/parent-approval')) {
       navigate(`/parent-approval?token=${token}`);
    }
  }, [location, navigate]);

  const showToast = useCallback((message, type = 'success') => { 
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000); 
  }, []);

  const handleSession = useCallback(async function handleSessionImpl(session, attempts = 0) {
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
      let completedPendingSignup = false;
      const pendingProfile = getPendingSignupProfile();
      const pendingMatchesUser = pendingProfile?.email?.toLowerCase?.() === u.email?.toLowerCase?.();

      if (pendingMatchesUser && pendingProfile?.phone && !completingPendingSignupRef.current) {
        completingPendingSignupRef.current = true;

        try {
          const { data, error } = await supabase.functions.invoke('complete-signup', {
            body: buildPendingSignupPayload(pendingProfile),
          });

          if (error || !data?.success) throw new Error(data?.error || 'Profile completion failed');

          removePendingSignupProfile();
          completedPendingSignup = true;
        } catch (error) {
          console.warn('Pending signup completion failed:', error);
          showToast(
            /phone verification/i.test(error?.message || '')
              ? 'Phone verification expired. Please verify your mobile number again.'
              : 'Finish account setup to unlock your full dashboard.',
            'error',
          );
        } finally {
          completingPendingSignupRef.current = false;
        }
      }

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
      if (c?.phone?.length > 5) { 
          setUser({ ...c, type: 'client' }); 
          if (completedPendingSignup && !isTermsPage) {
              navigate('/termsagreement');
          } else if (currentPath === '/' || (!currentPath.startsWith('/client-dashboard') && !isTermsPage && !isPublic)) {
              navigate('/client-dashboard');
          }
          setLoading(false);
          return;
      }
      if (c) {
          setUser(null);
          if (currentPath !== '/') navigate('/');
          setLoading(false);
          return;
      }

      // 3. FREELANCER
      let { data: f } = await supabase.from('freelancers').select('*').eq('id', u.id).maybeSingle();
      if (f?.phone?.length > 5) { 
          const normalized = normalizeExpiredSubscription(f);
          if (normalized !== f) {
              try {
                  const { error: normalizeError } = await supabase.rpc('normalize_freelancer_subscription', { p_user_id: u.id });
                  if (normalizeError) console.warn('Subscription refresh failed:', normalizeError);
              } catch (err) {
                  console.warn('Subscription refresh failed:', err);
              }
          }
          f = normalized;
          setUser({ ...f, type: 'freelancer', unlockedSkills: f.unlocked_skills || [] });
          if (completedPendingSignup && !isTermsPage) {
              navigate('/termsagreement');
          } else if (currentPath === '/' || (!currentPath.startsWith('/dashboard') && !isTermsPage && !isPublic)) {
              navigate('/dashboard');
          }
          setLoading(false);
          return;
      }
      if (f) {
          setUser(null);
          if (currentPath !== '/') navigate('/');
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
          setTimeout(() => handleSessionImpl(session, attempts + 1), 1000);
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
  }, [location.pathname, navigate, showToast]);

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
  }, [handleSession]);

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
        <Route path="/termsagreement" element={<TermsAgreement onAgree={handleTermsAccepted} />} />
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

        <Route path="/client-dashboard/*" element={
            user?.type === 'client' ? (
                <ClientDashboard 
                    user={user} 
                    setUser={setUser} 
                    onLogout={async () => { await supabase.auth.signOut(); navigate('/'); showToast('Logged out successfully'); }} 
                    showToast={showToast} 
                    darkMode={darkMode} 
                    toggleTheme={toggleTheme} 
                />
            ) : user?.type === 'freelancer' ? <Navigate to="/dashboard" /> : <Navigate to="/" />
        } />

        <Route path="/dashboard/*" element={
            user?.type === 'client' ? (
                <Navigate to="/client-dashboard" />
            ) : user?.type === 'freelancer' ? (
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
      <PlatformAIAssistant user={user} showToast={showToast} />
   </>
  );
}
