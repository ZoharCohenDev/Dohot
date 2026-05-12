import React from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors } from '@/theme/tokens';

interface FixedBottomProps {
  children: React.ReactNode;
  colors?: typeof lightColors;
}

/**
 * Fixed bottom action bar.
 *
 * Hides entirely while the software keyboard is visible (both platforms).
 * The "absolute bar over focused input" pattern was the root cause of the
 * keyboard covering bottom inputs on Android EAS builds — a fixed bar that
 * floats above the keyboard *or* sits at the bottom of an adjustResize-shrunk
 * window will always cover the last input. While hidden, the host screen's
 * KeyboardAwareScrollView takes over and lifts the focused input above the
 * keyboard using extraScrollHeight.
 */
export function FixedBottom({ children, colors = lightColors }: FixedBottomProps) {
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  if (keyboardOpen) return null;

  const verticalPadding = Math.max(insets.bottom, 16) + 16;

  return (
    <View style={[styles.container, { paddingBottom: verticalPadding }]}>
      <View
        style={[styles.fade, { backgroundColor: colors.bg }]}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 15,
  },
  fade: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
  },
});
