import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardExit } from '@/hooks/useWizardExit';

interface TranscriptReviewScreenProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
  onAddIssue?: () => void;
  isTranscribing?: boolean;
  transcriptionFailed?: boolean;
}

export function TranscriptReviewScreen({
  colors = lightColors,
  onNext,
  onBack,
  onAddIssue,
  isTranscribing = false,
  transcriptionFailed = false,
}: TranscriptReviewScreenProps) {
  const wizard = useWizard();
  const { triggerExit } = useWizardExit();
  const [transcript, setTranscript] = useState(wizard.currentIssue.description);
  const [notes, setNotes] = useState('');

  // Sync local state when wizard transcript is populated after async transcription
  useEffect(() => {
    if (wizard.currentIssue.description && !transcript) {
      setTranscript(wizard.currentIssue.description);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.currentIssue.description]);

  const hasAudio = !!wizard.state.recordedAudioUri;
  const isEmpty = !transcript.trim();

  const buildCombined = () =>
    notes.trim()
      ? `${transcript.trim()}\n\nהמלצות ראשוניות מהטכנאי:\n${notes.trim()}`
      : transcript.trim();

  const handleSend = () => {
    wizard.setVoiceTranscript(buildCombined());
    onNext?.();
  };

  const handleAddIssue = () => {
    wizard.setVoiceTranscript(buildCombined());
    onAddIssue?.();
  };

  const statusBanner = (() => {
    if (isTranscribing) return null;
    if (transcriptionFailed && isEmpty) {
      return (
        <View style={[styles.banner, { backgroundColor: colors.warnBg }]}>
          <Icons.mic size={14} color={colors.warn} />
          <Text style={[styles.bannerText, { color: colors.warn, fontFamily: fonts.sans }]}>
            התמלול לא הצליח. ניתן להקליד את תוכן הדוח ידנית.
          </Text>
        </View>
      );
    }
    if (!hasAudio && isEmpty) {
      return (
        <View style={[styles.banner, { backgroundColor: colors.aiBg }]}>
          <Icons.mic size={14} color={colors.ai2} />
          <Text style={[styles.bannerText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            התמלול עדיין לא הופעל. ניתן להקליד את תוכן הדוח ידנית.
          </Text>
        </View>
      );
    }
    return null;
  })();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        step={4}
        ofSteps={5}
        onBack={onBack}
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
      <ProgressBar value={4 / 5} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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

        {/* Status banner (failed / no-audio) */}
        {statusBanner}

        {/* Transcript card */}
        <View style={[styles.card, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
          <View style={styles.cardHeader}>
            <Icons.waveform size={16} color={colors.ai2} />
            <Text style={[styles.cardLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              מה דיברת
            </Text>
          </View>

          {isTranscribing ? (
            <View style={styles.transcribingState}>
              <ActivityIndicator color={colors.ai2} />
              <Text style={[styles.transcribingText, { color: colors.ink3, fontFamily: fonts.sans }]}>
                מתמלל את ההקלטה…
              </Text>
            </View>
          ) : (
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              multiline
              style={[styles.transcriptInput, { color: colors.ink1, fontFamily: fonts.sans }]}
              textAlignVertical="top"
              textAlign="right"
              placeholder={
                transcriptionFailed
                  ? 'הקלד את תוכן ההקלטה ידנית…'
                  : 'לא זוהה טקסט — ניתן להקליד ידנית'
              }
              placeholderTextColor={colors.ink4}
            />
          )}
        </View>

        {/* Notes / manual recommendations card */}
        {!isTranscribing && (
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
        )}

        {/* Info row */}
        {!isTranscribing && (
          <View style={[styles.infoRow, { backgroundColor: colors.aiBg }]}>
            <Icons.sparkle size={14} color={colors.ai2} />
            <Text style={[styles.infoText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              ה-AI יקרא את הכל ויבנה דוח מקצועי ורשימת המלצות
            </Text>
          </View>
        )}
      </ScrollView>

      <FixedBottom colors={colors}>
        <View style={styles.btnRow}>
          {onAddIssue && (
            <Button
              kind="ghost"
              size="lg"
              disabled={isTranscribing}
              onPress={handleAddIssue}
              colors={colors}
            >
              + הוסף תקלה
            </Button>
          )}
          <Button
            kind="primary"
            size="lg"
            full
            disabled={isTranscribing}
            onPress={handleSend}
            iconRight={<Icons.sparkle size={18} color={colors.bg} />}
            colors={colors}
          >
            {isTranscribing ? 'מתמלל…' : onAddIssue ? 'סיים ושלח ל-AI' : 'שלח ל-AI'}
          </Button>
        </View>
      </FixedBottom>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 16 },

  titleBlock: { gap: 8 },
  aiTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  aiTagText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6, textAlign: 'right' },
  subtitle: { fontSize: 14, textAlign: 'right' },

  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 20, textAlign: 'right' },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
  optionalTag: { fontSize: 11 },

  transcribingState: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 36,
  },
  transcribingText: { fontSize: 14 },

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
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20, textAlign: 'right' },

  btnRow: { flexDirection: 'row-reverse', gap: 10, alignItems: 'center', width: '100%' },
});
