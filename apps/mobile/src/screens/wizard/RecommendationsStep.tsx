import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Card, Pill } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface RecommendationsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

const RECOMMENDATIONS = [
  {
    priority: 'מיידי',
    priorityColor: (c: typeof lightColors) => c.danger,
    priorityBg: (c: typeof lightColors) => c.dangerBg,
    title: 'ניתוק מים מקומי',
    desc: 'הפסקת אספקת מים לדירה העליונה עד לאיתור מדויק של מקור הנזילה',
  },
  {
    priority: 'תוך 48 שעות',
    priorityColor: (c: typeof lightColors) => c.warn,
    priorityBg: (c: typeof lightColors) => c.warnBg,
    title: 'פתיחת קיר ובדיקה',
    desc: 'פירוק של 30×30 ס״מ באזור הסימון לחשיפת הצנרת ובדיקת מצב הצינור',
  },
  {
    priority: 'עד שבועיים',
    priorityColor: (c: typeof lightColors) => c.ai2,
    priorityBg: (c: typeof lightColors) => c.aiBg,
    title: 'איטום וטיפול בקיר',
    desc: 'לאחר תיקון: ייבוש מואץ, החלפת בידוד, צביעה ושיקום',
  },
];

export function RecommendationsStep({ colors = lightColors, onNext, onBack }: RecommendationsStepProps) {
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={5} ofSteps={5} onBack={onBack} colors={colors} />
      <ProgressBar value={1} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aiLabel}>
          <Icons.sparkle size={14} color={colors.ai2} />
          <Text style={[styles.aiLabelText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            הומלצו על-ידי AI · ניתן לעריכה
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
          המלצות לטיפול
        </Text>

        {/* Editable summary */}
        <Card padding={18} colors={colors}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
              סיכום הממצאים
            </Text>
            <Pressable>
              <Icons.edit size={16} color={colors.ink3} />
            </Pressable>
          </View>
          <Text style={[styles.summaryText, { color: colors.ink2, fontFamily: fonts.sans }]}>
            {'במהלך הביקור התגלתה '}
            <Text style={{ color: colors.ink1, fontWeight: '700' }}>נזילה פעילה בקיר המערבי</Text>
            {' של חדר השינה, ליד החלון. בבדיקה תרמית זוהה הפרש טמפרטורה של 4.2°C, המעיד על מקור רטיבות מהצנרת הראשית בקומה העליונה.'}
          </Text>
        </Card>

        {/* Recommendations */}
        <View style={styles.recList}>
          {RECOMMENDATIONS.map((rec, i) => (
            <Card key={i} padding={16} elev={0} colors={colors}>
              <View style={styles.recRow}>
                <View style={[styles.recNum, { backgroundColor: rec.priorityBg(colors) }]}>
                  <Text style={[styles.recNumText, { color: rec.priorityColor(colors), fontFamily: fonts.sans }]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={styles.recContent}>
                  <Pill bg={rec.priorityBg(colors)} color={rec.priorityColor(colors)}>
                    {rec.priority}
                  </Pill>
                  <Text style={[styles.recTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                    {rec.title}
                  </Text>
                  <Text style={[styles.recDesc, { color: colors.ink3, fontFamily: fonts.sans }]}>
                    {rec.desc}
                  </Text>
                </View>
                <Pressable>
                  <Icons.edit size={16} color={colors.ink3} />
                </Pressable>
              </View>
            </Card>
          ))}

          {/* Add custom */}
          <Pressable style={[styles.addBtn, { borderColor: colors.lineStrong }]}>
            <Icons.plus size={18} color={colors.ink3} />
            <Text style={[styles.addBtnText, { color: colors.ink3, fontFamily: fonts.sans }]}>
              הוספת המלצה
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button kind="primary" size="lg" full onPress={onNext} iconRight={<Icons.back size={20} color={colors.bg} />} colors={colors}>
          הצג תצוגה מקדימה
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
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLabelText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700' },
  summaryText: { fontSize: 14, lineHeight: 23 },
  recList: { gap: 10 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  recNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recNumText: { fontSize: 14, fontWeight: '700' },
  recContent: { flex: 1, gap: 8 },
  recTitle: { fontSize: 15, fontWeight: '700' },
  recDesc: { fontSize: 13, lineHeight: 20 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: '600' },
});
