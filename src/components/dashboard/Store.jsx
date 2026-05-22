import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../supabase';

/* ─── constants ─────────────────────────────────────────────────────────────── */

const HUBBLE_ORIGINS = {
  development: 'https://sdk.dev.myhubble.money',
  production:  'https://sdk.myhubble.money',
};

const LOADING_OVERLAY_TIMEOUT_MS = 3000;

const REQUIRED_ENV = [
  { label: 'Hubble client ID',                keys: ['VITE_HUBBLE_CLIENT_ID'] },
  { label: 'Hubble app secret',               keys: ['VITE_HUBBLE_APP_SECRET'] },
  { label: 'Supabase URL',                    keys: ['VITE_SUPABASE_URL'] },
  { label: 'Supabase anon or publishable key',keys: ['VITE_SUPABASE_ANON_KEY'] },
];

const getEnvValue = (...keys) =>
  keys.map((k) => import.meta.env[k]).find(Boolean) || '';

const getExtraAllowedOrigins = () =>
  getEnvValue('VITE_HUBBLE_ALLOWED_ORIGINS')
    .split(',').map((o) => o.trim()).filter(Boolean);

const ALLOWED_HUBBLE_ORIGINS = [
  HUBBLE_ORIGINS.development,
  HUBBLE_ORIGINS.production,
  ...getExtraAllowedOrigins(),
];

