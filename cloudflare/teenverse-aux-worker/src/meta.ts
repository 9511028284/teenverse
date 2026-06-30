import type { Env } from './db';

const META_GRAPH_VERSION = 'v25.0';
const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const META_CACHE_TTL_SECONDS = 300;
const MAX_INSIGHT_RANGE_MS = 90 * 24 * 60 * 60 * 1000;

type GraphCollection<T> = {
  data?: T[];
};

type GraphError = {
  error?: {
    code?: number;
    message?: string;
    type?: string;
  };
};

type InstagramAccount = {
  id: string;
  username?: string;
  followers_count?: number;
  media_count?: number;
};

type FacebookPage = {
  id: string;
  name?: string;
  access_token?: string;
  fan_count?: number;
  followers_count?: number;
  instagram_business_account?: InstagramAccount;
};

type InsightValue = {
  end_time?: string;
  value?: number | Record<string, number>;
};

type InsightMetric = {
  name?: string;
  values?: InsightValue[];
};

type MetaRange = {
  from?: string;
  to?: string;
};

export type MetaAnalytics = {
  status: 'healthy' | 'not_configured' | 'error';
  apiVersion: string;
  measuredAt: string;
  cached: boolean;
  message: string;
  facebook: {
    pages: number;
    followers: number;
    likes: number;
    accounts: Array<{ id: string; name: string; followers: number; likes: number }>;
  };
  instagram: {
    accounts: number;
    followers: number;
    media: number;
    latestDailyReach: number | null;
    latestDailyProfileViews: number | null;
    audience: Array<{ id: string; username: string; followers: number; media: number }>;
    daily: Array<{ label: string; value: number; profileViews: number }>;
  };
  warnings: string[];
};

const emptyAnalytics = (
  status: MetaAnalytics['status'],
  message: string,
): MetaAnalytics => ({
  status,
  apiVersion: META_GRAPH_VERSION,
  measuredAt: new Date().toISOString(),
  cached: false,
  message,
  facebook: { pages: 0, followers: 0, likes: 0, accounts: [] },
  instagram: {
    accounts: 0,
    followers: 0,
    media: 0,
    latestDailyReach: null,
    latestDailyProfileViews: null,
    audience: [],
    daily: [],
  },
  warnings: [],
});

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const graphRequest = async <T>(
  path: string,
  accessToken: string,
  parameters: Record<string, string>,
) => {
  const endpoint = new URL(`${META_GRAPH_BASE_URL}/${path.replace(/^\/+/, '')}`);
  Object.entries(parameters).forEach(([key, value]) => endpoint.searchParams.set(key, value));

  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json() as T & GraphError;

  if (!response.ok || body.error) {
    const code = body.error?.code ? ` (${body.error.code})` : '';
    const type = body.error?.type ? `${body.error.type}${code}` : `HTTP ${response.status}`;
    const message = String(body.error?.message || 'Meta Graph API request failed.').slice(0, 240);
    throw new Error(`${type}: ${message}`);
  }

  return body as T;
};

const normalizeRange = (range: MetaRange = {}) => {
  const now = Date.now();
  const requestedTo = Date.parse(range.to || '');
  const requestedFrom = Date.parse(range.from || '');
  const to = Number.isFinite(requestedTo) ? Math.min(requestedTo, now) : now;
  const from = Number.isFinite(requestedFrom)
    ? Math.max(requestedFrom, to - MAX_INSIGHT_RANGE_MS)
    : to - (30 * 24 * 60 * 60 * 1000);

  return {
    from: new Date(Math.min(from, to)).toISOString(),
    to: new Date(Math.max(from, to)).toISOString(),
    since: String(Math.floor(Math.min(from, to) / 1000)),
    until: String(Math.floor(Math.max(from, to) / 1000)),
  };
};

const discoverPages = async (accessToken: string) => {
  const fields = 'id,name,access_token,fan_count,followers_count,instagram_business_account{id,username,followers_count,media_count}';

  try {
    const accounts = await graphRequest<GraphCollection<FacebookPage>>(
      'me/accounts',
      accessToken,
      { fields, limit: '100' },
    );
    const pages = Array.isArray(accounts.data) ? accounts.data : [];
    if (pages.length) return pages;
  } catch {
    // A Page access token can reject /me/accounts; inspect /me below instead.
  }

  const identity = await graphRequest<FacebookPage>('me', accessToken, { fields });
  const looksLikePage = identity.id && (
    identity.fan_count !== undefined
    || identity.followers_count !== undefined
    || Boolean(identity.instagram_business_account)
  );

  return looksLikePage ? [identity] : [];
};

