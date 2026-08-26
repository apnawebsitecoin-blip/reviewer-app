CREATE TABLE IF NOT EXISTS coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL,
  title          TEXT NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'percent'
                   CHECK (discount_type IN ('percent', 'flat')),
  discount_value NUMERIC(10,2) NOT NULL,
  product_id     UUID REFERENCES products(id) ON DELETE CASCADE,
  category       TEXT,
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- product_id = NULL + category = NULL → site-wide coupon
-- product_id = NULL + category SET  → category coupon
-- product_id SET                    → product-specific coupon

CREATE INDEX IF NOT EXISTS coupons_product_id_idx ON coupons(product_id);
CREATE INDEX IF NOT EXISTS coupons_category_idx   ON coupons(category);
CREATE INDEX IF NOT EXISTS coupons_active_idx     ON coupons(is_active);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_coupons"
  ON coupons FOR SELECT USING (true);

CREATE POLICY "admin_all_coupons"
  ON coupons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));
