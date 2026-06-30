update public.profiles as profile
set
  onboarding_completed = true,
  updated_at = now()
where profile.onboarding_completed is distinct from true
  and (
    exists (
      select 1
      from public.freelancers as freelancer
      where freelancer.id = profile.id
        and length(coalesce(freelancer.phone, '')) > 5
    )
    or exists (
      select 1
      from public.clients as client
      where client.id = profile.id
        and length(coalesce(client.phone, '')) > 5
    )
  );
