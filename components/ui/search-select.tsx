import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useI18n } from '@/context/i18n-context';

type Item = {
  id: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
};

type Props = {
  title: string;
  placeholder?: string;
  items: Item[];
  selectedId?: string | null;
  onSelect: (item: Item) => void;
  onClear?: () => void;
};

export function SearchSelect({
  title,
  placeholder,
  items,
  selectedId,
  onSelect,
  onClear,
}: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return items.slice(0, 12);
    }
    return items
      .filter((item) => {
        const labelMatch = item.label.toLowerCase().includes(q);
        const subtitleMatch = item.subtitle?.toLowerCase().includes(q);
        return labelMatch || subtitleMatch;
      })
      .slice(0, 12);
  }, [items, query]);

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <TextInput
        placeholder={placeholder ?? t('searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
        placeholderTextColor="#9a8fa0"
      />
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map((item) => {
          const selected = item.id === selectedId;
          const disabled = item.disabled;
          return (
            <Pressable
              key={item.id}
              style={[
                styles.option,
                selected && styles.optionSelected,
                disabled && styles.optionDisabled,
              ]}
              disabled={disabled}
              onPress={() => {
                if (disabled) return;
                onSelect(item);
                setQuery(item.label);
              }}
            >
              <ThemedText
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                  disabled && styles.optionTextDisabled,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.label}
              </ThemedText>
              {item.subtitle ? (
                <ThemedText
                  style={[styles.optionSub, disabled && styles.optionSubDisabled]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.subtitle}
                </ThemedText>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {selectedId ? (
        <View style={styles.selectedRow}>
          <ThemedText style={styles.selectedNote} numberOfLines={1} ellipsizeMode="tail">
            {t('selected')}: {items.find((i) => i.id === selectedId)?.label}
          </ThemedText>
          {onClear ? (
            <Pressable
              onPress={() => {
                onClear();
                setQuery('');
              }}
              style={styles.clearButton}
              hitSlop={8}
              accessibilityLabel={t('clearSelection')}
            >
              <Ionicons name="close-circle" size={22} color={Palette.mutedText} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff7fb',
  },
  list: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    backgroundColor: Palette.surface,
  },
  listContent: {
    paddingBottom: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3e9f3',
  },
  optionSelected: {
    backgroundColor: '#f4e8f8',
  },
  optionDisabled: {
    backgroundColor: '#f7f2f7',
  },
  optionText: {
    fontWeight: '600',
  },
  optionTextSelected: {
    color: Palette.navy,
  },
  optionTextDisabled: {
    color: Palette.mutedText,
  },
  optionSub: {
    color: Palette.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  optionSubDisabled: {
    color: Palette.slate,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  selectedNote: {
    color: Palette.slate,
    fontSize: 12,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
});
