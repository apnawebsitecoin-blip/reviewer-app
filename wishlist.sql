create table if not exists wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table wishlists enable row level security;

create policy "Users manage own wishlist" on wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Anyone can read wishlist counts" on wishlists
  for select using (true);
