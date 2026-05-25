import React from 'react';
import {
  View, Text as RNText, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, Image, useWindowDimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { Header, FixedBottom } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard, type WizardQuoteItem, type WaWorkItem } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import { generatePdfFromCapture } from '@/services/documents';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import type { Recommendation, Certification } from '@dohot/shared';

// Scoped Text that ignores OS accessibility font scale — keeps PDF captures
// identical across all devices. All Text in this file uses this wrapper.
// The rest of the app is unaffected.
function Text(props: React.ComponentProps<typeof RNText>): React.ReactElement {
  return <RNText {...props} allowFontScaling={false} />;
}

// ─── A4 page layout constants ────────────────────────────────────────────────
// These match the StyleSheet values below so that cert-page splitting math is
// consistent with the rendered output.
const A4_RATIO = 297 / 210; // height / width
const SCROLL_H_INSET = 18; // paddingHorizontal of the ScrollView content container
const PAGE_PAD = 28; // pdfPage padding (all sides)

// Estimated component heights used only for cert-page splitting (not rendered sizes).
const EST_HEADER_H = 92; // PdfPageHeader: brand block + paddingBottom(14) + border + marginBottom(16)
const EST_SECTION_TITLE_H = 30; // SectionTitle: label lineHeight(~18) + marginBottom(8) ≈ 30
const EST_SECTION_MARGIN_H = 12; // pdfSection marginBottom
const EST_CERT_NOTE_H = 50; // certifications_note ~3 lines of pdfBody text + marginBottom(8)
const EST_CERT_ROW_H = 113; // certRow: paddingVertical(8+8) + certImage height(96) + borderBottom(1)

// Quote splitting
const EST_QUOTE_ITEM_H = 46; // quoteItem paddingVertical(7+7) + header row(~25) + 1-line desc(~12) avg
const EST_QUOTE_FOOTER_H = 255; // quoteTotals(~75) + quoteNotes(opt ~50) + validity(~35) + sigRow(~95)

// Work-agreement details page splitting
const EST_WA_ITEM_H = 28; // waItemRow height (badge + title text ≈ 22) + gap(8) ≈ 28 (no clauses)
const EST_WA_CLAUSE_H = 18; // each waClauseRow: fontSize 8, lineHeight 12, paddingRight 20 ≈ 18
const EST_WA_FOOTER_H = 180; // totalBox section(~85) + payment terms section(~95 for 2 terms)

// Issue (report) page splitting
const EST_ISSUE_PHOTOS_ROW_H = 92;         // pdfImage(80) + label(~9) + label margin + gap overhead ≈ 92 per 2-col row
const EST_ISSUE_PHOTOS_MARGIN_H = 10;      // { marginTop: 10 } on the photo grid
const EST_ISSUE_DESC_CHARS_PER_LINE = 48;  // pdfBody fontSize 9 — ~48 Hebrew chars per line
const EST_ISSUE_DESC_LINE_H = 14;          // pdfBody lineHeight: 14
const EST_ISSUE_REC_SECTION_MARGIN_H = 10; // { marginTop: 10 } on the recs container
const EST_ISSUE_REC_PADDING_V = 10;        // pdfRecRow paddingVertical: 5 × 2
const EST_ISSUE_REC_TITLE_H = 11;          // pdfRecTitle fontSize 8, one line ≈ 11px
const EST_ISSUE_REC_DESC_CHARS_PER_LINE = 50;
const EST_ISSUE_REC_DESC_LINE_H = 12;      // pdfRecDesc fontSize 7.5, lineHeight ≈ 12

// ─── Page-group builders (pure functions, no component state) ─────────────────

/**
 * Splits quote items into A4 page groups.
 * The last group always renders totals + sig (showTotals=true).
 * All earlier groups are items-only (showTotals=false).
 */
