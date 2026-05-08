import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from '@/components/icons';
import { ScaledText } from '@/components/primitives';
import { lightColors, fonts } from '@/theme/tokens';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  large?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  step?: number;
  ofSteps?: number;
  transparent?: boolean;
  colors?: typeof lightColors;
}

export function Header({
  title,
  subtitle,
  large,
  onBack,
  action,
  step,
  ofSteps,
  transparent,
  colors = lightColors,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: transparent ? 'transparent' : colors.bg,
          paddingBottom: large ? 20 : 12,
        },
      ]}
    >
      {/* Top row: back / step / action */}
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
          >
            <Icons.forward size={22} color={colors.ink1} stroke={2} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        {step != null && ofSteps != null && (
          <View style={[styles.stepBadge, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <ScaledText style={[styles.stepText, { color: colors.ink3, fontFamily: fonts.sans }]}>
              שלב {step} מתוך {ofSteps}
            </ScaledText>
          </View>
        )}

        {action ?? <View style={styles.placeholder} />}
      </View>

      {/* Large title */}
      {large && (
        <View style={styles.largeTitleBlock}>
          <ScaledText style={[styles.largeTitle, { color: colors.ink1, fontFamily: fonts.sans, textAlign: 'right' }]}>
            {title}
          </ScaledText>
          {subtitle && (
            <ScaledText style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans, textAlign: 'right' }]}>
              {subtitle}
            </ScaledText>
          )}
        </View>
      )}

      {/* Small centered title */}
      {!large && title && (
        <View style={styles.centerTitleWrap} pointerEvents="none">
          <ScaledText style={[styles.centerTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
            {title}
          </ScaledText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    zIndex: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  stepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
  },
  largeTitleBlock: {
    marginTop: 18,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    lineHeight: 21,
  },
  centerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
});
