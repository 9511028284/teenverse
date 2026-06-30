-- Give authenticated staff read-only access to Command Center data while
-- preserving each table's existing self-service and service-role policies.

grant select on table public.users to authenticated;
grant select on table public.auth_rate_limits to authenticated;
grant select on table public.phone_otp_verifications to authenticated;

drop policy if exists "command_center_admins_read_users" on public.users;
create policy "command_center_admins_read_users"
on public.users
for select
to authenticated
using (public.tvh_is_admin((select auth.uid())));

drop policy if exists "command_center_admins_read_auth_rate_limits" on public.auth_rate_limits;
create policy "command_center_admins_read_auth_rate_limits"
on public.auth_rate_limits
for select
to authenticated
using (public.tvh_is_admin((select auth.uid())));

drop policy if exists "command_center_admins_read_phone_verifications" on public.phone_otp_verifications;
create policy "command_center_admins_read_phone_verifications"
on public.phone_otp_verifications
for select
to authenticated
using (public.tvh_is_admin((select auth.uid())));
