import type { AuthContext, Env } from './db';

type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
};

type JwtPayload = {
  sub?: string;
  email?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type JsonWebKeySet = {
  keys?: JsonWebKey[];
};

type SupabaseJwk = JsonWebKey & {
  kid?: string;
  alg?: string;
};

type CachedJwks = {
  expiresAt: number;
  keys: SupabaseJwk[];
};

const JWKS_CACHE_MS = 10 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 60;
const decoder = new TextDecoder();
let cachedJwks: CachedJwks | null = null;

const base64UrlToBytes = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const decodeJsonPart = <T>(value: string): T => {
  const bytes = base64UrlToBytes(value);
  return JSON.parse(decoder.decode(bytes)) as T;
};

export const getBearerToken = (request: Request) => {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

const getJwksUrl = (env: Env) => (
  `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
);

const fetchJwks = async (env: Env) => {
  const now = Date.now();
  if (cachedJwks && cachedJwks.expiresAt > now) return cachedJwks.keys;

  const response = await fetch(getJwksUrl(env), {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch Supabase JWKS.');
  }

  const jwks = await response.json() as JsonWebKeySet;
  const keys = Array.isArray(jwks.keys) ? jwks.keys as SupabaseJwk[] : [];
  cachedJwks = {
    expiresAt: now + JWKS_CACHE_MS,
    keys,
  };

  return keys;
};

const importJwk = (jwk: JsonWebKey, alg: string) => {
  if (alg === 'RS256' && jwk.kty === 'RSA') {
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  }

  if (alg === 'ES256' && jwk.kty === 'EC') {
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
  }

  throw new Error(`Unsupported JWT algorithm: ${alg}`);
};

const verifySignature = async (token: string, header: JwtHeader, env: Env) => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Malformed JWT.');
  }

  const alg = header.alg || '';
  const kid = header.kid || '';
  const keys = await fetchJwks(env);
  const jwk = keys.find((candidate) => (
    candidate.kid === kid && (!candidate.alg || candidate.alg === alg)
  ));

  if (!jwk) {
    throw new Error('No matching Supabase JWKS key found.');
  }

  const key = await importJwk(jwk, alg);
  const signingInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlToBytes(encodedSignature);
  const algorithm = alg === 'ES256'
    ? { name: 'ECDSA', hash: 'SHA-256' }
    : { name: 'RSASSA-PKCS1-v1_5' };

  const verified = await crypto.subtle.verify(algorithm, key, signature, signingInput);
  if (!verified) throw new Error('Invalid JWT signature.');
};

const verifyClaims = (payload: JwtPayload, env: Env) => {
  const now = Math.floor(Date.now() / 1000);
  const expectedIssuer = env.SUPABASE_JWT_ISSUER.replace(/\/$/, '');
  const issuer = String(payload.iss || '').replace(/\/$/, '');

  if (!payload.sub) throw new Error('JWT is missing subject.');
  if (issuer !== expectedIssuer) throw new Error('JWT issuer does not match Supabase project.');
  if (payload.exp && payload.exp + CLOCK_SKEW_SECONDS < now) throw new Error('JWT has expired.');
  if (payload.nbf && payload.nbf - CLOCK_SKEW_SECONDS > now) throw new Error('JWT is not active yet.');
};

const authContextFromPayload = (payload: JwtPayload): AuthContext => ({
  userId: String(payload.sub),
  email: payload.email,
  roleClaims: {
    role: payload.role,
    app_metadata: payload.app_metadata || {},
  },
});

const verifyWithJwks = async (token: string, env: Env) => {
  const [encodedHeader, encodedPayload] = token.split('.');
  if (!encodedHeader || !encodedPayload) throw new Error('Malformed JWT.');

  const header = decodeJsonPart<JwtHeader>(encodedHeader);
  const payload = decodeJsonPart<JwtPayload>(encodedPayload);

  await verifySignature(token, header, env);
  verifyClaims(payload, env);

  return authContextFromPayload(payload);
};

const verifyWithSupabaseUserEndpoint = async (token: string, env: Env) => {
  if (!env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase JWT could not be verified with JWKS and SUPABASE_ANON_KEY is not configured.');
  }

  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Supabase Auth rejected the JWT.');
  }

  const user = await response.json() as {
    id?: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    role?: string;
  };

  if (!user.id) throw new Error('Supabase Auth response did not include a user id.');

  return {
    userId: user.id,
    email: user.email,
    roleClaims: {
      role: user.role,
      app_metadata: user.app_metadata || {},
    },
  } satisfies AuthContext;
};

export const verifySupabaseJwt = async (token: string, env: Env) => {
  try {
    return await verifyWithJwks(token, env);
  } catch (jwksError) {
    const message = jwksError instanceof Error ? jwksError.message : 'JWKS verification failed.';

    if (/No matching Supabase JWKS key|Unable to fetch Supabase JWKS|could not be verified|Unsupported JWT algorithm/i.test(message)) {
      return verifyWithSupabaseUserEndpoint(token, env);
    }

    throw jwksError;
  }
};

export const getOptionalAuth = async (request: Request, env: Env) => {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifySupabaseJwt(token, env);
};