function buildQuoteGroups(items: WizardQuoteItem[], pageHeight: number): WizardQuoteItem[][] {
  if (items.length === 0) return [[]]; // one page (footer only)

  const bodyH = pageHeight - PAGE_PAD * 2 - EST_HEADER_H;
  const totalNeeded =
    EST_SECTION_TITLE_H + EST_SECTION_MARGIN_H +
    items.length * EST_QUOTE_ITEM_H +
    EST_QUOTE_FOOTER_H;

  if (totalNeeded <= bodyH) return [items]; // everything fits on one page

  // Greedy forward pass: flush when remaining items + footer fit in leftover space.
  const groups: WizardQuoteItem[][] = [];
  let currentGroup: WizardQuoteItem[] = [];
  let usedH = EST_SECTION_TITLE_H + EST_SECTION_MARGIN_H; // first page has title overhead

  for (let i = 0; i < items.length; i++) {
    const remainingItems = items.slice(i);
    const remainingH = remainingItems.length * EST_QUOTE_ITEM_H;

    // Can we fit remaining items + footer on the current page?
    if (usedH + remainingH + EST_QUOTE_FOOTER_H <= bodyH) {
      groups.push([...currentGroup, ...remainingItems]);
      return groups;
    }

    // Does this item overflow the current page?
    if (usedH + EST_QUOTE_ITEM_H > bodyH && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
      usedH = 0; // subsequent pages have no section-title overhead
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    currentGroup.push(items[i]!);
    usedH += EST_QUOTE_ITEM_H;
  }

  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

/**
 * Splits WaWorkItems into A4 page groups.
 * The last group always renders total-price + payment-terms (showFooter=true).
 */
function buildWaDetailGroups(
  items: WaWorkItem[],
  paymentTermCount: number,
  pageHeight: number,
): WaWorkItem[][] {
  const filled = items.filter(i => i.title.trim());
  if (filled.length === 0) return [[]]; // one page (footer only)

  const bodyH = pageHeight - PAGE_PAD * 2 - EST_HEADER_H;
  const footerH = EST_WA_FOOTER_H + paymentTermCount * EST_WA_CLAUSE_H;

  function itemH(item: WaWorkItem) {
    return EST_WA_ITEM_H + item.clauses.filter(c => c.text.trim()).length * EST_WA_CLAUSE_H;
  }

  const totalItemsH = filled.reduce((s, i) => s + itemH(i), 0);
  const totalNeeded =
    EST_SECTION_TITLE_H + EST_SECTION_MARGIN_H + totalItemsH + footerH;

  if (totalNeeded <= bodyH) return [filled]; // everything fits

  // Greedy forward pass
  const groups: WaWorkItem[][] = [];
  let currentGroup: WaWorkItem[] = [];
  let usedH = EST_SECTION_TITLE_H + EST_SECTION_MARGIN_H;

  for (let i = 0; i < filled.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const item = filled[i]!;
    const h = itemH(item);
    const remainingItems = filled.slice(i);
    const remainingH = remainingItems.reduce((s, x) => s + itemH(x), 0);

    if (usedH + remainingH + footerH <= bodyH) {
      groups.push([...currentGroup, ...remainingItems]);
      return groups;
    }

    if (usedH + h > bodyH && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
      usedH = 0;
    }

    currentGroup.push(item);
    usedH += h;
  }

  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

interface PdfPreviewScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onSend?: () => void;
}

type BusinessProfile = ReturnType<typeof useAuth>['businessProfile'];
type WizardState = ReturnType<typeof useWizard>['state'];
type ReportIssue = WizardState['reportIssues'][number];

// ─── Issue page-splitting helpers ─────────────────────────────────────────────

interface IssuePageGroup {
  /** True only on the first page of an issue: renders title + description + photos. */
  showMainContent: boolean;
  /** Subset of recommendations to render on this page. */
  recs: Recommendation[];
}

/** Usable content height inside one A4 page card (below the repeated header). */
function getAvailablePageHeight(pageH: number): number {
  return pageH - PAGE_PAD * 2 - EST_HEADER_H;
}

/** Estimates rendered height of a pdfBody text block from its character count. */
function estimateDescHeight(text: string): number {
  if (!text) return 0;
  const lines = Math.max(1, Math.ceil(text.length / EST_ISSUE_DESC_CHARS_PER_LINE));
  return lines * EST_ISSUE_DESC_LINE_H;
}

/** Estimates rendered height of the 2-column photo grid (capped at 4 photos). */
function estimatePhotosHeight(photoCount: number): number {
  if (photoCount === 0) return 0;
  const rows = Math.ceil(Math.min(photoCount, 4) / 2);
  // marginTop(10) + rows × rowH + row-gaps(6 each) + grid marginBottom(12)
  return EST_ISSUE_PHOTOS_MARGIN_H + rows * EST_ISSUE_PHOTOS_ROW_H + (rows - 1) * 6 + 12;
}

/** Estimates rendered height of a single recommendation row. */
function estimateRecRowHeight(rec: Recommendation): number {
  const descLines = rec.description
    ? Math.max(1, Math.ceil(rec.description.length / EST_ISSUE_REC_DESC_CHARS_PER_LINE))
    : 0;
  // paddingVertical + title + description lines + bottom border
  return EST_ISSUE_REC_PADDING_V + EST_ISSUE_REC_TITLE_H + descLines * EST_ISSUE_REC_DESC_LINE_H + 1;
}

/**
 * Splits a single report issue across as many A4 page groups as needed.
 * The first group always contains the section title + description + photos, plus
 * as many recommendations as fit in the remaining space.
 * Overflow recommendations are distributed across continuation page groups.
 */
function buildIssuePageGroups(issue: ReportIssue, pageHeight: number): IssuePageGroup[] {
  const recs = issue.recommendations;
  const bodyH = getAvailablePageHeight(pageHeight);

  // Space consumed by the non-recommendation content on the first page
  const descText = issue.aiSummary || issue.description || issue.issueNote || '';
  const mainContentH =
    EST_SECTION_TITLE_H +
    EST_SECTION_MARGIN_H +
    estimateDescHeight(descText) +
    estimatePhotosHeight(issue.photos.length);

  // Space left on page 1 for recommendations
  let page1Remaining = bodyH - mainContentH;
  if (recs.length > 0) page1Remaining -= EST_ISSUE_REC_SECTION_MARGIN_H;

  // Greedy fill for page 1
  const page1Recs: Recommendation[] = [];
  for (const rec of recs) {
    const h = estimateRecRowHeight(rec);
    if (page1Remaining - h < 0) break;
    page1Recs.push(rec);
    page1Remaining -= h;
  }

  const groups: IssuePageGroup[] = [{ showMainContent: true, recs: page1Recs }];

  // Distribute remaining recs across continuation pages
  let overflow = recs.slice(page1Recs.length);
  while (overflow.length > 0) {
    const contBodyH = getAvailablePageHeight(pageHeight);
    const contRecs: Recommendation[] = [];
    let contUsed = 0;
    for (const rec of overflow) {
      const h = estimateRecRowHeight(rec);
      if (contUsed + h > contBodyH && contRecs.length > 0) break;
      contRecs.push(rec);
      contUsed += h;
    }
    groups.push({ showMainContent: false, recs: contRecs });
    overflow = overflow.slice(contRecs.length);
  }

  return groups;
}

function formatDate(): string {
  return new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildAddress(state: {
  customerStreet: string; customerHouseNumber: string;
  customerCity: string; customerApartment: string; customerFloor: string;
}): string {
  const line1 = [state.customerStreet, state.customerHouseNumber].filter(Boolean).join(' ');
  const extra = [
    state.customerApartment ? `דירה ${state.customerApartment}` : '',
    state.customerFloor ? `קומה ${state.customerFloor}` : '',
  ].filter(Boolean).join(', ');
  return [line1, extra, state.customerCity].filter(Boolean).join(', ');
}

function propertyLabel(type: string): string {
  const map: Record<string, string> = {
    apartment: 'דירה', house: 'בית פרטי', building: 'בניין',
    commercial: 'מסחרי', office: 'משרד', other: 'אחר',
  };
  return map[type] ?? type;
}

// ─── PDF image preloading ─────────────────────────────────────────────────────

/**
 * Returns every remote image URL the current PDF will render, scoped to the
 * active docType and user profile. Data URIs and SVGs are excluded — they are
 * always available inline and never need network loading.
 */
function collectPdfImageUrls(
  state: WizardState,
  businessProfile: BusinessProfile,
): string[] {
  const urls: string[] = [];
  const add = (url: string | null | undefined) => {
    if (!url || url.startsWith('data:')) return;
    urls.push(url);
  };

  add(businessProfile?.logo_url);
  add(businessProfile?.signature_url);

  switch (state.docType) {
    case 'report':
      for (const cert of (businessProfile?.certifications ?? []) as Certification[]) {
        add(cert.image_url);
      }
      for (const issue of state.reportIssues) {
        issue.photos.slice(0, 4).forEach(add);
      }
      break;
    case 'warranty':
      (state.reportIssues[0]?.photos ?? []).slice(0, 4).forEach(add);
      break;
    // 'quote' and 'work-agreement' only use logo + signature (added above)
  }

  return urls;
}

interface PdfImagePreloadResult {
  imagesReady: boolean;
  loaded: number;
  total: number;
  failedUrls: string[];
  retry: () => void;
}

/**
 * Prefetches all required PDF images into the RN image cache so every <Image>
 * component renders instantly from cache before captureRef fires.
 * - `imagesReady` is true only when every URL settled without errors.
 * - `retry()` re-runs all prefetches (useful after a network failure).
 */
// Maximum time allowed for a single image to prefetch + decode.
// This is a fail-safe only — not the primary readiness mechanism.
const PREFETCH_TIMEOUT_MS = 25_000;

/**
 * Prefetches a single URL into the RN cache (network), then calls Image.getSize
 * which forces the image decoder to run and confirms the image is fully ready.
 * Races against a 25-second fail-safe timeout that produces an explicit failure
 * rather than leaving the UI stuck forever.
 */
function prefetchAndDecode(url: string): Promise<void> {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error(`timed out after ${PREFETCH_TIMEOUT_MS / 1000}s`)),
      PREFETCH_TIMEOUT_MS,
    );
  });

  const load = Image.prefetch(url).then(
    () =>
      new Promise<void>((resolve, reject) => {
        Image.getSize(url, () => resolve(), reject);
      }),
  );

  // clearTimeout is safe to call with undefined; it is also called on success
  // so the timer never fires after the image is ready.
  return Promise.race([load, timeout]).finally(() => clearTimeout(timerId));
}

