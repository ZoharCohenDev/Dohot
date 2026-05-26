-- Migration 008: Add quote_status column for follow-up tracking on quote documents.
-- NULL is treated as 'waiting' (initial state) so no backfill is needed for existing rows.
-- The existing RLS "owner_all" policy on documents already enforces that a professional
-- can only UPDATE rows where professional_id = auth.uid(), so no new policy is required.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS quote_status text
    CHECK (quote_status IN ('waiting', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_documents_quote_status
  ON documents (professional_id, quote_status)
  WHERE type = 'quote';
