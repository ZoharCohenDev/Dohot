import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ScaledText } from './ScaledText';
import { lightColors, fonts, radii, shadows } from '@/theme/tokens';

type ButtonKind = 'primary' | 'accent' | 'ai' | 'ghost' | 'subtle' | 'danger';
type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps {
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  onPress?: () => void;
  full?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  colors?: typeof lightColors;
}

const sizeConfig = {
  lg: { height: 60, fontSize: 17, paddingHorizontal: 22, gap: 10, borderRadius: radii.md + 2 },
  md: { height: 52, fontSize: 16, paddingHorizontal: 18, gap: 8, borderRadius: radii.md },
  sm: { height: 40, fontSize: 14, paddingHorizontal: 14, gap: 6, borderRadius: radii.sm + 2 },
};

export function Button({
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  onPress,
  full,
  disabled,
  style,
  colors = lightColors,
}: ButtonProps) {
  const sz = sizeConfig[size];

  const kindStyles: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.ink1, fg: colors.bg },
    accent: { bg: colors.accent, fg: '#fff' },
    ai: { bg: colors.ai, fg: '#fff' },
    ghost: { bg: colors.bgElev, fg: colors.ink1, border: colors.lineStrong },
    subtle: { bg: colors.bgSunken, fg: colors.ink1 },
    danger: { bg: colors.dangerBg, fg: colors.danger },
  };

  const k = kindStyles[kind];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: sz.height,
          paddingHorizontal: sz.paddingHorizontal,
          borderRadius: sz.borderRadius,
          backgroundColor: k.bg,
          borderWidth: k.border ? 1 : 0,
          borderColor: k.border ?? 'transparent',
          width: full ? '100%' : undefined,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          gap: sz.gap,
        },
        kind === 'primary' || kind === 'accent' ? shadows.sm : undefined,
        style,
      ]}
    >
      {icon}
      {children !== undefined && (
        <ScaledText
          style={[
            styles.label,
            { fontSize: sz.fontSize, color: k.fg, fontFamily: fonts.sans },
          ]}
          numberOfLines={1}
        >
          {children}
        </ScaledText>
      )}
      {iconRight}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
