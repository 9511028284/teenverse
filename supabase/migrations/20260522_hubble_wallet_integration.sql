-- Hubble Partner Managed Coins Integration.
-- Hubble "coins" are mapped to TeenVerse wallet money via a conversion rate.

alter table public.wallet_transactions
  add column if not exists coins numeric,
  add column if not exists reference_id text,
  add column if not exists original_transaction_id uuid references public.wallet_transactions(id),
  add column if not exists note text,
  add column if not exists status text not null default 'SUCCESS',
  add column if not exists balance_after numeric,
  add column if not exists updated_at timestamptz not null default now();

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_transaction_type_check;

alter table public.wallet_transactions
  add constraint wallet_transactions_transaction_type_check
  check (
    transaction_type = any (
      array[
        'CREDIT'::text,
        'DEBIT'::text,
        'HUBBLE_DEBIT'::text,
        'HUBBLE_REVERSE'::text
      ]
    )
  );

alter table public.wallet_transactions
  drop constraint if exists wallet_transactions_status_check;

alter table public.wallet_transactions
  add constraint wallet_transactions_status_check
  check (status = any (array['SUCCESS'::text, 'FAILED'::text, 'PENDING'::text]));

create unique index if not exists wallet_transactions_hubble_reference_type_uidx
on public.wallet_transactions (reference_id, transaction_type)
where reference_id is not null
  and transaction_type in ('HUBBLE_DEBIT', 'HUBBLE_REVERSE');

create index if not exists wallet_transactions_hubble_user_reference_idx
on public.wallet_transactions (user_id, reference_id)
where reference_id is not null;

create or replace function public.hubble_wallet_get_balance(
  p_user_id uuid,
  p_conversion_rate numeric default 1
)
returns jsonb
language plpgsql
as $$
declare
  v_wallet_balance numeric;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'Invalid userId',
      'httpStatus', 400
    );
  end if;

  if coalesce(p_conversion_rate, 0) <= 0 then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'Invalid conversion rate',
      'httpStatus', 500
    );
  end if;

  select coalesce(wallet_balance, 0)
  into v_wallet_balance
  from public.clients
  where id = p_user_id;

  if not found then
    select coalesce(wallet_balance, 0)
    into v_wallet_balance
    from public.freelancers
    where id = p_user_id;
  end if;

  if not found then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'User not found',
      'httpStatus', 404
    );
  end if;

  return jsonb_build_object(
    'status', 'SUCCESS',
    'userId', p_user_id::text,
    'totalCoins', round(v_wallet_balance / p_conversion_rate, 2)
  );
end;
$$;

create or replace function public.hubble_wallet_debit(
  p_user_id uuid,
  p_coins numeric,
  p_conversion_rate numeric,
  p_reference_id text,
  p_note text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_existing public.wallet_transactions%rowtype;
  v_current_balance numeric;
  v_new_balance numeric;
  v_wallet_amount numeric;
  v_transaction_id uuid;
  v_profile_table text;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'FAILED', 'message', 'Invalid userId', 'httpStatus', 400);
  end if;

  if coalesce(p_coins, 0) <= 0 then
    return jsonb_build_object('status', 'FAILED', 'message', 'coins must be greater than zero', 'httpStatus', 400);
  end if;

  if coalesce(p_conversion_rate, 0) <= 0 then
    return jsonb_build_object('status', 'FAILED', 'message', 'Invalid conversion rate', 'httpStatus', 500);
  end if;

  if nullif(trim(coalesce(p_reference_id, '')), '') is null then
    return jsonb_build_object('status', 'FAILED', 'message', 'referenceId is required', 'httpStatus', 400);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('hubble_debit:' || p_reference_id, 0));

  select *
  into v_existing
  from public.wallet_transactions
  where reference_id = p_reference_id
    and transaction_type = 'HUBBLE_DEBIT'
  limit 1;

  if found then
    return jsonb_build_object(
      'status', 'SUCCESS',
      'transactionId', v_existing.id::text,
      'balance', round(coalesce(v_existing.balance_after, 0) / p_conversion_rate, 2),
      'referenceId', p_reference_id
    );
  end if;

  v_wallet_amount := round(p_coins * p_conversion_rate, 2);

  select coalesce(wallet_balance, 0)
  into v_current_balance
  from public.clients
  where id = p_user_id
  for update;

  if found then
    v_profile_table := 'clients';
  else
    select coalesce(wallet_balance, 0)
    into v_current_balance
    from public.freelancers
    where id = p_user_id
    for update;

    if found then
      v_profile_table := 'freelancers';
    end if;
  end if;

  if v_profile_table is null then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'User not found',
      'referenceId', p_reference_id,
      'httpStatus', 404
    );
  end if;

  insert into public.audit_logs (action, actor_id, details)
  values (
    'HUBBLE_DEBIT_ATTEMPT',
    p_user_id::text,
    jsonb_build_object(
      'referenceId', p_reference_id,
      'coins', p_coins,
      'walletAmount', v_wallet_amount,
      'note', p_note
    )
  );

  if coalesce(v_current_balance, 0) < v_wallet_amount then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'Insufficient wallet balance',
      'referenceId', p_reference_id,
      'httpStatus', 400
    );
  end if;

  v_new_balance := v_current_balance - v_wallet_amount;

  if v_profile_table = 'clients' then
    update public.clients
    set wallet_balance = v_new_balance
    where id = p_user_id;
  else
    update public.freelancers
    set wallet_balance = v_new_balance
    where id = p_user_id;
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    coins,
    reference_id,
    note,
    status,
    balance_after,
    updated_at
  )
  values (
    p_user_id,
    v_wallet_amount,
    'HUBBLE_DEBIT',
    coalesce(nullif(trim(p_note), ''), 'Hubble redemption debit'),
    p_coins,
    p_reference_id,
    p_note,
    'SUCCESS',
    v_new_balance,
    now()
  )
  returning id into v_transaction_id;

  return jsonb_build_object(
    'status', 'SUCCESS',
    'transactionId', v_transaction_id::text,
    'balance', round(v_new_balance / p_conversion_rate, 2),
    'referenceId', p_reference_id
  );
