-- Resume integrity hardening
-- Aligns storage and trust scoring with a transparency-first resume system.

create extension if not exists pgcrypto;

alter table if exists public.resume_experiences
  add column if not exists source text not null default 'manual',
  add column if not exists proof_status text not null default 'unverified',
  add column if not exists proof_metadata jsonb not null default '{}'::jsonb,
  add column if not exists proof_domain text,
  add column if not exists validation_http_status integer,
  add column if not exists flagged_reason text,
  add column if not exists risk_level text not null default 'low',
  add column if not exists platform_application_id bigint;

alter table if exists public.resume_skills
  add column if not exists source text not null default 'manual',
  add column if not exists proof_status text not null default 'unverified',
  add column if not exists proof_metadata jsonb not null default '{}'::jsonb,
  add column if not exists verification_id uuid,
  add column if not exists flagged_reason text;

alter table if exists public.resume_projects
  add column if not exists source text not null default 'manual',
  add column if not exists proof_status text not null default 'unverified',
  add column if not exists proof_metadata jsonb not null default '{}'::jsonb,
  add column if not exists flagged_reason text,
  add column if not exists risk_level text not null default 'low';

alter table if exists public.freelancers
  add column if not exists trust_score_breakdown jsonb not null default '[]'::jsonb,
  add column if not exists reputation_flag text,
  add column if not exists risk_level text not null default 'low',
  add column if not exists visibility_multiplier numeric not null default 1.00,
  add column if not exists bidding_restricted boolean not null default false,
  add column if not exists payout_review_required boolean not null default false,
  add column if not exists inconsistent_data_detected boolean not null default false,
  add column if not exists guardian_pan_hash text,
  add column if not exists account_number_hash text;

create table if not exists public.resume_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_type text not null check (target_type in ('experience', 'skill', 'project')),
  target_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  method text not null default 'manual_review',
  source text not null default 'manual' check (source in ('manual', 'ai', 'platform', 'github', 'portfolio', 'skill_test', 'certificate')),
  evidence_url text,
  evidence_domain text,
  evidence_metadata jsonb not null default '{}'::jsonb,
  reviewer_id uuid,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_id)
);

alter table if exists public.resume_verifications
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists method text not null default 'manual_review',
  add column if not exists source text not null default 'manual',
  add column if not exists evidence_url text,
  add column if not exists evidence_domain text,
  add column if not exists evidence_metadata jsonb not null default '{}'::jsonb,
  add column if not exists reviewer_id uuid,
  add column if not exists rejection_reason text,
  add column if not exists updated_at timestamptz not null default now();

update public.resume_verifications
set
  target_type = coalesce(target_type, section),
  target_id = coalesce(target_id, reference_id),
  evidence_url = coalesce(evidence_url, proof_url),
  evidence_domain = coalesce(
    evidence_domain,
    nullif(regexp_replace(proof_url, '^https?://([^/]+).*$','\1'), proof_url)
  )
where target_type is null
   or target_id is null
   or evidence_url is null
   or evidence_domain is null;

create unique index if not exists resume_verifications_target_unique
  on public.resume_verifications (target_type, target_id)
  where target_type is not null and target_id is not null;

create index if not exists resume_verifications_user_status_idx
  on public.resume_verifications (user_id, status, target_type);

create table if not exists public.consistency_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_type text not null check (target_type in ('experience', 'skill', 'project', 'identity', 'banking', 'profile')),
  target_id uuid,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  code text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists consistency_flags_user_status_idx
  on public.consistency_flags (user_id, status, severity);

create table if not exists public.resume_proof_validation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  experience_id uuid,
  proof_url text not null,
  proof_domain text,
  http_status integer,
  is_allowed_domain boolean not null default false,
  is_reachable boolean not null default false,
  response_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists freelancers_guardian_pan_hash_unique
  on public.freelancers (guardian_pan_hash)
  where guardian_pan_hash is not null;

