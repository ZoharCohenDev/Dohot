-- ─── Expand profession options ───────────────────────────────────────────────
ALTER TABLE business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_profession_check;

ALTER TABLE business_profiles
  ADD CONSTRAINT business_profiles_profession_check
  CHECK (profession IN (
    'leak_detection', 'plumber', 'electrician', 'renovation',
    'roofing', 'ac', 'waterproofing', 'general_technician', 'other'
  ));

-- ─── Add role / subscription / username columns ───────────────────────────────
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS username                    text,
  ADD COLUMN IF NOT EXISTS role                        text NOT NULL DEFAULT 'technician'
                                                       CHECK (role IN ('admin', 'technician')),
  ADD COLUMN IF NOT EXISTS subscription_expiration_date date,
  ADD COLUMN IF NOT EXISTS is_active                   boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS biz_profiles_username_idx
  ON business_profiles (username)
  WHERE username IS NOT NULL;

-- ─── RLS: admins can read all profiles ───────────────────────────────────────
-- (existing policy lets users read their own row; add admin read-all)
CREATE POLICY IF NOT EXISTS "admins_read_all"
  ON business_profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR (
      SELECT role FROM business_profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- ─── RLS: admins can update any profile ──────────────────────────────────────
CREATE POLICY IF NOT EXISTS "admins_update_all"
  ON business_profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR (
      SELECT role FROM business_profiles WHERE id = auth.uid()
    ) = 'admin'
  );
