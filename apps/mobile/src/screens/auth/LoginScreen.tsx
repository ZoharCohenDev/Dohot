import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/shared';
import { Button, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { signInWithEmail } from '@/services/auth';

interface LoginScreenProps {
  colors?: typeof lightColors;
  onLoggedIn?: () => void;
  onRegister?: () => void;
}

export function LoginScreen({ colors = lightColors, onLoggedIn, onRegister }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('אימייל לא תקין', 'הכנס כתובת אימייל תקינה');
      return;
    }
    if (password.length < 6) {
      Alert.alert('סיסמה חסרה', 'הכנס סיסמה באורך 6 תווים לפחות');
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('שגיאה', result.error ?? 'לא ניתן להתחבר כעת, נסה שוב');
      return;
    }

    onLoggedIn?.();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
        {/* Brand */}
        <View style={styles.brand}>
          <BrandMark size={36} colors={colors} />
          <Text style={[styles.brandName, { color: colors.ink1, fontFamily: fonts.serif }]}>
            דוחות
          </Text>
        </View>

        {/* Headline */}
        <View style={styles.hero}>
          <Text style={[styles.headline, { color: colors.ink1, fontFamily: fonts.serif }]}>
            ברוך הבא חזרה
          </Text>
          <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הכנס אימייל וסיסמה כדי להתחבר
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label="אימייל"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            icon={<Icons.mail size={20} color={colors.ink3} />}
            colors={colors}
          />

          <Field
            label="סיסמה"
            placeholder="לפחות 6 תווים"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            icon={<Icons.shield size={20} color={colors.ink3} />}
            colors={colors}
          />

          <View style={[styles.infoRow, { backgroundColor: colors.aiBg, borderColor: 'rgba(90,135,112,0.2)' }]}>
            <Icons.sparkle size={16} color={colors.ai2} />
            <Text style={[styles.infoText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              התחברות מאובטחת עם אימייל וסיסמה
            </Text>
          </View>

          <Button
            kind="primary"
            size="lg"
            full
            onPress={handleLogin}
            iconRight={<Icons.back size={20} color={colors.bg} />}
            colors={colors}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <Pressable onPress={onRegister} style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.ink3, fontFamily: fonts.sans }]}>
              חדש בדוחות?{' '}
              <Text style={[styles.registerLink, { color: colors.accent }]}>
                הירשם בחינם
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  hero: { marginTop: 52, marginBottom: 36 },
  headline: { fontSize: 38, fontWeight: '500', lineHeight: 42, letterSpacing: -1.2, marginBottom: 10, textAlign: 'right' },
  sub: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  form: { gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 13, fontWeight: '500' },
  footer: { marginTop: 'auto', alignItems: 'center', gap: 20 },
  divider: { width: '100%', height: 1 },
  registerRow: { alignItems: 'center' },
  registerText: { fontSize: 15, textAlign: 'center' },
  registerLink: { fontWeight: '700' },
});
