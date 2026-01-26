import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">{t('employeePayrolls')}</ThemedText>
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <FlatList
          data={payrolls}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
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
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('serviceSales')}</ThemedText>
                  <ThemedText>{formatMoney(item.serviceSales)}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('supplyFee')}</ThemedText>
                  <ThemedText>{formatMoney(item.supplyFee)}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('netServiceSales')}</ThemedText>
                  <ThemedText>{formatMoney(item.netServiceSales)}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('serviceCommission')}</ThemedText>
                  <ThemedText>{formatMoney(item.serviceCommission)}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('tip')}</ThemedText>
                  <ThemedText>{formatMoney(item.tip)}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('productSales')}</ThemedText>
                  <ThemedText>{formatMoney(item.productSales)}</ThemedText>
                </View>
                <View style={styles.row}>
                  <ThemedText style={styles.rowLabel}>{t('workingHours')}</ThemedText>
                  <ThemedText>{item.workingHours}</ThemedText>
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
        />
        {payrolls.length === 0 && !error && (
          <ThemedText style={styles.emptyText}>{t('noData')}</ThemedText>
        )}
      </ScrollView>
    </ThemedView>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: Palette.mutedText,
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
