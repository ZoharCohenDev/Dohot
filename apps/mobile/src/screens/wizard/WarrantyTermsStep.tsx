import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Header, ProgressBar, KeyboardAwareFormLayout } from '@/components/layout';
import { Button, Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';
import { useAuth } from '@/context/AuthContext';

const PRESET_DURATIONS = ['3 חודשים', '6 חודשים', '12 חודשים', '24 חודשים', 'אחר'];

const DEFAULT_CONDITIONS = [
  'האחריות חלה על עבודת ההתקנה / התיקון שבוצעה.',
  'האחריות אינה חלה על נזקים הנגרמים מכוח עליון, שימוש לרעה או פגיעה מכוונת.',
  'תיקונים שנעשו על ידי גורם שלישי מבטלים את האחריות.',
];

interface WarrantyTermsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function WarrantyTermsStep({
  colors = lightColors,
  onNext,
  onBack,
}: WarrantyTermsStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();
  const { businessProfile } = useAuth();

  // Duration
  const initDuration = wizard.state.warrantyDuration || '12 חודשים';
  const isPreset = PRESET_DURATIONS.slice(0, -1).includes(initDuration);
  const [selectedDuration, setSelectedDuration] = useState(isPreset ? initDuration : 'אחר');
  const [customDuration, setCustomDuration] = useState(isPreset ? '' : initDuration);

  // Work description
  const [workDescription, setWorkDescription] = useState(wizard.state.warrantyWorkDescription);

  // Conditions list
  const initConditions =
    wizard.state.warrantyConditions.length > 0
      ? wizard.state.warrantyConditions
      : DEFAULT_CONDITIONS;
  const [conditions, setConditions] = useState<string[]>(initConditions);
  const [newCondition, setNewCondition] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const effectiveDuration =
    selectedDuration === 'אחר' ? customDuration.trim() || 'אחר' : selectedDuration;

  const handleAddCondition = () => {
    const trimmed = newCondition.trim();
    if (!trimmed) return;
    setConditions((prev) => [...prev, trimmed]);
    setNewCondition('');
  };

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditText(conditions[idx] ?? '');
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editText.trim();
    if (trimmed) {
      setConditions((prev) => prev.map((c, i) => (i === editingIndex ? trimmed : c)));
    }
    setEditingIndex(null);
    setEditText('');
  };

  const handleDeleteCondition = (idx: number) => {
    Alert.alert('מחיקת תנאי', 'האם למחוק תנאי זה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => setConditions((prev) => prev.filter((_, i) => i !== idx)),
      },
    ]);
  };

  const handleResetConditions = () => {
    Alert.alert('איפוס תנאים', 'לאפס לתנאי ברירת מחדל?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'אפס', onPress: () => setConditions(DEFAULT_CONDITIONS) },
    ]);
  };

  const handleNext = async () => {
    wizard.setWarrantyData(effectiveDuration, conditions, workDescription);

    if (!businessProfile?.id) {
      Alert.alert('שגיאה', 'לא נמצא פרופיל עסקי. אנא התחבר מחדש.');
      return;
    }

    try {
      await wizard.saveDocument(businessProfile.id, {
        warrantyDuration: effectiveDuration,
        warrantyConditions: conditions,
        warrantyWorkDescription: workDescription,
      });
      if (onNext) onNext();
      else goNext();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן היה לשמור את האחריות. אנא נסה שוב.');
    }
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
                style={[
                  styles.exitBtn,
                  { backgroundColor: colors.bgElev, borderColor: colors.line },
                ]}
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
          disabled={wizard.saving}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          המשך לתצוגה מקדימה
        </Button>
      }
    >
      <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
        תנאי האחריות
      </Text>
      <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
        הגדר את תקופת האחריות ותנאי הכיסוי
      </Text>

      {/* ── Duration picker ── */}
      <View>
        <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
          תקופת האחריות
        </Text>
        <View style={styles.durationGrid}>
          {PRESET_DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setSelectedDuration(d)}
              style={[
                styles.durationPill,
                {
                  backgroundColor: selectedDuration === d ? colors.ink1 : colors.bgElev,
                  borderColor: selectedDuration === d ? colors.ink1 : colors.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.durationLabel,
                  {
                    color: selectedDuration === d ? colors.bg : colors.ink1,
                    fontFamily: fonts.sans,
                  },
                ]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedDuration === 'אחר' && (
          <View
            style={[
              styles.customDurationInput,
              { borderColor: colors.line, backgroundColor: colors.bgElev },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.ink1, fontFamily: fonts.sans }]}
              placeholder="לדוגמה: 18 חודשים, שנתיים…"
              placeholderTextColor={colors.ink4}
              value={customDuration}
              onChangeText={setCustomDuration}
              textAlign="right"
            />
          </View>
        )}
      </View>

      {/* ── Work description ── */}
      <View>
        <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
          תיאור העבודה שבוצעה
        </Text>
        <View
          style={[styles.textArea, { borderColor: colors.line, backgroundColor: colors.bgElev }]}
        >
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

      {/* ── Conditions list ── */}
      <View>
        <View style={styles.conditionsHeader}>
          <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            תנאי האחריות
          </Text>
          <Pressable onPress={handleResetConditions} hitSlop={6}>
            <Text style={[styles.resetBtn, { color: colors.ai2, fontFamily: fonts.sans }]}>
              אפס לברירת מחדל
            </Text>
          </Pressable>
        </View>

        {/* Existing conditions */}
        <View
          style={[
            styles.conditionsList,
            { borderColor: colors.line, backgroundColor: colors.bgElev },
          ]}
        >
          {conditions.map((cond, idx) => (
            <View
              key={idx}
              style={[
                styles.conditionRow,
                idx < conditions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                },
              ]}
            >
              {editingIndex === idx ? (
                /* Edit mode */
                <View style={styles.conditionEditRow}>
                  <TextInput
                    style={[
                      styles.conditionEditInput,
                      {
                        color: colors.ink1,
                        fontFamily: fonts.sans,
                        borderColor: colors.line,
                        backgroundColor: colors.bg,
                      },
                    ]}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    textAlign="right"
                    autoFocus
                  />
                  <Pressable
                    onPress={handleSaveEdit}
                    style={[styles.conditionSaveBtn, { backgroundColor: colors.ink1 }]}
                    hitSlop={4}
                  >
                    <Icons.check size={14} color={colors.bg} stroke={3} />
                  </Pressable>
                </View>
              ) : (
                /* Display mode */
                <View style={styles.conditionDisplayRow}>
                  <View style={[styles.conditionNumBadge, { backgroundColor: colors.bgSunken }]}>
                    <Text
                      style={[styles.conditionNum, { color: colors.ink3, fontFamily: fonts.sans }]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[styles.conditionText, { color: colors.ink1, fontFamily: fonts.sans }]}
                    numberOfLines={3}
                  >
                    {cond}
                  </Text>
                  <View style={styles.conditionActions}>
                    <Pressable onPress={() => handleStartEdit(idx)} hitSlop={8}>
                      <Icons.edit size={16} color={colors.ink3} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteCondition(idx)} hitSlop={8}>
                      <Icons.trash size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Add new condition */}
          <View
            style={[
              styles.addConditionRow,
              { borderTopWidth: conditions.length > 0 ? 1 : 0, borderTopColor: colors.line },
            ]}
          >
            <TextInput
              style={[styles.conditionAddInput, { color: colors.ink1, fontFamily: fonts.sans }]}
              placeholder="הוסף תנאי חדש…"
              placeholderTextColor={colors.ink4}
              value={newCondition}
              onChangeText={setNewCondition}
              textAlign="right"
              onSubmitEditing={handleAddCondition}
              returnKeyType="done"
            />
            <Pressable
              onPress={handleAddCondition}
              style={[
                styles.addConditionBtn,
                { backgroundColor: newCondition.trim() ? colors.ink1 : colors.bgSunken },
              ]}
              hitSlop={4}
            >
              <Icons.plus size={16} color={newCondition.trim() ? colors.bg : colors.ink4} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Preview card */}
      <Card
        padding={16}
        colors={colors}
        style={{
          backgroundColor: colors.aiBg,
          borderWidth: 1,
          borderColor: 'rgba(90,135,112,0.2)',
        }}
      >
        <View style={styles.previewRow}>
          <Icons.shieldCheck size={20} color={colors.ai2} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: colors.ai2, fontFamily: fonts.sans }]}>
              תקציר האחריות
            </Text>
            <Text style={[styles.previewText, { color: colors.ink2, fontFamily: fonts.sans }]}>
              תקופה: {effectiveDuration}
              {workDescription
                ? `  •  ${workDescription.slice(0, 50)}${workDescription.length > 50 ? '…' : ''}`
                : ''}
            </Text>
            <Text
              style={[
                styles.previewText,
                { color: colors.ink3, fontFamily: fonts.sans, marginTop: 2 },
              ]}
            >
              {conditions.length} תנאים
            </Text>
          </View>
        </View>
      </Card>
    </KeyboardAwareFormLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 18 },
  title: {
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 33,
    letterSpacing: -0.6,
    textAlign: 'right',
  },
  subtitle: { fontSize: 14, textAlign: 'right' },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, textAlign: 'right' },
  exitBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Duration
  durationGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  durationPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationLabel: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
  customDurationInput: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Text areas
  textArea: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  textInput: { fontSize: 14, lineHeight: 22 },

  // Conditions
  conditionsHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetBtn: { fontSize: 12, fontWeight: '600' },
  conditionsList: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  conditionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  conditionDisplayRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  conditionNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  conditionNum: { fontSize: 11, fontWeight: '700' },
  conditionText: { flex: 1, fontSize: 13, lineHeight: 18, textAlign: 'right' },
  conditionActions: {
    flexDirection: 'row-reverse',
    gap: 14,
    flexShrink: 0,
    paddingTop: 2,
  },
  conditionEditRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'flex-start',
  },
  conditionEditInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 56,
  },
  conditionSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  addConditionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  conditionAddInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  addConditionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Preview
  previewRow: { flexDirection: 'row-reverse', gap: 12, alignItems: 'flex-start' },
  previewTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4, textAlign: 'right' },
  previewText: { fontSize: 12, lineHeight: 18, textAlign: 'right' },
});
