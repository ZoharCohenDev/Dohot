// ─── Enums (matching CHECK constraints in schema.sql) ──────────────────────

export type Profession =
  | 'leak_detection'
  | 'plumber'
  | 'electrician'
  | 'renovation'
  | 'roofing'
  | 'ac'
  | 'waterproofing'
  | 'general_technician'
  | 'other';

export type UserRole = 'admin' | 'technician';

export type CustomerType =
  | 'private'            // פרטיים
  | 'building_committee' // ועדי בית
  | 'insurance_company'  // חברות ביטוח
  | 'contractor'         // בעלי מקצוע
  | 'other';

export type DocumentType = 'report' | 'quote' | 'worklog' | 'agreement';

export type DocumentStatus = 'draft' | 'sent' | 'pending' | 'signed' | 'approved';

export type PropertyType =
  | 'apartment'   // דירה
  | 'house'       // בית פרטי
  | 'building'    // בניין
  | 'commercial'  // מסחרי
  | 'office'      // משרד
  | 'other';

export type IssueType =
  | 'leak'           // גילוי נזילה
  | 'waterproofing'  // איטום
  | 'pipe'           // בעיית צנרת
  | 'roof'           // נזק גג
  | 'moisture'       // עובש ולחות
  | 'other';

export type Plan = 'free' | 'pro';

// ─── JSONB sub-shapes ────────────────────────────────────────────────────────

export interface Certification {
  name: string;
  year: string;
  image_url?: string;   // public URL of uploaded certificate scan
}

/** One annotated photo attached to a report (PhotosStep) */
export interface ReportPhoto {
  uri: string;
  label?: string;   // e.g. "קיר מערבי"
  tag?: string;     // e.g. "לפני" | "אחרי"
  annotated?: boolean;
}

/** One recommendation row (RecommendationsStep) */
export interface Recommendation {
  priority: string;  // 'מיידי' | 'תוך 48 שעות' | 'עד שבועיים'
  title: string;
  description: string;
}

// ─── Table row types ─────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string;                        // auth.uid()
  full_name: string;
  business_name: string;
  email: string | null;
  profession: Profession;
  phone: string | null;
  license_number: string | null;     // ח.פ / עוסק
  logo_url: string | null;
  bio: string | null;
  signature_url: string | null;
  default_disclaimer: string | null;
  certifications_note: string | null;
  certifications: Certification[];
  plan: Plan;
  // admin/role system
  username: string | null;
  role: UserRole;
  subscription_expiration_date: string | null; // ISO date 'YYYY-MM-DD'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  professional_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;        // legacy / formatted composite
  city: string | null;
  street: string | null;
  house_number: string | null;
  apartment: string | null;
  floor: string | null;
  type: CustomerType;
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  professional_id: string;
  customer_id: string | null;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  doc_number: string | null;
  amount: number | null;
  pdf_url: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  document_id: string;
  visit_date: string | null;
  property_type: PropertyType | null;
  issue_type: IssueType | null;
  issue_note: string | null;
  findings_summary: string | null;
  voice_transcript: string | null;
  photo_urls: ReportPhoto[];
  recommendations: Recommendation[];
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  document_id: string;
  title: string;
  qty: number;
  unit_price: number;
  sort_order: number;
  created_at: string;
}

// ─── Insert/Update shapes (omit server-generated fields) ─────────────────────

export type InsertBusinessProfile = Omit<BusinessProfile, 'created_at' | 'updated_at'>;
export type UpdateBusinessProfile = Partial<Omit<BusinessProfile, 'id' | 'created_at' | 'updated_at'>>;

export type InsertCustomer = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCustomer = Partial<Omit<Customer, 'id' | 'professional_id' | 'created_at' | 'updated_at'>>;

export type InsertDocument = Omit<Document, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDocument = Partial<Omit<Document, 'id' | 'professional_id' | 'created_at' | 'updated_at'>>;

export type InsertReport = Omit<Report, 'id' | 'created_at' | 'updated_at'>;
export type UpdateReport = Partial<Omit<Report, 'id' | 'document_id' | 'created_at' | 'updated_at'>>;

export type InsertQuoteItem = Omit<QuoteItem, 'id' | 'created_at'>;
