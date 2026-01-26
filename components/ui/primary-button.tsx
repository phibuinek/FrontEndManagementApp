import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

const variantStyles = {
  primary: { backgroundColor: Palette.navy },
  secondary: { backgroundColor: Palette.slate },
  danger: { backgroundColor: Palette.danger },
};

export function PrimaryButton({ label, variant = 'primary', style, ...props }: Props) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        pressed && styles.pressed,
        style,
      ]}
    >
      <ThemedText style={styles.text}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
