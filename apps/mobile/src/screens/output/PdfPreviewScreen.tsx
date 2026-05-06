import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Header, FixedBottom } from '@/components/layout';
import { Button } from '@/components/primitives';
import { DamageImage } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface PdfPreviewScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onSend?: () => void;
}

const RECOMMENDATIONS_PDF = [
  { num: '1', priority: 'מיידי', title: 'ניתוק מים מקומי' },
  { num: '2', priority: '48 שעות', title: 'פתיחת קיר ובדיקה' },
  { num: '3', priority: 'שבועיים', title: 'איטום וטיפול בקיר' },
];

export function PdfPreviewScreen({ colors = lightColors, onBack, onSend }: PdfPreviewScreenProps) {
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
        {/* PDF page */}
        <View style={styles.pdfPage}>
          {/* Header band */}
          <View style={[styles.pdfHeader, { borderBottomColor: '#1B1916' }]}>
            <View>
              <Text style={styles.pdfDocTitle}>דוח גילוי נזילה</Text>
              <Text style={styles.pdfDocRef}>#2026-0428 · 6 במאי 2026</Text>
            </View>
            <View style={styles.pdfBrandSide}>
              <View style={styles.pdfBrandMark}>
                <Text style={styles.pdfBrandLetter}>ד</Text>
              </View>
              <Text style={styles.pdfBrandName}>כהן גילוי נזילות</Text>
              <Text style={styles.pdfTaxId}>ח.פ 514283746</Text>
            </View>
          </View>

          {/* Customer + property */}
          <View style={styles.pdfMetaRow}>
            <View style={styles.pdfMetaCol}>
              <Text style={styles.pdfMetaLabel}>לקוח</Text>
              <Text style={styles.pdfMetaValue}>אבי כהן</Text>
              <Text style={styles.pdfMetaSub}>052-2837461</Text>
            </View>
            <View style={styles.pdfMetaCol}>
              <Text style={styles.pdfMetaLabel}>נכס</Text>
              <Text style={styles.pdfMetaValue}>הרצל 47, הרצליה</Text>
              <Text style={styles.pdfMetaSub}>דירה · 4 חדרים</Text>
            </View>
          </View>

          {/* Section 1 */}
          <View style={styles.pdfSection}>
            <View style={styles.pdfSectionTitle}>
              <View style={styles.pdfSectionLine} />
              <Text style={styles.pdfSectionLabel}>1. ממצאי הביקור</Text>
            </View>
            <Text style={styles.pdfBody}>
              במהלך הביקור התגלתה נזילה פעילה בקיר המערבי של חדר השינה, ליד החלון. כתם רטיבות בקוטר כ-40 ס״מ עם סימני התקלפות צבע. בבדיקה תרמית זוהה הפרש טמפרטורה של 4.2°C לעומת השטחים הסמוכים.
            </Text>
          </View>

          {/* Image gallery */}
          <View style={styles.pdfImageRow}>
            <View style={styles.pdfImageHalf}>
              <DamageImage kind="leak" height={70} />
              <Text style={styles.pdfImageLabel}>1.1</Text>
            </View>
            <View style={styles.pdfImageHalf}>
              <DamageImage kind="moisture" height={70} />
              <Text style={styles.pdfImageLabel}>1.2</Text>
            </View>
          </View>

          {/* Section 2 */}
          <View style={styles.pdfSection}>
            <View style={styles.pdfSectionTitle}>
              <View style={styles.pdfSectionLine} />
              <Text style={styles.pdfSectionLabel}>2. ניתוח הסיבה</Text>
            </View>
            <Text style={styles.pdfBody}>
              מקור הנזילה אותר בצנרת ראשית בקומה העליונה. דליפה איטית הגורמת להצטברות לחות בקירות הגבס. ההפרש התרמי וצורת ההתפשטות תואמים לצינור מים חמים סדוק.
            </Text>
          </View>

          {/* Section 3 */}
          <View style={styles.pdfSection}>
            <View style={styles.pdfSectionTitle}>
              <View style={styles.pdfSectionLine} />
              <Text style={styles.pdfSectionLabel}>3. המלצות</Text>
            </View>
            {RECOMMENDATIONS_PDF.map((r, i) => (
              <View key={i} style={[styles.pdfRecRow, i < RECOMMENDATIONS_PDF.length - 1 && styles.pdfRecBorder]}>
                <Text style={styles.pdfRecNum}>{r.num}</Text>
                <View style={styles.pdfRecPill}>
                  <Text style={styles.pdfRecPillText}>{r.priority}</Text>
                </View>
                <Text style={styles.pdfRecTitle}>{r.title}</Text>
              </View>
            ))}
          </View>

          {/* Signature row */}
          <View style={[styles.pdfSigRow, { borderTopColor: '#C7C1B6' }]}>
            <View>
              <Svg viewBox="0 0 100 30" width={80} height={24}>
                <Path d="M5 22 Q15 12 25 18 T50 16 Q70 8 90 22" fill="none" stroke="#1B1916" strokeWidth="1" />
              </Svg>
              <Text style={styles.pdfSigName}>דניאל כהן · בודק מוסמך</Text>
            </View>
            <Text style={styles.pdfQrPlaceholder}>QR</Text>
          </View>
        </View>

        {/* Page indicator */}
        <View style={styles.pageIndicator}>
          <View style={[styles.pageDot, { backgroundColor: colors.ink1 }]} />
          <View style={[styles.pageDot, { backgroundColor: colors.ink4 }]} />
          <View style={[styles.pageDot, { backgroundColor: colors.ink4 }]} />
          <Text style={[styles.pageCount, { color: colors.ink3, fontFamily: fonts.sans }]}>
            1 מתוך 3
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <View style={styles.bottomRow}>
          <Button kind="ghost" size="lg" icon={<Icons.edit size={18} color={colors.ink1} />} colors={colors}>
            ערוך
          </Button>
          <Button kind="primary" size="lg" full onPress={onSend} colors={colors}>
            שלח ללקוח
          </Button>
        </View>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 14,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  pdfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    marginBottom: 14,
  },
  pdfDocTitle: { fontFamily: fonts.serif, fontSize: 18, fontWeight: '700', color: '#1B1916', letterSpacing: -0.4 },
  pdfDocRef: { fontSize: 8, color: '#4A4641', marginTop: 4, letterSpacing: 0.5, fontFamily: 'monospace' },
  pdfBrandSide: { alignItems: 'flex-end' },
  pdfBrandMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1B1916',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pdfBrandLetter: { color: '#F5F3EE', fontFamily: fonts.serif, fontSize: 18, fontWeight: '700' },
  pdfBrandName: { fontSize: 8, fontWeight: '600', color: '#1B1916' },
  pdfTaxId: { fontSize: 7, color: '#807A72' },
  pdfMetaRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  pdfMetaCol: { flex: 1 },
  pdfMetaLabel: { fontSize: 7, color: '#807A72', textTransform: 'uppercase', letterSpacing: 0.5 },
  pdfMetaValue: { fontSize: 9, fontWeight: '700', color: '#1B1916', marginTop: 2 },
  pdfMetaSub: { fontSize: 8, color: '#4A4641' },
  pdfSection: { marginBottom: 14 },
  pdfSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  pdfSectionLine: { width: 12, height: 1, backgroundColor: '#1B1916' },
  pdfSectionLabel: { fontFamily: fonts.serif, fontSize: 12, fontWeight: '700', color: '#1B1916' },
  pdfBody: { fontSize: 9.5, color: '#1B1916', lineHeight: 14 },
  pdfImageRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  pdfImageHalf: { flex: 1 },
  pdfImageLabel: { fontSize: 8, color: '#807A72', textAlign: 'center', marginTop: 3 },
  pdfRecRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  pdfRecBorder: { borderBottomWidth: 0.5, borderBottomColor: '#E5E5E5' },
  pdfRecNum: { fontSize: 8, fontWeight: '700', width: 20 },
  pdfRecPill: { backgroundColor: '#F8E9DF', borderRadius: 4, paddingVertical: 1, paddingHorizontal: 5 },
  pdfRecPillText: { fontSize: 7, fontWeight: '700', color: '#A04E2D' },
  pdfRecTitle: { fontSize: 8, color: '#1B1916', flex: 1 },
  pdfSigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 0.5,
  },
  pdfSigName: { fontSize: 7, color: '#807A72', marginTop: 2 },
  pdfQrPlaceholder: { fontSize: 7, color: '#807A72', padding: 8, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 4 },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pageDot: { width: 6, height: 6, borderRadius: 3 },
  pageCount: { fontSize: 12, marginStart: 6 },
  bottomRow: { flexDirection: 'row', gap: 10 },
});
