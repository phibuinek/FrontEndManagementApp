import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { Palette } from '@/constants/theme';

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    gap: 8,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
