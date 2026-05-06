import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { Pill } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface DocumentsScreenProps {
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
}

const TABS = ['הכל', 'דוחות', 'הצעות', 'הסכמים'];

const DOCS = [
  { id: '1', title: 'דוח גילוי נזילה — דירת קוטון', status: 'נשלח', statusColor: (c: typeof lightColors) => c.ai2, statusBg: (c: typeof lightColors) => c.aiBg, date: 'היום, 09:42', Icon: Icons.doc, iconColor: (c: typeof lightColors) => c.accent, iconBg: (c: typeof lightColors) => c.accentBg, amount: '' },
  { id: '2', title: 'הצעת מחיר — בניין מנשה 14', status: 'ממתין', statusColor: (c: typeof lightColors) => c.warn, statusBg: (c: typeof lightColors) => c.warnBg, date: 'אתמול', Icon: Icons.quote, iconColor: (c: typeof lightColors) => c.info, iconBg: (c: typeof lightColors) => c.infoBg, amount: '₪ 4,800' },
  { id: '3', title: 'דוח איטום גג — משפחת לוי', status: 'נחתם', statusColor: (c: typeof lightColors) => c.ai2, statusBg: (c: typeof lightColors) => c.aiBg, date: '3 ימים', Icon: Icons.shieldCheck, iconColor: (c: typeof lightColors) => c.ai2, iconBg: (c: typeof lightColors) => c.aiBg, amount: '' },
  { id: '4', title: 'הסכם עבודה — מירי דהן', status: 'טיוטה', statusColor: (c: typeof lightColors) => c.ink3, statusBg: (c: typeof lightColors) => c.bgSunken, date: '4 ימים', Icon: Icons.agreement, iconColor: (c: typeof lightColors) => c.warn, iconBg: (c: typeof lightColors) => c.warnBg, amount: '' },
  { id: '5', title: 'דוח לחות — עמוס שלמה', status: 'נשלח', statusColor: (c: typeof lightColors) => c.ai2, statusBg: (c: typeof lightColors) => c.aiBg, date: 'שבוע שעבר', Icon: Icons.doc, iconColor: (c: typeof lightColors) => c.accent, iconBg: (c: typeof lightColors) => c.accentBg, amount: '' },
  { id: '6', title: 'הצעת מחיר — ועד בית מנשה', status: 'אושר', statusColor: (c: typeof lightColors) => c.ai2, statusBg: (c: typeof lightColors) => c.aiBg, date: 'שבוע שעבר', Icon: Icons.quote, iconColor: (c: typeof lightColors) => c.info, iconBg: (c: typeof lightColors) => c.infoBg, amount: '₪ 12,400' },
];

export function DocumentsScreen({ colors = lightColors, onNavigate }: DocumentsScreenProps) {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        large
        title="המסמכים שלי"
        subtitle="73 מסמכים סך הכל"
        action={
          <Pressable style={[styles.searchBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Icons.search size={20} color={colors.ink1} />
          </Pressable>
        }
        colors={colors}
      />

      <View style={styles.body}>
        {/* Tab strip */}
        <View style={[styles.tabStrip, { backgroundColor: colors.bgSunken }]}>
          {TABS.map((tab, i) => (
            <Pressable
              key={i}
              onPress={() => setActiveTab(i)}
              style={[
                styles.tabBtn,
                i === activeTab && [styles.tabBtnActive, { backgroundColor: colors.bgElev }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: i === activeTab ? colors.ink1 : colors.ink3,
                    fontFamily: fonts.sans,
                    fontWeight: i === activeTab ? '700' : '600',
                  },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Group label */}
        <Text style={[styles.groupLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>
          השבוע
        </Text>

        <FlatList
          data={DOCS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.docRow, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
            >
              <View style={[styles.docIcon, { backgroundColor: item.iconBg(colors) }]}>
                <item.Icon size={22} color={item.iconColor(colors)} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: colors.ink1, fontFamily: fonts.sans }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.docMeta}>
                  <Pill bg={item.statusBg(colors)} color={item.statusColor(colors)}>
                    {item.status}
                  </Pill>
                  <Text style={[styles.docDate, { color: colors.ink3, fontFamily: fonts.sans }]}>
                    {item.date}
                  </Text>
                  {item.amount ? (
                    <Text style={[styles.docAmount, { color: colors.ink1, fontFamily: fonts.sans }]}>
                      {item.amount}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>

      <BottomNav active="docs" onTab={onNavigate} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20 },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabStrip: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    shadowColor: '#1B1916',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  listContent: { gap: 8, paddingBottom: 120 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docInfo: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 14, fontWeight: '600' },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  docDate: { fontSize: 11 },
  docAmount: { fontSize: 11, fontWeight: '700', marginStart: 'auto' },
});
