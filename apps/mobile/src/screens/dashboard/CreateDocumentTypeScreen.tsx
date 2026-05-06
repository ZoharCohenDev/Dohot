import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, type TabId } from '@/components/layout';
import { Icons } from '@/components/icons';
import { lightColors, fonts, shadows } from '@/theme/tokens';
import type { DocumentType } from '@/navigation/types';

interface CreateDocumentTypeScreenProps {
  colors?: typeof lightColors;
  onSelectType?: (type: DocumentType) => void;
  onNavigate?: (tab: TabId) => void;
}

const TYPES: Array<{
  type: DocumentType;
  title: string;
  desc: string;
  detail: string;
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  colorFn: (c: typeof lightColors) => string;
  bgFn: (c: typeof lightColors) => string;
}> = [
  {
    type: 'report',
    title: 'דוח מקצועי',
    desc: 'תיעוד נזק, ממצאים והמלצות',
    detail: 'מתאים לביקורי שטח, גילוי נזילות ואיטום',
    Icon: Icons.doc,
    colorFn: (c) => c.accent,
    bgFn: (c) => c.accentBg,
  },
  {
    type: 'quote',
    title: 'הצעת מחיר',
    desc: 'רשימת פריטים עם מחירים',
    detail: 'חישוב אוטומטי של מע"מ וסה"כ',
    Icon: Icons.quote,
    colorFn: (c) => c.info,
    bgFn: (c) => c.infoBg,
  },
  {
    type: 'worklog',
    title: 'תיעוד עבודה',
    desc: 'תמונות לפני ואחרי',
    detail: 'הוכחת ביצוע לחברות ביטוח',
    Icon: Icons.image,
    colorFn: (c) => c.ai,
    bgFn: (c) => c.aiBg,
  },
  {
    type: 'agreement',
    title: 'הסכם עבודה',
    desc: 'חוזה עם חתימה דיגיטלית',
    detail: 'מותאם לדרישות משפטיות בישראל',
    Icon: Icons.agreement,
    colorFn: (c) => c.warn,
    bgFn: (c) => c.warnBg,
  },
];

export function CreateDocumentTypeScreen({
  colors = lightColors,
  onSelectType,
  onNavigate,
}: CreateDocumentTypeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header text */}
        <View style={styles.headerBlock}>
          <View style={[styles.aiPill, { backgroundColor: colors.aiBg }]}>
            <Icons.sparkle size={14} color={colors.ai2} />
            <Text style={[styles.aiPillText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              עוזר חכם
            </Text>
          </View>
          <Text style={[styles.headline, { color: colors.ink1, fontFamily: fonts.serif }]}>
            מה ליצור היום?
          </Text>
          <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.sans }]}>
            המערכת תכתוב את המסמך עבורך — רק בחר סוג
          </Text>
        </View>

        {/* Type cards */}
        <View style={styles.cards}>
          {TYPES.map((t) => (
            <Pressable
              key={t.type}
              onPress={() => onSelectType?.(t.type)}
              style={[styles.card, { backgroundColor: colors.bgElev }, shadows.card]}
            >
              <View style={[styles.cardIcon, { backgroundColor: t.bgFn(colors) }]}>
                <t.Icon size={28} color={t.colorFn(colors)} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                  {t.title}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.ink2, fontFamily: fonts.sans }]}>
                  {t.desc}
                </Text>
                <Text style={[styles.cardDetail, { color: colors.ink4, fontFamily: fonts.sans }]}>
                  {t.detail}
                </Text>
              </View>
              <Icons.chevL size={20} color={colors.ink4} />
            </Pressable>
          ))}
        </View>

        {/* Voice shortcut */}
        <Pressable
          onPress={() => onSelectType?.('report')}
          style={[styles.voiceShortcut, { backgroundColor: '#1B2A22' }]}
        >
          <View style={styles.voiceShortcutLeft}>
            <Icons.micFill size={22} color="#84B097" />
            <View>
              <Text style={[styles.voiceTitle, { fontFamily: fonts.sans }]}>
                צור עם קול
              </Text>
              <Text style={[styles.voiceSub, { fontFamily: fonts.sans }]}>
                דבר ואנחנו נכתוב — הכי מהיר
              </Text>
            </View>
          </View>
          <Icons.chevL size={18} color="rgba(132,176,151,0.6)" />
        </Pressable>
      </ScrollView>

      <BottomNav active="create" onTab={onNavigate} colors={colors} />
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
  headerBlock: {
    marginBottom: 24,
    gap: 8,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 38,
    fontWeight: '500',
    lineHeight: 42,
    letterSpacing: -1.2,
    textAlign: 'right',
  },
  sub: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'right',
  },
  cards: {
    gap: 10,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 22,
    gap: 14,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    marginTop: 1,
  },
  cardDetail: {
    fontSize: 12,
    marginTop: 3,
  },
  voiceShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
  },
  voiceShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  voiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F5F3EE',
  },
  voiceSub: {
    fontSize: 12,
    color: '#84B097',
    marginTop: 2,
  },
});
