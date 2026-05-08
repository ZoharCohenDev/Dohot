import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Card, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { supabase, tables } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { pickAndUploadImage, deleteStorageFile, pathFromPublicUrl } from '@/services/storage';
import type { Profession } from '@dohot/shared';

interface BusinessSetupScreenProps {
  colors?: typeof lightColors;
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
  const { user, businessProfile, refreshBusinessProfile } = useAuth();

  const [ownerName, setOwnerName] = useState(initialName);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [certificationsText, setCertificationsText] = useState('');
  const [defaultDisclaimer, setDefaultDisclaimer] = useState(
    'הדוח נערך על סמך בדיקה ויזואלית ושימוש בציוד מקצועי במועד הביקור. ממצאים נוספים עשויים להתגלות במהלך עבודות הפירוק או התיקון.',
  );

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [sigUploading, setSigUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOwnerName(businessProfile?.full_name || initialName);
    setBusinessName(businessProfile?.business_name ?? '');
    setEmail(businessProfile?.email || user?.email || '');
    setPhone(businessProfile?.phone ?? '');
    setLicenseNumber(businessProfile?.license_number ?? '');
    setBio(businessProfile?.bio ?? '');
    setDefaultDisclaimer(
      businessProfile?.default_disclaimer ||
        'הדוח נערך על סמך בדיקה ויזואלית ושימוש בציוד מקצועי במועד הביקור. ממצאים נוספים עשויים להתגלות במהלך עבודות הפירוק או התיקון.',
    );
    setCertificationsText(
      businessProfile?.certifications?.map((c) => c.year ? `${c.name} (${c.year})` : c.name).join('\n') ?? '',
    );
    setLogoUri(businessProfile?.logo_url ?? null);
    setSignatureUri(businessProfile?.signature_url ?? null);
  }, [businessProfile, initialName, user?.email]);

  const handlePickLogo = async () => {
    if (!user?.id) return;
    setLogoUploading(true);
    try {
      // Delete old file before replacing to keep storage clean
      if (logoUri) {
        const oldPath = pathFromPublicUrl(logoUri, 'logos');
        if (oldPath) await deleteStorageFile('logos', oldPath);
      }
      const url = await pickAndUploadImage(user.id, 'logos', { aspect: [1, 1] });
      if (url) setLogoUri(url);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן היה להעלות את הלוגו. נסה שוב.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePickSignature = async () => {
    if (!user?.id) return;
    setSigUploading(true);
    try {
      if (signatureUri) {
        const oldPath = pathFromPublicUrl(signatureUri, 'signatures');
        if (oldPath) await deleteStorageFile('signatures', oldPath);
      }
      const url = await pickAndUploadImage(user.id, 'signatures', { aspect: [4, 1], quality: 0.9 });
      if (url) setSignatureUri(url);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן היה להעלות את החתימה. נסה שוב.');
    } finally {
      setSigUploading(false);
    }
  };

  const handleSave = async () => {
    if (!ownerName.trim()) {
      Alert.alert('חסר שם בעלים', 'הכנס את שם בעל העסק');
      return;
    }
    if (!businessName.trim()) {
      Alert.alert('חסר שם עסק', 'הכנס את שם העסק שלך');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('אימייל לא תקין', 'הכנס כתובת אימייל תקינה');
      return;
    }

    setSaving(true);

    if (!user) {
      Alert.alert('שגיאה', 'לא נמצא משתמש מחובר');
      setSaving(false);
      return;
    }

    const certifications = certificationsText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name, year: '' }));

    const { error } = await supabase
      .from(tables.businessProfiles)
      .upsert({
        id: user.id,
        full_name: ownerName.trim(),
        business_name: businessName.trim(),
        email: email.trim().toLowerCase(),
        profession: initialProfession,
        phone: phone.trim() || null,
        license_number: licenseNumber.trim() || null,
        bio: bio.trim() || null,
        certifications,
        default_disclaimer: defaultDisclaimer.trim() || null,
        logo_url: logoUri,
        signature_url: signatureUri,
      });

    setSaving(false);

    if (error) {
      Alert.alert('שגיאה בשמירה', error.message);
      return;
    }

    await refreshBusinessProfile();
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
        {/* Logo upload */}
        <Card padding={18} colors={colors}>
          <View style={styles.mediaRow}>
            <View style={[styles.mediaBox, { backgroundColor: colors.bgSunken, borderColor: colors.lineStrong }]}>
              {logoUploading ? (
                <ActivityIndicator size="small" color={colors.ink3} />
              ) : logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.mediaImg} resizeMode="cover" />
              ) : (
                <Icons.image size={26} color={colors.ink3} />
              )}
            </View>
            <View style={styles.mediaInfo}>
              <Text style={[styles.mediaTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>לוגו העסק</Text>
              <Text style={[styles.mediaSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                {logoUri ? 'הועלה בהצלחה' : 'יופיע בכל המסמכים'}
              </Text>
            </View>
            <Button
              kind="ghost"
              size="sm"
              disabled={logoUploading}
              onPress={handlePickLogo}
              icon={<Icons.upload size={16} color={colors.ink1} />}
              colors={colors}
            >
              {logoUri ? 'החלפה' : 'העלאה'}
            </Button>
          </View>
        </Card>

        {/* Signature upload */}
        <Card padding={18} colors={colors}>
          <View style={styles.mediaRow}>
            <View style={[styles.mediaBox, { backgroundColor: colors.bgSunken, borderColor: colors.lineStrong }]}>
              {sigUploading ? (
                <ActivityIndicator size="small" color={colors.ink3} />
              ) : signatureUri ? (
                <Image source={{ uri: signatureUri }} style={styles.mediaImg} resizeMode="contain" />
              ) : (
                <Icons.signature size={26} color={colors.ink3} />
              )}
            </View>
            <View style={styles.mediaInfo}>
              <Text style={[styles.mediaTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>חתימה דיגיטלית</Text>
              <Text style={[styles.mediaSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                {signatureUri ? 'הועלתה בהצלחה' : 'תצורף לכל מסמך'}
              </Text>
            </View>
            <Button
              kind="ghost"
              size="sm"
              disabled={sigUploading}
              onPress={handlePickSignature}
              icon={<Icons.upload size={16} color={colors.ink1} />}
              colors={colors}
            >
              {signatureUri ? 'החלפה' : 'העלאה'}
            </Button>
          </View>
        </Card>

        <Field
          label="שם בעל העסק"
          placeholder="ישראל ישראלי"
          icon={<Icons.user size={20} color={colors.ink3} />}
          value={ownerName}
          onChangeText={setOwnerName}
          colors={colors}
        />

        <Field
          label="שם העסק"
          placeholder="גילוי נזילות בע״מ"
          icon={<Icons.building size={20} color={colors.ink3} />}
          value={businessName}
          onChangeText={setBusinessName}
          colors={colors}
        />

        <Field
          label="אימייל העסק"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          icon={<Icons.mail size={20} color={colors.ink3} />}
          value={email}
          onChangeText={setEmail}
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

        <Field
          label="תעודות והסמכות"
          multiline
          rows={3}
          placeholder="כל תעודה בשורה נפרדת"
          icon={<Icons.shieldCheck size={20} color={colors.ink3} />}
          value={certificationsText}
          onChangeText={setCertificationsText}
          colors={colors}
        />

        <Field
          label="הסתייגות משפטית ברירת מחדל"
          multiline
          rows={4}
          placeholder="טקסט שיופיע בסוף כל מסמך"
          value={defaultDisclaimer}
          onChangeText={setDefaultDisclaimer}
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
          disabled={saving || logoUploading || sigUploading}
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
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mediaBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaImg: { width: 64, height: 64 },
  mediaInfo: { flex: 1 },
  mediaTitle: { fontWeight: '700', fontSize: 15 },
  mediaSub: { fontSize: 13, marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, textAlign: 'right' },
});
