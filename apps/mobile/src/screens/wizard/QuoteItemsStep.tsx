import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert, TextInput,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard, type WizardQuoteItem } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';

const VAT = 0.17;

interface QuoteItemsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

function newItem(): WizardQuoteItem {
  return { key: `${Date.now()}-${Math.random()}`, title: '', qty: 1, unitPrice: 0 };
}

function formatILS(n: number) {
  return `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function QuoteItemsStep({ colors = lightColors, onNext, onBack }: QuoteItemsStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();

  const [items, setItems] = useState<WizardQuoteItem[]>(
    wizard.state.quoteItems.length > 0 ? wizard.state.quoteItems : [newItem()],
  );
  const [notes, setNotes] = useState(wizard.state.quoteNotes);

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const vat = subtotal * VAT;
  const total = subtotal + vat;

  const updateItem = (key: string, patch: Partial<WizardQuoteItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const removeItem = (key: string) => {
    if (items.length === 1) { Alert.alert('', 'חייב להיות לפחות פריט אחד'); return; }
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const handleNext = () => {
    const filled = items.filter((i) => i.title.trim());
    if (filled.length === 0) { Alert.alert('שגיאה', 'יש להוסיף לפחות פריט עבודה אחד'); return; }
    wizard.setQuoteItems(filled);
    wizard.setQuoteNotes(notes);
    if (onNext) onNext();
    else goNext();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={stepNum} ofSteps={stepOf} onBack={onBack ?? goBack} colors={colors} />
      <ProgressBar value={progress} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
          פירוט עבודות
        </Text>
        <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
          הוסף פריטי עבודה עם כמות ומחיר
        </Text>

        {/* Line items */}
        <View style={styles.itemList}>
          {items.map((item, idx) => (
            <Card key={item.key} padding={14} colors={colors}>
              {/* Title row */}
              <View style={styles.itemRow}>
                <View style={[styles.itemNumCircle, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.itemNum, { color: colors.accent, fontFamily: fonts.sans }]}>{idx + 1}</Text>
                </View>
                <TextInput
                  style={[styles.itemTitle, { color: colors.ink1, fontFamily: fonts.sans, flex: 1, borderColor: colors.line }]}
                  placeholder="תיאור עבודה…"
                  placeholderTextColor={colors.ink4}
                  value={item.title}
                  onChangeText={(t) => updateItem(item.key, { title: t })}
                  textAlign="right"
                />
                <Pressable onPress={() => removeItem(item.key)} hitSlop={8}>
                  <Icons.trash size={18} color={colors.danger} />
                </Pressable>
              </View>

              {/* Qty + price row */}
              <View style={styles.itemMeta}>
                <View style={styles.metaField}>
                  <Text style={[styles.metaLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>כמות</Text>
                  <View style={[styles.qtyRow, { borderColor: colors.line }]}>
                    <Pressable onPress={() => updateItem(item.key, { qty: Math.max(1, item.qty - 1) })} hitSlop={8}>
                      <Icons.close size={14} color={colors.ink2} />
                    </Pressable>
                    <Text style={[styles.qtyNum, { color: colors.ink1, fontFamily: fonts.sans }]}>{item.qty}</Text>
                    <Pressable onPress={() => updateItem(item.key, { qty: item.qty + 1 })} hitSlop={8}>
                      <Icons.plus size={14} color={colors.ink2} />
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.metaField, { flex: 1 }]}>
                  <Text style={[styles.metaLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>מחיר ליחידה (₪)</Text>
                  <TextInput
                    style={[styles.priceInput, { color: colors.ink1, fontFamily: fonts.sans, borderColor: colors.line }]}
                    keyboardType="decimal-pad"
                    value={item.unitPrice === 0 ? '' : String(item.unitPrice)}
                    onChangeText={(t) => updateItem(item.key, { unitPrice: parseFloat(t) || 0 })}
                    placeholder="0"
                    placeholderTextColor={colors.ink4}
                    textAlign="right"
                  />
                </View>

                <View style={styles.metaField}>
                  <Text style={[styles.metaLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>סה"כ</Text>
                  <Text style={[styles.lineTotal, { color: colors.ink1, fontFamily: fonts.sans }]}>
                    {formatILS(item.qty * item.unitPrice)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Add item button */}
        <Pressable
          onPress={() => setItems((p) => [...p, newItem()])}
          style={[styles.addBtn, { borderColor: colors.accent, backgroundColor: colors.accentBg }]}
        >
          <Icons.plus size={18} color={colors.accent} />
          <Text style={[styles.addBtnText, { color: colors.accent, fontFamily: fonts.sans }]}>הוסף פריט עבודה</Text>
        </Pressable>

        {/* Totals card */}
        <Card padding={16} colors={colors}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>סכום לפני מע"מ</Text>
            <Text style={[styles.totalValue, { color: colors.ink1, fontFamily: fonts.sans }]}>{formatILS(subtotal)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowMid]}>
            <Text style={[styles.totalLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>מע"מ (17%)</Text>
            <Text style={[styles.totalValue, { color: colors.ink3, fontFamily: fonts.sans }]}>{formatILS(vat)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal, { borderTopColor: colors.line }]}>
            <Text style={[styles.totalLabelBig, { color: colors.ink1, fontFamily: fonts.sans }]}>סה"כ לתשלום</Text>
            <Text style={[styles.totalValueBig, { color: colors.accent, fontFamily: fonts.sans }]}>{formatILS(total)}</Text>
          </View>
        </Card>

        {/* Notes */}
        <View style={[styles.notesWrap, { borderColor: colors.line, backgroundColor: colors.bgElev }]}>
          <Icons.edit size={18} color={colors.ink3} />
          <TextInput
            style={[styles.notesInput, { color: colors.ink1, fontFamily: fonts.sans }]}
            placeholder="הערות להצעה (אופציונלי)…"
            placeholderTextColor={colors.ink4}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlign="right"
          />
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          המשך לתצוגה מקדימה
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  itemList: { gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  itemNumCircle: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  itemNum: { fontSize: 13, fontWeight: '700' },
  itemTitle: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  itemMeta: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  metaField: { gap: 6 },
  metaLabel: { fontSize: 11, fontWeight: '600' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  qtyNum: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  priceInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minWidth: 80,
  },
  lineTotal: { fontSize: 15, fontWeight: '700', paddingVertical: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 15, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  totalRowMid: { paddingBottom: 10 },
  totalRowFinal: { borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: '600' },
  totalLabelBig: { fontSize: 16, fontWeight: '700' },
  totalValueBig: { fontSize: 20, fontWeight: '800' },
  notesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  notesInput: { flex: 1, fontSize: 14, minHeight: 60 },
});
