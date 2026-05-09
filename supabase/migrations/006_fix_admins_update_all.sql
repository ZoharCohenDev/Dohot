-- ─── 006: fix admins_update_all bypassing owner_update field restrictions ─────
--
-- Migration 005 created owner_update WITH CHECK to block privileged field
-- changes by regular users. However, the admins_update_all policy from 002
-- included `auth.uid() = id` in its USING clause. PostgreSQL OR-combines
-- permissive policies: any permissive WITH CHECK that passes allows the update.
-- Since admins_update_all had no explicit WITH CHECK, its implicit WITH CHECK
-- was inherited from USING, meaning `auth.uid() = id` (always true for self)
-- passed — making every self-update succeed regardless of owner_update.
--
-- Fix: drop and recreate admins_update_all without `auth.uid() = id`.
-- Only real admins match the policy now. Regular users fall through to
-- owner_update, which enforces the field restrictions.
--
-- Uses bp_immutable_fields (SECURITY DEFINER, created in migration 005) to
-- read the caller's role without triggering recursive RLS evaluation.

DROP POLICY IF EXISTS "admins_update_all" ON business_profiles;

CREATE POLICY "admins_update_all" ON business_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.bp_immutable_fields(auth.uid()) f
      WHERE f.role = 'admin'
    )
  );
