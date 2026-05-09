import { supabase, tables } from '@/lib/supabase';
import type {
  InsertCustomer,
  InsertDocument,
  InsertReport,
  Customer,
  Document,
  DocumentType,
  Report,
  PropertyType,
  Recommendation,
  ReportPhoto,
} from '@dohot/shared';
import type { WizardQuoteItem } from '@/context/WizardContext';

export interface CustomerFields {
  name: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment: string;
  floor: string;
}

function buildAddress(f: Pick<CustomerFields, 'street' | 'houseNumber' | 'apartment' | 'floor' | 'city'>): string {
  const line1 = [f.street, f.houseNumber].filter(Boolean).join(' ');
  const line2 = [f.apartment && `דירה ${f.apartment}`, f.floor && `קומה ${f.floor}`].filter(Boolean).join(', ');
  return [line1, line2, f.city].filter(Boolean).join(', ');
}

export async function upsertCustomer(
  professionalId: string,
  fields: CustomerFields,
): Promise<Customer> {
  const address = buildAddress(fields);

  const { data: existing } = await supabase
    .from(tables.customers)
    .select()
    .eq('professional_id', professionalId)
    .eq('name', fields.name)
    .maybeSingle();

  const payload = {
    professional_id: professionalId,
    name: fields.name,
    phone: fields.phone || null,
    email: fields.email || null,
    address: address || null,
    city: fields.city || null,
    street: fields.street || null,
    house_number: fields.houseNumber || null,
    apartment: fields.apartment || null,
    floor: fields.floor || null,
    type: 'private' as const,
    notes: null,
    last_contact_at: null,
  };

  if (existing) {
    const { data, error } = await supabase
      .from(tables.customers)
      .update(payload)
      .eq('id', (existing as Customer).id)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  }

  const { data, error } = await supabase
    .from(tables.customers)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
}

export async function searchCustomers(
  professionalId: string,
  query: string,
  limit = 5,
): Promise<Customer[]> {
  if (!query.trim()) return [];
  const { data } = await supabase
    .from(tables.customers)
    .select()
    .eq('professional_id', professionalId)
    .ilike('name', `%${query.trim()}%`)
    .order('last_contact_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as Customer[];
}

export async function createDraftDocument(
  professionalId: string,
  customerId: string,
  title: string,
  type: DocumentType = 'report',
): Promise<Document> {
  const row: InsertDocument = {
    professional_id: professionalId,
    customer_id: customerId,
    type,
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
  issueType: string;
  issueNote: string;
  photos: string[];
  voiceTranscript: string;
  aiSummary: string;
  recommendations: Recommendation[];
}

const ISSUE_TYPE_MAP: Record<string, InsertReport['issue_type']> = {
  // leak-related
  leak: 'leak', floor_leak: 'leak', sewage: 'leak', ac_leak: 'leak',
  // pipe-related
  pipe: 'pipe', pipe_leak: 'pipe', pipe_burst: 'pipe', tap_drip: 'pipe',
  toilet: 'pipe', boiler: 'pipe', drainage: 'pipe', plumbing: 'pipe',
  // roof-related
  roof: 'roof', roof_leak: 'roof', roof_leak2: 'roof', crack: 'roof', tiles: 'roof',
  // moisture-related
  moisture: 'moisture', wall_moisture: 'moisture',
  // waterproofing-related
  waterproofing: 'waterproofing', basement: 'waterproofing', bathroom: 'waterproofing',
  balcony: 'waterproofing', pool: 'waterproofing', flat_roof: 'waterproofing', membrane: 'waterproofing',
};

function toDbIssueType(issueType: string): InsertReport['issue_type'] {
  return ISSUE_TYPE_MAP[issueType] ?? 'other';
}

export async function createReport(documentId: string, opts: ReportOpts): Promise<Report> {
  const photoUrls: ReportPhoto[] = opts.photos.map((uri) => ({ uri }));
  const visitDate = new Date().toISOString().substring(0, 10);

  const row: InsertReport = {
    document_id: documentId,
    visit_date: visitDate,
    property_type: opts.propertyType,
    issue_type: toDbIssueType(opts.issueType),
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
    issue_type: toDbIssueType(opts.issueType),
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

export async function upsertQuoteItems(
  documentId: string,
  items: WizardQuoteItem[],
  totalAmount: number,
): Promise<void> {
  // Delete existing items then re-insert
  await supabase.from(tables.quoteItems).delete().eq('document_id', documentId);

  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      document_id: documentId,
      title: item.title,
      description: item.description || null,
      qty: item.qty,
      unit_price: item.unitPrice,
      sort_order: i,
    }));
    const { error } = await supabase.from(tables.quoteItems).insert(rows);
    if (error) throw error;
  }

  // Store total on the document row
  await supabase
    .from(tables.documents)
    .update({ amount: totalAmount })
    .eq('id', documentId);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const { error } = await supabase
    .from(tables.customers)
    .delete()
    .eq('id', customerId);
  if (error) throw error;
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
