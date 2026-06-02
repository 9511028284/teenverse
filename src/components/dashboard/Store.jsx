import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../supabase';

const HUBBLE_ORIGINS = {
  development: 'https://sdk.dev.myhubble.money',
  production: 'https://sdk.myhubble.money',
};

const LOADING_OVERLAY_TIMEOUT_MS = 3500;
const WALLET_REFRESH_DELAY_MS = 1200;

const REQUIRED_ENV = [
  { label: 'Hubble client ID', keys: ['VITE_HUBBLE_CLIENT_ID'] },
  { label: 'Hubble app secret', keys: ['VITE_HUBBLE_APP_SECRET'] },
  { label: 'Supabase URL', keys: ['VITE_SUPABASE_URL'] },
  { label: 'Supabase anon or publishable key', keys: ['VITE_SUPABASE_ANON_KEY'] },
];

const STATUS_LABEL = {
  loading: 'Starting',
  token_loading: 'Authenticating',
  token_ready: 'Connecting',
  iframe_loaded: 'Handshaking',
  connected: 'Live',
  ready: 'Ready',
  error: 'Error',
  closed: 'Closed',
};

const STATUS_TONE = {
  ready: 'success',
  connected: 'success',
  iframe_loaded: 'warning',
  token_ready: 'warning',
  token_loading: 'warning',
  loading: 'warning',
  error: 'danger',
  closed: 'neutral',
};

const getEnvValue = (...keys) =>
  keys.map((key) => import.meta.env[key]).find(Boolean) || '';

const getExtraAllowedOrigins = () =>
  getEnvValue('VITE_HUBBLE_ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeEnv = (value) => (value === 'production' ? 'production' : 'development');

const buildHubbleStoreUrl = ({ clientId, appSecret, token, origin, path = '/' }) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(cleanPath, `${origin}/`);

  url.searchParams.set('clientId', clientId);
  url.searchParams.set('appSecret', appSecret);
  url.searchParams.set('token', token);

  return url.toString();
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeJsonStringify = (value) => {
  if (!value) return 'No events yet';

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return `Unable to render event: ${error instanceof Error ? error.message : String(error)}`;
  }
};

