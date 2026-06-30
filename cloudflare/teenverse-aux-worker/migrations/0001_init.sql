create table if not exists analytics_events (
id text primary key,
user_id text,
anonymous_id text,
portal text not null,
event_name text not null,
event_type text not null default 'ui',
path text,
referrer text,
metadata text,
created_at text not null
);

create index if not exists idx_analytics_events_user_id on analytics_events(user_id);
create index if not exists idx_analytics_events_portal on analytics_events(portal);
create index if not exists idx_analytics_events_event_name on analytics_events(event_name);
create index if not exists idx_analytics_events_created_at on analytics_events(created_at);

create table if not exists search_logs (
id text primary key,
user_id text,
portal text not null,
query text not null,
filters text,
result_count integer default 0,
created_at text not null
);

create index if not exists idx_search_logs_user_id on search_logs(user_id);
create index if not exists idx_search_logs_portal on search_logs(portal);
create index if not exists idx_search_logs_created_at on search_logs(created_at);

create table if not exists ai_usage_events (
id text primary key,
user_id text not null,
portal text not null,
feature text not null,
model text,
input_tokens integer default 0,
output_tokens integer default 0,
cost_estimate real default 0,
metadata text,
created_at text not null
);

create index if not exists idx_ai_usage_events_user_id on ai_usage_events(user_id);
create index if not exists idx_ai_usage_events_portal on ai_usage_events(portal);
create index if not exists idx_ai_usage_events_feature on ai_usage_events(feature);
create index if not exists idx_ai_usage_events_created_at on ai_usage_events(created_at);

create table if not exists rate_limit_events (
id text primary key,
user_id text,
ip_hash text,
action text not null,
rate_key text not null,
count integer not null default 1,
blocked integer not null default 0,
metadata text,
created_at text not null
);

create index if not exists idx_rate_limit_events_rate_key on rate_limit_events(rate_key);
create index if not exists idx_rate_limit_events_created_at on rate_limit_events(created_at);

create table if not exists public_opportunity_cache (
opportunity_id text primary key,
business_id text not null,
title text not null,
type text not null,
publish_to text not null,
work_mode text,
location text,
stipend_min real,
stipend_max real,
currency text default 'INR',
is_paid integer default 1,
application_deadline text,
status text not null,
search_text text,
payload text not null,
updated_at text not null
);

create index if not exists idx_public_opportunity_cache_status on public_opportunity_cache(status);
create index if not exists idx_public_opportunity_cache_publish_to on public_opportunity_cache(publish_to);
create index if not exists idx_public_opportunity_cache_type on public_opportunity_cache(type);
create index if not exists idx_public_opportunity_cache_updated_at on public_opportunity_cache(updated_at);

create table if not exists notification_archive (
id text primary key,
supabase_notification_id text,
user_id text not null,
title text,
body text,
type text,
payload text,
original_created_at text,
archived_at text not null
);

create index if not exists idx_notification_archive_user_id on notification_archive(user_id);
create index if not exists idx_notification_archive_archived_at on notification_archive(archived_at);

create table if not exists message_archive (
id text primary key,
supabase_message_id text,
application_id text,
sender_id text not null,
receiver_id text not null,
body text,
metadata text,
original_created_at text,
archived_at text not null
);

create index if not exists idx_message_archive_application_id on message_archive(application_id);
create index if not exists idx_message_archive_sender_id on message_archive(sender_id);
create index if not exists idx_message_archive_receiver_id on message_archive(receiver_id);
create index if not exists idx_message_archive_archived_at on message_archive(archived_at);

create table if not exists support_message_archive (
id text primary key,
supabase_support_message_id text,
ticket_id text,
sender_id text,
is_admin integer default 0,
message text,
original_created_at text,
archived_at text not null
);

create index if not exists idx_support_message_archive_ticket_id on support_message_archive(ticket_id);
create index if not exists idx_support_message_archive_sender_id on support_message_archive(sender_id);
create index if not exists idx_support_message_archive_archived_at on support_message_archive(archived_at);

create table if not exists feedback_messages (
id text primary key,
name text,
email text,
message text not null,
portal text,
metadata text,
created_at text not null
);

create index if not exists idx_feedback_messages_portal on feedback_messages(portal);
create index if not exists idx_feedback_messages_created_at on feedback_messages(created_at);

create table if not exists webhook_payload_archive (
id text primary key,
provider text not null,
event_type text,
order_id text,
payload_hash text,
payload text,
created_at text not null
);

create index if not exists idx_webhook_payload_archive_provider on webhook_payload_archive(provider);
create index if not exists idx_webhook_payload_archive_created_at on webhook_payload_archive(created_at);
