-- Moves signup trust checks behind Edge Functions and database policy.

create or replace function public.normalize_indian_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  with digits as (
    select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') as raw_digits
  ),
  cleaned as (
    select regexp_replace(raw_digits, '^0+', '') as clean_digits
    from digits
  ),
  local_part as (
    select case
      when clean_digits like '91%' and length(clean_digits) = 12 then substring(clean_digits from 3)
      else clean_digits
    end as local_digits
    from cleaned
  )
  select case
    when local_digits ~ '^[6-9][0-9]{9}$' then '+91' || local_digits
    else null
  end
  from local_part;
$$;

create table if not exists public.auth_rate_limits (
  id bigint generated always as identity primary key,
  action text not null,
  rate_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_rate_limits_lookup_idx
  on public.auth_rate_limits (action, rate_key, created_at desc);

alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from anon, authenticated;
grant all on public.auth_rate_limits to service_role;

drop policy if exists "Service role manages auth rate limits" on public.auth_rate_limits;
create policy "Service role manages auth rate limits"
on public.auth_rate_limits for all
to service_role
using (true)
with check (true);

create table if not exists public.phone_otp_verifications (
  phone text primary key,
  msg91_identifier text not null,
  req_id text,
  access_token_hash text,
  provider_payload jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_by uuid references auth.users(id) on delete set null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_otp_verifications_phone_format_check
    check (public.normalize_indian_phone(phone) = phone)
);

create index if not exists phone_otp_verifications_consumed_by_idx
  on public.phone_otp_verifications (consumed_by);

alter table public.phone_otp_verifications enable row level security;
revoke all on public.phone_otp_verifications from anon, authenticated;
grant all on public.phone_otp_verifications to service_role;

drop policy if exists "Service role manages phone otp verifications" on public.phone_otp_verifications;
create policy "Service role manages phone otp verifications"
on public.phone_otp_verifications for all
to service_role
using (true)
with check (true);

do $$
begin
  if to_regclass('public.users') is not null then
    execute 'alter table public.users enable row level security';
    execute 'drop policy if exists "Users can read own user row" on public.users';
    execute 'drop policy if exists "Users can update own user row" on public.users';
    execute 'create policy "Users can read own user row" on public.users for select to authenticated using ((select auth.uid()) = id)';
    execute 'create policy "Users can update own user row" on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id)';
  end if;

  if to_regclass('public.freelancers') is not null then
    execute 'alter table public.freelancers enable row level security';
    execute 'drop policy if exists "Freelancers can read own profile" on public.freelancers';
    execute 'drop policy if exists "Freelancers can update own profile" on public.freelancers';
    execute 'create policy "Freelancers can read own profile" on public.freelancers for select to authenticated using ((select auth.uid()) = id)';
    execute 'create policy "Freelancers can update own profile" on public.freelancers for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id)';
  end if;

  if to_regclass('public.clients') is not null then
    execute 'alter table public.clients enable row level security';
    execute 'drop policy if exists "Clients can read own profile" on public.clients';
    execute 'drop policy if exists "Clients can update own profile" on public.clients';
    execute 'create policy "Clients can read own profile" on public.clients for select to authenticated using ((select auth.uid()) = id)';
    execute 'create policy "Clients can update own profile" on public.clients for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.freelancers') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'freelancers' and column_name = 'age'
    )
    and not exists (
      select 1 from public.freelancers
      where age is not null and (age < 14 or age > 21)
    )
    and not exists (
      select 1 from pg_constraint
      where conname = 'freelancers_age_check'
        and conrelid = 'public.freelancers'::regclass
    )
  then
    alter table public.freelancers
      add constraint freelancers_age_check check (age between 14 and 21);
  elsif to_regclass('public.freelancers') is not null then
    raise notice 'Skipped freelancers_age_check because existing data needs cleanup or constraint already exists.';
  end if;
end $$;

do $$
begin
  if to_regclass('public.freelancers') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'freelancers' and column_name = 'phone'
    )
    and not exists (
      select 1
      from public.freelancers
      where phone is not null
        and btrim(phone) <> ''
        and public.normalize_indian_phone(phone) is null
    )
    and not exists (
      select 1
      from public.freelancers
      where public.normalize_indian_phone(phone) is not null
      group by public.normalize_indian_phone(phone)
      having count(*) > 1
    )
  then
    execute 'create unique index if not exists freelancers_phone_normalized_unique on public.freelancers (public.normalize_indian_phone(phone)) where public.normalize_indian_phone(phone) is not null';
  elsif to_regclass('public.freelancers') is not null then
    raise notice 'Skipped freelancers phone unique index because existing phone data needs cleanup.';
  end if;

  if to_regclass('public.clients') is not null
    and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'clients' and column_name = 'phone'
    )
    and not exists (
      select 1
      from public.clients
      where phone is not null
        and btrim(phone) <> ''
        and public.normalize_indian_phone(phone) is null
    )
    and not exists (
      select 1
      from public.clients
      where public.normalize_indian_phone(phone) is not null
      group by public.normalize_indian_phone(phone)
      having count(*) > 1
    )
  then
    execute 'create unique index if not exists clients_phone_normalized_unique on public.clients (public.normalize_indian_phone(phone)) where public.normalize_indian_phone(phone) is not null';
  elsif to_regclass('public.clients') is not null then
    raise notice 'Skipped clients phone unique index because existing phone data needs cleanup.';
  end if;
end $$;
