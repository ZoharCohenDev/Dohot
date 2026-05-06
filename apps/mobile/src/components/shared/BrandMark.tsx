import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightColors, fonts } from '@/theme/tokens';

interface BrandMarkProps {
  size?: number;
  colors?: typeof lightColors;
}

export function BrandMark({ size = 36, colors = lightColors }: BrandMarkProps) {
  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: colors.ink1,
        },
      ]}
    >
      <Text
        style={[
          styles.letter,
          { fontSize: size * 0.55, color: colors.bg, fontFamily: fonts.serif },
        ]}
      >
        ד
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '700',
    letterSpacing: -1,
  },
});
