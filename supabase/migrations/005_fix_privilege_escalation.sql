-- ─── 005: block self-promotion via business_profiles UPDATE ──────────────────
--
-- The original "owner_all" policy allowed any authenticated user to UPDATE any
-- column on their own row, including role / is_active / plan /
-- subscription_expiration_date / username. A user with their own JWT could hit
-- the Supabase REST API directly and grant themselves admin access.
--
-- This migration replaces "owner_all" with four per-operation policies.
-- The UPDATE policy uses a SECURITY DEFINER function to read the current
-- privileged column values without triggering recursive RLS evaluation, then
-- rejects any UPDATE that would change those values.
--
-- Admins retain full UPDATE ability via the existing "admins_update_all"
-- policy introduced in migration 002 (permissive policies combine with OR).

-- ── Helper: read privileged fields for a given user, bypassing RLS ────────────
-- SECURITY DEFINER means this function runs as the role that defined it
-- (postgres/service), not as the calling user. This avoids the recursive RLS
-- problem that arises when a policy on business_profiles queries business_profiles.

CREATE OR REPLACE FUNCTION public.bp_immutable_fields(uid uuid)
RETURNS TABLE (
  role                         text,
  is_active                    boolean,
  plan                         text,
  subscription_expiration_date date,
  username                     text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role, is_active, plan, subscription_expiration_date, username
  FROM public.business_profiles
  WHERE id = uid;
$$;

-- ── Replace the permissive combined policy ────────────────────────────────────

DROP POLICY IF EXISTS "owner_all" ON business_profiles;

-- SELECT: each user can read their own row.
-- (admins_read_all from migration 002 also grants admins read access to all rows.)
CREATE POLICY "owner_select" ON business_profiles
  FOR SELECT USING (id = auth.uid());

-- INSERT: guards direct INSERT via the anon key.
-- The handle_new_user trigger is SECURITY DEFINER and bypasses RLS.
CREATE POLICY "owner_insert" ON business_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- DELETE: allow owner to delete their own row (also cascaded via auth.users).
CREATE POLICY "owner_delete" ON business_profiles
  FOR DELETE USING (id = auth.uid());

-- UPDATE: users may edit non-privileged fields on their own row only.
-- The WITH CHECK compares the incoming (new) values of privileged columns
-- against the current DB values read by bp_immutable_fields. Any attempt to
-- change role / is_active / plan / subscription_expiration_date / username is
-- rejected with a policy violation error.
CREATE POLICY "owner_update" ON business_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.bp_immutable_fields(auth.uid()) f
      WHERE f.role                         = role
        AND f.is_active                    = is_active
        AND f.plan                         = plan
        AND f.subscription_expiration_date IS NOT DISTINCT FROM subscription_expiration_date
        AND f.username                     IS NOT DISTINCT FROM username
    )
  );
