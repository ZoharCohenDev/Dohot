import React from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, Image, Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { Header, FixedBottom } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import { generatePdfFromCapture } from '@/services/documents';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import type { Recommendation } from '@dohot/shared';

interface PdfPreviewScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onSend?: () => void;
}

type BusinessProfile = ReturnType<typeof useAuth>['businessProfile'];
type WizardState = ReturnType<typeof useWizard>['state'];
type ReportIssue = WizardState['reportIssues'][number];

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
        <View style={styles.pdfBrandMark}>
          <Text style={styles.pdfBrandLetter}>{brandInitial}</Text>
        </View>
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
        {issues.length > 0 && (
          <View style={styles.visitReasonBox}>
            <Text style={styles.visitReasonLabel}>סוגי תקלות שנבדקו</Text>
            {issues.map((issue, i) => (
              <Text key={issue.id} style={[styles.visitReasonValue, i > 0 && { marginTop: 2 }]}>
                {`${i + 1}. ${issue.issueLabel}`}
              </Text>
            ))}
          </View>
        )}
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

function CertificationsPage({ businessProfile, sectionNum }: { businessProfile: BusinessProfile; sectionNum: number }) {
  const certs = businessProfile?.certifications ?? [];
  const certsNote = businessProfile?.certifications_note;
  return (
    <>
      <View style={styles.pdfSection}>
        <SectionTitle num={sectionNum} label="תעודות והסמכות" />
        {!!certsNote && (
          <Text style={[styles.pdfBody, { marginBottom: 8 }]}>{certsNote}</Text>
        )}
        {certs.map((cert, i) => (
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
    </>
  );
}

function IssuePage({
  issue, pageNum, businessProfile,
}: {
  issue: ReportIssue;
  pageNum: number;
  businessProfile: BusinessProfile;
}) {
  return (
    <>
      <View style={styles.pdfSection}>
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
        {issue.recommendations.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {issue.recommendations.map((r: Recommendation, j: number) => (
              <View
                key={j}
                style={[styles.pdfRecRow, j < issue.recommendations.length - 1 && styles.pdfRecBorder]}
              >
                <Text style={styles.pdfRecNum}>{`${j + 1}`}</Text>
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
  return (
    <>
      <View style={styles.pdfSection}>
        <SectionTitle num={pageNum} label="הגבלת אחריות" />
        <Text style={[styles.pdfBody, styles.disclaimerText]}>{LEGAL_DISCLAIMER}</Text>
      </View>
      <PageSig businessProfile={businessProfile} />
    </>
  );
}

// ─── Quote sections ───────────────────────────────────────────────────────────

const VAT_RATE = 0.18;

function QuoteContent({ state }: { state: WizardState }) {
  const subtotal = state.quoteItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return (
    <>
      <View style={styles.pdfSection}>
        <SectionTitle num={1} label="פירוט עבודות" />
        {state.quoteItems.length === 0 ? (
          <Text style={styles.pdfBody}>לא הוזנו פריטים.</Text>
        ) : (
          <>
            {state.quoteItems.map((item, i) => (
              <View
                key={item.key}
                style={[
                  styles.quoteItem,
                  i < state.quoteItems.length - 1 && styles.quoteItemBorder,
                ]}
              >
                <View style={styles.quoteItemHeader}>
                  <View style={styles.quoteItemNumBadge}>
                    <Text style={styles.quoteItemNum}>{i + 1}</Text>
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
          </>
        )}
        {!!state.quoteNotes && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.metaItemLabel, { marginBottom: 3 }]}>הערות</Text>
            <Text style={styles.pdfBody}>{state.quoteNotes}</Text>
          </View>
        )}
      </View>
      {!!state.quoteValidityDate && (
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export function PdfPreviewScreen({ colors = lightColors, onBack, onSend }: PdfPreviewScreenProps) {
  const wizard = useWizard();
  const { businessProfile } = useAuth();
  const [generatingPdf, setGeneratingPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState('');

  // Each PDF page gets its own View ref. Keyed by page ID string.
  // captureRef on each View captures that page at its full natural height —
  // no scrolling needed, no A4 mid-image slicing.
  const pageRefs = React.useRef<Map<string, View | null>>(new Map());
  function setPageRef(key: string) {
    return (ref: View | null) => { pageRefs.current.set(key, ref); };
  }

  const state = wizard.state;
  const docConfig = DOCUMENT_TYPES[state.docType];
  const docTitle = `${docConfig.titlePrefix} ${state.customerName || 'לא צוין'}`;
  const brandInitial = (businessProfile?.business_name ?? businessProfile?.full_name ?? 'ד')[0] ?? 'ד';

  const certs = businessProfile?.certifications ?? [];
  const hasAboutPage = !!businessProfile?.bio || !!businessProfile?.training_note;
  const hasCertsPage = certs.length > 0 || !!businessProfile?.certifications_note;
  const issues = state.reportIssues;

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

  const handleSend = async () => {
    if (!state.documentId) return;
    if (state.pdfUrl) { onSend?.(); return; }

    setGeneratingPdf(true);
    setPdfError('');

    try {
      // Give layout a frame to fully render before capturing
      await new Promise<void>((r) => setTimeout(r, Platform.OS === 'ios' ? 200 : 400));

      let capturedImages: string[];

      if (state.docType === 'report') {
        // Build the ordered list of page keys
        const pageKeys: string[] = ['page1'];
        if (hasAboutPage) pageKeys.push('about');
        if (hasCertsPage) pageKeys.push('certs');
        issues.forEach((_, i) => pageKeys.push(`issue_${i}`));
        pageKeys.push('legal');

        // Capture each page View separately — sequential to avoid memory spikes
        capturedImages = [];
        for (const key of pageKeys) {
          const view = pageRefs.current.get(key);
          if (!view) continue;
          const base64 = await captureRef(view, { format: 'jpg', quality: 0.92, result: 'base64' });
          capturedImages.push(base64 as string);
        }
      } else {
        // Quote / Warranty: single page
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
        onBack={onBack}
        action={
          <Pressable style={[styles.shareBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Icons.share size={20} color={colors.ink1} />
          </Pressable>
        }
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {state.docType === 'report' && (
          <>
            {/* Page 1: Client + Professional details */}
            <View ref={setPageRef('page1')} style={styles.pdfPage}>
              <PdfPageHeader {...headerProps} />
              <ReportPage1 state={state} businessProfile={businessProfile} />
            </View>

            {/* Page 2 (optional): אודותינו + הכשרה */}
            {hasAboutPage && (
              <View ref={setPageRef('about')} style={styles.pdfPage}>
                <PdfPageHeader {...headerProps} />
                <AboutPage
                  businessProfile={businessProfile}
                  aboutSectionNum={aboutSectionNum}
                  trainingSectionNum={trainingSectionNum}
                />
              </View>
            )}

            {/* Next page (optional): Certifications & authorizations */}
            {hasCertsPage && (
              <View ref={setPageRef('certs')} style={styles.pdfPage}>
                <PdfPageHeader {...headerProps} />
                <CertificationsPage businessProfile={businessProfile} sectionNum={certsSectionNum} />
              </View>
            )}

            {/* One page per issue: description + photos + recommendations */}
            {issues.map((issue, i) => (
              <View key={issue.id} ref={setPageRef(`issue_${i}`)} style={styles.pdfPage}>
                <PdfPageHeader {...headerProps} />
                <IssuePage issue={issue} pageNum={issueBasePageNum + i} businessProfile={businessProfile} />
              </View>
            ))}

            {/* Last page: Limitation of liability */}
            <View ref={setPageRef('legal')} style={styles.pdfPage}>
              <PdfPageHeader {...headerProps} />
              <LegalPage pageNum={legalPageNum} businessProfile={businessProfile} />
            </View>
          </>
        )}

        {(state.docType === 'quote' || state.docType === 'warranty') && (
          <View ref={setPageRef('single')} style={styles.pdfPage}>
            <PdfPageHeader {...headerProps} />
            {state.docType === 'quote' && <QuoteContent state={state} />}
            {state.docType === 'warranty' && <WarrantyContent state={state} />}
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
      </ScrollView>

      <FixedBottom colors={colors}>
        {!!pdfError && (
          <Text style={[styles.pdfError, { color: colors.danger, fontFamily: fonts.sans }]}>
            {pdfError}
          </Text>
        )}
        <View style={styles.bottomRow}>
          <Button kind="ghost" size="lg" icon={<Icons.edit size={18} color={colors.ink1} />} colors={colors}>
            ערוך
          </Button>
          <Button
            kind="primary"
            size="lg"
            full
            disabled={generatingPdf}
            onPress={handleSend}
            iconRight={generatingPdf ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}
            colors={colors}
          >
            {generatingPdf ? 'מייצר PDF…' : 'שלח ללקוח'}
          </Button>
        </View>
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

  // PDF page card — each is one physical PDF page
  pdfPage: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  pdfBrandMark: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#1B1916',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  pdfBrandLetter: { color: '#F5F3EE', fontFamily: fonts.serif, fontSize: 16, fontWeight: '700' },
  pdfBrandName: { fontSize: 8, fontWeight: '600', color: '#1B1916', textAlign: 'left' },
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
});
