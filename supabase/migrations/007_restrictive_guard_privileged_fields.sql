-- ─── 007: enforce immutable fields via RESTRICTIVE policy ────────────────────
--
-- Migrations 005–006 failed to block privilege escalation for two reasons:
--
-- 1. Column-name shadowing in owner_update's WITH CHECK:
--    Inside the EXISTS subquery, unqualified names (role, is_active, plan, ...)
--    resolved to bp_immutable_fields' FROM-clause columns, not the new-row
--    values. Every comparison became f.role = f.role — always TRUE — so the
--    policy never blocked any update.
--
-- 2. Permissive policies are OR-combined: admins_update_all's implicit WITH
--    CHECK (auth.uid() = id) provided a bypass for all self-updates.
--
-- Fix: AS RESTRICTIVE policies are AND-combined with the merged permissive
-- result, so they cannot be bypassed by any permissive policy. The new
-- bp_can_update_check() function receives the new-row values as explicit
-- parameters — no subquery, no column-name ambiguity.

-- ── Helper function ───────────────────────────────────────────────────────────
-- Receives the proposed new values for privileged columns and checks whether
-- the calling user is allowed to write them.
-- SECURITY DEFINER: reads business_profiles without triggering RLS recursion.
CREATE OR REPLACE FUNCTION public.bp_can_update_check(
  uid                              uuid,
  new_role                         text,
  new_is_active                    boolean,
  new_plan                         text,
  new_subscription_expiration_date date,
  new_username                     text
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_profiles
    WHERE id = uid
      AND (
        -- Admins may change any field on any row.
        role = 'admin'
        OR (
          -- Non-admins: every privileged column must be unchanged.
          role                         = new_role
          AND is_active                = new_is_active
          AND plan                     = new_plan
          AND subscription_expiration_date IS NOT DISTINCT FROM new_subscription_expiration_date
          AND username                 IS NOT DISTINCT FROM new_username
        )
      )
  );
$$;

-- ── Drop the broken permissive policy ────────────────────────────────────────
DROP POLICY IF EXISTS "owner_update" ON business_profiles;

-- ── Re-create owner_update with simple self-ownership check only ──────────────
-- Field-level enforcement is now handled entirely by guard_privileged_fields
-- below; this policy only controls which rows a user may target.
CREATE POLICY "owner_update" ON business_profiles
  FOR UPDATE
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── RESTRICTIVE guard: cannot be bypassed by any permissive policy ────────────
-- USING (TRUE) does not further restrict row selection; permissive USING
-- policies already govern that. WITH CHECK is the enforcement point.
-- Column names (role, is_active, ...) here are in the policy's outer scope and
-- correctly refer to the new-row values being written.
CREATE POLICY "guard_privileged_fields"
  ON business_profiles
  AS RESTRICTIVE
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (
    public.bp_can_update_check(
      auth.uid(),
      role,
      is_active,
      plan,
      subscription_expiration_date,
      username
    )
  );
