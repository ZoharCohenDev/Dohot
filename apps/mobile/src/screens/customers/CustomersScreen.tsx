import React from 'react';
import { View, Pressable, TextInput, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { ScaledText } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useCustomers } from '@/hooks/useCustomers';
import type { CustomerType } from '@dohot/shared';

interface CustomersScreenProps {
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
}

const FILTER_CHIPS: { label: string; type?: CustomerType }[] = [
  { label: 'הכל' },
  { label: 'פרטיים', type: 'private' },
  { label: 'ועדי בית', type: 'building_committee' },
  { label: 'חברות ביטוח', type: 'insurance_company' },
  { label: 'בעלי מקצוע', type: 'contractor' },
];

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

export function CustomersScreen({ colors = lightColors, onNavigate }: CustomersScreenProps) {
  const [activeFilter, setActiveFilter] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { customers, total, loading, error } = useCustomers(
    debouncedSearch,
    FILTER_CHIPS[activeFilter]?.type,
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        large
        title="לקוחות"
        subtitle={loading ? '' : `${total} לקוחות`}
        action={
          <Pressable style={[styles.addBtn, { backgroundColor: colors.ink1 }]}>
            <Icons.plus size={22} color={colors.bg} />
          </Pressable>
        }
        colors={colors}
      />

      <View style={styles.body}>
        {/* Search */}
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
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          data={FILTER_CHIPS}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setActiveFilter(index)}
              style={[
                styles.chip,
                index === activeFilter
                  ? { backgroundColor: colors.ink1 }
                  : { backgroundColor: colors.bgElev, borderWidth: 1, borderColor: colors.line },
              ]}
            >
              <ScaledText
                style={[
                  styles.chipText,
                  { color: index === activeFilter ? colors.bg : colors.ink2, fontFamily: fonts.sans },
                ]}
              >
                {item.label}
              </ScaledText>
            </Pressable>
          )}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink3} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>{error}</ScaledText>
          </View>
        ) : customers.length === 0 ? (
          <View style={styles.center}>
            <Icons.search size={40} color={colors.ink4} />
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans, marginTop: 12 }]}>
              {debouncedSearch ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}
            </ScaledText>
          </View>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.line }]} />
            )}
            renderItem={({ item }) => (
              <Pressable style={styles.customerRow}>
                <Avatar name={item.name} size={44} />
                <View style={styles.customerInfo}>
                  <ScaledText style={[styles.customerName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                    {item.name}
                  </ScaledText>
                  <ScaledText style={[styles.customerAddr, { color: colors.ink3, fontFamily: fonts.sans }]}>
                    {item.address ?? ''}
                  </ScaledText>
                </View>
                <ScaledText style={[styles.customerLast, { color: colors.ink4, fontFamily: fonts.sans }]}>
                  {relativeDate(item.last_contact_at)}
                </ScaledText>
              </Pressable>
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipsRow: {
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  listContent: {
    paddingBottom: 120,
  },
  separator: {
    height: 1,
    marginHorizontal: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  customerInfo: { flex: 1, minWidth: 0 },
  customerName: { fontSize: 15, fontWeight: '600' },
  customerAddr: { fontSize: 12, marginTop: 2 },
  customerLast: { fontSize: 11 },
});
