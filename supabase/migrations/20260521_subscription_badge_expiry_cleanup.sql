-- Remove subscription badges when the paid plan is no longer active.

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
  v_subscription_badges text[] := array['Starter', 'Pro', 'Elite'];
  v_removed_badges integer := 0;
begin
  if p_user_id is null then
    raise exception 'Missing user id.';
  end if;

  if not (v_is_self or v_is_admin or auth.role() = 'service_role') then
    raise exception 'Unauthorized subscription refresh.';
  end if;

  select *
  into v_profile
  from public.freelancers
  where id = p_user_id
  for update;

  if v_profile.id is null then
    return jsonb_build_object('success', false, 'error', 'Freelancer profile not found.');
  end if;

  if coalesce(v_profile.current_plan, 'Basic') <> 'Basic'
     and (v_profile.plan_expires_at is null or v_profile.plan_expires_at <= now()) then
    update public.freelancers
    set current_plan = 'Basic',
        bids_remaining = 5,
        resumes_remaining = 1,
        plan_expires_at = null
    where id = p_user_id
    returning * into v_profile;
  end if;

  if coalesce(v_profile.current_plan, 'Basic') = 'Basic'
     or v_profile.plan_expires_at is null
     or v_profile.plan_expires_at <= now()
     or v_profile.current_plan <> all(v_subscription_badges) then
    delete from public.user_badges ub
    where ub.user_id = p_user_id
      and (
        ub.badge_name = any(v_subscription_badges)
        or exists (
          select 1
          from public.badges b
          where b.name = ub.badge_name
            and b.category = 'Subscription'
        )
      );
    get diagnostics v_removed_badges = row_count;
  else
    delete from public.user_badges ub
    where ub.user_id = p_user_id
      and ub.badge_name <> v_profile.current_plan
      and (
        ub.badge_name = any(v_subscription_badges)
        or exists (
          select 1
          from public.badges b
          where b.name = ub.badge_name
            and b.category = 'Subscription'
        )
      );
    get diagnostics v_removed_badges = row_count;

    if not exists (
      select 1
      from public.user_badges
      where user_id = p_user_id
        and badge_name = v_profile.current_plan
    ) then
      insert into public.user_badges (user_id, badge_name)
      values (p_user_id, v_profile.current_plan);
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'current_plan', coalesce(v_profile.current_plan, 'Basic'),
    'plan_expires_at', v_profile.plan_expires_at,
    'bids_remaining', coalesce(v_profile.bids_remaining, 5),
    'resumes_remaining', coalesce(v_profile.resumes_remaining, 1),
    'wallet_balance', coalesce(v_profile.wallet_balance, 0),
    'removed_subscription_badges', v_removed_badges
  );
end;
$$;

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
  v_subscription_badges text[] := array['Starter', 'Pro', 'Elite'];
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
  set current_plan = v_badge_name,
      bids_remaining = v_new_bids,
      resumes_remaining = v_new_resumes,
      plan_expires_at = v_expires_at
  where id = p_user_id;

  delete from public.user_badges ub
  where ub.user_id = p_user_id
    and ub.badge_name <> v_badge_name
    and (
      ub.badge_name = any(v_subscription_badges)
      or exists (
        select 1
        from public.badges b
        where b.name = ub.badge_name
          and b.category = 'Subscription'
      )
    );

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
      jsonb_build_object('type', 'subscription', 'plan', v_badge_name, 'wallet_amount', coalesce(p_wallet_amount, 0))
    );
  end if;

  insert into public.audit_logs (action, actor_id, details)
  values (
    'SUBSCRIPTION_UPGRADED',
    p_user_id::text,
    jsonb_build_object(
      'plan', v_badge_name,
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
    'current_plan', v_badge_name,
    'plan_expires_at', v_expires_at,
    'bids_remaining', v_new_bids,
    'resumes_remaining', v_new_resumes
  );
end;
$$;

update public.freelancers
set current_plan = 'Basic',
    bids_remaining = 5,
    resumes_remaining = 1,
    plan_expires_at = null
where coalesce(current_plan, 'Basic') <> 'Basic'
  and (plan_expires_at is null or plan_expires_at <= now());

delete from public.user_badges ub
using public.freelancers f
where ub.user_id = f.id
  and (
    ub.badge_name in ('Starter', 'Pro', 'Elite')
    or exists (
      select 1
      from public.badges b
      where b.name = ub.badge_name
        and b.category = 'Subscription'
    )
  )
  and (
    coalesce(f.current_plan, 'Basic') = 'Basic'
    or f.plan_expires_at is null
    or f.plan_expires_at <= now()
    or f.current_plan <> ub.badge_name
  );
