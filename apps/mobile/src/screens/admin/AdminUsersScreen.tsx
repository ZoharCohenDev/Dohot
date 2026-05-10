import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Alert,
} from 'react-native';
import { Header } from '@/components/layout';
import { Button, Card, ScaledText } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { adminListUsers, adminDeleteUser, type AdminUser } from '@/services/adminApi';
import { signOut } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import type { Profession } from '@dohot/shared';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const PROFESSION_LABELS: Record<Profession, string> = {
  leak_detection: 'גילוי נזילות',
  plumber: 'אינסטלציה',
  electrician: 'חשמלאי',
  renovation: 'שיפוצים',
  roofing: 'גגות',
  ac: 'מיזוג אוויר',
  waterproofing: 'איטום',
  general_technician: 'טכנאי כללי',
  other: 'אחר',
};

function subscriptionStatus(user: AdminUser): { label: string; color: string; bg: string } {
  if (!user.is_active) return { label: 'מושהה', color: '#E05C3A', bg: '#FEF0EC' };
  if (!user.subscription_expiration_date) return { label: 'ללא תוקף', color: '#9B8E7E', bg: '#F5F2EE' };
  const expiry = new Date(user.subscription_expiration_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: 'פג תוקף', color: '#E05C3A', bg: '#FEF0EC' };
  if (days <= 7) return { label: `${days} ימים`, color: '#E08A3A', bg: '#FEF5EC' };
  return { label: formatDate(user.subscription_expiration_date), color: '#4A7A5A', bg: '#EDF5F0' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: AdminUser;
  colors: typeof lightColors;
  onPress: () => void;
  onLongPress: () => void;
}

function UserCard({ user, colors, onPress, onLongPress }: UserCardProps) {
  const status = subscriptionStatus(user);
  const isAdmin = user.role === 'admin';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.userCard, { backgroundColor: colors.bgElev, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.userCardLeft}>
        <View style={[styles.avatar, { backgroundColor: isAdmin ? colors.accentBg : colors.bgSunken }]}>
          <Text style={[styles.avatarText, { color: isAdmin ? colors.accent : colors.ink2, fontFamily: fonts.sans }]}>
            {user.full_name.charAt(0)}
          </Text>
        </View>
      </View>

      <View style={styles.userCardBody}>
        <View style={styles.userCardRow}>
          <ScaledText style={[styles.userName, { color: colors.ink1, fontFamily: fonts.sans }]}>{user.full_name}</ScaledText>
          {isAdmin && (
            <View style={[styles.roleBadge, { backgroundColor: colors.accentBg }]}>
              <ScaledText style={[styles.roleBadgeText, { color: colors.accent, fontFamily: fonts.sans }]}>מנהל</ScaledText>
            </View>
          )}
        </View>
        <ScaledText style={[styles.userUsername, { color: colors.ink3, fontFamily: fonts.sans }]}>@{user.username}</ScaledText>
        <ScaledText style={[styles.userProfession, { color: colors.ink3, fontFamily: fonts.sans }]}>
          {PROFESSION_LABELS[user.profession] ?? user.profession}
        </ScaledText>
      </View>

      <View style={styles.userCardRight}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <ScaledText style={[styles.statusText, { color: status.color, fontFamily: fonts.sans }]}>{status.label}</ScaledText>
        </View>
        <Icons.chevL size={16} color={colors.ink4} />
      </View>
    </Pressable>
  );
}

// ─── AdminUsersScreen ─────────────────────────────────────────────────────────

interface AdminUsersScreenProps {
  colors?: typeof lightColors;
  onCreateUser?: () => void;
  onEditUser?: (user: AdminUser) => void;
}

export function AdminUsersScreen({ colors = lightColors, onCreateUser, onEditUser }: AdminUsersScreenProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleDeleteUser = useCallback((target: AdminUser) => {
    if (target.id === currentUser?.id) {
      Alert.alert('לא ניתן למחוק', 'לא ניתן למחוק את המשתמש המחובר כעת');
      return;
    }

    Alert.alert(
      'מחיקת משתמש',
      `האם אתה בטוח שברצונך למחוק את ${target.full_name}?\n\nפעולה זו אינה ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק משתמש',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminDeleteUser(target.id);
              setUsers((prev) => prev.filter((u) => u.id !== target.id));
            } catch (e) {
              Alert.alert('שגיאה', e instanceof Error ? e.message : 'לא ניתן למחוק את המשתמש');
            }
          },
        },
      ],
    );
  }, [currentUser?.id]);

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם לצאת מהחשבון?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await adminListUsers();
      setUsers(data);
    } catch (e) {
      Alert.alert('שגיאה', e instanceof Error ? e.message : 'לא ניתן לטעון משתמשים');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header
        large
        title="ניהול טכנאים"
        colors={colors}
        action={
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
            hitSlop={8}
          >
            <Icons.logout size={20} color={colors.danger} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats row */}
          <View style={styles.statsRow}>
            <Card padding={14} colors={colors} style={styles.statCard}>
              <ScaledText style={[styles.statNum, { color: colors.ink1, fontFamily: fonts.sans }]}>{users.length}</ScaledText>
              <ScaledText style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>סה"כ</ScaledText>
            </Card>
            <Card padding={14} colors={colors} style={styles.statCard}>
              <ScaledText style={[styles.statNum, { color: colors.accent, fontFamily: fonts.sans }]}>{activeCount}</ScaledText>
              <ScaledText style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>פעילים</ScaledText>
            </Card>
            <Card padding={14} colors={colors} style={styles.statCard}>
              <ScaledText style={[styles.statNum, { color: colors.danger, fontFamily: fonts.sans }]}>{users.length - activeCount}</ScaledText>
              <ScaledText style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>מושהים</ScaledText>
            </Card>
          </View>

          {/* User list */}
          {users.length === 0 ? (
            <View style={styles.empty}>
              <Icons.user size={40} color={colors.ink4} />
              <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>אין משתמשים עדיין</ScaledText>
            </View>
          ) : (
            <View style={styles.list}>
              {users.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  colors={colors}
                  onPress={() => onEditUser?.(u)}
                  onLongPress={() => handleDeleteUser(u)}
                />
              ))}
            </View>
          )}

          <Button
            kind="ghost"
            size="md"
            full
            icon={<Icons.plus size={18} color={colors.ink2} />}
            onPress={() => load(true)}
            colors={colors}
          >
            {refreshing ? 'מרענן...' : 'רענן רשימה'}
          </Button>
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={onCreateUser}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Icons.plus size={26} color={colors.bg} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row-reverse', gap: 10 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },

  list: { gap: 8 },
  userCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  userCardLeft: {},
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  userCardBody: { flex: 1, gap: 2 },
  userCardRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  userName: { fontSize: 15, fontWeight: '700' },
  userUsername: { fontSize: 12 },
  userProfession: { fontSize: 12 },
  userCardRight: { alignItems: 'flex-start', gap: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15 },

  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
});
