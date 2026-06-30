-- The dashboard needs aggregate security timestamps and action names, not
-- phone numbers, OTP provider payloads, tokens, hashes, or raw rate keys.

revoke select on table public.auth_rate_limits from authenticated;
revoke select on table public.phone_otp_verifications from authenticated;

grant select (id, action, created_at)
on table public.auth_rate_limits
to authenticated;

grant select (created_at, verified_at, consumed_at)
on table public.phone_otp_verifications
to authenticated;
