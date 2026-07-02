-- Older accounts predate public.profiles. They already completed onboarding
-- in clients/freelancers, but the missing bridge row caused social login to
-- send them back into signup.
with completed_legacy_accounts as (
  select
    u.id,
    coalesce(c.email, f.email, u.email) as email,
    coalesce(
      c.name,
      f.name,
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(coalesce(u.email, ''), '@', 1),
      'TeenVerse user'
    ) as full_name,
    coalesce(
      u.raw_user_meta_data->>'avatar_url',
      u.raw_user_meta_data->>'picture'
    ) as avatar_url,
    case
      when c.id is not null and f.id is null then 'business'
      else 'student'
    end as role
  from auth.users u
  left join public.clients c on c.id = u.id
  left join public.freelancers f on f.id = u.id
  where (
    coalesce(length(regexp_replace(c.phone, '\D', '', 'g')), 0) >= 10
    or coalesce(length(regexp_replace(f.phone, '\D', '', 'g')), 0) >= 10
  )
)
insert into public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  role,
  onboarding_completed,
  status
)
select
  legacy.id,
  legacy.email,
  legacy.full_name,
  legacy.avatar_url,
  legacy.role,
  true,
  'active'
from completed_legacy_accounts legacy
on conflict (id) do update
set
  email = coalesce(profiles.email, excluded.email),
  full_name = coalesce(profiles.full_name, excluded.full_name),
  avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
  onboarding_completed = true,
  updated_at = now();

-- Load the authenticated user's routing context in one database round trip.
-- RLS still applies because this function is SECURITY INVOKER and accepts no
-- user id from the caller.
create or replace function public.get_auth_bootstrap()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
  select jsonb_build_object(
    'profile', (
      select to_jsonb(p)
      from public.profiles p
      where p.id = me.user_id
    ),
    'admin', (
      select to_jsonb(a)
      from public.admins a
      where a.id = me.user_id
        or lower(a.email) = lower(me.email)
      limit 1
    ),
    'client', (
      select to_jsonb(c)
      from public.clients c
      where c.id = me.user_id
    ),
    'freelancer', (
      select to_jsonb(f)
      from public.freelancers f
      where f.id = me.user_id
    ),
    'parentMatch', (
      select jsonb_build_object('user_id', pc.user_id)
      from public.parent_consents pc
      where lower(pc.parent_email) = lower(me.email)
      limit 1
    )
  )
  from (
    select
      (select auth.uid()) as user_id,
      coalesce((select auth.jwt()->>'email'), '') as email
  ) me
  where me.user_id is not null;
$$;

revoke execute on function public.get_auth_bootstrap() from public, anon;
grant execute on function public.get_auth_bootstrap() to authenticated, service_role;
