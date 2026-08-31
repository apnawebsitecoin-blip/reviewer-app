-- Blog Posts table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blog_posts (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  content          text        NOT NULL DEFAULT '',
  cover_image      text,
  category         text,
  meta_description text,
  published_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public read published posts"
  ON blog_posts FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

-- Admins can do everything
CREATE POLICY "Admin full access to blog_posts"
  ON blog_posts
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
