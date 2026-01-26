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
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="#8a8a8a"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Palette.surface,
  },
});
