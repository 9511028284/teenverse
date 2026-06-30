import {
  MAX_PAYLOAD_CHARS,
  cleanString,
  errorResponse,
  jsonResponse,
  normalizePublishTargets,
  numberOrNull,
  parseJsonText,
  readJsonBody,
  requireInternalSecret,
  requiredString,
  toLimitedJsonText,
  validatePortal,
  type RouteContext,
} from '../db';

type CacheUpsertBody = {
  opportunity_id?: unknown;
  id?: unknown;
  business_id?: unknown;
  title?: unknown;
  type?: unknown;
  publish_to?: unknown;
  work_mode?: unknown;
  location?: unknown;
  stipend_min?: unknown;
  stipend_max?: unknown;
  currency?: unknown;
  is_paid?: unknown;
  application_deadline?: unknown;
  status?: unknown;
  search_text?: unknown;
  payload?: unknown;
};

type CacheDeleteBody = {
  opportunity_id?: unknown;
  id?: unknown;
};

type CachedOpportunityRow = {
  opportunity_id: string;
  payload: string;
  updated_at: string;
};

const getPortalFromUrl = (request: Request) => {
  const url = new URL(request.url);
  return validatePortal(url.searchParams.get('portal') || 'intern');
};

export const handlePublicOpportunities = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    const portal = getPortalFromUrl(request);
    if (portal === 'business') {
      return errorResponse('Public opportunity cache is only available for app and intern portals.', 400, corsHeaders);
    }

    const rows = await env.AUX_DB.prepare(`
      select opportunity_id, payload, updated_at
      from public_opportunity_cache
      where status = 'active'
        and (
          publish_to = ?
          or publish_to like ?
          or publish_to like ?
          or publish_to like ?
        )
      order by updated_at desc
      limit 100
    `).bind(
      portal,
      `${portal},%`,
      `%,${portal},%`,
      `%,${portal}`,
    ).all<CachedOpportunityRow>();

    const opportunities = (rows.results || []).map((row) => ({
      ...parseJsonText<Record<string, unknown>>(row.payload, {}),
      id: row.opportunity_id,
      cache_updated_at: row.updated_at,
    }));

    return jsonResponse({ success: true, portal, opportunities }, { status: 200 }, corsHeaders);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unable to read opportunity cache.', 400, corsHeaders);
  }
};

export const handleOpportunityCacheUpsert = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);

    const body = await readJsonBody<CacheUpsertBody>(request);
    const opportunityId = requiredString(body.opportunity_id || body.id, 'opportunity_id', 120);
    const businessId = requiredString(body.business_id, 'business_id', 120);
    const title = requiredString(body.title, 'title', 240);
    const type = requiredString(body.type, 'type', 80);
    const publishTargets = normalizePublishTargets(body.publish_to);
    const status = requiredString(body.status, 'status', 80);

    if (status !== 'active') {
      return errorResponse('Only active opportunities should be written to the public cache.', 400, corsHeaders);
    }

    const payload = typeof body.payload === 'object' && body.payload !== null
      ? body.payload
      : body;
    const payloadText = toLimitedJsonText({
      ...payload,
      id: opportunityId,
      opportunity_id: opportunityId,
      business_id: businessId,
      title,
      type,
      publish_to: publishTargets,
      status,
    }, MAX_PAYLOAD_CHARS) || '{}';
    const updatedAt = new Date().toISOString();
    const searchText = cleanString(
      body.search_text || `${title} ${type} ${cleanString(body.location, 240) || ''}`,
      2000,
    );

    await env.AUX_DB.prepare(`
      insert into public_opportunity_cache (
        opportunity_id, business_id, title, type, publish_to, work_mode, location,
        stipend_min, stipend_max, currency, is_paid, application_deadline, status,
        search_text, payload, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(opportunity_id) do update set
        business_id = excluded.business_id,
        title = excluded.title,
        type = excluded.type,
        publish_to = excluded.publish_to,
        work_mode = excluded.work_mode,
        location = excluded.location,
        stipend_min = excluded.stipend_min,
        stipend_max = excluded.stipend_max,
        currency = excluded.currency,
        is_paid = excluded.is_paid,
        application_deadline = excluded.application_deadline,
        status = excluded.status,
        search_text = excluded.search_text,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).bind(
      opportunityId,
      businessId,
      title,
      type,
      publishTargets.join(','),
      cleanString(body.work_mode, 80),
      cleanString(body.location, 240),
      numberOrNull(body.stipend_min),
      numberOrNull(body.stipend_max),
      cleanString(body.currency, 12) || 'INR',
      body.is_paid === false ? 0 : 1,
      cleanString(body.application_deadline, 40),
      status,
      searchText,
      payloadText,
      updatedAt,
    ).run();

    return jsonResponse({ success: true, opportunity_id: opportunityId, updated_at: updatedAt }, { status: 200 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upsert opportunity cache.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};

export const handleOpportunityCacheDelete = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);

    const body = await readJsonBody<CacheDeleteBody>(request);
    const opportunityId = requiredString(body.opportunity_id || body.id, 'opportunity_id', 120);

    await env.AUX_DB.prepare(`
      delete from public_opportunity_cache
      where opportunity_id = ?
    `).bind(opportunityId).run();

    return jsonResponse({ success: true, opportunity_id: opportunityId }, { status: 200 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete opportunity cache.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};
