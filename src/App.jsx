import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabase';
import Toast from './components/ui/Toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ArrowLeftRight, Briefcase, Loader2, ShieldCheck, User } from 'lucide-react';
import { normalizeExpiredSubscription } from './utils/subscription';
import { normalizeIndianPhone } from './utils/validators';
import { getPendingSignupProfileForUser, removePendingSignupProfile } from './utils/pendingSignupProfile';

// --- Pages ---
import Auth from './pages/Auth';
import TermsAgreement from './pages/TermsAgreement';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const PlatformAIAssistant = lazy(() => import('./components/features/PlatformAIAssistant'));
const PublicOpportunityList = lazy(() => import('./components/opportunities/PublicOpportunityList'));
const OpportunityDetailApply = lazy(() => import('./components/opportunities/OpportunityDetailApply'));
const MyOpportunityApplications = lazy(() => import('./components/opportunities/MyOpportunityApplications'));
import {
  ensureIndividualProfile,
  getAuthBootstrap,
  getPortalMode,
  getRedirectPathForPortal,
  PORTAL_MODES,
  PORTAL_URLS,
} from './services/phase1.api';
import { hasCompletedAppOnboarding } from './utils/accountOnboarding';
import { resolveProfileDashboardRole, resolveSessionDashboardRole } from './utils/sessionDashboardRole';
import { trackAnalyticsEvent } from './services/auxiliary.api';
import {
  DASHBOARD_ROLES,
  ensureDashboardRole,
  getDashboardRolePreference,
  getOppositeDashboardRole,
  setDashboardRolePreference,
} from './services/dashboardRole.api';

const PARENT_PORTAL_URL = PORTAL_URLS.parent;
const ADMIN_PORTAL_URL = PORTAL_URLS.admin;
const MIN_ROLE_SWITCH_MS = 760;

const isExternalTarget = (target = '') => /^https?:\/\//i.test(target);

const getPrimaryDashboardPath = (sessionUser) => {
  if (sessionUser?.portalHomePath) return sessionUser.portalHomePath;

  if (sessionUser?.type === 'client') {
    return '/client-dashboard';
  }

  return '/dashboard';
};

const getRolePreferredDashboardPath = ({
  portalMode,
  preferredRole,
  legacy = {},
  fallback,
}) => {
  if (preferredRole === DASHBOARD_ROLES.CLIENT && legacy.client) {
    return portalMode === PORTAL_MODES.INTERN
      ? `${PORTAL_URLS.app}/client-dashboard`
      : '/client-dashboard';
  }

  if (preferredRole === DASHBOARD_ROLES.FREELANCER && legacy.freelancer) {
    return '/dashboard';
  }

  return fallback;
};

const getRouteGroupForTarget = ({ target }) => {
  if (isExternalTarget(target)) return [];
  if (target?.startsWith('/admin')) return ['/admin'];

  if (target?.startsWith('/client-dashboard')) return ['/client-dashboard'];
  if (target?.startsWith('/dashboard')) return ['/dashboard'];
  return [target || '/'];
};

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

const publicRoutePrefixes = [
  '/',
  '/login',
  '/signup',
  '/individual/login',
  '/individual/signup',
  '/legal',
  '/termsagreement',
  '/parent-approval',
  '/opportunities',
  '/my-applications',
];

const getDisplayName = (authUser, profile, fallbackRow) => (
  fallbackRow?.name ||
  profile?.full_name ||
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email?.split('@')?.[0] ||
  'TeenVerse user'
);

