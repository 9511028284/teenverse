-- Restore full KYC enforcement for freelancer applications and harden the
-- application RPC so the browser cannot bypass core eligibility checks.

create or replace function public.is_freelancer_kyc_application_bypass_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

revoke all on function public.is_freelancer_kyc_application_bypass_enabled() from public, anon, authenticated;

comment on function public.is_freelancer_kyc_application_bypass_enabled() is
  'Disabled. Freelancer job applications require KYC again.';

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
  v_job_status text;
  v_new_app_id bigint;
begin
  if auth.uid() is null or auth.uid() <> p_freelancer_id then
    raise exception 'Unauthorized application attempt.';
  end if;

  if coalesce(p_energy_cost, 0) <= 0 then
    raise exception 'Invalid energy cost.';
  end if;

  if coalesce(p_bid_amount, 0) <= 0 then
    raise exception 'Enter a valid bid amount.';
  end if;

  if length(trim(coalesce(p_cover_letter, ''))) < 20 then
    raise exception 'Cover letter must be at least 20 characters.';
  end if;

  if coalesce(p_is_educational_waiver_signed, false) is not true then
    raise exception 'Educational consent is required before applying.';
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

  select client_id, coalesce(is_elite, false), coalesce(status, 'Open')
  into v_job_client_id, v_job_is_elite, v_job_status
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

  if v_job_client_id = p_freelancer_id then
    raise exception 'You cannot apply to your own mission.';
  end if;

  if v_job_status not in ('Pending', 'Open') then
    raise exception 'Mission is not accepting applications.';
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
        else greatest(coalesce(v_bids_remaining, 0) - 1, 0)
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
    trim(p_cover_letter),
    p_bid_amount,
    p_is_educational_waiver_signed,
    coalesce(v_email, '')
  )
  returning id into v_new_app_id;

  return jsonb_build_object('success', true, 'application_id', v_new_app_id);
end;
$$;

revoke all on function public.apply_for_job_with_energy(bigint, uuid, text, uuid, text, numeric, boolean, integer)
  from public, anon;
grant execute on function public.apply_for_job_with_energy(bigint, uuid, text, uuid, text, numeric, boolean, integer)
  to authenticated;
