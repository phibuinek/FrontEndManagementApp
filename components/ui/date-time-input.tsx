import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useI18n } from '@/context/i18n-context';

type DateTimeInputProps = {
  label: string;
  value?: string;
  onChange: (nextIso: string) => void;
};

export function DateTimeInput({ label, value, onChange }: DateTimeInputProps) {
  const { t, locale } = useI18n();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [value]);

  const displayValue = useMemo(() => {
    if (!value) return t('selectDateTime');
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return t('selectDateTime');
    return parsed.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');
  }, [locale, t, value]);

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) return;
        const pickedDate = selectedDate;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== 'set' || !selectedTime) return;
            const merged = new Date(pickedDate);
            merged.setHours(
              selectedTime.getHours(),
              selectedTime.getMinutes(),
              0,
              0,
            );
            onChange(merged.toISOString());
          },
        });
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Pressable
        style={styles.input}
        onPress={() => {
          if (Platform.OS === 'android') {
            openAndroidPicker();
          } else {
            setShowPicker(true);
          }
        }}
        accessibilityRole="button"
      >
        <Ionicons name="calendar-outline" size={18} color={Palette.mutedText} />
        <ThemedText style={styles.valueText}>{displayValue}</ThemedText>
      </Pressable>
      {showPicker && Platform.OS === 'ios' && (
        <DateTimePicker
          value={currentDate}
          mode="datetime"
          display="spinner"
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate.toISOString());
            }
          }}
        />
      )}
      {showPicker && Platform.OS === 'ios' && (
        <Pressable style={styles.closeButton} onPress={() => setShowPicker(false)}>
          <ThemedText style={styles.closeText}>{t('close')}</ThemedText>
        </Pressable>
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
    color: Palette.mutedText,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Palette.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    color: Palette.text,
  },
  closeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  closeText: {
    color: Palette.primary,
    fontWeight: '600',
  },
});
