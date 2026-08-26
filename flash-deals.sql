CREATE TABLE IF NOT EXISTS flash_deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  flash_price NUMERIC(10,2) NOT NULL,
  label       TEXT NOT NULL DEFAULT '⚡ Flash Deal',
  ends_at     TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flash_deals_active_ends_idx ON flash_deals(is_active, ends_at);

ALTER TABLE flash_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_flash_deals"
  ON flash_deals FOR SELECT USING (true);

CREATE POLICY "admin_all_flash_deals"
  ON flash_deals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
