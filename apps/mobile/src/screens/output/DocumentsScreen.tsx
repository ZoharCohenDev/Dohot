import React from 'react';
import { View, Pressable, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { Pill, ScaledText } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useDocuments } from '@/hooks/useDocuments';
import { deleteDocument } from '@/services/documents';
import type { DocumentType, DocumentStatus } from '@dohot/shared';

interface DocumentsScreenProps {
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
}

const TABS: { label: string; type?: DocumentType }[] = [
  { label: 'הכל' },
  { label: 'דוחות', type: 'report' },
  { label: 'הצעות', type: 'quote' },
  { label: 'הסכמים', type: 'agreement' },
];

function docTypeStyle(type: DocumentType, colors: typeof lightColors) {
  switch (type) {
    case 'report':   return { Icon: Icons.doc,       iconColor: colors.accent, iconBg: colors.accentBg };
    case 'quote':    return { Icon: Icons.quote,      iconColor: colors.info,   iconBg: colors.infoBg };
    case 'worklog':  return { Icon: Icons.image,      iconColor: colors.ai2,    iconBg: colors.aiBg };
    case 'agreement':return { Icon: Icons.agreement,  iconColor: colors.warn,   iconBg: colors.warnBg };
  }
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft:    'טיוטה',
  sent:     'נשלח',
  pending:  'ממתין',
  signed:   'נחתם',
  approved: 'אושר',
};

function docStatusStyle(status: DocumentStatus, colors: typeof lightColors) {
  switch (status) {
    case 'sent':
    case 'signed':
    case 'approved': return { color: colors.ai2,   bg: colors.aiBg };
    case 'pending':  return { color: colors.warn,  bg: colors.warnBg };
    case 'draft':    return { color: colors.ink3,  bg: colors.bgSunken };
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

export function DocumentsScreen({ colors = lightColors, onNavigate }: DocumentsScreenProps) {
  const [activeTab, setActiveTab] = React.useState(0);
  const { documents, loading, error, refetch } = useDocuments(TABS[activeTab]?.type);

  const handleLongPressDelete = (docId: string, docTitle: string) => {
    Alert.alert(
      'מחיקת מסמך',
      `למחוק את "${docTitle}"?\nלא ניתן לבטל פעולה זו.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(docId);
              await refetch();
            } catch {
              Alert.alert('שגיאה', 'לא ניתן למחוק את המסמך. נסה שנית.');
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
        title="המסמכים שלי"
        subtitle={loading ? '' : `${documents.length} מסמכים`}
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
              <ScaledText
                style={[
                  styles.tabText,
                  {
                    color: i === activeTab ? colors.ink1 : colors.ink3,
                    fontFamily: fonts.sans,
                    fontWeight: i === activeTab ? '700' : '600',
                  },
                ]}
              >
                {tab.label}
              </ScaledText>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink3} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>{error}</ScaledText>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.center}>
            <Icons.doc size={40} color={colors.ink4} />
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans, marginTop: 12 }]}>
              אין מסמכים עדיין
            </ScaledText>
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const { Icon, iconColor, iconBg } = docTypeStyle(item.type, colors);
              const { color: statusColor, bg: statusBg } = docStatusStyle(item.status, colors);
              return (
                <Pressable
                  style={[styles.docRow, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
                  onLongPress={() => handleLongPressDelete(item.id, item.title)}
                  delayLongPress={500}
                >
                  <View style={[styles.docIcon, { backgroundColor: iconBg }]}>
                    <Icon size={22} color={iconColor} />
                  </View>
                  <View style={styles.docInfo}>
                    <ScaledText style={[styles.docTitle, { color: colors.ink1, fontFamily: fonts.sans }]} numberOfLines={1}>
                      {item.title}
                    </ScaledText>
                    <View style={styles.docMeta}>
                      <Pill bg={statusBg} color={statusColor}>
                        {STATUS_LABELS[item.status]}
                      </Pill>
                      <ScaledText style={[styles.docDate, { color: colors.ink3, fontFamily: fonts.sans }]}>
                        {relativeDate(item.created_at)}
                      </ScaledText>
                      {item.amount != null && (
                        <ScaledText style={[styles.docAmount, { color: colors.ink1, fontFamily: fonts.sans }]}>
                          {`₪ ${item.amount.toLocaleString('he-IL')}`}
                        </ScaledText>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
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