create unique index if not exists freelancers_account_number_hash_unique
  on public.freelancers (account_number_hash)
  where account_number_hash is not null;

create or replace function public.sync_resume_verification_state()
returns trigger
language plpgsql
as $$
begin
  update public.resume_experiences e
  set is_verified = (new.status = 'verified'),
      proof_status = new.status,
      proof_metadata = new.evidence_metadata,
      proof_domain = new.evidence_domain,
      source = case when new.source = 'platform' then 'platform' else coalesce(e.source, 'manual') end
  where new.target_type = 'experience'
    and e.id = new.target_id;

  update public.resume_skills s
  set is_verified = (new.status = 'verified'),
      proof_status = new.status,
      proof_metadata = new.evidence_metadata,
      source = case when new.source in ('skill_test', 'certificate', 'platform') then new.source else coalesce(s.source, 'manual') end,
      verification_id = new.id
  where new.target_type = 'skill'
    and s.id = new.target_id;

  update public.resume_projects p
  set proof_status = new.status,
      proof_metadata = new.evidence_metadata,
      source = case when new.source = 'platform' then 'platform' else coalesce(p.source, 'manual') end
  where new.target_type = 'project'
    and p.id = new.target_id;

  return new;
end;
$$;

drop trigger if exists trg_sync_resume_verification_state on public.resume_verifications;
create trigger trg_sync_resume_verification_state
after insert or update of status, evidence_metadata, evidence_domain, source
on public.resume_verifications
for each row execute function public.sync_resume_verification_state();

create or replace function public.flag_resume_timeline_risk()
returns trigger
language plpgsql
as $$
declare
  overlap_count integer := 0;
  duration_months integer := 0;
begin
  if new.start_date is not null and new.end_date is not null then
    duration_months := (
      extract(year from age(new.end_date, new.start_date))::integer * 12
      + extract(month from age(new.end_date, new.start_date))::integer
    );

    if new.end_date < new.start_date then
      insert into public.consistency_flags (user_id, target_type, target_id, severity, code, message, metadata)
      values (new.user_id, 'experience', new.id, 'high', 'INVALID_DATE_RANGE', 'Experience end date is before start date.', jsonb_build_object('start_date', new.start_date, 'end_date', new.end_date));
      new.risk_level := 'high';
    elsif duration_months > 60 and coalesce(new.source, 'manual') <> 'platform' then
      insert into public.consistency_flags (user_id, target_type, target_id, severity, code, message, metadata)
      values (new.user_id, 'experience', new.id, 'medium', 'UNUSUAL_DURATION', 'Self-declared experience duration is unusually long.', jsonb_build_object('duration_months', duration_months));
      if new.risk_level <> 'high' then
        new.risk_level := 'medium';
      end if;
    end if;
  end if;

  select count(*)
  into overlap_count
  from public.resume_experiences e
  where e.user_id = new.user_id
    and e.id <> new.id
    and e.start_date is not null
    and coalesce(e.end_date, current_date) >= coalesce(new.start_date, e.start_date)
    and coalesce(new.end_date, current_date) >= e.start_date;

  if overlap_count > 1 and coalesce(new.source, 'manual') <> 'platform' then
    insert into public.consistency_flags (user_id, target_type, target_id, severity, code, message, metadata)
    values (new.user_id, 'experience', new.id, 'medium', 'TIMELINE_OVERLAP', 'Multiple self-declared experiences overlap on the timeline.', jsonb_build_object('overlap_count', overlap_count));
    if new.risk_level <> 'high' then
      new.risk_level := 'medium';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_flag_resume_timeline_risk on public.resume_experiences;
create trigger trg_flag_resume_timeline_risk
before insert or update of start_date, end_date, source
on public.resume_experiences
for each row execute function public.flag_resume_timeline_risk();

