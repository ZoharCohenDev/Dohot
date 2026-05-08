import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { useSettings } from '@/context/SettingsContext';

export function ScaledText({ style, ...props }: TextProps) {
  const { fontScale } = useSettings();
  const flat = StyleSheet.flatten(style ?? {});
  const scaledStyle =
    flat.fontSize != null
      ? { ...flat, fontSize: flat.fontSize * fontScale }
      : flat;
  return <Text style={scaledStyle} {...props} />;
}
