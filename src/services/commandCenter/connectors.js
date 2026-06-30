const memoryCache = new Map();
const connectorLog = [];

const logConnectorEvent = (connector, level, event, details = {}) => {
  connectorLog.unshift({ connector, level, event, details, createdAt: new Date().toISOString() });
  if (connectorLog.length > 250) connectorLog.length = 250;
};

export const getConnectorLog = () => [...connectorLog];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAccessToken = async () => {
  const { supabase } = await import('../../supabase');
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session?.access_token || null;
};

const fetchWithPolicy = async (url, options = {}, policy = {}) => {
  const retries = policy.retries ?? 2;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(policy.timeoutMs || 8000) });
      if (response.status === 429 && attempt < retries) {
        const retryAfter = Number(response.headers.get('retry-after')) || 2 ** attempt;
        await wait(Math.min(retryAfter * 1000, 10000));
        continue;
      }
      if (!response.ok) throw new Error(`Connector returned HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await wait(300 * (2 ** attempt));
    }
  }

  throw lastError || new Error('Connector request failed.');
};

class CommandCenterConnector {
  constructor(definition) {
    Object.assign(this, definition);
  }

  get baseUrl() {
    return import.meta.env[this.endpointEnv] || this.fallbackUrl || '';
  }

  get configured() {
    return Boolean(this.baseUrl);
  }

  async request(path = '', options = {}, cacheTtlMs = 30000) {
    if (!this.configured) {
      logConnectorEvent(this.id, 'warning', 'not_configured', { endpointEnv: this.endpointEnv });
      throw new Error(`${this.name} connector is not configured.`);
    }
    const cacheKey = `${this.id}:${path}:${options.method || 'GET'}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logConnectorEvent(this.id, 'information', 'cache_hit', { path });
      return cached.value;
    }

    try {
      const accessToken = await getAccessToken();
      const response = await fetchWithPolicy(`${this.baseUrl}${path}`, {
        ...options,
        headers: { Accept: 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers },
      });
      const value = await response.json();
      memoryCache.set(cacheKey, { value, expiresAt: Date.now() + cacheTtlMs });
      logConnectorEvent(this.id, 'success', 'request_complete', { path, status: response.status });
      return value;
    } catch (error) {
      logConnectorEvent(this.id, 'error', 'request_failed', { path, message: error.message });
      throw error;
    }
  }

  async health() {
    if (!this.configured) return { id: this.id, status: 'not_configured', latencyMs: null, message: `Set ${this.endpointEnv} to a server-side connector endpoint.` };
    if (this.id === 'supabase') return { id: this.id, status: 'healthy', latencyMs: null, message: 'Connected through the native authenticated Supabase client.' };
    const startedAt = performance.now();
    try {
      await this.request('/health', {}, 10000);
      return { id: this.id, status: 'healthy', latencyMs: Math.round(performance.now() - startedAt), message: 'Connector is responding.' };
    } catch (error) {
      return { id: this.id, status: 'error', latencyMs: Math.round(performance.now() - startedAt), message: error.message };
    }
  }
}

const AUX_WORKER_URL = import.meta.env.VITE_AUX_WORKER_URL || 'https://teenverse-aux-worker.teenversehub.workers.dev';

const definitions = [
  ['meta', 'Meta Graph API', 'VITE_META_CONNECTOR_URL', 'Social reach, engagement, reels, stories, and campaigns'],
  ['instagram', 'Instagram Insights', 'VITE_INSTAGRAM_CONNECTOR_URL', 'Audience growth and content performance'],
  ['facebook', 'Facebook Insights', 'VITE_FACEBOOK_CONNECTOR_URL', 'Page and campaign performance'],
  ['ga4', 'Google Analytics 4', 'VITE_GA4_CONNECTOR_URL', 'Visitors, sessions, traffic, and funnels'],
  ['clarity', 'Microsoft Clarity', 'VITE_CLARITY_CONNECTOR_URL', 'Heatmaps, recordings, and UX friction'],
  ['vercel', 'Vercel Analytics', 'VITE_VERCEL_ANALYTICS_CONNECTOR_URL', 'Web vitals and deployment analytics', AUX_WORKER_URL],
  ['cloudflare', 'Cloudflare Analytics', 'VITE_CLOUDFLARE_ANALYTICS_CONNECTOR_URL', 'Edge, cache, security, and traffic analytics', AUX_WORKER_URL],
  ['supabase', 'Supabase', 'VITE_SUPABASE_URL', 'Database, auth, realtime, storage, and Edge Functions'],
  ['firebase', 'Firebase', 'VITE_FIREBASE_CONNECTOR_URL', 'Firestore, messaging, and app analytics'],
  ['cashfree', 'Cashfree', 'VITE_CASHFREE_CONNECTOR_URL', 'Payments, settlements, refunds, and fees'],
  ['openai', 'OpenAI', 'VITE_OPENAI_CONNECTOR_URL', 'Model usage, tokens, cost, and latency'],
  ['gemini', 'Gemini', 'VITE_GEMINI_CONNECTOR_URL', 'Model usage, tokens, cost, and latency'],
  ['anthropic', 'Anthropic', 'VITE_ANTHROPIC_CONNECTOR_URL', 'Model usage, tokens, cost, and latency'],
  ['resend', 'Resend', 'VITE_RESEND_CONNECTOR_URL', 'Transactional email delivery'],
  ['brevo', 'Brevo', 'VITE_BREVO_CONNECTOR_URL', 'Email campaigns and deliverability'],
  ['msg91', 'MSG91', 'VITE_MSG91_CONNECTOR_URL', 'OTP delivery and abuse monitoring'],
].map(([id, name, endpointEnv, description, fallbackUrl]) => ({ id, name, endpointEnv, description, fallbackUrl, authentication: 'server-managed', supportsRefreshTokens: ['meta', 'instagram', 'facebook', 'ga4'].includes(id) }));

export const commandCenterConnectors = definitions.map((definition) => new CommandCenterConnector(definition));

export const getConnectorHealth = async () => Promise.all(commandCenterConnectors.map(async (connector) => ({
  ...connector,
  ...(await connector.health()),
})));

export const getCommandCenterTelemetry = async ({ from, to } = {}) => {
  const cloudflare = commandCenterConnectors.find((connector) => connector.id === 'cloudflare');
  if (!cloudflare?.configured) return null;

  const query = new URLSearchParams();
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  const suffix = query.size ? `?${query.toString()}` : '';

  try {
    return await cloudflare.request(`/v1/command-center/metrics${suffix}`, {}, 30000);
  } catch (error) {
    logConnectorEvent('cloudflare', 'error', 'telemetry_failed', { message: error.message });
    return null;
  }
};
