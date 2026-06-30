-- Force freelancer applications through apply_for_job_with_energy so plan limits,
-- bid limits, KYC checks, and Elite gating are enforced server-side.

do $$
begin
  if to_regclass('public.applications') is not null then
    drop policy if exists "Enable insert for authenticated users only" on public.applications;
    drop policy if exists "Freelancers Apply" on public.applications;
    drop policy if exists "Enforce KYC for Job Applications" on public.applications;
    drop policy if exists "Freelancers must be KYC verified to apply" on public.applications;
    drop policy if exists "KYC Verified Freelancers Only Apply" on public.applications;
    drop policy if exists "Clients can create direct hire applications" on public.applications;

    create policy "Clients can create direct hire applications"
    on public.applications for insert
    to authenticated
    with check (
      client_id = auth.uid()
      and exists (
        select 1
        from public.jobs j
        where j.id = job_id
          and j.client_id = auth.uid()
          and coalesce(j.deleted_at is null, true)
          and coalesce(j.is_archived, false) = false
      )
    );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'grant_subscription_access'
      and pg_get_function_identity_arguments(p.oid) = 'uuid, text, integer, numeric, numeric, text'
  ) then
    revoke execute on function public.grant_subscription_access(uuid, text, integer, numeric, numeric, text) from public, anon, authenticated;
    grant execute on function public.grant_subscription_access(uuid, text, integer, numeric, numeric, text) to service_role;
  end if;
end $$;
