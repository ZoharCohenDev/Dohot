import React from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, useBottomNavSpacing, type TabId } from '@/components/layout';
import { ScaledText } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import {
  useQuoteFollowUp,
  type QuoteFollowUpItem,
  type QuoteStatus,
  type QuoteStatusFilter,
} from '@/hooks/useQuoteFollowUp';


interface DashboardScreenProps {
  colors?: typeof lightColors;
  onCreateReport?: () => void;
  onNavigate?: (tab: TabId) => void;
  onCreateType?: (type: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    day: 'numeric', month: 'numeric', year: '2-digit',
  });
}

function formatAmount(amount: number | null): string {
  if (amount == null) return '';
  return `₪${amount.toLocaleString('he-IL')}`;
}

function formatAddress(q: QuoteFollowUpItem): string {
  const c = q.customers;
  if (!c) return '';
  const line1 = [c.street, c.house_number].filter(Boolean).join(' ');
  const apt = [
    c.apartment ? `דירה ${c.apartment}` : '',
    c.floor ? `קומה ${c.floor}` : '',
  ].filter(Boolean).join(', ');
  return [line1, apt, c.city].filter(Boolean).join(', ') || c.address || '';
}

// Returns label + color pair for each quote status.
function getQuoteStatusConfig(
  status: QuoteStatus,
  colors: typeof lightColors,
): { label: string; color: string; bg: string } {
  switch (status) {
    case 'waiting':
      return { label: 'ממתין', color: colors.warn, bg: colors.warnBg };
    case 'completed':
      return { label: 'בוצע', color: colors.ai2, bg: colors.aiBg };
    case 'cancelled':
      return { label: 'בוטל', color: colors.danger, bg: colors.dangerBg };
  }
}

// ── Filter tabs config ────────────────────────────────────────────────────────

// Order is RTL: first item renders on the far right.
const FILTER_TABS: { label: string; value: QuoteStatusFilter }[] = [
  { label: 'הכל', value: 'all' },
  { label: 'בוצעו', value: 'completed' },
  { label: 'ממתינים', value: 'waiting' },
  { label: 'בוטלו', value: 'cancelled' },
];

// ── QuoteCard ─────────────────────────────────────────────────────────────────

