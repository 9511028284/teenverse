# TeenVerseHub Cloudflare Offload

This is the auxiliary offload layer for the first growth phase. Supabase remains the source of truth for identity, marketplace records, RLS-protected data, payments, escrow, wallet, KYC, banking, business verification, active chats, active notifications, applications, and admin audit trails.

Cloudflare handles secondary pressure:

- D1 stores analytics, page views, search logs, non-critical AI usage events, summarized rate-limit events, public opportunity cache rows, feedback/contact messages, old archives, and webhook payload archive copies.
- KV stores fast rate-limit counters before noisy requests hit Supabase.
- R2 stores actual file bytes. Supabase `uploaded_files` stores metadata only.

## D1 Tables

- `analytics_events`
- `search_logs`
- `ai_usage_events`
- `rate_limit_events`
- `public_opportunity_cache`
- `notification_archive`
- `message_archive`
- `support_message_archive`
- `feedback_messages`
- `webhook_payload_archive`

## Worker Setup

1. `cd cloudflare/teenverse-aux-worker`
2. `npm install`
3. `npx wrangler d1 create teenverse_aux`
4. `npx wrangler kv namespace create RATE_LIMIT_KV`
5. Copy `wrangler.toml.example` to `wrangler.toml`
6. Copy the returned `database_id` and KV namespace `id` into `wrangler.toml`
7. Set non-secret vars in `wrangler.toml`:
   - `SUPABASE_URL`
   - `SUPABASE_JWT_ISSUER`
   - `ALLOWED_ORIGINS`
8. Set secrets in the Cloudflare dashboard or with Wrangler:
   - `npx wrangler secret put INTERNAL_WORKER_SECRET`
   - Optional for legacy Supabase HS256 JWT projects: `npx wrangler secret put SUPABASE_ANON_KEY`
9. `npx wrangler d1 migrations apply teenverse_aux --local`
10. `npx wrangler dev`
11. Test endpoints locally
12. `npx wrangler d1 migrations apply teenverse_aux --remote`
13. `npx wrangler deploy`

Do not put Supabase service role keys in Worker config, frontend `.env`, or client code.

## Frontend Env

Set this in each deployed frontend:

```bash
VITE_AUX_WORKER_URL=https://teenverse-aux-worker.YOUR_SUBDOMAIN.workers.dev
```

Frontend helpers live in `src/services/auxiliary.api.js`. They no-op when the Worker URL is missing, send the current Supabase session token when available, and swallow logging failures so UI does not break.

## API Routes

Public or optional-auth routes:

- `POST /v1/analytics/event`
- `POST /v1/search/log`
- `GET /v1/opportunities/public?portal=intern`
- `GET /v1/opportunities/public?portal=app`
- `POST /v1/feedback`

JWT-required routes:

- `POST /v1/ai/usage`

Internal-secret routes:

- `POST /v1/rate-limit/event`
- `POST /v1/opportunities/cache-upsert`
- `POST /v1/opportunities/cache-delete`
- `POST /v1/archive/notification`
- `POST /v1/archive/message`
- `POST /v1/archive/support-message`
- `POST /v1/archive/webhook-payload`

Use this header for internal routes:

```http
x-internal-secret: <INTERNAL_WORKER_SECRET>
```

## R2 File Strategy

Actual files should move to Cloudflare R2. Supabase should keep metadata in `uploaded_files`:

- owner id
- related type and related id
- R2 bucket
- R2 object key
- original file name
- MIME type
- byte size
- visibility and status

Use private, structured object keys:

```text
user/{userId}/resume/{fileId}
user/{userId}/kyc/{fileId}
business/{businessId}/docs/{fileId}
chat/{applicationId}/{fileId}
portfolio/{userId}/{fileId}
project/{applicationId}/{fileId}
invoices/{applicationId}/{fileId}
```

Gradually migrate old URL/path columns:

- `freelancers.resume_url`
- `freelancers.id_proof_url`
- `clients.id_proof_url`
- `messages.file_url`
- `portfolio_items.image_url`
- `resume_experiences.proof_url`
- `resume_projects.image_url`
- `resume_verifications.proof_url`
- `applications.invoice_path`
- `applications.work_files`
- `jobs.attachments`

Do not implement public R2 URLs for private user files. Use signed URLs or a trusted Worker flow later.

## Public Opportunity Cache

Source of truth: Supabase `opportunities`.

Cache: Cloudflare D1 `public_opportunity_cache`.

Flow:

1. Business creates an opportunity in Supabase with `status = 'pending_review'`.
2. Admin approves it and Supabase status becomes `active`.
3. An admin/server process calls `/v1/opportunities/cache-upsert`.
4. Public app and intern listings read from D1.
5. If admin pauses, closes, rejects, or deletes the opportunity, the server calls `/v1/opportunities/cache-delete`.

D1 is never the source of truth for opportunity applications.

## Rate Limits

- Use Cloudflare WAF and Turnstile for public forms.
- Use KV for fast counters.
- Store only summarized rate-limit events in D1.
- Keep Supabase `auth_rate_limits` only for critical auth security if still used.
- Prefer blocking abusive requests before they hit Supabase.

## Archive Scripts

Scripts live at:

- `scripts/archive-old-notifications-to-d1.ts`
- `scripts/archive-old-messages-to-d1.ts`
- `scripts/archive-old-support-messages-to-d1.ts`

Required env:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
AUX_WORKER_INTERNAL_SECRET=...
AUX_WORKER_URL=https://teenverse-aux-worker.YOUR_SUBDOMAIN.workers.dev
```

Dry-run is the default:

```bash
npx tsx scripts/archive-old-notifications-to-d1.ts
npx tsx scripts/archive-old-messages-to-d1.ts
npx tsx scripts/archive-old-support-messages-to-d1.ts
```

To copy rows to D1:

```bash
npx tsx scripts/archive-old-notifications-to-d1.ts --execute
npx tsx scripts/archive-old-messages-to-d1.ts --execute
npx tsx scripts/archive-old-support-messages-to-d1.ts --execute
```

Safety rules:

- Notifications: only rows older than 60 days.
- Messages: only rows older than 90 days and only when related applications/projects are terminal.
- Support messages: only rows older than 60 days and only when the ticket is closed or resolved.
- Scripts do not delete Supabase rows.
- Scripts update `archived_at` or `archived_to_d1_at` only if the column already exists.
- If no archive marker exists, scripts only copy to D1 and report counts.

## Do Not Offload

Keep these in Supabase:

- `auth.users`
- `profiles`
- `freelancers`
- `clients`
- `business_profiles`
- `jobs`
- `applications`
- `opportunities`
- `opportunity_applications`
- `application_status_history`
- `escrow_orders`
- `wallet_transactions`
- `kyc_status`
- `user_banking`
- `phone_otp_verifications`
- `parent_consents`
- `admin_audit_logs`
- active `messages`
- active `notifications`
- `uploaded_files` metadata

## Verification

Worker:

```bash
cd cloudflare/teenverse-aux-worker
npm install
npm run typecheck
```

Frontend:

```bash
npm run build
npm run lint
```

Do not deploy the Worker, apply remote D1 migrations, run archive scripts, delete Supabase data, or run `supabase db push` unless you are intentionally doing a later production rollout.