const insightNumber = (value: InsightValue['value']) => (
  typeof value === 'number' ? numberValue(value) : 0
);

const fetchInstagramInsights = async (
  account: InstagramAccount,
  accessToken: string,
  range: ReturnType<typeof normalizeRange>,
) => {
  const response = await graphRequest<GraphCollection<InsightMetric>>(
    `${account.id}/insights`,
    accessToken,
    {
      metric: 'reach,profile_views',
      period: 'day',
      since: range.since,
      until: range.until,
    },
  );

  return Array.isArray(response.data) ? response.data : [];
};

const buildDailyInsights = (metrics: InsightMetric[][]) => {
  const daily = new Map<string, { reach: number; profileViews: number }>();

  metrics.flat().forEach((metric) => {
    const metricName = String(metric.name || '');
    (metric.values || []).forEach((entry) => {
      if (!entry.end_time) return;
      const day = entry.end_time.slice(0, 10);
      const current = daily.get(day) || { reach: 0, profileViews: 0 };
      const value = insightNumber(entry.value);

      if (metricName === 'reach') current.reach += value;
      if (metricName === 'profile_views') current.profileViews += value;
      daily.set(day, current);
    });
  });

  return [...daily.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, values]) => ({
      label,
      value: values.reach,
      profileViews: values.profileViews,
    }));
};

const cacheKeyForRange = (range: ReturnType<typeof normalizeRange>) => (
  `connector:meta:${META_GRAPH_VERSION}:${range.from.slice(0, 10)}:${range.to.slice(0, 10)}`
);

export const getMetaAnalytics = async (
  env: Env,
  requestedRange: MetaRange = {},
): Promise<MetaAnalytics> => {
  if (!env.META_GRAPH_ACCESS_TOKEN) {
    return emptyAnalytics('not_configured', 'META_GRAPH_ACCESS_TOKEN is not configured.');
  }

  const range = normalizeRange(requestedRange);
  const cacheKey = cacheKeyForRange(range);
  const cached = await env.RATE_LIMIT_KV.get<MetaAnalytics>(cacheKey, 'json');
  if (cached?.status === 'healthy') return { ...cached, cached: true };

  try {
    const pages = await discoverPages(env.META_GRAPH_ACCESS_TOKEN);
    const warnings: string[] = [];
    if (!pages.length) warnings.push('The token has no accessible Facebook Pages.');

    const instagramAccounts = pages.flatMap((page) => {
      const account = page.instagram_business_account;
      return account?.id ? [{ account, token: page.access_token || env.META_GRAPH_ACCESS_TOKEN }] : [];
    });

    const insightResults = await Promise.all(instagramAccounts.map(async ({ account, token }) => {
      try {
        return await fetchInstagramInsights(account, token, range);
      } catch (error) {
        warnings.push(`Instagram insights unavailable for ${account.username || account.id}: ${error instanceof Error ? error.message : 'request failed'}`);
        return [];
      }
    }));
    const daily = buildDailyInsights(insightResults);
    const latest = daily.at(-1);

    const summary: MetaAnalytics = {
      status: 'healthy',
      apiVersion: META_GRAPH_VERSION,
      measuredAt: new Date().toISOString(),
      cached: false,
      message: pages.length
        ? `Connected to ${pages.length} Facebook Page${pages.length === 1 ? '' : 's'}.`
        : 'Meta token is valid but no Facebook Pages are available.',
      facebook: {
        pages: pages.length,
        followers: pages.reduce((total, page) => total + numberValue(page.followers_count), 0),
        likes: pages.reduce((total, page) => total + numberValue(page.fan_count), 0),
        accounts: pages.map((page) => ({
          id: page.id,
          name: page.name || 'Facebook Page',
          followers: numberValue(page.followers_count),
          likes: numberValue(page.fan_count),
        })),
      },
      instagram: {
        accounts: instagramAccounts.length,
        followers: instagramAccounts.reduce((total, item) => total + numberValue(item.account.followers_count), 0),
        media: instagramAccounts.reduce((total, item) => total + numberValue(item.account.media_count), 0),
        latestDailyReach: latest ? latest.value : null,
        latestDailyProfileViews: latest ? latest.profileViews : null,
        audience: instagramAccounts.map(({ account }) => ({
          id: account.id,
          username: account.username || 'Instagram account',
          followers: numberValue(account.followers_count),
          media: numberValue(account.media_count),
        })),
        daily,
      },
      warnings,
    };

    await env.RATE_LIMIT_KV.put(cacheKey, JSON.stringify(summary), {
      expirationTtl: META_CACHE_TTL_SECONDS,
    });

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Meta Graph API request failed.';
    return emptyAnalytics('error', message);
  }
};

