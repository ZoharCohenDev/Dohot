import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Alert,
} from 'react-native';
import { Header, ProgressBar, KeyboardAwareFormLayout } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard, type WaPaymentTerm } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';

interface WaPaymentStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function WaPaymentStep({ colors = lightColors, onNext, onBack }: WaPaymentStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();

  const terms = wizard.state.waPaymentTerms;
  const setTerms = wizard.setWaPaymentTerms;

  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const id = `${Date.now()}`;
    setTerms([...terms, { id, text: trimmed }]);
    setNewText('');
  };

  const handleStartEdit = (term: WaPaymentTerm) => {
    setEditingId(term.id);
    setEditText(term.text);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed) {
      setTerms(terms.map(t => t.id === editingId ? { ...t, text: trimmed } : t));
    }
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('מחיקת תנאי', 'האם למחוק תנאי תשלום זה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => setTerms(terms.filter(t => t.id !== id)),
      },
    ]);
  };

  const handleNext = () => {
    if (onNext) onNext();
    else goNext();
  };

  return (
    <KeyboardAwareFormLayout
      colors={colors}
      header={
        <>
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
        </>
      }
      contentContainerStyle={styles.content}
      bottomAction={
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
      }
    >
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            תנאי תשלום
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הוסף את תנאי התשלום להסכם
          </Text>

          {/* Terms list */}
          <View style={[styles.list, { borderColor: colors.line, backgroundColor: colors.bgElev }]}>
            {terms.map((term, idx) => (
              <View
                key={term.id}
                style={[
                  styles.termRow,
                  idx < terms.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
                ]}
              >
                {editingId === term.id ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.editInput, { color: colors.ink1, fontFamily: fonts.sans, borderColor: colors.line, backgroundColor: colors.bg }]}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      textAlign="right"
                      autoFocus
                    />
                    <Pressable
                      onPress={handleSaveEdit}
                      style={[styles.saveBtn, { backgroundColor: colors.ink1 }]}
                      hitSlop={4}
                    >
                      <Icons.check size={14} color={colors.bg} stroke={3} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.displayRow}>
                    <View style={[styles.termNum, { backgroundColor: colors.bgSunken }]}>
                      <Text style={[styles.termNumText, { color: colors.ink3, fontFamily: fonts.sans }]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={[styles.termText, { color: colors.ink1, fontFamily: fonts.sans }]}>
                      {term.text}
                    </Text>
                    <View style={styles.termActions}>
                      <Pressable onPress={() => handleStartEdit(term)} hitSlop={8}>
                        <Icons.edit size={16} color={colors.ink3} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(term.id)} hitSlop={8}>
                        <Icons.trash size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Add term */}
            <View style={[styles.addRow, { borderTopWidth: terms.length > 0 ? 1 : 0, borderTopColor: colors.line }]}>
              <TextInput
                style={[styles.addInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                placeholder="הוסף תנאי תשלום…"
                placeholderTextColor={colors.ink4}
                value={newText}
                onChangeText={setNewText}
                textAlign="right"
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAdd}
                style={[styles.addBtn, { backgroundColor: newText.trim() ? colors.ink1 : colors.bgSunken }]}
                hitSlop={4}
              >
                <Icons.plus size={16} color={newText.trim() ? colors.bg : colors.ink4} />
              </Pressable>
            </View>
          </View>

          {/* Price summary */}
          {!!wizard.state.waTotalPrice && (
            <View style={[styles.priceSummary, { backgroundColor: colors.aiBg, borderColor: 'rgba(90,135,112,0.2)' }]}>
              <Text style={[styles.priceSummaryLabel, { color: colors.ai2, fontFamily: fonts.sans }]}>
                סה״כ לתשלום:
              </Text>
              <Text style={[styles.priceSummaryValue, { color: colors.ai2, fontFamily: fonts.sans }]}>
                ₪{wizard.state.waTotalPrice}
              </Text>
            </View>
          )}
    </KeyboardAwareFormLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6, textAlign: 'right' },
  subtitle: { fontSize: 14, textAlign: 'right' },
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  list: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  termRow: { paddingHorizontal: 14, paddingVertical: 12 },
  displayRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  termNum: {
    width: 22, height: 22, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  termNumText: { fontSize: 11, fontWeight: '700' },
  termText: { flex: 1, fontSize: 13, lineHeight: 18, textAlign: 'right' },
  termActions: { flexDirection: 'row-reverse', gap: 14, flexShrink: 0, paddingTop: 2 },

  editRow: { flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start' },
  editInput: {
    flex: 1, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, lineHeight: 18, minHeight: 56,
  },
  saveBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },

  addRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  addInput: { flex: 1, fontSize: 13, padding: 0 },
  addBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  priceSummary: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  priceSummaryLabel: { fontSize: 13, fontWeight: '700' },
  priceSummaryValue: { fontSize: 18, fontWeight: '700' },
});
