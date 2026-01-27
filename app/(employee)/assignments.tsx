import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet, apiPatch } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Palette } from '@/constants/theme';

type Assignment = {
  _id: string;
  customer?: { name: string; nameEn?: string };
  service?: { name: string; nameEn?: string };
  price: number;
  status: string;
  scheduledAt: string;
  checkInAt?: string;
  completedAt?: string;
};

export default function EmployeeAssignmentsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiGet<Assignment[]>('/assignments/mine', token);
      setAssignments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const checkIn = async (id: string) => {
    try {
      await apiPatch(`/assignments/${id}/check-in`, {}, token);
      await load();
      Alert.alert(t('successTitle'), t('checkInSuccess'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const complete = async (id: string) => {
    try {
      await apiPatch(`/assignments/${id}/complete`, {}, token);
      await load();
      Alert.alert(t('successTitle'), t('completeSuccess'));
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

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeAssignmentsTitle')}</ThemedText>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => {
          const statusLabel =
            item.status === 'completed'
              ? 'Completed'
              : item.status === 'in_progress'
              ? 'In Progress'
              : 'Scheduled';
          const statusColor =
            item.status === 'completed'
              ? Palette.accentGreen
              : item.status === 'in_progress'
              ? Palette.accentOrange
              : Palette.accentBlue;
          return (
            <Card>
              <View style={styles.cardHeaderRow}>
                <View style={styles.titleBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.titleText}>
                    {(locale === 'en' && item.customer?.nameEn ? item.customer.nameEn : item.customer?.name ?? t('customerFallback'))}{' '}
                    - {(locale === 'en' && item.service?.nameEn ? item.service.nameEn : item.service?.name ?? t('serviceFallback'))}
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
                  {item.checkInAt && !item.completedAt && (
                    <ActionButton
                      label={t('complete')}
                      color={Palette.accentGreen}
                      onPress={() => complete(item._id)}
                    />
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <InfoPill label={t('fee')} value={formatMoney(item.price)} color={Palette.accentPurple} />
                <InfoPill
                  label={t('schedule')}
                  value={new Date(item.scheduledAt).toLocaleString()}
                  color={Palette.accentTeal}
                />
              </View>
              {item.checkInAt && (
                <InfoPill
                  label={t('checkIn')}
                  value={new Date(item.checkInAt).toLocaleString()}
                  color={Palette.accentOrange}
                />
              )}
              {item.completedAt && (
                <InfoPill
                  label={t('complete')}
                  value={new Date(item.completedAt).toLocaleString()}
                  color={Palette.accentGreen}
                />
              )}
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
