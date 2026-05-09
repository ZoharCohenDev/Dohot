import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface QuoteScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
}

const ITEMS = [
  { title: 'בדיקת לחץ ואיתור מקור', qty: 1, price: 850 },
  { title: 'פתיחת קיר 30×30 ס״מ', qty: 1, price: 480 },
  { title: 'החלפת קטע צנרת', qty: 2, price: 320 },
  { title: 'איטום וטיוח', qty: 1, price: 920 },
  { title: 'צביעה בגוון תואם', qty: 1, price: 480 },
];

const VAT_RATE = 0.18;

export function QuoteScreen({ colors = lightColors, onBack }: QuoteScreenProps) {
  const subtotal = ITEMS.reduce((s, it) => s + it.qty * it.price, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        large
        title="הצעת מחיר"
        subtitle="#Q-2026-118 · אבי כהן"
        onBack={onBack}
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Items card */}
        <Card padding={0} colors={colors} style={{ overflow: 'hidden' }}>
          <View style={[styles.cardHeaderRow, { borderBottomColor: colors.line }]}>
            <Text style={[styles.cardHeaderText, { color: colors.ink1, fontFamily: fonts.sans }]}>
              פירוט עבודה
            </Text>
            <Button kind="ghost" size="sm" icon={<Icons.plus size={14} color={colors.ink1} />} colors={colors}>
              פריט
            </Button>
          </View>
          {ITEMS.map((item, i) => (
            <View
              key={i}
              style={[
                styles.itemRow,
                i < ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                  {item.title}
                </Text>
                <Text style={[styles.itemSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  כמות {item.qty} · ₪{item.price}/יח׳
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.ink1, fontFamily: fonts.sans }]}>
                ₪{(item.qty * item.price).toLocaleString()}
              </Text>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <Card padding={18} colors={colors}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              סך עבודה
            </Text>
            <Text style={[styles.totalValue, { color: colors.ink1, fontFamily: fonts.sans }]}>
              ₪{subtotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              מע״מ 18%
            </Text>
            <Text style={[styles.totalValue, { color: colors.ink1, fontFamily: fonts.sans }]}>
              ₪{vat.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabelBold, { color: colors.ink1, fontFamily: fonts.sans }]}>
              סה״כ לתשלום
            </Text>
            <Text style={[styles.grandTotal, { color: colors.ink1, fontFamily: fonts.serif }]}>
              ₪{total.toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* Validity */}
        <View style={[styles.validity, { backgroundColor: colors.bgSunken }]}>
          <Icons.calendar size={18} color={colors.ink2} />
          <Text style={[styles.validityText, { color: colors.ink2, fontFamily: fonts.sans }]}>
            ההצעה בתוקף עד <Text style={{ fontWeight: '700' }}>13 במאי 2026</Text> (7 ימים)
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <View style={styles.bottomRow}>
          <Button kind="ghost" size="lg" icon={<Icons.edit size={18} color={colors.ink1} />} colors={colors}>
            ערוך
          </Button>
          <Button kind="accent" size="lg" full iconRight={<Icons.send size={18} color="#fff" />} colors={colors}>
            שלח הצעה
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
    paddingHorizontal: 20,
    paddingBottom: 200,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  cardHeaderText: { fontSize: 13, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 12, marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: { fontSize: 14 },
  totalLabelBold: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 14 },
  grandTotal: { fontSize: 24, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  validity: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  validityText: { fontSize: 13, flex: 1 },
  bottomRow: { flexDirection: 'row', gap: 10 },
});
