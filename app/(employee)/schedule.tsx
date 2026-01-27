import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
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
