import React from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  StyleSheet, Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Header, FixedBottom } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import { generateDocumentPdf } from '@/services/documents';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import type { Recommendation } from '@dohot/shared';

interface PdfPreviewScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onSend?: () => void;
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

// ─── Shared components ────────────────────────────────────────────────────────

function SectionTitle({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.pdfSectionTitle}>
      <View style={styles.pdfSectionLine} />
      <Text style={styles.pdfSectionLabel}>{`${num}. ${label}`}</Text>
    </View>
  );
}

function PageDivider({ pageNum, label }: { pageNum: number; label: string }) {
  return (
    <View style={styles.pageDivider}>
      <View style={styles.pageDividerLine} />
      <View style={styles.pageDividerBadge}>
        <Text style={styles.pageDividerNum}>עמוד {pageNum}</Text>
        <Text style={styles.pageDividerLabel}>{label}</Text>
      </View>
      <View style={styles.pageDividerLine} />
    </View>
  );
}

// ─── Report (5-page structure) ────────────────────────────────────────────────

const LEGAL_DISCLAIMER =
  'דוח זה הוכן על בסיס בדיקה ויזואלית ואינו מהווה חוות דעת הנדסית. ' +
  'הממצאים וההמלצות מבוססים על מצב הנכס במועד הביקור בלבד. ' +
  'הכותב אינו אחראי לנזקים שנגרמו לאחר מועד הביקור או לנזקים סמויים שלא ניתן היה לאתרם בבדיקה חיצונית. ' +
  'כל עבודת תיקון תבוצע לפי שיקול הבעלים ועל אחריותו.';

