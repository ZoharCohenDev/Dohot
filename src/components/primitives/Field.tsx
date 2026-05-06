import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { lightColors, fonts, radii } from '@/theme/tokens';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  colors?: typeof lightColors;
}

export function Field({
  label,
  hint,
  icon,
  multiline,
  rows = 3,
  colors = lightColors,
  ...inputProps
}: FieldProps) {
  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.ink2, fontFamily: fonts.sans }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.bgElev,
            borderColor: colors.lineStrong,
            borderRadius: radii.md,
            minHeight: multiline ? undefined : 56,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingTop: multiline ? 14 : 0,
            paddingBottom: multiline ? 14 : 0,
          },
        ]}
      >
        {icon && (
          <View style={[styles.iconWrap, { paddingTop: multiline ? 2 : 0 }]}>{icon}</View>
        )}
        <TextInput
          {...inputProps}
          multiline={multiline}
          numberOfLines={multiline ? rows : 1}
          style={[
            styles.input,
            { color: colors.ink1, fontFamily: fonts.sans, writingDirection: 'rtl' },
            multiline && styles.multilineInput,
          ]}
          placeholderTextColor={colors.ink3}
          textAlign="right"
        />
      </View>
      {hint && (
        <Text style={[styles.hint, { color: colors.ink3, fontFamily: fonts.sans }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  iconWrap: {
    marginEnd: 10,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    paddingHorizontal: 4,
  },
});
