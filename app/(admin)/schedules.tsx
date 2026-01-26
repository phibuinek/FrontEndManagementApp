import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Section } from '@/components/ui/section';
import { SearchSelect } from '@/components/ui/search-select';
import { DateTimeInput } from '@/components/ui/date-time-input';

type WorkSchedule = {
  _id: string;
  employee?: { _id?: string; displayName?: string; username?: string };
  startAt: string;
  endAt: string;
  note?: string;
};

type Employee = { _id: string; displayName?: string; username?: string };

export default function SchedulesScreen() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(new Date().toISOString());
  const [endAt, setEndAt] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [schedulesData, employeesData] = await Promise.all([
        apiGet<WorkSchedule[]>('/work-schedules', token),
        apiGet<Employee[]>('/users', token),
      ]);
      setSchedules(schedulesData);
      setEmployees(employeesData);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleCreate = async () => {
    if (!selectedEmployeeId || !startAt || !endAt) {
      setError(t('errorScheduleRequired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (editingId) {
        await apiPatch(
          `/work-schedules/${editingId}`,
          {
            employeeId: selectedEmployeeId,
            startAt,
            endAt,
            note: note.trim() || undefined,
          },
          token,
        );
      } else {
        await apiPost(
          '/work-schedules',
          {
            employeeId: selectedEmployeeId,
            startAt,
            endAt,
            note: note.trim() || undefined,
          },
          token,
        );
      }
      setSelectedEmployeeId(null);
      setStartAt(new Date().toISOString());
      setEndAt(new Date(Date.now() + 60 * 60 * 1000).toISOString());
      setNote('');
      setEditingId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await apiDelete(`/work-schedules/${id}`, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (item: WorkSchedule) => {
    setShowCreate(true);
    setEditingId(item._id);
    setSelectedEmployeeId(item.employee?._id ?? null);
    setStartAt(item.startAt);
    setEndAt(item.endAt);
    setNote(item.note ?? '');
  };

  const filteredSchedules = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return schedules;
    return schedules.filter((item) => {
      const employeeName = (item.employee?.displayName ?? item.employee?.username ?? '').toLowerCase();
      const noteValue = (item.note ?? '').toLowerCase();
      return employeeName.includes(term) || noteValue.includes(term);
    });
  }, [schedules, searchText]);

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={filteredSchedules}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('schedulesTitle')}</ThemedText>
            <FormInput
              label={t('searchSchedulesLabel')}
              placeholder={t('searchSchedulesPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {showCreate && (
              <Section title={editingId ? t('editSchedule') : t('createScheduleTitle')}>
                <SearchSelect
                  title={t('selectEmployee')}
                  placeholder={t('searchEmployeesPlaceholder')}
                  items={employees.map((employee) => ({
                    id: employee._id,
                    label: employee.displayName ?? employee.username ?? t('employeeFallback'),
                  }))}
                  selectedId={selectedEmployeeId}
                  onSelect={(item) => setSelectedEmployeeId(item.id)}
                />
                <DateTimeInput label={t('startAt')} value={startAt} onChange={setStartAt} />
                <DateTimeInput label={t('endAt')} value={endAt} onChange={setEndAt} />
                <FormInput label={t('note')} value={note} onChangeText={setNote} />
                <PrimaryButton
                  label={loading ? t('saving') : editingId ? t('updateSchedule') : t('createSchedule')}
                  onPress={handleCreate}
                />
              </Section>
            )}
            <PrimaryButton
              label={showCreate ? t('close') : t('createScheduleTitle')}
              onPress={() => {
                setShowCreate((prev) => !prev);
                if (showCreate) {
                  setEditingId(null);
                  setSelectedEmployeeId(null);
                  setStartAt(new Date().toISOString());
                  setEndAt(new Date(Date.now() + 60 * 60 * 1000).toISOString());
                  setNote('');
                }
              }}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">
              {item.employee?.displayName ?? item.employee?.username ?? t('employeeFallback')}
            </ThemedText>
            <ThemedText>{t('startAt')}: {new Date(item.startAt).toLocaleString()}</ThemedText>
            <ThemedText>{t('endAt')}: {new Date(item.endAt).toLocaleString()}</ThemedText>
            <ThemedText>{t('note')}: {item.note ?? '-'}</ThemedText>
            <PrimaryButton label={t('edit')} variant="secondary" onPress={() => handleEdit(item)} />
            <PrimaryButton
              label={t('delete')}
              variant="danger"
              onPress={() => handleDelete(item._id)}
            />
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
