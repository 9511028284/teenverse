import {
  errorResponse,
  integerOrDefault,
  jsonResponse,
  nowIso,
  readJsonBody,
  sanitizeSearchQuery,
  toLimitedJsonText,
  validatePortal,
  type RouteContext,
} from '../db';

type SearchLogBody = {
  portal?: unknown;
  query?: unknown;
  filters?: unknown;
  result_count?: unknown;
  resultCount?: unknown;
};

export const handleSearchLog = async (
  request: Request,
  { env, auth, corsHeaders }: RouteContext,
) => {
  try {
    const body = await readJsonBody<SearchLogBody>(request);
    const id = crypto.randomUUID();
    const createdAt = nowIso();

    await env.AUX_DB.prepare(`
      insert into search_logs (
        id, user_id, portal, query, filters, result_count, created_at
      ) values (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      auth?.userId || null,
      validatePortal(body.portal),
      sanitizeSearchQuery(body.query),
      toLimitedJsonText(body.filters),
      integerOrDefault(body.result_count ?? body.resultCount, 0),
      createdAt,
    ).run();

    return jsonResponse({ success: true, id, created_at: createdAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unable to store search log.', 400, corsHeaders);
  }
};
