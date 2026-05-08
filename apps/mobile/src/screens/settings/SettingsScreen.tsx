import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { Card, Toggle } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/services/auth';

interface SettingsScreenProps {
  dark?: boolean;
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
  onToggleTheme?: () => void;
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  right?: React.ReactNode;
  last?: boolean;
  colors: typeof lightColors;
}

function SettingRow({ icon, label, value, right, last, colors }: SettingRowProps) {
  return (
    <View style={[styles.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
      <View style={styles.settingIcon}>{icon}</View>
      <Text style={[styles.settingLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>
        {label}
      </Text>
      {right ?? (
        <View style={styles.settingRight}>
          {value && (
            <Text style={[styles.settingValue, { color: colors.ink3, fontFamily: fonts.sans }]}>
              {value}
            </Text>
          )}
          <Icons.chevL size={16} color={colors.ink4} />
        </View>
      )}
    </View>
  );
}

interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
  colors: typeof lightColors;
}

function SettingGroup({ title, children, colors }: SettingGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
        {title}
      </Text>
      <View style={[styles.groupCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
        {children}
      </View>
    </View>
  );
}

export function SettingsScreen({ dark = false, colors = lightColors, onNavigate, onToggleTheme }: SettingsScreenProps) {
  const { businessProfile } = useAuth();

  const displayName = businessProfile?.full_name || businessProfile?.business_name || 'משתמש';
  const businessName = businessProfile?.business_name || '';
  const plan = businessProfile?.plan ?? 'free';

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח שאתה רוצה להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header large title="ההגדרות שלי" colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <Card padding={20} colors={colors} style={{ marginBottom: 18 }}>
          <View style={styles.profileRow}>
            <Avatar name={displayName} size={56} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                {displayName}
              </Text>
              {businessName ? (
                <Text style={[styles.profileBiz, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {businessName}
                </Text>
              ) : null}
              {plan === 'pro' && (
                <View style={[styles.proBadge, { backgroundColor: colors.aiBg }]}>
                  <Icons.shieldCheck size={12} color={colors.ai2} />
                  <Text style={[styles.proBadgeText, { color: colors.ai2, fontFamily: fonts.sans }]}>
                    תכנית פרו
                  </Text>
                </View>
              )}
            </View>
            <Pressable>
              <Icons.chevL size={20} color={colors.ink3} />
            </Pressable>
          </View>
        </Card>

        <SettingGroup title="פרופיל ומסמכים" colors={colors}>
          <SettingRow icon={<Icons.building size={20} color={colors.ink2} />} label="פרטי העסק" value="מולא" colors={colors} />
          <SettingRow icon={<Icons.signature size={20} color={colors.ink2} />} label="חתימה דיגיטלית" value="הוגדרה" colors={colors} />
          <SettingRow icon={<Icons.badge size={20} color={colors.ink2} />} label="תעודות והסמכות" value="2 תעודות" colors={colors} />
          <SettingRow icon={<Icons.doc size={20} color={colors.ink2} />} label="הסתייגות משפטית" value="ערוך" last colors={colors} />
        </SettingGroup>

        <SettingGroup title="מראה" colors={colors}>
          <SettingRow
            icon={<Icons.moon size={20} color={colors.ink2} />}
            label="מצב כהה"
            right={<Toggle on={dark} onChange={onToggleTheme} colors={colors} />}
            colors={colors}
          />
          <SettingRow icon={<Icons.sun size={20} color={colors.ink2} />} label="גודל טקסט" value="רגיל" last colors={colors} />
        </SettingGroup>

        <SettingGroup title="מנוי" colors={colors}>
          <SettingRow icon={<Icons.star size={20} color={colors.ink2} />} label="תכנית פרו" value="מנוי שנתי" colors={colors} />
          <SettingRow icon={<Icons.history size={20} color={colors.ink2} />} label="היסטוריית חיובים" last colors={colors} />
        </SettingGroup>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.dangerBg }]}>
          <Icons.logout size={18} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger, fontFamily: fonts.sans }]}>
            התנתק
          </Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.ink4, fontFamily: fonts.sans }]}>
          דוחות 2.4.1 · נבנה בארץ
        </Text>
      </ScrollView>

      <BottomNav active="me" onTab={onNavigate} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: '700', fontSize: 17 },
  profileBiz: { fontSize: 13, marginTop: 2 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  proBadgeText: { fontSize: 11, fontWeight: '600' },
  group: { marginBottom: 18 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingIcon: { flexShrink: 0 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginTop: 18,
    gap: 8,
  },
  logoutText: { fontWeight: '600', fontSize: 15 },
  version: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 11,
  },
});
