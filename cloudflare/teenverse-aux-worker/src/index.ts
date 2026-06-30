import { getOptionalAuth } from './auth';
import { getCorsHeaders, handleOptions, isAllowedOrigin } from './cors';
import {
  errorResponse,
  jsonResponse,
  type Env,
  type RouteContext,
} from './db';
import { handleAnalyticsEvent } from './routes/analytics';
import {
  handleMessageArchive,
  handleNotificationArchive,
  handleSupportMessageArchive,
  handleWebhookPayloadArchive,
} from './routes/archive';
import { handleAiUsage } from './routes/ai';
import { handleFeedbackMessage } from './routes/feedback';
import {
  handleOpportunityCacheDelete,
  handleOpportunityCacheUpsert,
  handlePublicOpportunities,
} from './routes/opportunityCache';
import { handleRateLimitEvent } from './routes/rateLimit';
import { handleSearchLog } from './routes/search';

const INTERNAL_ONLY_PATHS = new Set([
  '/v1/rate-limit/event',
  '/v1/opportunities/cache-upsert',
  '/v1/opportunities/cache-delete',
  '/v1/archive/notification',
  '/v1/archive/message',
  '/v1/archive/support-message',
  '/v1/archive/webhook-payload',
]);

const routeRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const corsHeaders = getCorsHeaders(request, env);

  if (!isAllowedOrigin(request, env)) {
    return errorResponse('Origin is not allowed.', 403, corsHeaders);
  }

  if (request.method === 'GET' && path === '/health') {
    return jsonResponse({ success: true, service: 'teenverse-aux-worker' }, { status: 200 }, corsHeaders);
  }

  let auth = null;
  if (!INTERNAL_ONLY_PATHS.has(path)) {
    try {
      auth = await getOptionalAuth(request, env);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : 'Invalid Supabase JWT.', 401, corsHeaders);
    }
  }

  const context: RouteContext = { env, auth, corsHeaders };

  if (request.method === 'POST' && path === '/v1/analytics/event') {
    return handleAnalyticsEvent(request, context);
  }

  if (request.method === 'POST' && path === '/v1/search/log') {
    return handleSearchLog(request, context);
  }

  if (request.method === 'POST' && path === '/v1/ai/usage') {
    return handleAiUsage(request, context);
  }

  if (request.method === 'POST' && path === '/v1/rate-limit/event') {
    return handleRateLimitEvent(request, context);
  }

  if (request.method === 'GET' && path === '/v1/opportunities/public') {
    return handlePublicOpportunities(request, context);
  }

  if (request.method === 'POST' && path === '/v1/opportunities/cache-upsert') {
    return handleOpportunityCacheUpsert(request, context);
  }

  if (request.method === 'POST' && path === '/v1/opportunities/cache-delete') {
    return handleOpportunityCacheDelete(request, context);
  }

  if (request.method === 'POST' && path === '/v1/archive/notification') {
    return handleNotificationArchive(request, context);
  }

  if (request.method === 'POST' && path === '/v1/archive/message') {
    return handleMessageArchive(request, context);
  }

  if (request.method === 'POST' && path === '/v1/archive/support-message') {
    return handleSupportMessageArchive(request, context);
  }

  if (request.method === 'POST' && path === '/v1/archive/webhook-payload') {
    return handleWebhookPayloadArchive(request, context);
  }

  if (request.method === 'POST' && path === '/v1/feedback') {
    return handleFeedbackMessage(request, context);
  }

  return errorResponse('Not found.', 404, corsHeaders);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    try {
      return await routeRequest(request, env);
    } catch (error) {
      const corsHeaders = getCorsHeaders(request, env);
      console.error(JSON.stringify({
        level: 'error',
        message: error instanceof Error ? error.message : 'Unhandled worker error.',
      }));

      return errorResponse('Internal server error.', 500, corsHeaders);
    }
  },
};
