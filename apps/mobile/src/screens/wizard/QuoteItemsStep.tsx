import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard, type WizardQuoteItem } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';

const VAT = 0.18;

interface QuoteItemsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

function formatILS(n: number) {
  return `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const EMPTY_FORM = { title: '', description: '', price: '' };

const VALIDITY_PRESETS = ['30 ימים', '60 ימים', '90 ימים', 'אחר'];

export function QuoteItemsStep({ colors = lightColors, onNext, onBack }: QuoteItemsStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();
  const scrollRef = useRef<ScrollView>(null);

  const [items, setItems] = useState<WizardQuoteItem[]>(wizard.state.quoteItems);
  const [notes, setNotes] = useState(wizard.state.quoteNotes);

  const initValidity = wizard.state.quoteValidityDate;
  const isPresetValidity = VALIDITY_PRESETS.slice(0, -1).includes(initValidity);
  const [selectedValidity, setSelectedValidity] = useState(
    initValidity ? (isPresetValidity ? initValidity : 'אחר') : '30 ימים',
  );
  const [customValidity, setCustomValidity] = useState(isPresetValidity || !initValidity ? '' : initValidity);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; price?: string }>({});

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = subtotal * VAT;
  const total = subtotal + vat;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingKey(null);
    setErrors({});
  };

  const handleAddOrUpdate = () => {
    const e: { title?: string; price?: string } = {};
    if (!form.title.trim()) e.title = 'שם העבודה הוא שדה חובה';
    if (!form.price.trim() || isNaN(parseFloat(form.price))) e.price = 'יש להזין מחיר תקין';
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const unitPrice = parseFloat(form.price);

    if (editingKey) {
      setItems((prev) =>
        prev.map((i) =>
          i.key === editingKey
            ? { ...i, title: form.title.trim(), description: form.description.trim(), unitPrice }
            : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          key: `${Date.now()}-${Math.random()}`,
          title: form.title.trim(),
          description: form.description.trim(),
          qty: 1,
          unitPrice,
        },
      ]);
    }
    resetForm();
  };

  const handleEdit = (item: WizardQuoteItem) => {
    setForm({
      title: item.title,
      description: item.description,
      price: item.unitPrice === 0 ? '' : String(item.unitPrice),
    });
    setEditingKey(item.key);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDelete = (key: string) => {
    Alert.alert('מחק פריט', 'האם למחוק פריט זה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => setItems((prev) => prev.filter((i) => i.key !== key)) },
    ]);
  };

  const effectiveValidity =
    selectedValidity === 'אחר' ? (customValidity.trim() || 'אחר') : selectedValidity;

  const handleNext = () => {
    if (items.length === 0) {
      Alert.alert('שגיאה', 'יש להוסיף לפחות פריט עבודה אחד');
      return;
    }
    wizard.setQuoteItems(items);
    wizard.setQuoteNotes(notes);
    wizard.setQuoteValidityDate(effectiveValidity);
    if (onNext) onNext();
    else goNext();
  };

  const isEditing = editingKey !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Header
          step={stepNum}
          ofSteps={stepOf}
          onBack={onBack ?? goBack}
          colors={colors}
          action={
            <Pressable
              onPress={triggerExit}
              style={[styles.exitBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
              hitSlop={6}
            >
              <Icons.home size={20} color={colors.ink2} />
            </Pressable>
          }
        />
        <ProgressBar value={progress} colors={colors} />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
              פירוט עבודות
            </Text>
            <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
              {items.length > 0
                ? `${items.length} פריטים · סה״כ ${formatILS(total)}`
                : 'הוסף את פריטי העבודה להצעת המחיר'}
            </Text>
          </View>

          {/* ── Add / Edit form ── */}
          <View style={[styles.formCard, { backgroundColor: colors.bgElev, borderColor: isEditing ? colors.accent : colors.line }]}>
            {isEditing && (
              <View style={[styles.editBanner, { backgroundColor: colors.accentBg }]}>
                <Icons.edit size={13} color={colors.accent} />
                <Text style={[styles.editBannerText, { color: colors.accent, fontFamily: fonts.sans }]}>
                  עריכת פריט
                </Text>
                <Pressable onPress={resetForm} hitSlop={8} style={styles.editCancelBtn}>
                  <Icons.close size={14} color={colors.accent} />
                </Pressable>
              </View>
            )}

            {/* Title field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
                שם העבודה
              </Text>
              <View style={[
                styles.inputRow,
                { backgroundColor: colors.bg, borderColor: errors.title ? colors.danger : colors.lineStrong },
              ]}>
                <TextInput
                  style={[styles.textInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                  placeholder="לדוגמה: החלפת ברז, בדיקת אינסטלציה…"
                  placeholderTextColor={colors.ink4}
                  value={form.title}
                  onChangeText={(t) => { setForm((f) => ({ ...f, title: t })); if (errors.title) setErrors((e) => ({ ...e, title: undefined })); }}
                  textAlign="right"
                />
              </View>
              {!!errors.title && (
                <Text style={[styles.fieldError, { color: colors.danger, fontFamily: fonts.sans }]}>{errors.title}</Text>
              )}
            </View>

            {/* Description field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
                תיאור מפורט (אופציונלי)
              </Text>
              <View style={[
                styles.inputRow,
                styles.inputRowMulti,
                { backgroundColor: colors.bg, borderColor: colors.lineStrong },
              ]}>
                <TextInput
                  style={[styles.textInput, styles.textInputMulti, { color: colors.ink1, fontFamily: fonts.sans }]}
                  placeholder="פרט את היקף העבודה, חומרים, הערות…"
                  placeholderTextColor={colors.ink4}
                  value={form.description}
                  onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
                  multiline
                  textAlignVertical="top"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Price field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
                מחיר (₪)
              </Text>
              <View style={[
                styles.inputRow,
                { backgroundColor: colors.bg, borderColor: errors.price ? colors.danger : colors.lineStrong },
              ]}>
                <Text style={[styles.currencyPrefix, { color: colors.ink3, fontFamily: fonts.sans }]}>₪</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                  placeholder="0"
                  placeholderTextColor={colors.ink4}
                  keyboardType="decimal-pad"
                  value={form.price}
                  onChangeText={(t) => { setForm((f) => ({ ...f, price: t })); if (errors.price) setErrors((e) => ({ ...e, price: undefined })); }}
                  textAlign="right"
                />
              </View>
              {!!errors.price && (
                <Text style={[styles.fieldError, { color: colors.danger, fontFamily: fonts.sans }]}>{errors.price}</Text>
              )}
            </View>

            <Pressable
              onPress={handleAddOrUpdate}
              style={[styles.addBtn, { backgroundColor: colors.ink1 }]}
            >
              {isEditing
                ? <Icons.edit size={18} color={colors.bg} />
                : <Icons.plus size={18} color={colors.bg} />
              }
              <Text style={[styles.addBtnText, { color: colors.bg, fontFamily: fonts.sans }]}>
                {isEditing ? 'עדכן פריט' : 'הוסף פריט'}
              </Text>
            </Pressable>
          </View>

          {/* ── Items list ── */}
          {items.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionHeader, { color: colors.ink2, fontFamily: fonts.sans }]}>
                הפריטים שלך
              </Text>
              <View style={styles.itemList}>
                {items.map((item, idx) => (
                  <View
                    key={item.key}
                    style={[
                      styles.itemCard,
                      { backgroundColor: colors.bgElev, borderColor: editingKey === item.key ? colors.accent : colors.line },
                    ]}
                  >
                    {/* Number + title + price */}
                    <View style={styles.itemTopRow}>
                      <View style={[styles.itemNumBadge, { backgroundColor: colors.ink1 }]}>
                        <Text style={[styles.itemNumText, { color: colors.bg, fontFamily: fonts.sans }]}>
                          {idx + 1}
                        </Text>
                      </View>
                      <Text style={[styles.itemTitle, { color: colors.ink1, fontFamily: fonts.sans }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.itemPrice, { color: colors.ink1, fontFamily: fonts.sans }]}>
                        {formatILS(item.unitPrice)}
                      </Text>
                    </View>

                    {/* Description */}
                    {!!item.description && (
                      <Text
                        style={[styles.itemDesc, { color: colors.ink3, fontFamily: fonts.sans }]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}

                    {/* Action row */}
                    <View style={[styles.itemActions, { borderTopColor: colors.line }]}>
                      <Pressable
                        onPress={() => handleEdit(item)}
                        style={[styles.actionBtn, { backgroundColor: colors.bgSunken }]}
                        hitSlop={4}
                      >
                        <Icons.edit size={14} color={colors.ink2} />
                        <Text style={[styles.actionBtnText, { color: colors.ink2, fontFamily: fonts.sans }]}>ערוך</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(item.key)}
                        style={[styles.actionBtn, { backgroundColor: colors.bgSunken }]}
                        hitSlop={4}
                      >
                        <Icons.trash size={14} color={colors.danger} />
                        <Text style={[styles.actionBtnText, { color: colors.danger, fontFamily: fonts.sans }]}>מחק</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Totals ── */}
          {items.length > 0 && (
            <View style={[styles.totalsCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>סכום לפני מע״מ</Text>
                <Text style={[styles.totalValue, { color: colors.ink1, fontFamily: fonts.sans }]}>{formatILS(subtotal)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowMid]}>
                <Text style={[styles.totalLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>מע״מ (18%)</Text>
                <Text style={[styles.totalValue, { color: colors.ink3, fontFamily: fonts.sans }]}>{formatILS(vat)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal, { borderTopColor: colors.line }]}>
                <Text style={[styles.totalLabelBig, { color: colors.ink1, fontFamily: fonts.sans }]}>סה״כ לתשלום</Text>
                <Text style={[styles.totalValueBig, { color: colors.accent, fontFamily: fonts.sans }]}>{formatILS(total)}</Text>
              </View>
            </View>
          )}

          {/* ── Quote validity ── */}
          <View style={[styles.validityWrap, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans, marginBottom: 10 }]}>
              תוקף ההצעה
            </Text>
            <View style={styles.validityRow}>
              {VALIDITY_PRESETS.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setSelectedValidity(v)}
                  style={[
                    styles.validityPill,
                    {
                      backgroundColor: selectedValidity === v ? colors.ink1 : colors.bg,
                      borderColor: selectedValidity === v ? colors.ink1 : colors.lineStrong,
                    },
                  ]}
                >
                  <Text style={[
                    styles.validityPillText,
                    { color: selectedValidity === v ? colors.bg : colors.ink1, fontFamily: fonts.sans },
                  ]}>
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
            {selectedValidity === 'אחר' && (
              <View style={[styles.inputRow, { marginTop: 8, backgroundColor: colors.bg, borderColor: colors.lineStrong }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                  placeholder="לדוגמה: 45 ימים, עד 01/07/2025…"
                  placeholderTextColor={colors.ink4}
                  value={customValidity}
                  onChangeText={setCustomValidity}
                  textAlign="right"
                />
              </View>
            )}
          </View>

          {/* ── Notes ── */}
          <View style={[styles.notesWrap, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans, marginBottom: 8 }]}>
              הערות להצעה (אופציונלי)
            </Text>
            <View style={[styles.inputRow, styles.inputRowMulti, { backgroundColor: colors.bg, borderColor: colors.lineStrong }]}>
              <TextInput
                style={[styles.textInput, styles.textInputMulti, { color: colors.ink1, fontFamily: fonts.sans }]}
                placeholder="תנאי תשלום, ערות נוספות…"
                placeholderTextColor={colors.ink4}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
                textAlign="right"
              />
            </View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 16 },

  titleBlock: { gap: 6 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },

  // Form card
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBannerText: { fontSize: 13, fontWeight: '700', flex: 1 },
  editCancelBtn: { marginStart: 'auto' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', paddingHorizontal: 2 },
  fieldError: { fontSize: 12, paddingHorizontal: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputRowMulti: {
    minHeight: 90,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textInput: { flex: 1, fontSize: 15, padding: 0 },
  textInputMulti: { minHeight: 66 },
  currencyPrefix: { fontSize: 16, fontWeight: '600', marginEnd: 6 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addBtnText: { fontSize: 15, fontWeight: '700' },

  // Section
  section: { gap: 10 },
  sectionHeader: { fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },

  // Item cards
  itemList: { gap: 8 },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  itemNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemNumText: { fontSize: 11, fontWeight: '700' },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  itemPrice: { fontSize: 15, fontWeight: '800', flexShrink: 0 },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  // Totals
  totalsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  totalRowMid: { paddingBottom: 8 },
  totalRowFinal: { borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: '600' },
  totalLabelBig: { fontSize: 16, fontWeight: '700' },
  totalValueBig: { fontSize: 20, fontWeight: '800' },

  // Exit button
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Validity
  validityWrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  validityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  validityPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  validityPillText: { fontSize: 13, fontWeight: '600' },

  // Notes
  notesWrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
});