end;
$$;

create or replace function public.hubble_wallet_reverse(
  p_user_id uuid,
  p_reference_id text,
  p_conversion_rate numeric,
  p_note text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_existing_reverse public.wallet_transactions%rowtype;
  v_original public.wallet_transactions%rowtype;
  v_current_balance numeric;
  v_new_balance numeric;
  v_transaction_id uuid;
  v_profile_table text;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'FAILED', 'message', 'Invalid userId', 'httpStatus', 400);
  end if;

  if nullif(trim(coalesce(p_reference_id, '')), '') is null then
    return jsonb_build_object('status', 'FAILED', 'message', 'referenceId is required', 'httpStatus', 400);
  end if;

  if coalesce(p_conversion_rate, 0) <= 0 then
    return jsonb_build_object('status', 'FAILED', 'message', 'Invalid conversion rate', 'httpStatus', 500);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('hubble_reverse:' || p_reference_id, 0));

  select *
  into v_existing_reverse
  from public.wallet_transactions
  where reference_id = p_reference_id
    and transaction_type = 'HUBBLE_REVERSE'
  limit 1;

  if found then
    return jsonb_build_object(
      'status', 'SUCCESS',
      'transactionId', v_existing_reverse.id::text,
      'balance', round(coalesce(v_existing_reverse.balance_after, 0) / p_conversion_rate, 2),
      'referenceId', p_reference_id
    );
  end if;

  select *
  into v_original
  from public.wallet_transactions
  where reference_id = p_reference_id
    and transaction_type = 'HUBBLE_DEBIT'
    and status = 'SUCCESS'
    and user_id = p_user_id
  limit 1;

  if not found then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'Original debit transaction not found',
      'referenceId', p_reference_id,
      'httpStatus', 404
    );
  end if;

  select coalesce(wallet_balance, 0)
  into v_current_balance
  from public.clients
  where id = p_user_id
  for update;

  if found then
    v_profile_table := 'clients';
  else
    select coalesce(wallet_balance, 0)
    into v_current_balance
    from public.freelancers
    where id = p_user_id
    for update;

    if found then
      v_profile_table := 'freelancers';
    end if;
  end if;

  if v_profile_table is null then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'User not found',
      'referenceId', p_reference_id,
      'httpStatus', 404
    );
  end if;

  insert into public.audit_logs (action, actor_id, details)
  values (
    'HUBBLE_REVERSE_ATTEMPT',
    p_user_id::text,
    jsonb_build_object(
      'referenceId', p_reference_id,
      'originalTransactionId', v_original.id,
      'walletAmount', v_original.amount,
      'coins', v_original.coins,
      'note', p_note
    )
  );

  v_new_balance := v_current_balance + v_original.amount;

  if v_profile_table = 'clients' then
    update public.clients
    set wallet_balance = v_new_balance
    where id = p_user_id;
  else
    update public.freelancers
    set wallet_balance = v_new_balance
    where id = p_user_id;
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    coins,
    reference_id,
    original_transaction_id,
    note,
    status,
    balance_after,
    updated_at
  )
  values (
    p_user_id,
    v_original.amount,
    'HUBBLE_REVERSE',
    coalesce(nullif(trim(p_note), ''), 'Hubble redemption reversal'),
    v_original.coins,
    p_reference_id,
    v_original.id,
    p_note,
    'SUCCESS',
    v_new_balance,
    now()
  )
  returning id into v_transaction_id;

  return jsonb_build_object(
    'status', 'SUCCESS',
    'transactionId', v_transaction_id::text,
    'balance', round(v_new_balance / p_conversion_rate, 2),
    'referenceId', p_reference_id
  );
end;
$$;

revoke execute on function public.hubble_wallet_get_balance(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.hubble_wallet_debit(uuid, numeric, numeric, text, text) from public, anon, authenticated;
revoke execute on function public.hubble_wallet_reverse(uuid, text, numeric, text) from public, anon, authenticated;

grant execute on function public.hubble_wallet_get_balance(uuid, numeric) to service_role;
grant execute on function public.hubble_wallet_debit(uuid, numeric, numeric, text, text) to service_role;
grant execute on function public.hubble_wallet_reverse(uuid, text, numeric, text) to service_role;
