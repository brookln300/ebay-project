-- App users (simple email/password auth)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  display_name text,
  tier text default 'free' check (tier in ('free','premium','pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'active' check (subscription_status in ('active','canceled','past_due','trialing')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_app_users_email on app_users(email);
create index idx_app_users_stripe on app_users(stripe_customer_id);

-- Usage tracking
create table if not exists usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  action text not null check (action in ('scan','listing')),
  count integer default 1,
  period_date date default current_date,
  created_at timestamptz default now()
);

create index idx_usage_user_date on usage_tracking(user_id, period_date);
create index idx_usage_action on usage_tracking(action);

-- Sessions for auth tokens
create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index idx_sessions_token on user_sessions(token);
create index idx_sessions_expires on user_sessions(expires_at);
