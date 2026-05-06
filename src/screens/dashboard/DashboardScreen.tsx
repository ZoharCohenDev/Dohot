import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, type TabId } from '@/components/layout';
import { Avatar, WaveBar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts, shadows } from '@/theme/tokens';

interface DashboardScreenProps {
  colors?: typeof lightColors;
  onCreateReport?: () => void;
  onNavigate?: (tab: TabId) => void;
  onCreateType?: (type: string) => void;
}

const STATS = [
  { value: '23', label: 'דוחות החודש', color: (c: typeof lightColors) => c.ink1 },
  { value: '8', label: 'הצעות פעילות', color: (c: typeof lightColors) => c.accent },
  { value: '4.9', label: 'דירוג', color: (c: typeof lightColors) => c.ai2, star: true },
];

const ACTIONS = [
  { type: 'report', title: 'דוח מקצועי', desc: 'תיעוד נזק', Icon: Icons.doc, colorFn: (c: typeof lightColors) => c.accent, bgFn: (c: typeof lightColors) => c.accentBg },
  { type: 'quote', title: 'הצעת מחיר', desc: 'תמחור פריטים', Icon: Icons.quote, colorFn: (c: typeof lightColors) => c.info, bgFn: (c: typeof lightColors) => c.infoBg },
  { type: 'worklog', title: 'תיעוד עבודה', desc: 'לפני / אחרי', Icon: Icons.image, colorFn: (c: typeof lightColors) => c.ai2, bgFn: (c: typeof lightColors) => c.aiBg },
  { type: 'agreement', title: 'הסכם עבודה', desc: 'חתימה דיגיטלית', Icon: Icons.agreement, colorFn: (c: typeof lightColors) => c.warn, bgFn: (c: typeof lightColors) => c.warnBg },
];

const RECENT = [
  { title: 'דוח גילוי נזילה — דירת קוטון', sub: 'נשלח ב-WhatsApp • היום', Icon: Icons.doc, colorFn: (c: typeof lightColors) => c.accent, bgFn: (c: typeof lightColors) => c.accentBg },
  { title: 'הצעת מחיר — בניין מנשה 14', sub: 'ממתינה לאישור • אתמול', Icon: Icons.quote, colorFn: (c: typeof lightColors) => c.info, bgFn: (c: typeof lightColors) => c.infoBg },
  { title: 'דוח איטום גג — משפחת לוי', sub: 'נחתם • 3 ימים', Icon: Icons.shieldCheck, colorFn: (c: typeof lightColors) => c.ai2, bgFn: (c: typeof lightColors) => c.aiBg },
];

export function DashboardScreen({ colors = lightColors, onCreateReport, onNavigate, onCreateType }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.greeting}>
            <Avatar name="דניאל כהן" size={42} />
            <View>
              <Text style={[styles.greetSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                בוקר טוב,
              </Text>
              <Text style={[styles.greetName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                דניאל
              </Text>
            </View>
          </View>
          <Pressable style={[styles.notifBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Icons.bell size={20} color={colors.ink1} />
            <View style={[styles.notifDot, { backgroundColor: colors.accent }]} />
          </Pressable>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          {STATS.map((stat, i) => (
            <View
              key={i}
              style={[styles.statCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
            >
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: stat.color(colors), fontFamily: fonts.sans }]}>
                  {stat.value}
                </Text>
                {stat.star && <Icons.star size={14} color={colors.ai2} />}
              </View>
              <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Hero voice card */}
        <Pressable onPress={onCreateReport} style={styles.voiceCard}>
          {/* Sage aurora */}
          <View style={styles.voiceAurora} pointerEvents="none" />
          <View style={styles.voiceTagRow}>
            <Icons.sparkle size={16} color="#84B097" />
            <Text style={styles.voiceTag}>עוזר חכם</Text>
          </View>
          <Text style={styles.voiceTitle}>
            {'צרו דוח חדש '}
            <Text style={styles.voiceTitleItalic}>בקול בלבד</Text>
          </Text>
          <View style={styles.voiceBottom}>
            <View style={styles.micBtn}>
              <Icons.micFill size={22} color="#1B2A22" />
            </View>
            <WaveBar color="#84B097" barCount={8} heights={[8, 16, 12, 20, 14, 18, 10, 22]} />
          </View>
        </Pressable>

        {/* 4 action tiles */}
        <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
          מה ליצור?
        </Text>
        <View style={styles.actionsGrid}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.type}
              onPress={() => onCreateType?.(a.type)}
              style={[styles.actionTile, { backgroundColor: colors.bgElev }, shadows.card]}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.bgFn(colors) }]}>
                <a.Icon size={22} color={a.colorFn(colors)} />
              </View>
              <View>
                <Text style={[styles.actionTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                  {a.title}
                </Text>
                <Text style={[styles.actionDesc, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {a.desc}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent activity */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            פעילות אחרונה
          </Text>
          <Pressable>
            <Text style={[styles.seeAll, { color: colors.ink3, fontFamily: fonts.sans }]}>
              הכל ←
            </Text>
          </Pressable>
        </View>
        <View style={styles.recentList}>
          {RECENT.map((r, i) => (
            <Pressable
              key={i}
              style={[styles.recentRow, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
            >
              <View style={[styles.recentIcon, { backgroundColor: r.bgFn(colors) }]}>
                <r.Icon size={20} color={r.colorFn(colors)} />
              </View>
              <View style={styles.recentInfo}>
                <Text style={[styles.recentTitle, { color: colors.ink1, fontFamily: fonts.sans }]} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={[styles.recentSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {r.sub}
                </Text>
              </View>
              <Icons.chevL size={18} color={colors.ink4} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="home" onTab={onNavigate} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
  },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetSub: { fontSize: 12 },
  greetName: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 11,
    end: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  statLabel: { fontSize: 11, marginTop: 2 },
  // Voice hero card
  voiceCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#1B2A22',
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#1B2A22',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  voiceAurora: {
    position: 'absolute',
    top: -40,
    end: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(132,176,151,0.25)',
  },
  voiceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  voiceTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#84B097',
    letterSpacing: 1,
  },
  voiceTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 30,
    letterSpacing: -0.6,
    color: '#F5F3EE',
    maxWidth: 260,
  },
  voiceTitleItalic: {
    fontStyle: 'italic',
    color: '#B8D4C2',
  },
  voiceBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#84B097',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  actionTile: {
    width: '47.5%',
    borderRadius: 20,
    padding: 16,
    height: 132,
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionDesc: { fontSize: 12, marginTop: 2 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: { fontSize: 12, fontWeight: '600' },
  recentList: { gap: 8 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: { flex: 1, minWidth: 0 },
  recentTitle: { fontSize: 14, fontWeight: '600' },
  recentSub: { fontSize: 12, marginTop: 2 },
});
