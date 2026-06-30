-- Consolidate duplicate user SELECT policies into one self-or-admin rule.

drop policy if exists "Users can read own user row" on public.users;
drop policy if exists "Users can view their own profile" on public.users;
drop policy if exists "user_can_read_own_row" on public.users;
drop policy if exists "command_center_admins_read_users" on public.users;
drop policy if exists "users_read_self_or_command_center_admin" on public.users;

create policy "users_read_self_or_command_center_admin"
on public.users
for select
to authenticated
using (
  (select auth.uid()) = id
  or public.tvh_is_admin((select auth.uid()))
);
