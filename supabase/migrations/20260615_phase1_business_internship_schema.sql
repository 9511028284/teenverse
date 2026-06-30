begin;

create extension if not exists pgcrypto;

-- =====================================================
-- 1. Shared helper functions
-- =====================================================

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.admins a
    where a.id = check_user_id
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- 2. Unified profile layer
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'student'
    check (role in ('student', 'business', 'admin', 'guardian')),
  onboarding_completed boolean not null default false,
  age_verified boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'restricted', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Backfill profiles from existing users/freelancers/clients/admins

insert into public.profiles (id, email, full_name, avatar_url, role, created_at)
select
  u.id,
  u.email,
  u.full_name,
  u.avatar_url,
  'student',
  coalesce(u.created_at, now())
from public.users u
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role, created_at)
select
  f.id,
  f.email,
  f.name,
  'student',
  coalesce(f.created_at, now())
from public.freelancers f
on conflict (id) do update
set
  email = coalesce(public.profiles.email, excluded.email),
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  role = case
    when public.profiles.role = 'admin' then 'admin'
    else public.profiles.role
  end;

insert into public.profiles (id, email, full_name, role, created_at)
select
  c.id,
  c.email,
  c.name,
  'business',
  coalesce(c.created_at, now())
from public.clients c
on conflict (id) do update
set
  email = coalesce(public.profiles.email, excluded.email),
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  role = case
    when public.profiles.role = 'admin' then 'admin'
    else 'business'
  end;

insert into public.profiles (id, email, role, created_at)
select
  a.id,
  a.email,
  'admin',
  coalesce(a.created_at, now())
from public.admins a
on conflict (id) do update
set role = 'admin';

create or replace function public.profiles_protect_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role
       or new.age_verified is distinct from old.age_verified
       or new.status is distinct from old.status then
      raise exception 'Not allowed to update protected profile fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profiles_sensitive_fields on public.profiles;
create trigger protect_profiles_sensitive_fields
before update on public.profiles
for each row
execute function public.profiles_protect_sensitive_fields();

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('student', 'business', 'guardian')
);

drop policy if exists "profiles_self_update_safe" on public.profiles;
create policy "profiles_self_update_safe"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- =====================================================
-- 3. Business profiles
-- =====================================================

create table if not exists public.business_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  business_type text not null default 'startup'
    check (business_type in ('startup', 'agency', 'company', 'individual', 'ngo', 'college', 'other')),
  website text,
  contact_email text,
  contact_phone text,
  description text,
  location text,
  verification_status text not null default 'not_started'
    check (verification_status in ('not_started', 'pending', 'verified', 'rejected', 'suspended')),
  can_post boolean not null default false,
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

drop trigger if exists set_business_profiles_updated_at on public.business_profiles;
create trigger set_business_profiles_updated_at
before update on public.business_profiles
for each row
execute function public.set_updated_at();

insert into public.business_profiles (
  user_id,
  business_name,
  business_type,
  contact_email,
  contact_phone,
  description,
  verification_status,
  can_post,
  verified_at,
  created_at
)
select
  c.id,
  c.name,
  case
    when lower(coalesce(c.is_organisation, '')) in ('true', 'yes', '1', 'organisation', 'organization') then 'company'
    else 'individual'
  end,
  c.email,
  c.phone,
  c.bio,
  case
    when coalesce(c.is_kyc_verified, false) = true then 'verified'
    when c.kyc_status = 'approved' then 'verified'
    when c.kyc_status = 'pending' then 'pending'
    when c.kyc_status = 'rejected' then 'rejected'
    else 'not_started'
  end,
  case
    when coalesce(c.is_kyc_verified, false) = true or c.kyc_status = 'approved' then true
    else false
  end,
  c.kyc_reviewed_at,
  coalesce(c.created_at, now())
from public.clients c
on conflict (user_id) do nothing;

create or replace function public.business_profiles_protect_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.is_admin() then
    if new.verification_status is distinct from old.verification_status
       or new.can_post is distinct from old.can_post
       or new.verified_at is distinct from old.verified_at
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Only admins can update business verification fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_business_profiles_admin_fields on public.business_profiles;
create trigger protect_business_profiles_admin_fields
before update on public.business_profiles
for each row
execute function public.business_profiles_protect_admin_fields();

drop policy if exists "business_profiles_admin_all" on public.business_profiles;
create policy "business_profiles_admin_all"
on public.business_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "business_profiles_owner_select" on public.business_profiles;
create policy "business_profiles_owner_select"
on public.business_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "business_profiles_owner_insert" on public.business_profiles;
create policy "business_profiles_owner_insert"
on public.business_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'business'
      and p.status = 'active'
  )
);

