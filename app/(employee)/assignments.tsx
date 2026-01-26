import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet, apiPatch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';

type Assignment = {
  _id: string;
  customer?: { name: string; nameEn?: string };
  service?: { name: string; nameEn?: string };
  price: number;
  status: string;
  scheduledAt: string;
  checkInAt?: string;
  completedAt?: string;
};

export default function EmployeeAssignmentsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiGet<Assignment[]>('/assignments/mine', token);
      setAssignments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const checkIn = async (id: string) => {
    try {
      await apiPatch(`/assignments/${id}/check-in`, {}, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const complete = async (id: string) => {
    try {
      await apiPatch(`/assignments/${id}/complete`, {}, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeAssignmentsTitle')}</ThemedText>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">
              {(locale === 'en' && item.customer?.nameEn ? item.customer.nameEn : item.customer?.name ?? t('customerFallback'))}{' '}
              - {(locale === 'en' && item.service?.nameEn ? item.service.nameEn : item.service?.name ?? t('serviceFallback'))}
            </ThemedText>
            <ThemedText>{t('fee')}: {formatMoney(item.price)}</ThemedText>
            <ThemedText>{t('schedule')}: {new Date(item.scheduledAt).toLocaleString()}</ThemedText>
            <ThemedText>{t('status')}: {item.status}</ThemedText>
            {item.checkInAt && <ThemedText>{t('checkIn')}: {new Date(item.checkInAt).toLocaleString()}</ThemedText>}
            {item.completedAt && <ThemedText>{t('complete')}: {new Date(item.completedAt).toLocaleString()}</ThemedText>}
            {!item.checkInAt && (
              <PrimaryButton label={t('checkIn')} onPress={() => checkIn(item._id)} />
            )}
            {item.checkInAt && !item.completedAt && (
              <PrimaryButton
                label={t('complete')}
                variant="secondary"
                onPress={() => complete(item._id)}
              />
            )}
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
