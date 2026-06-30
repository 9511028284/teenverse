create table if not exists platform_deployments (
  id text primary key,
  provider text not null,
  project_id text,
  project_name text,
  url text,
  state text not null,
  target text,
  commit_sha text,
  created_at text not null,
  synced_at text not null
);

create index if not exists platform_deployments_created_at_idx
  on platform_deployments (created_at desc);
