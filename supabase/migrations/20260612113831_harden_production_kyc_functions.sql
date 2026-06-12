-- Harden KYC-related database functions for the production KYC flow.
-- This keeps the change reversible and scoped to auth-sensitive KYC helpers.

create or replace function public.mark_bank_linked(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    raise exception 'Not authorized to link banking for this user';
  end if;

  update public.freelancers
  set is_bank_linked = true
  where id = target_user_id;

  if not found then
    raise exception 'Freelancer profile not found';
  end if;
end;
$$;

create or replace function public.verify_parent_otp(p_email text, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  valid_record record;
begin
  select *
    into valid_record
    from public.parent_otps
   where email = p_email
     and otp_code = p_code
     and expires_at > now()
   limit 1;

  if valid_record is not null then
    delete from public.parent_otps where id = valid_record.id;
    return true;
  end if;

  return false;
end;
$$;

alter function public.sync_kyc_status()
  set search_path = public, pg_temp;

alter function public.protect_kyc_status()
  set search_path = public, pg_temp;

alter function public.award_kyc_badge()
  set search_path = public, pg_temp;

revoke all on function public.sync_kyc_status() from public, anon, authenticated;
revoke all on function public.protect_kyc_status() from public, anon, authenticated;
revoke all on function public.award_kyc_badge() from public, anon, authenticated;

revoke all on function public.mark_bank_linked(uuid) from public, anon;
grant execute on function public.mark_bank_linked(uuid) to authenticated;

revoke all on function public.verify_parent_otp(text, text) from public, anon;
grant execute on function public.verify_parent_otp(text, text) to authenticated;
