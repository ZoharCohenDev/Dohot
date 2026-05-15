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
const SAFE_BOTTOM_MIN = Platform.OS === 'android' ? 40 : 24;
const PADDING_BOTTOM_EXTRA = Platform.OS === 'android' ? 20 : 16;

/**
 * Fixed bottom action bar.
 *
 * Always visible — including while the keyboard is open — so users can submit
 * a form without dismissing the keyboard first.
 *
 * Positioning:
 * - iOS: listens to `keyboardWillShow/Hide` and lifts the bar by the keyboard
 *   height so it floats just above the keyboard (animates with it).
 * - Android: listens to `keyboardDidShow/Hide` for the same purpose. We cannot
 *   rely on `softwareKeyboardLayoutMode: 'resize'` because it is broken under
 *   the New Architecture — adjustResize does not shrink the window, so
 *   `bottom: 0` would land hidden under the keyboard.
 *
 * Inputs stay visible above the bar because the host `KeyboardAwareScrollView`
 * uses `extraScrollHeight` (see primitive) large enough to clear both the
 * keyboard and this bar.
 */
export function FixedBottom({ children, colors = lightColors }: FixedBottomProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    // iOS fires keyboardWill* events — animates in sync with the keyboard slide.
    // Android only fires keyboardDid* — button appears once keyboard is fully up.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(height || (Platform.OS === 'android' ? 320 : 0));
    };
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardOpen = keyboardHeight > 0;
  
  const resolvedKeyboardHeight =
    keyboardHeight > 0 ? keyboardHeight : Platform.OS === 'android' ? 300 : 0;

  const bottomOffset = keyboardOpen ? resolvedKeyboardHeight : 0;

  const verticalPadding = keyboardOpen
    ? 8
    : Math.max(insets.bottom, SAFE_BOTTOM_MIN) + PADDING_BOTTOM_EXTRA;

  return (
    <View style={[styles.container, { bottom: bottomOffset, paddingBottom: verticalPadding }]}>
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