function usePdfImagePreload(urls: string[]): PdfImagePreloadResult {
  const urlsKey = urls.join('\n');
  const [loaded, setLoaded] = React.useState(0);
  const [failedUrls, setFailedUrls] = React.useState<string[]>([]);
  const [retryToken, setRetryToken] = React.useState(0);

  React.useEffect(() => {
    if (urls.length === 0) {
      setLoaded(0);
      setFailedUrls([]);
      return;
    }
    setLoaded(0);
    setFailedUrls([]);
    let active = true;

    for (const url of urls) {
      prefetchAndDecode(url)
        .then(() => { if (active) setLoaded(n => n + 1); })
        .catch((err) => {
          if (!active) return;
          console.warn('[PDF] image load failed:', url, err instanceof Error ? err.message : String(err));
          setFailedUrls(prev => [...prev, url]);
          setLoaded(n => n + 1);
        });
    }
    return () => { active = false; };
    // retryToken intentionally re-runs the effect to retry all prefetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlsKey, retryToken]);

  const retry = React.useCallback(() => setRetryToken(t => t + 1), []);

  return {
    imagesReady: urls.length === 0 || (loaded >= urls.length && failedUrls.length === 0),
    loaded,
    total: urls.length,
    failedUrls,
    retry,
  };
}

// ─── Shared components ────────────────────────────────────────────────────────

function SectionTitle({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.pdfSectionTitle}>
      <View style={styles.pdfSectionLine} />
      <Text style={styles.pdfSectionLabel}>{`${num}. ${label}`}</Text>
    </View>
  );
}

// Full page header — reproduced on every page card
function PdfPageHeader({
  docTitle, brandInitial, businessProfile,
}: {
  docTitle: string;
  brandInitial: string;
  businessProfile: BusinessProfile;
}) {
  return (
    <View style={[styles.pdfHeader, { borderBottomColor: '#1B1916' }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pdfDocTitle}>{docTitle}</Text>
        <Text style={styles.pdfDocRef}>{formatDate()}</Text>
      </View>
      <View style={styles.pdfBrandSide}>
        {businessProfile?.logo_url ? (
          <Image
            source={{ uri: businessProfile.logo_url }}
            style={styles.pdfLogoImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.pdfBrandMark}>
            <Text style={styles.pdfBrandLetter}>{brandInitial}</Text>
          </View>
        )}
        <Text style={styles.pdfBrandName} numberOfLines={1}>
          {businessProfile?.business_name || businessProfile?.full_name || ''}
        </Text>
        {!!businessProfile?.license_number && (
          <Text style={styles.pdfTaxId}>{`ח.פ ${businessProfile.license_number}`}</Text>
        )}
      </View>
    </View>
  );
}

// Signature block at the bottom-right of every page
function PageSig({ businessProfile }: { businessProfile: BusinessProfile }) {
  const sigUrl = businessProfile?.signature_url;
  const sigName = [
    businessProfile?.full_name,
    businessProfile?.license_number && `ח.פ ${businessProfile.license_number}`,
  ].filter(Boolean).join(' · ');
  if (!sigUrl && !sigName) return null;

  const isSvg = !!sigUrl && sigUrl.startsWith('data:image/svg+xml;base64,');

  return (
    <View style={styles.pageSig}>
      {!!sigUrl && (
        isSvg ? (
          <SvgXml
            xml={atob(sigUrl.replace('data:image/svg+xml;base64,', ''))}
            width={90}
            height={32}
          />
        ) : (
          <Image source={{ uri: sigUrl }} style={styles.pageSigImage} resizeMode="contain" />
        )
      )}
      {!!sigName && <Text style={styles.pageSigName}>{sigName}</Text>}
    </View>
  );
}

// ─── Report page components (one per PDF page) ────────────────────────────────

const LEGAL_DISCLAIMER =
  'דוח זה הוכן על בסיס בדיקה ויזואלית ואינו מהווה חוות דעת הנדסית. ' +
  'הממצאים וההמלצות מבוססים על מצב הנכס במועד הביקור בלבד. ' +
  'הכותב אינו אחראי לנזקים שנגרמו לאחר מועד הביקור או לנזקים סמויים שלא ניתן היה לאתרם בבדיקה חיצונית. ' +
  'כל עבודת תיקון תבוצע לפי שיקול הבעלים ועל אחריותו.';

function ReportPage1({ state, businessProfile }: { state: WizardState; businessProfile: BusinessProfile }) {
  const address = buildAddress(state);
  const propType = propertyLabel(state.propertyType);
  const issues = state.reportIssues;

  return (
    <>
      <View style={styles.pdfSection}>
        <SectionTitle num={1} label="פרטי הלקוח" />
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaItemLabel}>לקוח</Text>
            <Text style={styles.metaItemValue}>{state.customerName || '—'}</Text>
          </View>
          {!!state.customerPhone && (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>טלפון</Text>
              <Text style={styles.metaItemValue}>{state.customerPhone}</Text>
            </View>
          )}
          {!!state.customerEmail && (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>אימייל</Text>
              <Text style={styles.metaItemValue}>{state.customerEmail}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaItemLabel}>נכס</Text>
            <Text style={styles.metaItemValue}>{address || '—'} · {propType}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaItemLabel}>תאריך ביקור</Text>
            <Text style={styles.metaItemValue}>{state.inspectionDate || formatDate()}</Text>
          </View>
          {!!state.attendees && (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>נוכחים בביקור</Text>
              <Text style={styles.metaItemValue}>{state.attendees}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.pdfSection, { marginTop: 10 }]}>
        <SectionTitle num={2} label="פרטי הבודק המקצועי" />
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaItemLabel}>שם</Text>
            <Text style={styles.metaItemValue}>{businessProfile?.full_name || '—'}</Text>
          </View>
          {!!businessProfile?.business_name && (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>עסק</Text>
              <Text style={styles.metaItemValue}>{businessProfile.business_name}</Text>
            </View>
          )}
          {!!businessProfile?.license_number && (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>ח.פ / רישיון</Text>
              <Text style={styles.metaItemValue}>{businessProfile.license_number}</Text>
            </View>
          )}
          {!!businessProfile?.phone && (
            <View style={styles.metaItem}>
              <Text style={styles.metaItemLabel}>טלפון</Text>
              <Text style={styles.metaItemValue}>{businessProfile.phone}</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

function AboutPage({
  businessProfile, aboutSectionNum, trainingSectionNum,
}: {
  businessProfile: BusinessProfile;
  aboutSectionNum: number;
  trainingSectionNum: number;
}) {
  const bio = businessProfile?.bio;
  const trainingNote = businessProfile?.training_note;
  return (
    <>
      {!!bio && (
        <View style={styles.pdfSection}>
          <SectionTitle num={aboutSectionNum} label="אודותינו" />
          <Text style={styles.pdfBody}>{bio}</Text>
        </View>
      )}
      {!!trainingNote && (
        <View style={[styles.pdfSection, { marginTop: 10 }]}>
          <SectionTitle num={trainingSectionNum} label="הכשרה" />
          <Text style={styles.pdfBody}>{trainingNote}</Text>
        </View>
      )}
    </>
  );
}

function CertificationsPage({
  businessProfile,
  sectionNum,
  certsSubset,
  showTitle,
}: {
  businessProfile: BusinessProfile;
  sectionNum: number;
  certsSubset: Certification[];
  showTitle: boolean;
}) {
  const certsNote = businessProfile?.certifications_note;
  return (
    <View style={styles.pdfSection}>
      {showTitle && <SectionTitle num={sectionNum} label="תעודות והסמכות" />}
      {showTitle && !!certsNote && (
        <Text style={[styles.pdfBody, { marginBottom: 8 }]}>{certsNote}</Text>
      )}
      {certsSubset.map((cert, i) => (
        <View key={i} style={styles.certRow}>
          {!!cert.image_url && (
            <Image source={{ uri: cert.image_url }} style={styles.certImage} resizeMode="cover" />
          )}
          <View style={styles.certInfo}>
            <Text style={styles.certName}>{cert.name}</Text>
            <Text style={styles.certYear}>{cert.year}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function IssuePage({
  issue, pageNum, businessProfile, showMainContent, recs, isContinuation, recOffset,
}: {
  issue: ReportIssue;
  pageNum: number;
  businessProfile: BusinessProfile;
  showMainContent: boolean;
  recs: Recommendation[];
  isContinuation: boolean;
  recOffset: number;
}) {
  return (
    <>
      <View style={styles.pdfSection}>
        {showMainContent ? (
          <>
            <SectionTitle num={pageNum} label={issue.issueLabel} />
            <Text style={styles.pdfBody}>
              {issue.aiSummary || issue.description || issue.issueNote || 'לא צוין תיאור מפורט.'}
            </Text>
            {!!issue.issueNote && !issue.aiSummary && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.metaItemLabel}>הערות</Text>
                <Text style={styles.pdfBody}>{issue.issueNote}</Text>
              </View>
            )}
            {issue.photos.length > 0 && (
              <View style={[styles.pdfImageGrid, { marginTop: 10 }]}>
                {issue.photos.slice(0, 4).map((uri, j) => (
                  <View key={uri} style={styles.pdfImageCell}>
                    <Image source={{ uri }} style={styles.pdfImage} resizeMode="cover" />
                    <Text style={styles.pdfImageLabel}>{`תמונה ${j + 1}`}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : isContinuation ? (
          <SectionTitle num={pageNum} label={`${issue.issueLabel} (המשך)`} />
        ) : null}
        {recs.length > 0 && (
          <View style={showMainContent ? { marginTop: 10 } : undefined}>
            {recs.map((r: Recommendation, j: number) => (
              <View
                key={j}
                style={[styles.pdfRecRow, j < recs.length - 1 && styles.pdfRecBorder]}
              >
                <Text style={styles.pdfRecNum}>{`${recOffset + j + 1}`}</Text>
                <View style={styles.pdfRecPill}>
                  <Text style={styles.pdfRecPillText}>{r.priority}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pdfRecTitle}>{r.title}</Text>
                  {!!r.description && <Text style={styles.pdfRecDesc}>{r.description}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

function LegalPage({ pageNum, businessProfile }: { pageNum: number; businessProfile: BusinessProfile }) {
  const disclaimerText = businessProfile?.default_disclaimer?.trim() || LEGAL_DISCLAIMER;
  return (
    <>
      <View style={styles.pdfSection}>
        <SectionTitle num={pageNum} label="הגבלת אחריות" />
        <Text style={[styles.pdfBody, styles.disclaimerText]}>{disclaimerText}</Text>
      </View>
      <PageSig businessProfile={businessProfile} />
    </>
  );
}

// ─── Quote sections ───────────────────────────────────────────────────────────

const VAT_RATE = 0.18;

function QuoteContent({
  state,
  itemsSubset,
  showSectionTitle,
  showTotals,
  globalItemOffset = 0,
}: {
  state: WizardState;
  itemsSubset: WizardQuoteItem[];
  showSectionTitle: boolean;
  showTotals: boolean;
  globalItemOffset?: number;
}) {
  // Totals always reflect ALL items (not just the subset).
  const subtotal = state.quoteItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return (
    <>
      <View style={styles.pdfSection}>
        {showSectionTitle && <SectionTitle num={1} label="פירוט עבודות" />}
        {state.quoteItems.length === 0 && showSectionTitle ? (
          <Text style={styles.pdfBody}>לא הוזנו פריטים.</Text>
        ) : (
          <>
            {itemsSubset.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.quoteItem,
                  i < itemsSubset.length - 1 && styles.quoteItemBorder,
                ]}
              >
                <View style={styles.quoteItemHeader}>
                  <View style={styles.quoteItemNumBadge}>
                    <Text style={styles.quoteItemNum}>{globalItemOffset + i + 1}</Text>
                  </View>
                  <Text style={styles.quoteItemTitle}>{item.title}</Text>
                  <Text style={styles.quoteItemPrice}>
                    ₪{item.unitPrice.toLocaleString()}
                  </Text>
                </View>
                {!!item.description && (
                  <Text style={styles.quoteItemDesc}>{item.description}</Text>
                )}
              </View>
            ))}
            {showTotals && (
              <View style={styles.quoteTotals}>
                <View style={styles.quoteTotalRow}>
                  <Text style={styles.quoteTotalLabel}>סכום לפני מע״מ</Text>
                  <Text style={styles.quoteTotalValue}>₪{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.quoteTotalRow}>
                  <Text style={styles.quoteTotalLabel}>מע״מ (18%)</Text>
                  <Text style={styles.quoteTotalValue}>₪{vat.toLocaleString()}</Text>
                </View>
                <View style={[styles.quoteTotalRow, styles.quoteTotalFinalRow]}>
                  <Text style={styles.quoteTotalFinalLabel}>סה״כ לתשלום</Text>
                  <Text style={styles.quoteTotalFinalValue}>₪{total.toLocaleString()}</Text>
                </View>
              </View>
            )}
          </>
        )}
        {showTotals && !!state.quoteNotes && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.metaItemLabel, { marginBottom: 3 }]}>הערות</Text>
            <Text style={styles.pdfBody}>{state.quoteNotes}</Text>
          </View>
        )}
      </View>
      {showTotals && !!state.quoteValidityDate && (
        <View style={styles.quoteValidityRow}>
          <Icons.calendar size={11} color="#807A72" />
          <Text style={styles.quoteValidityText}>
            הצעה זו בתוקף עד: {state.quoteValidityDate}
          </Text>
        </View>
      )}
    </>
  );
}

// ─── Warranty sections ────────────────────────────────────────────────────────

function WarrantyContent({ state }: { state: WizardState }) {
  return (
    <>
      <View style={styles.pdfSection}>
        <SectionTitle num={1} label="פירוט העבודה שבוצעה" />
        <Text style={styles.pdfBody}>
          {state.warrantyWorkDescription || 'לא צוין תיאור עבודה.'}
        </Text>
      </View>
      {(state.reportIssues[0]?.photos ?? []).length > 0 && (
        <View style={styles.pdfImageGrid}>
          {(state.reportIssues[0]?.photos ?? []).slice(0, 4).map((uri, i) => (
            <View key={uri} style={styles.pdfImageCell}>
              <Image source={{ uri }} style={styles.pdfImage} resizeMode="cover" />
              <Text style={styles.pdfImageLabel}>{`${i + 1}`}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.pdfSection}>
        <SectionTitle num={2} label="תנאי האחריות" />
        <View style={styles.warrantyTermRow}>
          <Text style={styles.warrantyTermLabel}>תקופת אחריות</Text>
          <Text style={styles.warrantyTermValue}>{state.warrantyDuration || 'לא צוין'}</Text>
        </View>
        {state.warrantyConditions.length > 0 && (
          <View style={{ marginTop: 8, gap: 4 }}>
            {state.warrantyConditions.map((cond, i) => (
              <View key={i} style={styles.warrantyConditionRow}>
                <Text style={styles.warrantyConditionNum}>{i + 1}.</Text>
                <Text style={styles.warrantyConditionText}>{cond}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

// ─── Work Agreement sections ──────────────────────────────────────────────────

function buildResidentAddress(state: WizardState, apartment: string, floor: string): string {
  const baseStreet = [state.customerStreet, state.customerHouseNumber].filter(Boolean).join(' ');
  const aptFloor = [
    apartment ? `דירה ${apartment}` : '',
    floor ? `קומה ${floor}` : '',
  ].filter(Boolean).join(', ');
  return [baseStreet, aptFloor, state.customerCity].filter(Boolean).join(', ');
}

function WaPersonBlock({
  label, name, phone, address,
}: { label: string; name: string; phone: string; address: string }) {
  return (
    <View style={styles.waResidentCard}>
      <Text style={styles.waResidentCardLabel}>{label}</Text>
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaItemLabel}>שם</Text>
          <Text style={styles.metaItemValue}>{name || '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaItemLabel}>טלפון</Text>
          <Text style={styles.metaItemValue}>{phone || '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaItemLabel}>כתובת מלאה</Text>
          <Text style={styles.metaItemValue}>{address || '—'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaItemLabel}>תאריך</Text>
          <Text style={styles.metaItemValue}>{formatDate()}</Text>
        </View>
      </View>
    </View>
  );
}

function WaCustomerPage({ state }: { state: WizardState }) {
  const customerAddress = buildAddress(state);
  const totalParties = 1 + state.waResidents.length;

  return (
    <View style={styles.pdfSection}>
      <SectionTitle num={1} label="צדדים להסכם" />
      <View style={styles.waResidentsList}>
        {/* Main customer — always דייר 1 */}
        <View style={totalParties > 1 ? { borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' } : undefined}>
          <WaPersonBlock
            label="דייר 1"
            name={state.customerName}
            phone={state.customerPhone}
            address={customerAddress}
          />
        </View>

        {/* Additional residents */}
        {state.waResidents.map((r, i) => (
          <View
            key={r.id}
            style={i < state.waResidents.length - 1 ? { borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' } : undefined}
          >
            <WaPersonBlock
              label={`דייר ${i + 2}`}
              name={r.fullName}
              phone={r.phone}
              address={buildResidentAddress(state, r.apartment, r.floor)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function WaDetailsPage({
  state,
  businessProfile,
  itemsSubset,
  showSectionTitle,
  showFooter,
  globalItemOffset = 0,
}: {
  state: WizardState;
  businessProfile: BusinessProfile;
  itemsSubset: WaWorkItem[];
  showSectionTitle: boolean;
  showFooter: boolean;
  globalItemOffset?: number;
}) {
  const allFilled = state.waWorkItems.filter(i => i.title.trim());

  return (
    <>
      {/* Work items */}
      <View style={styles.pdfSection}>
        {showSectionTitle && <SectionTitle num={2} label="פירוט העבודות" />}
        {allFilled.length === 0 && showSectionTitle ? (
          <Text style={styles.pdfBody}>לא הוזן פירוט עבודות.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {itemsSubset.map((item, i) => (
              <View key={item.id} style={styles.waItemBlock}>
                <View style={styles.waItemRow}>
                  <View style={styles.waItemNum}>
                    <Text style={styles.waItemNumText}>{globalItemOffset + i + 1}</Text>
                  </View>
                  <Text style={[styles.waItemText, { fontWeight: '700' }]}>{item.title}</Text>
                </View>
                {item.clauses.filter(c => c.text.trim()).map((clause, j) => (
                  <View key={clause.id} style={styles.waClauseRow}>
                    <Text style={styles.waClauseNum}>{`${globalItemOffset + i + 1}.${j + 1}`}</Text>
                    <Text style={styles.waClauseText}>{clause.text}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Total price + payment terms — only on the last page of this section */}
      {showFooter && (
        <>
          <View style={[styles.pdfSection, { marginTop: 10 }]}>
            <SectionTitle num={3} label="מחיר כולל" />
            <View style={styles.waTotalBox}>
              <Text style={styles.waTotalLabel}>סה״כ לתשלום כולל מע״מ:</Text>
              <Text style={styles.waTotalValue}>
                {state.waTotalPrice ? `₪${Number(state.waTotalPrice).toLocaleString('he-IL')}` : 'לא צוין'}
              </Text>
            </View>
          </View>

          {state.waPaymentTerms.length > 0 && (
            <View style={[styles.pdfSection, { marginTop: 10 }]}>
              <SectionTitle num={4} label="תנאי תשלום" />
              <View style={{ gap: 4 }}>
                {state.waPaymentTerms.map((term, i) => (
                  <View key={term.id} style={styles.warrantyConditionRow}>
                    <Text style={styles.warrantyConditionNum}>{i + 1}.</Text>
                    <Text style={styles.warrantyConditionText}>{term.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
}

function WaSigPage({ businessProfile }: { businessProfile: BusinessProfile }) {
  const sigName = [
    businessProfile?.full_name,
    businessProfile?.license_number && `ח.פ ${businessProfile.license_number}`,
  ].filter(Boolean).join(' · ') || 'חתימת הטכנאי';
  const isSvg = !!businessProfile?.signature_url &&
    businessProfile.signature_url.startsWith('data:image/svg+xml;base64,');

  return (
    <>
      <View style={styles.pdfSection}>
        <View style={styles.pdfSectionTitle}>
          <View style={styles.pdfSectionLine} />
          <Text style={styles.pdfSectionLabel}>חתימות הצדדים</Text>
        </View>
      </View>
      <View style={[styles.waSigRow, { borderTopColor: '#C7C1B6', marginTop: 24 }]}>
        <View>
          {businessProfile?.signature_url ? (
            isSvg ? (
              <SvgXml
                xml={atob(businessProfile.signature_url.replace('data:image/svg+xml;base64,', ''))}
                width={80}
                height={28}
              />
            ) : (
              <Image
                source={{ uri: businessProfile.signature_url }}
                style={styles.pdfSigImage}
                resizeMode="contain"
              />
            )
          ) : (
            <View style={styles.pdfSigLine} />
          )}
          <Text style={styles.pdfSigName}>{sigName}</Text>
          <Text style={[styles.pdfSigName, { marginTop: 2 }]}>{formatDate()}</Text>
        </View>
        <View style={styles.waClientSig}>
          <View style={styles.pdfSigLine} />
          <Text style={styles.pdfSigName}>חתימת הלקוח</Text>
        </View>
      </View>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function PdfPreviewScreen({ colors = lightColors, onBack, onSend }: PdfPreviewScreenProps) {
  const wizard = useWizard();
  const { businessProfile } = useAuth();
  const [generatingPdf, setGeneratingPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState('');

  // ── A4 page dimensions ──────────────────────────────────────────────────────
  // Page width = screen width minus the ScrollView's horizontal insets.
  // Page height = width × A4 ratio so each captured JPEG has perfect A4 proportions.
  // overflow:'hidden' on every page View ensures captureRef never sees content
  // outside the A4 rectangle, eliminating mid-content PDF cuts.
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = screenWidth - SCROLL_H_INSET * 2;
  const pageHeight = Math.round(pageWidth * A4_RATIO);
  const dynPage = React.useMemo(
    () => ({ height: pageHeight, overflow: 'hidden' as const }),
    [pageHeight],
  );

  // Each PDF page gets its own View ref. Keyed by page ID string.
  const pageRefs = React.useRef<Map<string, View | null>>(new Map());
  function setPageRef(key: string) {
    return (ref: View | null) => { pageRefs.current.set(key, ref); };
  }

  const state = wizard.state;

  // ── Image preloading ────────────────────────────────────────────────────────
  // All remote images required for the current report/docType are prefetched
  // into the RN cache here. The send button is disabled until every prefetch
  // resolves so captureRef never captures a blank image placeholder.
  const pdfImageUrls = React.useMemo(
    () => collectPdfImageUrls(state, businessProfile),
    // Re-collect whenever the content that drives visible images changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.docType, state.reportIssues, businessProfile?.logo_url,
     businessProfile?.signature_url, businessProfile?.certifications],
  );
  const {
    imagesReady,
    loaded: imagesLoaded,
    total: imagesTotal,
    failedUrls: imageFailedUrls,
    retry: retryImages,
  } = usePdfImagePreload(pdfImageUrls);

  const docConfig = DOCUMENT_TYPES[state.docType];
  const docTitle = state.docType === 'work-agreement'
    ? docConfig.label
    : `${docConfig.titlePrefix} ${state.customerName || 'לא צוין'}`;
  const brandInitial = (businessProfile?.business_name ?? businessProfile?.full_name ?? 'ד')[0] ?? 'ד';

  const certs = (businessProfile?.certifications ?? []) as Certification[];
  const hasAboutPage = !!businessProfile?.bio || !!businessProfile?.training_note;
  const hasCertsPage = certs.length > 0 || !!businessProfile?.certifications_note;
  const issues = state.reportIssues;

  // ── Cert page splitting ─────────────────────────────────────────────────────
  // Distribute all certifications across as many A4 pages as needed so that no
  // cert row is ever cut at a page boundary.
  const certPageGroups = React.useMemo((): Certification[][] => {
    if (!hasCertsPage) return [];
    if (certs.length === 0) return [[]]; // note-only page

    const bodyH = pageHeight - PAGE_PAD * 2 - EST_HEADER_H;
    const hasNote = !!businessProfile?.certifications_note;

    // First page must also reserve space for the section title (and optional note).
    const firstAvail = bodyH - EST_SECTION_TITLE_H - EST_SECTION_MARGIN_H - (hasNote ? EST_CERT_NOTE_H : 0);
    const certsFirst = Math.max(1, Math.floor(firstAvail / EST_CERT_ROW_H));

    const groups: Certification[][] = [certs.slice(0, certsFirst)];
    const subseqPerPage = Math.max(1, Math.floor(bodyH / EST_CERT_ROW_H));
    let idx = certsFirst;
    while (idx < certs.length) {
      groups.push(certs.slice(idx, idx + subseqPerPage));
      idx += subseqPerPage;
    }
    return groups;
  }, [certs, hasCertsPage, pageHeight, businessProfile?.certifications_note]);

  // ── Quote page splitting ────────────────────────────────────────────────────
  const quotePageGroups = React.useMemo(
    (): WizardQuoteItem[][] =>
      state.docType === 'quote' ? buildQuoteGroups(state.quoteItems, pageHeight) : [],
    [state.docType, state.quoteItems, pageHeight],
  );

  // ── Work-agreement details page splitting ───────────────────────────────────
  const waDetailPageGroups = React.useMemo(
    (): WaWorkItem[][] =>
      state.docType === 'work-agreement'
        ? buildWaDetailGroups(state.waWorkItems, state.waPaymentTerms.length, pageHeight)
        : [],
    [state.docType, state.waWorkItems, state.waPaymentTerms, pageHeight],
  );

  // ── Issue page splitting ────────────────────────────────────────────────────
  const issuePageGroupsList = React.useMemo(
    () => issues.map(issue => buildIssuePageGroups(issue, pageHeight)),
    [issues, pageHeight],
  );

  // Dynamic section numbering (sections 1+2 are on page 1: customer + professional)
  let _sec = 3;
  const aboutSectionNum = _sec;
  if (hasAboutPage && businessProfile?.bio) _sec++;
  const trainingSectionNum = _sec;
  if (hasAboutPage && businessProfile?.training_note) _sec++;
  const certsSectionNum = _sec;
  if (hasCertsPage) _sec++;
  const issueBasePageNum = _sec;
  const legalPageNum = issueBasePageNum + issues.length;

  const headerProps = { docTitle, brandInitial, businessProfile };

  const isMultiPage = state.docType === 'report' || state.docType === 'work-agreement';

  const handleSend = async () => {
    if (!state.documentId) return;
    if (!imagesReady) return; // guard against race between prefetch resolution and tap
    if (state.pdfUrl) { onSend?.(); return; }

    setGeneratingPdf(true);
    setPdfError('');

    try {
      // Yield two animation frames before captureRef fires.
      // Frame 1: React Native commits pending state to the native view tree.
      // Frame 2: The native layout engine resolves RTL measurements and image
      // decode paints, so captureRef sees a fully-settled view.
      // Images are already decoded at this point (guaranteed by prefetchAndDecode),
      // so two frames is deterministically sufficient on any device.
      await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      let capturedImages: string[];

      if (state.docType === 'report') {
        const pageKeys: string[] = ['page1'];
        if (hasAboutPage) pageKeys.push('about');
        // Certs may span multiple A4 pages — capture each one.
        certPageGroups.forEach((_, i) => pageKeys.push(`certs_${i}`));
        issues.forEach((_, issueIdx) => {
          const groups = issuePageGroupsList[issueIdx] ?? [{}];
          groups.forEach((_, groupIdx) => {
            pageKeys.push(groupIdx === 0 ? `issue_${issueIdx}` : `issue_${issueIdx}_${groupIdx}`);
          });
        });
        pageKeys.push('legal');

        capturedImages = [];
        for (const key of pageKeys) {
          const view = pageRefs.current.get(key);
          if (!view) continue;
          const base64 = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'base64' });
          capturedImages.push(base64 as string);
        }
      } else if (state.docType === 'work-agreement') {
        // wa_page1, then each wa_details page, then wa_page3 (signatures)
        const waKeys: string[] = ['wa_page1'];
        waDetailPageGroups.forEach((_, i) => waKeys.push(`wa_details_${i}`));
        waKeys.push('wa_page3');

        capturedImages = [];
        for (const key of waKeys) {
          const view = pageRefs.current.get(key);
          if (!view) continue;
          const base64 = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'base64' });
          capturedImages.push(base64 as string);
        }
      } else if (state.docType === 'quote') {
        capturedImages = [];
        for (let i = 0; i < quotePageGroups.length; i++) {
          const view = pageRefs.current.get(`quote_${i}`);
          if (!view) continue;
          const base64 = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'base64' });
          capturedImages.push(base64 as string);
        }
      } else {
        // warranty — single page, content is short enough
        const view = pageRefs.current.get('single');
        if (!view) throw new Error('לא נמצא תוכן לייצוא');
        const base64 = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'base64' });
        capturedImages = [base64 as string];
      }

      if (capturedImages.length === 0) throw new Error('לא נוצרו עמודים לייצוא');

      const url = await generatePdfFromCapture(state.documentId, capturedImages, 'image/jpeg');
      wizard.setPdfUrl(url);
      onSend?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא צפויה';
      setPdfError(`לא ניתן היה ליצור PDF: ${msg}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bgSunken }]}>
      <Header
        title="תצוגה מקדימה"
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {state.docType === 'report' && (
          <>
            <View ref={setPageRef('page1')} style={[styles.pdfPage, dynPage]}>
              <PdfPageHeader {...headerProps} />
              <ReportPage1 state={state} businessProfile={businessProfile} />
            </View>

            {hasAboutPage && (
              <View ref={setPageRef('about')} style={[styles.pdfPage, dynPage]}>
                <PdfPageHeader {...headerProps} />
                <AboutPage
                  businessProfile={businessProfile}
                  aboutSectionNum={aboutSectionNum}
                  trainingSectionNum={trainingSectionNum}
                />
              </View>
            )}

            {/* Each certPageGroup is one A4 page — no cert row is ever cut. */}
            {certPageGroups.map((certGroup, pageIdx) => (
              <View
                key={`certs_${pageIdx}`}
                ref={setPageRef(`certs_${pageIdx}`)}
                style={[styles.pdfPage, dynPage]}
              >
                <PdfPageHeader {...headerProps} />
                <CertificationsPage
                  businessProfile={businessProfile}
                  sectionNum={certsSectionNum}
                  certsSubset={certGroup}
                  showTitle={pageIdx === 0}
                />
              </View>
            ))}

            {issues.map((issue, issueIdx) => {
              const groups = issuePageGroupsList[issueIdx] ?? [{ showMainContent: true, recs: issue.recommendations }];
              let recOffset = 0;
              return groups.map((group, groupIdx) => {
                const pageKey = groupIdx === 0 ? `issue_${issueIdx}` : `issue_${issueIdx}_${groupIdx}`;
                const thisOffset = recOffset;
                recOffset += group.recs.length;
                return (
                  <View key={pageKey} ref={setPageRef(pageKey)} style={[styles.pdfPage, dynPage]}>
                    <PdfPageHeader {...headerProps} />
                    <IssuePage
                      issue={issue}
                      pageNum={issueBasePageNum + issueIdx}
                      businessProfile={businessProfile}
                      showMainContent={group.showMainContent}
                      recs={group.recs}
                      isContinuation={!group.showMainContent}
                      recOffset={thisOffset}
                    />
                  </View>
                );
              });
            })}

            <View ref={setPageRef('legal')} style={[styles.pdfPage, dynPage]}>
              <PdfPageHeader {...headerProps} />
              <LegalPage pageNum={legalPageNum} businessProfile={businessProfile} />
            </View>
          </>
        )}

        {/* Quote — items split across pages; totals + sig only on the last page. */}
        {state.docType === 'quote' && (() => {
          let offset = 0;
          return quotePageGroups.map((group, pageIdx) => {
            const isLast = pageIdx === quotePageGroups.length - 1;
            const pageOffset = offset;
            offset += group.length;
            return (
              <View key={`quote_${pageIdx}`} ref={setPageRef(`quote_${pageIdx}`)} style={[styles.pdfPage, dynPage]}>
                <PdfPageHeader {...headerProps} />
                <QuoteContent
                  state={state}
                  itemsSubset={group}
                  showSectionTitle={pageIdx === 0}
                  showTotals={isLast}
                  globalItemOffset={pageOffset}
                />
                {isLast && (
                  <View style={[styles.pdfSigRow, { borderTopColor: '#C7C1B6' }]}>
                    <View>
                      {businessProfile?.signature_url
                        ? businessProfile.signature_url.startsWith('data:image/svg+xml;base64,')
                          ? (
                            <SvgXml
                              xml={atob(businessProfile.signature_url.replace('data:image/svg+xml;base64,', ''))}
                              width={80}
                              height={28}
                            />
                          )
                          : (
                            <Image
                              source={{ uri: businessProfile.signature_url }}
                              style={styles.pdfSigImage}
                              resizeMode="contain"
                            />
                          )
                        : <View style={styles.pdfSigLine} />
                      }
                      <Text style={styles.pdfSigName}>
                        {[businessProfile?.full_name, businessProfile?.license_number && `ח.פ ${businessProfile.license_number}`]
                          .filter(Boolean).join(' · ') || 'חתימה'}
                      </Text>
                    </View>
                    <Text style={styles.pdfQrPlaceholder}>QR</Text>
                  </View>
                )}
              </View>
            );
          });
        })()}

        {/* Warranty — short content, single page always fits. */}
        {state.docType === 'warranty' && (
          <View ref={setPageRef('single')} style={[styles.pdfPage, dynPage]}>
            <PdfPageHeader {...headerProps} />
            <WarrantyContent state={state} />
            <View style={[styles.pdfSigRow, { borderTopColor: '#C7C1B6' }]}>
              <View>
                {businessProfile?.signature_url
                  ? businessProfile.signature_url.startsWith('data:image/svg+xml;base64,')
                    ? (
                      <SvgXml
                        xml={atob(businessProfile.signature_url.replace('data:image/svg+xml;base64,', ''))}
                        width={80}
                        height={28}
                      />
                    )
                    : (
                      <Image
                        source={{ uri: businessProfile.signature_url }}
                        style={styles.pdfSigImage}
                        resizeMode="contain"
                      />
                    )
                  : <View style={styles.pdfSigLine} />
                }
                <Text style={styles.pdfSigName}>
                  {[businessProfile?.full_name, businessProfile?.license_number && `ח.פ ${businessProfile.license_number}`]
                    .filter(Boolean).join(' · ') || 'חתימה'}
                </Text>
              </View>
              <Text style={styles.pdfQrPlaceholder}>QR</Text>
            </View>
          </View>
        )}

        {state.docType === 'work-agreement' && (
          <>
            {/* Page 1: Customer + Residents */}
            <View ref={setPageRef('wa_page1')} style={[styles.pdfPage, dynPage]}>
              <PdfPageHeader {...headerProps} />
              <WaCustomerPage state={state} />
            </View>

            {/* Work details — split across as many pages as needed. */}
            {(() => {
              let offset = 0;
              return waDetailPageGroups.map((group, pageIdx) => {
                const isLast = pageIdx === waDetailPageGroups.length - 1;
                const pageOffset = offset;
                offset += group.length;
                return (
                  <View key={`wa_details_${pageIdx}`} ref={setPageRef(`wa_details_${pageIdx}`)} style={[styles.pdfPage, dynPage]}>
                    <PdfPageHeader {...headerProps} />
                    <WaDetailsPage
                      state={state}
                      businessProfile={businessProfile}
                      itemsSubset={group}
                      showSectionTitle={pageIdx === 0}
                      showFooter={isLast}
                      globalItemOffset={pageOffset}
                    />
                  </View>
                );
              });
            })()}

            {/* Signatures — always on its own page. */}
            <View ref={setPageRef('wa_page3')} style={[styles.pdfPage, dynPage]}>
              <PdfPageHeader {...headerProps} />
              <WaSigPage businessProfile={businessProfile} />
            </View>
          </>
        )}
      </ScrollView>

      <FixedBottom colors={colors}>
        {imageFailedUrls.length > 0 && !generatingPdf && (
          <View style={styles.imageErrorRow}>
            <Text style={[styles.pdfError, { color: colors.danger }]}>
              {imageFailedUrls.length === 1
                ? 'תמונה אחת לא נטענה — לא ניתן ליצור PDF'
                : `${imageFailedUrls.length} תמונות לא נטענו — לא ניתן ליצור PDF`}
            </Text>
            <Pressable onPress={retryImages}>
              <Text style={styles.retryLink}>נסה שוב</Text>
            </Pressable>
          </View>
        )}
        {!!pdfError && (
          <Text style={[styles.pdfError, { color: colors.danger, fontFamily: fonts.sans }]}>
            {pdfError}
          </Text>
        )}
        <Button
          kind="primary"
          size="lg"
          full
          disabled={generatingPdf || !imagesReady}
          onPress={handleSend}
          iconRight={
            generatingPdf || (imagesTotal > 0 && !imagesReady && imageFailedUrls.length === 0)
              ? <ActivityIndicator size="small" color={colors.bg} />
              : undefined
          }
          colors={colors}
        >
          {generatingPdf
            ? 'מייצר PDF…'
            : imagesTotal > 0 && !imagesReady
              ? `מכין תמונות לדוח… (${imagesLoaded}/${imagesTotal})`
              : 'שלח ללקוח'}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 140, gap: 14 },
  shareBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // PDF page card
  pdfPage: {
    backgroundColor: '#fff',
    padding: 28,
    shadowColor: '#1B1916',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  // Header (repeated on every page)
  pdfHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  pdfDocTitle: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', color: '#1B1916', letterSpacing: -0.3, textAlign: 'right' },
  pdfDocRef: { fontSize: 8, color: '#4A4641', marginTop: 4, letterSpacing: 0.5, textAlign: 'right' },
  pdfBrandSide: { alignItems: 'flex-start', minWidth: 70, maxWidth: 100 },
  pdfLogoImage: { width: 48, height: 28, marginBottom: 4, borderRadius: 4 },
  pdfBrandMark: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#1B1916',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  pdfBrandLetter: { color: '#F5F3EE', fontFamily: fonts.serif, fontSize: 16, fontWeight: '700' },
  pdfBrandName: { fontSize: 8, fontWeight: '600', color: '#1B1916', textAlign: 'right' },
  pdfTaxId: { fontSize: 7, color: '#807A72' },

  // Sections
  pdfSection: { marginBottom: 12 },
  pdfSectionTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 },
  pdfSectionLine: { width: 12, height: 1, backgroundColor: '#1B1916' },
  pdfSectionLabel: { fontFamily: fonts.serif, fontSize: 11, fontWeight: '700', color: '#1B1916', textAlign: 'right', flex: 1 },
  pdfBody: { fontSize: 9, color: '#1B1916', lineHeight: 14, textAlign: 'right', writingDirection: 'rtl' },

  // Meta grid
  metaGrid: { gap: 5, marginBottom: 8 },
  metaItem: { flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' },
  metaItemLabel: { fontSize: 7, color: '#807A72', minWidth: 55, paddingTop: 1, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'right' },
  metaItemValue: { fontSize: 9, color: '#1B1916', fontWeight: '600', flex: 1, textAlign: 'right' },

  // Visit reason box
  visitReasonBox: {
    backgroundColor: '#F8F7F4',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    borderRightWidth: 2,
    borderRightColor: '#1B1916',
  },
  visitReasonLabel: { fontSize: 7, color: '#807A72', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3, textAlign: 'right' },
  visitReasonValue: { fontSize: 9, fontWeight: '700', color: '#1B1916', textAlign: 'right' },
  visitReasonNote: { fontSize: 8.5, color: '#4A4641', marginTop: 2, lineHeight: 13, textAlign: 'right' },

  // Photos
  pdfImageGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pdfImageCell: { width: '47%' },
  pdfImage: { width: '100%', height: 80, borderRadius: 6 },
  pdfImageLabel: { fontSize: 7, color: '#807A72', textAlign: 'center', marginTop: 2 },

  // Legal disclaimer
  disclaimerText: { fontSize: 8, color: '#807A72', lineHeight: 13, fontStyle: 'italic', textAlign: 'right', writingDirection: 'rtl' },

  // Recommendations
  pdfRecRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, paddingVertical: 5 },
  pdfRecBorder: { borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  pdfRecNum: { fontSize: 8, fontWeight: '700', width: 14, paddingTop: 1, textAlign: 'right' },
  pdfRecPill: { backgroundColor: '#F8E9DF', borderRadius: 4, paddingVertical: 1, paddingHorizontal: 5, alignSelf: 'flex-start' },
  pdfRecPillText: { fontSize: 7, fontWeight: '700', color: '#A04E2D' },
  pdfRecTitle: { fontSize: 8, fontWeight: '700', color: '#1B1916', textAlign: 'right' },
  pdfRecDesc: { fontSize: 7.5, color: '#4A4641', marginTop: 1, textAlign: 'right' },

  // Quote
  quoteItem: { paddingVertical: 7 },
  quoteItemBorder: { borderBottomWidth: 0.5, borderBottomColor: '#E8E4DE' },
  quoteItemHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 6 },
  quoteItemNumBadge: {
    width: 14, height: 14, borderRadius: 3,
    backgroundColor: '#1B1916',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  quoteItemNum: { fontSize: 7, fontWeight: '700', color: '#F5F3EE' },
  quoteItemTitle: { flex: 1, fontSize: 9, fontWeight: '700', color: '#1B1916', textAlign: 'right' },
  quoteItemPrice: { fontSize: 9, fontWeight: '800', color: '#1B1916', flexShrink: 0 },
  quoteItemDesc: { fontSize: 8, color: '#807A72', lineHeight: 12, marginTop: 3, paddingRight: 20, textAlign: 'right' },
  quoteTotals: { marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#C7C1B6', paddingTop: 6, gap: 3 },
  quoteTotalRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  quoteTotalLabel: { fontSize: 8, color: '#4A4641', textAlign: 'right' },
  quoteTotalValue: { fontSize: 8, color: '#1B1916', fontWeight: '600' },
  quoteTotalFinalRow: { borderTopWidth: 0.5, borderTopColor: '#C7C1B6', paddingTop: 4, marginTop: 2 },
  quoteTotalFinalLabel: { fontSize: 9, fontWeight: '700', color: '#1B1916', textAlign: 'right' },
  quoteTotalFinalValue: { fontSize: 9, fontWeight: '700', color: '#1B1916' },
  quoteValidityRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    marginTop: 12, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#C7C1B6',
  },
  quoteValidityText: { fontSize: 8, color: '#4A4641', fontWeight: '600', textAlign: 'right' },

  // Warranty
  warrantyTermRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 },
  warrantyTermLabel: { fontSize: 8, color: '#807A72', textAlign: 'right' },
  warrantyTermValue: { fontSize: 8, fontWeight: '700', color: '#1B1916' },
  warrantyConditionRow: { flexDirection: 'row-reverse', gap: 5, alignItems: 'flex-start' },
  warrantyConditionNum: { fontSize: 8, fontWeight: '700', color: '#1B1916', minWidth: 14, textAlign: 'right' },
  warrantyConditionText: { fontSize: 8, color: '#1B1916', lineHeight: 13, flex: 1, textAlign: 'right' },

  // Work Agreement
  waResidentsList: {},
  waResidentCard: { paddingVertical: 8 },
  waResidentCardLabel: {
    fontSize: 8, fontWeight: '700', color: '#1B1916',
    textAlign: 'right', marginBottom: 5, letterSpacing: 0.2,
  },
  waItemBlock: { gap: 3 },
  waItemRow: { flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start' },
  waItemNum: {
    width: 14, height: 14, borderRadius: 3,
    backgroundColor: '#1B1916',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  waItemNumText: { fontSize: 7, fontWeight: '700', color: '#F5F3EE' },
  waItemText: { fontSize: 9, color: '#1B1916', flex: 1, lineHeight: 13, textAlign: 'right' },
  waClauseRow: { flexDirection: 'row-reverse', gap: 6, alignItems: 'flex-start', paddingRight: 20 },
  waClauseNum: { fontSize: 8, color: '#807A72', fontWeight: '600', minWidth: 22, textAlign: 'right', flexShrink: 0 },
  waClauseText: { fontSize: 8, color: '#4A4641', flex: 1, lineHeight: 12, textAlign: 'right' },
  waTotalBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F7F4',
    borderRadius: 6,
    padding: 10,
    borderRightWidth: 2,
    borderRightColor: '#1B1916',
  },
  waTotalLabel: { fontSize: 9, fontWeight: '700', color: '#1B1916', textAlign: 'right' },
  waTotalValue: { fontSize: 14, fontWeight: '800', color: '#1B1916' },
  waSigRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 0.5,
  },
  waClientSig: { alignItems: 'flex-start' },

  // Signature (quote/warranty bottom row)
  pdfSigRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 22, paddingTop: 14, borderTopWidth: 0.5,
  },
  pdfSigImage: { width: 80, height: 28, marginBottom: 2 },
  pdfSigLine: { width: 80, height: 1, backgroundColor: '#C7C1B6', marginBottom: 6 },
  pdfSigName: { fontSize: 7, color: '#807A72', marginTop: 2, textAlign: 'right' },
  pdfQrPlaceholder: { fontSize: 7, color: '#807A72', padding: 8, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 4 },

  // Per-page signature (bottom-right of every report page)
  pageSig: { alignItems: 'flex-end', marginTop: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#C7C1B6' },
  pageSigImage: { width: 90, height: 32 },
  pageSigName: { fontSize: 7, color: '#807A72', marginTop: 2, textAlign: 'right' },

  // Certifications
  certRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E8E4DE',
  },
  certImage: { width: 96, height: 96, borderRadius: 8, flexShrink: 0 },
  certInfo: { flex: 1, alignItems: 'flex-end' },
  certName: { fontSize: 9, fontWeight: '700', color: '#1B1916', textAlign: 'right' },
  certYear: { fontSize: 8, color: '#807A72', marginTop: 2, textAlign: 'right' },

  // Bottom
  bottomRow: { flexDirection: 'row', gap: 10 },
  pdfError: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
  imageErrorRow: { alignItems: 'center', gap: 4, marginBottom: 8 },
  retryLink: { fontSize: 13, fontWeight: '600', color: '#5A8770', textDecorationLine: 'underline' },
});
