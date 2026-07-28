-- Enterprise trust platform: practical challenges, portfolio verification,
-- applicant matching, and paid trial evidence. All scoring remains server-side.

alter table if exists public.freelancers
  add column if not exists challenge_score numeric(5,2),
  add column if not exists challenge_report jsonb not null default '{}'::jsonb,
  add column if not exists challenge_submission jsonb not null default '{}'::jsonb,
  add column if not exists evaluation_date timestamptz,
  add column if not exists confidence_level numeric(5,2),
  add column if not exists verified_skills text[] not null default '{}'::text[],
  add column if not exists confidence_scores jsonb not null default '{}'::jsonb,
  add column if not exists project_analysis jsonb not null default '[]'::jsonb,
  add column if not exists technical_summary text,
  add column if not exists ai_interview_score numeric(5,2),
  add column if not exists response_speed_hours numeric(8,2) default 24,
  add column if not exists availability_status text not null default 'available';

alter table if exists public.applications
  add column if not exists trust_match_score numeric(5,2),
  add column if not exists trust_match_report jsonb not null default '{}'::jsonb,
  add column if not exists trust_match_evaluated_at timestamptz,
  add column if not exists trial_id uuid;

create table if not exists public.skill_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.freelancers(id) on delete cascade,
  job_id bigint references public.jobs(id) on delete set null,
  category text not null,
  topic text not null,
  title text not null,
  brief text not null,
  instructions text not null,
  deliverables jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  rubric jsonb not null default '{}'::jsonb,
  duration_minutes integer not null default 45 check (duration_minutes between 10 and 180),
  status text not null default 'active' check (status in ('active', 'submitted', 'evaluated', 'expired')),
  auto_save jsonb not null default '{}'::jsonb,
  challenge_submission jsonb not null default '{}'::jsonb,
  challenge_score numeric(5,2),
  challenge_report jsonb not null default '{}'::jsonb,
  confidence_level numeric(5,2),
  provider text,
  model text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '45 minutes'),
  submitted_at timestamptz,
  evaluation_date timestamptz
);

create index if not exists skill_challenges_user_created_idx
  on public.skill_challenges (user_id, created_at desc);
create index if not exists skill_challenges_job_idx
  on public.skill_challenges (job_id) where job_id is not null;

create table if not exists public.trust_score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.freelancers(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  breakdown jsonb not null default '[]'::jsonb,
  reason text not null default 'recalculated',
  created_at timestamptz not null default now()
);

create index if not exists trust_score_history_user_created_idx
  on public.trust_score_history (user_id, created_at desc);

create table if not exists public.portfolio_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.freelancers(id) on delete cascade,
  source_project_ids text[] not null default '{}'::text[],
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  verified_skills text[] not null default '{}'::text[],
  confidence_scores jsonb not null default '{}'::jsonb,
  project_analysis jsonb not null default '[]'::jsonb,
  technical_summary text not null default '',
  fake_project_risk numeric(5,2) not null default 0,
  report jsonb not null default '{}'::jsonb,
  status text not null default 'questions_ready' check (status in ('questions_ready', 'verified', 'needs_review')),
  provider text,
  model text,
  created_at timestamptz not null default now(),
  evaluated_at timestamptz
);

create index if not exists portfolio_verifications_user_created_idx
  on public.portfolio_verifications (user_id, created_at desc);

create table if not exists public.ai_match_reports (
  id uuid primary key default gen_random_uuid(),
  job_id bigint not null references public.jobs(id) on delete cascade,
  client_id uuid not null,
  generated_by uuid not null,
  applicant_count integer not null default 0,
  rankings jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists ai_match_reports_job_created_idx
  on public.ai_match_reports (job_id, created_at desc);
create index if not exists ai_match_reports_client_created_idx
  on public.ai_match_reports (client_id, created_at desc);

create table if not exists public.paid_trials (
  id uuid primary key default gen_random_uuid(),
  job_id bigint references public.jobs(id) on delete set null,
  application_id bigint references public.applications(id) on delete set null,
  client_id uuid not null,
  freelancer_id uuid not null references public.freelancers(id) on delete cascade,
  title text not null,
  brief text not null,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'invited', 'accepted', 'submitted', 'ai_reviewed', 'approved', 'rejected', 'cancelled')),
  due_at timestamptz,
  accepted_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  submission jsonb not null default '{}'::jsonb,
  ai_review jsonb not null default '{}'::jsonb,
  ai_score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paid_trials_client_created_idx
  on public.paid_trials (client_id, created_at desc);
