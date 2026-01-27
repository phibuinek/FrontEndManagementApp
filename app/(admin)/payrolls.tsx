import React, { useEffect, useMemo, useState } from 'react';
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

type Payroll = {
  _id: string;
  employee?: { _id?: string; displayName?: string; username?: string };
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

type Employee = { _id: string; displayName?: string; username?: string; role?: string };

type Commission = {
  employee?: { _id?: string };
  employeeAmount: number;
  assignment?: { completedAt?: string; scheduledAt?: string };
};

const parseNumber = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function PayrollsScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState(new Date().toISOString());
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString());
  const [serviceSales, setServiceSales] = useState('');
  const [supplyFee, setSupplyFee] = useState('');
  const [netServiceSales, setNetServiceSales] = useState('');
  const [serviceCommission, setServiceCommission] = useState('');
  const [tip, setTip] = useState('');
  const [productSales, setProductSales] = useState('');
  const [workingHours, setWorkingHours] = useState('');

  const load = async () => {
    try {
      const [payrollData, employeeData] = await Promise.all([
        apiGet<Payroll[]>('/payrolls', token),
        apiGet<Employee[]>('/users', token),
      ]);
      setPayrolls(payrollData);
      setEmployees(employeeData.filter((item) => item.role === 'employee'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    const autoFillCommission = async () => {
      if (!selectedEmployeeId || !periodStart || !periodEnd) {
        return;
      }
      const start = new Date(periodStart).getTime();
      const end = new Date(periodEnd).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return;
      }
      try {
        const commissions = await apiGet<Commission[]>('/commissions', token);
        const total = commissions.reduce((sum, item) => {
          if (item.employee?._id !== selectedEmployeeId) return sum;
          const timeValue = item.assignment?.completedAt ?? item.assignment?.scheduledAt;
          if (!timeValue) return sum;
          const timeStamp = new Date(timeValue).getTime();
          if (Number.isNaN(timeStamp)) return sum;
          if (timeStamp < start || timeStamp > end) return sum;
          return sum + (item.employeeAmount ?? 0);
        }, 0);
        setServiceCommission(String(Math.round(total)));
      } catch {
        // Ignore auto-calc failures and allow manual entry
      }
    };
    autoFillCommission();
  }, [periodEnd, periodStart, selectedEmployeeId, token]);

  const handleCreate = async () => {
    if (!selectedEmployeeId) {
      setError(t('errorEmployeeRequired'));
      return;
    }
    if (!periodStart || !periodEnd) {
      setError(t('errorPayrollPeriod'));
      return;
    }
    const isEditing = Boolean(editingId);
    setError(null);
    setLoading(true);
    try {
      if (editingId) {
        await apiPatch(
          `/payrolls/${editingId}`,
          {
            employeeId: selectedEmployeeId,
            periodStart,
            periodEnd,
            serviceSales: parseNumber(serviceSales),
            supplyFee: parseNumber(supplyFee),
            netServiceSales: parseNumber(netServiceSales),
            serviceCommission: parseNumber(serviceCommission),
            tip: parseNumber(tip),
            productSales: parseNumber(productSales),
            workingHours: parseNumber(workingHours),
          },
          token,
        );
      } else {
        await apiPost(
          '/payrolls',
          {
            employeeId: selectedEmployeeId,
            periodStart,
            periodEnd,
            serviceSales: parseNumber(serviceSales),
            supplyFee: parseNumber(supplyFee),
            netServiceSales: parseNumber(netServiceSales),
            serviceCommission: parseNumber(serviceCommission),
            tip: parseNumber(tip),
            productSales: parseNumber(productSales),
            workingHours: parseNumber(workingHours),
          },
          token,
        );
      }
      setSelectedEmployeeId(null);
      setPeriodStart(new Date().toISOString());
      setPeriodEnd(new Date().toISOString());
      setServiceSales('');
      setSupplyFee('');
      setNetServiceSales('');
      setServiceCommission('');
      setTip('');
      setProductSales('');
      setWorkingHours('');
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
      await apiDelete(`/payrolls/${id}`, token);
      await load();
      Alert.alert(t('successTitle'), t('deleteSuccess'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (item: Payroll) => {
    setShowCreate(true);
    setEditingId(item._id);
    setSelectedEmployeeId(item.employee?._id ?? null);
    setPeriodStart(item.periodStart);
    setPeriodEnd(item.periodEnd);
    setServiceSales(String(item.serviceSales ?? ''));
    setSupplyFee(String(item.supplyFee ?? ''));
    setNetServiceSales(String(item.netServiceSales ?? ''));
    setServiceCommission(String(item.serviceCommission ?? ''));
    setTip(String(item.tip ?? ''));
    setProductSales(String(item.productSales ?? ''));
    setWorkingHours(String(item.workingHours ?? ''));
  };

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredPayrolls = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return payrolls;
    return payrolls.filter((item) => {
      const employeeName = (item.employee?.displayName ?? item.employee?.username ?? '').toLowerCase();
      return employeeName.includes(term);
    });
  }, [payrolls, searchText]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={filteredPayrolls}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('payrolls')}</ThemedText>
            <FormInput
              label={t('searchPayrollsLabel')}
              placeholder={t('searchPayrollsPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {showCreate && (
              <Section title={editingId ? t('editPayroll') : t('createPayroll')}>
                <SearchSelect
                  title={t('selectEmployee')}
                  placeholder={t('searchPlaceholder')}
                  items={employees.map((employee) => ({
                    id: employee._id,
                    label: employee.displayName ?? employee.username ?? t('employeeFallback'),
                  }))}
                  selectedId={selectedEmployeeId}
                  onSelect={(item) => setSelectedEmployeeId(item.id)}
                />
                <DateTimeInput label={t('periodStart')} value={periodStart} onChange={setPeriodStart} />
                <DateTimeInput label={t('periodEnd')} value={periodEnd} onChange={setPeriodEnd} />
                <FormInput label={t('serviceSales')} value={serviceSales} onChangeText={setServiceSales} keyboardType="numeric" />
                <FormInput label={t('supplyFee')} value={supplyFee} onChangeText={setSupplyFee} keyboardType="numeric" />
                <FormInput label={t('netServiceSales')} value={netServiceSales} onChangeText={setNetServiceSales} keyboardType="numeric" />
                <FormInput label={t('serviceCommission')} value={serviceCommission} onChangeText={setServiceCommission} keyboardType="numeric" />
                <FormInput label={t('tip')} value={tip} onChangeText={setTip} keyboardType="numeric" />
                <FormInput label={t('productSales')} value={productSales} onChangeText={setProductSales} keyboardType="numeric" />
                <FormInput label={t('workingHours')} value={workingHours} onChangeText={setWorkingHours} keyboardType="numeric" />
                <PrimaryButton
                  label={loading ? t('saving') : editingId ? t('updatePayroll') : t('createPayroll')}
                  onPress={handleCreate}
                />
              </Section>
            )}
            <PrimaryButton
              label={showCreate ? t('close') : t('createPayroll')}
              onPress={() => {
                setShowCreate((prev) => !prev);
                if (showCreate) {
                  setEditingId(null);
                  setSelectedEmployeeId(null);
                  setPeriodStart(new Date().toISOString());
                  setPeriodEnd(new Date().toISOString());
                  setServiceSales('');
                  setSupplyFee('');
                  setNetServiceSales('');
                  setServiceCommission('');
                  setTip('');
                  setProductSales('');
                  setWorkingHours('');
                }
              }}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge} />
                <View>
                  <ThemedText type="defaultSemiBold">
                    {item.employee?.displayName ?? item.employee?.username ?? t('employeeFallback')}
                  </ThemedText>
                  <ThemedText style={styles.mutedText}>
                    {new Date(item.periodStart).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')} -{' '}
                    {new Date(item.periodEnd).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                  </ThemedText>
                </View>
              </View>
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
  error: {
    color: '#c00',
  },
  mutedText: {
    color: Palette.mutedText,
    fontSize: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardBadge: {
    width: 8,
    height: 40,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
