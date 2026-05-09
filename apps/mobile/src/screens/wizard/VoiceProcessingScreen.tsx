import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import { Icons } from '@/components/icons';
import { fonts, voiceColors } from '@/theme/tokens';

const STEPS = [
  { label: 'תמלול קולי', done: true },
  { label: 'תיקון דקדוק', done: true },
  { label: 'מבנה מקצועי', done: false, active: true },
  { label: 'יצירת המלצות', done: false },
];

export function VoiceProcessingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orbit1 = useRef(new Animated.Value(0)).current;
  const orbit2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(orbit1, { toValue: 1, duration: 10000, useNativeDriver: true }),
    ).start();

    Animated.loop(
      Animated.timing(orbit2, { toValue: 1, duration: 6000, useNativeDriver: true }),
    ).start();
  }, [pulseAnim, orbit1, orbit2]);

  const orbit1Rotate = orbit1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbit2Rotate = orbit2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.aurora} pointerEvents="none" />

      <View style={styles.center}>
        {/* Orbiting ring */}
        <View style={styles.orbitContainer}>
          <Animated.View style={[styles.orbitRing1, { transform: [{ rotate: orbit1Rotate }] }]} />
          <Animated.View style={[styles.orbitRing2, { transform: [{ rotate: orbit2Rotate }] }]} />
          <Animated.View style={[styles.orbitCore, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.sparkleCenter} pointerEvents="none">
            <Icons.sparkle size={42} color={voiceColors.sageDark} />
          </View>
        </View>

        <Text style={[styles.title, { fontFamily: fonts.serif }]}>
          {'מנסחים את הדוח\n'}
          <Text style={styles.titleGrad}>בעברית מקצועית…</Text>
        </Text>

        {/* Steps */}
        <View style={styles.stepsList}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  step.done
                    ? { backgroundColor: voiceColors.sageLight }
                    : step.active
                      ? { borderWidth: 2, borderColor: voiceColors.sageLight, backgroundColor: 'transparent' }
                      : { backgroundColor: 'rgba(255,255,255,0.06)' },
                ]}
              >
                {step.done && <Icons.check size={11} color="#0F1612" stroke={3.5} />}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: step.done
                      ? voiceColors.sageLight
                      : step.active
                        ? voiceColors.textPrimary
                        : voiceColors.textMuted,
                    fontFamily: fonts.sans,
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: voiceColors.bg,
  },
  aurora: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  orbitContainer: {
    width: 180,
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  orbitRing1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(132,176,151,0.3)',
    borderStyle: 'dashed',
  },
  orbitRing2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(132,176,151,0.5)',
  },
  orbitCore: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(132,176,151,0.15)',
  },
  sparkleCenter: {
    position: 'absolute',
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    color: voiceColors.textPrimary,
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 32,
  },
  titleGrad: {
    fontStyle: 'italic',
    color: voiceColors.sageLight,
  },
  stepsList: {
    gap: 10,
    width: '100%',
    maxWidth: 280,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 14,
  },
});
