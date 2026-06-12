alter table public.users
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists terms_user_agent text;

create unique index if not exists user_banking_user_id_unique
  on public.user_banking (user_id);
