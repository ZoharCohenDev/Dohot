import React from 'react';
import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import {
  KeyboardAwareScrollView as LibKeyboardAwareScrollView,
  KeyboardAwareScrollViewProps as LibKeyboardAwareScrollViewProps,
} from 'react-native-keyboard-aware-scroll-view';

export interface KeyboardAwareScrollViewProps extends LibKeyboardAwareScrollViewProps {
  children: React.ReactNode;
  /** Additive style merged AFTER `style` — useful for one-off overrides. */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Exposed scroll API for screens that need to scrollToTop / scrollToFocusedInput.
 * Matches the underlying library's class instance methods so callers can use refs
 * just like a regular ScrollView.
 */
export type KeyboardAwareScrollViewHandle = LibKeyboardAwareScrollView;

/**
 * Project-wide scroll wrapper for any screen or sheet with TextInputs.
 *
 * Backed by react-native-keyboard-aware-scroll-view so the focused input is
 * automatically scrolled above the keyboard on both iOS and Android — even on
 * EAS production builds.
 *
 * Sizing notes:
 * - Consumers MUST decide how the scroll fills its parent.
 *   - In a full-screen layout (e.g. KeyboardAwareFormLayout), pass `style={{ flex: 1 }}`.
 *   - In a bottom sheet that sizes to content, pass NO style and let the sheet wrap.
 *
 * Library quirk we work around: on Android with `enableOnAndroid`, the library
 * augments `contentContainerStyle` with `paddingBottom = oldPaddingBottom + keyboardSpace`.
 * That lookup is `(contentContainerStyle || {}).paddingBottom` — which silently
 * returns `undefined` (→ 0) when an ARRAY is passed in. Result: any paddingBottom
 * we set in a screen's content style gets clobbered to 0 with the keyboard down,
 * so the last form fields end up hidden under the FixedBottom bar and the form
 * "won't scroll all the way down". Fix: flatten the style ourselves before handing
 * it to the library so the lookup hits a real object.
 *
 * Behaviour defaults baked in:
 *   enableOnAndroid           — turn on the library's Android scrolling
 *   enableAutomaticScroll     — auto-scroll focused input above keyboard
 *   extraScrollHeight=160     — clears the keyboard PLUS the visible FixedBottom
 *                               bar (≈100px tall) so the focused input is never
 *                               hidden behind either.
 *   extraHeight=160           — same buffer used internally by the library.
 *   keyboardShouldPersistTaps — 'handled' so taps in inputs don't dismiss
 *   enableResetScrollToCoords=false — don't snap back on blur, feels janky
 */
export const KeyboardAwareScrollView = React.forwardRef<
  KeyboardAwareScrollViewHandle,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(
  {
    children,
    containerStyle,
    contentContainerStyle,
    style,
    enableOnAndroid = true,
    enableAutomaticScroll = true,
    extraScrollHeight = 160,
    extraHeight = 160,
    keyboardShouldPersistTaps = 'handled',
    enableResetScrollToCoords = false,
    keyboardOpeningTime = 250,
    showsVerticalScrollIndicator = false,
    ...scrollProps
  },
  ref,
) {
  // Flatten arrays so the library's `contentContainerStyle.paddingBottom` lookup
  // works correctly (see note above).
  const flatContentContainerStyle = StyleSheet.flatten(contentContainerStyle);

  return (
    <LibKeyboardAwareScrollView
      ref={ref as React.Ref<LibKeyboardAwareScrollView>}
      style={[style, containerStyle]}
      enableOnAndroid={enableOnAndroid}
      enableAutomaticScroll={enableAutomaticScroll}
      extraScrollHeight={extraScrollHeight}
      extraHeight={extraHeight}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      enableResetScrollToCoords={enableResetScrollToCoords}
      keyboardOpeningTime={keyboardOpeningTime}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      // iOS uses native inset adjustments alongside the library scroll —
      // android: false because adjustResize already handles the window.
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentContainerStyle={flatContentContainerStyle}
      {...scrollProps}
    >
      {children}
    </LibKeyboardAwareScrollView>
  );
});
