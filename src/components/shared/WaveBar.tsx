import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface WaveBarProps {
  color?: string;
  barCount?: number;
  heights?: number[];
}

export function WaveBar({ color = '#84B097', barCount = 8, heights }: WaveBarProps) {
  const defaultHeights = heights ?? Array.from({ length: barCount }, (_, i) => 8 + Math.abs(Math.sin(i * 0.6) * 16));
  const anims = useRef(defaultHeights.map(() => new Animated.Value(0.4))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [anims]);

  return (
    <View style={styles.row}>
      {defaultHeights.map((h, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: h,
              backgroundColor: color,
              transform: [{ scaleY: anims[i] ?? new Animated.Value(0.4) }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
});
