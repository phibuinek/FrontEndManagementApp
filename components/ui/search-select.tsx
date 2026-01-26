import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useI18n } from '@/context/i18n-context';

type Item = {
  id: string;
  label: string;
  subtitle?: string;
};

type Props = {
  title: string;
  placeholder?: string;
  items: Item[];
  selectedId?: string | null;
  onSelect: (item: Item) => void;
};

export function SearchSelect({
  title,
  placeholder,
  items,
  selectedId,
  onSelect,
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
        placeholderTextColor="#8a8a8a"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => {
                onSelect(item);
                setQuery(item.label);
              }}
            >
              <ThemedText style={[styles.optionText, selected && styles.optionTextSelected]}>
                {item.label}
              </ThemedText>
              {item.subtitle ? (
                <ThemedText style={styles.optionSub}>{item.subtitle}</ThemedText>
              ) : null}
            </Pressable>
          );
        }}
      />
      {selectedId ? (
        <ThemedText style={styles.selectedNote}>
          {t('selected')}: {items.find((i) => i.id === selectedId)?.label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Palette.surface,
  },
  list: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 10,
    backgroundColor: Palette.surface,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  optionSelected: {
    backgroundColor: '#eef2f8',
  },
  optionText: {
    fontWeight: '600',
  },
  optionTextSelected: {
    color: Palette.navy,
  },
  optionSub: {
    color: Palette.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  selectedNote: {
    color: Palette.slate,
    fontSize: 12,
  },
});