drop policy if exists "business_profiles_owner_update" on public.business_profiles;
create policy "business_profiles_owner_update"
on public.business_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =====================================================
-- 4. Unified opportunities table
-- internships + freelance + jobs + ambassador programs
-- =====================================================

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(user_id) on delete cascade,
  type text not null
    check (type in ('internship', 'freelance', 'part_time', 'campus_ambassador', 'entry_level', 'startup_collab')),
  title text not null,
  description text not null,
  skills_required text[] not null default '{}',
  stipend_min numeric check (stipend_min is null or stipend_min >= 0),
  stipend_max numeric check (stipend_max is null or stipend_max >= 0),
  currency text not null default 'INR',
  duration text,
  work_mode text not null default 'remote'
    check (work_mode in ('remote', 'hybrid', 'onsite')),
  location text,
  is_paid boolean not null default true,
  application_deadline date,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'active', 'paused', 'closed', 'rejected')),
  rejection_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stipend_max is null or stipend_min is null or stipend_max >= stipend_min)
);

alter table public.opportunities enable row level security;

drop trigger if exists set_opportunities_updated_at on public.opportunities;
create trigger set_opportunities_updated_at
before update on public.opportunities
for each row
execute function public.set_updated_at();

create index if not exists idx_opportunities_business_id
on public.opportunities (business_id);

create index if not exists idx_opportunities_status_type_created
on public.opportunities (status, type, created_at desc);

create index if not exists idx_opportunities_skills_required
on public.opportunities using gin (skills_required);

drop policy if exists "opportunities_public_active_select" on public.opportunities;
create policy "opportunities_public_active_select"
on public.opportunities
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "opportunities_business_select_own" on public.opportunities;
create policy "opportunities_business_select_own"
on public.opportunities
for select
to authenticated
using (business_id = auth.uid());

drop policy if exists "opportunities_business_insert_own" on public.opportunities;
create policy "opportunities_business_insert_own"
on public.opportunities
for insert
to authenticated
with check (
  business_id = auth.uid()
  and status in ('draft', 'pending_review')
  and exists (
    select 1
    from public.business_profiles bp
    where bp.user_id = auth.uid()
      and bp.verification_status in ('pending', 'verified')
  )
);

drop policy if exists "opportunities_business_update_own" on public.opportunities;
create policy "opportunities_business_update_own"
on public.opportunities
for update
to authenticated
using (business_id = auth.uid())
with check (
  business_id = auth.uid()
  and status in ('draft', 'pending_review', 'paused', 'closed')
);

drop policy if exists "opportunities_admin_all" on public.opportunities;
create policy "opportunities_admin_all"
on public.opportunities
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- 5. Opportunity applications
-- =====================================================

create table if not exists public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cover_letter text,
  resume_file_id uuid,
  status text not null default 'applied'
    check (status in ('applied', 'shortlisted', 'selected', 'rejected', 'withdrawn', 'completed')),
  business_note text,
  rejection_reason text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, applicant_id)
);

alter table public.opportunity_applications enable row level security;

drop trigger if exists set_opportunity_applications_updated_at on public.opportunity_applications;
create trigger set_opportunity_applications_updated_at
before update on public.opportunity_applications
for each row
execute function public.set_updated_at();

create index if not exists idx_opportunity_applications_opportunity_id
on public.opportunity_applications (opportunity_id);

create index if not exists idx_opportunity_applications_applicant_id
on public.opportunity_applications (applicant_id);

create index if not exists idx_opportunity_applications_status
on public.opportunity_applications (status);

drop policy if exists "opportunity_applications_admin_all" on public.opportunity_applications;
create policy "opportunity_applications_admin_all"
on public.opportunity_applications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "opportunity_applications_applicant_insert" on public.opportunity_applications;
create policy "opportunity_applications_applicant_insert"
on public.opportunity_applications
for insert
to authenticated
with check (
  applicant_id = auth.uid()
  and status = 'applied'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
      and p.status = 'active'
  )
  and exists (
    select 1
    from public.opportunities o
    where o.id = opportunity_id
      and o.status = 'active'
  )
);

drop policy if exists "opportunity_applications_applicant_select" on public.opportunity_applications;
create policy "opportunity_applications_applicant_select"
on public.opportunity_applications
for select
to authenticated
using (applicant_id = auth.uid());

drop policy if exists "opportunity_applications_business_select" on public.opportunity_applications;
create policy "opportunity_applications_business_select"
on public.opportunity_applications
for select
to authenticated
using (
  exists (
    select 1
    from public.opportunities o
    where o.id = opportunity_id
      and o.business_id = auth.uid()
  )
);

drop policy if exists "opportunity_applications_business_update" on public.opportunity_applications;
create policy "opportunity_applications_business_update"
on public.opportunity_applications
for update
to authenticated
using (
  exists (
    select 1
    from public.opportunities o
    where o.id = opportunity_id
      and o.business_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.opportunities o
    where o.id = opportunity_id
      and o.business_id = auth.uid()
  )
);

drop policy if exists "opportunity_applications_applicant_withdraw" on public.opportunity_applications;
create policy "opportunity_applications_applicant_withdraw"
on public.opportunity_applications
for update
to authenticated
using (applicant_id = auth.uid())
with check (
  applicant_id = auth.uid()
  and status = 'withdrawn'
);

