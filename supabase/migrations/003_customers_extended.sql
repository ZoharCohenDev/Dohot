-- Add structured address fields + email to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email        text,
  ADD COLUMN IF NOT EXISTS city         text,
  ADD COLUMN IF NOT EXISTS street       text,
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS apartment    text,
  ADD COLUMN IF NOT EXISTS floor        text;

-- Back-fill search index
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin (to_tsvector('simple', name));
