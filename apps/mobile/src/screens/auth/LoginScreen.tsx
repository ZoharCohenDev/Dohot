import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/shared';
import { Button, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { sendPhoneOTP } from '@/services/auth';
import { toE164, isValidIsraeliPhone } from '@/lib/phone';

interface LoginScreenProps {
  colors?: typeof lightColors;
  onCodeSent?: (phone: string) => void;
  onRegister?: () => void;
}

export function LoginScreen({ colors = lightColors, onCodeSent, onRegister }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!isValidIsraeliPhone(phone)) {
      Alert.alert('מספר לא תקין', 'הכנס מספר טלפון ישראלי תקין כגון 054-1234567');
      return;
    }

    setLoading(true);
    const e164 = toE164(phone);
    const result = await sendPhoneOTP(e164);
    setLoading(false);

    if (!result.success) {
      Alert.alert('שגיאה', result.error ?? 'לא ניתן לשלוח קוד כעת, נסה שוב');
      return;
    }

    onCodeSent?.(e164);
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
            הכנס את מספר הטלפון שלך כדי להתחבר
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Field
            label="מספר טלפון"
            placeholder="054-0000000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            icon={<Icons.phone size={20} color={colors.ink3} />}
            colors={colors}
          />

          <View style={[styles.infoRow, { backgroundColor: colors.aiBg, borderColor: 'rgba(90,135,112,0.2)' }]}>
            <Icons.sparkle size={16} color={colors.ai2} />
            <Text style={[styles.infoText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              נשלח אליך קוד אימות ב-SMS
            </Text>
          </View>

          <Button
            kind="primary"
            size="lg"
            full
            onPress={handleSendCode}
            iconRight={<Icons.back size={20} color={colors.bg} />}
            colors={colors}
          >
            {loading ? 'שולח...' : 'שלח קוד'}
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
