import {
  cleanString,
  errorResponse,
  jsonResponse,
  nowIso,
  readJsonBody,
  requiredString,
  toLimitedJsonText,
  validatePortal,
  type RouteContext,
} from '../db';

type AnalyticsEventBody = {
  anonymous_id?: unknown;
  portal?: unknown;
  event_name?: unknown;
  eventName?: unknown;
  event_type?: unknown;
  eventType?: unknown;
  path?: unknown;
  referrer?: unknown;
  metadata?: unknown;
};

export const handleAnalyticsEvent = async (
  request: Request,
  { env, auth, corsHeaders }: RouteContext,
) => {
  try {
    const body = await readJsonBody<AnalyticsEventBody>(request);
    const portal = validatePortal(body.portal);
    const eventName = requiredString(body.event_name || body.eventName, 'event_name', 120);
    const eventType = cleanString(body.event_type || body.eventType, 64) || 'ui';
    const anonymousId = auth ? null : cleanString(body.anonymous_id, 120);

    if (!auth && !anonymousId) {
      return errorResponse('anonymous_id is required when no JWT is supplied.', 401, corsHeaders);
    }

    const id = crypto.randomUUID();
    const createdAt = nowIso();

    await env.AUX_DB.prepare(`
      insert into analytics_events (
        id, user_id, anonymous_id, portal, event_name, event_type, path, referrer, metadata, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      auth?.userId || null,
      anonymousId,
      portal,
      eventName,
      eventType,
      cleanString(body.path, 500),
      cleanString(body.referrer, 500),
      toLimitedJsonText(body.metadata),
      createdAt,
    ).run();

    return jsonResponse({ success: true, id, created_at: createdAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unable to store analytics event.', 400, corsHeaders);
  }
};
