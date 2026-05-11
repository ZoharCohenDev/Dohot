import type { TextStyle, ViewStyle } from 'react-native';

export const rtlText: TextStyle = {
  textAlign: 'right',
  writingDirection: 'rtl',
};

export const rtlRow: ViewStyle = {
  flexDirection: 'row-reverse',
};

// Wrap a container with this to lock Yoga into LTR mode.
// Inside LTR Yoga, row-reverse = right-to-left visual = correct Hebrew layout.
export const rtlContainer: ViewStyle = {
  direction: 'ltr',
};
