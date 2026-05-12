import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ScaledText } from '@/components/primitives';
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

// Bar geometry — exported so screens can reserve the exact space above it.
const NAV_HEIGHT = 72;
const NAV_BOTTOM_GAP = 8;       // gap between bar and safe-area bottom
const NAV_BOTTOM_MIN = 16;      // minimum gap on devices without a safe area
const NAV_HORIZONTAL_INSET = 12;
const CONTENT_BUFFER = 24;      // visual buffer between content and the bar

/**
 * Padding needed under scrollable content so the last item is not clipped by
 * the floating BottomNav on any device (notched iPhones, gesture-nav Android,
 * older devices). Use this on the `contentContainerStyle.paddingBottom` of any
 * screen that renders a BottomNav.
 */
export function useBottomNavSpacing(): number {
  const insets = useSafeAreaInsets();
  const navBottomOffset = Math.max(insets.bottom + NAV_BOTTOM_GAP, NAV_BOTTOM_MIN);
  return NAV_HEIGHT + navBottomOffset + CONTENT_BUFFER;
}

export function BottomNav({ active = 'home', onTab, colors = lightColors }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const navBottomOffset = Math.max(insets.bottom + NAV_BOTTOM_GAP, NAV_BOTTOM_MIN);

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: colors.bgElev,
          bottom: navBottomOffset,
          // Match border tint to the active palette so a dark hairline doesn't
          // appear as a faint asymmetry on the dark-mode bar.
          borderColor: colors.line,
        },
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
            <ScaledText
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
            </ScaledText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    // Logical start/end so the bar stays symmetrically inset regardless of
    // the runtime RTL/`doLeftAndRightSwapInRTL` state — physical `left/right`
    // can flip on some Android builds and shift the bar visually.
    start: NAV_HORIZONTAL_INSET,
    end: NAV_HORIZONTAL_INSET,
    height: NAV_HEIGHT,
    borderRadius: radii.xl,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 6,
    borderWidth: 1,
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
