begin;

set search_path = public, extensions;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hubble-wallet-test@example.com',
  '',
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.clients (id, name, email, phone, wallet_balance)
values (
  '11111111-1111-4111-8111-111111111111',
  'Hubble Wallet Test',
  'hubble-wallet-test@example.com',
  '+919899460415',
  1000
)
on conflict (id) do update
set wallet_balance = excluded.wallet_balance;

create temp table hubble_test_results (
  name text primary key,
  result jsonb
) on commit drop;

select is(
  (public.hubble_wallet_get_balance('11111111-1111-4111-8111-111111111111', 1)->>'totalCoins')::numeric,
  1000.00,
  'GET /balance returns wallet balance as totalCoins'
);

insert into hubble_test_results
values (
  'debit',
  public.hubble_wallet_debit(
    '11111111-1111-4111-8111-111111111111',
    100,
    1,
    'hubble_test_ref_001',
    'pgTAP debit'
  )
);

select is(
  (select result->>'status' from hubble_test_results where name = 'debit'),
  'SUCCESS',
  'POST /debit returns SUCCESS'
);

select is(
  (select wallet_balance from public.clients where id = '11111111-1111-4111-8111-111111111111'),
  900.00,
  'POST /debit deducts wallet amount'
);

insert into hubble_test_results
values (
  'duplicate_debit',
  public.hubble_wallet_debit(
    '11111111-1111-4111-8111-111111111111',
    100,
    1,
    'hubble_test_ref_001',
    'pgTAP duplicate debit'
  )
);

select is(
  (select wallet_balance from public.clients where id = '11111111-1111-4111-8111-111111111111'),
  900.00,
  'Duplicate POST /debit does not double deduct'
);

select is(
  (
    public.hubble_wallet_debit(
      '11111111-1111-4111-8111-111111111111',
      5000,
      1,
      'hubble_test_ref_002',
      'pgTAP insufficient debit'
    )->>'message'
  ),
  'Insufficient wallet balance',
  'POST /debit fails if insufficient balance'
);

insert into hubble_test_results
values (
  'reverse',
  public.hubble_wallet_reverse(
    '11111111-1111-4111-8111-111111111111',
    'hubble_test_ref_001',
    1,
    'pgTAP reverse'
  )
);

select is(
  (select wallet_balance from public.clients where id = '11111111-1111-4111-8111-111111111111'),
  1000.00,
  'POST /reverse credits wallet back'
);

insert into hubble_test_results
values (
  'duplicate_reverse',
  public.hubble_wallet_reverse(
    '11111111-1111-4111-8111-111111111111',
    'hubble_test_ref_001',
    1,
    'pgTAP duplicate reverse'
  )
);

select is(
  (select wallet_balance from public.clients where id = '11111111-1111-4111-8111-111111111111'),
  1000.00,
  'Duplicate POST /reverse does not double credit'
);

select is(
  (
    public.hubble_wallet_reverse(
      '11111111-1111-4111-8111-111111111111',
      'missing_hubble_test_ref',
      1,
      'pgTAP missing reverse'
    )->>'message'
  ),
  'Original debit transaction not found',
  'POST /reverse fails if original debit not found'
);

select * from finish();

rollback;
