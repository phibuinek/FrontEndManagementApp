import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { FormInput } from '@/components/ui/form-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SearchSelect } from '@/components/ui/search-select';
import { useI18n } from '@/context/i18n-context';
import { apiPublicGet, apiPublicPost } from '@/lib/api';
import { Palette } from '@/constants/theme';
import { isWithinSalonHoursForAppointment } from '@/constants/salon-hours';

type ServiceItem = {
  _id: string;
  name?: string;
  nameEn?: string;
  price?: number;
};

type EmployeeItem = {
  _id: string;
  displayName?: string;
  username?: string;
};

export default function PublicBookAppointmentScreen() {
  const { t, locale } = useI18n();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString());
  const [note, setNote] = useState('');
  const [resetSeed, setResetSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [serviceData, employeeData] = await Promise.all([
          apiPublicGet<ServiceItem[]>('/services/public'),
          apiPublicGet<EmployeeItem[]>('/users/public/employees'),
        ]);
        setServices(serviceData);
        setEmployees(employeeData);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !selectedServiceId || !scheduledAt) {
      setError(t('errorPublicBookingRequired'));
      return;
    }
    if (new Date(scheduledAt) < new Date()) {
      setError(t('errorAppointmentPast'));
      return;
    }
    if (!isWithinSalonHoursForAppointment(new Date(scheduledAt))) {
      setError(t('errorAppointmentOutsideHours'));
      return;
    }
    setLoading(true);
    try {
      await apiPublicPost('/appointments/public', {
        name: name.trim(),
        phone: phone.trim(),
        serviceId: selectedServiceId,
        assignedEmployeeId: selectedEmployeeId ?? undefined,
        scheduledAt,
        note: note.trim() || undefined,
      });
      Alert.alert(t('successTitle'), t('bookAppointmentSuccess'));
      setName('');
      setPhone('');
      setSelectedServiceId(null);
      setSelectedEmployeeId(null);
      setScheduledAt(new Date().toISOString());
      setNote('');
      setResetSeed((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value?: number) => {
    if (!value && value !== 0) return '';
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <Stack.Screen options={{ title: t('publicBookingTitle') }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <ThemedText style={styles.backText} lightColor="#ffffff">
              {t('back')}
            </ThemedText>
          </Pressable>
        </View>
        <View style={styles.hero}>
          <ThemedText type="title" lightColor="#ffffff">
            {t('publicBookingTitle')}
          </ThemedText>
          <ThemedText style={styles.heroSubtitle} lightColor="#f6effb">
            {t('publicBookingSubtitle')}
          </ThemedText>
        </View>

        <View style={styles.formCard}>
          <FormInput label={t('customerName')} value={name} onChangeText={setName} />
          <FormInput
            label={t('customerPhone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <SearchSelect
            key={`service-${resetSeed}`}
            title={t('selectService')}
            placeholder={t('searchServicesPlaceholder')}
            items={services.map((service) => ({
              id: service._id,
              label: locale === 'en' && service.nameEn ? service.nameEn : service.name ?? '',
              subtitle: service.price ? `${t('price')}: ${formatMoney(service.price)}` : undefined,
            }))}
            selectedId={selectedServiceId}
            onSelect={(item) => setSelectedServiceId(item.id)}
            onClear={() => setSelectedServiceId(null)}
          />
          <SearchSelect
            key={`employee-${resetSeed}`}
            title={`${t('selectEmployee')} (${t('optional')})`}
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
            minimumDate={new Date()}
          />
          <FormInput
            label={t('note')}
            value={note}
            onChangeText={setNote}
            placeholder={t('optional')}
          />
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          <PrimaryButton
            label={loading ? t('saving') : t('bookAppointment')}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Palette.accentPurple,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  backText: {
    fontWeight: '700',
  },
  hero: {
    gap: 6,
    padding: 18,
    borderRadius: 24,
    backgroundColor: Palette.accentPink,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  heroSubtitle: {
    color: '#f6effb',
  },
  formCard: {
    gap: 12,
    backgroundColor: '#fffafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  error: {
    color: '#c00',
  },
});
