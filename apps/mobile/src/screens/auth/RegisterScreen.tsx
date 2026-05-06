import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { signUpWithEmail } from '@/services/auth';

interface RegisterScreenProps {
  colors?: typeof lightColors;
  onRegistered?: (name: string, profession: string) => void;
  onBack?: () => void;
  onLogin?: () => void;
}

export function RegisterScreen({ colors = lightColors, onRegistered, onBack, onLogin }: RegisterScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!username.trim()) {
      Alert.alert('חסר שם משתמש', 'הכנס שם משתמש');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('אימייל לא תקין', 'הכנס כתובת אימייל תקינה');
      return;
    }
    if (password.length < 6) {
      Alert.alert('סיסמה קצרה מדי', 'בחר סיסמה באורך 6 תווים לפחות');
      return;
    }

    setLoading(true);
    const result = await signUpWithEmail(email.trim().toLowerCase(), password, {
      full_name: username.trim(),
      profession: 'other',
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('שגיאה', result.error ?? 'לא ניתן להירשם כעת, נסה שוב');
      return;
    }

    if (result.emailConfirmationRequired) {
      Alert.alert(
        'אישור אימייל פעיל',
        'כדי להירשם מיד בלי אימייל אישור, כבה את Confirm email בהגדרות Supabase.',
      );
      return;
    }

    onRegistered?.(username.trim(), 'other');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        step={1}
        ofSteps={2}
        onBack={onBack}
        large
        title="הצטרפות לדוחות"
        subtitle="מלא פרטים בסיסיים — ייקח דקה"
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="שם משתמש"
          placeholder="לדוגמה: זהר כהן"
          icon={<Icons.user size={20} color={colors.ink3} />}
          value={username}
          onChangeText={setUsername}
          colors={colors}
        />

        <Field
          label="אימייל"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          icon={<Icons.mail size={20} color={colors.ink3} />}
          value={email}
          onChangeText={setEmail}
          colors={colors}
        />

        <Field
          label="סיסמה"
          placeholder="לפחות 6 תווים"
          secureTextEntry
          icon={<Icons.shield size={20} color={colors.ink3} />}
          value={password}
          onChangeText={setPassword}
          colors={colors}
        />

        <Pressable onPress={onLogin} style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.ink3, fontFamily: fonts.sans }]}>
            כבר רשום?{' '}
            <Text style={[styles.loginLink, { color: colors.ink1 }]}>התחבר</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          {loading ? 'יוצר חשבון...' : 'המשך'}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 14 },
  loginRow: { alignItems: 'center', paddingVertical: 8 },
  loginText: { fontSize: 14, textAlign: 'center' },
  loginLink: { fontWeight: '700' },
});
