-- ─── Storage buckets ─────────────────────────────────────────────────────────
-- Run this once in the Supabase SQL editor (or via supabase db push).
-- Buckets are public (logos/signatures must be reachable in generated PDFs).

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('logos',          'logos',          true),
  ('signatures',     'signatures',     true),
  ('report-images',  'report-images',  true),
  ('pdf-documents',  'pdf-documents',  false)
ON CONFLICT (id) DO NOTHING;

-- ─── logos ────────────────────────────────────────────────────────────────────

CREATE POLICY "logos: owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "logos: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "logos: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "logos: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'logos');

-- ─── signatures ───────────────────────────────────────────────────────────────

CREATE POLICY "signatures: owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "signatures: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "signatures: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "signatures: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'signatures');

-- ─── report-images ────────────────────────────────────────────────────────────

CREATE POLICY "report-images: owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "report-images: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'report-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "report-images: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'report-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "report-images: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'report-images');

-- ─── pdf-documents ────────────────────────────────────────────────────────────

CREATE POLICY "pdf-documents: owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pdf-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "pdf-documents: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'pdf-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "pdf-documents: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'pdf-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated owners only (signed URLs for sharing)
CREATE POLICY "pdf-documents: owner read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'pdf-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
