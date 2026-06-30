import { supabase } from '../supabase';

const RAW_AUX_WORKER_URL = import.meta.env.VITE_AUX_WORKER_URL || '';
const AUX_WORKER_URL = RAW_AUX_WORKER_URL.replace(/\/$/, '');
const ANONYMOUS_ID_KEY = 'teenverse_aux_anonymous_id_v1';
const SENSITIVE_KEY_PATTERN = /(pan|bank|account|ifsc|aadhaar|aadhar|kyc|password|token|secret|private|prompt|message|body|chat|resume_text|document)/i;
const SENSITIVE_TEXT_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i,
  /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/,
  /\b\d{9,18}\b/,
  /\b(?:aadhaar|aadhar|pan|ifsc|account|bank|kyc)\b/i,
];

const PORTAL_BY_HOST = {
  'app.teenversehub.in': 'app',
  'intern.teenversehub.in': 'intern',
};

const PORTAL_MODE_MAP = {
  APP: 'app',
  APP_PORTAL: 'app',
  INTERN: 'intern',
  INTERN_PORTAL: 'intern',
};

export const getAuxWorkerUrl = () => AUX_WORKER_URL || null;

export const isAuxWorkerConfigured = () => Boolean(getAuxWorkerUrl());

const getPortalFromRuntime = (portal) => {
  if (portal) {
    const normalized = String(portal).trim().toUpperCase();
    return PORTAL_MODE_MAP[normalized] || String(portal).trim().toLowerCase();
  }

  if (typeof window === 'undefined') return 'app';

  const envMode = import.meta.env.VITE_PORTAL_MODE;
  if (envMode && PORTAL_MODE_MAP[String(envMode).trim().toUpperCase()]) {
    return PORTAL_MODE_MAP[String(envMode).trim().toUpperCase()];
  }

  return PORTAL_BY_HOST[window.location.hostname] || 'app';
};

const getAnonymousId = () => {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) return existing;

    const next = crypto.randomUUID();
    window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
    return next;
  } catch {
    return null;
  }
};

export const getSupabaseAccessToken = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
};

const sanitizeSearchQuery = (query) => {
  const cleanQuery = String(query || '').trim().slice(0, 300);
  if (!cleanQuery) return '';
  return SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(cleanQuery))
    ? '[redacted-sensitive-query]'
    : cleanQuery;
};

const redactSensitiveMetadata = (value, depth = 0) => {
  if (depth > 4) return '[Max depth]';
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => redactSensitiveMetadata(item, depth + 1));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 50)
        .map(([key, item]) => [
          key,
          SENSITIVE_KEY_PATTERN.test(key)
            ? '[Redacted]'
            : redactSensitiveMetadata(item, depth + 1),
        ])
    );
  }

  if (typeof value === 'string') {
    return value.slice(0, 500);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value).slice(0, 200);
};

const buildHeaders = async ({ includeAuth = true } = {}) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await getSupabaseAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const requestAux = async (path, {
  method = 'POST',
  body,
  includeAuth = true,
  signal,
} = {}) => {
  const auxWorkerUrl = getAuxWorkerUrl();
  if (!auxWorkerUrl) return null;

  const response = await fetch(`${auxWorkerUrl}${path}`, {
    method,
    headers: await buildHeaders({ includeAuth }),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Auxiliary worker request failed with ${response.status}`);
  }

  return response.json();
};

export const trackAnalyticsEvent = async (eventName, payload = {}) => {
  try {
    const portal = getPortalFromRuntime(payload.portal);
    const path = payload.path || (typeof window !== 'undefined' ? window.location.pathname : null);
    const referrer = payload.referrer || (typeof document !== 'undefined' ? document.referrer : null);

    await requestAux('/v1/analytics/event', {
      body: {
        anonymous_id: getAnonymousId(),
        portal,
        event_name: eventName,
        event_type: payload.eventType || payload.event_type || 'ui',
        path,
        referrer,
        metadata: redactSensitiveMetadata(payload.metadata || {}),
      },
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Aux analytics skipped:', error);
  }
};

export const logSearch = async (query, filters = {}, resultCount = 0, options = {}) => {
  const cleanQuery = sanitizeSearchQuery(query);
  if (!cleanQuery) return;

  try {
    await requestAux('/v1/search/log', {
      body: {
        portal: getPortalFromRuntime(options.portal),
        query: cleanQuery,
        filters: redactSensitiveMetadata(filters),
        result_count: Number.isFinite(Number(resultCount)) ? Number(resultCount) : 0,
      },
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Aux search log skipped:', error);
  }
};

export const logAiUsage = async (payload = {}) => {
  try {
    await requestAux('/v1/ai/usage', {
      body: {
        portal: getPortalFromRuntime(payload.portal),
        feature: payload.feature || 'unknown',
        model: payload.model || null,
        input_tokens: Number(payload.input_tokens || payload.inputTokens || 0),
        output_tokens: Number(payload.output_tokens || payload.outputTokens || 0),
        cost_estimate: Number(payload.cost_estimate || payload.costEstimate || 0),
        metadata: redactSensitiveMetadata(payload.metadata || {}),
      },
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Aux AI usage log skipped:', error);
  }
};

export const getPublicCachedOpportunitiesForPortal = async (portalMode, options = {}) => {
  if (!getAuxWorkerUrl()) return null;

  const portal = getPortalFromRuntime(portalMode);

  try {
    const payload = await requestAux(`/v1/opportunities/public?portal=${encodeURIComponent(portal)}`, {
      method: 'GET',
      includeAuth: false,
      signal: options.signal,
    });

    return Array.isArray(payload?.opportunities) ? payload.opportunities : [];
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Aux opportunity cache skipped:', error);
    return null;
  }
};

export const sendFeedbackMessage = async (payload = {}) => {
  try {
    const message = String(payload.message || '').trim();
    if (!message) return null;

    return await requestAux('/v1/feedback', {
      includeAuth: false,
      body: {
        portal: getPortalFromRuntime(payload.portal),
        name: payload.name || null,
        email: payload.email || null,
        message: message.slice(0, 4000),
        metadata: redactSensitiveMetadata(payload.metadata || {}),
        turnstile_token: payload.turnstile_token || payload.turnstileToken || null,
        company: payload.company || '',
        website: payload.website || '',
      },
      signal: payload.signal,
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Aux feedback skipped:', error);
    return null;
  }
};