const maskValue = (value) => {
  if (!value) return 'missing';
  if (value.length <= 10) return 'set';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const Store = ({ user, setUser }) => {
  const overlayTimerRef = useRef(null);
  const walletRefreshTimerRef = useRef(null);

  const [isListenerReady, setIsListenerReady] = useState(false);
  const [status, setStatus] = useState('loading');
  const [showSoftOverlay, setShowSoftOverlay] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [lastEvent, setLastEvent] = useState({ origin: '', data: null });
  const [rejectedOrigin, setRejectedOrigin] = useState('');
  const [tokenState, setTokenState] = useState({
    token: '',
    received: false,
    loading: false,
    error: '',
    expiresAt: null,
  });
  const [walletState, setWalletState] = useState({
    balance: Number(user?.wallet_balance) || 0,
    loading: false,
    error: '',
    lastSyncedAt: '',
  });

  const envConfig = useMemo(() => {
    const env = normalizeEnv(getEnvValue('VITE_HUBBLE_ENV'));
    const supabaseUrl = getEnvValue('VITE_SUPABASE_URL').replace(/\/$/, '');
    const clientId = getEnvValue('VITE_HUBBLE_CLIENT_ID');
    const appSecret = getEnvValue('VITE_HUBBLE_APP_SECRET');
    const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY');
    const hubbleOrigin = HUBBLE_ORIGINS[env];
    const extraAllowedOrigins = getExtraAllowedOrigins();
    const allowedOrigins = Array.from(new Set([hubbleOrigin, ...extraAllowedOrigins]));
    const missing = REQUIRED_ENV
      .filter(({ keys }) => !keys.some((key) => import.meta.env[key]))
      .map(({ label, keys }) => `${label} (${keys.join(' or ')})`);

    return {
      env,
      hubbleOrigin,
      allowedOrigins,
      clientId,
      appSecret,
      supabaseUrl,
      supabaseAnonKey,
      functionUrl: supabaseUrl ? `${supabaseUrl}/functions/v1/hubble-token` : '',
      coinBaseUrl: supabaseUrl ? `${supabaseUrl}/functions/v1` : '',
      missing,
    };
  }, []);

  const hasMissingEnv = envConfig.missing.length > 0;

  const refreshWalletBalance = useCallback(async () => {
    if (!user?.id) return;

    const table = user.type === 'client' ? 'clients' : 'freelancers';
    setWalletState((state) => ({ ...state, loading: true, error: '' }));

    try {
      const { data, error } = await supabase
        .from(table)
        .select('wallet_balance')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const nextBalance = Number(data?.wallet_balance) || 0;
      setWalletState({
        balance: nextBalance,
        loading: false,
        error: '',
        lastSyncedAt: new Date().toLocaleTimeString(),
      });

      if (setUser) {
        setUser((currentUser) => {
          if (currentUser?.id !== user.id) return currentUser;

          const currentBalance = Number(currentUser.wallet_balance) || 0;
          if (currentBalance === nextBalance) return currentUser;

          return { ...currentUser, wallet_balance: nextBalance };
        });
      }
    } catch (error) {
      setWalletState((state) => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Wallet refresh failed',
      }));
    }
  }, [setUser, user?.id, user?.type]);

  const scheduleWalletRefresh = useCallback(() => {
    if (walletRefreshTimerRef.current) clearTimeout(walletRefreshTimerRef.current);
    walletRefreshTimerRef.current = setTimeout(refreshWalletBalance, WALLET_REFRESH_DELAY_MS);
  }, [refreshWalletBalance]);

  useEffect(() => {
    setWalletState((state) => ({
      ...state,
      balance: Number(user?.wallet_balance) || state.balance || 0,
    }));
  }, [user?.wallet_balance]);

  useEffect(() => {
    refreshWalletBalance();
  }, [refreshWalletBalance, reloadKey]);

  const iframeUrl = useMemo(() => {
    if (hasMissingEnv || !tokenState.token) return '';

    return buildHubbleStoreUrl({
      clientId: envConfig.clientId,
      appSecret: envConfig.appSecret,
      token: tokenState.token,
      origin: envConfig.hubbleOrigin,
      path: '/',
    });
  }, [envConfig, hasMissingEnv, tokenState.token]);

  useEffect(() => {
    if (hasMissingEnv) return undefined;

    const controller = new AbortController();

    const fetchToken = async () => {
      setStatus('token_loading');
      setErrorMessage('');
      setTokenState({ token: '', received: false, loading: true, error: '', expiresAt: null });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Sign in again before opening the Hubble Store.');
        }

        const response = await fetch(envConfig.functionUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            apikey: envConfig.supabaseAnonKey,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(body?.message || body?.error || `Token request failed (${response.status})`);
        }

        if (!body?.token) {
          throw new Error('Hubble token response did not include a token.');
        }

        const expiresIn = Number(body.expiresIn || 60);
        setTokenState({
          token: body.token,
          received: true,
          loading: false,
          error: '',
          expiresAt: Date.now() + expiresIn * 1000,
        });
        setStatus('token_ready');
      } catch (error) {
        if (error?.name === 'AbortError') return;

        const message = error instanceof Error ? error.message : 'Hubble SSO token request failed.';
        setTokenState({ token: '', received: false, loading: false, error: message, expiresAt: null });
        setStatus('error');
        setShowSoftOverlay(false);
        setErrorMessage(message);
      }
    };

    fetchToken();

    return () => controller.abort();
  }, [envConfig.functionUrl, envConfig.supabaseAnonKey, hasMissingEnv, reloadKey]);

  useEffect(() => {
    const markConnected = () => {
      setShowSoftOverlay(false);
      setStatus((currentStatus) =>
        ['ready', 'error', 'closed'].includes(currentStatus) ? currentStatus : 'connected',
      );
    };

    const handler = (event) => {
      const { data } = event;

      if (!data || typeof data !== 'object' || !['analytics', 'event', 'action'].includes(data.type)) {
        return;
      }

      if (!envConfig.allowedOrigins.includes(event.origin)) {
        setRejectedOrigin(event.origin);
        return;
      }

      setLastEvent({ origin: event.origin, data });
      setRejectedOrigin('');

      if (data.type === 'event' || data.type === 'analytics') {
        scheduleWalletRefresh();
        markConnected();
        return;
      }

      if (data.action === 'app_ready') {
        setStatus('ready');
        setShowSoftOverlay(false);
        setErrorMessage('');
        scheduleWalletRefresh();
        return;
      }

      if (data.action === 'error') {
        setStatus('error');
        setShowSoftOverlay(false);
        setErrorMessage(data.message || data.error || 'Hubble Store returned an error.');
        scheduleWalletRefresh();
        return;
      }

      if (data.action === 'close') {
        setStatus('closed');
        setShowSoftOverlay(false);
        scheduleWalletRefresh();
      }
    };

    window.addEventListener('message', handler);
    const readyTimer = setTimeout(() => setIsListenerReady(true), 0);
    overlayTimerRef.current = setTimeout(
      () => setShowSoftOverlay(false),
      LOADING_OVERLAY_TIMEOUT_MS,
    );

    return () => {
      clearTimeout(readyTimer);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (walletRefreshTimerRef.current) clearTimeout(walletRefreshTimerRef.current);
      window.removeEventListener('message', handler);
    };
  }, [envConfig.allowedOrigins, scheduleWalletRefresh]);

  const resetOverlayTimeout = () => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setShowSoftOverlay(true);
    overlayTimerRef.current = setTimeout(
      () => setShowSoftOverlay(false),
      LOADING_OVERLAY_TIMEOUT_MS,
    );
  };

  const reloadStore = () => {
    setStatus('loading');
    setErrorMessage('');
    setRejectedOrigin('');
    setLastEvent({ origin: '', data: null });
    resetOverlayTimeout();
    refreshWalletBalance();
    setReloadKey((key) => key + 1);
  };

  const openStoreInNewTab = () => {
    if (!iframeUrl) return;
    window.open(iframeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleIframeLoad = () => {
    setShowSoftOverlay(false);
    setStatus((currentStatus) =>
      ['loading', 'token_ready'].includes(currentStatus) ? 'iframe_loaded' : currentStatus,
    );
  };

  const shouldShowIframe =
    isListenerReady &&
    Boolean(iframeUrl) &&
    tokenState.received &&
    !['closed', 'error'].includes(status);
  const showBlockingOverlay =
    shouldShowIframe &&
    ['loading', 'token_loading', 'token_ready'].includes(status) &&
    showSoftOverlay;
  const iframeOrigin = iframeUrl ? new URL(iframeUrl).origin : envConfig.hubbleOrigin;

  return (
    <>
      <style>{css}</style>
      <div className="hs-root">
        <header className="hs-header">
          <div className="hs-header-left">
            <span className="hs-brand-icon">
              <ShoppingBag size={16} strokeWidth={2.3} />
            </span>
            <div>
              <p className="hs-wordmark">Hubble Store</p>
              <p className="hs-subtitle">Wallet balance powers every redemption</p>
            </div>
            <span className={`hs-env hs-env-${envConfig.env}`}>
              <span />
              {envConfig.env}
            </span>
          </div>

          <div className="hs-header-right">
            <div className={`hs-wallet${walletState.loading ? ' hs-wallet-syncing' : ''}`}>
              <Wallet size={14} strokeWidth={2.3} />
              <span>{formatCurrency(walletState.balance)}</span>
              {walletState.loading && <Loader2 size={12} className="hs-spin" />}
            </div>

            {!hasMissingEnv && <StatusPill status={status} />}

            <div className="hs-actions">
              <button
                className="hs-btn"
                onClick={refreshWalletBalance}
                disabled={walletState.loading}
                title="Sync wallet"
                type="button"
              >
                <Wallet size={14} strokeWidth={2.3} />
              </button>
              <button
                className="hs-btn"
                onClick={reloadStore}
                disabled={hasMissingEnv || tokenState.loading}
                title="Reload store"
                type="button"
              >
                <RefreshCw size={14} strokeWidth={2.3} />
              </button>
              <button
                className="hs-btn hs-btn-hi"
                onClick={openStoreInNewTab}
                disabled={!iframeUrl}
                title="Open full screen"
                type="button"
              >
                <ArrowUpRight size={14} strokeWidth={2.3} />
              </button>
            </div>
          </div>
        </header>

        <main className="hs-canvas">
          {hasMissingEnv && (
            <Blocker
              icon={<AlertCircle size={22} strokeWidth={1.7} />}
              title="Hubble is not configured"
              body={`Missing: ${envConfig.missing.join(', ')}`}
              tone="error"
            />
          )}

          {!hasMissingEnv && tokenState.loading && !shouldShowIframe && (
            <Blocker
              icon={<Loader2 size={22} strokeWidth={1.7} className="hs-spin" />}
              title="Authenticating with Hubble"
              body="Creating a fresh 60-second JWT for this session."
              tone="neutral"
            />
          )}

          {!hasMissingEnv && status === 'error' && (
            <Blocker
              icon={<XCircle size={22} strokeWidth={1.7} />}
              title="Store could not open"
              body={errorMessage || 'Please retry in a moment.'}
              tone="error"
              action={{ label: 'Retry', onClick: reloadStore }}
            />
          )}

          {!hasMissingEnv && status === 'closed' && (
            <Blocker
              icon={<Sparkles size={22} strokeWidth={1.7} />}
              title="Store closed"
              body="Open it again whenever you are ready to redeem."
              tone="neutral"
              action={{ label: 'Reopen', onClick: reloadStore }}
            />
          )}

          {shouldShowIframe && (
            <div className="hs-iframe-wrap">
              <div className="hs-status-float">
                <StatusPill status={status} small />
              </div>

              {showBlockingOverlay && (
                <div className="hs-iframe-overlay">
                  <Loader2 size={24} strokeWidth={1.7} className="hs-spin" />
                </div>
              )}

              <iframe
                key={reloadKey}
                src={iframeUrl}
                title="Hubble Store"
                allow="clipboard-write *"
                onLoad={handleIframeLoad}
                className="hs-iframe"
              />
            </div>
          )}
        </main>

        <footer className="hs-metrics">
          <Metric label="Balance" value={formatCurrency(walletState.balance)} />
          <Metric label="Coin rate" value="1 coin = ₹1" />
          <Metric label="SSO" value={tokenState.received ? 'JWT ready' : 'Pending'} />
          {walletState.lastSyncedAt && <Metric label="Synced" value={walletState.lastSyncedAt} />}
        </footer>

        {import.meta.env.DEV && (
          <details className="hs-debug">
            <summary className="hs-debug-toggle">Debug</summary>
            <div className="hs-debug-grid">
              {[
                ['Hubble environment', envConfig.env],
                ['Hubble iframe origin', iframeOrigin],
                ['Token received', tokenState.received ? 'yes' : 'no'],
                ['Token expires', tokenState.expiresAt ? new Date(tokenState.expiresAt).toLocaleTimeString() : '—'],
                ['Last Hubble event', lastEvent.data?.type || '—'],
                ['Rejected origin', rejectedOrigin || '—'],
                ['Supabase function URL', envConfig.functionUrl || '—'],
                ['Coin base URL', envConfig.coinBaseUrl || '—'],
                ['Client ID', maskValue(envConfig.clientId)],
                ['App secret', maskValue(envConfig.appSecret)],
              ].map(([label, value]) => (
                <div key={label} className="hs-debug-row">
                  <span className="hs-debug-label">{label}</span>
                  <span className="hs-debug-val">{value}</span>
                </div>
              ))}
            </div>
            <pre className="hs-debug-pre">{safeJsonStringify(lastEvent.data)}</pre>
          </details>
        )}
      </div>
    </>
  );
};

const StatusPill = ({ status, small = false }) => {
  const tone = STATUS_TONE[status] || 'neutral';
  const label = STATUS_LABEL[status] || status;

  return (
    <span className={`hs-status hs-status-${tone}${small ? ' hs-status-sm' : ''}`}>
      <span className="hs-status-dot" />
      {label}
    </span>
  );
};

const Metric = ({ label, value }) => (
  <div className="hs-metric">
    <span className="hs-metric-label">{label}</span>
    <span className="hs-metric-value">{value}</span>
  </div>
);

const Blocker = ({ icon, title, body, tone, action }) => (
  <div className={`hs-blocker hs-blocker-${tone}`}>
    <div className="hs-blocker-icon">{icon}</div>
    <p className="hs-blocker-title">{title}</p>
    {body && <p className="hs-blocker-body">{body}</p>}
    {action && (
      <button className="hs-blocker-btn" onClick={action.onClick} type="button">
        <RotateCcw size={13} strokeWidth={2.4} />
        {action.label}
      </button>
    )}
  </div>
);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  .hs-root {
    --hs-bg: #f8fafc;
    --hs-surface: rgba(255,255,255,0.92);
    --hs-surface-solid: #ffffff;
    --hs-card: rgba(15,23,42,0.04);
    --hs-card-hover: rgba(15,23,42,0.08);
    --hs-border: rgba(15,23,42,0.10);
    --hs-border-hi: rgba(15,23,42,0.18);
    --hs-text: #0f172a;
    --hs-muted: #64748b;
    --hs-faint: #94a3b8;
    --hs-primary: #6366f1;
    --hs-primary-hi: #4f46e5;
    --hs-teal: #0f766e;
    --hs-success: #16a34a;
    --hs-warning: #d97706;
    --hs-danger: #e11d48;
    --hs-primary-soft: rgba(99,102,241,0.10);
    --hs-teal-soft: rgba(15,118,110,0.10);
    --hs-success-soft: rgba(22,163,74,0.10);
    --hs-warning-soft: rgba(217,119,6,0.10);
    --hs-danger-soft: rgba(225,29,72,0.10);
    --hs-overlay: rgba(248,250,252,0.88);
    --hs-shadow: 0 18px 45px rgba(15,23,42,0.10);
    --hs-r: 14px;
    --hs-r-lg: 20px;
    --hs-r-xl: 22px;
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: var(--hs-text);
    background:
      linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px),
      linear-gradient(0deg, rgba(15,118,110,0.04) 1px, transparent 1px),
      var(--hs-bg);
    background-size: 28px 28px;
  }

  .dark .hs-root {
    --hs-bg: #020617;
    --hs-surface: rgba(15,23,42,0.88);
    --hs-surface-solid: #0f172a;
    --hs-card: rgba(255,255,255,0.055);
    --hs-card-hover: rgba(255,255,255,0.085);
    --hs-border: rgba(255,255,255,0.08);
    --hs-border-hi: rgba(255,255,255,0.15);
    --hs-text: #f8fafc;
    --hs-muted: #94a3b8;
    --hs-faint: #64748b;
    --hs-primary: #818cf8;
    --hs-primary-hi: #a5b4fc;
    --hs-teal: #2dd4bf;
    --hs-success: #4ade80;
    --hs-warning: #fbbf24;
    --hs-danger: #fb7185;
    --hs-primary-soft: rgba(129,140,248,0.16);
    --hs-teal-soft: rgba(45,212,191,0.12);
    --hs-success-soft: rgba(74,222,128,0.12);
    --hs-warning-soft: rgba(251,191,36,0.12);
    --hs-danger-soft: rgba(251,113,133,0.12);
    --hs-overlay: rgba(2,6,23,0.86);
    --hs-shadow: 0 20px 55px rgba(0,0,0,0.30);
  }

  .hs-header {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 13px 18px;
    border-bottom: 1px solid var(--hs-border);
    background: var(--hs-surface);
    backdrop-filter: blur(20px);
  }
  .hs-header-left,
  .hs-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .hs-brand-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    color: white;
    background: linear-gradient(135deg, var(--hs-primary), var(--hs-teal));
    box-shadow: 0 10px 26px rgba(99,102,241,0.20);
  }
  .hs-wordmark {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--hs-text);
  }
  .hs-subtitle {
    margin: 2px 0 0;
    font-size: 10px;
    font-weight: 600;
    color: var(--hs-muted);
  }
  .hs-env {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid var(--hs-border);
    background: var(--hs-card);
    color: var(--hs-muted);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .hs-env span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 8px currentColor;
  }
  .hs-env-production {
    color: var(--hs-success);
    border-color: rgba(22,163,74,0.26);
    background: var(--hs-success-soft);
  }
  .hs-env-development {
    color: var(--hs-warning);
    border-color: rgba(217,119,6,0.26);
    background: var(--hs-warning-soft);
  }

  .hs-wallet,
  .hs-status,
  .hs-btn {
    border: 1px solid var(--hs-border-hi);
    background: var(--hs-card);
  }
  .hs-wallet {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 999px;
    color: var(--hs-text);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  .hs-wallet-syncing { opacity: 0.55; }

  .hs-status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 10px;
    border-radius: 999px;
    color: var(--hs-muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .hs-status-sm {
    padding: 4px 8px;
    font-size: 9px;
  }
  .hs-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .hs-status-success {
    color: var(--hs-success);
    background: var(--hs-success-soft);
    border-color: rgba(22,163,74,0.26);
  }
  .hs-status-warning {
    color: var(--hs-warning);
    background: var(--hs-warning-soft);
    border-color: rgba(217,119,6,0.26);
  }
  .hs-status-danger {
    color: var(--hs-danger);
    background: var(--hs-danger-soft);
    border-color: rgba(225,29,72,0.26);
  }

  .hs-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .hs-btn {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--hs-r);
    color: var(--hs-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s, box-shadow 0.15s;
  }
  .hs-btn:hover:not(:disabled) {
    background: var(--hs-card-hover);
    color: var(--hs-text);
    border-color: var(--hs-border-hi);
  }
  .hs-btn:active:not(:disabled) { transform: scale(0.94); }
  .hs-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .hs-btn-hi {
    color: var(--hs-primary);
    background: var(--hs-primary-soft);
    border-color: rgba(99,102,241,0.24);
  }
  .hs-btn-hi:hover:not(:disabled) {
    color: white;
    background: linear-gradient(135deg, var(--hs-primary), var(--hs-teal));
    box-shadow: 0 12px 28px rgba(99,102,241,0.18);
  }

  .hs-canvas {
    flex: 1;
    position: relative;
  }
  .hs-iframe-wrap {
    position: relative;
    padding: 16px;
  }
  .hs-status-float {
    position: absolute;
    top: 26px;
    left: 26px;
    z-index: 10;
  }
  .hs-iframe-overlay {
    position: absolute;
    inset: 16px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--hs-r-xl);
    background: var(--hs-overlay);
    backdrop-filter: blur(18px);
    color: var(--hs-muted);
  }
  .hs-iframe {
    width: 100%;
    height: 72dvh;
    min-height: 600px;
    display: block;
    border: 1px solid var(--hs-border);
    border-radius: var(--hs-r-xl);
    background: var(--hs-surface-solid);
    box-shadow: var(--hs-shadow);
  }

  .hs-blocker {
    min-height: 560px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 24px;
    text-align: center;
  }
  .hs-blocker-icon {
    width: 54px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--hs-r-lg);
    border: 1px solid var(--hs-border);
    background: var(--hs-card);
    color: var(--hs-muted);
    margin-bottom: 4px;
  }
  .hs-blocker-error .hs-blocker-icon {
    color: var(--hs-danger);
    background: var(--hs-danger-soft);
    border-color: rgba(225,29,72,0.26);
  }
  .hs-blocker-title {
    margin: 0;
    color: var(--hs-text);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .hs-blocker-body {
    margin: 0;
    max-width: 360px;
    color: var(--hs-muted);
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
  }
  .hs-blocker-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 8px;
    padding: 9px 17px;
    border-radius: var(--hs-r);
    border: 1px solid var(--hs-border-hi);
    background: var(--hs-card);
    color: var(--hs-text);
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .hs-blocker-btn:hover { background: var(--hs-card-hover); }
  .hs-blocker-btn:active { transform: scale(0.96); }

  .hs-metrics {
    display: flex;
    flex-wrap: wrap;
    border-top: 1px solid var(--hs-border);
    background: var(--hs-surface);
    backdrop-filter: blur(18px);
  }
  .hs-metric {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 18px;
    border-right: 1px solid var(--hs-border);
  }
  .hs-metric:last-child { border-right: none; }
  .hs-metric-label {
    color: var(--hs-muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .hs-metric-value {
    color: var(--hs-text);
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
  }

  .hs-debug {
    border-top: 1px dashed var(--hs-border);
    background: var(--hs-surface);
    font-family: 'DM Mono', monospace;
  }
  .hs-debug-toggle {
    padding: 10px 18px;
    color: var(--hs-muted);
    cursor: pointer;
    list-style: none;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .hs-debug-toggle::marker,
  .hs-debug-toggle::-webkit-details-marker {
    display: none;
  }
  .hs-debug-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1px;
    border-top: 1px dashed var(--hs-border);
    background: var(--hs-border);
  }
  .hs-debug-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 14px;
    background: var(--hs-surface-solid);
  }
  .hs-debug-label {
    color: var(--hs-faint);
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .hs-debug-val {
    color: var(--hs-muted);
    font-size: 11px;
    word-break: break-all;
  }
  .hs-debug-pre {
    margin: 0;
    max-height: 220px;
    overflow: auto;
    padding: 12px 16px;
    border-top: 1px dashed var(--hs-border);
    color: var(--hs-muted);
    background: var(--hs-surface-solid);
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 11px;
    line-height: 1.7;
  }

  .hs-spin { animation: hs-spin 0.85s linear infinite; }
  @keyframes hs-spin { to { transform: rotate(360deg); } }

  @media (max-width: 720px) {
    .hs-header { align-items: flex-start; }
    .hs-header-right { width: 100%; justify-content: space-between; }
    .hs-subtitle { display: none; }
    .hs-iframe-wrap { padding: 10px; }
    .hs-iframe-overlay { inset: 10px; border-radius: 16px; }
    .hs-iframe {
      min-height: 560px;
      height: 76dvh;
      border-radius: 16px;
    }
    .hs-status-float {
      top: 18px;
      left: 18px;
    }
  }
`;

export default Store;
