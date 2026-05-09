import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';

interface TranscriptReviewScreenProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function TranscriptReviewScreen({
  colors = lightColors,
  onNext,
  onBack,
}: TranscriptReviewScreenProps) {
  const wizard = useWizard();
  const [transcript, setTranscript] = useState(wizard.state.voiceTranscript);
  const [notes, setNotes] = useState('');

  const handleSend = () => {
    const combined = notes.trim()
      ? `${transcript.trim()}\n\nהמלצות ראשוניות מהטכנאי:\n${notes.trim()}`
      : transcript.trim();
    wizard.setVoiceTranscript(combined);
    onNext?.();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={4} ofSteps={5} onBack={onBack} colors={colors} />
      <ProgressBar value={4 / 5} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={[styles.aiTag, { backgroundColor: colors.aiBg }]}>
            <Icons.sparkle size={11} color={colors.ai2} />
            <Text style={[styles.aiTagText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              לפני עיבוד AI
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            תמלול קולי
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            בדוק ותיקן את הטקסט לפני שליחה ל-AI
          </Text>
        </View>

        {/* Transcript card */}
        <View style={[styles.card, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
          <View style={styles.cardHeader}>
            <Icons.waveform size={16} color={colors.ai2} />
            <Text style={[styles.cardLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              מה דיברת
            </Text>
          </View>
          <TextInput
            value={transcript}
            onChangeText={setTranscript}
            multiline
            style={[styles.transcriptInput, { color: colors.ink1, fontFamily: fonts.sans }]}
            textAlignVertical="top"
            textAlign="right"
            placeholder="לא זוהה טקסט — ניתן להקליד ידנית"
            placeholderTextColor={colors.ink4}
          />
        </View>

        {/* Notes / manual recommendations card */}
        <View style={[styles.card, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
          <View style={styles.cardHeader}>
            <Icons.edit size={16} color={colors.ink3} />
            <Text style={[styles.cardLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              המלצות ראשוניות
            </Text>
            <Text style={[styles.optionalTag, { color: colors.ink4, fontFamily: fonts.sans }]}>
              אופציונלי
            </Text>
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.notesInput, { color: colors.ink1, fontFamily: fonts.sans }]}
            textAlignVertical="top"
            textAlign="right"
            placeholder="הוסף המלצות, הערות או פרטים שברצונך שה-AI יכלול בדוח…"
            placeholderTextColor={colors.ink4}
          />
        </View>

        {/* Info row */}
        <View style={[styles.infoRow, { backgroundColor: colors.aiBg }]}>
          <Icons.sparkle size={14} color={colors.ai2} />
          <Text style={[styles.infoText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            ה-AI יקרא את הכל ויבנה דוח מקצועי ורשימת המלצות
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleSend}
          iconRight={<Icons.sparkle size={18} color={colors.bg} />}
          colors={colors}
        >
          שלח ל-AI
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 16 },

  titleBlock: { gap: 8 },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  aiTagText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
  optionalTag: { fontSize: 11 },

  transcriptInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 140,
  },
  notesInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 100,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
