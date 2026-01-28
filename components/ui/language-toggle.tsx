import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useI18n } from '@/context/i18n-context';

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useI18n();
  const label = locale === 'vi' ? t('languageEn') : t('languageVi');

  return (
    <Pressable style={styles.button} onPress={toggleLocale}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Palette.surface,
  },
  text: {
    fontWeight: '600',
    color: Palette.navy,
  },
});
