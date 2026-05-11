import React from 'react';
import { View, StyleSheet, Keyboard, Platform } from 'react-native';
import type { KeyboardEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors } from '@/theme/tokens';

interface FixedBottomProps {
  children: React.ReactNode;
  colors?: typeof lightColors;
}

export function FixedBottom({ children, colors = lightColors }: FixedBottomProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      // iOS: lift above keyboard manually — no adjustResize on iOS.
      const onShow = (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates?.height ?? 0);
      const onHide = () => setKeyboardHeight(0);
      const showSub = Keyboard.addListener('keyboardWillShow', onShow);
      const hideSub = Keyboard.addListener('keyboardWillHide', onHide);
      return () => { showSub.remove(); hideSub.remove(); };
    }

    // Android: adjustResize shrinks the window so bottom:0 sits above the keyboard.
    // But FixedBottom still covers the last ~80px of the shrunken window, which blocks
    // inputs that land there. Hide entirely while the keyboard is open — the ScrollView
    // then has the full shrunken window and Android natively scrolls the focused input
    // into view. The 140px paddingBottom in scroll content becomes usable scroll space.
    const onShow = () => setKeyboardHeight(1);
    const onHide = () => setKeyboardHeight(0);
    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Android: hide while keyboard is open so inputs aren't blocked
  if (Platform.OS === 'android' && keyboardHeight > 0) return null;

  const bottomOffset = keyboardHeight > 0 ? keyboardHeight : 0;
  const verticalPadding = keyboardHeight > 0 ? 12 : Math.max(insets.bottom, 16) + 16;

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
