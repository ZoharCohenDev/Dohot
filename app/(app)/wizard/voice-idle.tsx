import { useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Icons } from '@/components/icons';
import { fonts, voiceColors } from '@/theme/tokens';

export default function VoiceIdlePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.aurora} pointerEvents="none" />

      <Header onBack={() => router.back()} />

      <View style={styles.body}>
        <View style={styles.aiLabel}>
          <Icons.sparkle size={14} color={voiceColors.sageLight} />
          <Text style={[styles.aiLabelText, { fontFamily: fonts.sans }]}>הקלטה לדוח</Text>
        </View>

        <Text style={[styles.title, { fontFamily: fonts.serif }]}>מה גיליתם בשטח?</Text>
        <Text style={[styles.body2, { fontFamily: fonts.sans }]}>
          לחץ על המיקרופון והתחל לדבר באופן טבעי. אין צורך לנסח — המערכת תכתוב את הדוח בעברית מקצועית עבורך.
        </Text>

        <View style={styles.promptsLabel}>
          <Text style={[styles.promptsLabelText, { fontFamily: fonts.sans }]}>הצעות לפתיחה</Text>
        </View>
        {['תאר את הממצא הראשי…', 'כמה זמן הנזק קיים?', 'מה החשד למקור?'].map((s, i) => (
          <View key={i} style={styles.promptRow}>
            <Icons.waveform size={16} color={voiceColors.sageLight} />
            <Text style={[styles.promptText, { fontFamily: fonts.sans }]}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.micSection, { paddingBottom: insets.bottom + 32 }]}>
        <Pressable
          onPress={() => router.push('/(app)/wizard/voice')}
          style={styles.bigMic}
        >
          <Icons.micFill size={48} color={voiceColors.bg} />
        </Pressable>
        <Text style={[styles.tapHint, { fontFamily: fonts.sans }]}>הקש כדי להתחיל</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: voiceColors.bg },
  aurora: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
  },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiLabelText: { color: voiceColors.sageLight, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '500', color: voiceColors.textPrimary, letterSpacing: -0.6, lineHeight: 34 },
  body2: { fontSize: 15, color: voiceColors.textSecondary, lineHeight: 23, marginTop: 12 },
  promptsLabel: { marginTop: 22, marginBottom: 8 },
  promptsLabelText: { fontSize: 11, fontWeight: '700', color: voiceColors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 6,
  },
  promptText: { fontSize: 14, color: voiceColors.textSecondary, flex: 1 },
  micSection: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 24,
  },
  bigMic: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: voiceColors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: voiceColors.sageLight,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  tapHint: { color: voiceColors.sageLight, fontSize: 13, fontWeight: '600' },
});
