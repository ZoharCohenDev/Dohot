import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Card, Pill } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import type { Recommendation } from '@dohot/shared';
import { useWizard, type ReportIssue } from '@/context/WizardContext';
import { useWizardExit } from '@/hooks/useWizardExit';

interface RecommendationsStepProps {
  colors?: typeof lightColors;
  onNext?: (updates: { index: number; aiSummary: string; recs: Recommendation[] }[]) => void;
  onBack?: () => void;
  isSaving?: boolean;
}

type RecDisplay = Recommendation & {
  priorityColor: (c: typeof lightColors) => string;
  priorityBg: (c: typeof lightColors) => string;
};

const PRIORITY_STYLE: Record<string, { color: (c: typeof lightColors) => string; bg: (c: typeof lightColors) => string }> = {
  'מיידי':       { color: (c) => c.danger, bg: (c) => c.dangerBg },
  'תוך 48 שעות': { color: (c) => c.warn,   bg: (c) => c.warnBg   },
  'עד שבועיים':  { color: (c) => c.ai2,    bg: (c) => c.aiBg     },
};
const DEFAULT_PRIORITY_STYLE = { color: (c: typeof lightColors) => c.ink2, bg: (c: typeof lightColors) => c.bgSunken };

function toDisplay(rec: Recommendation): RecDisplay {
  const style = PRIORITY_STYLE[rec.priority] ?? DEFAULT_PRIORITY_STYLE;
  return { ...rec, priorityColor: style.color, priorityBg: style.bg };
}

const FALLBACK_RECOMMENDATIONS: RecDisplay[] = [
  { priority: 'מיידי', priorityColor: (c) => c.danger, priorityBg: (c) => c.dangerBg, title: 'ניתוק מים מקומי', description: 'הפסקת אספקת מים לדירה עד לאיתור מדויק של מקור הנזילה' },
  { priority: 'תוך 48 שעות', priorityColor: (c) => c.warn, priorityBg: (c) => c.warnBg, title: 'פתיחת קיר ובדיקה', description: 'פירוק חלקי לחשיפת הצנרת ובדיקת מצב הצינור' },
  { priority: 'עד שבועיים', priorityColor: (c) => c.ai2, priorityBg: (c) => c.aiBg, title: 'איטום וטיפול', description: 'לאחר תיקון: ייבוש מואץ, החלפת בידוד, שיקום' },
];

function initIssueState(issue: ReportIssue): { summary: string; recs: RecDisplay[] } {
  return {
    summary: issue.aiSummary || '',
    recs: issue.recommendations.length > 0 ? issue.recommendations.map(toDisplay) : FALLBACK_RECOMMENDATIONS,
  };
}

function IssueSectionTitle({ num, label, colors }: { num: number; label: string; colors: typeof lightColors }) {
  return (
    <View style={[styles.issueDivider, { borderColor: colors.line }]}>
      <View style={[styles.issueNumBadge, { backgroundColor: colors.ink1 }]}>
        <Text style={[styles.issueNumText, { color: colors.bg, fontFamily: fonts.sans }]}>{num}</Text>
      </View>
      <Text style={[styles.issueDividerLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>{label}</Text>
    </View>
  );
}

export function RecommendationsStep({ colors = lightColors, onNext, onBack, isSaving }: RecommendationsStepProps) {
  const wizard = useWizard();
  const { triggerExit } = useWizardExit();
  const issues = wizard.state.reportIssues;

  const [issueStates, setIssueStates] = React.useState(() => issues.map(initIssueState));

  const updateRec = (issueIdx: number, recIdx: number, updated: RecDisplay) => {
    setIssueStates(prev => prev.map((is, i) =>
      i === issueIdx ? { ...is, recs: is.recs.map((r, j) => (j === recIdx ? updated : r)) } : is
    ));
  };

  const addRec = (issueIdx: number) => {
    const blank: RecDisplay = {
      priority: 'עד שבועיים',
      priorityColor: (c) => c.ai2,
      priorityBg: (c) => c.aiBg,
      title: '',
      description: '',
    };
    setIssueStates(prev => prev.map((is, i) =>
      i === issueIdx ? { ...is, recs: [...is.recs, blank] } : is
    ));
  };

  const handleNext = () => {
    const updates = issueStates.map((is, index) => ({
      index,
      aiSummary: is.summary,
      recs: is.recs.map(({ priority, title, description }) => ({ priority, title, description })),
    }));
    onNext?.(updates);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        step={5}
        ofSteps={5}
        onBack={onBack}
        colors={colors}
        action={
          <Pressable
            onPress={triggerExit}
            style={[styles.exitBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
            hitSlop={6}
          >
            <Icons.home size={20} color={colors.ink2} />
          </Pressable>
        }
      />
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

        {issues.map((issue, issueIdx) => {
          const is = issueStates[issueIdx];
          if (!is) return null;
          return (
            <View key={issue.id} style={styles.issueBlock}>
              <IssueSectionTitle num={issueIdx + 1} label={issue.issueLabel} colors={colors} />

              {/* AI summary */}
              {!!is.summary && (
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
                    {is.summary}
                  </Text>
                </Card>
              )}

              {/* Recommendations */}
              <View style={styles.recList}>
                {is.recs.map((rec, recIdx) => (
                  <Card key={recIdx} padding={16} elev={0} colors={colors}>
                    <View style={styles.recRow}>
                      <View style={[styles.recNum, { backgroundColor: rec.priorityBg(colors) }]}>
                        <Text style={[styles.recNumText, { color: rec.priorityColor(colors), fontFamily: fonts.sans }]}>
                          {recIdx + 1}
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
                          {rec.description}
                        </Text>
                      </View>
                      <Pressable onPress={() => updateRec(issueIdx, recIdx, rec)}>
                        <Icons.edit size={16} color={colors.ink3} />
                      </Pressable>
                    </View>
                  </Card>
                ))}

                {/* Add recommendation */}
                <Pressable
                  style={[styles.addBtn, { borderColor: colors.lineStrong }]}
                  onPress={() => addRec(issueIdx)}
                >
                  <Icons.plus size={18} color={colors.ink3} />
                  <Text style={[styles.addBtnText, { color: colors.ink3, fontFamily: fonts.sans }]}>
                    הוספת המלצה
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          disabled={isSaving}
          onPress={handleNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          {isSaving ? 'שומר…' : 'הצג תצוגה מקדימה'}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLabelText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },

  issueBlock: { gap: 10 },
  issueDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderTopWidth: 1, marginTop: 4,
  },
  issueNumBadge: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  issueNumText: { fontSize: 14, fontWeight: '700' },
  issueDividerLabel: { fontSize: 15, fontWeight: '700' },

  summaryHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700' },
  summaryText: { fontSize: 14, lineHeight: 23 },

  recList: { gap: 10 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  recNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  recNumText: { fontSize: 14, fontWeight: '700' },
  recContent: { flex: 1, gap: 8 },
  recTitle: { fontSize: 15, fontWeight: '700' },
  recDesc: { fontSize: 13, lineHeight: 20 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', gap: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: '600' },
});
