import {
  cleanString,
  errorResponse,
  integerOrDefault,
  jsonResponse,
  nowIso,
  numberOrDefault,
  readJsonBody,
  requiredString,
  toLimitedJsonText,
  validatePortal,
  type RouteContext,
} from '../db';

type AiUsageBody = {
  portal?: unknown;
  feature?: unknown;
  model?: unknown;
  input_tokens?: unknown;
  inputTokens?: unknown;
  output_tokens?: unknown;
  outputTokens?: unknown;
  cost_estimate?: unknown;
  costEstimate?: unknown;
  metadata?: unknown;
};

export const handleAiUsage = async (
  request: Request,
  { env, auth, corsHeaders }: RouteContext,
) => {
  if (!auth) {
    return errorResponse('A valid Supabase JWT is required.', 401, corsHeaders);
  }

  try {
    const body = await readJsonBody<AiUsageBody>(request);
    const id = crypto.randomUUID();
    const createdAt = nowIso();

    await env.AUX_DB.prepare(`
      insert into ai_usage_events (
        id, user_id, portal, feature, model, input_tokens, output_tokens, cost_estimate, metadata, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      auth.userId,
      validatePortal(body.portal),
      requiredString(body.feature, 'feature', 120),
      cleanString(body.model, 120),
      integerOrDefault(body.input_tokens ?? body.inputTokens, 0),
      integerOrDefault(body.output_tokens ?? body.outputTokens, 0),
      numberOrDefault(body.cost_estimate ?? body.costEstimate, 0),
      toLimitedJsonText(body.metadata),
      createdAt,
    ).run();

    return jsonResponse({ success: true, id, created_at: createdAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unable to store AI usage event.', 400, corsHeaders);
  }
};
