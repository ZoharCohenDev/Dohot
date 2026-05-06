import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Button } from '@/components/primitives';
import { lightColors, fonts } from '@/theme/tokens';
import { verifyPhoneOTP, sendPhoneOTP } from '@/services/auth';

interface OtpVerifyScreenProps {
  phone: string;
  colors?: typeof lightColors;
  onVerified?: () => void;
  onBack?: () => void;
}

const CODE_LENGTH = 6;

export function OtpVerifyScreen({ phone, colors = lightColors, onVerified, onBack }: OtpVerifyScreenProps) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const displayPhone = phone.replace('+972', '0').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === CODE_LENGTH - 1) {
      const full = [...next].join('');
      if (full.length === CODE_LENGTH) handleVerify(full);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const token = fullCode ?? code.join('');
    if (token.length < CODE_LENGTH) {
      Alert.alert('קוד חסר', 'הכנס את 6 ספרות הקוד שקיבלת');
      return;
    }

    setLoading(true);
    const result = await verifyPhoneOTP(phone, token);
    setLoading(false);

    if (!result.success) {
      Alert.alert('קוד שגוי', result.error ?? 'הקוד שגוי או פג תוקף — בקש קוד חדש');
      setCode(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      return;
    }

    onVerified?.();
  };

  const handleResend = async () => {
    setResending(true);
    await sendPhoneOTP(phone);
    setResending(false);
    setCode(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();
    Alert.alert('נשלח', 'קוד חדש נשלח לטלפון שלך');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header onBack={onBack} colors={colors} />

      <View style={[styles.body, { paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            אימות מספר הטלפון
          </Text>
          <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הכנס את הקוד שנשלח ל-
            <Text style={{ color: colors.ink1, fontWeight: '700', writingDirection: 'ltr' }}>
              {displayPhone}
            </Text>
          </Text>
        </View>

        {/* 6-digit PIN boxes */}
        <View style={styles.pinRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              style={[
                styles.pinBox,
                {
                  borderColor: digit ? colors.accent : colors.lineStrong,
                  backgroundColor: digit ? colors.accentBg : colors.bgElev,
                  color: colors.ink1,
                  fontFamily: fonts.sans,
                },
              ]}
            />
          ))}
        </View>

        <Button
          kind="primary"
          size="lg"
          full
          onPress={() => handleVerify()}
          colors={colors}
        >
          {loading ? 'מאמת...' : 'אמת קוד'}
        </Button>

        <Pressable onPress={handleResend} style={styles.resendRow}>
          <Text style={[styles.resendText, { color: colors.ink3, fontFamily: fonts.sans }]}>
            {resending ? 'שולח...' : 'לא קיבלת? '}
            {!resending && (
              <Text style={[styles.resendLink, { color: colors.ink1 }]}>שלח שוב</Text>
            )}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 28, gap: 24 },
  textBlock: { gap: 10 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 34, letterSpacing: -0.6, textAlign: 'right' },
  sub: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  pinRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  pinBox: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  resendRow: { alignItems: 'center' },
  resendText: { fontSize: 14 },
  resendLink: { fontWeight: '700' },
});
