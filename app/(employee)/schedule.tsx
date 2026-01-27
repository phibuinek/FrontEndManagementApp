import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet, apiPatch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Palette } from '@/constants/theme';

type WorkSchedule = {
  _id: string;
  startAt: string;
  endAt: string;
  note?: string;
  checkInAt?: string;
  checkOutAt?: string;
};

type CalendarDay = { date: Date };
type DayShift = { id: string; timeLabel: string; note?: string };

const PERSON_COL_WIDTH = 86;
const DAY_COL_WIDTH = 80;

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
  const day = base.getDay();
  const offset = (day + 6) % 7;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset);
  return Array.from({ length: 7 }, (_, index) => ({
    date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
  }));
};

export default function EmployeeScheduleScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calendarWeek, setCalendarWeek] = useState(new Date());

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
      Alert.alert(t('successTitle'), t('checkInSuccess'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const checkOut = async (id: string) => {
    try {
      await apiPatch(`/work-schedules/${id}/check-out`, {}, token);
      await load();
      Alert.alert(t('successTitle'), t('checkOutSuccess'));
    } catch (err) {
      setError((err as Error).message);
    }
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

  const weekDayKeys = useMemo(() => {
    const keys = new Set<string>();
    weekDays.forEach((day) => keys.add(toDateKey(day.date)));
    return keys;
  }, [weekDays]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, DayShift[]>();
    schedules.forEach((item) => {
      const startDate = new Date(item.startAt);
      const dayKey = toDateKey(startDate);
      if (!weekDayKeys.has(dayKey)) return;
      const timeLabel = `${formatTime24(startDate, locale)} - ${formatTime24(
        new Date(item.endAt),
        locale,
      )}`;
      const entry: DayShift = { id: item._id, timeLabel, note: item.note };
      const list = map.get(dayKey) ?? [];
      list.push(entry);
      map.set(dayKey, list);
    });
    return map;
  }, [locale, schedules, weekDayKeys]);

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={schedules}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeSchedulesTitle')}</ThemedText>
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
                  <View style={styles.rosterRow}>
                    <View style={[styles.rosterCell, styles.personCell]}>
                      <ThemedText style={styles.personText} numberOfLines={1}>
                        {t('me')}
                      </ThemedText>
                    </View>
                    {weekDays.map((day) => {
                      const dayKey = toDateKey(day.date);
                      const shifts = scheduleMap.get(dayKey) ?? [];
                      return (
                        <View key={dayKey} style={[styles.rosterCell, styles.shiftCell]}>
                          {shifts.length === 0 ? null : (
                            <View style={styles.shiftStack}>
                              {shifts.map((shift) => (
                                <View key={shift.id} style={styles.shiftPill}>
                                  <ThemedText style={styles.shiftTime}>{shift.timeLabel}</ThemedText>
                                  {shift.note ? (
                                    <ThemedText style={styles.shiftNote} numberOfLines={1}>
                                      {shift.note}
                                    </ThemedText>
                                  ) : null}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            </View>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => {
          const statusLabel = item.checkOutAt
            ? t('checkOut')
            : item.checkInAt
            ? t('checkIn')
            : t('schedule');
          const statusColor = item.checkOutAt
            ? Palette.accentGreen
            : item.checkInAt
            ? Palette.accentOrange
            : Palette.accentBlue;
          return (
            <Card>
              <View style={styles.cardHeaderRow}>
                <View style={styles.titleBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.titleText}>
                    {new Date(item.startAt).toLocaleString()} - {new Date(item.endAt).toLocaleString()}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <ThemedText style={[styles.statusText, { color: statusColor }]}>
                      {statusLabel}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  {!item.checkInAt && (
                    <ActionButton
                      label={t('checkIn')}
                      color={Palette.accentBlue}
                      onPress={() => checkIn(item._id)}
                    />
                  )}
                  {item.checkInAt && !item.checkOutAt && (
                    <ActionButton
                      label={t('checkOut')}
                      color={Palette.accentGreen}
                      onPress={() => checkOut(item._id)}
                    />
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <InfoPill
                  label={t('note')}
                  value={item.note ?? '-'}
                  color={Palette.accentPurple}
                />
                <InfoPill
                  label={t('checkIn')}
                  value={item.checkInAt ? new Date(item.checkInAt).toLocaleString() : t('notCheckedIn')}
                  color={Palette.accentOrange}
                />
                <InfoPill
                  label={t('checkOut')}
                  value={item.checkOutAt ? new Date(item.checkOutAt).toLocaleString() : t('notCheckedOut')}
                  color={Palette.accentGreen}
                />
              </View>
            </Card>
          );
        }}
        contentContainerStyle={styles.content}
      />
    </ThemedView>
  );
}

function ActionButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: color }]}>
      <ThemedText style={styles.actionText}>{label}</ThemedText>
    </Pressable>
  );
}

function InfoPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.infoPill}>
      <View style={[styles.infoDot, { backgroundColor: color }]} />
      <View style={styles.infoContent}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
    </View>
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
  shiftPill: {
    width: '100%',
    backgroundColor: `${Palette.accentBlue}1f`,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    flexGrow: 1,
    flexBasis: '48%',
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  infoContent: {
    gap: 2,
  },
  infoLabel: {
    color: Palette.mutedText,
    fontSize: 12,
  },
  infoValue: {
    fontWeight: '600',
  },
  error: {
    color: '#c00',
  },
});