function ReportContent({
  state,
  businessProfile,
}: {
  state: ReturnType<typeof useWizard>['state'];
  businessProfile: ReturnType<typeof useAuth>['businessProfile'];
}) {
  const address = buildAddress(state);
  const propType = propertyLabel(state.propertyType);
  const issues = state.reportIssues;

  return (
    <>
      {/* ── PAGE 1: Visit & Customer Details ── */}
      <View style={styles.pdfSection}>
        <SectionTitle num={1} label="פרטי הביקור והלקוח" />
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
        {/* Summary of all issue types */}
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

      {/* ── PAGE 2: About the Professional ── */}
      <PageDivider pageNum={2} label="על הבודק" />
      <View style={styles.pdfSection}>
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

      {/* ── PAGES 3+: One page per issue ── */}
      {issues.map((issue, i) => (
        <React.Fragment key={issue.id}>
          <PageDivider pageNum={3 + i} label={issue.issueLabel} />

          {/* Issue description */}
          <View style={styles.pdfSection}>
            <SectionTitle num={3 + i} label={issue.issueLabel} />
            <Text style={styles.pdfBody}>
              {issue.aiSummary || issue.description || issue.issueNote || 'לא צוין תיאור מפורט.'}
            </Text>
            {!!issue.issueNote && !issue.aiSummary && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.metaItemLabel}>הערות</Text>
                <Text style={styles.pdfBody}>{issue.issueNote}</Text>
              </View>
            )}
          </View>

          {/* Issue photos */}
          {issue.photos.length > 0 && (
            <View style={styles.pdfSection}>
              <View style={styles.pdfImageGrid}>
                {issue.photos.slice(0, 4).map((uri, j) => (
                  <View key={uri} style={styles.pdfImageCell}>
                    <Image source={{ uri }} style={styles.pdfImage} resizeMode="cover" />
                    <Text style={styles.pdfImageLabel}>{`תמונה ${j + 1}`}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Issue recommendations */}
          {issue.recommendations.length > 0 && (
            <View style={styles.pdfSection}>
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
        </React.Fragment>
      ))}

      {/* ── Legal Disclaimer ── */}
      <PageDivider pageNum={3 + issues.length} label="הצהרה משפטית" />
      <View style={styles.pdfSection}>
        <SectionTitle num={3 + issues.length} label="הגבלת אחריות" />
        <Text style={[styles.pdfBody, styles.disclaimerText]}>{LEGAL_DISCLAIMER}</Text>
      </View>
    </>
  );
}

// ─── Quote sections ───────────────────────────────────────────────────────────

const VAT_RATE = 0.18;

function QuoteContent({ state }: { state: ReturnType<typeof useWizard>['state'] }) {
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

            {/* Totals */}
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

      {/* Validity footer */}
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

function WarrantyContent({ state }: { state: ReturnType<typeof useWizard>['state'] }) {
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

        {/* Numbered conditions list */}
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
  const generated = React.useRef(false);

  const state = wizard.state;
  const docConfig = DOCUMENT_TYPES[state.docType];
  const docTitle = `${docConfig.titlePrefix} ${state.customerName || 'לא צוין'}`;
  const brandInitial = (businessProfile?.business_name ?? businessProfile?.full_name ?? 'ד')[0];

  React.useEffect(() => {
    const documentId = state.documentId;
    if (!documentId || generated.current) return;
    generated.current = true;
    setGeneratingPdf(true);
    generateDocumentPdf(documentId)
      .then((url) => wizard.setPdfUrl(url))
      .catch(() => setPdfError('לא ניתן היה ליצור PDF. ניתן לנסות שוב.'))
      .finally(() => setGeneratingPdf(false));
  }, []);

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
        <View style={styles.pdfPage}>
          {/* ── Header band ── */}
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

          {/* ── Doc-type specific content ── */}
          {state.docType === 'report' && (
            <ReportContent state={state} businessProfile={businessProfile} />
          )}
          {state.docType === 'quote' && <QuoteContent state={state} />}
          {state.docType === 'warranty' && <WarrantyContent state={state} />}

          {/* ── Signature row ── */}
          <View style={[styles.pdfSigRow, { borderTopColor: '#C7C1B6' }]}>
            <View>
              <Svg viewBox="0 0 100 30" width={80} height={24}>
                <Path d="M5 22 Q15 12 25 18 T50 16 Q70 8 90 22" fill="none" stroke="#1B1916" strokeWidth="1" />
              </Svg>
              <Text style={styles.pdfSigName}>
                {[businessProfile?.full_name, businessProfile?.license_number && `ח.פ ${businessProfile.license_number}`]
                  .filter(Boolean)
                  .join(' · ') || 'חתימה'}
              </Text>
            </View>
            <Text style={styles.pdfQrPlaceholder}>QR</Text>
          </View>
        </View>
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
            onPress={onSend}
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

  // PDF page container
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

  // Header
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

  // Page divider
  pageDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 14,
  },
  pageDividerLine: { flex: 1, height: 0.5, backgroundColor: '#C7C1B6' },
  pageDividerBadge: { alignItems: 'center', gap: 1 },
  pageDividerNum: { fontSize: 7, fontWeight: '600', color: '#807A72', letterSpacing: 0.5 },
  pageDividerLabel: { fontSize: 9, fontWeight: '700', color: '#4A4641' },

  // Sections
  pdfSection: { marginBottom: 12 },
  pdfSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
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
  pdfImageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
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

  // Quote item list
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

  // Quote validity
  quoteValidityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#C7C1B6',
  },
  quoteValidityText: { fontSize: 8, color: '#4A4641', fontWeight: '600', textAlign: 'right' },

  // Warranty
  warrantyTermRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 },
  warrantyTermLabel: { fontSize: 8, color: '#807A72', textAlign: 'right' },
  warrantyTermValue: { fontSize: 8, fontWeight: '700', color: '#1B1916' },
  warrantyConditionRow: { flexDirection: 'row-reverse', gap: 5, alignItems: 'flex-start' },
  warrantyConditionNum: { fontSize: 8, fontWeight: '700', color: '#1B1916', minWidth: 14, textAlign: 'right' },
  warrantyConditionText: { fontSize: 8, color: '#1B1916', lineHeight: 13, flex: 1, textAlign: 'right' },

  // Signature
  pdfSigRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 22, paddingTop: 14, borderTopWidth: 0.5,
  },
  pdfSigName: { fontSize: 7, color: '#807A72', marginTop: 2, textAlign: 'right' },
  pdfQrPlaceholder: { fontSize: 7, color: '#807A72', padding: 8, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 4 },

  // Bottom
  bottomRow: { flexDirection: 'row', gap: 10 },
  pdfError: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
});
