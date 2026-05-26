import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Easing, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Icons } from '@/components/icons';
import { lightColors, fonts, radii } from '@/theme/tokens';
import { ROUTES } from '@/navigation/constants';

const WELCOME_KEY = 'dohot_welcome_seen';

const SLIDES = [
  {
    kicker: 'AI לבעלי מקצוע',
    title: ['דוחות מקצועיים', 'נכתבים תוך', 'דקה.'],
    body: 'דבר אל הטלפון או צלם — המערכת תכתוב עבורך דוח מקצועי, הצעת מחיר או הסכם עבודה.',
    art: 'voice',
  },
  {
    kicker: 'תיעוד מהשטח',
    title: ['צלם, סמן,', 'ושלח ללקוח.'],
    body: 'תמונות, חתימות דיגיטליות, וכתובות אוטומטיות מהמיקום שלך — הכול במקום אחד.',
    art: 'capture',
  },
  {
    kicker: 'שלח בלחיצה',
    title: ['קובץ PDF מוכן,', 'נשלח בוואטסאפ.'],
    body: 'הלקוח שלך מקבל מסמך מסודר ומותג עם הלוגו שלך, ישירות לוואטסאפ או למייל.',
    art: 'send',
  },
] as const;

// ── Pulse ring for voice art ──────────────────────────────────────────────────

function PulseRing({ delay, color }: { delay: number; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.2,
            duration: 2400,
            easing: Easing.bezier(0.2, 0.6, 0.3, 1),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { borderColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

// ── Art: voice ────────────────────────────────────────────────────────────────

function ArtVoice({ colors }: { colors: typeof lightColors }) {
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.06, duration: 2250, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 2250, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.artWrap}>
      {/* Aurora blobs */}
      <View style={[styles.artBlob1, { backgroundColor: '#F5B393' }]} />
      <View style={[styles.artBlob2, { backgroundColor: '#E8D4A8' }]} />

      {/* Center: pulse rings + mic */}
      <View style={styles.artCenter}>
        <View style={styles.micContainer}>
          <PulseRing delay={0} color={colors.accent} />
          <PulseRing delay={1200} color={colors.accent} />

          <Animated.View style={{ transform: [{ scale: breathe }] }}>
            <LinearGradient
              colors={['#D86B4A', '#B84A2C']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.micCircle}
            >
              <Icons.mic size={44} color="#fff" />
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      {/* Floating waveform pill — top right */}
      <View style={[styles.waveformPill, styles.artTopRight]}>
        {[6, 14, 9, 18, 11, 6].map((h, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: h,
              backgroundColor: colors.accent,
              borderRadius: 2,
              opacity: 0.6 + (i % 2) * 0.35,
            }}
          />
        ))}
      </View>

      {/* Transcription badge — bottom left */}
      <View style={[styles.transcriptBadge, styles.artBottomLeft]}>
        <View style={[styles.transcriptDot, { backgroundColor: colors.ai }]} />
        <Text style={[styles.transcriptText, { color: colors.ink2, fontFamily: fonts.sans }]}>
          מתמלל בעברית
        </Text>
      </View>
    </View>
  );
}

// ── Art: capture ──────────────────────────────────────────────────────────────