create or replace function public.apply_reputation_risk(p_user uuid)
returns text
language plpgsql
security definer
as $$
declare
  high_count integer := 0;
  medium_count integer := 0;
  resolved_risk text := 'low';
begin
  select
    count(*) filter (where severity = 'high' and status in ('open', 'reviewing')),
    count(*) filter (where severity = 'medium' and status in ('open', 'reviewing'))
  into high_count, medium_count
  from public.consistency_flags
  where user_id = p_user;

  if high_count > 0 then
    resolved_risk := 'high';
  elsif medium_count >= 2 then
    resolved_risk := 'medium';
  else
    resolved_risk := 'low';
  end if;

  update public.freelancers
  set risk_level = resolved_risk,
      inconsistent_data_detected = (resolved_risk <> 'low'),
      visibility_multiplier = case resolved_risk when 'high' then 0.25 when 'medium' then 0.70 else 1.00 end,
      bidding_restricted = (resolved_risk = 'high'),
      payout_review_required = (resolved_risk in ('medium', 'high')),
      reputation_flag = case resolved_risk
        when 'high' then 'Inconsistent Data Detected'
        when 'medium' then 'Needs Trust Review'
        else null
      end
  where id = p_user;

  return resolved_risk;
end;
$$;

create or replace function public.calculate_trust_score(p_user uuid)
returns integer
language plpgsql
security definer
as $$
declare
  kyc_points integer := 0;
  verified_work_points integer := 0;
  verified_experience_points integer := 0;
  verified_skill_points integer := 0;
  ai_penalty integer := 0;
  inconsistent_penalty integer := 0;
  risk_penalty integer := 0;
  total_score integer := 0;
  current_risk text := 'low';
  breakdown jsonb := '[]'::jsonb;
begin
  current_risk := public.apply_reputation_risk(p_user);

  if exists (
    select 1
    from public.freelancers f
    where f.id = p_user
      and (
        coalesce(f.is_kyc_verified, false) = true
        or coalesce(f.kyc_status, '') = 'verified'
      )
  ) then
    kyc_points := 30;
  end if;

  select least(count(*) * 10, 20)
  into verified_work_points
  from public.applications a
  where a.freelancer_id = p_user
    and a.status in ('Accepted', 'Completed', 'Paid', 'Processing');

  select coalesce(floor(sum(points)), 0)::integer
  into verified_experience_points
  from (
    select
      least(8.0 / row_number() over (order by coalesce(rv.updated_at, rv.created_at) desc), 8.0) as points
    from public.resume_verifications rv
    where rv.user_id = p_user
      and rv.target_type = 'experience'
      and rv.status = 'verified'
  ) ranked_experience;

  verified_experience_points := least(verified_experience_points, 20);

  select coalesce(floor(sum(points)), 0)::integer
  into verified_skill_points
  from (
    select
      least(3.0 / row_number() over (order by coalesce(rv.updated_at, rv.created_at) desc), 3.0) as points
    from public.resume_verifications rv
    where rv.user_id = p_user
      and rv.target_type = 'skill'
      and rv.status = 'verified'
      and (
        rv.source in ('skill_test', 'certificate', 'platform')
        or exists (
          select 1
          from public.user_skill_scores uss
          where uss.user_id = p_user
            and lower(uss.skill) = lower(coalesce((rv.evidence_metadata ->> 'skill_name'), ''))
            and coalesce(uss.score, 0) >= 60
        )
      )
  ) ranked_skills;

  verified_skill_points := least(verified_skill_points, 10);

  select case when exists (
    select 1 from public.resume_experiences e
    where e.user_id = p_user
      and coalesce(e.source, 'manual') = 'ai'
  ) or exists (
    select 1 from public.resume_skills s
    where s.user_id = p_user
      and coalesce(s.source, 'manual') = 'ai'
  ) or exists (
    select 1 from public.resume_projects p
    where p.user_id = p_user
      and coalesce(p.source, 'manual') = 'ai'
  ) then -15 else 0 end
  into ai_penalty;

  select case when exists (
    select 1 from public.freelancers f
    where f.id = p_user
      and coalesce(f.inconsistent_data_detected, false) = true
  ) then -20 else 0 end
  into inconsistent_penalty;

  risk_penalty := case current_risk
    when 'high' then -30
    when 'medium' then -15
    else 0
  end;

  total_score := greatest(0, kyc_points + verified_work_points + verified_experience_points + verified_skill_points + ai_penalty + inconsistent_penalty + risk_penalty);

  breakdown := jsonb_build_array(
    jsonb_build_object('label', 'KYC', 'value', kyc_points),
    jsonb_build_object('label', 'Platform Verified Work', 'value', verified_work_points),
    jsonb_build_object('label', 'Verified Experience', 'value', verified_experience_points),
    jsonb_build_object('label', 'Verified Skills', 'value', verified_skill_points),
    jsonb_build_object('label', 'AI Data Penalty', 'value', ai_penalty),
    jsonb_build_object('label', 'Inconsistency Penalty', 'value', inconsistent_penalty),
    jsonb_build_object('label', 'Risk Penalty', 'value', risk_penalty)
  );

  update public.freelancers
  set trust_score = total_score,
      trust_score_breakdown = breakdown
  where id = p_user;

  return total_score;
