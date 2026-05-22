-- Subscription and RLS hardening.
-- Enforces premium access server-side and closes public tables that had RLS disabled.

create extension if not exists pgcrypto;

create or replace function public.normalize_freelancer_subscription(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.freelancers%rowtype;
  v_is_self boolean := (auth.uid() = p_user_id);
  v_is_admin boolean := public.is_admin();
begin
  if p_user_id is null then
    raise exception 'Missing user id.';
  end if;

  if not (v_is_self or v_is_admin or auth.role() = 'service_role') then
    raise exception 'Unauthorized subscription refresh.';
  end if;

  update public.freelancers
  set current_plan = 'Basic',
      bids_remaining = 5,
      resumes_remaining = 1,
      plan_expires_at = null
  where id = p_user_id
    and current_plan <> 'Basic'
    and plan_expires_at is not null
    and plan_expires_at <= now()
  returning * into v_profile;

  if v_profile.id is null then
    select * into v_profile
    from public.freelancers
    where id = p_user_id;
  end if;

  return jsonb_build_object(
    'success', v_profile.id is not null,
    'current_plan', coalesce(v_profile.current_plan, 'Basic'),
    'plan_expires_at', v_profile.plan_expires_at,
    'bids_remaining', coalesce(v_profile.bids_remaining, 5),
    'resumes_remaining', coalesce(v_profile.resumes_remaining, 1),
    'wallet_balance', coalesce(v_profile.wallet_balance, 0)
  );
end;
$$;

drop function if exists public.grant_subscription_access(uuid, text, integer, numeric, boolean);

create or replace function public.grant_subscription_access(
  p_user_id uuid,
  p_plan_name text,
  p_duration_months integer,
  p_paid_amount numeric default 0,
  p_wallet_amount numeric default 0,
  p_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance numeric := 0;
  v_new_bids integer;
  v_new_resumes integer;
  v_badge_name text;
  v_expires_at timestamptz;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'Subscription grants must be performed by a trusted backend.';
  end if;

  if p_plan_name ilike 'Starter' then
    v_new_bids := 12;
    v_new_resumes := 2;
    v_badge_name := 'Starter';
  elsif p_plan_name ilike 'Pro' then
    v_new_bids := 18;
    v_new_resumes := 6;
    v_badge_name := 'Pro';
  elsif p_plan_name ilike 'Elite' then
    v_new_bids := 99999;
    v_new_resumes := 99999;
    v_badge_name := 'Elite';
  else
    return jsonb_build_object('success', false, 'error', 'Invalid plan selected.');
  end if;

  if coalesce(p_wallet_amount, 0) < 0 or coalesce(p_paid_amount, 0) < 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid payment amount.');
  end if;

  select wallet_balance
  into v_current_balance
  from public.freelancers
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Freelancer profile not found.');
  end if;

  if coalesce(p_wallet_amount, 0) > 0 then
    if coalesce(v_current_balance, 0) < p_wallet_amount then
      return jsonb_build_object('success', false, 'error', 'Insufficient wallet balance.');
    end if;

    update public.freelancers
    set wallet_balance = wallet_balance - p_wallet_amount
    where id = p_user_id;

    insert into public.wallet_transactions (user_id, amount, transaction_type, description)
    values (p_user_id, p_wallet_amount, 'DEBIT', 'Purchased ' || p_plan_name || ' Subscription');
  end if;

  v_expires_at := now() + (greatest(coalesce(p_duration_months, 1), 1) || ' months')::interval;

  update public.freelancers
  set current_plan = p_plan_name,
      bids_remaining = v_new_bids,
      resumes_remaining = v_new_resumes,
      plan_expires_at = v_expires_at
  where id = p_user_id;

  if not exists (
    select 1
    from public.user_badges
    where user_id = p_user_id
      and badge_name = v_badge_name
  ) then
    insert into public.user_badges (user_id, badge_name)
    values (p_user_id, v_badge_name);
  end if;

  if coalesce(p_paid_amount, 0) > 0 then
    insert into public.payment_logs (order_id, amount, status, raw_data)
    values (
      coalesce(p_order_id, 'subscription-' || gen_random_uuid()::text),
      p_paid_amount,
      'PAID',
      jsonb_build_object('type', 'subscription', 'plan', p_plan_name, 'wallet_amount', coalesce(p_wallet_amount, 0))
    );
  end if;

  insert into public.audit_logs (action, actor_id, details)
  values (
    'SUBSCRIPTION_UPGRADED',
    p_user_id::text,
    jsonb_build_object(
      'plan', p_plan_name,
      'duration_months', p_duration_months,
      'paid_amount', coalesce(p_paid_amount, 0),
      'wallet_amount', coalesce(p_wallet_amount, 0),
      'order_id', p_order_id,
      'expires_at', v_expires_at
    )
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Subscription upgraded successfully.',
    'current_plan', p_plan_name,
    'plan_expires_at', v_expires_at,
    'bids_remaining', v_new_bids,
    'resumes_remaining', v_new_resumes
  );
end;
$$;

create or replace function public.decrement_resume_limit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resumes integer;
  v_plan text;
begin
  if auth.uid() <> p_user_id then
    raise exception 'Unauthorized resume limit update.';
  end if;

  perform public.normalize_freelancer_subscription(p_user_id);

  select resumes_remaining, current_plan
  into v_resumes, v_plan
  from public.freelancers
  where id = p_user_id
  for update;

  if v_plan = 'Elite' then
    return jsonb_build_object('success', true);
  end if;

  if coalesce(v_resumes, 0) <= 0 then
    return jsonb_build_object('success', false, 'error', 'Resume limit reached.');
  end if;

  update public.freelancers
  set resumes_remaining = resumes_remaining - 1
  where id = p_user_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.apply_for_job_with_energy(
  p_job_id bigint,
  p_freelancer_id uuid,
  p_freelancer_name text,
  p_client_id uuid,
  p_cover_letter text,
  p_bid_amount numeric,
  p_is_educational_waiver_signed boolean,
  p_energy_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_energy integer;
  v_bids_remaining integer;
  v_current_plan text;
  v_plan_expires_at timestamptz;
  v_is_kyc_verified boolean;
  v_kyc_status text;
  v_status text;
  v_email text;
  v_job_client_id uuid;
  v_job_is_elite boolean;
  v_new_app_id bigint;
begin
  if auth.uid() <> p_freelancer_id then
    raise exception 'Unauthorized application attempt.';
  end if;

  if coalesce(p_energy_cost, 0) <= 0 then
    raise exception 'Invalid energy cost.';
  end if;

  perform public.normalize_freelancer_subscription(p_freelancer_id);

  select energy_points,
         bids_remaining,
         current_plan,
         plan_expires_at,
         is_kyc_verified,
         kyc_status,
         status,
         email
  into v_current_energy,
       v_bids_remaining,
       v_current_plan,
       v_plan_expires_at,
       v_is_kyc_verified,
       v_kyc_status,
       v_status,
       v_email
  from public.freelancers
  where id = p_freelancer_id
  for update;

  if not found then
    raise exception 'Freelancer profile not found.';
  end if;

  if coalesce(v_status, 'active') = 'banned' then
    raise exception 'This account cannot apply for missions.';
  end if;

  if not (coalesce(v_is_kyc_verified, false) or coalesce(v_kyc_status, '') in ('approved', 'verified')) then
    raise exception 'Identity verification is required before applying.';
  end if;

  select client_id, coalesce(is_elite, false)
  into v_job_client_id, v_job_is_elite
  from public.jobs
  where id = p_job_id
    and coalesce(deleted_at is null, true)
    and coalesce(is_archived, false) = false;

  if not found then
    raise exception 'Mission is no longer available.';
  end if;

  if v_job_client_id <> p_client_id then
    raise exception 'Mission/client mismatch.';
  end if;

  if v_job_is_elite and not (v_current_plan = 'Elite' and v_plan_expires_at > now()) then
    raise exception 'Elite subscription is required to apply for this mission.';
  end if;

  if coalesce(v_current_energy, 0) < p_energy_cost then
    raise exception 'Insufficient energy points. Required: %, Current: %', p_energy_cost, coalesce(v_current_energy, 0);
  end if;

  if v_current_plan <> 'Elite' and coalesce(v_bids_remaining, 0) <= 0 then
    raise exception 'Monthly bid limit reached. Upgrade your plan to continue applying.';
  end if;

  if exists (
    select 1
    from public.applications
    where job_id = p_job_id
      and freelancer_id = p_freelancer_id
  ) then
    raise exception 'You have already applied for this mission.';
  end if;

  update public.freelancers
  set energy_points = energy_points - p_energy_cost,
      bids_remaining = case
        when v_current_plan = 'Elite' then bids_remaining
        else greatest(coalesce(bids_remaining, 0) - 1, 0)
      end
  where id = p_freelancer_id;

  insert into public.applications (
    job_id,
    freelancer_id,
    freelancer_name,
    client_id,
    cover_letter,
    bid_amount,
    is_educational_waiver_signed,
    freelancer_email
  ) values (
    p_job_id,
    p_freelancer_id,
    p_freelancer_name,
    p_client_id,
    p_cover_letter,
    p_bid_amount,
    p_is_educational_waiver_signed,
    coalesce(v_email, '')
  )
  returning id into v_new_app_id;

  return jsonb_build_object('success', true, 'application_id', v_new_app_id);
end;
$$;

alter table public.freelancers enable row level security;
revoke update on public.freelancers from anon, authenticated;
grant update (
  name,
  phone,
  nationality,
  working_time,
  hourly_rate,
  upi,
  projects,
  qualification,
  specialty,
  services,
  resume_url,
  unlocked_skills,
  parent_email,
  bio,
  tag_line,
  social_links,
  cover_image,
  journey_statement,
  bank_name,
  account_number,
  ifsc_code
) on public.freelancers to authenticated;

alter table public.badges enable row level security;
drop policy if exists "Badges are publicly readable" on public.badges;
drop policy if exists "Admins manage badges" on public.badges;
create policy "Badges are publicly readable"
on public.badges for select
to anon, authenticated
using (true);
create policy "Admins manage badges"
on public.badges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.user_badges enable row level security;
drop policy if exists "Users may add own non premium badges" on public.user_badges;
drop policy if exists "Admins manage user badges" on public.user_badges;
create policy "Users may add own non premium badges"
on public.user_badges for insert
to authenticated
with check (
  user_id = auth.uid()
  and coalesce(badge_name, '') not in ('Starter', 'Pro', 'Elite')
);
create policy "Admins manage user badges"
on public.user_badges for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.academy_quizzes enable row level security;
drop policy if exists "Authenticated users can read academy quizzes" on public.academy_quizzes;
drop policy if exists "Admins manage academy quizzes" on public.academy_quizzes;
create policy "Authenticated users can read academy quizzes"
on public.academy_quizzes for select
to authenticated
using (true);
create policy "Admins manage academy quizzes"
on public.academy_quizzes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.ai_usage_logs enable row level security;
drop policy if exists "Admins can view ai usage logs" on public.ai_usage_logs;
drop policy if exists "Service role manages ai usage logs" on public.ai_usage_logs;
create policy "Admins can view ai usage logs"
on public.ai_usage_logs for select
to authenticated
using (public.is_admin());
create policy "Service role manages ai usage logs"
on public.ai_usage_logs for all
to service_role
using (true)
with check (true);

alter table public.wallet_transactions enable row level security;
drop policy if exists "Users view own wallet transactions" on public.wallet_transactions;
drop policy if exists "Admins manage wallet transactions" on public.wallet_transactions;
drop policy if exists "Service role manages wallet transactions" on public.wallet_transactions;
create policy "Users view own wallet transactions"
on public.wallet_transactions for select
to authenticated
using (user_id = auth.uid());
create policy "Admins manage wallet transactions"
on public.wallet_transactions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Service role manages wallet transactions"
on public.wallet_transactions for all
to service_role
using (true)
with check (true);

alter table public.support_tickets enable row level security;
drop policy if exists "Users manage own support tickets" on public.support_tickets;
drop policy if exists "Admins manage support tickets" on public.support_tickets;
create policy "Users manage own support tickets"
on public.support_tickets for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "Admins manage support tickets"
on public.support_tickets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.support_messages enable row level security;
drop policy if exists "Ticket participants read support messages" on public.support_messages;
drop policy if exists "Users send own support messages" on public.support_messages;
drop policy if exists "Admins manage support messages" on public.support_messages;
create policy "Ticket participants read support messages"
on public.support_messages for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.support_tickets st
    where st.id = support_messages.ticket_id
      and st.user_id = auth.uid()
  )
);
create policy "Users send own support messages"
on public.support_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and coalesce(is_admin, false) = false
  and exists (
    select 1
    from public.support_tickets st
    where st.id = ticket_id
      and st.user_id = auth.uid()
  )
);
create policy "Admins manage support messages"
on public.support_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.resume_experiences enable row level security;
drop policy if exists "Users manage own resume experiences" on public.resume_experiences;
drop policy if exists "Verified resume experiences are readable" on public.resume_experiences;
drop policy if exists "Admins manage resume experiences" on public.resume_experiences;
create policy "Users manage own resume experiences"
on public.resume_experiences for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "Verified resume experiences are readable"
on public.resume_experiences for select
to authenticated
using (
  coalesce(is_verified, false) = true
  or proof_status = 'verified'
);
create policy "Admins manage resume experiences"
on public.resume_experiences for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.resume_skills enable row level security;
drop policy if exists "Users manage own resume skills" on public.resume_skills;
drop policy if exists "Verified resume skills are readable" on public.resume_skills;
drop policy if exists "Admins manage resume skills" on public.resume_skills;
create policy "Users manage own resume skills"
on public.resume_skills for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "Verified resume skills are readable"
on public.resume_skills for select
to authenticated
using (
  coalesce(is_verified, false) = true
  or proof_status = 'verified'
);
create policy "Admins manage resume skills"
on public.resume_skills for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.resume_projects enable row level security;
drop policy if exists "Users manage own resume projects" on public.resume_projects;
drop policy if exists "Verified resume projects are readable" on public.resume_projects;
drop policy if exists "Admins manage resume projects" on public.resume_projects;
create policy "Users manage own resume projects"
on public.resume_projects for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy "Verified resume projects are readable"
on public.resume_projects for select
to authenticated
using (
  coalesce(verified, false) = true
  or proof_status = 'verified'
);
create policy "Admins manage resume projects"
on public.resume_projects for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.resume_verifications
  add column if not exists evidence_url text;

