alter table if exists public.applications
  drop constraint if exists applications_ai_check_status_check;

alter table if exists public.applications
  add constraint applications_ai_check_status_check
  check (ai_check_status in ('pass', 'second_check', 'reject', 'upgrade_required_for_second_check'));
