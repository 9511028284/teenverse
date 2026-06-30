import { getBearerToken } from '../auth';
import {
  errorResponse,
  jsonResponse,
  type RouteContext,
} from '../db';
import { getMetaAnalytics } from '../meta';

type SummaryRow = {
  total: number;
  visitors?: number;
  page_views?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  blocked?: number;
};

type GroupRow = {
  label: string;
  value: number;
};

const STAFF_ROLES = new Set([
  'founder',
  'admin',
  'finance',
  'marketing',
  'operations',
  'support',
  'developer',
  'viewer',
]);

const readClaimRole = (roleClaims: Record<string, unknown>) => {
  const appMetadata = roleClaims.app_metadata;
  const metadata = appMetadata && typeof appMetadata === 'object'
    ? appMetadata as Record<string, unknown>
    : {};

  return String(
    metadata.admin_role
      || metadata.staff_role
      || roleClaims.staff_role
      || '',
  ).trim().toLowerCase();
};

const readProfileRole = async (request: Request, context: RouteContext) => {
  const { env, auth } = context;
  const token = getBearerToken(request);
  if (!auth || !token || !env.SUPABASE_ANON_KEY) return '';

  const endpoint = new URL('/rest/v1/profiles', env.SUPABASE_URL);
  endpoint.searchParams.set('id', `eq.${auth.userId}`);
  endpoint.searchParams.set('select', 'role,status');
  endpoint.searchParams.set('limit', '1');

  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/json',
      apikey: env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return '';
  const rows = await response.json<Array<{ role?: string; status?: string }>>();
  const profile = rows[0];
  if (!profile || ['suspended', 'banned', 'locked'].includes(String(profile.status || '').toLowerCase())) return '';
  return String(profile.role || '').trim().toLowerCase();
};

const requireStaffRole = async (request: Request, context: RouteContext) => {
  if (!context.auth) return '';
  const claimRole = readClaimRole(context.auth.roleClaims);
  if (STAFF_ROLES.has(claimRole)) return claimRole;
  const profileRole = await readProfileRole(request, context);
  return STAFF_ROLES.has(profileRole) ? profileRole : '';
};

const boundedRange = (url: URL) => {
  const now = Date.now();
  const defaultFrom = now - (30 * 24 * 60 * 60 * 1000);
  const parsedFrom = Date.parse(url.searchParams.get('from') || '');
  const parsedTo = Date.parse(url.searchParams.get('to') || '');
  const to = Number.isFinite(parsedTo) ? Math.min(parsedTo, now + 60_000) : now;
  const requestedFrom = Number.isFinite(parsedFrom) ? parsedFrom : defaultFrom;
  const from = Math.max(requestedFrom, to - (366 * 24 * 60 * 60 * 1000));

  return {
    from: new Date(Math.min(from, to)).toISOString(),
    to: new Date(Math.max(from, to)).toISOString(),
  };
};

const firstRow = <T>(result: D1Result<T>) => result.results[0];
const rows = <T>(result: D1Result<T>) => result.results;

const probeVercel = async (productionUrl?: string) => {
  if (!productionUrl) return { status: 'not_configured', statusCode: null, latencyMs: null };
  const startedAt = performance.now();

  try {
    const response = await fetch(productionUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'user-agent': 'TeenVerse-Command-Center/1.0' },
    });
    return {
      status: response.status < 500 ? 'healthy' : 'error',
      statusCode: response.status,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      status: 'error',
      statusCode: null,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
};

