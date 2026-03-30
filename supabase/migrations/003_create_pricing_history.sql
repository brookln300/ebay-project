create table if not exists pricing_history (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  source text not null,
  sale_price numeric(10,2),
  sale_date date,
  listing_title text,
  item_condition text,
  is_graded boolean default false,
  grade_company text,
  grade_value text,
  raw_data jsonb,
  fetched_at timestamptz default now()
);

create index idx_pricing_card on pricing_history(card_id);
create index idx_pricing_date on pricing_history(sale_date desc);
