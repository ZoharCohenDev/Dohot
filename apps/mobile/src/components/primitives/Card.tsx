import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { lightColors, radii, shadows } from '@/theme/tokens';

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  elev?: 0 | 1 | 2;
  colors?: typeof lightColors;
}

export function Card({
  children,
  padding = 18,
  onPress,
  style,
  elev = 1,
  colors = lightColors,
}: CardProps) {
  const elevationStyle =
    elev === 0
      ? { borderWidth: 1, borderColor: colors.line }
      : elev === 2
        ? shadows.md
        : shadows.card;

  const content = (
    <View
      style={[
        styles.base,
        { padding, backgroundColor: colors.bgElev },
        elevationStyle,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
  },
});
