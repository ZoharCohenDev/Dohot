import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icons } from '@/components/icons';
import { Button } from '@/components/primitives';
import { lightColors, fonts } from '@/theme/tokens';
import { signOut } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/navigation/constants';

export default function ExpiredPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = lightColors;
  const { daysUntilExpiration, isActive } = useAuth();

  const isDisabled = !isActive;
  const daysSince = daysUntilExpiration !== null ? Math.abs(daysUntilExpiration) : 0;

  const handleSignOut = () => {
    Alert.alert('התנתקות', 'האם לצאת מהחשבון?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace(ROUTES.AUTH_LOGIN);
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerBg }]}>
        <Icons.shieldCheck size={40} color={colors.danger} />
      </View>

      <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
        {isDisabled ? 'החשבון מושהה' : 'המנוי שלך פג'}
      </Text>

      <Text style={[styles.body, { color: colors.ink3, fontFamily: fonts.sans }]}>
        {isDisabled
          ? 'החשבון שלך הושהה על ידי המנהל. לפרטים נוספים פנה למנהל המערכת.'
          : `המנוי פג לפני ${daysSince} ${daysSince === 1 ? 'יום' : 'ימים'}.`}
      </Text>

      {!isDisabled && (
        <View style={[styles.contactCard, { backgroundColor: colors.aiBg, borderColor: 'rgba(90,135,112,0.2)' }]}>
          <Icons.sparkle size={16} color={colors.ai2} />
          <Text style={[styles.contactText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            לחידוש המנוי פנה למנהל המערכת
          </Text>
        </View>
      )}

      <Button
        kind="ghost"
        size="lg"
        full
        onPress={handleSignOut}
        icon={<Icons.logout size={18} color={colors.danger} />}
        colors={colors}
        style={{ marginTop: 32 }}
      >
        התנתק
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '500', letterSpacing: -0.8, textAlign: 'center', marginBottom: 14 },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignSelf: 'stretch' },
  contactText: { flex: 1, fontSize: 13, fontWeight: '500', textAlign: 'right' },
});
