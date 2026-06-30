begin;

-- Domain-aware workspace model:
-- A user can keep an individual profile and still create one business workspace.
-- Admin access and protected-field enforcement are handled by existing policies/triggers.
drop policy if exists "business_profiles_owner_insert" on public.business_profiles;

create policy "business_profiles_owner_insert"
on public.business_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
  )
);

commit;