end;
$$;

create or replace view public.platform_verified_resume_work as
select
  a.id,
  a.freelancer_id as user_id,
  coalesce(j.title, 'Platform Work') as title,
  a.status,
  a.bid_amount,
  a.created_at,
  coalesce(a.paid_at, a.completed_at, a.submitted_at, a.started_at, a.created_at) as updated_at
from public.applications a
left join public.jobs j on j.id = a.job_id
where a.status in ('Accepted', 'Submitted', 'Completed', 'Paid', 'Processing');

comment on view public.platform_verified_resume_work is
'Platform-backed work items that can be shown in the VERIFIED section of resumes.';

create or replace view public.client_resume_view as
select
  f.id as user_id,
  f.name,
  f.specialty,
  f.trust_score,
  f.trust_score_breakdown,
  f.risk_level,
  coalesce(platform_work.items, '[]'::jsonb) as verified_platform_work,
  coalesce(verified_experiences.items, '[]'::jsonb) as verified_experiences,
  coalesce(verified_skills.items, '[]'::jsonb) as verified_skills
from public.freelancers f
left join lateral (
  select jsonb_agg(jsonb_build_object(
    'id', pvw.id,
    'title', pvw.title,
    'status', pvw.status,
    'created_at', pvw.created_at,
    'updated_at', pvw.updated_at
  ) order by pvw.updated_at desc) as items
  from public.platform_verified_resume_work pvw
  where pvw.user_id = f.id
) platform_work on true
left join lateral (
  select jsonb_agg(jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'company', e.company,
    'description', e.description,
    'start_date', e.start_date,
    'end_date', e.end_date,
    'proof_metadata', e.proof_metadata
  ) order by e.start_date desc nulls last) as items
  from public.resume_experiences e
  join public.resume_verifications rv
    on rv.target_type = 'experience'
   and rv.target_id = e.id
   and rv.status = 'verified'
  where e.user_id = f.id
) verified_experiences on true
left join lateral (
  select jsonb_agg(jsonb_build_object(
    'id', s.id,
    'skill_name', s.skill_name,
    'source', s.source,
    'proof_metadata', s.proof_metadata
  ) order by s.created_at desc nulls last) as items
  from public.resume_skills s
  join public.resume_verifications rv
    on rv.target_type = 'skill'
   and rv.target_id = s.id
   and rv.status = 'verified'
  where s.user_id = f.id
) verified_skills on true
where coalesce(f.risk_level, 'low') <> 'high';

comment on view public.client_resume_view is
'Client-safe resume surface. It excludes self-declared and AI-only resume claims and hides high-risk profiles.';
