import React from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface CustomersScreenProps {
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
}

const FILTER_CHIPS = ['הכל', 'פרטיים', 'ועדי בית', 'חברות ביטוח', 'בעלי מקצוע'];

const CUSTOMERS = [
  { id: '1', name: 'אבי כהן', address: 'הרצליה • 6 דוחות', last: 'לפני יומיים', color: '#C2613B' },
  { id: '2', name: 'משפחת לוי', address: 'תל אביב • 3 דוחות', last: 'לפני שבוע', color: '#5A8770' },
  { id: '3', name: 'עמוס שלמה', address: 'רעננה • 2 דוחות', last: 'לפני שבועיים', color: '#4A7B9D' },
  { id: '4', name: 'מירי דהן', address: 'גבעתיים • 1 דוח', last: 'לפני חודש', color: '#B8862B' },
  { id: '5', name: 'ועד בית מנשה 14', address: 'תל אביב • 4 דוחות', last: 'אתמול', color: '#8B5A8B' },
  { id: '6', name: "יעל ברקוביץ'", address: 'כפר סבא • 2 דוחות', last: 'לפני 3 ימים', color: '#5A8770' },
];

export function CustomersScreen({ colors = lightColors, onNavigate }: CustomersScreenProps) {
  const [activeFilter, setActiveFilter] = React.useState(0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        large
        title="לקוחות"
        subtitle="178 לקוחות פעילים"
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
            placeholder="חיפוש לפי שם, כתובת או טלפון…"
            placeholderTextColor={colors.ink3}
            style={[styles.searchInput, { color: colors.ink1, fontFamily: fonts.sans }]}
            textAlign="right"
          />
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          data={FILTER_CHIPS}
          keyExtractor={(item) => item}
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
              <Text
                style={[
                  styles.chipText,
                  { color: index === activeFilter ? colors.bg : colors.ink2, fontFamily: fonts.sans },
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />

        {/* List */}
        <FlatList
          data={CUSTOMERS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.line }]} />
          )}
          renderItem={({ item }) => (
            <Pressable style={styles.customerRow}>
              <Avatar name={item.name} size={44} color={item.color} />
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                  {item.name}
                </Text>
                <Text style={[styles.customerAddr, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {item.address}
                </Text>
              </View>
              <Text style={[styles.customerLast, { color: colors.ink4, fontFamily: fonts.sans }]}>
                {item.last}
              </Text>
            </Pressable>
          )}
        />
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
