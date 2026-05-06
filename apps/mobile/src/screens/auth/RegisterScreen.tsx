import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { sendPhoneOTP } from '@/services/auth';
import { toE164, isValidIsraeliPhone } from '@/lib/phone';

interface RegisterScreenProps {
  colors?: typeof lightColors;
  onCodeSent?: (phone: string, name: string, profession: string) => void;
  onBack?: () => void;
  onLogin?: () => void;
}

const PROFESSIONS = [
  { id: 'leak_detection', label: 'גילוי נזילות', Icon: Icons.drop },
  { id: 'plumber', label: 'אינסטלטור', Icon: Icons.pipe },
  { id: 'electrician', label: 'חשמלאי', Icon: Icons.sparkle },
  { id: 'renovation', label: 'שיפוצניק', Icon: Icons.building },
  { id: 'roofing', label: 'איטום גגות', Icon: Icons.roof },
  { id: 'other', label: 'אחר', Icon: Icons.more },
];

export function RegisterScreen({ colors = lightColors, onCodeSent, onBack, onLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('leak_detection');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) {
      Alert.alert('חסר שם', 'הכנס את שמך המלא');
      return;
    }
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

    onCodeSent?.(e164, name.trim(), profession);
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
          label="שם מלא"
          placeholder="ישראל ישראלי"
          icon={<Icons.user size={20} color={colors.ink3} />}
          value={name}
          onChangeText={setName}
          colors={colors}
        />

        <Field
          label="מספר טלפון"
          placeholder="054-0000000"
          keyboardType="phone-pad"
          icon={<Icons.phone size={20} color={colors.ink3} />}
          value={phone}
          onChangeText={setPhone}
          colors={colors}
        />

        {/* Profession picker */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            התחום שלך
          </Text>
          <View style={styles.profGrid}>
            {PROFESSIONS.map((p) => {
              const isActive = profession === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setProfession(p.id)}
                  style={[
                    styles.profTile,
                    {
                      backgroundColor: isActive ? colors.accentBg : colors.bgElev,
                      borderColor: isActive ? colors.accent : colors.line,
                    },
                  ]}
                >
                  <p.Icon size={22} color={isActive ? colors.accent : colors.ink3} />
                  <Text
                    style={[
                      styles.profLabel,
                      { color: isActive ? colors.accent : colors.ink2, fontWeight: isActive ? '700' : '500', fontFamily: fonts.sans },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
          {loading ? 'שולח קוד...' : 'המשך'}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: -0.1, textAlign: 'right' },
  profGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profTile: { width: '31%', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 8 },
  profLabel: { fontSize: 12, textAlign: 'center' },
  loginRow: { alignItems: 'center', paddingVertical: 8 },
  loginText: { fontSize: 14, textAlign: 'center' },
  loginLink: { fontWeight: '700' },
});