alter table public.resume_verifications enable row level security;
drop policy if exists "Users view own resume verifications" on public.resume_verifications;
drop policy if exists "Users create own pending resume verifications" on public.resume_verifications;
drop policy if exists "Users update own resume verifications" on public.resume_verifications;
drop policy if exists "Admins manage resume verifications" on public.resume_verifications;
drop policy if exists "Service role manages resume verifications" on public.resume_verifications;
create policy "Users view own resume verifications"
on public.resume_verifications for select
to authenticated
using (user_id = auth.uid());
create policy "Users create own pending resume verifications"
on public.resume_verifications for insert
to authenticated
with check (
  user_id = auth.uid()
  and status in ('pending', 'verified')
);
create policy "Users update own resume verifications"
on public.resume_verifications for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and status in ('pending', 'verified')
);
create policy "Admins manage resume verifications"
on public.resume_verifications for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Service role manages resume verifications"
on public.resume_verifications for all
to service_role
using (true)
with check (true);

alter table public.user_skill_scores enable row level security;
drop policy if exists "Users view own skill scores" on public.user_skill_scores;
drop policy if exists "Admins manage skill scores" on public.user_skill_scores;
drop policy if exists "Service role manages skill scores" on public.user_skill_scores;
create policy "Users view own skill scores"
on public.user_skill_scores for select
to authenticated
using (user_id = auth.uid());
create policy "Admins manage skill scores"
on public.user_skill_scores for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Service role manages skill scores"
on public.user_skill_scores for all
to service_role
using (true)
with check (true);

alter table public.consistency_flags enable row level security;
drop policy if exists "Users view own consistency flags" on public.consistency_flags;
drop policy if exists "Users create own consistency flags" on public.consistency_flags;
drop policy if exists "Admins manage consistency flags" on public.consistency_flags;
drop policy if exists "Service role manages consistency flags" on public.consistency_flags;
create policy "Users view own consistency flags"
on public.consistency_flags for select
to authenticated
using (user_id = auth.uid());
create policy "Users create own consistency flags"
on public.consistency_flags for insert
to authenticated
with check (user_id = auth.uid());
create policy "Admins manage consistency flags"
on public.consistency_flags for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
create policy "Service role manages consistency flags"
on public.consistency_flags for all
to service_role
using (true)
with check (true);

grant execute on function public.normalize_freelancer_subscription(uuid) to authenticated, service_role;
grant execute on function public.grant_subscription_access(uuid, text, integer, numeric, numeric, text) to service_role;