const buildSessionUser = (authUser, profile, legacy = {}, context = {}) => {
  const {
    portalMode = PORTAL_MODES.APP,
    portalHomePath = null,
    activeDashboardRole = null,
  } = context;

  const base = {
    ...authUser,
    email: profile?.email || authUser?.email,
    name: getDisplayName(authUser, profile, legacy.client || legacy.freelancer),
    profile,
    profileRole: profile?.role || 'student',
    portalMode,
    portalHomePath,
    availableDashboardRoles: {
      client: Boolean(legacy.client),
      freelancer: Boolean(legacy.freelancer),
    },
  };

  if (profile?.role === 'admin') {
    return { ...base, ...legacy.admin, id: authUser.id, type: 'admin' };
  }

  const freelancer = legacy.freelancer || {};
  const buildFreelancerSession = () => ({
    ...base,
    ...freelancer,
    id: authUser.id,
    email: profile?.email || freelancer.email || authUser?.email,
    name: getDisplayName(authUser, profile, freelancer),
    type: 'freelancer',
    activeDashboardRole: DASHBOARD_ROLES.FREELANCER,
    unlockedSkills: freelancer.unlocked_skills || [],
  });

  const buildClientSession = (extra = {}) => ({
    ...base,
    ...legacy.client,
    ...extra,
    id: authUser.id,
    email: profile?.email || extra.email || legacy.client?.email || authUser?.email,
    name: extra.name || getDisplayName(authUser, profile, legacy.client),
    type: 'client',
    activeDashboardRole: DASHBOARD_ROLES.CLIENT,
  });

  const resolvedDashboardRole = resolveSessionDashboardRole({
    preferredRole: activeDashboardRole,
    hasClient: Boolean(legacy.client),
    hasFreelancer: Boolean(legacy.freelancer),
  });

  if (resolvedDashboardRole === DASHBOARD_ROLES.CLIENT) {
    return buildClientSession();
  }

  return buildFreelancerSession();
};

const mergeRoleSwitchLegacy = (legacy = {}, switchResult = {}) => ({
  ...legacy,
  client: legacy.client || switchResult.client || null,
  freelancer: legacy.freelancer || switchResult.freelancer || null,
});

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const getRoleSwitchCopy = (targetRole) => {
  if (targetRole === DASHBOARD_ROLES.CLIENT) {
    return {
      title: 'Opening client dashboard',
      body: 'Your existing account details are being synced into client tools.',
      from: 'Freelancer',
      to: 'Client',
      Icon: Briefcase,
    };
  }

  return {
    title: 'Opening freelancer dashboard',
    body: 'Your profile is being prepared for services, applications, and portfolio tools.',
    from: 'Client',
    to: 'Freelancer',
    Icon: User,
  };
};

const RouteLoadingFallback = ({ label = 'Loading portal…' }) => (
  <div className="flex h-[100dvh] w-full items-center justify-center bg-[#050505] text-indigo-500">
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm font-semibold text-white">{label}</span>
    </div>
  </div>
);

const renderLazyRoute = (element, label) => (
  <Suspense fallback={<RouteLoadingFallback label={label} />}>
    {element}
  </Suspense>
);