function ArtCapture({ colors }: { colors: typeof lightColors }) {
  return (
    <View style={styles.artWrap}>
      <View style={[styles.artBlob1, { backgroundColor: '#F5B393' }]} />
      <View style={[styles.artBlob2, { backgroundColor: '#E8D4A8' }]} />

      {/* Document card — top right, tilted */}
      <View
        style={[
          styles.docCard,
          styles.artTopRightCard,
          { backgroundColor: colors.bgElev },
        ]}
      >
        <View style={[styles.docLine, { width: 60, backgroundColor: colors.ink1 }]} />
        <View style={[styles.docLine, { width: '88%', backgroundColor: colors.bgSunken, marginTop: 10 }]} />
        <View style={[styles.docLine, { width: '72%', backgroundColor: colors.bgSunken, marginTop: 4 }]} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.docCheckRow}>
            <View style={[styles.docCheckBox, { backgroundColor: colors.aiBg }]}>
              <Icons.check size={8} color={colors.ai2} stroke={2.5} />
            </View>
            <View
              style={[
                styles.docLine,
                { flex: 1, backgroundColor: colors.bgSunken },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Photo card — bottom left, tilted */}
      <LinearGradient
        colors={['#E8B89F', '#C85A3A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.photoCard, styles.artBottomLeftCard]}
      >
        <Icons.camera size={28} color="rgba(255,255,255,0.9)" />
      </LinearGradient>

      {/* AI pill */}
      <View style={[styles.artAiPill, styles.artMidLeft, { backgroundColor: colors.aiBg }]}>
        <Icons.sparkle size={11} color={colors.ai2} />
        <Text style={[styles.artAiPillText, { color: colors.ai2, fontFamily: fonts.sans }]}>
          שיפור AI
        </Text>
      </View>
    </View>
  );
}

// ── Art: send ─────────────────────────────────────────────────────────────────

function ArtSend({ colors }: { colors: typeof lightColors }) {
  return (
    <View style={styles.artWrap}>
      <View style={[styles.artBlob1, { backgroundColor: '#F5B393' }]} />
      <View style={[styles.artBlob2, { backgroundColor: '#E8D4A8' }]} />

      {/* WhatsApp card — top right */}
      <View
        style={[
          styles.waCard,
          styles.artTopRightCard,
          { backgroundColor: colors.bgElev },
        ]}
      >
        <View style={styles.waCardRow}>
          <View style={styles.waIcon}>
            <Icons.whatsapp size={18} color="#fff" />
          </View>
          <View style={styles.waCardInfo}>
            <Text style={[styles.waCardName, { color: colors.ink1, fontFamily: fonts.sans }]}>
              WhatsApp
            </Text>
            <Text style={[styles.waCardNum, { color: colors.ink3, fontFamily: fonts.sans }]}>
              050-988-1144
            </Text>
          </View>
          <Icons.back size={14} color={colors.ink3} />
        </View>
        <View style={[styles.waPdfBadge, { backgroundColor: colors.infoBg }]}>
          <Icons.doc size={12} color={colors.info} />
          <Text style={[styles.waPdfText, { color: colors.info, fontFamily: fonts.sans }]}>
            דוח לקוח.pdf
          </Text>
        </View>
      </View>

      {/* Sent pill — bottom left */}
      <View style={[styles.sentPill, styles.artBottomLeft, { backgroundColor: colors.ink1 }]}>
        <Icons.check size={13} color="#FBF6EC" stroke={2.5} />
        <Text style={[styles.sentText, { fontFamily: fonts.sans }]}>נשלח · 17:19</Text>
      </View>
    </View>
  );
}

// ── Main WelcomeScreen ────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  colors?: typeof lightColors;
}

export function WelcomeScreen({ colors = lightColors }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Content fade + slide for step transitions
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(16)).current;

  // Entrance animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const goToStep = useCallback(
    (next: number) => {
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 12, duration: 140, useNativeDriver: true }),
      ]).start(() => {
        setStep(next);
        contentY.setValue(-12);
        Animated.parallel([
          Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(contentY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    },
    []
  );

  const goToLogin = useCallback(async () => {
    try {
      await SecureStore.setItemAsync(WELCOME_KEY, '1');
    } catch (_) {
      // ignore storage errors
    }
    router.replace(ROUTES.AUTH_LOGIN as never);
  }, [router]);

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      goToStep(step + 1);
    } else {
      goToLogin();
    }
  };

  // step is always 0–2, array access is safe
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const slide = SLIDES[step]!;
  const isLast = step === SLIDES.length - 1;

  const ArtComponent =
    slide.art === 'voice' ? ArtVoice : slide.art === 'capture' ? ArtCapture : ArtSend;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Skip */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={goToLogin}
          style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={12}
        >
          <Text style={[styles.skipText, { color: colors.ink3, fontFamily: fonts.sans }]}>
            דלג
          </Text>
        </Pressable>
      </View>

      {/* Art illustration */}
      <View style={styles.artSection}>
        <ArtComponent colors={colors} />
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.contentWrap,
          { opacity: contentOpacity, transform: [{ translateY: contentY }] },
        ]}
      >
        {/* AI kicker pill */}
        <View style={[styles.kickerPill, { backgroundColor: colors.aiBg }]}>
          <Icons.sparkle size={11} color={colors.ai2} />
          <Text style={[styles.kickerText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            {slide.kicker}
          </Text>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: colors.ink1, fontFamily: fonts.serif }]}>
          {slide.title.join('\n')}
        </Text>

        {/* Body */}
        <Text style={[styles.body, { color: colors.ink2, fontFamily: fonts.sans }]}>
          {slide.body}
        </Text>
      </Animated.View>

      {/* Bottom controls */}
      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToStep(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  {
                    width: i === step ? 24 : 8,
                    backgroundColor:
                      i === step ? colors.accent : 'rgba(26,22,18,0.15)',
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: colors.ink1, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Icons.back size={18} color={colors.bg} />
          <Text style={[styles.ctaText, { color: colors.bg, fontFamily: fonts.sans }]}>
            {isLast ? 'בוא נתחיל' : 'הבא'}
          </Text>
        </Pressable>

        {/* Already have account */}
        <Pressable
          onPress={goToLogin}
          style={({ pressed }) => [styles.loginRow, { opacity: pressed ? 0.65 : 1 }]}
          hitSlop={8}
        >
          <Text style={[styles.loginText, { color: colors.ink3, fontFamily: fonts.sans }]}>
            {'כבר יש לך חשבון? '}
            <Text style={{ color: colors.accent, fontWeight: '700' }}>התחבר</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Check if welcome was already seen ─────────────────────────────────────────

export async function hasSeenWelcome(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(WELCOME_KEY);
    return val === '1';
  } catch {
    return false;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  skipBtn: { padding: 4 },
  skipText: { fontSize: 13, fontWeight: '600' },

  // ── Art area ──────────────────────────────────────────────────────────────
  artSection: {
    paddingHorizontal: 28,
    marginTop: 8,
  },
  artWrap: {
    height: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  artBlob1: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
  artBlob2: {
    position: 'absolute',
    bottom: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.4,
  },
  artCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Voice art
  micContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#C85A3A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.38,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },

  artTopRight: { position: 'absolute', top: 28, right: 20 },
  artBottomLeft: { position: 'absolute', bottom: 14, left: 16 },
  artMidLeft: { position: 'absolute', top: 88, left: 18 },

  waveformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#1B1916', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  transcriptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#1B1916', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  transcriptDot: { width: 6, height: 6, borderRadius: 3 },
  transcriptText: { fontSize: 12, fontWeight: '600' },

  // Capture art
  artTopRightCard: { position: 'absolute', top: 16, right: 28 },
  artBottomLeftCard: { position: 'absolute', bottom: 6, left: 24 },
  docCard: {
    width: 190,
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#1B1916', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 18 },
      android: { elevation: 6 },
    }),
    transform: [{ rotate: '-3deg' }],
  },
  docLine: { height: 6, borderRadius: 3 },
  docCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  docCheckBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCard: {
    width: 130,
    height: 92,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
    ...Platform.select({
      ios: { shadowColor: '#C85A3A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 6 },
    }),
  },

  artAiPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  artAiPillText: { fontSize: 11, fontWeight: '700' },

  // Send art
  waCard: {
    width: 190,
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: '#1B1916', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 18 },
      android: { elevation: 6 },
    }),
  },
  waCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  waIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waCardInfo: { flex: 1 },
  waCardName: { fontSize: 13, fontWeight: '700' },
  waCardNum: { fontSize: 10, marginTop: 1 },
  waPdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  waPdfText: { fontSize: 11, fontWeight: '600' },
  sentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    ...Platform.select({
      ios: { shadowColor: '#1B1916', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  sentText: { fontSize: 12, fontWeight: '700', color: '#FBF6EC' },

  // ── Content ───────────────────────────────────────────────────────────────
  contentWrap: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    alignItems: 'flex-end',
  },
  kickerPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: 14,
  },
  kickerText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 44,
    textAlign: 'right',
    alignSelf: 'stretch',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
    alignSelf: 'stretch',
  },

  // ── Bottom controls ───────────────────────────────────────────────────────
  bottomWrap: {
    paddingHorizontal: 28,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: radii.pill,
  },
  ctaBtn: {
    height: 60,
    borderRadius: radii.pill,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#1B1916', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  ctaText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  loginRow: { alignItems: 'center', paddingBottom: 4 },
  loginText: { fontSize: 13, textAlign: 'center' },
});