create index if not exists paid_trials_freelancer_created_idx
  on public.paid_trials (freelancer_id, created_at desc);
create index if not exists paid_trials_job_idx
  on public.paid_trials (job_id) where job_id is not null;

create table if not exists public.verified_experiences (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancers(id) on delete cascade,
  client_id uuid not null,
  job_id bigint references public.jobs(id) on delete set null,
  trial_id uuid references public.paid_trials(id) on delete set null,
  title text not null,
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now()
);

create table if not exists public.verified_reviews (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancers(id) on delete cascade,
  client_id uuid not null,
  trial_id uuid references public.paid_trials(id) on delete set null,
  rating numeric(3,2) not null check (rating >= 0 and rating <= 5),
  review text not null,
  verified_at timestamptz not null default now()
);

create table if not exists public.verified_skill_evidence (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.freelancers(id) on delete cascade,
  skill text not null,
  source_type text not null check (source_type in ('challenge', 'portfolio', 'trial', 'review')),
  source_id uuid,
  confidence numeric(5,2) not null check (confidence >= 0 and confidence <= 100),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists verified_experiences_freelancer_idx
  on public.verified_experiences (freelancer_id, verified_at desc);
create index if not exists verified_reviews_freelancer_idx
  on public.verified_reviews (freelancer_id, verified_at desc);
create index if not exists verified_skill_evidence_freelancer_skill_idx
  on public.verified_skill_evidence (freelancer_id, skill, created_at desc);

alter table public.skill_challenges enable row level security;
alter table public.trust_score_history enable row level security;
alter table public.portfolio_verifications enable row level security;
alter table public.ai_match_reports enable row level security;
alter table public.paid_trials enable row level security;
alter table public.verified_experiences enable row level security;
alter table public.verified_reviews enable row level security;
alter table public.verified_skill_evidence enable row level security;

drop policy if exists "skill_challenges_owner_read" on public.skill_challenges;
create policy "skill_challenges_owner_read"
on public.skill_challenges for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "trust_score_history_owner_read" on public.trust_score_history;
create policy "trust_score_history_owner_read"
on public.trust_score_history for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "portfolio_verifications_owner_read" on public.portfolio_verifications;
create policy "portfolio_verifications_owner_read"
on public.portfolio_verifications for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "ai_match_reports_client_read" on public.ai_match_reports;
create policy "ai_match_reports_client_read"
on public.ai_match_reports for select
to authenticated
using ((select auth.uid()) = client_id or (select auth.uid()) = generated_by);

drop policy if exists "paid_trials_participant_read" on public.paid_trials;
create policy "paid_trials_participant_read"
on public.paid_trials for select
to authenticated
using ((select auth.uid()) = client_id or (select auth.uid()) = freelancer_id);

drop policy if exists "verified_experiences_owner_read" on public.verified_experiences;
create policy "verified_experiences_owner_read"
on public.verified_experiences for select
to authenticated
using ((select auth.uid()) = freelancer_id or (select auth.uid()) = client_id);

drop policy if exists "verified_reviews_owner_read" on public.verified_reviews;
create policy "verified_reviews_owner_read"
on public.verified_reviews for select
to authenticated
using ((select auth.uid()) = freelancer_id or (select auth.uid()) = client_id);

drop policy if exists "verified_skill_evidence_owner_read" on public.verified_skill_evidence;
create policy "verified_skill_evidence_owner_read"
on public.verified_skill_evidence for select
to authenticated
using ((select auth.uid()) = freelancer_id);

grant select on public.skill_challenges to authenticated;
grant select on public.trust_score_history to authenticated;
grant select on public.portfolio_verifications to authenticated;
grant select on public.ai_match_reports to authenticated;
grant select on public.paid_trials to authenticated;
grant select on public.verified_experiences to authenticated;
grant select on public.verified_reviews to authenticated;
grant select on public.verified_skill_evidence to authenticated;
