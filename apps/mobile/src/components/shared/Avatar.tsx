import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { lightColors, fonts } from '@/theme/tokens';

interface AvatarProps {
  name?: string;
  size?: number;
  color?: string;
  colors?: typeof lightColors;
  logoUrl?: string | null;
}

const PALETTE = ['#C2613B', '#5A8770', '#4A7B9D', '#B8862B', '#8B5A8B'];

export function Avatar({ name = '', size = 40, color, colors: _colors = lightColors, logoUrl }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');

  const bg = color ?? PALETTE[name.charCodeAt(0) % PALETTE.length] ?? PALETTE[0];

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text
        style={[styles.initials, { fontSize: size * 0.4, fontFamily: fonts.sans }]}
        numberOfLines={1}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
