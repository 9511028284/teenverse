import { errorResponse, type Env } from './db';

export const getAllowedOrigins = (env: Env) => (
  String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

export const getCorsHeaders = (request: Request, env: Env) => {
  const origin = request.headers.get('origin');
  const headers = new Headers({
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,x-internal-secret,x-teenverse-internal-secret',
    'access-control-max-age': '86400',
    vary: 'Origin',
  });

  if (!origin) return headers;

  const allowed = getAllowedOrigins(env);
  if (allowed.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
  }

  return headers;
};

export const isAllowedOrigin = (request: Request, env: Env) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return getAllowedOrigins(env).includes(origin);
};

export const handleOptions = (request: Request, env: Env) => {
  const corsHeaders = getCorsHeaders(request, env);
  if (!isAllowedOrigin(request, env)) {
    return errorResponse('Origin is not allowed.', 403, corsHeaders);
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
