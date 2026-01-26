import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet, apiPatch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';

type WorkSchedule = {
  _id: string;
  startAt: string;
  endAt: string;
  note?: string;
  checkInAt?: string;
};

export default function EmployeeScheduleScreen() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiGet<WorkSchedule[]>('/work-schedules/mine', token);
      setSchedules(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const checkIn = async (id: string) => {
    try {
      await apiPatch(`/work-schedules/${id}/check-in`, {}, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={schedules}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeSchedulesTitle')}</ThemedText>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">
              {new Date(item.startAt).toLocaleString()} - {new Date(item.endAt).toLocaleString()}
            </ThemedText>
            <ThemedText>{t('note')}: {item.note ?? '-'}</ThemedText>
            <ThemedText>{t('checkIn')}: {item.checkInAt ? new Date(item.checkInAt).toLocaleString() : t('notCheckedIn')}</ThemedText>
            {!item.checkInAt && (
              <PrimaryButton label={t('checkIn')} onPress={() => checkIn(item._id)} />
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
