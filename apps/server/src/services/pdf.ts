import puppeteer from 'puppeteer';
import { supabaseAdmin } from '../lib/supabase';
import type {
  BusinessProfile,
  Certification,
  Customer,
  Document,
  Report,
  Recommendation,
} from '@dohot/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PdfData {
  document: Document;
  report: Report;
  customer: Customer;
  businessProfile: BusinessProfile;
}

// ── Private-bucket helpers ────────────────────────────────────────────────────

/**
 * Extracts the storage path from either a public or signed Supabase storage URL.
 * Public:  .../object/public/<bucket>/<path>
 * Signed:  .../object/sign/<bucket>/<path>?token=...
 */
function pathFromStorageUrl(url: string, bucket: string): string {
  for (const variant of [`/object/public/${bucket}/`, `/object/sign/${bucket}/`]) {
    const idx = url.indexOf(variant);
    if (idx !== -1) return decodeURIComponent(url.slice(idx + variant.length).split('?')[0] ?? '');
  }
  return '';
}

/**
 * Downloads a file from a private Supabase bucket via the admin client and
 * returns it as a base64 data URI. Used to embed private assets (signatures,
 * cert images) directly in Puppeteer HTML so no unauthenticated fetch is needed.
 */
async function privateUrlToDataUri(url: string, bucket: string): Promise<string | null> {
  const path = pathFromStorageUrl(url, bucket);
  if (!path) return null;
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    const mimeType = data.type || 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

// ── Data fetching ─────────────────────────────────────────────────────────────

export async function fetchDocumentData(
  documentId: string,
  userId: string,
): Promise<PdfData> {
  const { data: doc } = await supabaseAdmin
    .from('documents')
    .select()
    .eq('id', documentId)
    .eq('professional_id', userId)
    .single();

  if (!doc) {
    const err = Object.assign(new Error('Document not found'), { status: 404 });
    throw err;
  }

  const { data: report } = await supabaseAdmin
    .from('reports')
    .select()
    .eq('document_id', documentId)
    .single();

  if (!report) {
    const err = Object.assign(new Error('Report not found'), { status: 404 });
    throw err;
  }

  const { data: customer } = doc.customer_id
    ? await supabaseAdmin.from('customers').select().eq('id', doc.customer_id).single()
    : { data: null };

  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select()
    .eq('id', userId)
    .single();

  if (!profile) {
    const err = Object.assign(new Error('Business profile not found'), { status: 404 });
    throw err;
  }

  // Convert private-bucket URLs to data URIs so Puppeteer can embed them
  // without making unauthenticated requests to the now-private buckets.
  const bp = profile as BusinessProfile;

  if (bp.signature_url) {
    const dataUri = await privateUrlToDataUri(bp.signature_url, 'signatures');
    if (dataUri) bp.signature_url = dataUri;
  }

  if (Array.isArray(bp.certifications)) {
    bp.certifications = await Promise.all(
      bp.certifications.map(async (cert) => {
        if (!cert.image_url) return cert;
        const dataUri = await privateUrlToDataUri(cert.image_url, 'cert-images');
        return dataUri ? { ...cert, image_url: dataUri } : cert;
      }),
    );
  }

  return {
    document: doc as Document,
    report: report as Report,
    customer: (customer ?? {
      id: '',
      name: 'לא צוין',
      phone: null,
      address: null,
      type: 'private',
    }) as Customer,
    businessProfile: bp,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ISSUE_LABELS: Record<string, string> = {
  leak: 'גילוי נזילה',
  waterproofing: 'איטום',
  pipe: 'בעיית צנרת',
  roof: 'נזק גג',
  moisture: 'עובש ולחות',
  other: 'בדיקה כללית',
};

const PROPERTY_LABELS: Record<string, string> = {
  apartment: 'דירה',
  house: 'בית פרטי',
  building: 'בניין',
  commercial: 'מסחרי',
  office: 'משרד',
  other: 'אחר',
};

const PROFESSION_LABELS: Record<string, string> = {
  leak_detection: 'גלאי נזילות מוסמך',
  plumber: 'אינסטלטור מוסמך',
  electrician: 'חשמלאי מוסמך',
  renovation: 'קבלן שיפוצים',
  roofing: 'קבלן גגות',
  other: 'איש מקצוע מוסמך',
};

function priorityClass(p: string): string {
  if (p === 'מיידי') return 'pri-immediate';
  if (p === 'תוך 48 שעות') return 'pri-48h';
  if (p === 'עד שבועיים') return 'pri-2weeks';
  return 'pri-default';
}

// ── HTML template ─────────────────────────────────────────────────────────────

export function buildHtml(data: PdfData): string {
  const { document: doc, report, customer, businessProfile: bp } = data;

  const issueLabel = ISSUE_LABELS[report.issue_type ?? ''] ?? 'בדיקה';
  const propertyLabel = PROPERTY_LABELS[report.property_type ?? ''] ?? 'נכס';
  const docTitle = `דוח ${issueLabel}`;
  const docRef = doc.doc_number ?? `DOC-${doc.id.substring(0, 8).toUpperCase()}`;
  const docDate = formatDate(doc.created_at);
  const visitDate = formatDate(report.visit_date);
  const professionLabel = PROFESSION_LABELS[bp.profession] ?? 'איש מקצוע';

  const brandMark = bp.logo_url
    ? `<img src="${esc(bp.logo_url)}" alt="לוגו" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<span class="brand-initial">${esc((bp.business_name || bp.full_name).charAt(0))}</span>`;

  const sigBlock = bp.signature_url
    ? `<img src="${esc(bp.signature_url)}" class="sig-img" alt="חתימה" />`
    : `<div class="sig-line"></div>`;

  const photos = (report.photo_urls ?? []) as Array<{ uri: string; label?: string }>;
  const photosSection = photos.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-num" style="font-size:13px;">📷</div>
        <div class="section-title">תיעוד חזותי</div>
      </div>
      <div class="photos-grid">
        ${photos.slice(0, 6).map((p, i) => `
          <div class="photo-item">
            <img src="${esc(p.uri)}" alt="תמונה ${i + 1}" />
            <div class="photo-label">${esc(p.label ?? String(i + 1))}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const recs = (report.recommendations ?? []) as Recommendation[];
  const recsSection = recs.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-num">2</div>
        <div class="section-title">המלצות לטיפול</div>
      </div>
      <div class="recs-list">
        ${recs.map((rec, i) => {
          const cls = priorityClass(rec.priority);
          return `
          <div class="rec-item ${cls}">
            <div class="rec-num-badge">${i + 1}</div>
            <div class="rec-content">
              <span class="rec-priority-badge">${esc(rec.priority)}</span>
              <div class="rec-title">${esc(rec.title)}</div>
              <div class="rec-desc">${esc(rec.description)}</div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  const noteSection = report.issue_note ? `
    <div class="section">
      <div class="section-header">
        <div class="section-num" style="background:#5A5248;">✦</div>
        <div class="section-title">הערות נוספות</div>
      </div>
      <div class="findings-body" style="border-right-color:#9E9690;background:#F7F5F0;">
        ${esc(report.issue_note)}
      </div>
    </div>
  ` : '';

  const certs = (bp.certifications ?? []) as Certification[];
  const certsSection = (bp.certifications_note || certs.length > 0) ? `
    <div class="dis-section">
      <div class="dis-section-title"><span class="dis-dot"></span>הסמכות ואישורים מקצועיים</div>
      ${bp.certifications_note ? `<div class="certs-note">${esc(bp.certifications_note)}</div>` : ''}
      ${certs.length > 0 ? `
      <div class="certs-list">
        ${certs.map(c => `
          <div class="cert-row">
            ${c.image_url ? `<img class="cert-thumb" src="${esc(c.image_url)}" alt="${esc(c.name)}" />` : ''}
            <div class="cert-info">
              <div class="cert-name">${esc(c.name)}</div>
              <div class="cert-year">${esc(c.year)}</div>
            </div>
          </div>
        `).join('')}
      </div>` : ''}
    </div>
  ` : '';

  const disclaimer = bp.default_disclaimer ||
    'דוח זה נערך בהתבסס על הממצאים שנצפו בעת הביקור בלבד. הבודק אינו אחראי לנזקים נסתרים, לשינויים שחלו לאחר מועד הביקור, או לנזקים שאינם קשורים לסוג הבדיקה שבוצעה. ממצאי הדוח מתייחסים לנסיבות שנצפו בזמן הביקור ועלולים להשתנות עם הזמן.';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }

  body {
    font-family: 'Rubik', 'Arial Hebrew', Arial, sans-serif;
    direction: rtl;
    text-align: right;
    color: #1B1916;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ─ Page shell ─ */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 0 18mm 22mm;
    position: relative;
    background: #fff;
  }
  .page + .page { page-break-before: always; }

  /* ─ Accent bar ─ */
  .accent-bar {
    height: 5px;
    background: linear-gradient(to left, #1B1916 0%, #5A8770 100%);
    margin: 0 -18mm 20px;
  }

  /* ─ Header ─ */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 15px;
    border-bottom: 2px solid #1B1916;
    margin-bottom: 22px;
  }
  .doc-title {
    font-size: 24pt;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: #1B1916;
    line-height: 1.15;
  }
  .doc-ref {
    font-size: 8pt;
    color: #807A72;
    margin-top: 6px;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.3px;
  }
  .brand-block {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    min-width: 110px;
  }
  .brand-mark {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: #1B1916;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 7px;
  }
  .brand-initial {
    color: #F7F5F0;
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
  }
  .brand-name {
    font-size: 9pt;
    font-weight: 600;
    color: #1B1916;
  }
  .brand-license {
    font-size: 7.5pt;
    color: #807A72;
  }

  /* ─ Info strip ─ */
  .info-strip {
    display: flex;
    background: #F7F5F0;
    border-radius: 11px;
    padding: 15px 17px;
    margin-bottom: 26px;
    gap: 0;
  }
  .info-col {
    flex: 1;
    padding-left: 14px;
  }
  .info-col + .info-col {
    padding-right: 14px;
    padding-left: 0;
    border-right: 1px solid #E0DDD6;
  }
  .info-col:last-child { padding-left: 0; }
  .info-label {
    font-size: 6.5pt;
    color: #9E9690;
    text-transform: uppercase;
    letter-spacing: 0.9px;
    font-weight: 700;
    margin-bottom: 5px;
  }
  .info-value {
    font-size: 10.5pt;
    font-weight: 600;
    color: #1B1916;
    line-height: 1.3;
  }
  .info-sub {
    font-size: 8.5pt;
    color: #5A5248;
    margin-top: 2px;
  }

  /* ─ Sections ─ */
  .section { margin-bottom: 22px; }
  .section-header {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 10px;
  }
  .section-num {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: #1B1916;
    color: #F7F5F0;
    font-size: 10pt;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 13pt;
    font-weight: 600;
    color: #1B1916;
    letter-spacing: -0.3px;
  }
  .findings-body {
    font-size: 10pt;
    line-height: 1.8;
    color: #1B1916;
    background: #FAFAF8;
    border-radius: 9px;
    padding: 15px 17px;
    border-right: 3px solid #1B1916;
  }

  /* ─ Photos ─ */
  .photos-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .photo-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #F0EDE7;
  }
  .photo-item img {
    width: 100%;
    height: 55mm;
    object-fit: cover;
    display: block;
  }
  .photo-label {
    position: absolute;
    bottom: 5px;
    right: 6px;
    font-size: 7pt;
    color: #fff;
    background: rgba(27, 25, 22, 0.6);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  /* ─ Recommendations ─ */
  .recs-list { display: flex; flex-direction: column; gap: 8px; }
  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 11px;
    border: 1px solid #E8E5DF;
  }
  .rec-num-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10pt;
    font-weight: 700;
    flex-shrink: 0;
  }
  .rec-content { flex: 1; }
  .rec-priority-badge {
    display: inline-block;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 5px;
    margin-bottom: 5px;
  }
  .rec-title {
    display: block;
    font-size: 10.5pt;
    font-weight: 600;
    color: #1B1916;
    margin-bottom: 3px;
  }
  .rec-desc {
    font-size: 9pt;
    color: #5A5248;
    line-height: 1.55;
  }

  /* Priority colours */
  .pri-immediate { background: #FFFBFB; }
  .pri-immediate .rec-num-badge { background: #FDECEA; color: #B71C1C; }
  .pri-immediate .rec-priority-badge { background: #FDECEA; color: #B71C1C; }

  .pri-48h { background: #FFFDF8; }
  .pri-48h .rec-num-badge { background: #FFF3E0; color: #E65100; }
  .pri-48h .rec-priority-badge { background: #FFF3E0; color: #E65100; }

  .pri-2weeks { background: #FAFCFB; }
  .pri-2weeks .rec-num-badge { background: #E5EDE7; color: #2E7D4F; }
  .pri-2weeks .rec-priority-badge { background: #E5EDE7; color: #2E7D4F; }

  .pri-default { background: #FAFAF8; }
  .pri-default .rec-num-badge { background: #F0EDE7; color: #5A5248; }
  .pri-default .rec-priority-badge { background: #F0EDE7; color: #5A5248; }

  /* ─ Signature ─ */
  .sig-block {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 18px;
    border-top: 1px solid #C7C1B6;
    margin-top: 30px;
  }
  .sig-img {
    max-width: 130px;
    max-height: 55px;
    object-fit: contain;
    display: block;
    margin-bottom: 5px;
  }
  .sig-line {
    width: 130px;
    height: 1px;
    background: #C7C1B6;
    margin-bottom: 5px;
  }
  .sig-name { font-size: 8.5pt; color: #807A72; }
  .sig-date-label { font-size: 7pt; color: #9E9690; margin-bottom: 3px; }
  .sig-date { font-size: 9pt; color: #1B1916; font-weight: 500; }

  /* ─ Page footer ─ */
  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #9E9690;
    border-top: 0.5px solid #E0DDD6;
    padding-top: 8px;
    margin-top: 22px;
  }

  /* ─ Disclaimer page ─ */
  .disclaimer-page { background: #F7F5F0; }
  .disclaimer-page .accent-bar {
    background: linear-gradient(to left, #1B1916 0%, #5A5248 100%);
  }
  .disclaimer-title {
    font-size: 20pt;
    font-weight: 600;
    color: #1B1916;
    padding-bottom: 15px;
    border-bottom: 2px solid #1B1916;
    margin-bottom: 26px;
    letter-spacing: -0.4px;
  }
  .disclaimer-intro {
    font-size: 10pt;
    color: #4A4641;
    line-height: 1.85;
    margin-bottom: 26px;
    padding: 16px 18px;
    background: #fff;
    border-radius: 11px;
    border-right: 3px solid #5A8770;
  }
  .dis-section { margin-bottom: 20px; }
  .dis-section-title {
    font-size: 10.5pt;
    font-weight: 600;
    color: #1B1916;
    margin-bottom: 7px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dis-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #1B1916;
    flex-shrink: 0;
    display: inline-block;
  }
  .dis-body {
    font-size: 9pt;
    color: #4A4641;
    line-height: 1.8;
  }
  .disclaimer-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 18px;
    border-top: 1px solid #C7C1B6;
    margin-top: 36px;
  }
  .dis-brand { font-size: 9pt; font-weight: 600; color: #1B1916; }
  .dis-brand-sub { font-size: 7.5pt; color: #807A72; margin-top: 2px; }
  .dis-generated { font-size: 7.5pt; color: #9E9690; direction: ltr; text-align: left; }

  /* ─ Certifications section (page 2) ─ */
  .certs-note {
    font-size: 9pt;
    color: #4A4641;
    line-height: 1.8;
    margin-bottom: 14px;
  }
  .certs-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cert-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border-radius: 9px;
    padding: 10px 12px;
    border: 1px solid #E0DDD6;
  }
  .cert-thumb {
    width: 52px;
    height: 52px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
    border: 1px solid #E0DDD6;
  }
  .cert-info { flex: 1; }
  .cert-name { font-size: 10pt; font-weight: 600; color: #1B1916; }
  .cert-year { font-size: 8.5pt; color: #807A72; margin-top: 2px; }
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════ -->
<!--  PAGE 1 — Main Report                         -->
<!-- ══════════════════════════════════════════════ -->
<div class="page">
  <div class="accent-bar"></div>

  <div class="doc-header">
    <div>
      <div class="doc-title">${esc(docTitle)}</div>
      <div class="doc-ref">${esc(docRef)} &nbsp;·&nbsp; ${esc(docDate)}</div>
    </div>
    <div class="brand-block">
      <div class="brand-mark">${brandMark}</div>
      <div class="brand-name">${esc(bp.business_name || bp.full_name)}</div>
      ${bp.license_number ? `<div class="brand-license">ח.פ ${esc(bp.license_number)}</div>` : ''}
    </div>
  </div>

  <div class="info-strip">
    <div class="info-col">
      <div class="info-label">לקוח</div>
      <div class="info-value">${esc(customer.name)}</div>
      ${customer.phone ? `<div class="info-sub">${esc(customer.phone)}</div>` : ''}
    </div>
    <div class="info-col">
      <div class="info-label">נכס</div>
      <div class="info-value">${esc(customer.address || 'לא צוין')}</div>
      <div class="info-sub">${esc(propertyLabel)}</div>
    </div>
    <div class="info-col">
      <div class="info-label">תאריך ביקור</div>
      <div class="info-value">${esc(visitDate)}</div>
      <div class="info-sub">${esc(issueLabel)}</div>
    </div>
    <div class="info-col">
      <div class="info-label">בודק מקצועי</div>
      <div class="info-value">${esc(bp.full_name)}</div>
      ${bp.phone ? `<div class="info-sub">${esc(bp.phone)}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">1</div>
      <div class="section-title">ממצאי הביקור</div>
    </div>
    <div class="findings-body">
      ${esc(report.findings_summary || report.voice_transcript || 'לא תועדו ממצאים')}
    </div>
  </div>

  ${noteSection}
  ${photosSection}
  ${recsSection}

  <div class="sig-block">
    <div>
      ${sigBlock}
      <div class="sig-name">${esc(bp.full_name)} · ${esc(professionLabel)}</div>
    </div>
    <div>
      <div class="sig-date-label">תאריך:</div>
      <div class="sig-date">${esc(docDate)}</div>
    </div>
  </div>

  <div class="page-footer">
    <span>${esc(bp.business_name || bp.full_name)}</span>
    <span>עמוד 1</span>
  </div>
</div>

<!-- ══════════════════════════════════════════════ -->
<!--  PAGE 2 — Legal Disclaimer                    -->
<!-- ══════════════════════════════════════════════ -->
<div class="page disclaimer-page">
  <div class="accent-bar"></div>

  <div class="disclaimer-title">הצהרת אחריות ותנאי הדוח</div>

  <div class="disclaimer-intro">${esc(disclaimer)}</div>

  <div class="dis-section">
    <div class="dis-section-title"><span class="dis-dot"></span>מגבלות הדוח</div>
    <div class="dis-body">הדוח מתבסס על הממצאים שנצפו במהלך הביקור המקצועי בלבד. הבודק לא ביצע פירוק מבנים, פתיחת קירות או בדיקות הרסניות, אלא אם נדרש ואושר מפורשות על ידי הלקוח. ממצאים נסתרים שאינם נגישים לבדיקה חזותית, אינסטרומנטלית או בלתי-הרסנית אינם כלולים בדוח זה.</div>
  </div>

  <div class="dis-section">
    <div class="dis-section-title"><span class="dis-dot"></span>המלצות</div>
    <div class="dis-body">המלצות הדוח נועדו להכוות את בעל הנכס ובאי כוחו בקבלת החלטות. הן אינן מהוות מפרט הנדסי מחייב. כל עבודת תיקון תבוצע על ידי גורם מקצועי מוסמך בהתאם לממצאים שייחשפו בפועל.</div>
  </div>

  <div class="dis-section">
    <div class="dis-section-title"><span class="dis-dot"></span>תוקף הדוח</div>
    <div class="dis-body">ממצאי הדוח משקפים את מצב הנכס ביום הביקור בלבד. שינויים שחלו לאחר מועד זה אינם כלולים. תוקף הדוח הוא 90 יום ממועד הביקור, אלא אם כן נקבע אחרת בכתב.</div>
  </div>

  <div class="dis-section">
    <div class="dis-section-title"><span class="dis-dot"></span>פרטיות ועיבוד מידע</div>
    <div class="dis-body">פרטי הלקוח ומידע הנכס הכלולים בדוח זה מוגנים בהתאם לחוק הגנת הפרטיות התשמ"א-1981. המידע משמש אך ורק לצורך עריכת הדוח ולא יועבר לצד שלישי ללא הסכמת הלקוח.</div>
  </div>

  ${certsSection}

  <div class="disclaimer-footer">
    <div>
      <div class="dis-brand">${esc(bp.business_name || bp.full_name)}</div>
      ${bp.license_number ? `<div class="dis-brand-sub">ח.פ ${esc(bp.license_number)}</div>` : ''}
      ${bp.phone ? `<div class="dis-brand-sub">${esc(bp.phone)}</div>` : ''}
    </div>
    <div class="dis-generated">
      <div>מסמך: ${esc(docRef)}</div>
      <div>תאריך: ${esc(docDate)}</div>
      <div style="margin-top:3px;opacity:0.55;">Powered by Dohot</div>
    </div>
  </div>

  <div class="page-footer">
    <span>${esc(bp.business_name || bp.full_name)}</span>
    <span>עמוד 2</span>
  </div>
</div>

</body>
</html>`;
}

// ── Puppeteer render ──────────────────────────────────────────────────────────

async function launchBrowser() {
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
}

export async function renderPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30_000 });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates a PDF from a base64-encoded image capture of the mobile preview screen.
 * The image is embedded in A4-width HTML so the rendered PDF is pixel-for-pixel
 * identical to the React Native preview — no separate template involved.
 *
 * @param imageBase64 - raw base64 string (no data-uri prefix)
 * @param mimeType    - 'image/jpeg' or 'image/png'
 */
export async function renderPdfFromImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Buffer> {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  // Minimal HTML: the image fills A4 width and flows naturally across A4 pages.
  // Puppeteer paginates the content at 297mm boundaries automatically.
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  img { width: 210mm; height: auto; display: block; }
</style>
</head>
<body>
<img src="${dataUri}" />
</body>
</html>`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    // A4 viewport: 794px wide at 96dpi
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates a multi-page PDF from an array of base64 images.
 * Each image becomes exactly one A4 page — no mid-image slicing.
 */
export async function renderPdfFromImages(
  images: string[],
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Buffer> {
  const pages = images
    .map((img) => `<div class="page"><img src="data:${mimeType};base64,${img}" /></div>`)
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page {
    width: 210mm;
    page-break-after: always;
    display: block;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }
  img { width: 210mm; height: auto; display: block; }
</style>
</head>
<body>${pages}</body>
</html>`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

// ── Storage upload ────────────────────────────────────────────────────────────

export async function uploadPdf(
  pdfBuffer: Buffer,
  userId: string,
  documentId: string,
): Promise<string> {
  const path = `${userId}/${documentId}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('pdf-documents')
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from('pdf-documents')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10-year signed URL

  if (signErr || !signed) throw new Error('Failed to create signed URL');
  return signed.signedUrl;
}

// ── Persist URL in DB ─────────────────────────────────────────────────────────

export async function savePdfUrl(documentId: string, userId: string, url: string): Promise<void> {
  await supabaseAdmin
    .from('documents')
    .update({ pdf_url: url })
    .eq('id', documentId)
    .eq('professional_id', userId);
}
