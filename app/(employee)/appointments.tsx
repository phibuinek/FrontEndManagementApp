import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
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

export default function EmployeeAppointmentsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const visibleAppointments = useMemo(
    () => appointments,
    [appointments],
  );

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={visibleAppointments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeAppointmentsTitle')}</ThemedText>
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
              {t('employee')}: {item.assignedEmployee?.displayName ?? item.assignedEmployee?.username ?? '-'}
            </ThemedText>
            <ThemedText>{t('status')}: {item.status}</ThemedText>
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
    marginBottom: 8,
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
  empty: {
    color: Palette.mutedText,
    textAlign: 'center',
    marginTop: 24,
  },
});
