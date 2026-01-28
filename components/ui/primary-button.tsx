import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

const variantStyles = {
  primary: { backgroundColor: Palette.accentPurple },
  secondary: { backgroundColor: Palette.accentPink },
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
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
