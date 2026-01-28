import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { DateTimeInput } from '@/components/ui/date-time-input';
import { Palette } from '@/constants/theme';

type Commission = {
  _id: string;
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

export default function EmployeeCommissionsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Commission[]>('/commissions/mine', token);
        setCommissions(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [token]);

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

  const filteredCommissions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const fromValue = fromDate ? new Date(fromDate).getTime() : null;
    const toValue = toDate ? new Date(toDate).getTime() : null;
    return commissions.filter((item) => {
      const serviceName =
        locale === 'en'
          ? item.assignment?.service?.nameEn ?? item.assignment?.service?.name
          : item.assignment?.service?.name ?? item.assignment?.service?.nameEn;
      const customerName =
        locale === 'en'
          ? item.assignment?.customer?.nameEn ?? item.assignment?.customer?.name
          : item.assignment?.customer?.name ?? item.assignment?.customer?.nameEn;
      const timeValue = item.assignment?.completedAt ?? item.assignment?.scheduledAt;
      const timeStamp = timeValue ? new Date(timeValue).getTime() : null;
      if (term) {
        const nameText = `${serviceName ?? ''} ${customerName ?? ''}`.toLowerCase();
        if (!nameText.includes(term)) return false;
      }
      if (fromValue && timeStamp !== null && timeStamp < fromValue) return false;
      if (toValue && timeStamp !== null && timeStamp > toValue) return false;
      if ((fromValue || toValue) && timeStamp === null) return false;
      return true;
    });
  }, [commissions, fromDate, locale, searchText, toDate]);

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={filteredCommissions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeeCommissionsTitle')}</ThemedText>
            <FormInput
              label={t('searchCommissionsLabel')}
              placeholder={t('searchCommissionsPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            <View style={styles.filterRow}>
              <DateTimeInput label={t('periodStart')} value={fromDate} onChange={setFromDate} />
              <DateTimeInput label={t('periodEnd')} value={toDate} onChange={setToDate} />
            </View>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => {
          const serviceName =
            locale === 'en'
              ? item.assignment?.service?.nameEn ?? item.assignment?.service?.name
              : item.assignment?.service?.name ?? item.assignment?.service?.nameEn;
          const customerName =
            locale === 'en'
              ? item.assignment?.customer?.nameEn ?? item.assignment?.customer?.name
              : item.assignment?.customer?.name ?? item.assignment?.customer?.nameEn;
          const timeValue = item.assignment?.completedAt ?? item.assignment?.scheduledAt;
          const serviceTotal = item.employeeAmount + item.ownerAmount;
          return (
            <Card>
              <View style={styles.cardHeader}>
                <View style={styles.titleBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.titleText}>
                    {serviceName ?? t('serviceFallback')}
                  </ThemedText>
                  <ThemedText style={styles.subtitleText}>
                    {customerName ?? t('customerFallback')}
                  </ThemedText>
                </View>
                <View style={styles.amountBadge}>
                  <ThemedText style={styles.amountText}>
                    {formatMoney(item.employeeAmount)}
                  </ThemedText>
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
                  value={formatMoney(serviceTotal)}
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
  filterRow: {
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
    color: Palette.mutedText,
    marginTop: 4,
  },
  amountBadge: {
    backgroundColor: `${Palette.accentGreen}22`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  amountText: {
    color: Palette.accentGreen,
    fontWeight: '700',
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
  emptyText: {
    color: Palette.mutedText,
  },
});
