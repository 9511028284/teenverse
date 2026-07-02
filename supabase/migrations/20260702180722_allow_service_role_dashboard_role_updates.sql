-- Dashboard-role changes are performed by the authenticated Edge Function
-- with the service key. Keep protected fields immutable for normal users,
-- while allowing that trusted server-side path and existing admins.
create or replace function public.profiles_protect_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  request_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if request_role <> 'service_role'
     and not public.tvh_is_admin((select auth.uid())) then
    if new.role is distinct from old.role
       or new.age_verified is distinct from old.age_verified
       or new.status is distinct from old.status then
      raise exception 'Not allowed to update protected profile fields';
    end if;
  end if;

  return new;
end;
$$;
