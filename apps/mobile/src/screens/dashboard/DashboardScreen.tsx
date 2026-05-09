import React from 'react';
import {
  View, Text, Pressable, FlatList, ActivityIndicator,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, type TabId } from '@/components/layout';
import { ScaledText } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useQuoteFollowUp, type QuoteFollowUpItem } from '@/hooks/useQuoteFollowUp';

interface DashboardScreenProps {
  colors?: typeof lightColors;
  onCreateReport?: () => void;
  onNavigate?: (tab: TabId) => void;
  onCreateType?: (type: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
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

function QuoteCard({
  item,
  colors,
  onToggle,
  onLongPress,
}: {
  item: QuoteFollowUpItem;
  colors: typeof lightColors;
  onToggle: () => void;
  onLongPress: () => void;
}) {
  const address = formatAddress(item);
  const phone = item.customers?.phone;
  const completed = item.followUp.completed;

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.bgElev, opacity: completed ? 0.72 : 1 }]}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={styles.cardMain}>
        {/* Checkbox */}
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={[
            styles.checkbox,
            {
              borderColor: completed ? colors.ai : colors.ink4,
              backgroundColor: completed ? colors.ai : 'transparent',
            },
          ]}
        >
          {completed && <Icons.check size={13} color={colors.bgElev} stroke={2.5} />}
        </Pressable>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text
              style={[
                styles.customerName,
                { color: colors.ink1, fontFamily: fonts.sans, textDecorationLine: completed ? 'line-through' : 'none' },
              ]}
              numberOfLines={1}
            >
              {item.customers?.name ?? 'ללא שם'}
            </Text>
            <Text style={[styles.dateText, { color: colors.ink4, fontFamily: fonts.sans }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          {!!address && (
            <View style={styles.infoRow}>
              <Icons.pin2 size={12} color={colors.ink4} />
              <Text style={[styles.infoText, { color: colors.ink3, fontFamily: fonts.sans }]} numberOfLines={1}>
                {address}
              </Text>
            </View>
          )}

          <View style={styles.cardBottomRow}>
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
        </View>
      </View>
    </Pressable>
  );
}

export function DashboardScreen({ colors = lightColors, onNavigate, onCreateType }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { businessProfile, daysUntilExpiration, isSubscriptionExpired, isSubscriptionWarning } = useAuth();
  const { stats } = useDashboard();
  const { items, loading, error, toggleFollowUp, deleteQuote } = useQuoteFollowUp();

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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={() => (
          <>
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
            </View>

            {/* Subscription expiry banner */}
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

            {/* Section header */}
            <ScaledText style={[styles.sectionLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
              מעקב הצעות מחיר
            </ScaledText>

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
                אין הצעות מחיר למעקב כרגע
              </ScaledText>
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.ink1 }]}
                onPress={() => onCreateType?.('quote')}
              >
                <Icons.plus size={16} color={colors.bg} />
                <Text style={[styles.emptyBtnText, { color: colors.bg, fontFamily: fonts.sans }]}>
                  צור הצעת מחיר
                </Text>
              </Pressable>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <QuoteCard
            item={item}
            colors={colors}
            onToggle={() => toggleFollowUp(item.id)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
  },
  greeting: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  greetSub: { fontSize: 12 },
  greetName: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  subBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  subBannerText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 18, padding: 14, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6 },
  statLabel: { fontSize: 11, marginTop: 2 },

  // Section
  sectionLabel: {
    fontSize: 13, fontWeight: '700',
    marginBottom: 12, letterSpacing: -0.1,
  },

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
  cardMain: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTopRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 8, marginBottom: 4,
  },
  customerName: { fontSize: 15, fontWeight: '700', flex: 1 },
  dateText: { fontSize: 11, flexShrink: 0, marginTop: 2 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 6 },
  infoText: { fontSize: 12, flex: 1 },
  cardBottomRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
  },
  phoneChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  phoneText: { fontSize: 12, textDecorationLine: 'underline' },
  amountBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  amountText: { fontSize: 12, fontWeight: '700' },

  // Empty state
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
