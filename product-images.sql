-- Migration: product_images table for multi-image gallery support
-- Run this in the Supabase SQL editor

create table if not exists product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  image_url     text not null,
  display_order int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists product_images_product_id_idx
  on product_images (product_id, display_order);

alter table product_images enable row level security;

-- Everyone can view product images
create policy "public_read_product_images"
  on product_images for select
  using (true);

-- Only admins can insert / update / delete
create policy "admin_write_product_images"
  on product_images for all
  using  (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
