import {
  cleanString,
  errorResponse,
  integerOrDefault,
  jsonResponse,
  nowIso,
  readJsonBody,
  requireInternalSecret,
  requiredString,
  toLimitedJsonText,
  type RouteContext,
} from '../db';

type RateLimitBody = {
  user_id?: unknown;
  ip_hash?: unknown;
  action?: unknown;
  key?: unknown;
  rate_key?: unknown;
  rateKey?: unknown;
  count?: unknown;
  blocked?: unknown;
  metadata?: unknown;
};

const incrementRateLimitCounter = async (
  kv: KVNamespace | undefined,
  action: string,
  rateKey: string,
  count: number,
) => {
  if (!kv) return null;

  const key = `rate:${action}:${rateKey}`;
  const current = Number(await kv.get(key) || 0);
  const next = current + count;
  await kv.put(key, String(next), { expirationTtl: 60 * 60 });
  return next;
};

export const handleRateLimitEvent = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);

    const body = await readJsonBody<RateLimitBody>(request);
    const id = crypto.randomUUID();
    const createdAt = nowIso();
    const action = requiredString(body.action, 'action', 120);
    const rateKey = requiredString(body.rate_key ?? body.rateKey ?? body.key, 'rate_key', 240);
    const count = Math.max(1, integerOrDefault(body.count, 1));
    const kvCount = await incrementRateLimitCounter(env.RATE_LIMIT_KV, action, rateKey, count);

    await env.AUX_DB.prepare(`
      insert into rate_limit_events (
        id, user_id, ip_hash, action, rate_key, count, blocked, metadata, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      cleanString(body.user_id, 120),
      cleanString(body.ip_hash, 160),
      action,
      rateKey,
      count,
      body.blocked ? 1 : 0,
      toLimitedJsonText({
        ...(typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}),
        kv_count: kvCount,
      }),
      createdAt,
    ).run();

    return jsonResponse({ success: true, id, created_at: createdAt, kv_count: kvCount }, { status: 201 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to store rate limit event.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};
