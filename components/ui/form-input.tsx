import React from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
};

export function FormInput({ label, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="#9a8fa0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.mutedText,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff7fb',
  },
});
