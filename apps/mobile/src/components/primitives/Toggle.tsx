import React from 'react';
import { I18nManager, Pressable, Animated, StyleSheet } from 'react-native';
import { lightColors, durations } from '@/theme/tokens';

interface ToggleProps {
  on: boolean;
  onChange?: () => void;
  colors?: typeof lightColors;
}

// Track inner travel distance: (50 - 2*2 - 26) = 20px
const TRAVEL = 20;

export function Toggle({ on, onChange, colors = lightColors }: ToggleProps) {
  // In RTL: thumb starts at RIGHT (flex-start = RTL leading side).
  // OFF = 0 (thumb at right/start in RTL), ON = -TRAVEL (moves left = toward end in RTL).
  // In LTR: thumb starts at LEFT (flex-start = LTR leading side).
  // OFF = 0 (thumb at left), ON = +TRAVEL (moves right).
  const onValue = I18nManager.isRTL ? -TRAVEL : TRAVEL;
  const translateX = React.useRef(new Animated.Value(on ? onValue : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: on ? onValue : 0,
      duration: durations.normal,
      useNativeDriver: true,
    }).start();
  }, [on, translateX, onValue]);

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
    alignSelf: 'flex-start',
  },
});
