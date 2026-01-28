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
import { isWithinSalonHoursForAppointment } from '@/constants/salon-hours';

type Appointment = {
  _id: string;
  customer?: { _id?: string; name: string; nameEn?: string };
  service?: { _id?: string; name: string; nameEn?: string; price?: number; durationMinutes?: number };
  assignedEmployee?: { _id?: string; displayName?: string; username?: string };
  scheduledAt: string;
  status: string;
};

type Customer = { _id: string; name: string; nameEn?: string; phone?: string };
type ServiceItem = { _id: string; name: string; nameEn?: string; price?: number; durationMinutes?: number };
type Employee = { _id: string; displayName?: string; username?: string; role?: string };

type CalendarDay = { date: Date };
type DayAppointment = {
  id: string;
  employeeId: string;
  timeLabel: string;
  customerLabel: string;
  serviceLabel: string;
};

const PERSON_COL_WIDTH = 96;
const DAY_COL_WIDTH = 92;

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

export default function AppointmentsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [calendarWeek, setCalendarWeek] = useState(new Date());
  const [filterEmployeeId, setFilterEmployeeId] = useState<string | null>(null);
  const [filterCustomerId, setFilterCustomerId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [appointmentsData, customersData, servicesData, employeesData] =
        await Promise.all([
          apiGet<Appointment[]>('/appointments', token),
          apiGet<Customer[]>('/customers', token),
          apiGet<ServiceItem[]>('/services', token),
          apiGet<Employee[]>('/users', token),
        ]);
      setAppointments(appointmentsData);
      setCustomers(customersData);
      setServices(servicesData);
      setEmployees(employeesData.filter((item) => item.role !== 'admin'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleCreate = async () => {
    if (!selectedCustomerId || !selectedServiceId || !scheduledAt) {
      setError(t('errorAppointmentRequired'));
      return;
    }
    if (editingId) {
      const existing = appointments.find((item) => item._id === editingId);
      if (existing?.status === 'completed') {
        setError(t('errorAppointmentCompleted'));
        return;
      }
    }
    if (!editingId && new Date(scheduledAt) < new Date()) {
      setError(t('errorAppointmentPast'));
      return;
    }
    if (!isWithinSalonHoursForAppointment(new Date(scheduledAt))) {
      setError(t('errorAppointmentOutsideHours'));
      return;
    }
    const serviceDuration =
      services.find((item) => item._id === selectedServiceId)?.durationMinutes ?? 60;
    const targetStart = new Date(scheduledAt);
    const targetEnd = new Date(
      targetStart.getTime() + Math.max(serviceDuration, 1) * 60 * 1000,
    );
    if (selectedEmployeeId) {
      const conflict = appointments.some((item) => {
        if (editingId && item._id === editingId) return false;
        if (item.assignedEmployee?._id !== selectedEmployeeId) return false;
        if (item.status === 'completed' || item.status === 'cancelled') return false;
        const duration =
          item.service?.durationMinutes && item.service.durationMinutes > 0
            ? item.service.durationMinutes
            : 60;
        const startValue = new Date(item.scheduledAt);
        const endValue = new Date(startValue.getTime() + duration * 60 * 1000);
        return startValue < targetEnd && endValue > targetStart;
      });
      if (conflict) {
        setError(t('errorScheduleConflict'));
        return;
      }
    }
    const isEditing = Boolean(editingId);
    setError(null);
    setLoading(true);
    try {
      if (editingId) {
        await apiPatch(
          `/appointments/${editingId}`,
          {
            customerId: selectedCustomerId,
            serviceId: selectedServiceId,
            assignedEmployeeId: selectedEmployeeId ?? undefined,
            scheduledAt,
          },
          token,
        );
      } else {
        await apiPost(
          '/appointments',
          {
            customerId: selectedCustomerId,
            serviceId: selectedServiceId,
            assignedEmployeeId: selectedEmployeeId ?? undefined,
            scheduledAt,
          },
          token,
        );
      }
      setSelectedCustomerId(null);
      setSelectedServiceId(null);
      setSelectedEmployeeId(null);
      setScheduledAt(new Date().toISOString());
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
      await apiDelete(`/appointments/${id}`, token);
      await load();
      Alert.alert(t('successTitle'), t('deleteSuccess'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (item: Appointment) => {
    setShowCreate(true);
    setEditingId(item._id);
    setSelectedCustomerId(item.customer?._id ?? null);
    setSelectedServiceId(item.service?._id ?? null);
    setSelectedEmployeeId(item.assignedEmployee?._id ?? null);
    setScheduledAt(item.scheduledAt);
  };


  const filteredAppointments = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return appointments.filter((item) => {
      const customerName = (item.customer?.name ?? '').toLowerCase();
      const customerNameEn = (item.customer?.nameEn ?? '').toLowerCase();
      const serviceName = (item.service?.name ?? '').toLowerCase();
      const serviceNameEn = (item.service?.nameEn ?? '').toLowerCase();
      const employeeName = (item.assignedEmployee?.displayName ?? item.assignedEmployee?.username ?? '').toLowerCase();
      const statusValue = (item.status ?? '').toLowerCase();
      if (filterEmployeeId && item.assignedEmployee?._id !== filterEmployeeId) {
        return false;
      }
      if (filterCustomerId && item.customer?._id !== filterCustomerId) {
        return false;
      }
      if (!term) return true;
      return (
        customerName.includes(term) ||
        customerNameEn.includes(term) ||
        serviceName.includes(term) ||
        serviceNameEn.includes(term) ||
        employeeName.includes(term) ||
        statusValue.includes(term)
      );
    });
  }, [appointments, filterCustomerId, filterEmployeeId, searchText]);

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
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

  const rosterRows = useMemo(() => {
    const list = filterEmployeeId
      ? employees.filter((item) => item._id === filterEmployeeId)
      : employees;
    if (list.length) return list;
    const map = new Map<string, Employee>();
    filteredAppointments.forEach((item) => {
      if (!item.assignedEmployee?._id) return;
      map.set(item.assignedEmployee._id, item.assignedEmployee);
    });
    return Array.from(map.values());
  }, [employees, filterEmployeeId, filteredAppointments]);

  const weekDayKeys = useMemo(() => {
    const keys = new Set<string>();
    weekDays.forEach((day) => keys.add(toDateKey(day.date)));
    return keys;
  }, [weekDays]);

  const rosterMap = useMemo(() => {
    const map = new Map<string, DayAppointment[]>();
    filteredAppointments.forEach((item) => {
      const scheduledDate = new Date(item.scheduledAt);
      const dayKey = toDateKey(scheduledDate);
      if (!weekDayKeys.has(dayKey)) return;
      const employeeId = item.assignedEmployee?._id ?? 'unassigned';
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
        employeeId,
        timeLabel,
        customerLabel,
        serviceLabel,
      };
      const key = `${employeeId}-${dayKey}`;
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    });
    return map;
  }, [filteredAppointments, locale, t, weekDayKeys]);

  const handleAppointmentAction = (appointmentId: string) => {
    const appointment = appointments.find((item) => item._id === appointmentId);
    if (!appointment) return;
    if (appointment.status === 'completed') {
      Alert.alert(t('appointmentsTitle'), t('errorAppointmentCompleted'), [
        { text: t('close'), style: 'cancel' },
      ]);
      return;
    }
    Alert.alert(
      t('appointmentsTitle'),
      `${appointment.customer?.name ?? t('customerFallback')} - ${appointment.service?.name ?? t('serviceFallback')}`,
      [
        { text: t('edit'), onPress: () => handleEdit(appointment) },
        { text: t('delete'), style: 'destructive', onPress: () => handleDelete(appointment._id) },
        { text: t('close'), style: 'cancel' },
      ],
    );
  };

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={[]}
        keyExtractor={() => 'appointments'}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('appointmentsTitle')}</ThemedText>
            <FormInput
              label={t('searchAppointmentsLabel')}
              placeholder={t('searchAppointmentsPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <ThemedText type="defaultSemiBold">{t('appointmentsTitle')}</ThemedText>
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
                        const dayAppointments = rosterMap.get(cellKey) ?? [];
                        return (
                          <View key={cellKey} style={[styles.rosterCell, styles.shiftCell]}>
                            {dayAppointments.length === 0 ? null : (
                              <View style={styles.shiftStack}>
                                {dayAppointments.map((appointment) => (
                                  <Pressable
                                    key={appointment.id}
                                    onPress={() => handleAppointmentAction(appointment.id)}
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
                  ))}
                </View>
              </ScrollView>
            </View>
            {showCreate && (
              <Section title={editingId ? t('editAppointment') : t('createAppointment')}>
                <SearchSelect
                  title={t('selectCustomer')}
                  placeholder={t('searchCustomersPlaceholder')}
                  items={customers.map((customer) => ({
                    id: customer._id,
                    label: locale === 'en' && customer.nameEn ? customer.nameEn : customer.name,
                    subtitle: customer.phone ? `${t('phone')}: ${customer.phone}` : undefined,
                  }))}
                  selectedId={selectedCustomerId}
                  onSelect={(item) => setSelectedCustomerId(item.id)}
                  onClear={() => setSelectedCustomerId(null)}
                />
                <SearchSelect
                  title={t('selectService')}
                  placeholder={t('searchServicesPlaceholder')}
                  items={services.map((service) => ({
                    id: service._id,
                    label: locale === 'en' && service.nameEn ? service.nameEn : service.name,
                    subtitle: service.price ? `${t('price')}: ${formatMoney(service.price)}` : undefined,
                  }))}
                  selectedId={selectedServiceId}
                  onSelect={(item) => setSelectedServiceId(item.id)}
                  onClear={() => setSelectedServiceId(null)}
                />
                <SearchSelect
                  title={t('assignEmployeeOptional')}
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
                  label={t('time')}
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  minimumDate={editingId ? undefined : new Date()}
                />
                <PrimaryButton
                  label={loading ? t('saving') : editingId ? t('updateAppointment') : t('createAppointment')}
                  onPress={handleCreate}
                />
              </Section>
            )}
            <PrimaryButton
              label={showCreate ? t('close') : t('createAppointment')}
              onPress={() => {
                setShowCreate((prev) => !prev);
                if (showCreate) {
                  setEditingId(null);
                  setSelectedCustomerId(null);
                  setSelectedServiceId(null);
                  setSelectedEmployeeId(null);
                  setScheduledAt(new Date().toISOString());
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
  error: {
    color: '#c00',
  },
});
