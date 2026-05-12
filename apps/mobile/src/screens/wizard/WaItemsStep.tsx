import React from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Alert,
} from 'react-native';
import { Header, ProgressBar, KeyboardAwareFormLayout } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';

interface WaItemsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function WaItemsStep({ colors = lightColors, onNext, onBack }: WaItemsStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();

  const items = wizard.state.waWorkItems;
  const setItems = wizard.setWaWorkItems;

  const addSection = () => {
    const id = `s_${Date.now()}`;
    const clauseId = `c_${Date.now()}`;
    setItems([...items, { id, title: '', clauses: [{ id: clauseId, text: '' }] }]);
  };

  const updateTitle = (sectionId: string, title: string) => {
    setItems(items.map(item => item.id === sectionId ? { ...item, title } : item));
  };

  const addClause = (sectionId: string) => {
    const clauseId = `c_${Date.now()}`;
    setItems(items.map(item =>
      item.id === sectionId
        ? { ...item, clauses: [...item.clauses, { id: clauseId, text: '' }] }
        : item,
    ));
  };

  const updateClause = (sectionId: string, clauseId: string, text: string) => {
    setItems(items.map(item =>
      item.id === sectionId
        ? { ...item, clauses: item.clauses.map(c => c.id === clauseId ? { ...c, text } : c) }
        : item,
    ));
  };

  const deleteClause = (sectionId: string, clauseId: string) => {
    const section = items.find(i => i.id === sectionId);
    if (section && section.clauses.length <= 1) {
      Alert.alert('לא ניתן למחוק', 'יש להשאיר לפחות סעיף אחד בכל עבודה');
      return;
    }
    setItems(items.map(item =>
      item.id === sectionId
        ? { ...item, clauses: item.clauses.filter(c => c.id !== clauseId) }
        : item,
    ));
  };

  const deleteSection = (sectionId: string) => {
    if (items.length <= 1) {
      Alert.alert('לא ניתן למחוק', 'יש להשאיר לפחות עבודה אחת');
      return;
    }
    Alert.alert('מחיקת עבודה', 'האם למחוק עבודה זו וכל סעיפיה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => setItems(items.filter(i => i.id !== sectionId)),
      },
    ]);
  };

  const handleNext = () => {
    const filled = items.filter(i => i.title.trim());
    if (filled.length === 0) {
      Alert.alert('שגיאה', 'יש להזין כותרת לפחות לעבודה אחת');
      return;
    }
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
          המשך למחיר כולל
        </Button>
      }
    >
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            פירוט העבודות
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הוסף עבודות וסעיפים לכל עבודה
          </Text>

          {items.map((item, sectionIdx) => (
            <View
              key={item.id}
              style={[styles.sectionCard, { borderColor: colors.line, backgroundColor: colors.bgElev }]}
            >
              {/* Section header: number badge + title input + delete */}
              <View style={[styles.sectionHeader, { borderBottomColor: colors.line }]}>
                <View style={[styles.sectionNum, { backgroundColor: colors.ink1 }]}>
                  <Text style={[styles.sectionNumText, { color: colors.bg, fontFamily: fonts.sans }]}>
                    {sectionIdx + 1}
                  </Text>
                </View>
                <TextInput
                  style={[styles.titleInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                  value={item.title}
                  onChangeText={(t) => updateTitle(item.id, t)}
                  placeholder="כותרת העבודה (למשל: איטום מרפסת)"
                  placeholderTextColor={colors.ink4}
                  textAlign="right"
                />
                <Pressable onPress={() => deleteSection(item.id)} hitSlop={8}>
                  <Icons.trash size={18} color={colors.danger} />
                </Pressable>
              </View>

              {/* Clauses */}
              {item.clauses.map((clause, clauseIdx) => (
                <View
                  key={clause.id}
                  style={[styles.clauseRow, { borderBottomColor: colors.line }]}
                >
                  <Text style={[styles.clauseNum, { color: colors.ink4, fontFamily: fonts.sans }]}>
                    {`${sectionIdx + 1}.${clauseIdx + 1}`}
                  </Text>
                  <TextInput
                    style={[styles.clauseInput, { color: colors.ink1, fontFamily: fonts.sans }]}
                    value={clause.text}
                    onChangeText={(t) => updateClause(item.id, clause.id, t)}
                    placeholder="פרט סעיף…"
                    placeholderTextColor={colors.ink4}
                    multiline
                    textAlign="right"
                  />
                  <Pressable onPress={() => deleteClause(item.id, clause.id)} hitSlop={8}>
                    <Icons.trash size={14} color={colors.ink4} />
                  </Pressable>
                </View>
              ))}

              {/* Add clause */}
              <Pressable
                onPress={() => addClause(item.id)}
                style={[styles.addClauseBtn, { borderTopColor: colors.line }]}
              >
                <Icons.plus size={14} color={colors.ai2} />
                <Text style={[styles.addClauseText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                  הוסף סעיף
                </Text>
              </Pressable>
            </View>
          ))}

          {/* Add section */}
          <Pressable
            onPress={addSection}
            style={[styles.addSectionBtn, { borderColor: colors.line }]}
          >
            <Icons.plus size={18} color={colors.ai2} />
            <Text style={[styles.addSectionText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              הוסף עבודה נוספת
            </Text>
          </Pressable>

          {/* Info note */}
          <View style={[styles.noteCard, { backgroundColor: colors.aiBg, borderColor: 'rgba(90,135,112,0.2)' }]}>
            <Icons.doc size={16} color={colors.ai2} />
            <Text style={[styles.noteText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              הפריטים יופיעו בהסכם בפירוט ממוספר. מחיר כולל יוזן בשלב הבא.
            </Text>
          </View>
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

  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionNum: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionNumText: { fontSize: 13, fontWeight: '700' },
  titleInput: {
    flex: 1, fontSize: 15, fontWeight: '600', textAlign: 'right', padding: 0,
  },

  clauseRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  clauseNum: {
    fontSize: 11, fontWeight: '700', minWidth: 28, textAlign: 'right', paddingTop: 3, flexShrink: 0,
  },
  clauseInput: {
    flex: 1, fontSize: 13, lineHeight: 19, textAlign: 'right', padding: 0, minHeight: 30,
  },

  addClauseBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addClauseText: { fontSize: 13, fontWeight: '600' },

  addSectionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addSectionText: { fontSize: 14, fontWeight: '700' },

  noteCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, textAlign: 'right' },
});