const RoleSwitchOverlay = ({ targetRole, stage }) => {
  if (!targetRole) return null;

  const copy = getRoleSwitchCopy(targetRole);
  const Icon = copy.Icon;
  const steps = [
    { id: 'preparing', label: 'Preparing' },
    { id: 'syncing', label: 'Syncing' },
    { id: 'opening', label: 'Opening' },
  ];
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === stage));
  const progressWidth = `${Math.min(100, ((activeIndex + 1) / steps.length) * 100)}%`;

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-6 text-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.32),_inset_0_2px_4px_rgba(255,255,255,0.75)] dark:border-white/[0.08] dark:bg-slate-950/95 dark:text-white dark:shadow-[0_28px_80px_rgba(0,0,0,0.48),_inset_0_1px_2px_rgba(255,255,255,0.08)]"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <motion.span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.22)] dark:bg-white dark:text-slate-950"
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowLeftRight size={21} strokeWidth={2.5} />
            </motion.span>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {copy.from} to {copy.to}
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                {copy.title}
              </h2>
            </div>
          </div>

          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            {steps[activeIndex]?.label || 'Working'}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
            <Icon size={20} strokeWidth={2.5} />
          </span>
          <p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            {copy.body}
          </p>
        </div>

        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-slate-950 dark:bg-white"
              initial={{ width: '12%' }}
              animate={{ width: progressWidth }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((step, index) => {
              const isDone = index <= activeIndex;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  <span
                    className={[
                      'h-2.5 w-2.5 rounded-full transition-colors duration-300',
                      isDone ? 'bg-slate-950 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800',
                    ].join(' ')}
                  />
                  <span className={isDone ? 'text-slate-700 dark:text-slate-200' : ''}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Helper Wrappers ---
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

        <h1 className="text-2xl font-black text-gray-950 dark:text-white">
          Parent approval
        </h1>

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
            onClick={() => {
              window.location.href = PARENT_PORTAL_URL;
            }}
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

const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex items-center justify-center text-indigo-500">
      <Loader2 className="animate-spin w-10 h-10" />
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleSwitching, setRoleSwitching] = useState(null);
  const [roleSwitchStage, setRoleSwitchStage] = useState(null);
  const completingPendingSignupRef = useRef(false);
  const locationRef = useRef(location);
  const userRef = useRef(null);
  const lastPageViewKeyRef = useRef(null);
  const lastSessionSyncKeyRef = useRef(null);
  const lastSessionSyncResultRef = useRef(null);
  const inFlightSessionSyncRef = useRef(null);
  const dashboardReadyRef = useRef(false);
  const dashboardReadyResolveRef = useRef(null);
  const portalMode = getPortalMode();

  const navigateToPortalTarget = useCallback((target, options = {}) => {
    if (isExternalTarget(target)) {
      window.location.href = target;
      return;
    }

    navigate(target, options);
  }, [navigate]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Instant Scroll Restoration
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;

    const pageViewKey = `${portalMode}:${location.pathname}${location.search || ''}`;
    if (lastPageViewKeyRef.current === pageViewKey) return;
    lastPageViewKeyRef.current = pageViewKey;

    const currentUser = userRef.current;

    void trackAnalyticsEvent('page_view', {
      eventType: 'page_view',
      path: `${location.pathname}${location.search || ''}`,
      portal: portalMode,
      metadata: {
        authenticated: Boolean(currentUser?.id),
        role: currentUser?.profileRole || null,
      },
    });
  }, [loading, location.pathname, location.search, portalMode]);

  // Smart routing
  const setView = (viewName) => {
    switch (viewName) {
      case 'home':
      case 'about':
      case 'about us':
      case 'faq':
      case 'safety':
        window.location.href = 'https://teenversehub.in';
        break;

      case 'parent-login':
      case 'parent-dashboard':
      case 'parent portal':
        window.location.href = PARENT_PORTAL_URL;
        break;

      case 'auth':
        navigate('/');
        break;

      case 'dashboard':
        navigateToPortalTarget(getPrimaryDashboardPath(user));
        break;

      case 'legal':
        window.location.href = 'http://teenversehub.in/legal#official-documents';
        break;

      case 'admin':
        window.location.href = ADMIN_PORTAL_URL;
        break;

      default:
        navigate('/');
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

    navigateToPortalTarget(getPrimaryDashboardPath(user));
  }, [navigateToPortalTarget, user]);

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

  const markDashboardReady = useCallback(() => {
    dashboardReadyRef.current = true;

    if (dashboardReadyResolveRef.current) {
      dashboardReadyResolveRef.current();
      dashboardReadyResolveRef.current = null;
    }
  }, []);

  const waitForDashboardReady = useCallback((timeoutMs = 5000) => new Promise((resolve) => {
    if (dashboardReadyRef.current) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      dashboardReadyResolveRef.current = null;
      resolve();
    }, timeoutMs);

    dashboardReadyResolveRef.current = () => {
      window.clearTimeout(timeout);
      resolve();
    };
  }), []);

  const handleSession = useCallback(async function handleSessionImpl(session) {
    const currentPath = locationRef.current.pathname;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';

    const isPublic = publicRoutePrefixes.some(
      (path) => currentPath === path || currentPath.startsWith(path + '/')
    );
    const isAuthPage = [
      '/',
      '/login',
      '/signup',
      '/individual/login',
      '/individual/signup',
    ].includes(currentPath);

    const isTermsPage = currentPath.startsWith('/termsagreement');

    const isInRouteGroup = (prefixes) => prefixes.some(
      (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
    );

    const redirectToRoleHome = (target, routeGroup) => {
      if (isTermsPage) return;
      if (isPublic && currentPath !== '/') return;

      if (isExternalTarget(target)) {
        window.location.href = target;
        return;
      }

      if (currentPath === '/' || !isInRouteGroup(routeGroup)) {
        navigate(target, { replace: true });
      }
    };

      if (!session) {
        setUser(null);

        if (!isPublic) {
          navigate('/', { replace: true });
        }

        setLoading(false);
        return { status: 'signed_out' };
    }

    const u = session.user;

    try {
      let completedPendingSignup = false;
      const pendingProfile = getPendingSignupProfileForUser(u);
      const pendingMatchesUser =
        pendingProfile?.email?.toLowerCase?.() === u.email?.toLowerCase?.();

      if (pendingMatchesUser && pendingProfile?.phone && !completingPendingSignupRef.current) {
        completingPendingSignupRef.current = true;

        try {
          const { data, error } = await supabase.functions.invoke('complete-signup', {
            body: buildPendingSignupPayload(pendingProfile),
          });

          if (error || !data?.success) {
            throw new Error(data?.error || 'Profile completion failed');
          }

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

      const {
        profile: existingProfile,
        legacy: existingLegacy,
        parentMatch,
      } = await getAuthBootstrap(u);

      if (!hasCompletedAppOnboarding({
        profile: existingProfile,
        legacy: existingLegacy,
        parentMatch,
      })) {
        setUser(null);
        if (!isAuthPage && !isPublic) {
          navigate('/signup', { replace: true });
        }
        setLoading(false);
        return { status: 'onboarding_required', user: u };
      }

      let profile = existingProfile;
      let legacy = existingLegacy;

      if (!profile) {
        const ensuredAccount = await ensureIndividualProfile(u);
        profile = ensuredAccount.profile;
        legacy = ensuredAccount.legacy;
      }

      if (!profile) {
        throw new Error('Unable to load or create profile.');
      }

      const savedDashboardRole = getDashboardRolePreference();
      const preferredDashboardRole = savedDashboardRole || resolveProfileDashboardRole({
        profileRole: profile.role,
        hasClient: Boolean(legacy.client),
        hasFreelancer: Boolean(legacy.freelancer),
      });
      if (!savedDashboardRole && preferredDashboardRole) {
        setDashboardRolePreference(preferredDashboardRole);
      }
      const baseRedirectPath = getRedirectPathForPortal({
        portalMode,
        profile,
        legacy,
      });
      const finalRedirectPath = getRolePreferredDashboardPath({
        portalMode,
        preferredRole: preferredDashboardRole,
        legacy,
        fallback: baseRedirectPath,
      });

      const parentRedirectPath = PARENT_PORTAL_URL;

      if (import.meta.env.DEV) {
        console.info('[TeenVerseHub portal routing]', {
          portalMode,
          hostname,
          userEmail: u.email,
          profileRole: profile.role,
          businessProfileExists: false,
          preferredDashboardRole,
          finalRedirectPath: profile.role === 'guardian' || parentMatch ? parentRedirectPath : finalRedirectPath,
        });
      }

      if (profile.role === 'guardian' || parentMatch) {
        window.location.href = parentRedirectPath;
        return { status: 'redirecting', target: parentRedirectPath };
      }

      let sessionUser = buildSessionUser(u, profile, legacy, {
        portalMode,
        portalHomePath: finalRedirectPath,
        activeDashboardRole: preferredDashboardRole,
      });

      if (profile.role === 'student' && legacy.freelancer) {
        const normalized = normalizeExpiredSubscription(legacy.freelancer);

        if (normalized !== legacy.freelancer) {
          try {
            const { error: normalizeError } = await supabase.rpc(
              'normalize_freelancer_subscription',
              { p_user_id: u.id }
            );

            if (normalizeError) {
              console.warn('Subscription refresh failed:', normalizeError);
            }
          } catch (err) {
            console.warn('Subscription refresh failed:', err);
          }
        }

        sessionUser = buildSessionUser(
          u,
          profile,
          {
            ...legacy,
            freelancer: normalized,
          },
          {
            portalMode,
            portalHomePath: finalRedirectPath,
            activeDashboardRole: preferredDashboardRole,
          }
        );
      }

      setUser(sessionUser);

      if (completedPendingSignup && !isTermsPage) {
        navigate('/termsagreement', { replace: true });
      } else {
        redirectToRoleHome(
          finalRedirectPath,
          getRouteGroupForTarget({
            target: finalRedirectPath,
          })
        );
      }

      setLoading(false);
      return { status: 'ready', user: sessionUser };
    } catch (err) {
      console.error('Profile Error:', err);
      setUser(null);

      if (!isPublic) {
        navigate('/', { replace: true });
      }

      showToast('Could not load your profile. Please try again.', 'error');
      setLoading(false);
      return { status: 'error', message: 'Could not load your profile. Please try again.' };
    }
  }, [navigate, portalMode, showToast]);

  const getSessionSyncKey = useCallback((session) => {
    if (!session?.user?.id) {
      return `signed-out:${portalMode}`;
    }

    const preferredRole = getDashboardRolePreference() || 'default';
    return `${portalMode}:${session.user.id}:${preferredRole}`;
  }, [portalMode]);

  const syncSessionOnce = useCallback((session) => {
    const key = getSessionSyncKey(session);

    if (inFlightSessionSyncRef.current?.key === key) {
      return inFlightSessionSyncRef.current.promise;
    }

    if (lastSessionSyncKeyRef.current === key) {
      return Promise.resolve(lastSessionSyncResultRef.current);
    }

    const promise = Promise.resolve(handleSession(session))
      .then((result) => {
        lastSessionSyncKeyRef.current = key;
        lastSessionSyncResultRef.current = result;
        return result;
      })
      .finally(() => {
        if (inFlightSessionSyncRef.current?.key === key) {
          inFlightSessionSyncRef.current = null;
        }
      });

    inFlightSessionSyncRef.current = { key, promise };
    return promise;
  }, [getSessionSyncKey, handleSession]);

  const handleAuthSessionReady = useCallback(
    (session) => syncSessionOnce(session),
    [syncSessionOnce],
  );

  // Auth & Session Logic
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await syncSessionOnce(session);
    };

    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSessionOnce(session);
    });

    return () => subscription.unsubscribe();
  }, [syncSessionOnce]);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
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
  const isInternPortal = portalMode === PORTAL_MODES.INTERN;

  const logout = async (message = 'Logged out successfully') => {
    await supabase.auth.signOut();
    navigate('/');
    showToast(message);
  };

  const handleSwitchDashboardRole = useCallback(async (targetRole) => {
    if (!user?.id || roleSwitching) return;

    const safeTargetRole = targetRole || getOppositeDashboardRole(user.type);
    if (safeTargetRole === user.type) return;

    const switchStartedAt = Date.now();
    dashboardReadyRef.current = false;
    setRoleSwitching(safeTargetRole);
    setRoleSwitchStage('preparing');

    try {
      const switchResult = await ensureDashboardRole(safeTargetRole);
      setRoleSwitchStage('syncing');

      const { profile, legacy } = await ensureIndividualProfile(user);
      const mergedLegacy = mergeRoleSwitchLegacy(legacy, switchResult);
      const targetPath = getRolePreferredDashboardPath({
        portalMode,
        preferredRole: safeTargetRole,
        legacy: mergedLegacy,
        fallback: safeTargetRole === DASHBOARD_ROLES.CLIENT ? '/client-dashboard' : '/dashboard',
      });
      const nextUser = buildSessionUser(user, profile, mergedLegacy, {
        portalMode,
        portalHomePath: targetPath,
        activeDashboardRole: safeTargetRole,
      });

      setDashboardRolePreference(safeTargetRole);
      lastSessionSyncKeyRef.current = null;
      flushSync(() => {
        setUser(nextUser);
        setRoleSwitchStage('opening');
      });
      navigateToPortalTarget(targetPath, { replace: true });

      const elapsed = Date.now() - switchStartedAt;
      await Promise.all([
        wait(Math.max(220, MIN_ROLE_SWITCH_MS - elapsed)),
        waitForDashboardReady(),
      ]);

      showToast(
        safeTargetRole === DASHBOARD_ROLES.CLIENT
          ? 'Client dashboard unlocked.'
          : 'Freelancer dashboard unlocked.',
        'success',
      );
    } catch (error) {
      showToast(error?.message || 'Could not switch dashboard right now.', 'error');
    } finally {
      await wait(180);
      setRoleSwitching(null);
      setRoleSwitchStage(null);
    }
  }, [navigateToPortalTarget, portalMode, roleSwitching, showToast, user, waitForDashboardReady]);

  const dashboardProps = {
    user,
    setUser,
    onLogout: () => logout(),
    showToast,
    darkMode,
    toggleTheme,
    onSwitchDashboardRole: handleSwitchDashboardRole,
    roleSwitching,
    onDashboardReady: markDashboardReady,
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <AnimatePresence>
        {roleSwitching && (
          <RoleSwitchOverlay
            targetRole={roleSwitching}
            stage={roleSwitchStage}
          />
        )}
      </AnimatePresence>

      <Routes>
        {/* Root login/auth */}
        <Route
          path="/"
          element={
              <Auth
                setView={setView}
                onLogin={(msg) => showToast(msg)}
                onSessionReady={handleAuthSessionReady}
              />
          }
        />

        <Route
          path="/login"
          element={
              <Auth
                key="individual-login"
                setView={setView}
                onLogin={(msg) => showToast(msg)}
                onSessionReady={handleAuthSessionReady}
                initialMode="login"
                signupRole="freelancer"
                lockSignupRole
            />
          }
        />

        <Route
          path="/signup"
          element={
              <Auth
                key="individual-signup"
                setView={setView}
                onLogin={(msg) => showToast(msg)}
                onSessionReady={handleAuthSessionReady}
                initialMode="signup"
                signupRole="freelancer"
                lockSignupRole
            />
          }
        />

        <Route path="/individual/login" element={<Navigate to="/login" replace />} />
        <Route path="/individual/signup" element={<Navigate to="/signup" replace />} />

        {/* Legal & parent approval */}
        <Route path="/legal" element={<LegalWrapper />} />
        <Route path="/termsagreement" element={<TermsAgreement onAgree={handleTermsAccepted} />} />
        <Route path="/parent-approval" element={<ParentApprovalWrapper />} />

        <Route
          path="/opportunities"
          element={renderLazyRoute(
            <PublicOpportunityList portalMode={portalMode} />,
            'Loading opportunities',
          )}
        />

        <Route
          path="/opportunities/:id"
          element={renderLazyRoute(
            <OpportunityDetailApply user={user} portalMode={portalMode} />,
            'Loading opportunity',
          )}
        />

        <Route
          path="/my-applications"
          element={
            user?.id
              ? renderLazyRoute(
                <MyOpportunityApplications userId={user.id} />,
                'Loading applications',
              )
              : <Navigate to="/login" replace />
          }
        />

        <Route path="/admin" element={<ExternalRedirect to={ADMIN_PORTAL_URL} />} />
        <Route path="/admin/dashboard/*" element={<ExternalRedirect to={ADMIN_PORTAL_URL} />} />

        {/* Client dashboard stays on the app portal. Intern users redirect externally when needed. */}
        <Route
          path="/client-dashboard/*"
          element={
            isInternPortal && user?.type === 'client' ? (
              <ExternalRedirect to={`${PORTAL_URLS.app}/client-dashboard`} />
            ) : user?.type === 'client' ? (
              renderLazyRoute(
                <ClientDashboard {...dashboardProps} />,
                'Loading client dashboard',
              )
            ) : user?.type === 'freelancer' ||
              user?.profileRole === 'student' ||
              user?.profileRole === 'intern' ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Shared /dashboard route: individual dashboard on app/intern. */}
        <Route
          path="/dashboard/*"
          element={
            user?.profileRole === 'guardian' ? (
              <ExternalRedirect to={PARENT_PORTAL_URL} />
            ) : user?.type === 'client' ? (
              <Navigate to="/client-dashboard" replace />
            ) : user?.type === 'freelancer' ||
              user?.profileRole === 'student' ||
              user?.profileRole === 'intern' ? (
              renderLazyRoute(
                <Dashboard {...dashboardProps} />,
                'Loading dashboard',
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Suspense fallback={null}>
        <PlatformAIAssistant user={user} showToast={showToast} />
      </Suspense>
    </>
  );
}
