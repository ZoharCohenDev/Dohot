import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { lightColors, fonts } from '@/theme/tokens';

interface PillProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  icon?: React.ReactNode;
  colors?: typeof lightColors;
}

export function Pill({ children, color, bg, icon, colors = lightColors }: PillProps) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg ?? colors.bgSunken,
        },
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[styles.text, { color: color ?? colors.ink2, fontFamily: fonts.sans }]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 6,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