export const handleCommandCenterMetrics = async (
  request: Request,
  context: RouteContext,
) => {
  const role = await requireStaffRole(request, context);
  if (!role) return errorResponse('Staff access required.', 403, context.corsHeaders);

  const range = boundedRange(new URL(request.url));
  const { env } = context;
  const d1StartedAt = performance.now();

  const [
    analyticsSummary,
    dailyEvents,
    topPaths,
    eventTypes,
    aiSummary,
    aiModels,
    searchSummary,
    rateLimitSummary,
    archiveSummary,
    deployments,
    vercel,
    meta,
  ] = await Promise.all([
    env.AUX_DB.prepare(`
      select count(*) as total,
        count(distinct coalesce(user_id, anonymous_id)) as visitors,
        coalesce(sum(case when event_name = 'page_view' then 1 else 0 end), 0) as page_views
      from analytics_events where created_at between ? and ?
    `).bind(range.from, range.to).first<SummaryRow>(),
    env.AUX_DB.prepare(`
      select substr(created_at, 1, 10) as label, count(*) as value
      from analytics_events where created_at between ? and ?
      group by substr(created_at, 1, 10) order by label asc limit 366
    `).bind(range.from, range.to).all<GroupRow>(),
    env.AUX_DB.prepare(`
      select coalesce(path, 'Unknown') as label, count(*) as value
      from analytics_events where created_at between ? and ?
      group by path order by value desc limit 12
    `).bind(range.from, range.to).all<GroupRow>(),
    env.AUX_DB.prepare(`
      select event_name as label, count(*) as value
      from analytics_events where created_at between ? and ?
      group by event_name order by value desc limit 20
    `).bind(range.from, range.to).all<GroupRow>(),
    env.AUX_DB.prepare(`
      select count(*) as total,
        coalesce(sum(input_tokens), 0) as input_tokens,
        coalesce(sum(output_tokens), 0) as output_tokens,
        coalesce(sum(cost_estimate), 0) as cost
      from ai_usage_events where created_at between ? and ?
    `).bind(range.from, range.to).first<SummaryRow>(),
    env.AUX_DB.prepare(`
      select coalesce(model, 'Unknown') as label, count(*) as value
      from ai_usage_events where created_at between ? and ?
      group by model order by value desc limit 12
    `).bind(range.from, range.to).all<GroupRow>(),
    env.AUX_DB.prepare(`
      select count(*) as total,
        coalesce(sum(case when result_count = 0 then 1 else 0 end), 0) as blocked
      from search_logs where created_at between ? and ?
    `).bind(range.from, range.to).first<SummaryRow>(),
    env.AUX_DB.prepare(`
      select count(*) as total,
        coalesce(sum(case when blocked = 1 then 1 else 0 end), 0) as blocked
      from rate_limit_events where created_at between ? and ?
    `).bind(range.from, range.to).first<SummaryRow>(),
    env.AUX_DB.prepare(`
      select
        (select count(*) from notification_archive where archived_at between ? and ?) as notifications,
        (select count(*) from message_archive where archived_at between ? and ?) as messages,
        (select count(*) from support_message_archive where archived_at between ? and ?) as support_messages,
        (select count(*) from webhook_payload_archive where created_at between ? and ?) as webhooks
    `).bind(range.from, range.to, range.from, range.to, range.from, range.to, range.from, range.to).first<Record<string, number>>(),
    env.AUX_DB.prepare(`
      select id, provider, project_id, project_name, url, state, target, commit_sha, created_at
      from platform_deployments order by created_at desc limit 20
    `).all<Record<string, string | null>>(),
    probeVercel(env.VERCEL_PRODUCTION_URL),
    getMetaAnalytics(env, range),
  ]);

  const requestCf = request.cf;

  return jsonResponse({
    success: true,
    measuredAt: new Date().toISOString(),
    range,
    web: {
      events: Number(analyticsSummary?.total || 0),
      visitors: Number(analyticsSummary?.visitors || 0),
      pageViews: Number(analyticsSummary?.page_views || 0),
      dailyEvents: rows(dailyEvents),
      topPaths: rows(topPaths),
      eventTypes: rows(eventTypes),
    },
    ai: {
      requests: Number(aiSummary?.total || 0),
      inputTokens: Number(aiSummary?.input_tokens || 0),
      outputTokens: Number(aiSummary?.output_tokens || 0),
      cost: Number(aiSummary?.cost || 0),
      models: rows(aiModels),
    },
    search: {
      searches: Number(searchSummary?.total || 0),
      zeroResultSearches: Number(searchSummary?.blocked || 0),
    },
    security: {
      rateLimitEvents: Number(rateLimitSummary?.total || 0),
      blockedRequests: Number(rateLimitSummary?.blocked || 0),
    },
    archives: archiveSummary || {},
    meta,
    infrastructure: {
      d1Status: 'healthy',
      d1LatencyMs: Math.round(performance.now() - d1StartedAt),
      edgeColo: requestCf?.colo || null,
      edgeCountry: requestCf?.country || null,
      vercel,
      deployments: rows(deployments),
    },
  }, { status: 200 }, context.corsHeaders);
};

export const handleMetaHealth = async (
  request: Request,
  context: RouteContext,
) => {
  const role = await requireStaffRole(request, context);
  if (!role) return errorResponse('Staff access required.', 403, context.corsHeaders);

  const meta = await getMetaAnalytics(context.env);
  if (meta.status === 'not_configured') {
    return errorResponse(meta.message, 503, context.corsHeaders);
  }
  if (meta.status === 'error') {
    return errorResponse(meta.message, 502, context.corsHeaders);
  }

  return jsonResponse({
    success: true,
    status: meta.status,
    message: meta.message,
    facebookPages: meta.facebook.pages,
    instagramAccounts: meta.instagram.accounts,
    cached: meta.cached,
  }, { status: 200 }, context.corsHeaders);
};
