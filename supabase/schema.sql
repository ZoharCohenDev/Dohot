-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── business_profiles ───────────────────────────────────────────────────────
-- One row per authenticated user (professional).
-- Fields map to: ProfileScreen (name, business_name, phone, license_number, logo_url, bio)
--                TrustScreen   (signature_url, default_disclaimer, certifications)
--                SettingsScreen (plan, full_name, business_name)
--                PdfPreviewScreen (business_name, license_number rendered in PDF header)

CREATE TABLE business_profiles (
  id                  uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name           text        NOT NULL DEFAULT '',
  business_name       text        NOT NULL DEFAULT '',
  -- profession matches RegisterScreen picker options
  profession          text        NOT NULL DEFAULT 'other'
                                  CHECK (profession IN (
                                    'leak_detection', 'plumber', 'electrician',
                                    'renovation', 'roofing', 'other'
                                  )),
  phone               text,
  license_number      text,       -- ח.פ / עוסק — shown in PDF header
  logo_url            text,       -- uploaded logo shown in PDF header
  bio                 text,       -- short business description
  signature_url       text,       -- drawn digital signature, embedded in PDF
  default_disclaimer  text,       -- legal disclaimer, auto-appended to reports
  -- [{name: string, year: string}] — TrustScreen certifications list
  certifications      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  -- 'free' | 'pro' — shown in SettingsScreen profile card
  plan                text        NOT NULL DEFAULT 'free'
                                  CHECK (plan IN ('free', 'pro')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── customers ───────────────────────────────────────────────────────────────
-- Fields map to: CustomersScreen list (name, address, last_contact_at)
--                CustomerStep form (name, phone, address)
--                PdfPreviewScreen customer meta section (name, phone, address)

CREATE TABLE customers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name              text        NOT NULL,
  phone             text,
  address           text,
  -- CustomersScreen filter chips: פרטיים/ועדי בית/חברות ביטוח/בעלי מקצוע
  type              text        NOT NULL DEFAULT 'private'
                                CHECK (type IN (
                                  'private', 'building_committee',
                                  'insurance_company', 'contractor', 'other'
                                )),
  notes             text,
  last_contact_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── documents ───────────────────────────────────────────────────────────────
-- Parent record for every created document.
-- Fields map to: DocumentsScreen list (type, title, status, amount, date)
--                DashboardScreen recent activity (type, title, status)
--                PdfPreviewScreen header (#doc_number, created_at)
--                QuoteScreen header (#doc_number, customer name)

CREATE TABLE documents (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  customer_id       uuid        REFERENCES customers ON DELETE SET NULL,
  -- matches CreateDocumentTypeScreen + DocumentsScreen tabs
  type              text        NOT NULL
                                CHECK (type IN ('report', 'quote', 'worklog', 'agreement')),
  -- e.g. "דוח גילוי נזילה — דירת קוטון"
  title             text        NOT NULL DEFAULT '',
  -- DocumentsScreen status pills + DashboardScreen activity
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN (
                                  'draft', 'sent', 'pending', 'signed', 'approved'
                                )),
  -- "#2026-0428" — PdfPreviewScreen header reference
  doc_number        text,
  -- QuoteScreen: subtotal before VAT, in ILS
  amount            numeric(10, 2),
  -- URL to generated PDF stored in Supabase Storage
  pdf_url           text,
  sent_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── reports ─────────────────────────────────────────────────────────────────
-- Detail row for 'report' and 'worklog' document types.
-- Fields map to: CustomerStep    (visit_date, property_type)
--                IssueStep       (issue_type)
--                PhotosStep      (photo_urls)
--                VoiceScreen     (voice_transcript)
--                RecommendationsStep (findings_summary, recommendations)
--                PdfPreviewScreen (all sections rendered from this row)

CREATE TABLE reports (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       uuid        NOT NULL REFERENCES documents ON DELETE CASCADE,
  -- CustomerStep date picker field
  visit_date        date,
  -- CustomerStep property type grid: דירה/בית פרטי/בניין/מסחרי/משרד/אחר
  property_type     text        CHECK (property_type IN (
                                  'apartment', 'house', 'building',
                                  'commercial', 'office', 'other'
                                )),
  -- IssueStep 6-tile selector
  issue_type        text        CHECK (issue_type IN (
                                  'leak', 'waterproofing', 'pipe',
                                  'roof', 'moisture', 'other'
                                )),
  -- free-text note added alongside issue type
  issue_note        text,
  -- RecommendationsStep editable summary card text
  findings_summary  text,
  -- VoiceScreen raw transcript stored verbatim
  voice_transcript  text,
  -- PhotosStep: [{uri, label, tag, annotated}]
  photo_urls        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  -- RecommendationsStep numbered list: [{priority, title, description}]
  -- priority values: 'מיידי' | 'תוך 48 שעות' | 'עד שבועיים'
  recommendations   jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── quote_items ─────────────────────────────────────────────────────────────
-- Line items for QuoteScreen: פירוט עבודה table
-- Kept separate from the documents table so they can be edited individually.

CREATE TABLE quote_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid        NOT NULL REFERENCES documents ON DELETE CASCADE,
  title         text        NOT NULL,   -- "בדיקת לחץ ואיתור מקור"
  qty           integer     NOT NULL DEFAULT 1,
  unit_price    numeric(10, 2) NOT NULL,
  sort_order    smallint    NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items        ENABLE ROW LEVEL SECURITY;

-- business_profiles: each professional owns their own row
CREATE POLICY "owner_all" ON business_profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- customers: professional owns all their customers
CREATE POLICY "owner_all" ON customers
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- documents: professional owns all their documents
CREATE POLICY "owner_all" ON documents
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- reports: accessible if the parent document belongs to the user
CREATE POLICY "owner_via_document" ON reports
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = reports.document_id
        AND d.professional_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = reports.document_id
        AND d.professional_id = auth.uid()
    )
  );

-- quote_items: accessible if the parent document belongs to the user
CREATE POLICY "owner_via_document" ON quote_items
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = quote_items.document_id
        AND d.professional_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = quote_items.document_id
        AND d.professional_id = auth.uid()
    )
  );

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_customers_professional ON customers (professional_id);
CREATE INDEX idx_customers_type         ON customers (type);
CREATE INDEX idx_documents_professional ON documents (professional_id);
CREATE INDEX idx_documents_customer     ON documents (customer_id);
CREATE INDEX idx_documents_type_status  ON documents (type, status);
CREATE INDEX idx_reports_document       ON reports (document_id);
CREATE INDEX idx_quote_items_document   ON quote_items (document_id, sort_order);

-- ─── Auto-create business_profile on signup ──────────────────────────────────
-- Triggered when a new user signs up via auth.users insert.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_profiles (id, full_name, profession, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'profession', ''), 'other'),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    profession = EXCLUDED.profession,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