function QuoteCard({
  item,
  colors,
  onSetStatus,
  onLongPress,
  saving,
}: {
  item: QuoteFollowUpItem;
  colors: typeof lightColors;
  onSetStatus: (status: QuoteStatus) => void;
  onLongPress: () => void;
  saving: boolean;
}) {
  const address = formatAddress(item);
  const phone = item.customers?.phone;
  const status = item.followUp.status;
  const statusConfig = getQuoteStatusConfig(status, colors);

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElev,
          opacity: status === 'waiting' ? 1 : 0.82,
          borderRightWidth: 4,
          borderRightColor: statusConfig.color,
        },
      ]}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* ── Top row: name · status pill · date ─────────────────────────── */}
      <View style={styles.cardTopRow}>
        <Text
          style={[styles.customerName, { color: colors.ink1, fontFamily: fonts.sans }]}
          numberOfLines={1}
        >
          {item.customers?.name ?? 'ללא שם'}
        </Text>
        <View style={styles.topMeta}>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusPillText, { color: statusConfig.color, fontFamily: fonts.sans }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.ink4, fontFamily: fonts.sans }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>

      {/* ── Address ──────────────────────────────────────────────────────── */}
      {!!address && (
        <View style={styles.infoRow}>
          <Icons.pin2 size={12} color={colors.ink4} />
          <Text style={[styles.infoText, { color: colors.ink3, fontFamily: fonts.sans }]} numberOfLines={1}>
            {address}
          </Text>
        </View>
      )}

      {/* ── Phone + amount ───────────────────────────────────────────────── */}
      <View style={styles.cardMidRow}>
        {!!phone && (
          <Pressable
            style={styles.phoneChip}
            onPress={() => Linking.openURL(`tel:${phone.replace(/[-\s]/g, '')}`)}
            hitSlop={6}
          >
            <Icons.phone size={12} color={colors.info} />
            <Text style={[styles.phoneText, { color: colors.info, fontFamily: fonts.sans }]}>
              {phone}
            </Text>
          </Pressable>
        )}
        {!!item.amount && (
          <View style={[styles.amountBadge, { backgroundColor: colors.infoBg }]}>
            <Text style={[styles.amountText, { color: colors.info, fontFamily: fonts.sans }]}>
              {formatAmount(item.amount)}
            </Text>
          </View>
        )}
      </View>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <View style={[styles.actionsRow, { borderTopColor: colors.line }]}>
        {status === 'waiting' && (
          <>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.aiBg, opacity: saving ? 0.5 : 1 }]}
              onPress={() => !saving && onSetStatus('completed')}
              hitSlop={4}
            >
              <Icons.check size={13} color={colors.ai2} stroke={2.5} />
              <Text style={[styles.actionBtnText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                סמן כבוצע
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.dangerBg, opacity: saving ? 0.5 : 1 }]}
              onPress={() => !saving && onSetStatus('cancelled')}
              hitSlop={4}
            >
              <Icons.close size={13} color={colors.danger} />
              <Text style={[styles.actionBtnText, { color: colors.danger, fontFamily: fonts.sans }]}>
                סמן כבוטל
              </Text>
            </Pressable>
          </>
        )}
        {status === 'completed' && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.bgSunken, opacity: saving ? 0.5 : 1 }]}
            onPress={() => !saving && onSetStatus('waiting')}
            hitSlop={4}
          >
            <Text style={[styles.actionBtnText, { color: colors.ink3, fontFamily: fonts.sans }]}>
              החזר לממתין
            </Text>
          </Pressable>
        )}
        {status === 'cancelled' && (
          <>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.aiBg, opacity: saving ? 0.5 : 1 }]}
              onPress={() => !saving && onSetStatus('completed')}
              hitSlop={4}
            >
              <Icons.check size={13} color={colors.ai2} stroke={2.5} />
              <Text style={[styles.actionBtnText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                סמן כבוצע
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.bgSunken, opacity: saving ? 0.5 : 1 }]}
              onPress={() => !saving && onSetStatus('waiting')}
              hitSlop={4}
            >
              <Text style={[styles.actionBtnText, { color: colors.ink3, fontFamily: fonts.sans }]}>
                החזר לממתין
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function DashboardScreen({ colors = lightColors, onNavigate, onCreateType }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const navSpacing = useBottomNavSpacing();
  const { businessProfile, daysUntilExpiration, isSubscriptionExpired, isSubscriptionWarning } = useAuth();
  const { stats } = useDashboard();
  const {
    items,
    counts,
    loading,
    error,
    savingIds,
    statusFilter,
    setStatusFilter,
    setQuoteStatus,
    deleteQuote,
  } = useQuoteFollowUp();

  const displayName = businessProfile?.full_name || businessProfile?.business_name || '';
  const firstName = displayName.split(' ')[0] ?? displayName;

  const handleLongPress = (item: QuoteFollowUpItem) => {
    const name = item.customers?.name ?? 'הצעה זו';
    Alert.alert(
      'מחק הצעת מחיר',
      `האם למחוק את הצעת המחיר של ${name}? פעולה זו אינה ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק הצעת מחיר',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuote(item.id);
            } catch {
              Alert.alert('שגיאה', 'לא ניתן היה למחוק את הצעת המחיר. נסה שנית.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: navSpacing }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={() => (
          <>
            {/* ── Top bar ── */}
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
            </View>

            {/* ── Subscription banner ── */}
            {(isSubscriptionExpired || isSubscriptionWarning) && (
              <View style={[
                styles.subBanner,
                { backgroundColor: isSubscriptionExpired ? colors.dangerBg : colors.warnBg },
              ]}>
                <Icons.shieldCheck size={16} color={isSubscriptionExpired ? colors.danger : colors.warn} />
                <Text style={[styles.subBannerText, {
                  color: isSubscriptionExpired ? colors.danger : colors.warn,
                  fontFamily: fonts.sans,
                }]}>
                  {isSubscriptionExpired
                    ? 'המנוי הסתיים. יש לחדש את המנוי כדי להמשיך להשתמש באפליקציה'
                    : `המנוי שלך עומד להסתיים בעוד ${daysUntilExpiration} ימים`
                  }
                </Text>
              </View>
            )}

            {/* ── Stats strip ── */}
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
                <ScaledText style={[styles.statValue, { color: colors.warn, fontFamily: fonts.sans }]}>
                  {counts.waiting}
                </ScaledText>
                <ScaledText style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  ממתינות לאישור
                </ScaledText>
              </View>
            </View>

            {/* ── Section header ── */}
            <ScaledText style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              מעקב הצעות מחיר
            </ScaledText>

            {/* ── Status filter tabs ── */}
            <View style={styles.tabsRow}>
              {FILTER_TABS.map((tab) => {
                const active = statusFilter === tab.value;
                const count = counts[tab.value];
                return (
                  <Pressable
                    key={tab.value}
                    onPress={() => setStatusFilter(tab.value)}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: active ? colors.ink1 : colors.bgElev,
                        borderColor: active ? colors.ink1 : colors.line,
                        borderWidth: active ? 2 : 1.5,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.filterTabText,
                      { color: active ? colors.bg : colors.ink2, fontFamily: fonts.sans },
                    ]}>
                      {tab.label}
                    </Text>
                    {count > 0 && (
                      <View style={[
                        styles.filterTabBadge,
                        { backgroundColor: active ? colors.bg : colors.bgSunken },
                      ]}>
                        <Text style={[
                          styles.filterTabBadgeText,
                          { color: active ? colors.ink1 : colors.ink3, fontFamily: fonts.sans },
                        ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {loading && (
              <View style={styles.center}>
                <ActivityIndicator color={colors.ink3} />
              </View>
            )}
            {!loading && !!error && (
              <View style={styles.center}>
                <ScaledText style={[styles.emptyTitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {error}
                </ScaledText>
              </View>
            )}
          </>
        )}
        ListEmptyComponent={() => {
          if (loading || error) return null;
          return (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.bgElev }]}>
                <Icons.quote size={32} color={colors.ink4} />
              </View>
              <ScaledText style={[styles.emptyTitle, { color: colors.ink2, fontFamily: fonts.sans }]}>
                {statusFilter === 'all'
                  ? 'אין הצעות מחיר למעקב כרגע'
                  : 'אין הצעות מחיר בסטטוס זה'}
              </ScaledText>
              {statusFilter === 'all' && (
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: colors.ink1 }]}
                  onPress={() => onCreateType?.('quote')}
                >
                  <Icons.plus size={16} color={colors.bg} />
                  <Text style={[styles.emptyBtnText, { color: colors.bg, fontFamily: fonts.sans }]}>
                    צור הצעת מחיר
                  </Text>
                </Pressable>
              )}
            </View>
          );
        }}
        renderItem={({ item }) => (
          <QuoteCard
            item={item}
            colors={colors}
            saving={savingIds.has(item.id)}
            onSetStatus={async (status) => {
              try {
                await setQuoteStatus(item.id, status);
              } catch {
                Alert.alert('שגיאה', 'לא ניתן לעדכן את הסטטוס. נסה שנית.');
              }
            }}
            onLongPress={() => handleLongPress(item)}
          />
        )}
      />

      <BottomNav active="home" onTab={onNavigate} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 0,
  },

  // Top bar
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
  },
  greeting: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  greetSub: { fontSize: 12, textAlign: 'right' },
  greetName: { fontSize: 16, fontWeight: '700', lineHeight: 20, textAlign: 'right' },

  subBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  subBannerText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'right' },

  // Stats
  statsRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, textAlign: 'right' },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'right' },

  // Section header
  sectionLabel: {
    fontSize: 13, fontWeight: '700',
    marginBottom: 10, letterSpacing: -0.1, textAlign: 'right',
  },

  // Filter tabs
  tabsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  filterTabText: { fontSize: 13, fontWeight: '700' },
  filterTabBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterTabBadgeText: { fontSize: 10, fontWeight: '800' },

  // Quote card
  card: {
    borderRadius: 18,
    padding: 14,
    shadowColor: '#1B1916',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 5,
  },
  customerName: { fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  topMeta: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 6 },
  infoText: { fontSize: 12, flex: 1, textAlign: 'right' },
  cardMidRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  phoneChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  phoneText: { fontSize: 12, textDecorationLine: 'underline', textAlign: 'right' },
  amountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  amountText: { fontSize: 12, fontWeight: '700' },

  // Action buttons
  actionsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Misc
  center: { alignItems: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingTop: 48, paddingBottom: 40, gap: 10 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700' },
});
