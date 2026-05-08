-- ─── Migration: add certifications_note column ───────────────────────────────
-- Run this once in the Supabase SQL editor.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS certifications_note text;

-- ─── Storage: cert-images bucket ─────────────────────────────────────────────
-- Public bucket for scanned certificate images.

INSERT INTO storage.buckets (id, name, public)
VALUES ('cert-images', 'cert-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "cert-images: owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cert-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "cert-images: owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'cert-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "cert-images: owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cert-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "cert-images: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cert-images');
