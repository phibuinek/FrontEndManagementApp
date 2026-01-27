import React, { useMemo, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { IconButton } from '@/components/ui/icon-button';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Section } from '@/components/ui/section';
import { SearchSelect } from '@/components/ui/search-select';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { Palette } from '@/constants/theme';

type WorkSchedule = {
  _id: string;
  employee?: { _id?: string; displayName?: string; username?: string };
  startAt: string;
  endAt: string;
  note?: string;
};

type Employee = { _id: string; displayName?: string; username?: string; role?: string };

type CalendarDay = { date: Date };
type DayShift = { id: string; employeeId: string; timeLabel: string; note?: string };

const formatTime24 = (value: Date, locale: string) =>
  value.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildWeekDays = (value: Date): CalendarDay[] => {
  const base = new Date(value);
  const day = base.getDay(); // 0 = Sunday
  const offset = (day + 6) % 7; // Monday as first day
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset);
  return Array.from({ length: 7 }, (_, index) => ({
    date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
  }));
};

const buildSelectedRange = (value: string) => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
};

const PERSON_COL_WIDTH = 96;
const DAY_COL_WIDTH = 80;

export default function SchedulesScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
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
  const [calendarWeek, setCalendarWeek] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));

  const load = async () => {
    try {
      const [schedulesData, employeesData] = await Promise.all([
        apiGet<WorkSchedule[]>('/work-schedules', token),
        apiGet<Employee[]>('/users', token),
      ]);
      setSchedules(schedulesData);
      setEmployees(employeesData.filter((item) => item.role !== 'admin'));
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
    const isEditing = Boolean(editingId);
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
      if (!isEditing) {
        setShowCreate(false);
        Alert.alert(t('successTitle'), t('createSuccess'));
      } else {
        Alert.alert(t('successTitle'), t('updateSuccess'));
      }
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
      Alert.alert(t('successTitle'), t('deleteSuccess'));
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

  const dayLabels = useMemo(() => {
    return locale === 'vi'
      ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }, [locale]);

  const weekLabel = useMemo(() => {
    const weekDays = buildWeekDays(calendarWeek);
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    const format = (value: Date) =>
      value.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
      });
    return `${format(start)} - ${format(end)}`;
  }, [calendarWeek, locale]);

  const weekDays = useMemo(() => buildWeekDays(calendarWeek), [calendarWeek]);

  const scheduleDateKeys = useMemo(() => {
    const keys = new Set<string>();
    schedules.forEach((item) => {
      const startKey = toDateKey(new Date(item.startAt));
      keys.add(startKey);
    });
    return keys;
  }, [schedules]);

  const scheduleById = useMemo(() => {
    const map = new Map<string, WorkSchedule>();
    schedules.forEach((item) => {
      map.set(item._id, item);
    });
    return map;
  }, [schedules]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, DayShift[]>();
    schedules.forEach((item) => {
      const startDate = new Date(item.startAt);
      const key = toDateKey(startDate);
      const employeeId = item.employee?._id ?? 'unknown';
      const timeLabel = `${formatTime24(startDate, locale)} - ${formatTime24(
        new Date(item.endAt),
        locale,
      )}`;
      const entry: DayShift = {
        id: item._id,
        employeeId,
        timeLabel,
        note: item.note ?? undefined,
      };
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    });
    return map;
  }, [locale, schedules, t]);

  const rosterRows = useMemo(() => {
    if (employees.length) return employees;
    const map = new Map<string, Employee>();
    schedules.forEach((item) => {
      if (!item.employee?._id) return;
      map.set(item.employee._id, item.employee);
    });
    return Array.from(map.values());
  }, [employees, schedules]);

  const rosterMap = useMemo(() => {
    const map = new Map<string, DayShift[]>();
    weekDays.forEach((day) => {
      const dayKey = toDateKey(day.date);
      const dayShifts = scheduleMap.get(dayKey) ?? [];
      dayShifts.forEach((shift) => {
        const key = `${shift.employeeId}-${dayKey}`;
        const list = map.get(key) ?? [];
        list.push(shift);
        map.set(key, list);
      });
    });
    return map;
  }, [scheduleMap, weekDays]);
  const filteredSchedules = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const selectedRange = selectedDateKey ? buildSelectedRange(selectedDateKey) : null;
    return schedules.filter((item) => {
      const employeeName = (item.employee?.displayName ?? item.employee?.username ?? '').toLowerCase();
      const noteValue = (item.note ?? '').toLowerCase();
      if (term && !employeeName.includes(term) && !noteValue.includes(term)) {
        return false;
      }
      if (!selectedRange) return true;
      const startValue = new Date(item.startAt);
      const endValue = new Date(item.endAt);
      return startValue <= selectedRange.end && endValue >= selectedRange.start;
    });
  }, [schedules, searchText, selectedDateKey]);

  const handleSelectDate = (value: Date) => {
    const nextKey = toDateKey(value);
    setSelectedDateKey(nextKey);
    const currentStart = new Date(startAt);
    const currentEnd = new Date(endAt);
    const nextStart = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      currentStart.getHours(),
      currentStart.getMinutes(),
    );
    const nextEnd = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      currentEnd.getHours(),
      currentEnd.getMinutes(),
    );
    setStartAt(nextStart.toISOString());
    setEndAt(nextEnd.toISOString());
  };

  const handleShiftAction = (shiftId: string) => {
    const schedule = scheduleById.get(shiftId);
    if (!schedule) return;
    Alert.alert(
      t('schedule'),
      `${schedule.employee?.displayName ?? schedule.employee?.username ?? t('employeeFallback')}\n${formatTime24(
        new Date(schedule.startAt),
        locale,
      )} - ${formatTime24(new Date(schedule.endAt), locale)}`,
      [
        { text: t('edit'), onPress: () => handleEdit(schedule) },
        { text: t('delete'), style: 'destructive', onPress: () => handleDelete(schedule._id) },
        { text: t('close'), style: 'cancel' },
      ],
    );
  };

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={[]}
        keyExtractor={() => 'schedule'}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('schedulesTitle')}</ThemedText>
            <FormInput
              label={t('searchSchedulesLabel')}
              placeholder={t('searchSchedulesPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <ThemedText type="defaultSemiBold">{t('schedule')}</ThemedText>
                <View style={styles.calendarNav}>
                  <Pressable
                    onPress={() =>
                      setCalendarWeek(
                        new Date(
                          calendarWeek.getFullYear(),
                          calendarWeek.getMonth(),
                          calendarWeek.getDate() - 7,
                        ),
                      )
                    }
                    style={styles.navButton}
                  >
                    <ThemedText style={styles.navText}>{'<'}</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.monthText}>{weekLabel}</ThemedText>
                  <Pressable
                    onPress={() =>
                      setCalendarWeek(
                        new Date(
                          calendarWeek.getFullYear(),
                          calendarWeek.getMonth(),
                          calendarWeek.getDate() + 7,
                        ),
                      )
                    }
                    style={styles.navButton}
                  >
                    <ThemedText style={styles.navText}>{'>'}</ThemedText>
                  </Pressable>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.rosterGrid}>
                <View style={styles.rosterHeaderRow}>
                  <View style={[styles.rosterCell, styles.personHeader]}>
                    <ThemedText style={styles.rosterHeaderText}>{t('employee')}</ThemedText>
                  </View>
                  {weekDays.map((day, index) => (
                    <View key={dayLabels[index]} style={[styles.rosterCell, styles.dayHeader]}>
                      <ThemedText style={styles.rosterHeaderText}>
                        {dayLabels[index]} {day.date.getDate()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
                {rosterRows.map((employee) => (
                  <View key={employee._id} style={styles.rosterRow}>
                    <View style={[styles.rosterCell, styles.personCell]}>
                      <ThemedText style={styles.personText} numberOfLines={1}>
                        {employee.displayName ?? employee.username ?? t('employeeFallback')}
                      </ThemedText>
                    </View>
                    {weekDays.map((day) => {
                      const dayKey = toDateKey(day.date);
                      const cellKey = `${employee._id}-${dayKey}`;
                      const shifts = rosterMap.get(cellKey) ?? [];
                      return (
                        <View key={cellKey} style={[styles.rosterCell, styles.shiftCell]}>
                          {shifts.length === 0 ? null : (
                            <View style={styles.shiftStack}>
                              {shifts.map((shift) => (
                                <Pressable
                                  key={shift.id}
                                  onPress={() => handleShiftAction(shift.id)}
                                  style={styles.shiftPill}
                                >
                                  <ThemedText style={styles.shiftTime}>{shift.timeLabel}</ThemedText>
                                  {shift.note ? (
                                    <ThemedText style={styles.shiftNote} numberOfLines={1}>
                                      {shift.note}
                                    </ThemedText>
                                  ) : null}
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
                </View>
              </ScrollView>
            </View>
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
        renderItem={() => null}
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
  calendarCard: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  navText: {
    fontWeight: '700',
    color: Palette.navy,
  },
  monthText: {
    fontWeight: '600',
    color: Palette.navy,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.285%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 4,
    minHeight: 110,
  },
  dayLabel: {
    fontSize: 11,
    color: Palette.mutedText,
  },
  dayNumber: {
    fontWeight: '600',
  },
  selectedDay: {
    backgroundColor: `${Palette.accentBlue}22`,
    borderRadius: 10,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: Palette.accentBlue,
  },
  shiftPill: {
    width: '100%',
    backgroundColor: `${Palette.accentBlue}22`,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  shiftTime: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.navy,
  },
  shiftNote: {
    fontSize: 9,
    color: Palette.mutedText,
  },
  moreText: {
    fontSize: 10,
    color: Palette.mutedText,
  },
  rosterGrid: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    minWidth: PERSON_COL_WIDTH + DAY_COL_WIDTH * 7,
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f8',
  },
  rosterRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  rosterCell: {
    borderRightWidth: 1,
    borderRightColor: Palette.border,
    padding: 8,
    minHeight: 64,
    justifyContent: 'center',
  },
  personHeader: {
    width: PERSON_COL_WIDTH,
  },
  dayHeader: {
    width: DAY_COL_WIDTH,
  },
  rosterHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy,
  },
  personCell: {
    backgroundColor: '#f8f9fc',
    width: PERSON_COL_WIDTH,
  },
  personText: {
    fontWeight: '600',
    color: Palette.navy,
  },
  shiftCell: {
    backgroundColor: '#fff',
    width: DAY_COL_WIDTH,
  },
  shiftStack: {
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  error: {
    color: '#c00',
  },
});
