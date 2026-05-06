import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Card, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface CustomerStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

const PROPERTY_TYPES = [
  { label: 'דירה', Icon: Icons.building, selected: true },
  { label: 'בית פרטי', Icon: Icons.home },
  { label: 'בניין', Icon: Icons.building },
  { label: 'מסחרי', Icon: Icons.building },
  { label: 'משרד', Icon: Icons.building },
  { label: 'אחר', Icon: Icons.more },
];

export function CustomerStep({ colors = lightColors, onNext, onBack }: CustomerStepProps) {
  const [propertyType, setPropertyType] = React.useState(0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={1} ofSteps={5} onBack={onBack} colors={colors} />
      <ProgressBar value={1 / 5} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            למי הדוח?
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            פרטי הלקוח יופיעו בכותרת המסמך
          </Text>
        </View>

        {/* AI customer suggestion */}
        <Card padding={14} colors={colors} style={{ backgroundColor: colors.aiBg, borderWidth: 1, borderColor: 'rgba(90,135,112,0.25)' }}>
          <View style={styles.aiSuggestRow}>
            <View style={[styles.aiIcon, { backgroundColor: colors.ai2 }]}>
              <Icons.sparkle size={18} color="#fff" />
            </View>
            <View style={styles.aiSuggestInfo}>
              <Text style={[styles.aiSuggestTitle, { color: colors.ai2, fontFamily: fonts.sans }]}>
                זיהינו לקוח קיים
              </Text>
              <Text style={[styles.aiSuggestName, { color: colors.ink2, fontFamily: fonts.sans }]}>
                אבי כהן • דירת קוטון, הרצליה
              </Text>
            </View>
            <Text style={[styles.loadBtn, { color: colors.ai2, fontFamily: fonts.sans }]}>טען</Text>
          </View>
        </Card>

        <Field label="שם הלקוח" placeholder="לדוגמה: אבי כהן" icon={<Icons.user size={20} color={colors.ink3} />} defaultValue="אבי כהן" colors={colors} />
        <Field label="כתובת הנכס" placeholder="רחוב, מספר, עיר" icon={<Icons.pin2 size={20} color={colors.ink3} />} defaultValue="הרצל 47, הרצליה" colors={colors} />

        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <Field label="טלפון" placeholder="050…" icon={<Icons.phone size={20} color={colors.ink3} />} defaultValue="052-2837461" keyboardType="phone-pad" colors={colors} />
          </View>
          <View style={styles.halfField}>
            <Field label="תאריך ביקור" icon={<Icons.calendar size={20} color={colors.ink3} />} defaultValue="6 במאי 2026" colors={colors} />
          </View>
        </View>

        {/* Property type grid */}
        <View>
          <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            סוג הנכס
          </Text>
          <View style={styles.propertyGrid}>
            {PROPERTY_TYPES.map((pt, i) => (
              <Pressable
                key={i}
                onPress={() => setPropertyType(i)}
                style={[
                  styles.propertyTile,
                  {
                    backgroundColor: propertyType === i ? colors.ink1 : colors.bgElev,
                    borderWidth: propertyType === i ? 0 : 1,
                    borderColor: colors.line,
                  },
                ]}
              >
                <pt.Icon size={20} color={propertyType === i ? colors.bg : colors.ink1} />
                <Text
                  style={[
                    styles.propertyLabel,
                    { color: propertyType === i ? colors.bg : colors.ink1, fontFamily: fonts.sans },
                  ]}
                >
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button kind="primary" size="lg" full onPress={onNext} iconRight={<Icons.back size={20} color={colors.bg} />} colors={colors}>
          המשך לסוג התקלה
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
    paddingTop: 20,
    paddingBottom: 140,
    gap: 14,
  },
  titleBlock: { gap: 6, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  aiSuggestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiSuggestInfo: { flex: 1 },
  aiSuggestTitle: { fontSize: 13, fontWeight: '700' },
  aiSuggestName: { fontSize: 12, marginTop: 2 },
  loadBtn: { fontWeight: '700', fontSize: 13 },
  twoCol: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', paddingHorizontal: 4, marginBottom: 8 },
  propertyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  propertyTile: {
    width: '30%',
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  propertyLabel: { fontSize: 12, fontWeight: '600' },
});
