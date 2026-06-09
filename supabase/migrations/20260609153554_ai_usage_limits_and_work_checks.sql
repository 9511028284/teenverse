create extension if not exists pgcrypto;

create table if not exists public.ai_usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature text not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  period_type text not null check (period_type in ('daily', 'weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature, period_type, period_start, period_end)
);

create index if not exists ai_usage_limits_user_feature_period_idx
  on public.ai_usage_limits (user_id, feature, period_type, period_start desc);

alter table public.ai_usage_limits enable row level security;

drop policy if exists "Users can view own ai usage limits" on public.ai_usage_limits;
drop policy if exists "Service role manages ai usage limits" on public.ai_usage_limits;

create policy "Users can view own ai usage limits"
on public.ai_usage_limits for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Service role manages ai usage limits"
on public.ai_usage_limits for all
to service_role
using (true)
with check (true);

grant select on public.ai_usage_limits to authenticated;
grant all on public.ai_usage_limits to service_role;

alter table if exists public.applications
  add column if not exists work_link text,
  add column if not exists work_message text,
  add column if not exists work_files jsonb not null default '[]'::jsonb,
  add column if not exists ai_check_score numeric,
  add column if not exists ai_check_status text check (ai_check_status in ('pass', 'second_check', 'reject', 'upgrade_required_for_second_check')),
  add column if not exists ai_check_issues jsonb not null default '[]'::jsonb,
  add column if not exists ai_check_suggestions jsonb not null default '[]'::jsonb,
  add column if not exists ai_check_reason text,
  add column if not exists ai_checked_at timestamptz,
  add column if not exists ai_second_check_required boolean not null default false;

create index if not exists applications_ai_check_status_idx
  on public.applications (ai_check_status, ai_checked_at desc);