const buildHubbleStoreUrl = ({ clientId, appSecret, token, env, path = '/' }) => {
  const base = env === 'development' ? HUBBLE_ORIGINS.development : HUBBLE_ORIGINS.production;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(cleanPath, `${base}/`);
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

/* ─── main component ─────────────────────────────────────────────────────────── */

const Store = ({ user, setUser }) => {
  const overlayTimerRef       = useRef(null);
  const walletRefreshTimerRef = useRef(null);

  const [isListenerReady, setIsListenerReady] = useState(false);
  const [status,          setStatus]          = useState('loading');
  const [showSoftOverlay, setShowSoftOverlay] = useState(true);
  const [errorMessage,    setErrorMessage]    = useState('');
  const [reloadKey,       setReloadKey]       = useState(0);
  const [rejectedOrigin,  setRejectedOrigin]  = useState('');
  const [tokenState, setTokenState] = useState({ token: '', received: false, loading: false, error: '' });
  const [walletState, setWalletState] = useState({
    balance: Number(user?.wallet_balance) || 0,
    loading: false, error: '',
  });

  const envConfig = useMemo(() => {
    const hubbleEnv   = getEnvValue('VITE_HUBBLE_ENV') === 'production' ? 'production' : 'development';
    const supabaseUrl = getEnvValue('VITE_SUPABASE_URL').replace(/\/$/, '');
    const clientId    = getEnvValue('VITE_HUBBLE_CLIENT_ID');
    const appSecret   = getEnvValue('VITE_HUBBLE_APP_SECRET');
    const supabaseAnonKey = getEnvValue('VITE_SUPABASE_ANON_KEY');
    const missing = REQUIRED_ENV
      .filter(({ keys }) => !keys.some((k) => import.meta.env[k]))
      .map(({ label, keys }) => `${label} (${keys.join(' or ')})`);
    return {
      env: hubbleEnv,
      clientId, appSecret, supabaseUrl, supabaseAnonKey,
      functionUrl: supabaseUrl ? `${supabaseUrl}/functions/v1/hubble-token` : '',
      missing,
    };
  }, []);

  const hasMissingEnv = envConfig.missing.length > 0;

  /* ── wallet ── */
  const refreshWalletBalance = useCallback(async () => {
    if (!user?.id) return;
    const table = user.type === 'client' ? 'clients' : 'freelancers';
    setWalletState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const { data, error } = await supabase.from(table).select('wallet_balance').eq('id', user.id).maybeSingle();
      if (error) throw error;
      const next = Number(data?.wallet_balance) || 0;
      setWalletState({ balance: next, loading: false, error: '' });
      if (setUser) setUser((u) => u?.id === user.id ? { ...u, wallet_balance: next } : u);
    } catch (e) {
      setWalletState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Refresh failed' }));
    }
  }, [setUser, user?.id, user?.type]);

  const scheduleWalletRefresh = useCallback(() => {
    if (walletRefreshTimerRef.current) clearTimeout(walletRefreshTimerRef.current);
    walletRefreshTimerRef.current = setTimeout(() => refreshWalletBalance(), 1200);
  }, [refreshWalletBalance]);

  useEffect(() => setWalletState((s) => ({ ...s, balance: Number(user?.wallet_balance) || 0 })), [user?.wallet_balance]);
  useEffect(() => { refreshWalletBalance(); }, [refreshWalletBalance, reloadKey]);

  /* ── token ── */
  const iframeUrl = useMemo(() => {
    if (hasMissingEnv || !tokenState.token) return '';
    return buildHubbleStoreUrl({
      clientId: envConfig.clientId, appSecret: envConfig.appSecret,
      token: tokenState.token, env: envConfig.env, path: '/',
    });
  }, [envConfig, hasMissingEnv, tokenState.token]);

  useEffect(() => {
    if (hasMissingEnv) return;
    const controller = new AbortController();
    const fetch_ = async () => {
      setStatus('token_loading'); setErrorMessage('');
      setTokenState({ token: '', received: false, loading: true, error: '' });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || envConfig.supabaseAnonKey;
        const res = await fetch(envConfig.functionUrl, {
          method: 'POST', signal: controller.signal,
          headers: { apikey: envConfig.supabaseAnonKey, Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || body?.error || `Token request failed (${res.status})`);
        if (!body?.token) throw new Error('Response missing token');
        setTokenState({ token: body.token, received: true, loading: false, error: '' });
        setStatus('token_ready');
      } catch (e) {
        if (e.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'SSO token request failed.';
        setTokenState({ token: '', received: false, loading: false, error: msg });
        setStatus('error'); setShowSoftOverlay(false); setErrorMessage(msg);
      }
    };
    fetch_();
    return () => controller.abort();
  }, [envConfig.functionUrl, envConfig.supabaseAnonKey, hasMissingEnv, reloadKey]);

  /* ── postMessage listener ── */
  useEffect(() => {
    const markConnected = () => {
      setShowSoftOverlay(false);
      setStatus((s) => ['ready', 'error', 'closed'].includes(s) ? s : 'connected');
    };
    const handler = (event) => {
      const { data } = event;
      if (!data || typeof data !== 'object' || !['analytics', 'event', 'action'].includes(data.type)) return;
      if (!ALLOWED_HUBBLE_ORIGINS.includes(event.origin)) { setRejectedOrigin(event.origin); return; }
      setRejectedOrigin('');
      if (data.type === 'event' || data.type === 'analytics') { scheduleWalletRefresh(); markConnected(); return; }
      if (data.type === 'action') {
        if (data.action === 'app_ready') { setStatus('ready'); setShowSoftOverlay(false); setErrorMessage(''); scheduleWalletRefresh(); return; }
        if (data.action === 'error')     { setStatus('error'); setShowSoftOverlay(false); setErrorMessage(data.message || 'Store error.'); return; }
        if (data.action === 'close')     { setStatus('closed'); setShowSoftOverlay(false); }
      }
    };
    window.addEventListener('message', handler);
    const t1 = setTimeout(() => setIsListenerReady(true), 0);
    overlayTimerRef.current = setTimeout(() => setShowSoftOverlay(false), LOADING_OVERLAY_TIMEOUT_MS);
    return () => {
      clearTimeout(t1);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      if (walletRefreshTimerRef.current) clearTimeout(walletRefreshTimerRef.current);
      window.removeEventListener('message', handler);
    };
  }, [scheduleWalletRefresh]);

  /* ── helpers ── */
  const resetOverlayTimeout = () => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setShowSoftOverlay(true);
    overlayTimerRef.current = setTimeout(() => setShowSoftOverlay(false), LOADING_OVERLAY_TIMEOUT_MS);
  };

  const reloadStore = () => {
    setStatus('loading'); setErrorMessage(''); setRejectedOrigin('');
    resetOverlayTimeout(); refreshWalletBalance();
    setReloadKey((k) => k + 1);
  };

  const openStoreInNewTab = () => {
    if (!iframeUrl) return;
    window.open(iframeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleIframeLoad = () => {
    setShowSoftOverlay(false);
    setStatus((s) => (s === 'loading' || s === 'token_ready') ? 'iframe_loaded' : s);
  };

  const shouldShowIframe  = isListenerReady && Boolean(iframeUrl) && tokenState.received && status !== 'closed' && status !== 'error';
  const showBlockingOverlay = shouldShowIframe && ['loading', 'token_loading', 'token_ready'].includes(status) && showSoftOverlay;

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{css}</style>
      <div className="hs-root">

        {/* ── header ── */}
        <header className="hs-header">
          <div className="hs-header-left">
            <ShoppingBag size={15} strokeWidth={2} className="hs-wordmark-icon" />
            <span className="hs-wordmark">Hubble Store</span>
          </div>

          <div className="hs-header-right">
            <div className={`hs-wallet${walletState.loading ? ' hs-wallet-syncing' : ''}`}>
              <Wallet size={13} strokeWidth={2} />
              <span>{formatCurrency(walletState.balance)}</span>
              {walletState.loading && <Loader2 size={11} className="hs-spin" />}
            </div>

            <div className="hs-actions">
              <button className="hs-btn" onClick={refreshWalletBalance} disabled={walletState.loading} title="Sync wallet">
                <Wallet size={13} strokeWidth={2} />
              </button>
              <button className="hs-btn" onClick={reloadStore} disabled={hasMissingEnv || tokenState.loading} title="Reload">
                <RefreshCw size={13} strokeWidth={2} />
              </button>
              <button className="hs-btn hs-btn-hi" onClick={openStoreInNewTab} disabled={!iframeUrl} title="Open full screen">
                <ArrowUpRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        {/* ── canvas ── */}
        <main className="hs-canvas">
          {hasMissingEnv && (
            <Blocker
              icon={<AlertCircle size={20} strokeWidth={1.5} />}
              title="Not configured"
              body={`Missing: ${envConfig.missing.join(', ')}`}
              tone="error"
            />
          )}

          {!hasMissingEnv && tokenState.loading && !shouldShowIframe && (
            <Blocker
              icon={<Loader2 size={20} strokeWidth={1.5} className="hs-spin" />}
              title="Connecting"
              tone="neutral"
            />
          )}

          {!hasMissingEnv && status === 'error' && (
            <Blocker
              icon={<XCircle size={20} strokeWidth={1.5} />}
              title="Something went wrong"
              body={errorMessage}
              tone="error"
              action={{ label: 'Retry', onClick: reloadStore }}
            />
          )}

          {!hasMissingEnv && status === 'closed' && (
            <Blocker
              icon={<Sparkles size={20} strokeWidth={1.5} />}
              title="Store closed"
              tone="neutral"
              action={{ label: 'Reopen', onClick: reloadStore }}
            />
          )}

          {shouldShowIframe && (
            <div className="hs-iframe-wrap">
              {showBlockingOverlay && (
                <div className="hs-iframe-overlay">
                  <Loader2 size={22} strokeWidth={1.5} className="hs-spin" />
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

      </div>
    </>
  );
};

/* ─── sub-components ──────────────────────────────────────────────────────── */

const Blocker = ({ icon, title, body, tone, action }) => (
  <div className={`hs-blocker hs-blocker-${tone}`}>
    <div className="hs-blocker-icon">{icon}</div>
    <p className="hs-blocker-title">{title}</p>
    {body && <p className="hs-blocker-body">{body}</p>}
    {action && (
      <button className="hs-blocker-btn" onClick={action.onClick}>
        <RotateCcw size={12} strokeWidth={2} /> {action.label}
      </button>
    )}
  </div>
);

/* ─── styles ──────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .hs-root {
    --bg:         #f6f7fb;
    --surface:    #ffffff;
    --border:     rgba(15,23,42,0.09);
    --border-hi:  rgba(15,23,42,0.16);
    --text:       #111827;
    --muted:      #64748b;
    --subtle:     #94a3b8;
    --chip:       rgba(15,23,42,0.04);
    --chip-hover: rgba(15,23,42,0.08);
    --hi-bg:      rgba(79,70,229,0.07);
    --hi-border:  rgba(79,70,229,0.18);
    --hi-color:   #4f46e5;
    --hi-hover-bg:    rgba(79,70,229,0.12);
    --hi-hover-border:rgba(79,70,229,0.32);
    --hi-hover-color: #312e81;
    --error-bg:   rgba(225,29,72,0.06);
    --error-border:rgba(225,29,72,0.22);
    --error-color:#e11d48;
    --overlay:    rgba(248,250,252,0.88);
    --shadow:     0 16px 40px rgba(15,23,42,0.09);
    --r:          14px;
    --r-lg:       20px;
    --r-xl:       22px;
    font-family: 'Syne', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* dark mode */
  @media (prefers-color-scheme: dark) {
    .hs-root {
      --bg:         #0a0a0b;
      --surface:    #111113;
      --border:     rgba(255,255,255,0.07);
      --border-hi:  rgba(255,255,255,0.13);
      --text:       #f0f0f2;
      --muted:      #9ca3af;
      --subtle:     #4b5563;
      --chip:       rgba(255,255,255,0.04);
      --chip-hover: rgba(255,255,255,0.08);
      --hi-bg:      rgba(232,224,255,0.06);
      --hi-border:  rgba(232,224,255,0.14);
      --hi-color:   #c4b5fd;
      --hi-hover-bg:    rgba(232,224,255,0.12);
      --hi-hover-border:rgba(232,224,255,0.30);
      --hi-hover-color: #ffffff;
      --error-bg:   rgba(244,63,94,0.07);
      --error-border:rgba(244,63,94,0.24);
      --error-color:#f43f5e;
      --overlay:    rgba(10,10,11,0.86);
      --shadow:     none;
    }
  }

  /* ── header ── */
  .hs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 18px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 40;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hs-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hs-wordmark-icon { color: var(--muted); }
  .hs-wordmark {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--text);
  }
  .hs-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* wallet chip */
  .hs-wallet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'DM Mono', monospace;
    padding: 5px 11px;
    border-radius: 99px;
    border: 1px solid var(--border-hi);
    background: var(--chip);
    color: var(--text);
    letter-spacing: 0.01em;
    transition: opacity 0.2s;
  }
  .hs-wallet-syncing { opacity: 0.45; }

  /* action buttons */
  .hs-actions { display: flex; gap: 5px; }
  .hs-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: var(--r);
    border: 1px solid var(--border);
    background: var(--chip);
    color: var(--muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
  }
  .hs-btn:hover:not(:disabled) {
    background: var(--chip-hover);
    color: var(--text);
    border-color: var(--border-hi);
  }
  .hs-btn:active:not(:disabled) { transform: scale(0.92); }
  .hs-btn:disabled { opacity: 0.28; cursor: not-allowed; }

  .hs-btn-hi {
    background: var(--hi-bg);
    border-color: var(--hi-border);
    color: var(--hi-color);
  }
  .hs-btn-hi:hover:not(:disabled) {
    background: var(--hi-hover-bg);
    border-color: var(--hi-hover-border);
    color: var(--hi-hover-color);
  }

  /* ── canvas ── */
  .hs-canvas {
    flex: 1;
    position: relative;
    background: var(--bg);
  }

  /* ── iframe ── */
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
    border-radius: var(--r-xl);
    background: var(--overlay);
    backdrop-filter: blur(18px);
    color: var(--muted);
  }
  .hs-iframe {
    width: 100%;
    height: 72dvh;
    min-height: 600px;
    border-radius: var(--r-xl);
    border: 1px solid var(--border);
    display: block;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  /* ── blocker ── */
  .hs-blocker {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 540px;
    padding: 40px 24px;
    text-align: center;
  }
  .hs-blocker-icon {
    width: 48px; height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-lg);
    border: 1px solid var(--border);
    background: var(--chip);
    color: var(--muted);
    margin-bottom: 4px;
  }
  .hs-blocker-error .hs-blocker-icon {
    border-color: var(--error-border);
    background: var(--error-bg);
    color: var(--error-color);
  }
  .hs-blocker-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
    letter-spacing: -0.01em;
  }
  .hs-blocker-body {
    font-size: 11px;
    color: var(--muted);
    max-width: 320px;
    line-height: 1.6;
    margin: 0;
    font-family: 'DM Mono', monospace;
  }
  .hs-blocker-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding: 8px 16px;
    border-radius: var(--r);
    border: 1px solid var(--border-hi);
    background: var(--chip);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .hs-blocker-btn:hover  { background: var(--chip-hover); }
  .hs-blocker-btn:active { transform: scale(0.96); }

  /* ── spin ── */
  .hs-spin { animation: _spin 0.85s linear infinite; }
  @keyframes _spin { to { transform: rotate(360deg); } }
`;

export default Store;