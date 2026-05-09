import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Header } from '@/components/layout';
import { Icons } from '@/components/icons';
import { fonts, voiceColors } from '@/theme/tokens';

interface VoiceScreenProps {
  onStop?: (audioUri: string) => void;
  onBack?: () => void;
  transcribing?: boolean;
}

function VoiceWaveform({ active }: { active: boolean }) {
  const anims = useRef(
    Array.from({ length: 36 }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (!active) {
      anims.forEach((a) => a.setValue(0.3));
      return;
    }
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
  }, [anims, active]);

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
              opacity: active ? 0.65 : 0.25,
            },
          ]}
        />
      ))}
    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VoiceScreen({ onStop, onBack, transcribing }: VoiceScreenProps) {
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('אין הרשאה', 'יש לאפשר גישה למיקרופון בהגדרות הטלפון');
        onBack?.();
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן להתחיל הקלטה. נסה שוב.');
      onBack?.();
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recorder.isRecording) return null;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}
    setIsRecording(false);
    return recorder.uri ?? null;
  };

  // Auto-start on mount
  useEffect(() => {
    startRecording();
    return () => {
      if (recorder.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const handleDone = async () => {
    const uri = await stopRecording();
    if (uri) onStop?.(uri);
  };

  const handleCancel = async () => {
    await stopRecording();
    onBack?.();
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      setElapsed(0);
      await startRecording();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.aurora} pointerEvents="none" />

      <Header
        step={4}
        ofSteps={5}
        onBack={handleCancel}
        transparent
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

        {/* Transcript / status card */}
        <View style={styles.transcript}>
          <Text style={[styles.transcriptLabel, { fontFamily: fonts.sans }]}>
            {isRecording ? 'מקליט…' : 'הקלטה הסתיימה'}
          </Text>
          <Text style={[styles.transcriptText, { fontFamily: fonts.sans }]}>
            {isRecording
              ? 'דבר בחופשיות — התמלול ייוצר לאחר העיבוד'
              : 'לחץ ✓ לעיבוד ויצירת הדוח, או על המיקרופון להקלטה חדשה'}
          </Text>
        </View>
      </ScrollView>

      {/* Voice controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        {transcribing ? (
          <View style={styles.transcribingRow}>
            <ActivityIndicator size="small" color={voiceColors.sageLight} />
            <Text style={[styles.transcribingText, { fontFamily: fonts.sans }]}>מתמלל…</Text>
          </View>
        ) : (
          <VoiceWaveform active={isRecording} />
        )}

        <Text style={[styles.timer, { fontFamily: fonts.sans }]}>
          {formatTime(elapsed)} · {isRecording ? 'מקליט' : 'עצר'}
        </Text>

        <View style={styles.controlRow}>
          {/* Cancel */}
          <Pressable style={styles.controlSideBtn} onPress={handleCancel} disabled={!!transcribing}>
            <Icons.close size={22} color="#fff" />
          </Pressable>

          {/* Stop / restart */}
          <Pressable
            style={styles.bigMicBtn}
            onPress={handleToggleRecording}
            disabled={!!transcribing}
          >
            {isRecording ? (
              <View style={styles.stopSquare} />
            ) : (
              <Icons.micFill size={36} color={voiceColors.bg} />
            )}
          </Pressable>

          {/* Done */}
          <Pressable
            onPress={handleDone}
            style={[styles.controlSideBtn, { backgroundColor: voiceColors.sageLight }]}
            disabled={!!transcribing}
          >
            {transcribing ? (
              <ActivityIndicator size="small" color="#0F1612" />
            ) : (
              <Icons.check size={26} color="#0F1612" stroke={3} />
            )}
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
  content: { paddingHorizontal: 24, paddingBottom: 220, gap: 16 },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    minHeight: 120,
    gap: 10,
  },
  transcriptLabel: {
    color: voiceColors.sageLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 24,
    color: voiceColors.textSecondary,
  },
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
  },
  transcribingRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  transcribingText: {
    color: voiceColors.sageLight,
    fontSize: 14,
    fontWeight: '600',
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
