export type Portal = 'app' | 'intern' | 'business';

export interface Env {
  AUX_DB: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_JWT_ISSUER: string;
  SUPABASE_ANON_KEY?: string;
  INTERNAL_WORKER_SECRET?: string;
  AUX_WORKER_INTERNAL_SECRET?: string;
  ALLOWED_ORIGINS: string;
}

export interface AuthContext {
  userId: string;
  email?: string;
  roleClaims: Record<string, unknown>;
}

export interface RouteContext {
  env: Env;
  auth: AuthContext | null;
  corsHeaders: HeadersInit;
}

export const VALID_PORTALS = new Set<Portal>(['app', 'intern', 'business']);
export const MAX_JSON_BODY_BYTES = 64 * 1024;
export const MAX_METADATA_CHARS = 4000;
export const MAX_PAYLOAD_CHARS = 24000;

const SENSITIVE_KEY_PATTERN = /(pan|bank|account|ifsc|aadhaar|aadhar|kyc|password|token|secret|private|prompt|message|body|chat|resume_text|document)/i;
const SENSITIVE_TEXT_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i,
  /\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/,
  /\b\d{9,18}\b/,
  /\b(?:aadhaar|aadhar|pan|ifsc|account|bank|kyc)\b/i,
];
const encoder = new TextEncoder();

export const nowIso = () => new Date().toISOString();

export const jsonResponse = (
  body: unknown,
  init: ResponseInit = {},
  corsHeaders: HeadersInit = {},
) => {
  const headers = new Headers(corsHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
};

export const errorResponse = (
  message: string,
  status = 400,
  corsHeaders: HeadersInit = {},
) => jsonResponse({ success: false, error: message }, { status }, corsHeaders);

export const readJsonBody = async <T = Record<string, unknown>>(request: Request): Promise<T> => {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_JSON_BODY_BYTES) {
    throw new Error('Request body is too large.');
  }

  try {
    return await request.json() as T;
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
};

export const cleanString = (value: unknown, maxLength = 500) => {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return null;
  return text.slice(0, maxLength);
};

export const requiredString = (value: unknown, field: string, maxLength = 500) => {
  const text = cleanString(value, maxLength);
  if (!text) throw new Error(`${field} is required.`);
  return text;
};

export const numberOrDefault = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const integerOrDefault = (value: unknown, fallback = 0) => (
  Math.trunc(numberOrDefault(value, fallback))
);

export const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const validatePortal = (value: unknown): Portal => {
  const portal = cleanString(value, 32) as Portal | null;
  if (!portal || !VALID_PORTALS.has(portal)) {
    throw new Error('portal must be app, intern, or business.');
  }

  return portal;
};

const redactSensitiveMetadata = (value: unknown, depth = 0): unknown => {
  if (depth > 4) return '[Max depth]';
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => redactSensitiveMetadata(item, depth + 1));
  }

  if (typeof value === 'object') {
    const clean: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).slice(0, 50).forEach(([key, item]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        clean[key] = '[Redacted]';
        return;
      }

      clean[key] = redactSensitiveMetadata(item, depth + 1);
    });

    return clean;
  }

  if (typeof value === 'string') {
    return cleanString(value, 500);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value).slice(0, 200);
};

export const toLimitedJsonText = (value: unknown, maxChars = MAX_METADATA_CHARS) => {
  if (value === null || value === undefined) return null;

  const json = JSON.stringify(redactSensitiveMetadata(value));
  if (!json || json === 'null') return null;

  return json.slice(0, maxChars);
};

export const containsSensitiveText = (value: string) => (
  SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(value))
);

export const sanitizeSearchQuery = (value: unknown) => {
  const query = requiredString(value, 'query', 300);
  return containsSensitiveText(query) ? '[redacted-sensitive-query]' : query;
};

export const parseJsonText = <T = unknown>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string' || !value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const normalizePublishTargets = (value: unknown) => {
  const rawTargets = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const targets = [...new Set(rawTargets
    .map((item) => cleanString(item, 32))
    .filter((item): item is Portal => item === 'app' || item === 'intern'))];

  return targets.length ? targets : ['intern'];
};

export const getInternalSecret = (request: Request) => {
  const headerSecret = request.headers.get('x-internal-secret')
    || request.headers.get('x-teenverse-internal-secret');
  if (headerSecret) return headerSecret;

  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

const sha256 = (value: string) => crypto.subtle.digest('SHA-256', encoder.encode(value));

export const timingSafeEqual = async (left: string, right: string) => {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);

  let diff = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ (rightBytes[index] || 0);
  }

  return diff === 0;
};

export const requireInternalSecret = async (request: Request, env: Env) => {
  const configured = env.INTERNAL_WORKER_SECRET || env.AUX_WORKER_INTERNAL_SECRET;
  if (!configured) {
    throw new Error('INTERNAL_WORKER_SECRET is not configured.');
  }

  const provided = getInternalSecret(request);
  if (!provided || !(await timingSafeEqual(provided, configured))) {
    throw new Error('Invalid internal secret.');
  }
};