-- =====================================================
-- 6. Application status history
-- =====================================================

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.opportunity_applications(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

alter table public.application_status_history enable row level security;

create index if not exists idx_application_status_history_application_id
on public.application_status_history (application_id, created_at desc);

create or replace function public.log_opportunity_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    insert into public.application_status_history (
      application_id,
      old_status,
      new_status,
      changed_by
    )
    values (
      new.id,
      old.status,
      new.status,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists log_opportunity_application_status_change_trigger
on public.opportunity_applications;

create trigger log_opportunity_application_status_change_trigger
after update of status on public.opportunity_applications
for each row
execute function public.log_opportunity_application_status_change();

drop policy if exists "application_status_history_admin_select" on public.application_status_history;
create policy "application_status_history_admin_select"
on public.application_status_history
for select
to authenticated
using (public.is_admin());

drop policy if exists "application_status_history_participants_select" on public.application_status_history;
create policy "application_status_history_participants_select"
on public.application_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.opportunity_applications oa
    join public.opportunities o on o.id = oa.opportunity_id
    where oa.id = application_id
      and (
        oa.applicant_id = auth.uid()
        or o.business_id = auth.uid()
      )
  )
);

-- =====================================================
-- 7. R2 file metadata table
-- =====================================================

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  related_type text not null
    check (related_type in ('resume', 'kyc', 'chat', 'portfolio', 'project', 'business_doc', 'application')),
  related_id text,
  r2_bucket text not null,
  r2_object_key text not null unique,
  original_file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  visibility text not null default 'private'
    check (visibility in ('private', 'restricted', 'public')),
  status text not null default 'active'
    check (status in ('active', 'deleted', 'quarantined')),
  created_at timestamptz not null default now()
);

alter table public.uploaded_files enable row level security;

create index if not exists idx_uploaded_files_owner_id
on public.uploaded_files (owner_id, created_at desc);

create index if not exists idx_uploaded_files_related
on public.uploaded_files (related_type, related_id);

drop policy if exists "uploaded_files_public_select" on public.uploaded_files;
create policy "uploaded_files_public_select"
on public.uploaded_files
for select
to anon, authenticated
using (
  visibility = 'public'
  and status = 'active'
);

drop policy if exists "uploaded_files_owner_select" on public.uploaded_files;
create policy "uploaded_files_owner_select"
on public.uploaded_files
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "uploaded_files_owner_insert" on public.uploaded_files;
create policy "uploaded_files_owner_insert"
on public.uploaded_files
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and status = 'active'
);

drop policy if exists "uploaded_files_owner_update" on public.uploaded_files;
create policy "uploaded_files_owner_update"
on public.uploaded_files
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "uploaded_files_admin_all" on public.uploaded_files;
create policy "uploaded_files_admin_all"
on public.uploaded_files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Link application resume file after uploaded_files exists

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'opportunity_applications'
      and constraint_name = 'opportunity_applications_resume_file_id_fkey'
  ) then
    alter table public.opportunity_applications
    add constraint opportunity_applications_resume_file_id_fkey
    foreign key (resume_file_id)
    references public.uploaded_files(id)
    on delete set null;
  end if;
end $$;

create index if not exists idx_opportunity_applications_resume_file_id
on public.opportunity_applications (resume_file_id);

-- =====================================================
-- 8. Missing index fixes for existing tables
-- These are safe performance indexes only.
-- =====================================================

create index if not exists idx_applications_client_id
on public.applications (client_id);

create index if not exists idx_messages_sender_id
on public.messages (sender_id);

create index if not exists idx_messages_receiver_id
on public.messages (receiver_id);

create index if not exists idx_messages_chat_pair_created
on public.messages (sender_id, receiver_id, created_at desc);

create index if not exists idx_escrow_orders_client_id
on public.escrow_orders (client_id);

create index if not exists idx_escrow_orders_freelancer_id
on public.escrow_orders (freelancer_id);

create index if not exists idx_portfolio_items_user_id
on public.portfolio_items (user_id);

create index if not exists idx_resume_experiences_user_id
on public.resume_experiences (user_id);

create index if not exists idx_resume_projects_user_id
on public.resume_projects (user_id);

create index if not exists idx_resume_skills_user_id
on public.resume_skills (user_id);

create index if not exists idx_resumes_user_id
on public.resumes (user_id);

create index if not exists idx_services_freelancer_id
on public.services (freelancer_id);

create index if not exists idx_support_messages_sender_id
on public.support_messages (sender_id);

create index if not exists idx_support_messages_ticket_id
on public.support_messages (ticket_id);

create index if not exists idx_support_tickets_user_id
on public.support_tickets (user_id);

create index if not exists idx_reports_reporter_id
on public.reports (reporter_id);

create index if not exists idx_reports_reported_user_id
on public.reports (reported_user_id);

create index if not exists idx_wallet_transactions_reference_app_id
on public.wallet_transactions (reference_app_id);

create index if not exists idx_wallet_transactions_original_transaction_id
on public.wallet_transactions (original_transaction_id);

commit;
