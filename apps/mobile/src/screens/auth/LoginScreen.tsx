import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/shared';
import { Button, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { signInWithUsername } from '@/services/auth';

interface LoginScreenProps {
  colors?: typeof lightColors;
  onLoggedIn?: () => void;
}

export function LoginScreen({ colors = lightColors, onLoggedIn }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setLoading(false); // reset only on error; success keeps spinner until layout redirects
      Alert.alert('כניסה נכשלה', result.error ?? 'שגיאה לא ידועה');
      return;
    }

    onLoggedIn?.();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
            כניסה לדוחות
          </Text>
          <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הכנס שם משתמש וסיסמה להתחברות
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label="שם משתמש"
            placeholder="username"
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
              <Icons.eye size={18} color={showPassword ? colors.accent : colors.ink3} />
            </Pressable>
          </View>

          <Button
            kind="primary"
            size="lg"
            full
            onPress={handleLogin}
            disabled={loading}
            iconRight={<Icons.back size={20} color={colors.bg} />}
            colors={colors}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </Button>
        </View>

        {/* Legal footer */}
        <Text style={[styles.legal, { color: colors.ink4, fontFamily: fonts.sans }]}>
          {'בהמשך השימוש באפליקציה אתה מאשר את '}
          <Text
            style={[styles.legalLink, { color: colors.ink2 }]}
            onPress={() => Linking.openURL('https://dohot.netlify.app/terms')}
          >
            תנאי השימוש
          </Text>
          {' ו'}
          <Text
            style={[styles.legalLink, { color: colors.ink2 }]}
            onPress={() => Linking.openURL('https://dohot.netlify.app/privacy')}
          >
            מדיניות הפרטיות
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flexGrow: 1, paddingHorizontal: 28 },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  hero: { marginTop: 52, marginBottom: 36 },
  headline: { fontSize: 38, fontWeight: '500', lineHeight: 42, letterSpacing: -1.2, marginBottom: 10, textAlign: 'right' },
  sub: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  form: { gap: 14 },
  eyeBtn: { position: 'absolute', right: 16, bottom: 16 },
  legal: { marginTop: 'auto', paddingTop: 20, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  legalLink: { fontWeight: '600', textDecorationLine: 'underline' },
});
