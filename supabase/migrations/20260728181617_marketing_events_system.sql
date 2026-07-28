create extension if not exists pgcrypto;

alter table public.jobs
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_marketing_event boolean not null default false,
  add column if not exists marketing_event_id uuid,
  add column if not exists reward_label text;

create table if not exists public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  event_version text not null,
  status text not null default 'draft',
  reward_amount numeric(12,2) not null default 300,
  reward_label text not null default '₹300 Wallet Cash',
  official_client_id uuid,
  official_client_name text not null default 'TeenVerseHub Official',
  category text not null default 'Content Creation',
  hero_image_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  timeline jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  rules jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_events_status_check
    check (status in ('draft', 'active', 'paused', 'archived')),
  constraint marketing_events_title_not_blank
    check (btrim(title) <> ''),
  constraint marketing_events_version_not_blank
    check (btrim(event_version) <> ''),
  constraint marketing_events_reward_positive
    check (reward_amount > 0)
);

create unique index if not exists marketing_events_one_active_idx
on public.marketing_events ((status))
where status = 'active';

create index if not exists marketing_events_status_starts_idx
on public.marketing_events (status, starts_at desc);

create table if not exists public.marketing_event_views (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.marketing_events(id) on delete cascade,
  event_version text not null,
  user_id uuid,
  view_type text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint marketing_event_views_type_check
    check (view_type in (
      'impression',
      'modal_open',
      'seen',
      'dismiss',
      'join',
      'page_visit',
      'sticky_cta',
      'submission_start',
      'submission_created',
      'submission_resubmitted',
      'approved',
      'rejected',
      'needs_changes',
      'reward_credited'
    ))
);

create unique index if not exists marketing_event_views_seen_once_idx
on public.marketing_event_views (event_id, user_id, event_version, view_type)
where user_id is not null and view_type = 'seen';

create index if not exists marketing_event_views_event_type_created_idx
on public.marketing_event_views (event_id, view_type, created_at desc);

create index if not exists marketing_event_views_user_event_idx
on public.marketing_event_views (user_id, event_id, created_at desc)
where user_id is not null;

create table if not exists public.marketing_event_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.marketing_events(id) on delete cascade,
  event_version text not null,
  user_id uuid not null,
  platform text not null,
  video_url text not null,
  username text not null,
  caption text not null,
  screenshot_url text,
  status text not null default 'pending',
  review_notes text,
  internal_notes text,
  approved_by uuid,
  approved_at timestamptz,
  reward_amount numeric(12,2) not null default 300,
  wallet_transaction_id uuid references public.wallet_transactions(id),
  reward_credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resubmitted_at timestamptz,
  constraint marketing_event_submissions_platform_check
    check (platform in ('instagram', 'youtube', 'facebook', 'other')),
  constraint marketing_event_submissions_status_check
    check (status in ('pending', 'approved', 'rejected', 'needs_changes', 'reward_credited')),
  constraint marketing_event_submissions_url_not_blank
    check (btrim(video_url) <> ''),
  constraint marketing_event_submissions_username_not_blank
    check (btrim(username) <> ''),
  constraint marketing_event_submissions_caption_not_blank
    check (btrim(caption) <> '')
);

create unique index if not exists marketing_event_submissions_one_per_user_idx
on public.marketing_event_submissions (event_id, user_id);

create unique index if not exists marketing_event_submissions_active_url_idx
on public.marketing_event_submissions (event_id, lower(video_url))
where status in ('pending', 'approved', 'reward_credited');

create index if not exists marketing_event_submissions_status_created_idx
on public.marketing_event_submissions (event_id, status, created_at desc);

create index if not exists marketing_event_submissions_user_idx
on public.marketing_event_submissions (user_id, created_at desc);

create table if not exists public.marketing_rewards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.marketing_events(id) on delete cascade,
  submission_id uuid not null unique references public.marketing_event_submissions(id) on delete cascade,
  user_id uuid not null,
  reward_amount numeric(12,2) not null,
  wallet_transaction_id uuid not null unique references public.wallet_transactions(id),
  status text not null default 'credited',
  credited_by uuid,
  credited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint marketing_rewards_status_check
    check (status in ('credited', 'failed', 'reversed')),
  constraint marketing_rewards_amount_positive
    check (reward_amount > 0)
);

create index if not exists marketing_rewards_user_created_idx
on public.marketing_rewards (user_id, created_at desc);

create or replace function public.tvh_marketing_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketing_events_touch_updated_at on public.marketing_events;
create trigger marketing_events_touch_updated_at
before update on public.marketing_events
for each row execute function public.tvh_marketing_touch_updated_at();

