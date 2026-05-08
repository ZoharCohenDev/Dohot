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

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ num, label }: { num: number; label: string }) {
  return (
    <View style={styles.pdfSectionTitle}>
      <View style={styles.pdfSectionLine} />
      <Text style={styles.pdfSectionLabel}>{`${num}. ${label}`}</Text>
    </View>
  );
}

// ─── Report sections ──────────────────────────────────────────────────────────

function ReportContent({ state }: { state: ReturnType<typeof useWizard>['state'] }) {
  let sectionNum = 1;
  return (
    <>
      {/* Findings */}
      <View style={styles.pdfSection}>
        <SectionTitle num={sectionNum++} label="ממצאי הביקור" />
        {state.issueLabel ? (
          <Text style={styles.pdfBody}>
            <Text style={{ fontWeight: '700' }}>{state.issueLabel}</Text>
            {state.issueNote ? `\n${state.issueNote}` : ''}
          </Text>
        ) : (
          <Text style={styles.pdfBody}>לא צוינו ממצאים.</Text>
        )}
      </View>

      {/* Photos */}
      {state.photos.length > 0 && (
        <View style={styles.pdfImageGrid}>
          {state.photos.slice(0, 4).map((uri, i) => (
            <View key={uri} style={styles.pdfImageCell}>
              <Image source={{ uri }} style={styles.pdfImage} resizeMode="cover" />
              <Text style={styles.pdfImageLabel}>{`${i + 1}.${(i + 1)}`}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI analysis */}
      {!!state.aiSummary && (
        <View style={styles.pdfSection}>
          <SectionTitle num={sectionNum++} label="ניתוח הסיבה" />
          <Text style={styles.pdfBody}>{state.aiSummary}</Text>
        </View>
      )}

      {/* Recommendations */}
      {state.recommendations.length > 0 && (
        <View style={styles.pdfSection}>
          <SectionTitle num={sectionNum++} label="המלצות" />
          {state.recommendations.map((r: Recommendation, i: number) => (
            <View
              key={i}
              style={[styles.pdfRecRow, i < state.recommendations.length - 1 && styles.pdfRecBorder]}
            >
              <Text style={styles.pdfRecNum}>{`${i + 1}`}</Text>
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

      {/* Voice notes */}
      {!!state.voiceTranscript && (
        <View style={styles.pdfSection}>
          <SectionTitle num={sectionNum++} label="הערות שטח" />
          <Text style={styles.pdfBody}>{state.voiceTranscript}</Text>
        </View>
      )}
    </>
  );
}

// ─── Quote sections ───────────────────────────────────────────────────────────

function QuoteContent({ state }: { state: ReturnType<typeof useWizard>['state'] }) {
  const subtotal = state.quoteItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = Math.round(subtotal * 0.17);
  const total = subtotal + vat;

  return (
    <View style={styles.pdfSection}>
      <SectionTitle num={1} label="פירוט עבודות" />
      {state.quoteItems.length === 0 ? (
        <Text style={styles.pdfBody}>לא הוזנו פריטים.</Text>
      ) : (
        <>
          {/* Header row */}
          <View style={[styles.quoteRow, styles.quoteHeaderRow]}>
            <Text style={[styles.quoteCell, styles.quoteCellFlex, styles.quoteCellHeader]}>תיאור עבודה</Text>
            <Text style={[styles.quoteCell, styles.quoteCellNarrow, styles.quoteCellHeader]}>מחיר</Text>
          </View>
          {state.quoteItems.map((item, i) => (
            <View key={item.key} style={[styles.quoteRow, i % 2 === 1 && styles.quoteRowAlt]}>
              <View style={[styles.quoteCellFlex]}>
                <Text style={styles.quoteCell}>{item.title}</Text>
                {!!item.description && (
                  <Text style={[styles.quoteCell, { color: '#807A72', fontSize: 7, marginTop: 1 }]}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Text style={[styles.quoteCell, styles.quoteCellNarrow]}>₪{item.unitPrice.toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.quoteTotals}>
            <View style={styles.quoteTotalRow}>
              <Text style={styles.quoteTotalLabel}>סכום לפני מע״מ</Text>
              <Text style={styles.quoteTotalValue}>₪{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.quoteTotalRow}>
              <Text style={styles.quoteTotalLabel}>מע״מ (17%)</Text>
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
          <Text style={[styles.pdfMetaLabel, { marginBottom: 3 }]}>הערות</Text>
          <Text style={styles.pdfBody}>{state.quoteNotes}</Text>
        </View>
      )}
    </View>
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
      {state.photos.length > 0 && (
        <View style={styles.pdfImageGrid}>
          {state.photos.slice(0, 4).map((uri, i) => (
            <View key={uri} style={styles.pdfImageCell}>
              <Image source={{ uri }} style={styles.pdfImage} resizeMode="cover" />
              <Text style={styles.pdfImageLabel}>{`${i + 1}.${(i + 1)}`}</Text>
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
        {!!state.warrantyConditions && (
          <Text style={[styles.pdfBody, { marginTop: 6 }]}>{state.warrantyConditions}</Text>
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
  const address = buildAddress(state);
  const propType = propertyLabel(state.propertyType);
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

          {/* ── Customer + property ── */}
          <View style={styles.pdfMetaRow}>
            <View style={styles.pdfMetaCol}>
              <Text style={styles.pdfMetaLabel}>לקוח</Text>
              <Text style={styles.pdfMetaValue}>{state.customerName || '—'}</Text>
              {!!state.customerPhone && <Text style={styles.pdfMetaSub}>{state.customerPhone}</Text>}
              {!!state.customerEmail && <Text style={styles.pdfMetaSub}>{state.customerEmail}</Text>}
            </View>
            <View style={styles.pdfMetaCol}>
              <Text style={styles.pdfMetaLabel}>נכס</Text>
              {address ? (
                <Text style={styles.pdfMetaValue}>{address}</Text>
              ) : (
                <Text style={styles.pdfMetaValue}>—</Text>
              )}
              <Text style={styles.pdfMetaSub}>{propType}</Text>
            </View>
          </View>

          {/* ── Doc-type specific content ── */}
          {state.docType === 'report' && <ReportContent state={state} />}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    marginBottom: 14,
    gap: 10,
  },
  pdfDocTitle: { fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', color: '#1B1916', letterSpacing: -0.3 },
  pdfDocRef: { fontSize: 8, color: '#4A4641', marginTop: 4, letterSpacing: 0.5 },
  pdfBrandSide: { alignItems: 'flex-end', minWidth: 70, maxWidth: 100 },
  pdfBrandMark: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: '#1B1916',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  pdfBrandLetter: { color: '#F5F3EE', fontFamily: fonts.serif, fontSize: 16, fontWeight: '700' },
  pdfBrandName: { fontSize: 8, fontWeight: '600', color: '#1B1916', textAlign: 'right' },
  pdfTaxId: { fontSize: 7, color: '#807A72' },

  // Meta row
  pdfMetaRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  pdfMetaCol: { flex: 1 },
  pdfMetaLabel: { fontSize: 7, color: '#807A72', textTransform: 'uppercase', letterSpacing: 0.5 },
  pdfMetaValue: { fontSize: 9, fontWeight: '700', color: '#1B1916', marginTop: 2 },
  pdfMetaSub: { fontSize: 8, color: '#4A4641' },

  // Sections
  pdfSection: { marginBottom: 14 },
  pdfSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  pdfSectionLine: { width: 12, height: 1, backgroundColor: '#1B1916' },
  pdfSectionLabel: { fontFamily: fonts.serif, fontSize: 11, fontWeight: '700', color: '#1B1916' },
  pdfBody: { fontSize: 9, color: '#1B1916', lineHeight: 14 },

  // Photos
  pdfImageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pdfImageCell: { width: '47%' },
  pdfImage: { width: '100%', height: 80, borderRadius: 6 },
  pdfImageLabel: { fontSize: 8, color: '#807A72', textAlign: 'center', marginTop: 3 },

  // Recommendations
  pdfRecRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 5 },
  pdfRecBorder: { borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  pdfRecNum: { fontSize: 8, fontWeight: '700', width: 14, paddingTop: 1 },
  pdfRecPill: { backgroundColor: '#F8E9DF', borderRadius: 4, paddingVertical: 1, paddingHorizontal: 5, alignSelf: 'flex-start' },
  pdfRecPillText: { fontSize: 7, fontWeight: '700', color: '#A04E2D' },
  pdfRecTitle: { fontSize: 8, fontWeight: '700', color: '#1B1916' },
  pdfRecDesc: { fontSize: 7.5, color: '#4A4641', marginTop: 1 },

  // Quote table
  quoteRow: { flexDirection: 'row', paddingVertical: 4 },
  quoteHeaderRow: { borderBottomWidth: 0.5, borderBottomColor: '#C7C1B6', marginBottom: 2 },
  quoteRowAlt: { backgroundColor: '#F8F7F4' },
  quoteCell: { fontSize: 8, color: '#1B1916', paddingHorizontal: 2 },
  quoteCellFlex: { flex: 1 },
  quoteCellNarrow: { width: 52, textAlign: 'right' },
  quoteCellHeader: { fontWeight: '700', color: '#807A72', fontSize: 7, textTransform: 'uppercase' },
  quoteTotals: { marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#C7C1B6', paddingTop: 6, gap: 3 },
  quoteTotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quoteTotalLabel: { fontSize: 8, color: '#4A4641' },
  quoteTotalValue: { fontSize: 8, color: '#1B1916', fontWeight: '600' },
  quoteTotalFinalRow: { borderTopWidth: 0.5, borderTopColor: '#C7C1B6', paddingTop: 4, marginTop: 2 },
  quoteTotalFinalLabel: { fontSize: 9, fontWeight: '700', color: '#1B1916' },
  quoteTotalFinalValue: { fontSize: 9, fontWeight: '700', color: '#1B1916' },

  // Warranty
  warrantyTermRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  warrantyTermLabel: { fontSize: 8, color: '#807A72' },
  warrantyTermValue: { fontSize: 8, fontWeight: '700', color: '#1B1916' },

  // Signature
  pdfSigRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 22, paddingTop: 14, borderTopWidth: 0.5,
  },
  pdfSigName: { fontSize: 7, color: '#807A72', marginTop: 2 },
  pdfQrPlaceholder: { fontSize: 7, color: '#807A72', padding: 8, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 4 },

  // Bottom
  bottomRow: { flexDirection: 'row', gap: 10 },
  pdfError: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
});
