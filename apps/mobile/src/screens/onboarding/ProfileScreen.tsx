import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Card, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface ProfileScreenProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

export function ProfileScreen({ colors = lightColors, onNext, onBack }: ProfileScreenProps) {
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        step={1}
        ofSteps={3}
        onBack={onBack}
        large
        title="ספר לנו עליך"
        subtitle="המידע יישמר לכל הדוחות שלך מראש"
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo upload */}
        <Card padding={18} colors={colors}>
          <View style={styles.logoRow}>
            <View style={[styles.logoBox, { backgroundColor: colors.bgSunken, borderColor: colors.lineStrong }]}>
              <Icons.image size={26} color={colors.ink3} />
            </View>
            <View style={styles.logoInfo}>
              <Text style={[styles.logoTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                לוגו העסק
              </Text>
              <Text style={[styles.logoSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                יופיע בכל המסמכים
              </Text>
            </View>
            <Button kind="ghost" size="sm" icon={<Icons.upload size={16} color={colors.ink1} />} colors={colors}>
              העלאה
            </Button>
          </View>
        </Card>

        <Field
          label="שם מלא"
          placeholder="ישראל ישראלי"
          icon={<Icons.user size={20} color={colors.ink3} />}
          defaultValue="דניאל כהן"
          colors={colors}
        />

        <Field
          label="שם העסק"
          placeholder="גילוי נזילות בע״מ"
          icon={<Icons.building size={20} color={colors.ink3} />}
          defaultValue="כהן גילוי נזילות"
          colors={colors}
        />

        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <Field
              label="טלפון"
              placeholder="050-0000000"
              icon={<Icons.phone size={20} color={colors.ink3} />}
              defaultValue="054-2837461"
              keyboardType="phone-pad"
              colors={colors}
            />
          </View>
          <View style={styles.halfField}>
            <Field
              label="ח.פ / עוסק"
              placeholder="000000000"
              defaultValue="514283746"
              keyboardType="number-pad"
              colors={colors}
            />
          </View>
        </View>

        <Field
          label="תיאור קצר של העסק"
          multiline
          rows={3}
          placeholder="ניסיון של 15 שנה בגילוי נזילות ואיתום…"
          defaultValue="גילוי נזילות מים בטכנולוגיית מצלמת חום, אקוסטיקה ובדיקת לחץ. מעל 12 שנה בתחום, עבודה מול חברות ביטוח."
          colors={colors}
        />
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={onNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          המשך
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInfo: {
    flex: 1,
  },
  logoTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  logoSub: {
    fontSize: 13,
    marginTop: 2,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
});
