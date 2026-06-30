begin;

alter table public.opportunities
add column if not exists publish_to text[] not null default array['intern']::text[];

alter table public.opportunities
drop constraint if exists opportunities_publish_to_valid_check;

alter table public.opportunities
add constraint opportunities_publish_to_valid_check
check (
array_length(publish_to, 1) is not null
and publish_to <@ array['intern', 'app']::text[]
);

create index if not exists idx_opportunities_publish_to
on public.opportunities using gin (publish_to);

commit;
