import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';

interface WaPriceStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function WaPriceStep({ colors = lightColors, onNext, onBack }: WaPriceStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();

  const [price, setPrice] = useState(wizard.state.waTotalPrice);

  const formatted = price.trim()
    ? `₪${Number(price.replace(/[^\d.]/g, '')).toLocaleString('he-IL')}`
    : '';

  const handleNext = () => {
    wizard.setWaTotalPrice(price.trim());
    if (onNext) onNext();
    else goNext();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            מחיר כולל
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הזן את המחיר הסופי הכולל של העבודה
          </Text>

          {/* Price input */}
          <View style={[styles.priceCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Text style={[styles.priceLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>
              סה״כ לתשלום (₪)
            </Text>
            <View style={styles.priceInputRow}>
              <Text style={[styles.priceCurrency, { color: colors.ink2, fontFamily: fonts.sans }]}>₪</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor={colors.ink4}
                keyboardType="numeric"
                textAlign="right"
                autoFocus
              />
            </View>
            {!!formatted && price.trim() !== '' && (
              <View style={[styles.formattedRow, { borderTopColor: colors.line }]}>
                <Text style={[styles.formattedLabel, { color: colors.ink4, fontFamily: fonts.sans }]}>
                  בכתב:
                </Text>
                <Text style={[styles.formattedValue, { color: colors.ink2, fontFamily: fonts.sans }]}>
                  {formatted}
                </Text>
              </View>
            )}
          </View>

          {/* Work items summary */}
          {wizard.state.waWorkItems.filter(i => i.title.trim()).length > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
              <Text style={[styles.summaryTitle, { color: colors.ink2, fontFamily: fonts.sans }]}>
                עבודות שנכללות במחיר
              </Text>
              {wizard.state.waWorkItems
                .filter(i => i.title.trim())
                .map((item, idx) => (
                  <View key={item.id} style={styles.summaryItem}>
                    <Text style={[styles.summaryNum, { color: colors.ink4, fontFamily: fonts.sans }]}>
                      {idx + 1}.
                    </Text>
                    <Text style={[styles.summaryText, { color: colors.ink1, fontFamily: fonts.sans }]}>
                      {item.title}
                    </Text>
                  </View>
                ))}
            </View>
          )}
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
            המשך לתנאי תשלום
          </Button>
        </FixedBottom>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6, textAlign: 'right' },
  subtitle: { fontSize: 14, textAlign: 'right' },
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  priceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  priceLabel: { fontSize: 12, fontWeight: '600', textAlign: 'right', marginBottom: 12 },
  priceInputRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  priceCurrency: { fontSize: 32, fontWeight: '600' },
  priceInput: { flex: 1, fontSize: 40, fontWeight: '700', textAlign: 'right', padding: 0 },
  formattedRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  formattedLabel: { fontSize: 11 },
  formattedValue: { fontSize: 13, fontWeight: '600' },

  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  summaryItem: { flexDirection: 'row-reverse', gap: 8, alignItems: 'flex-start' },
  summaryNum: { fontSize: 12, fontWeight: '700', minWidth: 18, textAlign: 'right' },
  summaryText: { flex: 1, fontSize: 13, lineHeight: 18, textAlign: 'right' },
});
