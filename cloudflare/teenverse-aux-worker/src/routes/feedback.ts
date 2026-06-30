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

type FeedbackBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  portal?: unknown;
  metadata?: unknown;
  turnstile_token?: unknown;
  turnstileToken?: unknown;
  company?: unknown;
  website?: unknown;
};

const looksLikeEmail = (value: string | null) => (
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
);

export const handleFeedbackMessage = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    const body = await readJsonBody<FeedbackBody>(request);

    // Honeypot placeholders for public forms. Real Turnstile verification can be added here.
    if (cleanString(body.company, 200) || cleanString(body.website, 200)) {
      return jsonResponse({ success: true, skipped: true }, { status: 202 }, corsHeaders);
    }

    const message = requiredString(body.message, 'message', 4000);
    if (message.length < 10) {
      return errorResponse('message is too short.', 400, corsHeaders);
    }

    const email = cleanString(body.email, 240);
    if (!looksLikeEmail(email)) {
      return errorResponse('email is invalid.', 400, corsHeaders);
    }

    const id = crypto.randomUUID();
    const createdAt = nowIso();
    const portal = body.portal ? validatePortal(body.portal) : null;

    await env.AUX_DB.prepare(`
      insert into feedback_messages (
        id, name, email, message, portal, metadata, created_at
      ) values (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      cleanString(body.name, 160),
      email,
      message,
      portal,
      toLimitedJsonText({
        ...(typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}),
        turnstile_present: Boolean(body.turnstile_token || body.turnstileToken),
      }),
      createdAt,
    ).run();

    return jsonResponse({ success: true, id, created_at: createdAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unable to store feedback message.', 400, corsHeaders);
  }
};
