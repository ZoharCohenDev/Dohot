import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, Pressable,
} from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Field, Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { adminUpdateUser, type AdminUser } from '@/services/adminApi';
import type { Profession, UserRole } from '@dohot/shared';
import { PROFESSION_LABELS } from './AdminUsersScreen';

const PROFESSIONS: Array<{ id: Profession; label: string; Icon: React.ComponentType<{ size: number; color: string }> }> = [
  { id: 'leak_detection',     label: PROFESSION_LABELS.leak_detection,     Icon: Icons.drop },
  { id: 'plumber',            label: PROFESSION_LABELS.plumber,            Icon: Icons.pipe },
  { id: 'electrician',        label: PROFESSION_LABELS.electrician,        Icon: Icons.sparkle },
  { id: 'renovation',         label: PROFESSION_LABELS.renovation,         Icon: Icons.building },
  { id: 'roofing',            label: PROFESSION_LABELS.roofing,            Icon: Icons.roof },
  { id: 'ac',                 label: PROFESSION_LABELS.ac,                 Icon: Icons.more },
  { id: 'waterproofing',      label: PROFESSION_LABELS.waterproofing,      Icon: Icons.drop },
  { id: 'general_technician', label: PROFESSION_LABELS.general_technician, Icon: Icons.more },
];

function isoToDisplay(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function parseDisplayDate(display: string): string | null {
  if (!display.trim()) return null;
  const parts = display.trim().split('/');
  if (parts.length !== 3) return undefined as unknown as null; // will trigger validation
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`;
}

interface EditUserScreenProps {
  user: AdminUser;
  colors?: typeof lightColors;
  onDone?: () => void;
  onBack?: () => void;
}

export function EditUserScreen({ user, colors = lightColors, onDone, onBack }: EditUserScreenProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [profession, setProfession] = useState<Profession>(user.profession);
  const [role, setRole] = useState<UserRole>(user.role);
  const [expiryDate, setExpiryDate] = useState(isoToDisplay(user.subscription_expiration_date));
  const [isActive, setIsActive] = useState(user.is_active);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('שגיאה', 'יש להזין שם מלא'); return; }
    if (newPassword && newPassword.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    let isoExpiry: string | null = null;
    if (expiryDate.trim()) {
      const parsed = parseDisplayDate(expiryDate);
      if (!parsed) { Alert.alert('שגיאה', 'פורמט תאריך שגוי — השתמש ב-DD/MM/YYYY'); return; }
      isoExpiry = parsed;
    }

    setSaving(true);
    try {
      await adminUpdateUser(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        profession,
        role,
        subscription_expiration_date: isoExpiry,
        is_active: isActive,
        password: newPassword || undefined,
      });
      Alert.alert('נשמר', 'הפרטים עודכנו בהצלחה', [
        { text: 'אישור', onPress: onDone },
      ]);
    } catch (e) {
      Alert.alert('שגיאה', e instanceof Error ? e.message : 'לא ניתן לשמור');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = () => {
    const action = isActive ? 'להשהות' : 'להפעיל מחדש';
    Alert.alert(
      `${action} משתמש`,
      `האם ${action} את @${user.username}?`,
      [
        { text: 'ביטול', style: 'cancel' },
        { text: action, style: isActive ? 'destructive' : 'default', onPress: () => setIsActive((v) => !v) },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        onBack={onBack}
        large
        title="עריכת משתמש"
        subtitle={`@${user.username}`}
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Active/Disabled banner */}
        {!isActive && (
          <View style={[styles.disabledBanner, { backgroundColor: colors.dangerBg }]}>
            <Icons.shieldCheck size={16} color={colors.danger} />
            <Text style={[styles.disabledText, { color: colors.danger, fontFamily: fonts.sans }]}>
              חשבון זה מושהה
            </Text>
          </View>
        )}

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
              label="שם משתמש (קריאה בלבד)"
              value={user.username}
              editable={false}
              icon={<Icons.at size={20} color={colors.ink3} />}
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

        {/* New password */}
        <View>
          <Field
            label="סיסמה חדשה (אופציונלי)"
            placeholder="השאר ריק לשמירת הסיסמה הקיימת"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            icon={<Icons.lock size={20} color={colors.ink3} />}
            value={newPassword}
            onChangeText={setNewPassword}
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

        {/* Subscription + role */}
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

        {/* Disable/Enable */}
        <Card padding={16} colors={colors}>
          <View style={styles.activeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>סטטוס חשבון</Text>
              <Text style={[styles.activeSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                {isActive ? 'החשבון פעיל — הטכנאי יכול להתחבר' : 'החשבון מושהה — הטכנאי לא יכול להתחבר'}
              </Text>
            </View>
            <Pressable
              onPress={handleToggleActive}
              style={[styles.toggleActiveBtn, { backgroundColor: isActive ? colors.dangerBg : colors.accentBg }]}
            >
              <Text style={[styles.toggleActiveBtnText, { color: isActive ? colors.danger : colors.accent, fontFamily: fonts.sans }]}>
                {isActive ? 'השהה' : 'הפעל'}
              </Text>
            </Pressable>
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
          {saving ? 'שומר...' : 'שמור שינויים'}
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
  disabledBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14 },
  disabledText: { fontSize: 14, fontWeight: '600' },
  activeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  activeLabel: { fontSize: 14, fontWeight: '600' },
  activeSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  toggleActiveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  toggleActiveBtnText: { fontSize: 13, fontWeight: '700' },
});
