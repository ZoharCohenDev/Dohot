import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, useBottomNavSpacing, type TabId } from '@/components/layout';
import { Icons } from '@/components/icons';
import { lightColors, fonts, shadows } from '@/theme/tokens';
import { DOCUMENT_TYPES } from '@/config/documentTypes';
import type { DocType } from '@/config/documentTypes';

interface CreateDocumentTypeScreenProps {
  colors?: typeof lightColors;
  onSelectType?: (type: DocType) => void;
  onNavigate?: (tab: TabId) => void;
}

const TYPE_VISUALS: Record<DocType, {
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  colorFn: (c: typeof lightColors) => string;
  bgFn: (c: typeof lightColors) => string;
}> = {
  report: {
    Icon: Icons.doc,
    colorFn: (c) => c.accent,
    bgFn: (c) => c.accentBg,
  },
  quote: {
    Icon: Icons.quote,
    colorFn: (c) => c.info,
    bgFn: (c) => c.infoBg,
  },
  warranty: {
    Icon: Icons.shieldCheck,
    colorFn: (c) => c.warn,
    bgFn: (c) => c.warnBg,
  },
  'work-agreement': {
    Icon: Icons.agreement,
    colorFn: (c) => c.ai2,
    bgFn: (c) => c.aiBg,
  },
};

export function CreateDocumentTypeScreen({
  colors = lightColors,
  onSelectType,
  onNavigate,
}: CreateDocumentTypeScreenProps) {
  const insets = useSafeAreaInsets();
  const navSpacing = useBottomNavSpacing();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: navSpacing }]}
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
          {(Object.keys(DOCUMENT_TYPES) as DocType[]).map((docType) => {
            const config = DOCUMENT_TYPES[docType];
            const visuals = TYPE_VISUALS[docType];
            return (
              <Pressable
                key={docType}
                onPress={() => onSelectType?.(docType)}
                style={[styles.card, { backgroundColor: colors.bgElev }, shadows.card]}
              >
                <View style={[styles.cardIcon, { backgroundColor: visuals.bgFn(colors) }]}>
                  <visuals.Icon size={28} color={visuals.colorFn(colors)} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
                    {config.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.ink2, fontFamily: fonts.sans }]}>
                    {config.desc}
                  </Text>
                  <Text style={[styles.cardDetail, { color: colors.ink4, fontFamily: fonts.sans }]}>
                    {config.detail}
                  </Text>
                </View>
                <Icons.chevL size={20} color={colors.ink4} />
              </Pressable>
            );
          })}
        </View>

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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 13,
    marginTop: 1,
    textAlign: 'right',
  },
  cardDetail: {
    fontSize: 12,
    marginTop: 3,
    textAlign: 'right',
  },
});
