import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Modal,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
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

const PRIORITIES = ['מיידי', 'תוך 48 שעות', 'עד שבועיים'] as const;

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

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditState {
  issueIdx: number;
  recIdx: number | null; // null = new rec
  priority: string;
  title: string;
  description: string;
}

interface RecEditModalProps {
  editState: EditState;
  colors: typeof lightColors;
  onSave: (updated: EditState) => void;
  onClose: () => void;
}

function RecEditModal({ editState, colors, onSave, onClose }: RecEditModalProps) {
  const isStandard = PRIORITIES.includes(editState.priority as typeof PRIORITIES[number]);
  const [chipPriority, setChipPriority] = React.useState(isStandard ? editState.priority : 'אחר');
  const [customPriority, setCustomPriority] = React.useState(isStandard ? '' : editState.priority);
  const [title, setTitle] = React.useState(editState.title);
  const [description, setDescription] = React.useState(editState.description);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('שגיאה', 'יש להזין כותרת להמלצה');
      return;
    }
    const finalPriority = chipPriority === 'אחר' ? (customPriority.trim() || 'אחר') : chipPriority;
    onSave({ ...editState, priority: finalPriority, title: title.trim(), description: description.trim() });
  };

  const ALL_CHIPS = [...PRIORITIES, 'אחר'] as const;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.editOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.editBackdrop} onPress={onClose} />
        <View style={[styles.editSheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.editHandle, { backgroundColor: colors.line }]} />
          <Text style={[styles.editSheetTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
            {editState.recIdx === null ? 'הוספת המלצה' : 'עריכת המלצה'}
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editScrollContent}
            bounces={false}
          >
            {/* Priority chips */}
            <Text style={[styles.editLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>עדיפות</Text>
            <View style={styles.priorityRow}>
              {ALL_CHIPS.map((p) => {
                const style = PRIORITY_STYLE[p] ?? DEFAULT_PRIORITY_STYLE;
                const active = chipPriority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setChipPriority(p)}
                    style={[
                      styles.priorityChip,
                      {
                        backgroundColor: active ? style.bg(colors) : colors.bgElev,
                        borderColor: active ? style.color(colors) : colors.line,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.priorityChipText,
                      { color: active ? style.color(colors) : colors.ink3, fontFamily: fonts.sans },
                    ]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom priority text input (only when "אחר" selected) */}
            {chipPriority === 'אחר' && (
              <>
                <Text style={[styles.editLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>מסגרת זמן מותאמת</Text>
                <View style={[styles.editInputBox, { backgroundColor: colors.bgElev, borderColor: colors.lineStrong }]}>
                  <TextInput
                    value={customPriority}
                    onChangeText={setCustomPriority}
                    style={[styles.editInputText, { color: colors.ink1, fontFamily: fonts.sans }]}
                    textAlign="right"
                    placeholder="לדוגמה: תוך 3 ימים, בהזדמנות…"
                    placeholderTextColor={colors.ink4}
                    returnKeyType="next"
                  />
                </View>
              </>
            )}

            {/* Title */}
            <Text style={[styles.editLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>כותרת</Text>
            <View style={[styles.editInputBox, { backgroundColor: colors.bgElev, borderColor: colors.lineStrong }]}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={[styles.editInputText, { color: colors.ink1, fontFamily: fonts.sans }]}
                textAlign="right"
                placeholder="כותרת ההמלצה"
                placeholderTextColor={colors.ink4}
                returnKeyType="next"
              />
            </View>

            {/* Description */}
            <Text style={[styles.editLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>תיאור (אופציונלי)</Text>
            <View style={[styles.editInputBox, { backgroundColor: colors.bgElev, borderColor: colors.lineStrong, minHeight: 80 }]}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.editInputText, { color: colors.ink1, fontFamily: fonts.sans }]}
                textAlign="right"
                multiline
                textAlignVertical="top"
                placeholder="פרטים נוספים…"
                placeholderTextColor={colors.ink4}
              />
            </View>
          </ScrollView>

          <View style={styles.editActions}>
            <Button kind="ghost" size="md" onPress={onClose} colors={colors} style={{ flex: 1 }}>ביטול</Button>
            <Button kind="primary" size="md" onPress={handleSave} colors={colors} style={{ flex: 1 }}>שמור</Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function RecommendationsStep({ colors = lightColors, onNext, onBack, isSaving }: RecommendationsStepProps) {
  const wizard = useWizard();
  const { triggerExit } = useWizardExit();
  const issues = wizard.state.reportIssues;

  const [issueStates, setIssueStates] = React.useState(() => issues.map(initIssueState));
  const [editState, setEditState] = React.useState<EditState | null>(null);

  const openEdit = (issueIdx: number, recIdx: number) => {
    const rec = issueStates[issueIdx]?.recs[recIdx];
    if (!rec) return;
    setEditState({ issueIdx, recIdx, priority: rec.priority, title: rec.title, description: rec.description });
  };

  const openAdd = (issueIdx: number) => {
    setEditState({ issueIdx, recIdx: null, priority: 'עד שבועיים', title: '', description: '' });
  };

  const handleSaveEdit = (updated: EditState) => {
    const style = PRIORITY_STYLE[updated.priority] ?? DEFAULT_PRIORITY_STYLE;
    const rec: RecDisplay = {
      priority: updated.priority,
      title: updated.title,
      description: updated.description,
      priorityColor: style.color,
      priorityBg: style.bg,
    };
    setIssueStates(prev => prev.map((is, i) => {
      if (i !== updated.issueIdx) return is;
      if (updated.recIdx === null) {
        return { ...is, recs: [...is.recs, rec] };
      }
      return { ...is, recs: is.recs.map((r, j) => j === updated.recIdx ? rec : r) };
    }));
    setEditState(null);
  };

  const deleteRec = (issueIdx: number, recIdx: number) => {
    Alert.alert('מחיקת המלצה', 'למחוק את ההמלצה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק', style: 'destructive',
        onPress: () => setIssueStates(prev => prev.map((is, i) =>
          i === issueIdx ? { ...is, recs: is.recs.filter((_, j) => j !== recIdx) } : is
        )),
      },
    ]);
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
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
                        {!!rec.description && (
                          <Text style={[styles.recDesc, { color: colors.ink3, fontFamily: fonts.sans }]}>
                            {rec.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.recActions}>
                        <Pressable
                          onPress={() => openEdit(issueIdx, recIdx)}
                          hitSlop={8}
                          style={[styles.recActionBtn, { backgroundColor: colors.bgSunken }]}
                        >
                          <Icons.edit size={15} color={colors.ink3} />
                        </Pressable>
                        <Pressable
                          onPress={() => deleteRec(issueIdx, recIdx)}
                          hitSlop={8}
                          style={[styles.recActionBtn, { backgroundColor: colors.dangerBg }]}
                        >
                          <Icons.trash size={15} color={colors.danger} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                ))}

                {/* Add recommendation */}
                <Pressable
                  style={[styles.addBtn, { borderColor: colors.lineStrong }]}
                  onPress={() => openAdd(issueIdx)}
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

      {editState && (
        <RecEditModal
          editState={editState}
          colors={colors}
          onSave={handleSaveEdit}
          onClose={() => setEditState(null)}
        />
      )}
    </KeyboardAvoidingView>
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
  recNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recNumText: { fontSize: 14, fontWeight: '700' },
  recContent: { flex: 1, gap: 8 },
  recTitle: { fontSize: 15, fontWeight: '700' },
  recDesc: { fontSize: 13, lineHeight: 20 },
  recActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  recActionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', gap: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: '600' },

  // Edit modal
  editOverlay: { flex: 1, justifyContent: 'flex-end' },
  editBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  editSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
  },
  editScrollContent: { gap: 10, paddingBottom: 8 },
  editHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  editSheetTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  editLabel: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  priorityRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  priorityChip: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1.5,
  },
  priorityChipText: { fontSize: 13, fontWeight: '700' },
  editInputBox: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  editInputText: { fontSize: 15 },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8, paddingBottom: 34 },
});
