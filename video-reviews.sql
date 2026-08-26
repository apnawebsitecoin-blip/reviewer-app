CREATE TABLE IF NOT EXISTS video_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  youtube_video_id  TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'live'
                      CHECK (status IN ('processing', 'live', 'failed', 'deleted')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS video_reviews_product_id_idx  ON video_reviews(product_id);
CREATE INDEX IF NOT EXISTS video_reviews_reviewer_id_idx ON video_reviews(reviewer_id);

ALTER TABLE video_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_video_reviews"
  ON video_reviews FOR SELECT USING (status = 'live');

CREATE POLICY "reviewer_insert_video_reviews"
  ON video_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "admin_all_video_reviews"
  ON video_reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
