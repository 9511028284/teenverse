-- Expand the freelancer eligibility age window to 14-25.

alter table public.freelancers
  drop constraint if exists freelancers_age_check;

alter table public.freelancers
  add constraint freelancers_age_check
  check (age between 14 and 25);
