import React from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import type { KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors } from '@/theme/tokens';

interface FixedBottomProps {
  children: React.ReactNode;
  colors?: typeof lightColors;
}

/**
 * Bottom action bar that sticks to the screen bottom and lifts to sit tight
 * above the keyboard when it opens.
 *
 * Implementation note: an absolutely-positioned bar can't be lifted by
 * KeyboardAvoidingView (absolute children are outside flow). Instead we
 * subscribe to keyboard events directly and animate the `bottom` offset.
 * This makes behavior identical regardless of which keyboard or which OEM
 * Android device, and stable across repeated open/close cycles.
 *
 * Platform notes:
 * - iOS: use willShow/willHide so the bar moves WITH the keyboard animation,
 *   not after it. endCoordinates.height is the final keyboard height.
 * - Android: didShow/didHide are the only events available pre-API 30, and
 *   the keyboard isn't animated by the OS, so this matches native behavior.
 */
export function FixedBottom({ children, colors = lightColors }: FixedBottomProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => setKeyboardHeight(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // When keyboard is open we sit tight above it — no extra safe-area padding
  // (the keyboard already covers the home indicator area). When closed, we
  // respect the safe area + a comfortable gap.
  const bottomOffset = keyboardHeight > 0 ? keyboardHeight : 0;
  const verticalPadding =
    keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 16) + 16;

  return (
    <View
      style={[
        styles.container,
        { bottom: bottomOffset, paddingBottom: verticalPadding },
      ]}
    >
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
