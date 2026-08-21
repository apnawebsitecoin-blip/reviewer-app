-- ============================================================
-- Reviewer App – Full MVP Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── Profiles (extends Supabase auth.users) ────────────────
create table if not exists profiles (
  id uuid references auth.users primary key,
  name text,
  phone text,
  upi_id text,
  pan_number text,
  trust_score numeric default 0,
  wallet_balance numeric default 0,
  is_admin boolean default false,
  is_blocked boolean default false,
  referred_by uuid references profiles(id),
  created_at timestamp default now()
);

-- ── Products ──────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  price numeric,
  platform text,
  original_url text not null,
  category text,
  created_at timestamp default now()
);

-- ── Reviews ──────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  reviewer_id uuid references profiles(id) on delete cascade,
  sentiment text check (sentiment in ('positive','neutral','negative')),
  review_text text,
  invoice_url text,
  media_url text,        -- photo/video unboxing proof
  invoice_hash text,     -- SHA-256 for duplicate detection
  duplicate_flag boolean default false,
  verified boolean default false,
  later_returned boolean default false,
  detailed_badge boolean default false,
  created_at timestamp default now(),
  unique(product_id, reviewer_id)
);

-- ── Clicks ───────────────────────────────────────────────
create table if not exists clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  reviewer_id uuid references profiles(id) on delete cascade,
  ip_address text,
  clicked_at timestamp default now()
);

-- ── Commissions ──────────────────────────────────────────
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  click_id uuid references clicks(id),
  reviewer_id uuid references profiles(id) on delete cascade,
  sale_amount numeric,
  total_commission numeric,
  reviewer_share numeric,
  platform_share numeric,
  buyer_share numeric default 0,
  status text check (status in ('pending','confirmed','paid')) default 'pending',
  created_at timestamp default now()
);

-- ── Notifications ────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  message text,
  read boolean default false,
  created_at timestamp default now()
);

-- ── Questions (Ask the Reviewer Q&A) ─────────────────────
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  asked_by uuid references profiles(id) on delete cascade,
  question_text text not null,
  answer_text text,
  answered_by uuid references profiles(id),
  created_at timestamp default now()
);

-- ── Price Alerts ─────────────────────────────────────────
create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  target_price numeric,
  created_at timestamp default now(),
  unique(user_id, product_id)
);

-- ── Collections (Best in Budget etc.) ────────────────────
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product_ids uuid[],
  created_at timestamp default now()
);

-- ── Referral codes ───────────────────────────────────────
alter table profiles add column if not exists referral_code text unique;

-- ── Functions & Triggers ─────────────────────────────────

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
declare
  ref_code text;
begin
  ref_code := upper(substring(new.id::text from 1 for 8));
  insert into profiles (id, name, referral_code)
  values (new.id, new.raw_user_meta_data->>'name', ref_code);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Increment trust_score when review is verified
create or replace function increment_trust_score()
returns trigger as $$
begin
  if new.verified = true and old.verified = false then
    update profiles set trust_score = trust_score + 1 where id = new.reviewer_id;
    -- Detailed Review Bonus (+2 extra)
    if new.detailed_badge = true then
      update profiles set trust_score = trust_score + 2 where id = new.reviewer_id;
    end if;
    -- Send notification
    insert into notifications (user_id, message)
    values (new.reviewer_id, 'आपका रिव्यू approve हो गया! 🎉');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_verified on reviews;
create trigger on_review_verified
  after update on reviews
  for each row execute procedure increment_trust_score();

-- Notify reviewer when commission confirmed
create or replace function notify_commission_confirmed()
returns trigger as $$
begin
  if new.status = 'confirmed' and old.status = 'pending' then
    insert into notifications (user_id, message)
    values (new.reviewer_id, 'आपका commission confirm हो गया! ₹' || new.reviewer_share || ' wallet में जोड़े गए।');
    update profiles set wallet_balance = wallet_balance + new.reviewer_share where id = new.reviewer_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_commission_confirmed on commissions;
create trigger on_commission_confirmed
  after update on commissions
  for each row execute procedure notify_commission_confirmed();

-- ── Row Level Security ────────────────────────────────────

alter table profiles enable row level security;
alter table products enable row level security;
alter table reviews enable row level security;
alter table clicks enable row level security;
alter table commissions enable row level security;
alter table notifications enable row level security;
alter table questions enable row level security;
alter table price_alerts enable row level security;
alter table collections enable row level security;

-- Profiles: users read own, admin reads all
create policy "profiles_select" on profiles for select using (auth.uid() = id or exists(select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Products: anyone can read
create policy "products_select" on products for select using (true);
create policy "products_insert" on products for insert with check (exists(select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "products_update" on products for update using (exists(select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "products_delete" on products for delete using (exists(select 1 from profiles where id = auth.uid() and is_admin = true));

-- Reviews: anyone reads verified; own unverified; admin reads all
create policy "reviews_select" on reviews for select using (verified = true or reviewer_id = auth.uid() or exists(select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "reviews_insert" on reviews for insert with check (auth.uid() = reviewer_id);
create policy "reviews_update_own" on reviews for update using (reviewer_id = auth.uid() or exists(select 1 from profiles where id = auth.uid() and is_admin = true));

-- Clicks: anyone inserts, admin reads all, user reads own
create policy "clicks_insert" on clicks for insert with check (true);
create policy "clicks_select" on clicks for select using (reviewer_id = auth.uid() or exists(select 1 from profiles where id = auth.uid() and is_admin = true));

-- Commissions: own or admin
create policy "commissions_select" on commissions for select using (reviewer_id = auth.uid() or exists(select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "commissions_insert" on commissions for insert with check (exists(select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "commissions_update" on commissions for update using (exists(select 1 from profiles where id = auth.uid() and is_admin = true));

-- Notifications: own only
create policy "notifications_select" on notifications for select using (user_id = auth.uid());
create policy "notifications_update" on notifications for update using (user_id = auth.uid());

-- Questions: anyone reads, logged-in inserts
create policy "questions_select" on questions for select using (true);
create policy "questions_insert" on questions for insert with check (auth.uid() = asked_by);
create policy "questions_update" on questions for update using (auth.uid() = answered_by or exists(select 1 from profiles where id = auth.uid() and is_admin = true));

-- Price alerts: own
create policy "price_alerts_all" on price_alerts for all using (user_id = auth.uid());

-- Collections: anyone reads, admin manages
create policy "collections_select" on collections for select using (true);
create policy "collections_manage" on collections for all using (exists(select 1 from profiles where id = auth.uid() and is_admin = true));

-- Storage bucket for invoices/media (run after creating bucket in dashboard)
-- insert into storage.buckets (id, name, public) values ('review-media', 'review-media', true);
