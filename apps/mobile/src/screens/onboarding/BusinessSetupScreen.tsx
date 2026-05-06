import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Card, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { supabase, tables } from '@/lib/supabase';
import type { Profession } from '@dohot/shared';

interface BusinessSetupScreenProps {
  colors?: typeof lightColors;
  /** Pre-filled from RegisterScreen */
  initialName?: string;
  initialProfession?: Profession;
  onDone?: () => void;
  onBack?: () => void;
}

export function BusinessSetupScreen({
  colors = lightColors,
  initialName = '',
  initialProfession = 'other',
  onDone,
  onBack,
}: BusinessSetupScreenProps) {
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('חסר שם עסק', 'הכנס את שם העסק שלך');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('שגיאה', 'לא נמצא משתמש מחובר');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from(tables.businessProfiles)
      .update({
        full_name: initialName,
        business_name: businessName.trim(),
        profession: initialProfession,
        phone: phone.trim() || null,
        license_number: licenseNumber.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      Alert.alert('שגיאה בשמירה', error.message);
      return;
    }

    onDone?.();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        step={2}
        ofSteps={2}
        onBack={onBack}
        large
        title="פרטי העסק"
        subtitle="יופיעו בכל המסמכים שלך — ניתן לשנות מאוחר יותר"
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo upload (UI only for now) */}
        <Card padding={18} colors={colors}>
          <View style={styles.logoRow}>
            <View style={[styles.logoBox, { backgroundColor: colors.bgSunken, borderColor: colors.lineStrong }]}>
              <Icons.image size={26} color={colors.ink3} />
            </View>
            <View style={styles.logoInfo}>
              <Text style={[styles.logoTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>לוגו העסק</Text>
              <Text style={[styles.logoSub, { color: colors.ink3, fontFamily: fonts.sans }]}>יופיע בכל המסמכים</Text>
            </View>
            <Button kind="ghost" size="sm" icon={<Icons.upload size={16} color={colors.ink1} />} colors={colors}>
              העלאה
            </Button>
          </View>
        </Card>

        <Field
          label="שם העסק"
          placeholder="גילוי נזילות בע״מ"
          icon={<Icons.building size={20} color={colors.ink3} />}
          value={businessName}
          onChangeText={setBusinessName}
          colors={colors}
        />

        <View style={styles.twoCol}>
          <View style={styles.half}>
            <Field
              label="טלפון העסק"
              placeholder="054-0000000"
              keyboardType="phone-pad"
              icon={<Icons.phone size={20} color={colors.ink3} />}
              value={phone}
              onChangeText={setPhone}
              colors={colors}
            />
          </View>
          <View style={styles.half}>
            <Field
              label="ח.פ / עוסק"
              placeholder="000000000"
              keyboardType="number-pad"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              colors={colors}
            />
          </View>
        </View>

        <Field
          label="תיאור קצר של העסק"
          multiline
          rows={3}
          placeholder="ניסיון של 15 שנה בגילוי נזילות ואיטום..."
          value={bio}
          onChangeText={setBio}
          colors={colors}
        />

        <View style={[styles.tip, { backgroundColor: colors.aiBg, borderColor: 'rgba(90,135,112,0.2)' }]}>
          <Icons.sparkle size={16} color={colors.ai2} />
          <Text style={[styles.tipText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            פרטים אלו ישמשו לאוטומציה של הדוחות שלך — כתוב אותם כפי שאתה רוצה שיופיעו ללקוחות
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleSave}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          {saving ? 'שומר...' : 'כניסה לאפליקציה'}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBox: { width: 64, height: 64, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  logoInfo: { flex: 1 },
  logoTitle: { fontWeight: '700', fontSize: 15 },
  logoSub: { fontSize: 13, marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, textAlign: 'right' },
});
