import React from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { lightColors, durations } from '@/theme/tokens';

interface ToggleProps {
  on: boolean;
  onChange?: () => void;
  colors?: typeof lightColors;
}

// Track inner travel distance: (50 - 2*2 - 26) = 20px
const TRAVEL = 20;

export function Toggle({ on, onChange, colors = lightColors }: ToggleProps) {
  // alignSelf: 'flex-start' places the thumb at the physical LEFT of the track
  // on both LTR and RTL (cross-axis of a column container does not flip with RTL
  // in the New Architecture). OFF = 0 (thumb left), ON = +TRAVEL (thumb right).
  const onValue = TRAVEL;
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
