import React from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { lightColors, durations } from '@/theme/tokens';

interface ToggleProps {
  on: boolean;
  onChange?: () => void;
  colors?: typeof lightColors;
}

export function Toggle({ on, onChange, colors = lightColors }: ToggleProps) {
  const translateX = React.useRef(new Animated.Value(on ? -20 : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: on ? -20 : 0,
      duration: durations.normal,
      useNativeDriver: true,
    }).start();
  }, [on, translateX]);

  return (
    <Pressable
      onPress={onChange}
      style={[
        styles.track,
        { backgroundColor: on ? colors.ai2 : colors.ink4 },
      ]}
    >
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 999,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-end',
  },
});
