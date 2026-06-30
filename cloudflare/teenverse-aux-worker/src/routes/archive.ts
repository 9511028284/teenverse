import {
  cleanString,
  errorResponse,
  jsonResponse,
  nowIso,
  readJsonBody,
  requireInternalSecret,
  requiredString,
  toLimitedJsonText,
  type RouteContext,
} from '../db';

type NotificationArchiveBody = {
  id?: unknown;
  supabase_notification_id?: unknown;
  user_id?: unknown;
  title?: unknown;
  body?: unknown;
  type?: unknown;
  payload?: unknown;
  original_created_at?: unknown;
  archived_at?: unknown;
};

type MessageArchiveBody = {
  id?: unknown;
  supabase_message_id?: unknown;
  application_id?: unknown;
  sender_id?: unknown;
  receiver_id?: unknown;
  body?: unknown;
  metadata?: unknown;
  original_created_at?: unknown;
  archived_at?: unknown;
};

type SupportMessageArchiveBody = {
  id?: unknown;
  supabase_support_message_id?: unknown;
  ticket_id?: unknown;
  sender_id?: unknown;
  is_admin?: unknown;
  message?: unknown;
  original_created_at?: unknown;
  archived_at?: unknown;
};

type WebhookPayloadArchiveBody = {
  id?: unknown;
  provider?: unknown;
  event_type?: unknown;
  order_id?: unknown;
  payload_hash?: unknown;
  payload?: unknown;
  created_at?: unknown;
};

export const handleNotificationArchive = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);
    const body = await readJsonBody<NotificationArchiveBody>(request);
    const id = cleanString(body.id, 120) || crypto.randomUUID();
    const archivedAt = cleanString(body.archived_at, 40) || nowIso();

    await env.AUX_DB.prepare(`
      insert or ignore into notification_archive (
        id, supabase_notification_id, user_id, title, body, type, payload, original_created_at, archived_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      cleanString(body.supabase_notification_id, 120),
      requiredString(body.user_id, 'user_id', 120),
      cleanString(body.title, 300),
      cleanString(body.body, 2000),
      cleanString(body.type, 120),
      toLimitedJsonText(body.payload),
      cleanString(body.original_created_at, 40),
      archivedAt,
    ).run();

    return jsonResponse({ success: true, id, archived_at: archivedAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to archive notification.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};

export const handleMessageArchive = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);
    const body = await readJsonBody<MessageArchiveBody>(request);
    const id = cleanString(body.id, 120) || crypto.randomUUID();
    const archivedAt = cleanString(body.archived_at, 40) || nowIso();

    await env.AUX_DB.prepare(`
      insert or ignore into message_archive (
        id, supabase_message_id, application_id, sender_id, receiver_id, body,
        metadata, original_created_at, archived_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      cleanString(body.supabase_message_id, 120),
      cleanString(body.application_id, 120),
      requiredString(body.sender_id, 'sender_id', 120),
      requiredString(body.receiver_id, 'receiver_id', 120),
      cleanString(body.body, 4000),
      toLimitedJsonText(body.metadata),
      cleanString(body.original_created_at, 40),
      archivedAt,
    ).run();

    return jsonResponse({ success: true, id, archived_at: archivedAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to archive message.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};

export const handleSupportMessageArchive = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);
    const body = await readJsonBody<SupportMessageArchiveBody>(request);
    const id = cleanString(body.id, 120) || crypto.randomUUID();
    const archivedAt = cleanString(body.archived_at, 40) || nowIso();

    await env.AUX_DB.prepare(`
      insert or ignore into support_message_archive (
        id, supabase_support_message_id, ticket_id, sender_id, is_admin, message,
        original_created_at, archived_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      cleanString(body.supabase_support_message_id, 120),
      cleanString(body.ticket_id, 120),
      requiredString(body.sender_id, 'sender_id', 120),
      body.is_admin ? 1 : 0,
      cleanString(body.message, 4000),
      cleanString(body.original_created_at, 40),
      archivedAt,
    ).run();

    return jsonResponse({ success: true, id, archived_at: archivedAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to archive support message.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};

export const handleWebhookPayloadArchive = async (
  request: Request,
  { env, corsHeaders }: RouteContext,
) => {
  try {
    await requireInternalSecret(request, env);
    const body = await readJsonBody<WebhookPayloadArchiveBody>(request);
    const id = cleanString(body.id, 120) || crypto.randomUUID();
    const createdAt = cleanString(body.created_at, 40) || nowIso();

    await env.AUX_DB.prepare(`
      insert or ignore into webhook_payload_archive (
        id, provider, event_type, order_id, payload_hash, payload, created_at
      ) values (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      requiredString(body.provider, 'provider', 120),
      cleanString(body.event_type, 160),
      cleanString(body.order_id, 160),
      cleanString(body.payload_hash, 200),
      toLimitedJsonText(body.payload, 24000),
      createdAt,
    ).run();

    return jsonResponse({ success: true, id, created_at: createdAt }, { status: 201 }, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to archive webhook payload.';
    const status = /secret/i.test(message) ? 401 : 400;
    return errorResponse(message, status, corsHeaders);
  }
};
