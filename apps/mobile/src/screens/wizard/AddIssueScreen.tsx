import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardExit } from '@/hooks/useWizardExit';

interface AddIssueScreenProps {
  colors?: typeof lightColors;
  onAddIssue?: () => void;
  onFinish?: () => void;
  onBack?: () => void;
}

const ISSUE_ICON: Record<string, React.ReactNode> = {};

function IssueSummaryCard({
  issueLabel,
  issueNum,
  hasDescription,
  hasPhotos,
  colors,
}: {
  issueLabel: string;
  issueNum: number;
  hasDescription: boolean;
  hasPhotos: boolean;
  colors: typeof lightColors;
}) {
  return (
    <View style={[styles.issueCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
      <View style={[styles.issueNum, { backgroundColor: colors.ink1 }]}>
        <Text style={[styles.issueNumText, { color: colors.bg, fontFamily: fonts.sans }]}>
          {issueNum}
        </Text>
      </View>
      <View style={styles.issueCardContent}>
        <Text style={[styles.issueLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>
          {issueLabel}
        </Text>
        <View style={styles.issueMeta}>
          {hasPhotos && (
            <View style={[styles.metaChip, { backgroundColor: colors.aiBg }]}>
              <Icons.camera size={11} color={colors.ai2} />
              <Text style={[styles.metaChipText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                תמונות
              </Text>
            </View>
          )}
          {hasDescription && (
            <View style={[styles.metaChip, { backgroundColor: colors.aiBg }]}>
              <Icons.mic size={11} color={colors.ai2} />
              <Text style={[styles.metaChipText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                תיאור
              </Text>
            </View>
          )}
        </View>
      </View>
      <Icons.check size={18} color={colors.ai2} stroke={2.5} />
    </View>
  );
}

export function AddIssueScreen({
  colors = lightColors,
  onAddIssue,
  onFinish,
  onBack,
}: AddIssueScreenProps) {
  const wizard = useWizard();
  const { triggerExit } = useWizardExit();
  const issues = wizard.state.reportIssues;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* AI badge */}
        <View style={styles.aiLabel}>
          <Icons.check size={14} color={colors.ai2} stroke={2.5} />
          <Text style={[styles.aiLabelText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            {`תקלה ${issues.length} תועדה בהצלחה`}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
          להוסיף תקלה נוספת?
        </Text>
        <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
          ניתן לתעד מספר תקלות באותו דוח
        </Text>

        {/* Summary of issues so far */}
        <View style={styles.issueList}>
          {issues.map((issue, i) => (
            <IssueSummaryCard
              key={issue.id}
              issueNum={i + 1}
              issueLabel={issue.issueLabel}
              hasPhotos={issue.photos.length > 0}
              hasDescription={!!issue.description.trim()}
              colors={colors}
            />
          ))}
        </View>

        {/* Add another issue button */}
        <Pressable
          style={[styles.addBtn, { borderColor: colors.lineStrong, backgroundColor: colors.bgElev }]}
          onPress={onAddIssue}
        >
          <View style={[styles.addBtnIcon, { backgroundColor: colors.ink1 }]}>
            <Icons.plus size={18} color={colors.bg} />
          </View>
          <View style={styles.addBtnText}>
            <Text style={[styles.addBtnTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
              הוסף תקלה נוספת
            </Text>
            <Text style={[styles.addBtnSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
              סוג תקלה, תמונות, תיאור קולי
            </Text>
          </View>
          <Icons.forward size={18} color={colors.ink3} />
        </Pressable>

        {/* AI info banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.aiBg }]}>
          <Icons.sparkle size={14} color={colors.ai2} />
          <Text style={[styles.infoText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            ה-AI יטפל בכל התקלות יחד ויבנה דוח מאורגן לפי כל תקלה
          </Text>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={onFinish}
          iconRight={<Icons.sparkle size={18} color={colors.bg} />}
          colors={colors}
        >
          סיים ושלח ל-AI
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
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 16 },

  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLabelText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },

  issueList: { gap: 10 },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  issueNum: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  issueNumText: { fontSize: 15, fontWeight: '700' },
  issueCardContent: { flex: 1, gap: 6 },
  issueLabel: { fontSize: 15, fontWeight: '700' },
  issueMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  metaChipText: { fontSize: 11, fontWeight: '600' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addBtnIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  addBtnText: { flex: 1 },
  addBtnTitle: { fontSize: 15, fontWeight: '700' },
  addBtnSub: { fontSize: 12, marginTop: 2 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 14, borderRadius: 14,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
