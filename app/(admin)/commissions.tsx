import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';

type Commission = {
  _id: string;
  employee?: { displayName?: string; username?: string };
  ownerPercent: number;
  employeePercent: number;
  ownerAmount: number;
  employeeAmount: number;
};

export default function CommissionsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Commission[]>('/commissions', token);
        setCommissions(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [token]);

  const filteredCommissions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return commissions;
    return commissions.filter((item) => {
      const employeeName = (item.employee?.displayName ?? item.employee?.username ?? '').toLowerCase();
      return employeeName.includes(term);
    });
  }, [commissions, searchText]);

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={filteredCommissions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('commissionsTitle')}</ThemedText>
            <FormInput
              label={t('searchCommissionsLabel')}
              placeholder={t('searchCommissionsPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">
              {t('employee')}: {item.employee?.displayName ?? item.employee?.username ?? '-'}
            </ThemedText>
            <ThemedText>{t('owner')}: {item.ownerPercent}% - {formatMoney(item.ownerAmount)}</ThemedText>
            <ThemedText>{t('employee')}: {item.employeePercent}% - {formatMoney(item.employeeAmount)}</ThemedText>
          </Card>
        )}
        contentContainerStyle={styles.content}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 12,
  },
  error: {
    color: '#c00',
  },
});
