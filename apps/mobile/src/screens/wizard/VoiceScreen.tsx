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

// ─── Waveform ─────────────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function VoiceScreen({ onStop, onBack, transcribing }: VoiceScreenProps) {
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // ── Lifecycle / safety refs ────────────────────────────────────────────────
  // Never access recorder.isRecording directly — it reads the native object
  // which throws NativeSharedObjectNotFoundException when the recorder is released.
  // We track our own recording state instead.

  const isMountedRef       = useRef(true);    // false after unmount → block setState
  const isActivelyRecRef   = useRef(false);   // true only while recorder.record() is live
  const isStoppingRef      = useRef(false);   // mutex: prevents double-stop
  const hasConfirmedRef    = useRef(false);   // prevents double-confirm (checkmark)
  const savedUriRef        = useRef<string | null>(null); // URI cached after first stop

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed]         = useState(0);
  const [confirming, setConfirming]   = useState(false); // local loading for checkmark

  // Mark unmounted
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Safe set-state helpers ─────────────────────────────────────────────────
  const safeSet = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    if (isMountedRef.current) setter(value);
  };

  // ── Core recording lifecycle ───────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        if (isMountedRef.current) Alert.alert('אין הרשאה', 'יש לאפשר גישה למיקרופון בהגדרות הטלפון');
        onBack?.();
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      isActivelyRecRef.current = true;
      savedUriRef.current = null;
      safeSet(setIsRecording, true);
      safeSet(setElapsed, 0);
    } catch (e) {
      isActivelyRecRef.current = false;
      if (isMountedRef.current) Alert.alert('שגיאה', 'לא ניתן להתחיל הקלטה. נסה שוב.');
      onBack?.();
    }
  };

  /**
   * Stop the active recording and cache the URI.
   * Safe to call multiple times — subsequent calls return the cached URI.
   * NEVER reads recorder.isRecording; uses our own ref instead.
   */
  const safeStopRecording = async (): Promise<string | null> => {
    // Already stopped — return cached URI
    if (!isActivelyRecRef.current) {
      return savedUriRef.current;
    }

    // Mutex: if a stop is already in progress, wait and return cached
    if (isStoppingRef.current) {
      // Spin-wait up to 1 s for the in-flight stop to finish
      await new Promise<void>((res) => {
        const t = setInterval(() => {
          if (!isStoppingRef.current) { clearInterval(t); res(); }
        }, 50);
        setTimeout(() => { clearInterval(t); res(); }, 1000);
      });
      return savedUriRef.current;
    }

    isStoppingRef.current = true;
    isActivelyRecRef.current = false;

    let uri: string | null = null;
    try {
      await recorder.stop();
      // Access .uri only immediately after stop(), before any other op
      uri = recorder.uri ?? null;
      savedUriRef.current = uri;
    } catch {
      // recorder may already be stopped by native side — use whatever we have
      uri = savedUriRef.current;
    }

    // Release mic (best-effort, don't crash if this fails)
    try { await setAudioModeAsync({ allowsRecording: false }); } catch {}

    isStoppingRef.current = false;
    safeSet(setIsRecording, false);
    return uri;
  };

  /**
   * Stop + discard: used by X / cancel.
   */
  const safeDiscardRecording = async () => {
    isActivelyRecRef.current = false;
    if (!isStoppingRef.current) {
      isStoppingRef.current = true;
      try { await recorder.stop(); } catch {}
      isStoppingRef.current = false;
    }
    savedUriRef.current = null;
    try { await setAudioModeAsync({ allowsRecording: false }); } catch {}
  };

  // ── Auto-start + unmount cleanup ───────────────────────────────────────────

  useEffect(() => {
    startRecording();
    return () => {
      // On unmount: stop native recording without touching React state
      isMountedRef.current = false;
      if (isActivelyRecRef.current && !isStoppingRef.current) {
        isActivelyRecRef.current = false;
        isStoppingRef.current = true;
        recorder.stop().catch(() => {}).finally(() => {
          isStoppingRef.current = false;
          setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      if (isMountedRef.current) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  // ── Action handlers ────────────────────────────────────────────────────────

  /**
   * X button: discard recording and exit safely.
   */
  const handleCancel = async () => {
    await safeDiscardRecording();
    onBack?.();
  };

  /**
   * Checkmark: stop + confirm recording, pass URI to parent.
   * Guards against double-tap and missing recording.
   */
  const handleConfirm = async () => {
    if (hasConfirmedRef.current || confirming) return;
    hasConfirmedRef.current = true;
    safeSet(setConfirming, true);

    const uri = await safeStopRecording();

    if (!uri) {
      safeSet(setConfirming, false);
      hasConfirmedRef.current = false;
      if (isMountedRef.current) {
        Alert.alert('שגיאה', 'לא נמצאה הקלטה. נסה שוב.');
      }
      return;
    }

    // Hand off to the route handler (transcription etc.)
    // Don't reset confirming here — we want the spinner to stay while the
    // parent processes the audio (transcribing prop will take over).
    onStop?.(uri);
  };

  /**
   * Big mic button: stop if recording, restart if stopped.
   */
  const handleToggleRecording = async () => {
    if (isActivelyRecRef.current) {
      await safeStopRecording();
    } else {
      // Reset confirm gate so user can confirm again after re-recording
      hasConfirmedRef.current = false;
      safeSet(setConfirming, false);
      await startRecording();
    }
  };

  // ── Derived UI state ───────────────────────────────────────────────────────
  const hasStopped       = !isRecording && savedUriRef.current !== null;
  const checkmarkLoading = confirming || !!transcribing;
  const checkmarkDisabled = checkmarkLoading || (isRecording && !hasStopped);

  // ── Render ────────────────────────────────────────────────────────────────

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
          <Pressable style={styles.moreBtn} onPress={handleCancel}>
            <Icons.close size={20} color="rgba(255,255,255,0.7)" />
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
            {isRecording ? 'מקליט…' : hasStopped ? 'ההקלטה מוכנה' : 'הקלטה הסתיימה'}
          </Text>
          <Text style={[styles.transcriptText, { fontFamily: fonts.sans }]}>
            {isRecording
              ? 'דבר בחופשיות — התמלול ייוצר לאחר העיבוד'
              : hasStopped
                ? 'לחץ ✓ לעיבוד ויצירת הדוח, או על המיקרופון להקלטה חדשה'
                : 'לחץ על המיקרופון להתחלת הקלטה'}
          </Text>
        </View>
      </ScrollView>

      {/* Voice controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        {checkmarkLoading ? (
          <View style={styles.transcribingRow}>
            <ActivityIndicator size="small" color={voiceColors.sageLight} />
            <Text style={[styles.transcribingText, { fontFamily: fonts.sans }]}>מתמלל…</Text>
          </View>
        ) : (
          <VoiceWaveform active={isRecording} />
        )}

        <Text style={[styles.timer, { fontFamily: fonts.sans }]}>
          {formatTime(elapsed)} · {isRecording ? 'מקליט' : hasStopped ? 'מוכן' : 'עצר'}
        </Text>

        <View style={styles.controlRow}>
          {/* Cancel / X */}
          <Pressable
            style={styles.controlSideBtn}
            onPress={handleCancel}
            disabled={checkmarkLoading}
          >
            <Icons.close size={22} color="#fff" />
          </Pressable>

          {/* Stop / Restart mic */}
          <Pressable
            style={styles.bigMicBtn}
            onPress={handleToggleRecording}
            disabled={checkmarkLoading}
          >
            {isRecording ? (
              <View style={styles.stopSquare} />
            ) : (
              <Icons.micFill size={36} color={voiceColors.bg} />
            )}
          </Pressable>

          {/* Confirm checkmark */}
          <Pressable
            onPress={handleConfirm}
            style={[
              styles.controlSideBtn,
              { backgroundColor: voiceColors.sageLight },
              checkmarkDisabled && styles.controlSideBtnDisabled,
            ]}
            disabled={checkmarkDisabled}
          >
            {checkmarkLoading ? (
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
  controlSideBtnDisabled: {
    opacity: 0.4,
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
