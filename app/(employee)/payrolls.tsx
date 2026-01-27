import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Palette } from '@/constants/theme';

type Payroll = {
  _id: string;
  periodStart: string;
  periodEnd: string;
  serviceSales: number;
  supplyFee: number;
  netServiceSales: number;
  serviceCommission: number;
  tip: number;
  productSales: number;
  workingHours: number;
};

export default function EmployeePayrollsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Payroll[]>('/payrolls/mine', token);
        setPayrolls(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [token]);

  const formatMoney = useMemo(() => {
    return (value: number) => {
      if (locale === 'en') {
        const dollars = value / 27000;
        return `$${dollars.toFixed(2)}`;
      }
      return new Intl.NumberFormat('vi-VN').format(value);
    };
  }, [locale]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={payrolls}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeePayrolls')}</ThemedText>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => {
          const totalSalary = item.serviceCommission + item.tip + item.productSales;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold">{t('period')}</ThemedText>
                <ThemedText style={styles.periodText}>
                  {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                </ThemedText>
              </View>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionBadge} />
                <ThemedText type="defaultSemiBold">{t('earnings')}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <InfoPill label={t('serviceSales')} value={formatMoney(item.serviceSales)} color={Palette.accentBlue} />
                <InfoPill label={t('supplyFee')} value={formatMoney(item.supplyFee)} color={Palette.accentOrange} />
                <InfoPill label={t('netServiceSales')} value={formatMoney(item.netServiceSales)} color={Palette.accentTeal} />
                <InfoPill label={t('serviceCommission')} value={formatMoney(item.serviceCommission)} color={Palette.accentGreen} />
                <InfoPill label={t('tip')} value={formatMoney(item.tip)} color={Palette.accentPink} />
                <InfoPill label={t('productSales')} value={formatMoney(item.productSales)} color={Palette.accentPurple} />
                <InfoPill label={t('workingHours')} value={String(item.workingHours)} color={Palette.accentBlue} />
              </View>
              <View style={styles.totalBlock}>
                <ThemedText type="subtitle">{t('totalSalary')}</ThemedText>
                <ThemedText style={styles.totalValue}>
                  {formatMoney(totalSalary)}
                </ThemedText>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          payrolls.length === 0 && !error ? (
            <ThemedText style={styles.emptyText}>{t('noData')}</ThemedText>
          ) : null
        }
        contentContainerStyle={styles.scrollContent}
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
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 12,
  },
  error: {
    color: '#c00',
  },
  card: {
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  periodText: {
    color: Palette.mutedText,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  sectionBadge: {
    width: 6,
    height: 18,
    borderRadius: 999,
    backgroundColor: Palette.accentBlue,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  totalBlock: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingTop: 10,
    marginTop: 6,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.navy,
    marginTop: 4,
  },
  emptyText: {
    color: Palette.mutedText,
  },
});
