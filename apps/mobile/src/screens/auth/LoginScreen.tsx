import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, Pressable, Linking, Animated, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Field, KeyboardAwareScrollView } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts, radii } from '@/theme/tokens';
import { signInWithUsername } from '@/services/auth';
import { ROUTES } from '@/navigation/constants';

import appLogo from '../../../assets/icon.png';

// Terracotta glow shadow for the logo tile and CTA button
const logoShadow = Platform.select({
  ios: {
    shadowColor: '#C85A3A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
  },
  android: { elevation: 12 },
  default: {},
}) ?? {};

const ctaShadow = Platform.select({
  ios: {
    shadowColor: '#C85A3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  android: { elevation: 8 },
  default: {},
}) ?? {};

interface LoginScreenProps {
  colors?: typeof lightColors;
  onLoggedIn?: () => void;
}

export function LoginScreen({ colors = lightColors, onLoggedIn }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Entrance animations ────────────────────────────────────────────────────
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(-20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(24)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(heroY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(60),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(80),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Auth logic (unchanged) ─────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('שגיאה', 'הכנס שם משתמש');
      return;
    }
    if (!password) {
      Alert.alert('שגיאה', 'הכנס סיסמה');
      return;
    }
    setLoading(true);
    const result = await signInWithUsername(username, password);
    if (!result.success) {
      setLoading(false);
      Alert.alert('כניסה נכשלה', result.error ?? 'שגיאה לא ידועה');
      return;
    }
    onLoggedIn?.();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* ── Warm aurora atmosphere ─────────────────────────────────────────── */}
      <View pointerEvents="none" style={styles.blob1} />
      <View pointerEvents="none" style={styles.blob2} />
      <View pointerEvents="none" style={styles.blob3} />

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.hero,
            { paddingTop: insets.top + 36 },
            { opacity: heroOpacity, transform: [{ translateY: heroY }] },
          ]}
        >
          {/* App logo */}
          <View style={[styles.logoWrap, logoShadow]}>
            <Image source={appLogo} style={styles.logoImage} />
          </View>

          <Text style={[styles.headline, { color: colors.ink1, fontFamily: fonts.serif }]}>
           מנהלים עבודה חכם
          </Text>
          <Text style={[styles.headlineSub, { color: colors.ink2, fontFamily: fonts.sans }]}>
            התחבר כדי להמשיך לדוחות שלך.
          </Text>
        </Animated.View>

        {/* ── Form card ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.formSection, { opacity: formOpacity, transform: [{ translateY: formY }] }]}
        >
          {/* AI badge floating above card */}
          <View style={[styles.aiPill, { backgroundColor: colors.aiBg }]}>
            <Icons.sparkle size={11} color={colors.ai2} />
            <Text style={[styles.aiPillText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              מאובטח עם AI
            </Text>
          </View>

          <Card elev={2} padding={22} colors={colors}>
            <View style={styles.form}>
              <Field
                label="שם משתמש"
                placeholder="שם משתמש"
                autoCapitalize="none"
                autoCorrect={false}
                icon={<Icons.user size={20} color={colors.ink3} />}
                value={username}
                onChangeText={setUsername}
                colors={colors}
              />

              <View>
                <Field
                  label="סיסמה"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon={<Icons.lock size={20} color={colors.ink3} />}
                  value={password}
                  onChangeText={setPassword}
                  colors={colors}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  <Icons.eye
                    size={18}
                    color={showPassword ? colors.accent : colors.ink3}
                  />
                </Pressable>
              </View>

            </View>
          </Card>
        </Animated.View>

        {/* ── CTA + lower section ───────────────────────────────────────────── */}
        <Animated.View style={[styles.ctaSection, { opacity: ctaOpacity }]}>
          {/* Gradient login button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.ctaBtnWrap,
              ctaShadow,
              { opacity: loading ? 0.55 : pressed ? 0.88 : 1 },
            ]}
          >
            <LinearGradient
              colors={['#D26A48', '#C85A3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.ctaGradient}
            >
              <Icons.back size={20} color="#fff" />
              <Text style={[styles.ctaText, { fontFamily: fonts.sans }]}>
                {loading ? 'מתחבר...' : 'כניסה'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Register / Contact CTA */}
          <Pressable
            onPress={() => router.push(ROUTES.AUTH_REGISTER as never)}
            style={({ pressed }) => [styles.registerRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.registerText, { color: colors.ink2, fontFamily: fonts.sans }]}>
              {'עדיין אין לך חשבון? '}
              <Text style={{ color: colors.accent, fontWeight: '700' }}>צור איתנו קשר</Text>
            </Text>
          </Pressable>

          {/* Premium legal footer */}
          <View style={styles.legalWrap}>
            <View style={[styles.securityBadge, { backgroundColor: colors.aiBg }]}>
              <Icons.shield size={11} color={colors.ai2} />
              <Text style={[styles.securityText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                הצפנה מקצה לקצה · נתונים בענן ישראלי
              </Text>
            </View>
            <View style={styles.legalLinks}>
              <Text
                style={[styles.legalLink, { color: colors.ink3, fontFamily: fonts.sans }]}
                onPress={() => Linking.openURL('https://dohot.netlify.app/privacy')}
              >
                מדיניות פרטיות
              </Text>
              <Text style={[styles.legalDot, { color: colors.ink4 }]}>·</Text>
              <Text
                style={[styles.legalLink, { color: colors.ink3, fontFamily: fonts.sans }]}
                onPress={() => Linking.openURL('https://dohot.netlify.app/terms')}
              >
                תנאי שימוש
              </Text>
            </View>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 20,
  },

  // ── Aurora blobs ──────────────────────────────────────────────────────────
  blob1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#F5B393',
    opacity: 0.52,
  },
  blob2: {
    position: 'absolute',
    top: 90,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E8D4A8',
    opacity: 0.42,
  },
  blob3: {
    position: 'absolute',
    bottom: 100,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F5B393',
    opacity: 0.22,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  logoWrap: {
    marginBottom: 24,
    borderRadius: 18,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 40,
    textAlign: 'right',
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  headlineSub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
    alignSelf: 'stretch',
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  formSection: {
    gap: 0,
  },
  aiPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: 10,
    marginRight: 16,
  },
  aiPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  form: { gap: 14 },
  eyeBtn: { position: 'absolute', left: 16, bottom: 16 },
  // ── CTA section ───────────────────────────────────────────────────────────
  ctaSection: { gap: 16 },
  ctaBtnWrap: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  ctaGradient: {
    height: 60,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },

  // ── Register row ──────────────────────────────────────────────────────────
  registerRow: { alignItems: 'center', paddingVertical: 2 },
  registerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Legal footer ──────────────────────────────────────────────────────────
  legalWrap: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    paddingBottom: 4,
  },
  securityBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legalLink: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalDot: { fontSize: 11 },
});
