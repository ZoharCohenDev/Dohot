import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, type TabId } from '@/components/layout';
import { ScaledText } from '@/components/primitives';
import { Avatar, WaveBar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts, shadows } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import type { DocumentType } from '@dohot/shared';

interface DashboardScreenProps {
  colors?: typeof lightColors;
  onCreateReport?: () => void;
  onNavigate?: (tab: TabId) => void;
  onCreateType?: (type: string) => void;
}

const ACTIONS = [
  { type: 'report',    title: 'דוח מקצועי',   desc: 'תיעוד נזק',          Icon: Icons.doc,       colorFn: (c: typeof lightColors) => c.accent, bgFn: (c: typeof lightColors) => c.accentBg },
  { type: 'quote',     title: 'הצעת מחיר',    desc: 'תמחור פריטים',       Icon: Icons.quote,     colorFn: (c: typeof lightColors) => c.info,   bgFn: (c: typeof lightColors) => c.infoBg },
  { type: 'worklog',   title: 'תיעוד עבודה',  desc: 'לפני / אחרי',        Icon: Icons.image,     colorFn: (c: typeof lightColors) => c.ai2,    bgFn: (c: typeof lightColors) => c.aiBg },
  { type: 'agreement', title: 'הסכם עבודה',   desc: 'חתימה דיגיטלית',    Icon: Icons.agreement, colorFn: (c: typeof lightColors) => c.warn,   bgFn: (c: typeof lightColors) => c.warnBg },
];

function docTypeStyle(type: DocumentType, colors: typeof lightColors) {
  switch (type) {
    case 'report':    return { Icon: Icons.doc,       colorFn: colors.accent, bgFn: colors.accentBg };
    case 'quote':     return { Icon: Icons.quote,     colorFn: colors.info,   bgFn: colors.infoBg };
    case 'worklog':   return { Icon: Icons.image,     colorFn: colors.ai2,    bgFn: colors.aiBg };
    case 'agreement': return { Icon: Icons.agreement, colorFn: colors.warn,   bgFn: colors.warnBg };
  }
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7)  return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

export function DashboardScreen({ colors = lightColors, onCreateReport, onNavigate, onCreateType }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { businessProfile } = useAuth();
  const { stats, recent } = useDashboard();

  const displayName = businessProfile?.full_name || businessProfile?.business_name || '';
  const firstName = displayName.split(' ')[0] ?? displayName;

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
            <Avatar name={displayName} size={42} logoUrl={businessProfile?.logo_url} />
            <View>
              <ScaledText style={[styles.greetSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                בוקר טוב,
              </ScaledText>
              <ScaledText style={[styles.greetName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                {firstName}
              </ScaledText>
            </View>
          </View>
          <Pressable style={[styles.notifBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Icons.bell size={20} color={colors.ink1} />
            <View style={[styles.notifDot, { backgroundColor: colors.accent }]} />
          </Pressable>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <ScaledText style={[styles.statValue, { color: colors.ink1, fontFamily: fonts.sans }]}>
              {stats.monthlyReports}
            </ScaledText>
            <ScaledText style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>
              דוחות החודש
            </ScaledText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <ScaledText style={[styles.statValue, { color: colors.accent, fontFamily: fonts.sans }]}>
              {stats.activeQuotes}
            </ScaledText>
            <ScaledText style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>
              הצעות פעילות
            </ScaledText>
          </View>
        </View>

        {/* Hero voice card */}
        <Pressable onPress={onCreateReport} style={styles.voiceCard}>
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
        <ScaledText style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
          מה ליצור?
        </ScaledText>
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
                <ScaledText style={[styles.actionTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                  {a.title}
                </ScaledText>
                <ScaledText style={[styles.actionDesc, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {a.desc}
                </ScaledText>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent activity */}
        {recent.length > 0 && (
          <>
            <View style={styles.recentHeader}>
              <ScaledText style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
                פעילות אחרונה
              </ScaledText>
              <Pressable style={styles.seeAllBtn} onPress={() => onNavigate?.('docs')}>
                <ScaledText style={[styles.seeAll, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  הכל
                </ScaledText>
                <Icons.chevL size={14} color={colors.ink3} />
              </Pressable>
            </View>
            <View style={styles.recentList}>
              {recent.map((doc) => {
                const { Icon, colorFn, bgFn } = docTypeStyle(doc.type, colors);
                const customerName = doc.customers?.name;
                const subtitle = customerName
                  ? `${customerName} · ${relativeDate(doc.created_at)}`
                  : relativeDate(doc.created_at);
                return (
                  <Pressable
                    key={doc.id}
                    style={[styles.recentRow, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
                  >
                    <View style={[styles.recentIcon, { backgroundColor: bgFn }]}>
                      <Icon size={20} color={colorFn} />
                    </View>
                    <View style={styles.recentInfo}>
                      <ScaledText style={[styles.recentTitle, { color: colors.ink1, fontFamily: fonts.sans }]} numberOfLines={1}>
                        {doc.title}
                      </ScaledText>
                      <ScaledText style={[styles.recentSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                        {subtitle}
                      </ScaledText>
                    </View>
                    <Icons.chevL size={18} color={colors.ink4} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
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
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  statLabel: { fontSize: 11, marginTop: 2 },
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
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
