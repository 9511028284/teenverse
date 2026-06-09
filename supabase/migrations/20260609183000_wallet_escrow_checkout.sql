-- Allow clients to fund an accepted escrow order with wallet balance, either
-- fully from wallet or as the wallet side of a split wallet + Cashfree payment.

create or replace function public.fund_application_escrow(
  p_app_id bigint,
  p_client_id uuid,
  p_wallet_amount numeric default 0,
  p_gateway_amount numeric default 0,
  p_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app record;
  v_current_balance numeric := 0;
  v_new_balance numeric := 0;
  v_expected_amount numeric := 0;
  v_total_paid numeric := 0;
  v_reference_id text;
  v_wallet_transaction_id uuid;
  v_escrow_order_id text;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'Escrow funding must be performed by a trusted backend.';
  end if;

  if p_app_id is null or p_client_id is null then
    return jsonb_build_object('success', false, 'error', 'Missing escrow checkout details.');
  end if;

  if coalesce(p_wallet_amount, 0) < 0 or coalesce(p_gateway_amount, 0) < 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid payment amount.');
  end if;

  if coalesce(p_wallet_amount, 0) = 0 and coalesce(p_gateway_amount, 0) = 0 then
    return jsonb_build_object('success', false, 'error', 'Payment amount is required.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('fund_application_escrow:' || p_app_id::text, 0));

  select
    id,
    client_id,
    freelancer_id,
    bid_amount,
    status
  into v_app
  from public.applications
  where id = p_app_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Application not found.');
  end if;

  if v_app.client_id <> p_client_id then
    return jsonb_build_object('success', false, 'error', 'Only the client can fund this escrow.');
  end if;

  select id::text
  into v_escrow_order_id
  from public.escrow_orders
  where app_id = p_app_id
  order by created_at desc
  limit 1;

  select coalesce(wallet_balance, 0)
  into v_current_balance
  from public.clients
  where id = p_client_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Client wallet not found.');
  end if;

  if v_escrow_order_id is not null and v_app.status = 'Accepted' then
    return jsonb_build_object(
      'success', true,
      'alreadyFunded', true,
      'escrowOrderId', v_escrow_order_id,
      'walletBalance', v_current_balance,
      'orderId', coalesce(p_order_id, 'wallet-' || p_app_id::text)
    );
  end if;

  if coalesce(v_app.status, '') <> 'Pending' then
    return jsonb_build_object('success', false, 'error', 'Only pending applications can be funded.');
  end if;

  v_expected_amount := round(coalesce(v_app.bid_amount, 0), 2);
  v_total_paid := round(coalesce(p_wallet_amount, 0) + coalesce(p_gateway_amount, 0), 2);

  if abs(v_total_paid - v_expected_amount) > 0.01 then
    return jsonb_build_object(
      'success', false,
      'error', 'Payment amount does not match the accepted bid.'
    );
  end if;

  if coalesce(p_wallet_amount, 0) > 0 and coalesce(v_current_balance, 0) < p_wallet_amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient wallet balance.');
  end if;

  if coalesce(p_gateway_amount, 0) > 0 and nullif(trim(coalesce(p_order_id, '')), '') is null then
    return jsonb_build_object('success', false, 'error', 'Missing payment gateway order id.');
  end if;

  v_new_balance := v_current_balance;
  v_reference_id := 'escrow-wallet:' || p_app_id::text;

  if coalesce(p_wallet_amount, 0) > 0 then
    v_new_balance := round(v_current_balance - p_wallet_amount, 2);

    update public.clients
    set wallet_balance = v_new_balance
    where id = p_client_id;

    insert into public.wallet_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      reference_id,
      note,
      status,
      balance_after,
      updated_at
    )
    values (
      p_client_id,
      p_wallet_amount,
      'DEBIT',
      'TeenVerseHub escrow payment',
      v_reference_id,
      'Application #' || p_app_id::text,
      'SUCCESS',
      v_new_balance,
      now()
    )
    returning id into v_wallet_transaction_id;
  end if;

  if coalesce(p_gateway_amount, 0) > 0 then
    insert into public.payment_logs (order_id, amount, status, raw_data)
    values (
      p_order_id,
      p_gateway_amount,
      'PAID',
      jsonb_build_object(
        'type', 'escrow',
        'app_id', p_app_id,
        'wallet_amount', coalesce(p_wallet_amount, 0),
        'gateway_amount', p_gateway_amount
      )
    );
  end if;

  if v_escrow_order_id is null then
    insert into public.escrow_orders (
      app_id,
      client_id,
      freelancer_id,
      bid_amount,
      status
    )
    values (
      p_app_id,
      p_client_id,
      v_app.freelancer_id,
      v_expected_amount,
      'Funded'
    )
    returning id::text into v_escrow_order_id;
  end if;

  update public.applications
  set status = 'Accepted',
      payment_status = 'Held',
      is_escrow_held = true,
      started_at = now()
  where id = p_app_id;

  insert into public.audit_logs (action, actor_id, details)
  values (
    'ESCROW_FUNDED',
    p_client_id::text,
    jsonb_build_object(
      'app_id', p_app_id,
      'escrow_order_id', v_escrow_order_id,
      'wallet_amount', coalesce(p_wallet_amount, 0),
      'gateway_amount', coalesce(p_gateway_amount, 0),
      'order_id', p_order_id,
      'wallet_transaction_id', v_wallet_transaction_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'escrowOrderId', v_escrow_order_id,
    'walletTransactionId', v_wallet_transaction_id,
    'walletBalance', v_new_balance,
    'orderId', coalesce(p_order_id, 'wallet-' || p_app_id::text)
  );
end;
$$;

revoke execute on function public.fund_application_escrow(bigint, uuid, numeric, numeric, text) from public, anon, authenticated;
grant execute on function public.fund_application_escrow(bigint, uuid, numeric, numeric, text) to service_role;
