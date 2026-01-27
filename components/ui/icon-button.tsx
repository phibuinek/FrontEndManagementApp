import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/theme';

type Variant = 'primary' | 'danger' | 'neutral';

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: Variant;
  size?: number;
};

const iconColors: Record<Variant, string> = {
  primary: Palette.navy,
  danger: Palette.danger,
  neutral: Palette.slate,
};

export function IconButton({
  icon,
  onPress,
  variant = 'neutral',
  size = 18,
}: IconButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button} accessibilityRole="button">
      <Ionicons name={icon} size={size} color={iconColors[variant]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