drop trigger if exists marketing_event_submissions_touch_updated_at on public.marketing_event_submissions;
create trigger marketing_event_submissions_touch_updated_at
before update on public.marketing_event_submissions
for each row execute function public.tvh_marketing_touch_updated_at();

create or replace function public.tvh_credit_marketing_reward(
  p_submission_id uuid,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission public.marketing_event_submissions%rowtype;
  v_event public.marketing_events%rowtype;
  v_transaction_id uuid;
  v_balance numeric;
  v_reward numeric;
begin
  select *
  into v_submission
  from public.marketing_event_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found.';
  end if;

  select *
  into v_event
  from public.marketing_events
  where id = v_submission.event_id;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_submission.status = 'reward_credited' then
    return jsonb_build_object(
      'success', true,
      'alreadyCredited', true,
      'walletTransactionId', v_submission.wallet_transaction_id,
      'rewardAmount', v_submission.reward_amount
    );
  end if;

  if v_submission.status <> 'approved' then
    raise exception 'Only approved submissions can be rewarded.';
  end if;

  if exists (
    select 1 from public.marketing_rewards r
    where r.submission_id = v_submission.id
  ) then
    raise exception 'Reward already exists for this submission.';
  end if;

  v_reward := coalesce(nullif(v_submission.reward_amount, 0), v_event.reward_amount, 300);

  insert into public.wallet_accounts (user_id, wallet_balance)
  values (v_submission.user_id, 0)
  on conflict (user_id) do nothing;

  update public.wallet_accounts
  set wallet_balance = wallet_balance + v_reward
  where user_id = v_submission.user_id
  returning wallet_balance into v_balance;

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
    v_submission.user_id,
    v_reward,
    'CREDIT',
    'TeenVerseHub marketing event reward',
    v_submission.id::text,
    'Approved video campaign reward for ' || v_event.event_version,
    'SUCCESS',
    v_balance,
    now()
  )
  returning id into v_transaction_id;

  insert into public.marketing_rewards (
    event_id,
    submission_id,
    user_id,
    reward_amount,
    wallet_transaction_id,
    credited_by
  )
  values (
    v_submission.event_id,
    v_submission.id,
    v_submission.user_id,
    v_reward,
    v_transaction_id,
    p_admin_id
  );

  update public.marketing_event_submissions
  set status = 'reward_credited',
      wallet_transaction_id = v_transaction_id,
      reward_credited_at = now(),
      review_notes = coalesce(review_notes, 'Approved and rewarded.'),
      internal_notes = coalesce(internal_notes, 'Reward credited by admin.')
  where id = v_submission.id;

  return jsonb_build_object(
    'success', true,
    'alreadyCredited', false,
    'walletTransactionId', v_transaction_id,
    'rewardAmount', v_reward,
    'balanceAfter', v_balance
  );
end;
$$;

revoke all on function public.tvh_credit_marketing_reward(uuid, uuid) from public, anon, authenticated;
grant execute on function public.tvh_credit_marketing_reward(uuid, uuid) to service_role;

alter table public.marketing_events enable row level security;
alter table public.marketing_event_views enable row level security;
alter table public.marketing_event_submissions enable row level security;
alter table public.marketing_rewards enable row level security;

revoke all on table public.marketing_events from anon, authenticated;
revoke all on table public.marketing_event_views from anon, authenticated;
revoke all on table public.marketing_event_submissions from anon, authenticated;
revoke all on table public.marketing_rewards from anon, authenticated;

grant select on table public.marketing_events to authenticated;
grant select on table public.marketing_event_submissions to authenticated;
grant select on table public.marketing_rewards to authenticated;
grant all on table public.marketing_events to service_role;
grant all on table public.marketing_event_views to service_role;
grant all on table public.marketing_event_submissions to service_role;
grant all on table public.marketing_rewards to service_role;

drop policy if exists "marketing_events_active_read" on public.marketing_events;
create policy "marketing_events_active_read"
on public.marketing_events
for select
to authenticated
using (
  status = 'active'
  or public.is_admin((select auth.uid()))
);

drop policy if exists "marketing_event_submissions_owner_read" on public.marketing_event_submissions;
create policy "marketing_event_submissions_owner_read"
on public.marketing_event_submissions
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin((select auth.uid()))
);

drop policy if exists "marketing_rewards_owner_read" on public.marketing_rewards;
create policy "marketing_rewards_owner_read"
on public.marketing_rewards
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_admin((select auth.uid()))
);

drop policy if exists "marketing_event_views_admin_read" on public.marketing_event_views;
create policy "marketing_event_views_admin_read"
on public.marketing_event_views
for select
to authenticated
using (public.is_admin((select auth.uid())));

