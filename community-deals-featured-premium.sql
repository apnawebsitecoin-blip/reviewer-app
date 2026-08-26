-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Community Deal Submissions
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists community_deals (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  product_name text not null,
  product_url  text not null,
  price        numeric,
  category     text,
  image_url    text,
  description  text,
  status       text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  admin_note   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table community_deals enable row level security;

create policy "Users insert own deals"
  on community_deals for insert
  with check (auth.uid() = user_id);

create policy "Users view own deals"
  on community_deals for select
  using (auth.uid() = user_id);

-- Admins see and manage everything
create policy "Admins manage all deals"
  on community_deals for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Auto updated_at
create or replace function set_community_deals_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_community_deals_updated_at on community_deals;
create trigger trg_community_deals_updated_at
  before update on community_deals
  for each row execute procedure set_community_deals_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Featured / Sponsored product slots
-- ─────────────────────────────────────────────────────────────────────────────

alter table products
  add column if not exists is_featured  boolean default false,
  add column if not exists is_sponsored boolean default false;

-- Index for fast homepage featured queries
create index if not exists idx_products_featured  on products(is_featured)  where is_featured = true;
create index if not exists idx_products_sponsored on products(is_sponsored) where is_sponsored = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Premium tier
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists is_premium          boolean default false,
  add column if not exists premium_expires_at  timestamptz;
