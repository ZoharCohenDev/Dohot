import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Header, FixedBottom } from '@/components/layout';
import { Button, Card, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface TrustScreenProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

const CERTIFICATIONS = [
  { name: 'הסמכת גילוי נזילות', date: '2019' },
  { name: 'תעודת קבלן רשום', date: '2021' },
];

export function TrustScreen({ colors = lightColors, onNext, onBack }: TrustScreenProps) {
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        step={2}
        ofSteps={3}
        onBack={onBack}
        large
        title="חתימה ותעודות"
        subtitle="יוטמעו בכל מסמך אוטומטית — חתום פעם אחת"
        colors={colors}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Digital signature pad */}
        <Card padding={20} colors={colors}>
          <View style={styles.sigHeader}>
            <View>
              <Text style={[styles.sigTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                חתימה דיגיטלית
              </Text>
              <Text style={[styles.sigSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                חתום באצבע על הריבוע
              </Text>
            </View>
            <Text style={[styles.clearBtn, { color: colors.ink3, fontFamily: fonts.sans }]}>
              נקה
            </Text>
          </View>
          <View style={[styles.sigCanvas, { backgroundColor: colors.bgSunken, borderColor: colors.line }]}>
            <Svg viewBox="0 0 300 140" width="100%" height="100%">
              <Path
                d="M30 90 Q50 70 70 85 T110 80 Q130 60 150 75 T200 70 Q230 50 260 85"
                fill="none"
                stroke={colors.ink1}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <Path d="M85 96 L 200 96" stroke={colors.ink3} strokeWidth="1" opacity="0.4" />
            </Svg>
            <Text style={[styles.sigName, { color: colors.ink3, fontFamily: fonts.sans }]}>
              דניאל כהן
            </Text>
          </View>
        </Card>

        {/* Certifications */}
        <Card padding={18} colors={colors}>
          <View style={styles.certHeader}>
            <Text style={[styles.certTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
              תעודות והסמכות
            </Text>
            <Button kind="ghost" size="sm" icon={<Icons.plus size={16} color={colors.ink1} />} colors={colors}>
              הוסף
            </Button>
          </View>
          <View style={styles.certList}>
            {CERTIFICATIONS.map((cert, i) => (
              <View
                key={i}
                style={[styles.certRow, { backgroundColor: colors.bgSunken }]}
              >
                <View style={[styles.certIcon, { backgroundColor: colors.aiBg }]}>
                  <Icons.shieldCheck size={20} color={colors.ai2} />
                </View>
                <View style={styles.certInfo}>
                  <Text style={[styles.certName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                    {cert.name}
                  </Text>
                  <Text style={[styles.certDate, { color: colors.ink3, fontFamily: fonts.sans }]}>
                    {cert.date}
                  </Text>
                </View>
                <Icons.check size={18} color={colors.ai2} />
              </View>
            ))}
          </View>
        </Card>

        <Field
          label="הסתייגות משפטית ברירת מחדל"
          multiline
          rows={4}
          defaultValue="הדוח נערך על סמך בדיקה ויזואלית ושימוש בציוד תרמי במועד הביקור. ממצאים נוספים עשויים להתגלות בעבודות הפירוק. אין במסמך זה משום אחריות לתוצאות תיקון שלא בוצע על ידי החברה."
          colors={colors}
        />
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button kind="primary" size="lg" full onPress={onNext} colors={colors}>
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
  sigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sigTitle: { fontWeight: '700', fontSize: 15 },
  sigSub: { fontSize: 13, marginTop: 2 },
  clearBtn: { fontWeight: '600', fontSize: 13 },
  sigCanvas: {
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  sigName: {
    position: 'absolute',
    bottom: 8,
    end: 12,
    fontSize: 11,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  certTitle: { fontWeight: '700', fontSize: 15 },
  certList: { gap: 8 },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  certIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certInfo: { flex: 1 },
  certName: { fontSize: 14, fontWeight: '600' },
  certDate: { fontSize: 12, marginTop: 2 },
});