insert into public.clients (
  id,
  email,
  name,
  phone,
  bio,
  is_organisation,
  is_kyc_verified,
  kyc_status,
  created_at
)
values (
  '00000000-0000-4000-8000-000000000300',
  'teenversehub@gmail.com',
  'TeenVerseHub Official',
  null,
  'Official TeenVerseHub platform account for internal promotional campaigns.',
  'true',
  true,
  'approved',
  now()
)
on conflict (id) do update
set name = excluded.name,
    email = excluded.email,
    bio = excluded.bio,
    is_kyc_verified = true,
    kyc_status = 'approved';

insert into public.official_client_accounts (
  client_id,
  display_name,
  badge_label,
  verified_at
)
values (
  '00000000-0000-4000-8000-000000000300',
  'TeenVerseHub Official',
  'Official TeenVerseHub campaign',
  now()
)
on conflict (client_id) do update
set display_name = excluded.display_name,
    badge_label = excluded.badge_label,
    verified_at = coalesce(public.official_client_accounts.verified_at, excluded.verified_at),
    updated_at = now();

insert into public.marketing_events (
  id,
  slug,
  title,
  description,
  event_version,
  status,
  reward_amount,
  reward_label,
  official_client_id,
  official_client_name,
  category,
  published_at,
  timeline,
  requirements,
  rules,
  faq
)
values (
  '10000000-0000-4000-8000-000000000300',
  'teenversehub-video-300',
  'Create a TeenVerseHub Video & Earn ₹300 Wallet Cash',
  'Create and post a short public TeenVerseHub promo video. Approved submissions earn ₹300 wallet cash.',
  'teenverse-video-300-v1',
  'active',
  300,
  '₹300 Wallet Cash',
  '00000000-0000-4000-8000-000000000300',
  'TeenVerseHub Official',
  'Content Creation',
  now(),
  '[
    {"title":"Join the event","body":"Open the event page and read the video requirements."},
    {"title":"Create your video","body":"Record a clear Reel or Short about TeenVerseHub."},
    {"title":"Post publicly","body":"Publish on Instagram, YouTube, or Facebook."},
    {"title":"Submit link","body":"Send your video URL and username for review."},
    {"title":"Get rewarded","body":"Approved submissions receive ₹300 wallet cash."}
  ]'::jsonb,
  '[
    "Video must mention TeenVerseHub clearly.",
    "Post must be public and accessible during review.",
    "Original content only. No copied or misleading content.",
    "Submit Instagram Reel, YouTube Shorts, or Facebook Reel links."
  ]'::jsonb,
  '[
    "One reward per user per event version.",
    "Fake engagement, copied videos, or inaccessible links may be rejected.",
    "TeenVerseHub may request changes before approval.",
    "Rewards are credited only after admin approval."
  ]'::jsonb,
  '[
    {"question":"Can beginners join?","answer":"Yes. Clear, original, polite content matters more than production gear."},
    {"question":"When is the reward credited?","answer":"After admin approval, ₹300 wallet cash is credited automatically."},
    {"question":"Can I edit and resubmit?","answer":"Yes, if the review status is Rejected or Needs changes."}
  ]'::jsonb
)
on conflict (slug) do update
set title = excluded.title,
    description = excluded.description,
    event_version = excluded.event_version,
    status = excluded.status,
    reward_amount = excluded.reward_amount,
    reward_label = excluded.reward_label,
    official_client_id = excluded.official_client_id,
    official_client_name = excluded.official_client_name,
    category = excluded.category,
    timeline = excluded.timeline,
    requirements = excluded.requirements,
    rules = excluded.rules,
    faq = excluded.faq,
    updated_at = now();

insert into public.jobs (
  client_id,
  client_name,
  title,
  description,
  budget,
  job_type,
  duration,
  tags,
  category,
  status,
  is_elite,
  is_featured,
  is_pinned,
  is_marketing_event,
  marketing_event_id,
  reward_label,
  created_at
)
select
  '00000000-0000-4000-8000-000000000300',
  'TeenVerseHub Official',
  'Create a TeenVerseHub Video & Earn ₹300 Wallet Cash',
  'Create and post a short, original public video about TeenVerseHub on Instagram Reels, YouTube Shorts, or Facebook Reels. Approved videos earn ₹300 wallet cash. Beginners are welcome; clear communication, originality, and public accessibility are mandatory.',
  300,
  'Marketing Event',
  'Campaign reward',
  'Content Creation,TeenVerseHub,Video,Reels,Shorts',
  'Content Creation',
  'Open',
  false,
  true,
  true,
  true,
  e.id,
  e.reward_label,
  now()
from public.marketing_events e
where e.slug = 'teenversehub-video-300'
  and not exists (
    select 1
    from public.jobs j
    where j.is_marketing_event = true
      and j.marketing_event_id = e.id
  );
