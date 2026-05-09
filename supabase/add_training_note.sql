-- ─── Migration: add training_note column ─────────────────────────────────────
-- Run once in the Supabase SQL editor.
-- Stores the technician's training / qualifications text shown in professional reports.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS training_note text;
