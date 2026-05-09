import React from 'react';
import {
  View, Text, Pressable, TextInput, FlatList,
  ActivityIndicator, StyleSheet, Alert, Linking,
} from 'react-native';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { ScaledText } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useCustomers, type CustomerWithStats } from '@/hooks/useCustomers';
import { deleteCustomer } from '@/services/documents';

interface CustomersScreenProps {
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
}

function relativeDate(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;
  if (days < 14) return 'לפני שבוע';
  return `לפני ${Math.floor(days / 7)} שבועות`;
}

function formatAddress(c: CustomerWithStats): string {
  const line1 = [c.street, c.house_number].filter(Boolean).join(' ');
  const apt = [
    c.apartment ? `דירה ${c.apartment}` : '',
    c.floor ? `קומה ${c.floor}` : '',
  ].filter(Boolean).join(', ');
  const parts = [line1, apt, c.city].filter(Boolean);
  return parts.join(', ') || c.address || '';
}

function CustomerCard({
  item,
  colors,
  onLongPress,
}: {
  item: CustomerWithStats;
  colors: typeof lightColors;
  onLongPress?: () => void;
}) {
  const address = formatAddress(item);
  const lastActivity = relativeDate(item.last_contact_at);

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.bgElev }]}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={styles.cardTop}>
        <Avatar name={item.name} size={46} colors={colors} />
        <View style={styles.cardMain}>
          <View style={styles.nameRow}>
            <Text style={[styles.customerName, { color: colors.ink1, fontFamily: fonts.sans }]}>
              {item.name}
            </Text>
            {item.documentCount > 0 && (
              <View style={[styles.docBadge, { backgroundColor: colors.accentBg }]}>
                <Icons.doc size={11} color={colors.accent} />
                <Text style={[styles.docBadgeText, { color: colors.accent, fontFamily: fonts.sans }]}>
                  {item.documentCount}
                </Text>
              </View>
            )}
          </View>
          {!!address && (
            <View style={styles.infoRow}>
              <Icons.pin2 size={13} color={colors.ink4} />
              <Text
                style={[styles.infoText, { color: colors.ink3, fontFamily: fonts.sans }]}
                numberOfLines={1}
              >
                {address}
              </Text>
            </View>
          )}
        </View>
        {!!lastActivity && (
          <Text style={[styles.lastActivity, { color: colors.ink4, fontFamily: fonts.sans }]}>
            {lastActivity}
          </Text>
        )}
      </View>

      {(!!item.phone || !!item.email) && (
        <View style={[styles.cardBottom, { borderTopColor: colors.line }]}>
          {!!item.phone && (
            <Pressable
              style={styles.contactChip}
              onPress={() => Linking.openURL(`tel:${(item.phone ?? '').replace(/[-\s]/g, '')}`)}
              hitSlop={6}
            >
              <Icons.phone size={13} color={colors.accent} />
              <Text style={[styles.contactText, { color: colors.accent, fontFamily: fonts.sans, textDecorationLine: 'underline' }]}>
                {item.phone}
              </Text>
            </Pressable>
          )}
          {!!item.email && (
            <View style={styles.contactChip}>
              <Icons.mail size={13} color={colors.ink3} />
              <Text
                style={[styles.contactText, { color: colors.ink2, fontFamily: fonts.sans }]}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function CustomersScreen({ colors = lightColors, onNavigate }: CustomersScreenProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { customers, total, loading, error, refetch } = useCustomers(debouncedSearch);

  const handleLongPress = (customer: CustomerWithStats) => {
    const hasDocuments = customer.documentCount > 0;
    const warningLine = hasDocuments
      ? `ללקוח זה ${customer.documentCount} מסמכ${customer.documentCount === 1 ? '' : 'ים'} שיימחקו גם הם.\n`
      : '';

    Alert.alert(
      'מחק לקוח',
      `${warningLine}האם למחוק את ${customer.name}? פעולה זו אינה ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק לקוח',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              refetch();
            } catch {
              Alert.alert('שגיאה', 'לא ניתן היה למחוק את הלקוח. נסה שנית.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        large
        title="לקוחות"
        subtitle={loading ? '' : `${total} לקוחות`}
        colors={colors}
      />

      <View style={styles.body}>
        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
          <Icons.search size={20} color={colors.ink3} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="חיפוש לפי שם, כתובת או טלפון…"
            placeholderTextColor={colors.ink3}
            style={[styles.searchInput, { color: colors.ink1, fontFamily: fonts.sans }]}
            textAlign="right"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Icons.close size={18} color={colors.ink4} />
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink3} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>
              {error}
            </ScaledText>
          </View>
        ) : customers.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.bgElev }]}>
              <Icons.customers size={32} color={colors.ink4} />
            </View>
            <ScaledText style={[styles.emptyTitle, { color: colors.ink2, fontFamily: fonts.sans }]}>
              {debouncedSearch ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
            </ScaledText>
            <ScaledText style={[styles.emptyText, { color: colors.ink4, fontFamily: fonts.sans }]}>
              {debouncedSearch ? 'נסה מילות חיפוש אחרות' : 'לקוחות יופיעו כאן לאחר יצירת מסמכים'}
            </ScaledText>
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <CustomerCard
                item={item}
                colors={colors}
                onLongPress={() => handleLongPress(item)}
              />
            )}
          />
        )}
      </View>

      <BottomNav active="customers" onTab={onNavigate} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20 },
  addBtn: {
    width: 44, height: 44, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    height: 48, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  listContent: { paddingBottom: 120 },

  // Card
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1B1916',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, padding: 14 },
  cardMain: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 },
  customerName: { fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
  docBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  docBadgeText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, flex: 1, textAlign: 'right' },
  lastActivity: { fontSize: 11, marginTop: 2, flexShrink: 0 },
  cardBottom: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    gap: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1,
  },
  contactChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  contactText: { fontSize: 12, textAlign: 'right' },

  // Empty state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center' },
});
