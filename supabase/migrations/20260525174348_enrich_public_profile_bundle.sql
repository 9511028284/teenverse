-- Enrich safe public profile payloads used by profile previews and share cards.
-- The RPC remains column-limited so clients never fetch raw freelancer rows.

create or replace function public.get_public_profile_bundle(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user jsonb;
  v_badges jsonb := '[]'::jsonb;
  v_portfolio jsonb := '[]'::jsonb;
  v_projects jsonb := '[]'::jsonb;
  v_services jsonb := '[]'::jsonb;
begin
  if p_user_id is null then
    raise exception 'Missing profile id.';
  end if;

  perform public.assert_public_profile_rate_limit(p_user_id);

  select to_jsonb(profile)
  into v_user
  from (
    select
      id,
      name,
      bio,
      nationality,
      tag_line,
      journey_statement,
      unlocked_skills,
      created_at,
      social_links,
      referral_code,
      cover_image,
      specialty,
      qualification,
      hourly_rate,
      current_plan,
      trust_score,
      trust_score_breakdown,
      risk_level
    from public.freelancers
    where id = p_user_id
  ) profile;

  if v_user is null then
    return jsonb_build_object(
      'user', null,
      'badges', '[]'::jsonb,
      'portfolio', '[]'::jsonb,
      'projects', '[]'::jsonb,
      'services', '[]'::jsonb,
      'resume', null
    );
  end if;

  select coalesce(jsonb_agg(to_jsonb(badge) order by badge.earned_at desc), '[]'::jsonb)
  into v_badges
  from (
    select
      badge_name as name,
      earned_at
    from public.user_badges
    where user_id = p_user_id
    order by earned_at desc
    limit 20
  ) badge;

  select coalesce(jsonb_agg(to_jsonb(item) order by item.created_at desc), '[]'::jsonb)
  into v_portfolio
  from (
    select
      id,
      user_id,
      title,
      content,
      created_at
    from public.portfolio_items
    where user_id = p_user_id
    order by created_at desc
    limit 12
  ) item;

  select coalesce(jsonb_agg(project.payload order by project.sort_date desc), '[]'::jsonb)
  into v_projects
  from (
    select
      coalesce(a.completed_at, a.submitted_at, a.started_at, a.created_at) as sort_date,
      jsonb_build_object(
        'id', a.id,
        'job_id', a.job_id,
        'status', a.status,
        'bid_amount', a.bid_amount,
        'created_at', a.created_at,
        'started_at', a.started_at,
        'submitted_at', a.submitted_at,
        'completed_at', a.completed_at,
        'source', 'Verified Work',
        'jobs', jsonb_build_object(
          'title', j.title,
          'category', j.category,
          'budget', j.budget,
          'description', left(coalesce(j.description, ''), 700),
          'created_at', j.created_at
        )
      ) as payload
    from public.applications a
    left join public.jobs j on j.id = a.job_id
    where a.freelancer_id = p_user_id
      and a.status in ('Accepted', 'Submitted', 'Completed', 'Paid')
    order by coalesce(a.completed_at, a.submitted_at, a.started_at, a.created_at) desc
    limit 12
  ) project;

  select coalesce(jsonb_agg(to_jsonb(service) order by service.created_at desc), '[]'::jsonb)
  into v_services
  from (
    select
      id,
      freelancer_id,
      title,
      name,
      description,
      category,
      service_category,
      specialty,
      status,
      price,
      starting_price,
      rate,
      created_at
    from public.services
    where freelancer_id = p_user_id
    order by created_at desc
    limit 6
  ) service;

  return jsonb_build_object(
    'user', v_user,
    'badges', v_badges,
    'portfolio', v_portfolio,
    'projects', v_projects,
    'services', v_services,
    'resume', null
  );
end;
$$;

revoke execute on function public.get_public_profile_bundle(uuid) from public, anon;
grant execute on function public.get_public_profile_bundle(uuid) to authenticated, service_role;
