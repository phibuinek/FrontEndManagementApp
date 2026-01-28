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
import { isWithinSalonHoursForSchedule } from '@/constants/salon-hours';

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
const TIME_COL_WIDTH = 72;
const HOUR_START = 7;
const HOUR_END = 20;

const formatHourLabel = (hour: number) =>
  `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;

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
    if (!editingId) {
      const now = new Date();
      if (new Date(startAt) < now || new Date(endAt) < now) {
        setError(t('errorSchedulePast'));
        return;
      }
    }
    if (
      !isWithinSalonHoursForSchedule(new Date(startAt)) ||
      !isWithinSalonHoursForSchedule(new Date(endAt))
    ) {
      setError(t('errorScheduleOutsideHours'));
      return;
    }
    if (new Date(startAt) >= new Date(endAt)) {
      setError(t('errorScheduleEndBeforeStart'));
      return;
    }
    const targetStart = new Date(startAt);
    const targetEnd = new Date(endAt);
    const overlap = schedules.some((s) => {
      if (s.employee?._id !== selectedEmployeeId) return false;
      if (editingId && s._id === editingId) return false;
      const sStart = new Date(s.startAt);
      const sEnd = new Date(s.endAt);
      return targetStart < sEnd && targetEnd > sStart;
    });
    if (overlap) {
      setError(t('errorScheduleOverlapEmployee'));
      return;
    }
    const isEditing = Boolean(editingId);
    setError(null);
    setLoading(true);
    try {
      const createdStartAt = startAt;
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
        setCalendarWeek(new Date(createdStartAt));
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

  const dayLabels = useMemo(
    () => [t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat'), t('daySun')],
    [t],
  );

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

  const filteredSchedules = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const weekStart =
      weekDays.length > 0
        ? new Date(weekDays[0].date.getFullYear(), weekDays[0].date.getMonth(), weekDays[0].date.getDate(), 0, 0, 0, 0)
        : null;
    const weekEnd =
      weekDays.length > 0
        ? new Date(
            weekDays[6].date.getFullYear(),
            weekDays[6].date.getMonth(),
            weekDays[6].date.getDate(),
            23,
            59,
            59,
            999,
          )
        : null;
    return schedules.filter((item) => {
      const employeeName = (item.employee?.displayName ?? item.employee?.username ?? '').toLowerCase();
      const noteValue = (item.note ?? '').toLowerCase();
      if (term && !employeeName.includes(term) && !noteValue.includes(term)) {
        return false;
      }
      if (!weekStart || !weekEnd) return true;
      const startValue = new Date(item.startAt);
      const endValue = new Date(item.endAt);
      return startValue <= weekEnd && endValue >= weekStart;
    });
  }, [schedules, searchText, weekDays]);

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index),
    [],
  );

  const timeGridMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    filteredSchedules.forEach((item) => {
      if (!item.employee?._id) return;
      const start = new Date(item.startAt);
      const end = new Date(item.endAt);
      const dayKey = toDateKey(start);
      hours.forEach((hour) => {
        const slotStart = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
          hour,
          0,
          0,
          0,
        );
        const slotEnd = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
          hour + 1,
          0,
          0,
          0,
        );
        if (start < slotEnd && end > slotStart) {
          const key = `${dayKey}-${hour}`;
          const list = map.get(key) ?? [];
          list.push({
            id: item._id,
            name: item.employee.displayName ?? item.employee.username ?? t('employeeFallback'),
          });
          map.set(key, list);
        }
      });
    });
    return map;
  }, [filteredSchedules, hours, t]);

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
                <View style={styles.timeGrid}>
                  <View style={styles.timeHeaderRow}>
                    <View style={[styles.timeCell, styles.timeHeaderCell]}>
                      <ThemedText style={styles.rosterHeaderText}>{t('time')}</ThemedText>
                    </View>
                    {weekDays.map((day, index) => (
                      <View key={dayLabels[index]} style={[styles.timeCell, styles.dayHeaderCell]}>
                        <ThemedText style={styles.rosterHeaderText}>
                          {dayLabels[index]} {day.date.getDate()}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                  {hours.map((hour) => (
                    <View key={hour} style={styles.timeRow}>
                      <View style={[styles.timeCell, styles.timeLabelCell]}>
                        <ThemedText style={styles.timeLabelText}>
                          {formatHourLabel(hour)}
                        </ThemedText>
                      </View>
                      {weekDays.map((day) => {
                        const key = `${toDateKey(day.date)}-${hour}`;
                        const cellEmployees = timeGridMap.get(key) ?? [];
                        const hasShift = cellEmployees.length > 0;
                        return (
                          <View
                            key={key}
                            style={[
                              styles.timeCell,
                              styles.dayCell,
                              hasShift && styles.dayCellBusy,
                            ]}
                          >
                            {cellEmployees.length === 0 ? null : (
                              <View style={styles.shiftStack}>
                                {cellEmployees.map((item) => (
                                  <Pressable
                                    key={item.id}
                                    onPress={() => handleShiftAction(item.id)}
                                    style={styles.shiftPill}
                                  >
                                    <ThemedText style={styles.shiftTime} numberOfLines={1}>
                                      {item.name}
                                    </ThemedText>
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
                  onClear={() => setSelectedEmployeeId(null)}
                />
                <DateTimeInput
                  label={t('startAt')}
                  value={startAt}
                  onChange={setStartAt}
                  roundToHour
                  minimumDate={editingId ? undefined : new Date()}
                />
                <DateTimeInput
                  label={t('endAt')}
                  value={endAt}
                  onChange={setEndAt}
                  roundToHour
                  minimumDate={editingId ? undefined : new Date()}
                />
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
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#cbd5f5',
  },
  navText: {
    fontWeight: '700',
    color: '#111827',
  },
  monthText: {
    fontWeight: '700',
    color: '#111827',
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
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shiftTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  shiftNote: {
    fontSize: 9,
    color: Palette.mutedText,
  },
  moreText: {
    fontSize: 10,
    color: Palette.mutedText,
  },
  timeGrid: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    minWidth: TIME_COL_WIDTH + DAY_COL_WIDTH * 7,
    backgroundColor: '#ffffff',
  },
  timeHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  timeRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  timeCell: {
    borderRightWidth: 1,
    borderRightColor: Palette.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  timeHeaderCell: {
    width: TIME_COL_WIDTH,
  },
  dayHeaderCell: {
    width: DAY_COL_WIDTH,
  },
  timeLabelCell: {
    width: TIME_COL_WIDTH,
    backgroundColor: '#f3f4f6',
  },
  dayCell: {
    width: DAY_COL_WIDTH,
    backgroundColor: '#ffffff',
  },
  dayCellBusy: {
    backgroundColor: '#dbe6ff',
  },
  timeLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  rosterHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
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
