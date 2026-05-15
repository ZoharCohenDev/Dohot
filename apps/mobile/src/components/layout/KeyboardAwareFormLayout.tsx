import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewHandle } from '@/components/primitives';
import { FixedBottom } from './FixedBottom';
import { lightColors } from '@/theme/tokens';

interface KeyboardAwareFormLayoutProps {
  /** Fixed header row(s) that stay above the scroll area (e.g. Header + ProgressBar). */
  header?: React.ReactNode;
  /** Scrollable form content (inputs, fields, tiles, etc.). */
  children: React.ReactNode;
  /** Optional bottom action(s) — auto-hidden while the keyboard is visible. */
  bottomAction?: React.ReactNode;
  /** Padding/gap inside the scrollable content area. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Overall background — defaults to lightColors.bg. */
  colors?: typeof lightColors;
  /** Extra props forwarded to the scroll view (rare — keep defaults when possible). */
  scrollProps?: Omit<React.ComponentProps<typeof KeyboardAwareScrollView>, 'children'>;
}

// Sizing of the FixedBottom bar (single primary button):
//   button height (Button kind=primary size=lg): 60
//   container paddingTop:                         10
//   container paddingBottom: max(insets.bottom,24)+16
//   visual buffer between last field and bar:     24
// Form scroll content must reserve that much paddingBottom so the last field
// can always scroll fully above the bar. Keep `FIXED_BOTTOM_SAFE_MIN` in sync
// with `SAFE_BOTTOM_MIN` in FixedBottom.tsx.
const FIXED_BOTTOM_BUTTON_HEIGHT = 60;
const FIXED_BOTTOM_PADDING_TOP = 10;
const FIXED_BOTTOM_SAFE_MIN = 24;
const FIXED_BOTTOM_EXTRA_BOTTOM = 16;
const FIXED_BOTTOM_VISUAL_BUFFER = 24;

/**
 * One canonical layout for every form screen.
 *
 * Structure:
 *   View (root, app background)
 *     ├── header (fixed at top — never scrolls)
 *     ├── KeyboardAwareScrollView (library-backed, scrolls focused input above keyboard)
 *     │      └── children (the actual form)
 *     └── FixedBottom (action bar — auto-hidden while keyboard is open)
 *
 * Rules baked in:
 * - extraScrollHeight / extraHeight = 120: focused input always sits well above keyboard.
 * - keyboardShouldPersistTaps='handled': taps in fields don't dismiss the keyboard.
 * - FixedBottom hides while keyboard is open (both platforms) so it can never
 *   overlap the focused input on Android EAS builds.
 * - Bottom padding on the scroll content is computed from the safe-area inset PLUS
 *   the actual height of the FixedBottom bar, so the last field is always reachable
 *   above the bar on every device.
 *
 * RTL: layout is direction-agnostic — column flow + writingDirection: 'rtl' in Field.
 */
export const KeyboardAwareFormLayout = React.forwardRef<
  KeyboardAwareScrollViewHandle,
  KeyboardAwareFormLayoutProps
>(function KeyboardAwareFormLayout(
  { header, children, bottomAction, contentContainerStyle, colors = lightColors, scrollProps },
  ref,
) {
  const insets = useSafeAreaInsets();

  const fixedBottomHeight =
    FIXED_BOTTOM_BUTTON_HEIGHT +
    FIXED_BOTTOM_PADDING_TOP +
    Math.max(insets.bottom, FIXED_BOTTOM_SAFE_MIN) +
    FIXED_BOTTOM_EXTRA_BOTTOM;

  const reservedBottomPadding = bottomAction
    ? fixedBottomHeight + FIXED_BOTTOM_VISUAL_BUFFER
    : Math.max(insets.bottom, 24);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {header}
      <KeyboardAwareScrollView
        ref={ref}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: reservedBottomPadding },
          contentContainerStyle,
          // Re-apply paddingBottom AFTER the caller's contentContainerStyle so a
          // screen passing `paddingBottom: 140` can't accidentally shrink the
          // computed reserved space on devices with a larger safe area.
          { paddingBottom: reservedBottomPadding },
        ]}
        {...scrollProps}
      >
        {children}
      </KeyboardAwareScrollView>
      {bottomAction && <FixedBottom colors={colors}>{bottomAction}</FixedBottom>}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
});
