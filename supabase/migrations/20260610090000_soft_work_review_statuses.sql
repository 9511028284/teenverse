alter table if exists public.applications
  add column if not exists ai_check_score numeric,
  add column if not exists ai_check_status text,
  add column if not exists ai_check_issues jsonb not null default '[]'::jsonb,
  add column if not exists ai_check_suggestions jsonb not null default '[]'::jsonb,
  add column if not exists ai_check_reason text,
  add column if not exists ai_checked_at timestamptz,
  add column if not exists ai_second_check_required boolean not null default false;

alter table if exists public.applications
  drop constraint if exists applications_ai_check_status_check;

update public.applications
set ai_check_status = case ai_check_status
  when 'pass' then 'ready_for_client'
  when 'second_check' then 'needs_minor_clarification'
  when 'upgrade_required_for_second_check' then 'needs_minor_clarification'
  when 'reject' then 'needs_revision'
  else ai_check_status
end
where ai_check_status in ('pass', 'second_check', 'upgrade_required_for_second_check', 'reject');

alter table if exists public.applications
  add constraint applications_ai_check_status_check
  check (ai_check_status in ('ready_for_client', 'needs_minor_clarification', 'needs_revision'));

create index if not exists applications_ai_check_status_idx
  on public.applications (ai_check_status, ai_checked_at desc);
