import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';

type Props = PressableProps & {
  label: string;
  selected?: boolean;
};

export function OptionPill({ label, selected, style, ...props }: Props) {
  return (
    <Pressable
      {...props}
      style={[
        styles.pill,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      <ThemedText style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: Palette.navy,
    borderColor: Palette.navy,
  },
  unselected: {
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
  },
  text: {
    fontSize: 14,
  },
  textSelected: {
    color: Palette.surface,
  },
  textUnselected: {
    color: '#333',
  },
});
