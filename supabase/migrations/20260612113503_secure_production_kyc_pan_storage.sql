-- Store production PAN verification data without persisting full PAN values.

alter table public.freelancers
  add column if not exists pan_hash text,
  add column if not exists pan_last4 text;

create unique index if not exists freelancers_pan_hash_unique
  on public.freelancers (pan_hash)
  where pan_hash is not null;
