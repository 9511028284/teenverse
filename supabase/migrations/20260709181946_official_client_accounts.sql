-- Locked source of truth for client accounts that may render an official
-- verified badge on public job cards.
create table if not exists public.official_client_accounts (
  client_id uuid primary key references public.clients(id) on delete cascade,
  display_name text not null default 'TeenVerseHub',
  badge_label text not null default 'Official TeenVerseHub account',
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_client_accounts_display_name_not_blank
    check (btrim(display_name) <> ''),
  constraint official_client_accounts_badge_label_not_blank
    check (btrim(badge_label) <> '')
);

alter table public.official_client_accounts enable row level security;

revoke all on table public.official_client_accounts from anon, authenticated;
grant select on table public.official_client_accounts to anon, authenticated;
grant insert, update, delete on table public.official_client_accounts to authenticated;

drop policy if exists "official_client_accounts_public_select"
on public.official_client_accounts;
create policy "official_client_accounts_public_select"
on public.official_client_accounts
for select
to anon, authenticated
using (true);

drop policy if exists "official_client_accounts_admin_all"
on public.official_client_accounts;
create policy "official_client_accounts_admin_all"
on public.official_client_accounts
for all
to authenticated
using (public.tvh_is_admin(auth.uid()))
with check (public.tvh_is_admin(auth.uid()));

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
  ) then
    drop trigger if exists set_official_client_accounts_updated_at
    on public.official_client_accounts;

    create trigger set_official_client_accounts_updated_at
    before update on public.official_client_accounts
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- Promote the existing TeenVerseHub auth identity into a verified client
-- profile. Local/dev databases without this auth user will simply skip it.
with official_auth_user as (
  select id, email
  from auth.users
  where lower(email) = 'teenversehub@gmail.com'
  limit 1
),
upsert_profile as (
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    onboarding_completed,
    age_verified,
    status
  )
  select
    id,
    email,
    'TeenVerseHub',
    'business',
    true,
    true,
    'active'
  from official_auth_user
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      full_name = 'TeenVerseHub',
      onboarding_completed = true,
      updated_at = now()
  returning id
),
upsert_client as (
  insert into public.clients (
    id,
    name,
    email,
    is_organisation,
    kyc_status,
    is_kyc_verified,
    status,
    badges,
    bio,
    source,
    kyc_reviewed_at
  )
  select
    id,
    'TeenVerseHub',
    email,
    'true',
    'approved',
    true,
    'active',
    array['official_teenversehub', 'Shield Check'],
    'Official TeenVerseHub platform account for posting internal tasks.',
    'official_platform',
    now()
  from official_auth_user
  on conflict (id) do update
  set name = 'TeenVerseHub',
      email = coalesce(excluded.email, public.clients.email),
      is_organisation = 'true',
      kyc_status = 'approved',
      is_kyc_verified = true,
      status = 'active',
      badges = (
        select array_agg(distinct badge order by badge)
        from unnest(
          coalesce(public.clients.badges, '{}'::text[]) ||
          excluded.badges
        ) as badge
      ),
      bio = coalesce(public.clients.bio, excluded.bio),
      source = coalesce(public.clients.source, excluded.source),
      kyc_reviewed_at = coalesce(public.clients.kyc_reviewed_at, now())
  returning id
)
insert into public.official_client_accounts (
  client_id,
  display_name,
  badge_label,
  verified_at
)
select
  id,
  'TeenVerseHub',
  'Official TeenVerseHub account',
  now()
from upsert_client
on conflict (client_id) do update
set display_name = excluded.display_name,
    badge_label = excluded.badge_label,
    verified_at = coalesce(public.official_client_accounts.verified_at, excluded.verified_at),
    updated_at = now();
