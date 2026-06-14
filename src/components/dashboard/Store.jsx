import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
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
  { label: 'Supabase URL', keys: ['VITE_SUPABASE_URL'] },
  { label: 'Supabase anon or publishable key', keys: ['VITE_SUPABASE_ANON_KEY'] },
];

const getEnvValue = (...keys) =>
  keys.map((key) => import.meta.env[key]).find(Boolean) || '';

const getExtraAllowedOrigins = () =>
  getEnvValue('VITE_HUBBLE_ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeEnv = (value) => (value === 'production' ? 'production' : 'development');

const buildHubbleStoreUrl = ({ clientId, token, origin, path = '/' }) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(cleanPath, `${origin}/`);

  url.searchParams.set('clientId', clientId);
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
    clientId: '',
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
    if (hasMissingEnv || !tokenState.token || !tokenState.clientId) return '';

    return buildHubbleStoreUrl({
      clientId: tokenState.clientId,
      token: tokenState.token,
      origin: envConfig.hubbleOrigin,
      path: '/',
    });
  }, [envConfig.hubbleOrigin, hasMissingEnv, tokenState.clientId, tokenState.token]);

  useEffect(() => {
    if (hasMissingEnv) return undefined;

    const controller = new AbortController();

    const fetchToken = async () => {
      setStatus('token_loading');
      setErrorMessage('');
      setTokenState({ token: '', clientId: '', received: false, loading: true, error: '', expiresAt: null });

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

        if (!body?.clientId) {
          throw new Error('Hubble token response did not include a client ID.');
        }

        const expiresIn = Number(body.expiresIn || 60);
        setTokenState({
          token: body.token,
          clientId: body.clientId,
          received: true,
          loading: false,
          error: '',
          expiresAt: Date.now() + expiresIn * 1000,
        });
        setStatus('token_ready');
      } catch (error) {
        if (error?.name === 'AbortError') return;

        const message = error instanceof Error ? error.message : 'Hubble SSO token request failed.';
        setTokenState({ token: '', clientId: '', received: false, loading: false, error: message, expiresAt: null });
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
              <p className="hs-subtitle">Wallet balance and redemptions</p>
            </div>
          </div>

          <div className="hs-header-right">
            <div className={`hs-wallet${walletState.loading ? ' hs-wallet-syncing' : ''}`}>
              <Wallet size={14} strokeWidth={2.3} />
              <span>{formatCurrency(walletState.balance)}</span>
              {walletState.loading && <Loader2 size={12} className="hs-spin" />}
            </div>

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
              icon={<ShoppingBag size={22} strokeWidth={1.7} />}
              title="Store closed"
              body="Open it again whenever you want to redeem."
              tone="neutral"
              action={{ label: 'Reopen', onClick: reloadStore }}
            />
          )}

          {shouldShowIframe && (
            <div className="hs-iframe-wrap">
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
                ['Client ID', maskValue(tokenState.clientId)],
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
  .hs-root {
    --hs-bg: #f8fafc;
    --hs-surface: #ffffff;
    --hs-surface-solid: #ffffff;
    --hs-card: #f1f5f9;
    --hs-card-hover: #e2e8f0;
    --hs-border: #e2e8f0;
    --hs-border-hi: #cbd5e1;
    --hs-text: #0f172a;
    --hs-muted: #64748b;
    --hs-faint: #94a3b8;
    --hs-primary: #334155;
    --hs-primary-hi: #0f172a;
    --hs-success: #16a34a;
    --hs-danger: #e11d48;
    --hs-danger-soft: #fff1f2;
    --hs-overlay: rgba(248,250,252,0.92);
    --hs-shadow: 0 1px 2px rgba(15,23,42,0.06);
    --hs-r: 8px;
    --hs-r-lg: 10px;
    --hs-r-xl: 10px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: var(--hs-text);
    background: var(--hs-bg);
  }

  .dark .hs-root {
    --hs-bg: #020617;
    --hs-surface: #0f172a;
    --hs-surface-solid: #0f172a;
    --hs-card: #111827;
    --hs-card-hover: #1e293b;
    --hs-border: #1e293b;
    --hs-border-hi: #334155;
    --hs-text: #f8fafc;
    --hs-muted: #94a3b8;
    --hs-faint: #64748b;
    --hs-primary: #cbd5e1;
    --hs-primary-hi: #f8fafc;
    --hs-success: #4ade80;
    --hs-danger: #fb7185;
    --hs-danger-soft: rgba(251,113,133,0.12);
    --hs-overlay: rgba(2,6,23,0.90);
    --hs-shadow: 0 1px 2px rgba(0,0,0,0.24);
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
    padding: 14px 18px;
    border-bottom: 1px solid var(--hs-border);
    background: var(--hs-surface);
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
    border-radius: var(--hs-r);
    color: var(--hs-text);
    background: var(--hs-card);
    border: 1px solid var(--hs-border);
  }
  .hs-wordmark {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0;
    color: var(--hs-text);
  }
  .hs-subtitle {
    margin: 3px 0 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--hs-muted);
  }

  .hs-wallet,
  .hs-btn {
    border: 1px solid var(--hs-border-hi);
    background: var(--hs-card);
  }
  .hs-wallet {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 11px;
    border-radius: var(--hs-r);
    color: var(--hs-text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 650;
    transition: opacity 0.2s;
  }
  .hs-wallet-syncing { opacity: 0.55; }

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
    transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
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
    background: var(--hs-card);
    border-color: var(--hs-border-hi);
  }
  .hs-btn-hi:hover:not(:disabled) {
    color: var(--hs-primary-hi);
    background: var(--hs-card-hover);
  }

  .hs-canvas {
    flex: 1;
    position: relative;
  }
  .hs-iframe-wrap {
    position: relative;
    padding: 14px;
  }
  .hs-iframe-overlay {
    position: absolute;
    inset: 14px;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--hs-r-xl);
    background: var(--hs-overlay);
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
    font-family: inherit;
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
    font-family: inherit;
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
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0;
    text-transform: uppercase;
  }
  .hs-metric-value {
    color: var(--hs-text);
    font-family: inherit;
    font-size: 11px;
    font-weight: 650;
  }

  .hs-debug {
    border-top: 1px dashed var(--hs-border);
    background: var(--hs-surface);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  }
`;

export default Store;
