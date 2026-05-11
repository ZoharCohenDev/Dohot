import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleProp,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Combines KeyboardAvoidingView + ScrollView with platform-correct settings.
 * Use this as the root content wrapper for any screen or sheet with TextInputs.
 *
 * iOS: KAV (padding) + automaticallyAdjustKeyboardInsets keeps focused inputs visible.
 * Android: no KAV behavior — adjustResize (windowSoftInputMode) shrinks the window
 * automatically, so inputs stay visible without any KAV intervention.
 * Using behavior="height" on Android combined with adjustResize double-shrinks content.
 */
export function KeyboardAwareScrollView({
  children,
  containerStyle,
  contentContainerStyle,
  ...scrollProps
}: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
