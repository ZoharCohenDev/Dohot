import { supabase, tables } from '@/lib/supabase';
import type {
  InsertCustomer,
  InsertDocument,
  InsertReport,
  Customer,
  Document,
  Report,
  PropertyType,
  IssueType,
  Recommendation,
  ReportPhoto,
} from '@dohot/shared';

export async function upsertCustomer(
  professionalId: string,
  name: string,
  phone: string,
  address: string,
): Promise<Customer> {
  const { data: existing } = await supabase
    .from(tables.customers)
    .select()
    .eq('professional_id', professionalId)
    .eq('name', name)
    .maybeSingle();

  if (existing) return existing as Customer;

  const row: InsertCustomer = {
    professional_id: professionalId,
    name,
    phone: phone || null,
    address: address || null,
    type: 'private',
    notes: null,
    last_contact_at: null,
  };

  const { data, error } = await supabase
    .from(tables.customers)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function createDraftDocument(
  professionalId: string,
  customerId: string,
  title: string,
): Promise<Document> {
  const row: InsertDocument = {
    professional_id: professionalId,
    customer_id: customerId,
    type: 'report',
    title,
    status: 'draft',
    doc_number: null,
    amount: null,
    pdf_url: null,
    sent_at: null,
  };

  const { data, error } = await supabase
    .from(tables.documents)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

interface ReportOpts {
  propertyType: PropertyType;
  issueType: IssueType;
  issueNote: string;
  photos: string[];
  voiceTranscript: string;
  aiSummary: string;
  recommendations: Recommendation[];
}

export async function createReport(documentId: string, opts: ReportOpts): Promise<Report> {
  const photoUrls: ReportPhoto[] = opts.photos.map((uri) => ({ uri }));
  const visitDate = new Date().toISOString().substring(0, 10);

  const row: InsertReport = {
    document_id: documentId,
    visit_date: visitDate,
    property_type: opts.propertyType,
    issue_type: opts.issueType,
    issue_note: opts.issueNote || null,
    findings_summary: opts.aiSummary || opts.voiceTranscript || null,
    voice_transcript: opts.voiceTranscript || null,
    photo_urls: photoUrls,
    recommendations: opts.recommendations,
  };

  const { data, error } = await supabase
    .from(tables.reports)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

export async function upsertReport(documentId: string, opts: ReportOpts): Promise<Report> {
  const photoUrls: ReportPhoto[] = opts.photos.map((uri) => ({ uri }));
  const visitDate = new Date().toISOString().substring(0, 10);

  const { data: existing } = await supabase
    .from(tables.reports)
    .select('id')
    .eq('document_id', documentId)
    .maybeSingle();

  const reportData = {
    visit_date: visitDate,
    property_type: opts.propertyType,
    issue_type: opts.issueType,
    issue_note: opts.issueNote || null,
    findings_summary: opts.aiSummary || opts.voiceTranscript || null,
    voice_transcript: opts.voiceTranscript || null,
    photo_urls: photoUrls,
    recommendations: opts.recommendations,
  };

  if (existing) {
    const { data, error } = await supabase
      .from(tables.reports)
      .update(reportData)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as Report;
  }

  const { data, error } = await supabase
    .from(tables.reports)
    .insert({ document_id: documentId, ...reportData })
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

const SERVER_URL = (process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000').replace(/\/$/, '');

export async function generateDocumentPdf(documentId: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('לא מחובר — יש להתחבר מחדש');

  const response = await fetch(`${SERVER_URL}/api/documents/${documentId}/generate-pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? `Server error ${response.status}`);
  }

  const result = await response.json() as { url: string };
  return result.url;
}
