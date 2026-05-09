import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, Pressable,
} from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Field, Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { adminCreateUser } from '@/services/adminApi';
import type { Profession, UserRole } from '@dohot/shared';
import { PROFESSION_LABELS } from './AdminUsersScreen';

const PROFESSIONS: Array<{ id: Profession; label: string; Icon: React.ComponentType<{ size: number; color: string }> }> = [
  { id: 'leak_detection', label: PROFESSION_LABELS.leak_detection, Icon: Icons.drop },
  { id: 'plumber',        label: PROFESSION_LABELS.plumber,        Icon: Icons.pipe },
  { id: 'electrician',   label: PROFESSION_LABELS.electrician,    Icon: Icons.sparkle },
  { id: 'renovation',    label: PROFESSION_LABELS.renovation,     Icon: Icons.building },
  { id: 'roofing',       label: PROFESSION_LABELS.roofing,        Icon: Icons.roof },
  { id: 'ac',            label: PROFESSION_LABELS.ac,             Icon: Icons.more },
  { id: 'waterproofing', label: PROFESSION_LABELS.waterproofing,  Icon: Icons.drop },
  { id: 'general_technician', label: PROFESSION_LABELS.general_technician, Icon: Icons.more },
];

interface CreateUserScreenProps {
  colors?: typeof lightColors;
  onDone?: () => void;
  onBack?: () => void;
}

export function CreateUserScreen({ colors = lightColors, onDone, onBack }: CreateUserScreenProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState<Profession>('leak_detection');
  const [role, setRole] = useState<UserRole>('technician');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('שגיאה', 'יש להזין שם מלא'); return; }
    if (!username.trim()) { Alert.alert('שגיאה', 'יש להזין שם משתמש'); return; }
    if (username.includes(' ')) { Alert.alert('שגיאה', 'שם משתמש לא יכול להכיל רווחים'); return; }
    if (password.length < 6) { Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים'); return; }

    // Parse DD/MM/YYYY → YYYY-MM-DD
    let isoExpiry: string | undefined;
    if (expiryDate.trim()) {
      const parts = expiryDate.trim().split('/');
      if (parts.length !== 3 || parts.some((p) => !p)) {
        Alert.alert('שגיאה', 'פורמט תאריך שגוי — השתמש ב-DD/MM/YYYY');
        return;
      }
      const [dd, mm, yyyy] = parts;
      isoExpiry = `${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`;
    }

    setSaving(true);
    try {
      await adminCreateUser({
        username: username.toLowerCase().trim(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        profession,
        role,
        subscription_expiration_date: isoExpiry,
      });
      Alert.alert('נוצר בהצלחה', `המשתמש @${username} נוצר`, [
        { text: 'אישור', onPress: onDone },
      ]);
    } catch (e) {
      Alert.alert('שגיאה', e instanceof Error ? e.message : 'לא ניתן ליצור משתמש');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        onBack={onBack}
        large
        title="הוסף טכנאי"
        subtitle="יצירת חשבון משתמש חדש"
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal */}
        <Field
          label="שם מלא"
          placeholder="ישראל ישראלי"
          icon={<Icons.user size={20} color={colors.ink3} />}
          value={fullName}
          onChangeText={setFullName}
          colors={colors}
        />

        <View style={styles.twoCol}>
          <View style={styles.half}>
            <Field
              label="שם משתמש"
              placeholder="israel123"
              autoCapitalize="none"
              autoCorrect={false}
              icon={<Icons.at size={20} color={colors.ink3} />}
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase().replace(/\s/g, ''))}
              colors={colors}
            />
          </View>
          <View style={styles.half}>
            <Field
              label="טלפון"
              placeholder="054-0000000"
              keyboardType="phone-pad"
              icon={<Icons.phone size={20} color={colors.ink3} />}
              value={phone}
              onChangeText={setPhone}
              colors={colors}
            />
          </View>
        </View>

        {/* Password */}
        <View>
          <Field
            label="סיסמה"
            placeholder="לפחות 6 תווים"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            icon={<Icons.lock size={20} color={colors.ink3} />}
            value={password}
            onChangeText={setPassword}
            colors={colors}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
            <Icons.eye size={18} color={showPassword ? colors.accent : colors.ink3} />
          </Pressable>
        </View>

        {/* Profession */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>תחום מקצועי</Text>
          <View style={styles.profGrid}>
            {PROFESSIONS.map((p) => {
              const active = profession === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setProfession(p.id)}
                  style={[styles.profTile, {
                    backgroundColor: active ? colors.accentBg : colors.bgElev,
                    borderColor: active ? colors.accent : colors.line,
                  }]}
                >
                  <p.Icon size={20} color={active ? colors.accent : colors.ink3} />
                  <Text style={[styles.profLabel, { color: active ? colors.accent : colors.ink2, fontWeight: active ? '700' : '500', fontFamily: fonts.sans }]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.twoCol}>
          <View style={styles.half}>
            <Field
              label="תוקף מנוי"
              placeholder="31/12/2026"
              keyboardType="numbers-and-punctuation"
              icon={<Icons.history size={20} color={colors.ink3} />}
              value={expiryDate}
              onChangeText={setExpiryDate}
              colors={colors}
            />
          </View>
          <View style={styles.half}>
            {/* Role toggle */}
            <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>תפקיד</Text>
            <View style={[styles.roleRow, { backgroundColor: colors.bgSunken }]}>
              {(['technician', 'admin'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={[styles.rolePill, r === role && { backgroundColor: colors.bgElev }]}
                >
                  <Text style={[styles.rolePillText, { color: r === role ? colors.ink1 : colors.ink3, fontFamily: fonts.sans, fontWeight: r === role ? '700' : '500' }]}>
                    {r === 'admin' ? 'מנהל' : 'טכנאי'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Card padding={14} colors={colors}>
          <View style={styles.tipRow}>
            <Icons.sparkle size={14} color={colors.ai2} />
            <Text style={[styles.tipText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              המשתמש יכנס עם שם המשתמש והסיסמה שהוגדרו
            </Text>
          </View>
        </Card>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleSave}
          disabled={saving}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          {saving ? 'יוצר...' : 'צור משתמש'}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 14 },
  twoCol: { flexDirection: 'row-reverse', gap: 12 },
  half: { flex: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: -0.1, textAlign: 'right' },
  profGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  profTile: { width: '31%', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  profLabel: { fontSize: 11, textAlign: 'center' },
  roleRow: { flexDirection: 'row-reverse', padding: 4, borderRadius: 12, gap: 4 },
  rolePill: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rolePillText: { fontSize: 13 },
  eyeBtn: { position: 'absolute', right: 16, bottom: 16 },
  tipRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, textAlign: 'right' },
});
