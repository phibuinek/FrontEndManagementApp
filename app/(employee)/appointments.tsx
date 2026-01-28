import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet, apiPost } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Palette } from '@/constants/theme';

type Appointment = {
  _id: string;
  customer?: { name: string; nameEn?: string };
  service?: { name: string; nameEn?: string; price?: number };
  assignedEmployee?: { displayName?: string; username?: string };
  status: string;
  scheduledAt: string;
};

type CalendarDay = { date: Date };
type DayAppointment = {
  id: string;
  timeLabel: string;
  customerLabel: string;
  serviceLabel: string;
  status: string;
};

const PERSON_COL_WIDTH = 86;
const DAY_COL_WIDTH = 86;

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

export default function EmployeeAppointmentsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [calendarWeek, setCalendarWeek] = useState(new Date());

  const load = async () => {
    try {
      const data = await apiGet<Appointment[]>('/appointments/mine', token);
      setAppointments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const startAppointment = async (id: string) => {
    setError(null);
    try {
      await apiPost(`/appointments/${id}/start`, {}, token);
      await load();
      Alert.alert(t('successTitle'), t('assignmentCreated'));
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

  const getStatusLabel = (status?: string) => {
    switch ((status ?? '').toLowerCase()) {
      case 'scheduled':
        return t('statusScheduled');
      case 'assigned':
        return t('statusAssigned');
      case 'completed':
        return t('statusCompleted');
      case 'cancelled':
        return t('statusCancelled');
      case 'in_progress':
        return t('statusInProgress');
      default:
        return status ?? t('notAvailable');
    }
  };

  const visibleAppointments = useMemo(
    () => appointments,
    [appointments],
  );

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

  const weekDayKeys = useMemo(() => {
    const keys = new Set<string>();
    weekDays.forEach((day) => keys.add(toDateKey(day.date)));
    return keys;
  }, [weekDays]);

  const rosterMap = useMemo(() => {
    const map = new Map<string, DayAppointment[]>();
    appointments.forEach((item) => {
      const scheduledDate = new Date(item.scheduledAt);
      const dayKey = toDateKey(scheduledDate);
      if (!weekDayKeys.has(dayKey)) return;
      const timeLabel = formatTime24(scheduledDate, locale);
      const customerLabel =
        locale === 'en'
          ? item.customer?.nameEn ?? item.customer?.name ?? t('customerFallback')
          : item.customer?.name ?? item.customer?.nameEn ?? t('customerFallback');
      const serviceLabel =
        locale === 'en'
          ? item.service?.nameEn ?? item.service?.name ?? t('serviceFallback')
          : item.service?.name ?? item.service?.nameEn ?? t('serviceFallback');
      const entry: DayAppointment = {
        id: item._id,
        timeLabel,
        customerLabel,
        serviceLabel,
        status: item.status,
      };
      const list = map.get(dayKey) ?? [];
      list.push(entry);
      map.set(dayKey, list);
    });
    return map;
  }, [appointments, locale, t, weekDayKeys]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={visibleAppointments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeAppointmentsTitle')}</ThemedText>
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
                      const dayAppointments = rosterMap.get(dayKey) ?? [];
                      return (
                        <View key={dayKey} style={[styles.rosterCell, styles.shiftCell]}>
                          {dayAppointments.length === 0 ? null : (
                            <View style={styles.shiftStack}>
                              {dayAppointments.map((appointment) => (
                                <Pressable
                                  key={appointment.id}
                                  onPress={() =>
                                    appointment.status === 'scheduled'
                                      ? startAppointment(appointment.id)
                                      : null
                                  }
                                  style={styles.shiftPill}
                                >
                                  <ThemedText style={styles.shiftTime}>
                                    {appointment.timeLabel}
                                  </ThemedText>
                                  <ThemedText style={styles.shiftMeta} numberOfLines={1}>
                                    {appointment.customerLabel}
                                  </ThemedText>
                                  <ThemedText style={styles.shiftMeta} numberOfLines={1}>
                                    {appointment.serviceLabel}
                                  </ThemedText>
                                </Pressable>
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
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeaderRow}>
              <View style={styles.titleBlock}>
                <ThemedText type="defaultSemiBold" numberOfLines={2}>
                  {(locale === 'en' && item.customer?.nameEn ? item.customer.nameEn : item.customer?.name ?? t('customerFallback'))}{' '}
                  - {(locale === 'en' && item.service?.nameEn ? item.service.nameEn : item.service?.name ?? t('serviceFallback'))}
                </ThemedText>
              </View>
              <View style={styles.actionsRow}>
                {item.status === 'scheduled' && (
                  <ActionButton
                    label={t('startWork')}
                    color={Palette.accentBlue}
                    onPress={() => startAppointment(item._id)}
                  />
                )}
              </View>
            </View>
            <View style={styles.infoRow}>
              <InfoPill
                label={t('fee')}
                value={formatMoney(item.service?.price ?? 0)}
                color={Palette.accentPurple}
              />
              <InfoPill
                label={t('time')}
                value={new Date(item.scheduledAt).toLocaleString()}
                color={Palette.accentTeal}
              />
            </View>
            <ThemedText>
              {t('employee')}: {item.assignedEmployee?.displayName ?? item.assignedEmployee?.username ?? t('notAvailable')}
            </ThemedText>
            <ThemedText>{t('status')}: {getStatusLabel(item.status)}</ThemedText>
          </Card>
        )}
        ListEmptyComponent={<ThemedText style={styles.empty}>{t('noData')}</ThemedText>}
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
    backgroundColor: `${Palette.accentPurple}1f`,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  shiftTime: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.navy,
  },
  shiftMeta: {
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
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
    marginBottom: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fffafc',
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
  empty: {
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: 24,
  },
});
