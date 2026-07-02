-- Keep one wallet per authenticated user, independent of dashboard role.
-- clients.wallet_balance and freelancers.wallet_balance remain as synchronous
-- compatibility mirrors while existing application code is migrated.

alter table public.clients
  add column if not exists wallet_balance numeric default 0;

alter table public.freelancers
  add column if not exists wallet_balance numeric default 0;

create table public.wallet_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wallet_balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_accounts_nonnegative_balance check (wallet_balance >= 0)
);

alter table public.wallet_accounts enable row level security;

revoke all on table public.wallet_accounts from public, anon, authenticated;
grant select, insert, update, delete on table public.wallet_accounts to authenticated;
grant all on table public.wallet_accounts to service_role;

create policy "Users can read their own wallet"
on public.wallet_accounts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can initialize their own empty wallet"
on public.wallet_accounts
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and wallet_balance = 0
);

create policy "Admins can manage wallets"
on public.wallet_accounts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- A role switch creates a second profile row whose wallet default is zero.
-- For existing dual-role users, retain the larger value because the smaller
-- value can be that role-row default. The production audit found one mismatch:
-- 601 in freelancers and 0 in clients.
with role_balances as (
  select id as user_id, coalesce(wallet_balance, 0) as wallet_balance
  from public.clients
  union all
  select id as user_id, coalesce(wallet_balance, 0) as wallet_balance
  from public.freelancers
)
insert into public.wallet_accounts (user_id, wallet_balance)
select user_id, max(wallet_balance)
from role_balances
group by user_id;

update public.clients c
set wallet_balance = w.wallet_balance
from public.wallet_accounts w
where w.user_id = c.id
  and c.wallet_balance is distinct from w.wallet_balance;

update public.freelancers f
set wallet_balance = w.wallet_balance
from public.wallet_accounts w
where w.user_id = f.id
  and f.wallet_balance is distinct from w.wallet_balance;

create or replace function public.touch_wallet_account_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger wallet_accounts_touch_updated_at
before update on public.wallet_accounts
for each row
execute function public.touch_wallet_account_updated_at();

create or replace function public.prepare_role_wallet_balance()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_canonical_balance numeric;
  v_is_trusted_writer boolean;
begin
  v_is_trusted_writer := current_user in ('postgres', 'service_role', 'supabase_admin')
    or public.is_admin();

  if tg_op = 'INSERT' then
    select w.wallet_balance
    into v_canonical_balance
    from public.wallet_accounts w
    where w.user_id = new.id;

    if found then
      new.wallet_balance := v_canonical_balance;
    elsif not v_is_trusted_writer then
      -- Profile creation must never mint wallet funds.
      new.wallet_balance := 0;
    end if;
  elsif new.wallet_balance is distinct from old.wallet_balance
    and not v_is_trusted_writer then
    -- Users may edit their profile, but wallet changes must come from a
    -- trusted RPC/backend operation.
    new.wallet_balance := old.wallet_balance;
  end if;

  return new;
end;
$$;

create or replace function public.sync_role_wallet_to_account()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  -- Updates initiated by wallet_accounts are already canonical. Avoid
  -- recursively writing the same balance back into wallet_accounts.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  insert into public.wallet_accounts (user_id, wallet_balance)
  values (new.id, coalesce(new.wallet_balance, 0))
  on conflict (user_id) do update
  set wallet_balance = excluded.wallet_balance
  where wallet_accounts.wallet_balance is distinct from excluded.wallet_balance;

  return new;
end;
$$;

create or replace function public.sync_wallet_account_to_roles()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  update public.clients
  set wallet_balance = new.wallet_balance
  where id = new.user_id
    and wallet_balance is distinct from new.wallet_balance;

  update public.freelancers
  set wallet_balance = new.wallet_balance
  where id = new.user_id
    and wallet_balance is distinct from new.wallet_balance;

  return new;
end;
$$;

create trigger clients_prepare_wallet_balance
before insert or update of wallet_balance on public.clients
for each row
execute function public.prepare_role_wallet_balance();

create trigger freelancers_prepare_wallet_balance
before insert or update of wallet_balance on public.freelancers
for each row
execute function public.prepare_role_wallet_balance();

create trigger clients_sync_wallet_to_account
after insert or update of wallet_balance on public.clients
for each row
execute function public.sync_role_wallet_to_account();

create trigger freelancers_sync_wallet_to_account
after insert or update of wallet_balance on public.freelancers
for each row
execute function public.sync_role_wallet_to_account();

create trigger wallet_accounts_sync_role_balances
after insert or update of wallet_balance on public.wallet_accounts
for each row
execute function public.sync_wallet_account_to_roles();

create or replace function public.hubble_wallet_get_balance(
  p_user_id uuid,
  p_conversion_rate numeric default 1
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public, pg_temp
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

  select w.wallet_balance
  into v_wallet_balance
  from public.wallet_accounts w
  where w.user_id = p_user_id;

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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_existing public.wallet_transactions%rowtype;
  v_current_balance numeric;
  v_new_balance numeric;
  v_wallet_amount numeric;
  v_transaction_id uuid;
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

  select w.wallet_balance
  into v_current_balance
  from public.wallet_accounts w
  where w.user_id = p_user_id
  for update;

  if not found then
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

  if v_current_balance < v_wallet_amount then
    return jsonb_build_object(
      'status', 'FAILED',
      'message', 'Insufficient wallet balance',
      'referenceId', p_reference_id,
      'httpStatus', 400
    );
  end if;

  v_new_balance := v_current_balance - v_wallet_amount;

  update public.wallet_accounts
  set wallet_balance = v_new_balance
  where user_id = p_user_id;

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
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_existing_reverse public.wallet_transactions%rowtype;
  v_original public.wallet_transactions%rowtype;
  v_current_balance numeric;
  v_new_balance numeric;
  v_transaction_id uuid;
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

  select w.wallet_balance
  into v_current_balance
  from public.wallet_accounts w
  where w.user_id = p_user_id
  for update;

  if not found then
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

  update public.wallet_accounts
  set wallet_balance = v_new_balance
  where user_id = p_user_id;

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
