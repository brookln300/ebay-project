create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id) on delete cascade,
  listing_type text not null check (listing_type in ('auction','buy_it_now')),
  title text not null,
  description_html text not null,
  start_price numeric(10,2),
  buy_it_now_price numeric(10,2),
  shipping_cost numeric(10,2) default 1.00,
  category_id text,
  condition_id integer,
  ebay_item_id text,
  ebay_status text default 'draft' check (ebay_status in ('draft','active','ended','sold')),
  template_data jsonb,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_listings_card on listings(card_id);
create index idx_listings_status on listings(ebay_status);
create index idx_listings_type on listings(listing_type);
