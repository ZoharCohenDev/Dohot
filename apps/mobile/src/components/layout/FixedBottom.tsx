import React from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import type { KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors } from '@/theme/tokens';

interface FixedBottomProps {
  children: React.ReactNode;
  colors?: typeof lightColors;
}

// Minimum bottom inset when the device safe area is small (3-button nav, no
// gesture indicator). Was 16 — buttons rendered a touch too low on Android
// edge-to-edge builds; bumping to 24 lifts them out of the soft-key area
// without changing notched-iPhone spacing.
const SAFE_BOTTOM_MIN = 24;
const PADDING_BOTTOM_EXTRA = 16;

/**
 * Fixed bottom action bar.
 *
 * Always visible — including while the keyboard is open — so users can submit
 * a form without dismissing the keyboard first.
 *
 * Positioning:
 * - iOS: listens to `keyboardWillShow/Hide` and lifts the bar by the keyboard
 *   height so it floats just above the keyboard (animates with it).
 * - Android: uses `softwareKeyboardLayoutMode: 'resize'` (set in app.json) which
 *   shrinks the window when the keyboard appears. `bottom: 0` therefore lands
 *   right above the keyboard naturally — no JS listener needed.
 *
 * Inputs stay visible above the bar because the host `KeyboardAwareScrollView`
 * uses `extraScrollHeight` (see primitive) large enough to clear both the
 * keyboard and this bar.
 */
export function FixedBottom({ children, colors = lightColors }: FixedBottomProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') {
      // adjustResize shrinks the window; no JS positioning needed.
      return undefined;
    }
    const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardOpen = keyboardHeight > 0;
  // When keyboard is open we don't need home-indicator clearance under the bar.
  const verticalPadding = keyboardOpen
    ? 12
    : Math.max(insets.bottom, SAFE_BOTTOM_MIN) + PADDING_BOTTOM_EXTRA;

  return (
    <View
      style={[
        styles.container,
        { bottom: keyboardOpen ? keyboardHeight : 0, paddingBottom: verticalPadding },
      ]}
    >
      <View style={[styles.fade, { backgroundColor: colors.bg }]} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
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
