import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { lightColors, durations } from '@/theme/tokens';

interface ProgressBarProps {
  value: number; // 0 to 1
  colors?: typeof lightColors;
}

export function ProgressBar({ value, colors = lightColors }: ProgressBarProps) {
  const widthAnim = React.useRef(new Animated.Value(value)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value,
      duration: durations.slow,
      useNativeDriver: false,
    }).start();
  }, [value, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[styles.track, { backgroundColor: colors.bgSunken, marginHorizontal: 20 }]}
    >
      <Animated.View
        style={[styles.fill, { backgroundColor: colors.accent, width }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
