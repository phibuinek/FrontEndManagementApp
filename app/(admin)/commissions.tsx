import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { Palette } from '@/constants/theme';

type Commission = {
  _id: string;
  employee?: { displayName?: string; username?: string };
  ownerPercent: number;
  employeePercent: number;
  ownerAmount: number;
  employeeAmount: number;
  assignment?: {
    scheduledAt?: string;
    completedAt?: string;
    service?: { name?: string; nameEn?: string };
    customer?: { name?: string; nameEn?: string };
  };
};

export default function CommissionsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Commission[]>('/commissions', token);
        setCommissions(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [token]);

  const filteredCommissions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return commissions;
    return commissions.filter((item) => {
      const employeeName = (item.employee?.displayName ?? item.employee?.username ?? '').toLowerCase();
      return employeeName.includes(term);
    });
  }, [commissions, searchText]);

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US');
  };

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={filteredCommissions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('commissionsTitle')}</ThemedText>
            <FormInput
              label={t('searchCommissionsLabel')}
              placeholder={t('searchCommissionsPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => {
          const totalAmount = item.ownerAmount + item.employeeAmount;
          const serviceName =
            locale === 'en'
              ? item.assignment?.service?.nameEn ?? item.assignment?.service?.name
              : item.assignment?.service?.name ?? item.assignment?.service?.nameEn;
          const customerName =
            locale === 'en'
              ? item.assignment?.customer?.nameEn ?? item.assignment?.customer?.name
              : item.assignment?.customer?.name ?? item.assignment?.customer?.nameEn;
          const timeValue = item.assignment?.completedAt ?? item.assignment?.scheduledAt;
          return (
            <Card>
              <View style={styles.cardHeader}>
                <View style={styles.titleBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.titleText}>
                    {item.employee?.displayName ?? item.employee?.username ?? t('employeeFallback')}
                  </ThemedText>
                  <ThemedText style={styles.subtitleText}>
                    {serviceName ?? t('serviceFallback')} · {customerName ?? t('customerFallback')}
                  </ThemedText>
                </View>
                <View style={styles.amountBadge}>
                  <ThemedText style={styles.amountText}>{formatMoney(totalAmount)}</ThemedText>
                </View>
              </View>
              <View style={styles.infoRow}>
                <InfoPill
                  label={t('time')}
                  value={formatDateTime(timeValue)}
                  color={Palette.accentTeal}
                />
                <InfoPill
                  label={t('serviceTotal')}
                  value={formatMoney(totalAmount)}
                  color={Palette.accentPurple}
                />
                <InfoPill
                  label={`${t('employee')} (${item.employeePercent}%)`}
                  value={formatMoney(item.employeeAmount)}
                  color={Palette.accentGreen}
                />
                <InfoPill
                  label={`${t('owner')} (${item.ownerPercent}%)`}
                  value={formatMoney(item.ownerAmount)}
                  color={Palette.accentBlue}
                />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          filteredCommissions.length === 0 && !error ? (
            <ThemedText style={styles.emptyText}>{t('noData')}</ThemedText>
          ) : null
        }
        contentContainerStyle={styles.content}
      />
    </ThemedView>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    flexShrink: 1,
  },
  subtitleText: {
    fontSize: 12,
    color: Palette.mutedText,
    marginTop: 2,
  },
  amountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${Palette.accentGreen}1f`,
  },
  amountText: {
    fontWeight: '700',
    color: Palette.navy,
  },
  infoRow: {
    marginTop: 8,
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: '#fffafc',
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: Palette.mutedText,
  },
  infoValue: {
    fontWeight: '600',
    color: Palette.navy,
  },
  emptyText: {
    textAlign: 'center',
    color: Palette.mutedText,
  },
  error: {
    color: '#c00',
  },
});
