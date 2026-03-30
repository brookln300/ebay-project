create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  image_url text,
  thumbnail_url text,
  player_name text,
  year integer,
  brand text,
  set_name text,
  card_number text,
  parallel text,
  condition_grade text,
  sport text default 'baseball',
  is_rookie boolean default false,
  is_auto boolean default false,
  is_numbered boolean default false,
  numbered_to integer,
  raw_analysis jsonb,
  analysis_confidence numeric(3,2),
  status text default 'scanned' check (status in ('scanned','reviewed','listed','sold','unknown')),
  scanned_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_cards_status on cards(status);
create index idx_cards_player on cards(player_name);
create index idx_cards_sport on cards(sport);
create index idx_cards_created on cards(created_at desc);
