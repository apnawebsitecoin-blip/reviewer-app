-- Site settings table (single-row pattern)
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Anyone can read (for public homepage rendering)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "admin_write_settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert the default empty row
INSERT INTO site_settings (id, settings)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;
