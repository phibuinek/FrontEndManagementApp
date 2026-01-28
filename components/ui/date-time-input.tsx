import React, { useEffect, useMemo, useState } from 'react';
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
  roundToHour?: boolean;
  /** When set, picker prevents selecting past dates (iOS). Submit validation still required for Android. */
  minimumDate?: Date;
};

const roundToNextHour = (value: Date) => {
  const rounded = new Date(value);
  if (
    rounded.getMinutes() !== 0 ||
    rounded.getSeconds() !== 0 ||
    rounded.getMilliseconds() !== 0
  ) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else {
    rounded.setMinutes(0, 0, 0);
  }
  return rounded;
};

export function DateTimeInput({
  label,
  value,
  onChange,
  roundToHour = false,
  minimumDate,
}: DateTimeInputProps) {
  const { t, locale } = useI18n();
  const [showPicker, setShowPicker] = useState(false);

  const currentDate = useMemo(() => {
    let base: Date;
    if (!value) {
      base = roundToHour ? roundToNextHour(new Date()) : new Date();
    } else {
      const parsed = new Date(value);
      base = Number.isNaN(parsed.getTime())
        ? roundToHour ? roundToNextHour(new Date()) : new Date()
        : roundToHour ? roundToNextHour(parsed) : parsed;
    }
    if (minimumDate && base < minimumDate) return minimumDate;
    return base;
  }, [roundToHour, value, minimumDate]);

  useEffect(() => {
    if (!value || !roundToHour) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return;
    if (parsed.getMinutes() === 0 && parsed.getSeconds() === 0 && parsed.getMilliseconds() === 0) {
      return;
    }
    const rounded = roundToNextHour(parsed);
    if (rounded.getTime() !== parsed.getTime()) {
      onChange(rounded.toISOString());
    }
  }, [onChange, value]);

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
      minimumDate: minimumDate ?? undefined,
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
            if (roundToHour) {
              merged.setHours(selectedTime.getHours(), 0, 0, 0);
              merged.setMinutes(0, 0, 0);
            } else {
              merged.setHours(
                selectedTime.getHours(),
                selectedTime.getMinutes(),
                0,
                0,
              );
            }
            const toApply = roundToHour ? roundToNextHour(merged) : merged;
            if (minimumDate && toApply < minimumDate) return;
            onChange(toApply.toISOString());
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
          minimumDate={minimumDate}
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              const d = new Date(selectedDate);
              const toApply = roundToHour ? roundToNextHour(d) : d;
              if (minimumDate && toApply < minimumDate) return;
              onChange(toApply.toISOString());
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
