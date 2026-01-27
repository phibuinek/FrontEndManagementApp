import React, { useMemo, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
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

type Appointment = {
  _id: string;
  customer?: { _id?: string; name: string; nameEn?: string };
  service?: { _id?: string; name: string; nameEn?: string; price?: number };
  assignedEmployee?: { _id?: string; displayName?: string; username?: string };
  scheduledAt: string;
  status: string;
};

type Customer = { _id: string; name: string; nameEn?: string; phone?: string };
type ServiceItem = { _id: string; name: string; nameEn?: string; price?: number };
type Employee = { _id: string; displayName?: string; username?: string };

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
      setEmployees(employeesData);
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
    if (!term) return appointments;
    return appointments.filter((item) => {
      const customerName = (item.customer?.name ?? '').toLowerCase();
      const customerNameEn = (item.customer?.nameEn ?? '').toLowerCase();
      const serviceName = (item.service?.name ?? '').toLowerCase();
      const serviceNameEn = (item.service?.nameEn ?? '').toLowerCase();
      const employeeName = (item.assignedEmployee?.displayName ?? item.assignedEmployee?.username ?? '').toLowerCase();
      const statusValue = (item.status ?? '').toLowerCase();
      return (
        customerName.includes(term) ||
        customerNameEn.includes(term) ||
        serviceName.includes(term) ||
        serviceNameEn.includes(term) ||
        employeeName.includes(term) ||
        statusValue.includes(term)
      );
    });
  }, [appointments, searchText]);

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
        data={filteredAppointments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('appointmentsTitle')}</ThemedText>
            <FormInput
              label={t('searchAppointmentsLabel')}
              placeholder={t('searchAppointmentsPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
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
                />
                <DateTimeInput label={t('time')} value={scheduledAt} onChange={setScheduledAt} />
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
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeaderRow}>
              <ThemedText type="defaultSemiBold">
                {(locale === 'en' && item.customer?.nameEn ? item.customer.nameEn : item.customer?.name ?? t('customerFallback'))}{' '}
                - {(locale === 'en' && item.service?.nameEn ? item.service.nameEn : item.service?.name ?? t('serviceFallback'))}
              </ThemedText>
              <View style={styles.actionsRow}>
                <IconButton
                  icon="create-outline"
                  variant="primary"
                  onPress={() => handleEdit(item)}
                />
                <IconButton
                  icon="trash-outline"
                  variant="danger"
                  onPress={() => handleDelete(item._id)}
                />
              </View>
            </View>
            <ThemedText>{t('employee')}: {item.assignedEmployee?.displayName ?? item.assignedEmployee?.username ?? '-'}</ThemedText>
            <ThemedText>{t('time')}: {new Date(item.scheduledAt).toLocaleString()}</ThemedText>
            <ThemedText>{t('status')}: {item.status}</ThemedText>
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
