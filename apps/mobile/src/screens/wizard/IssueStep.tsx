import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface IssueStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

const ISSUES = [
  { id: 'leak', label: 'גילוי נזילה', desc: 'מים, לחות, רטיבות', Icon: Icons.drop, color: '#4A7B9D', bg: '#E2EBF1' },
  { id: 'waterproofing', label: 'איטום', desc: 'גג, מקלחת, חזיתות', Icon: Icons.shield, color: '#5A8770', bg: '#E5EDE7' },
  { id: 'pipe', label: 'בעיית צנרת', desc: 'פיצוץ, חסימה', Icon: Icons.pipe, color: '#C2613B', bg: '#F8E9DF' },
  { id: 'roof', label: 'נזק גג', desc: 'רעפים, יציאות', Icon: Icons.roof, color: '#B8862B', bg: '#F4ECD7' },
  { id: 'moisture', label: 'עובש ולחות', desc: 'בידוד, אוורור', Icon: Icons.moisture, color: '#8B5A8B', bg: '#EFE0EF' },
  { id: 'other', label: 'אחר', desc: 'תיאור חופשי', Icon: Icons.more, color: '#807A72', bg: '#EFEDE7' },
] as const;

export function IssueStep({ colors = lightColors, onNext, onBack }: IssueStepProps) {
  const [selected, setSelected] = React.useState<string>('leak');

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={2} ofSteps={5} onBack={onBack} colors={colors} />
      <ProgressBar value={2 / 5} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
          סוג התקלה
        </Text>
        <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
          בחר את הסוג המתאים — נתאים לך תבנית
        </Text>

        <View style={styles.grid}>
          {ISSUES.map((issue) => {
            const on = selected === issue.id;
            return (
              <Pressable
                key={issue.id}
                onPress={() => setSelected(issue.id)}
                style={[
                  styles.tile,
                  {
                    backgroundColor: on ? issue.bg : colors.bgElev,
                    borderWidth: on ? 1.5 : 1,
                    borderColor: on ? issue.color : colors.line,
                  },
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: on ? '#fff' : issue.bg }]}>
                  <issue.Icon size={22} color={issue.color} />
                </View>
                <View>
                  <Text style={[styles.tileLabel, { color: on ? issue.color : colors.ink1, fontFamily: fonts.sans }]}>
                    {issue.label}
                  </Text>
                  <Text style={[styles.tileDesc, { color: on ? issue.color : colors.ink3, fontFamily: fonts.sans, opacity: on ? 0.85 : 1 }]}>
                    {issue.desc}
                  </Text>
                </View>
                {on && (
                  <View style={[styles.checkBadge, { backgroundColor: issue.color }]}>
                    <Icons.check size={14} color="#fff" stroke={3} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* AI tip */}
        <View style={[styles.tip, { backgroundColor: colors.bgSunken }]}>
          <Icons.sparkle size={18} color={colors.ai2} />
          <Text style={[styles.tipText, { color: colors.ink2, fontFamily: fonts.sans }]}>
            <Text style={[styles.tipBold, { color: colors.ai2 }]}>טיפ:</Text> ניתן להוסיף תקלות נוספות בהמשך
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button kind="primary" size="lg" full onPress={onNext} iconRight={<Icons.back size={20} color={colors.bg} />} colors={colors}>
          המשך לתמונות
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
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '47.5%',
    height: 130,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 15, fontWeight: '700' },
  tileDesc: { fontSize: 11, marginTop: 2 },
  checkBadge: {
    position: 'absolute',
    top: 12,
    end: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  tipText: { fontSize: 13, flex: 1 },
  tipBold: { fontWeight: '700' },
});
