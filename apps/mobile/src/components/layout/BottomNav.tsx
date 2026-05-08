import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from '@/components/icons';
import { lightColors, fonts, shadows, radii } from '@/theme/tokens';

export type TabId = 'home' | 'docs' | 'create' | 'customers' | 'me';

interface BottomNavProps {
  active?: TabId;
  onTab?: (tab: TabId) => void;
  colors?: typeof lightColors;
}

const tabs: Array<{ id: TabId; label: string; Icon: (p: { size?: number; stroke?: number; color?: string }) => React.ReactElement; primary?: boolean }> = [
  { id: 'home', label: 'בית', Icon: Icons.home },
  { id: 'docs', label: 'מסמכים', Icon: Icons.doc },
  { id: 'create', label: 'יצירה', Icon: Icons.plus, primary: true },
  { id: 'customers', label: 'לקוחות', Icon: Icons.customers },
  { id: 'me', label: 'אני', Icon: Icons.user },
];

export function BottomNav({ active = 'home', onTab, colors = lightColors }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: colors.bgElev, bottom: Math.max(insets.bottom + 8, 16) },
        shadows.lg,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        if (tab.primary) {
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTab?.(tab.id)}
              style={[styles.fab, { backgroundColor: colors.accent }]}
            >
              <tab.Icon size={26} stroke={2.4} color="#fff" />
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTab?.(tab.id)}
            style={styles.tabBtn}
          >
            <tab.Icon
              size={22}
              stroke={isActive ? 2.2 : 1.8}
              color={isActive ? colors.ink1 : colors.ink3}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.ink1 : colors.ink3,
                  fontWeight: isActive ? '700' : '500',
                  fontFamily: fonts.sans,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 72,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(27,25,22,0.06)',
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#C2613B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
