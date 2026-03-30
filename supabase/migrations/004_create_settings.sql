create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
  ('watch_directory', '"C:\\Users\\knati\\Documents\\card-scans"'),
  ('ebay_defaults', '{"shipping_service":"USPSFirstClass","shipping_cost":1.00,"location":"Dallas, TX","return_policy":"30 days","condition_id":3000}'),
  ('listing_templates', '{"auction":{"duration":"7","start_time":"sunday_evening","price_pct":0.70},"buy_it_now":{"duration":"GTC","best_offer":true,"price_pct":1.0}}'),
  ('scan_interval_ms', '86400000')
on conflict (key) do nothing;
