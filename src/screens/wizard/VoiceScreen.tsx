import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Icons } from '@/components/icons';
import { fonts, voiceColors } from '@/theme/tokens';

interface VoiceScreenProps {
  onNext?: () => void;
  onBack?: () => void;
}

const SEGMENTS = [
  { label: 'תיאור הממצא', time: '0:42', done: true },
  { label: 'בדיקה תרמית', time: '0:18', done: true, current: true },
  { label: 'ניתוח הסיבה', time: '—', done: false },
  { label: 'המלצות', time: '—', done: false },
];

function VoiceWaveform() {
  const anims = useRef(
    Array.from({ length: 36 }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    const loops = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 40),
          Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 450, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  const heights = Array.from({ length: 36 }, (_, i) => 8 + Math.abs(Math.sin(i * 0.6) * 30) + (i % 4) * 4);

  return (
    <View style={styles.waveform}>
      {heights.map((h, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: h,
              transform: [{ scaleY: anims[i] ?? new Animated.Value(0.3) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function VoiceScreen({ onNext, onBack }: VoiceScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Aurora background */}
      <View style={styles.aurora} pointerEvents="none" />

      <Header
        step={4}
        ofSteps={5}
        onBack={onBack}
        action={
          <Pressable style={styles.moreBtn}>
            <Icons.more size={22} color="#fff" />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aiLabel}>
          <Icons.sparkle size={14} color={voiceColors.sageLight} />
          <Text style={[styles.aiLabelText, { fontFamily: fonts.sans }]}>הקלטה לדוח</Text>
        </View>

        <Text style={[styles.title, { fontFamily: fonts.serif }]}>
          {'תאר במילים שלך\n'}
          <Text style={styles.titleItalic}>אנחנו נסדר את זה.</Text>
        </Text>

        {/* Live transcript */}
        <View style={styles.transcript}>
          <Text style={[styles.transcriptLabel, { fontFamily: fonts.sans }]}>תמלול חי</Text>
          <Text style={[styles.transcriptText, { fontFamily: fonts.sans }]}>
            <Text style={styles.transcriptMuted}>נמצאה </Text>
            <Text style={styles.transcriptHighlight}>נזילה פעילה</Text>
            <Text style={styles.transcriptMuted}> בקיר המערבי של חדר השינה, ליד החלון, </Text>
            <Text style={styles.transcriptHighlight}>כתם רטיבות בקוטר כ-40 ס״מ</Text>
            <Text style={styles.transcriptMuted}>. בבדיקה תרמית זוהה </Text>
            <Text style={styles.transcriptHighlight}>הפרש טמפרטורה של 4.2 מעלות</Text>
            <Text style={styles.transcriptMuted}>, מה שמעיד על... </Text>
          </Text>
        </View>

        {/* Segments */}
        <View style={styles.segments}>
          {SEGMENTS.map((seg, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: seg.current ? 'rgba(132,176,151,0.16)' : 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: seg.current ? 'rgba(132,176,151,0.4)' : 'transparent',
                },
              ]}
            >
              <View style={[styles.segDot, { backgroundColor: seg.done ? voiceColors.sageLight : 'rgba(255,255,255,0.10)' }]}>
                {seg.done && <Icons.check size={14} color="#0F1612" stroke={3} />}
              </View>
              <Text style={[styles.segLabel, { color: seg.done ? voiceColors.textPrimary : voiceColors.textMuted, fontFamily: fonts.sans }]}>
                {seg.label}
              </Text>
              <Text style={[styles.segTime, { fontFamily: fonts.sans }]}>{seg.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Voice controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <VoiceWaveform />

        <Text style={[styles.timer, { fontFamily: fonts.sans }]}>1:00 · מקליט</Text>

        <View style={styles.controlRow}>
          {/* Cancel */}
          <Pressable style={styles.controlSideBtn}>
            <Icons.close size={22} color="#fff" />
          </Pressable>

          {/* Main stop button */}
          <Pressable style={styles.bigMicBtn}>
            <View style={styles.stopSquare} />
          </Pressable>

          {/* Done */}
          <Pressable onPress={onNext} style={[styles.controlSideBtn, { backgroundColor: voiceColors.sageLight }]}>
            <Icons.check size={26} color="#0F1612" stroke={3} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: voiceColors.bg },
  aurora: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 220,
    gap: 16,
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiLabelText: { color: voiceColors.sageLight, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: {
    fontSize: 30,
    fontWeight: '500',
    color: voiceColors.textPrimary,
    letterSpacing: -0.6,
    lineHeight: 35,
  },
  titleItalic: { fontStyle: 'italic', color: voiceColors.sageDark },
  transcript: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: voiceColors.transcriptBg,
    borderWidth: 1,
    borderColor: voiceColors.transcriptBorder,
    minHeight: 180,
  },
  transcriptLabel: {
    color: voiceColors.sageLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  transcriptText: { fontSize: 15, lineHeight: 25 },
  transcriptMuted: { color: voiceColors.textSecondary },
  transcriptHighlight: { color: voiceColors.textPrimary },
  segments: { gap: 8 },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  segDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segLabel: { flex: 1, fontSize: 14 },
  segTime: { color: voiceColors.textMuted, fontSize: 12 },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: voiceColors.bg,
  },
  waveform: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    height: 56,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: voiceColors.sageLight,
    opacity: 0.65,
  },
  timer: {
    color: voiceColors.sageLight,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 1,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginTop: 18,
  },
  controlSideBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigMicBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: voiceColors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: voiceColors.sageLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  stopSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: voiceColors.bg,
  },
});
