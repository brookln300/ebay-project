create table if not exists scan_jobs (
  id uuid primary key default gen_random_uuid(),
  directory_path text not null,
  files_found integer default 0,
  files_processed integer default 0,
  status text default 'pending' check (status in ('pending','running','completed','failed')),
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index idx_scanjobs_status on scan_jobs(status);
create index idx_scanjobs_created on scan_jobs(created_at desc);
