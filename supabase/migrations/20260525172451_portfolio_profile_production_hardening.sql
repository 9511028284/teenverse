-- Production hardening for portfolio/profile.
-- Goals:
-- 1. Keep public profile portfolio data safe and column-limited.
-- 2. Rate-limit profile bundle reads per authenticated viewer.
-- 3. Add indexes used by the portfolio/profile modal.
-- 4. Keep direct table access governed by RLS; project history is exposed via RPC only.

create table if not exists public.profile_view_rate_limits (
  actor_id uuid not null,
  target_user_id uuid not null,
  bucket_start timestamptz not null,
  hits integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (actor_id, target_user_id, bucket_start)
);

alter table public.profile_view_rate_limits enable row level security;

revoke all on public.profile_view_rate_limits from anon, authenticated;
grant all on public.profile_view_rate_limits to service_role;

drop policy if exists "Admins can inspect profile rate limits" on public.profile_view_rate_limits;
create policy "Admins can inspect profile rate limits"
on public.profile_view_rate_limits
for select
to authenticated
using (public.is_admin());

create index if not exists applications_freelancer_status_created_idx
  on public.applications (freelancer_id, status, created_at desc);

create index if not exists services_freelancer_created_idx
  on public.services (freelancer_id, created_at desc);

create index if not exists portfolio_items_user_created_idx
  on public.portfolio_items (user_id, created_at desc);

create or replace function public.assert_public_profile_rate_limit(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_bucket timestamptz := date_trunc('minute', now());
  v_hits integer;
  v_limit integer := 60;
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return;
  end if;

  if v_actor is null then
    raise exception 'Authentication required to view profiles.';
  end if;

  insert into public.profile_view_rate_limits as limits (
    actor_id,
    target_user_id,
    bucket_start,
    hits,
    updated_at
  )
  values (
    v_actor,
    p_target_user_id,
    v_bucket,
    1,
    now()
  )
  on conflict (actor_id, target_user_id, bucket_start)
  do update
    set hits = limits.hits + 1,
        updated_at = now()
    where limits.hits < v_limit
  returning hits into v_hits;

  if v_hits is null then
    raise exception 'Too many profile requests. Please wait a minute and try again.';
  end if;
end;
$$;

revoke execute on function public.assert_public_profile_rate_limit(uuid) from public, anon;
grant execute on function public.assert_public_profile_rate_limit(uuid) to authenticated, service_role;

create or replace function public.get_public_profile_bundle(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user jsonb;
  v_badges jsonb := '[]'::jsonb;
  v_portfolio jsonb := '[]'::jsonb;
  v_projects jsonb := '[]'::jsonb;
  v_services jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    raise exception 'Missing profile id.';
  end if;

  perform public.assert_public_profile_rate_limit(p_user_id);

  select to_jsonb(profile)
  into v_user
  from (
    select
      id,
      name,
      bio,
      nationality,
      tag_line,
      unlocked_skills,
      created_at,
      social_links,
      cover_image,
      specialty,
      qualification
    from public.freelancers
    where id = p_user_id
  ) profile;

  if v_user is null then
    return jsonb_build_object(
      'user', null,
      'badges', '[]'::jsonb,
      'portfolio', '[]'::jsonb,
      'projects', '[]'::jsonb,
      'services', '[]'::jsonb,
      'resume', null
    );
  end if;

  select coalesce(jsonb_agg(to_jsonb(badge) order by badge.earned_at desc), '[]'::jsonb)
  into v_badges
  from (
    select
      badge_name as name,
      earned_at
    from public.user_badges
    where user_id = p_user_id
    order by earned_at desc
    limit 20
  ) badge;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.created_at desc), '[]'::jsonb)
  into v_portfolio
  from (
    select
      id,
      user_id,
      title,
      content,
      created_at
    from public.portfolio_items
    where user_id = p_user_id
    order by created_at desc
    limit 12
  ) item;

  select coalesce(jsonb_agg(project.payload order by project.sort_date desc), '[]'::jsonb)
  into v_projects
  from (
    select
      coalesce(a.completed_at, a.submitted_at, a.started_at, a.created_at) as sort_date,
      jsonb_build_object(
        'id', a.id,
        'job_id', a.job_id,
        'status', a.status,
        'bid_amount', a.bid_amount,
        'created_at', a.created_at,
        'started_at', a.started_at,
        'submitted_at', a.submitted_at,
        'completed_at', a.completed_at,
        'source', 'Verified Work',
        'jobs', jsonb_build_object(
          'title', j.title,
          'category', j.category,
          'budget', j.budget,
          'description', left(coalesce(j.description, ''), 700),
          'created_at', j.created_at
        )
      ) as payload
    from public.applications a
    left join public.jobs j on j.id = a.job_id
    where a.freelancer_id = p_user_id
      and a.status in ('Accepted', 'Submitted', 'Completed', 'Paid')
    order by coalesce(a.completed_at, a.submitted_at, a.started_at, a.created_at) desc
    limit 12
  ) project;

  select coalesce(jsonb_agg(to_jsonb(service) order by service.created_at desc), '[]'::jsonb)
  into v_services
  from (
    select
      id,
      freelancer_id,
      title,
      name,
      description,
      category,
      service_category,
      specialty,
      status,
      price,
      starting_price,
      rate,
      created_at
    from public.services
    where freelancer_id = p_user_id
    order by created_at desc
    limit 6
  ) service;

  return jsonb_build_object(
    'user', v_user,
    'badges', v_badges,
    'portfolio', v_portfolio,
    'projects', v_projects,
    'services', v_services,
    'resume', null
  );
end;
$$;

revoke execute on function public.get_public_profile_bundle(uuid) from public, anon;
grant execute on function public.get_public_profile_bundle(uuid) to authenticated, service_role;

alter table if exists public.portfolio_items enable row level security;

drop policy if exists "Portfolio items are readable by authenticated users" on public.portfolio_items;
create policy "Portfolio items are readable by authenticated users"
on public.portfolio_items
for select
to authenticated
using (true);

drop policy if exists "Users manage own portfolio items" on public.portfolio_items;
create policy "Users manage own portfolio items"
on public.portfolio_items
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
