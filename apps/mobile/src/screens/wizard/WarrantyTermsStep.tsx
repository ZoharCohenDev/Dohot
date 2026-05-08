import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';

const DURATIONS = ['3 חודשים', '6 חודשים', '12 חודשים', '24 חודשים'];

const DEFAULT_CONDITIONS =
  'האחריות חלה על עבודת ההתקנה / התיקון שבוצעה. ' +
  'האחריות אינה חלה על נזקים הנגרמים מכוח עליון, שימוש לרעה או פגיעה מכוונת. ' +
  'תיקונים שנעשו על ידי גורם שלישי מבטלים את האחריות.';

interface WarrantyTermsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function WarrantyTermsStep({ colors = lightColors, onNext, onBack }: WarrantyTermsStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();

  const [duration, setDuration] = useState(wizard.state.warrantyDuration || '12 חודשים');
  const [workDescription, setWorkDescription] = useState(wizard.state.warrantyWorkDescription);
  const [conditions, setConditions] = useState(
    wizard.state.warrantyConditions || DEFAULT_CONDITIONS,
  );

  const handleNext = () => {
    wizard.setWarrantyData(duration, conditions, workDescription);
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
          תנאי האחריות
        </Text>
        <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
          הגדר את תקופת האחריות ותנאי הכיסוי
        </Text>

        {/* Duration picker */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            תקופת האחריות
          </Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDuration(d)}
                style={[
                  styles.durationPill,
                  {
                    backgroundColor: duration === d ? colors.ink1 : colors.bgElev,
                    borderColor: duration === d ? colors.ink1 : colors.line,
                  },
                ]}
              >
                <Text style={[
                  styles.durationLabel,
                  { color: duration === d ? colors.bg : colors.ink1, fontFamily: fonts.sans },
                ]}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Work description */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            תיאור העבודה שבוצעה
          </Text>
          <View style={[styles.textArea, { borderColor: colors.line, backgroundColor: colors.bgElev }]}>
            <TextInput
              style={[styles.textInput, { color: colors.ink1, fontFamily: fonts.sans }]}
              placeholder="תאר את העבודה שבוצעה, החומרים ששימשו והיקף העבודה…"
              placeholderTextColor={colors.ink4}
              value={workDescription}
              onChangeText={setWorkDescription}
              multiline
              textAlign="right"
            />
          </View>
        </View>

        {/* Conditions */}
        <View>
          <View style={styles.conditionsHeader}>
            <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              תנאי האחריות
            </Text>
            <Pressable onPress={() => setConditions(DEFAULT_CONDITIONS)}>
              <Text style={[styles.resetBtn, { color: colors.ai2, fontFamily: fonts.sans }]}>
                אפס לברירת מחדל
              </Text>
            </Pressable>
          </View>
          <View style={[styles.textArea, { borderColor: colors.line, backgroundColor: colors.bgElev }]}>
            <TextInput
              style={[styles.textInput, { color: colors.ink1, fontFamily: fonts.sans }]}
              value={conditions}
              onChangeText={setConditions}
              multiline
              textAlign="right"
            />
          </View>
        </View>

        {/* Preview card */}
        <Card padding={16} colors={colors} style={{ backgroundColor: colors.aiBg, borderWidth: 1, borderColor: 'rgba(90,135,112,0.2)' }}>
          <View style={styles.previewRow}>
            <Icons.shieldCheck size={20} color={colors.ai2} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewTitle, { color: colors.ai2, fontFamily: fonts.sans }]}>
                תקציר האחריות
              </Text>
              <Text style={[styles.previewText, { color: colors.ink2, fontFamily: fonts.sans }]}>
                תקופה: {duration}{workDescription ? `  •  ${workDescription.slice(0, 50)}${workDescription.length > 50 ? '…' : ''}` : ''}
              </Text>
            </View>
          </View>
        </Card>
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
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 18 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationLabel: { fontSize: 14, fontWeight: '600' },
  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  textInput: { fontSize: 14, lineHeight: 22 },
  conditionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resetBtn: { fontSize: 12, fontWeight: '600' },
  previewRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  previewTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  previewText: { fontSize: 12, lineHeight: 18 },
});
