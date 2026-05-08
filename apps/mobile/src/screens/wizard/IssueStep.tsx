import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import { PROFESSION_ISSUES, type IssueOption } from '@/config/professionIssues';
import { useWizardStep } from '@/hooks/useWizardStep';
import type { Profession } from '@dohot/shared';

interface IssueStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

const ICON_MAP = {
  drop: Icons.drop,
  pipe: Icons.pipe,
  roof: Icons.roof,
  moisture: Icons.moisture,
  sparkle: Icons.sparkle,
  building: Icons.building,
  shield: Icons.shield,
  more: Icons.more,
} as const;

export function IssueStep({ colors = lightColors, onNext, onBack }: IssueStepProps) {
  const wizard = useWizard();
  const { businessProfile } = useAuth();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();

  const profession = (businessProfile?.profession ?? 'other') as Profession;
  const issues: IssueOption[] = PROFESSION_ISSUES[profession] ?? PROFESSION_ISSUES.other;

  const [selectedId, setSelectedId] = React.useState<string>(wizard.state.issueType || issues[0]?.id || '');
  const [issueNote, setIssueNote] = React.useState(wizard.state.issueNote);
  const [customText, setCustomText] = React.useState('');

  const selectedIssue = issues.find((i) => i.id === selectedId) ?? issues[0];

  const handleNext = () => {
    const label = selectedId === 'other' && customText.trim()
      ? customText.trim()
      : (selectedIssue?.label ?? selectedId);
    wizard.setIssueData(selectedId, label);
    wizard.setIssueNote(issueNote);
    if (onNext) onNext();
    else goNext();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={stepNum} ofSteps={stepOf} onBack={onBack ?? goBack} colors={colors} />
      <ProgressBar value={progress} colors={colors} />

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
          {issues.map((issue) => {
            const on = selectedId === issue.id;
            const IssueIcon = ICON_MAP[issue.icon] ?? Icons.more;
            return (
              <Pressable
                key={issue.id}
                onPress={() => setSelectedId(issue.id)}
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
                  <IssueIcon size={22} color={issue.color} />
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

        {/* Custom input when "other" is selected */}
        {selectedId === 'other' && (
          <View style={[styles.customInputWrap, { borderColor: colors.line, backgroundColor: colors.bgElev }]}>
            <Icons.edit size={18} color={colors.ink3} />
            <TextInput
              style={[styles.customInput, { color: colors.ink1, fontFamily: fonts.sans }]}
              placeholder="תאר את הבעיה…"
              placeholderTextColor={colors.ink4}
              value={customText}
              onChangeText={setCustomText}
              textAlign="right"
            />
          </View>
        )}

        <Field
          label="הערות נוספות (אופציונלי)"
          placeholder="מיקום, נסיבות, משך הבעיה…"
          icon={<Icons.edit size={20} color={colors.ink3} />}
          value={issueNote}
          onChangeText={setIssueNote}
          multiline
          colors={colors}
        />

        <View style={[styles.tip, { backgroundColor: colors.bgSunken }]}>
          <Icons.sparkle size={18} color={colors.ai2} />
          <Text style={[styles.tipText, { color: colors.ink2, fontFamily: fonts.sans }]}>
            <Text style={[styles.tipBold, { color: colors.ai2 }]}>טיפ:</Text>{' '}
            ניתן להוסיף פרטים נוספים בשלב ההקלטה
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          המשך לתמונות
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
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
  tileIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  customInput: { flex: 1, fontSize: 15 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  tipText: { fontSize: 13, flex: 1 },
  tipBold: { fontWeight: '700' },
});
