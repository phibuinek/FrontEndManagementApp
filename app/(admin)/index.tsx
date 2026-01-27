import { router } from 'expo-router';
import React, { useMemo, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { apiGet } from '@/lib/api';
import { Palette } from '@/constants/theme';

export default function AdminHome() {
  const { user, logout, token } = useAuth();
  const { t, locale } = useI18n();
  const [stats, setStats] = useState({
    customers: 0,
    services: 0,
    appointments: 0,
    assignments: 0,
  });
  const [income, setIncome] = useState({
    ownerTotal: 0,
    employeeTotal: 0,
    byEmployee: [] as { id: string; name: string; total: number }[],
  });
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [customers, services, appointments, assignments, commissions] = await Promise.all([
          apiGet<any[]>('/customers', token),
          apiGet<any[]>('/services', token),
          apiGet<any[]>('/appointments', token),
          apiGet<any[]>('/assignments', token),
          apiGet<any[]>('/commissions', token),
        ]);
        setStats({
          customers: customers.length,
          services: services.length,
          appointments: appointments.length,
          assignments: assignments.length,
        });
        const ownerTotal = commissions.reduce(
          (sum, item) => sum + (item.ownerAmount ?? 0),
          0,
        );
        const employeeTotal = commissions.reduce(
          (sum, item) => sum + (item.employeeAmount ?? 0),
          0,
        );
        const grouped = new Map<string, { id: string; name: string; total: number }>();
        commissions.forEach((item) => {
          const employee = item.employee;
          const id = employee?._id ?? 'unknown';
          const name =
            employee?.displayName ??
            employee?.username ??
            employee?.name ??
            t('employeeFallback');
          const current = grouped.get(id) ?? { id, name, total: 0 };
          current.total += item.employeeAmount ?? 0;
          grouped.set(id, current);
        });
        setIncome({
          ownerTotal,
          employeeTotal,
          byEmployee: Array.from(grouped.values()).sort((a, b) => b.total - a.total),
        });
      } catch {
        // ignore dashboard errors
      }
    };
    load();
  }, [token, t]);

  const actions = useMemo(
    () => [
      { label: t('manageEmployees'), color: Palette.accentBlue, path: '/(admin)/employees' },
      { label: t('manageCustomers'), color: Palette.accentPurple, path: '/(admin)/customers' },
      { label: t('manageServices'), color: Palette.accentGreen, path: '/(admin)/services' },
      { label: t('appointments'), color: Palette.accentOrange, path: '/(admin)/appointments' },
      { label: t('schedules'), color: Palette.accentTeal, path: '/(admin)/schedules' },
      { label: t('assignments'), color: Palette.accentBlue, path: '/(admin)/assignments' },
      { label: t('commissions'), color: Palette.accentPink, path: '/(admin)/commissions' },
      { label: t('payrolls'), color: Palette.accentGreen, path: '/(admin)/payrolls' },
    ],
    [t],
  );

  const filteredActions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter((item) => item.label.toLowerCase().includes(term));
  }, [actions, searchText]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const maxEmployeeIncome = Math.max(
    1,
    ...income.byEmployee.map((item) => item.total),
  );

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <ThemedText type="title" lightColor="#ffffff">
                {t('hello')}, {user?.displayName ?? user?.username}
              </ThemedText>
              <ThemedText style={styles.heroSubtitle} lightColor="#dbe3f4">
                {t('adminDashboard')}
              </ThemedText>
            </View>
            <LanguageToggle />
          </View>
          <TextInput
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#a9b3c6"
            style={styles.search}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('overview')}</ThemedText>
          <View style={styles.statsGrid}>
            <StatCard label={t('totalCustomers')} value={stats.customers} color={Palette.accentBlue} />
            <StatCard label={t('totalServices')} value={stats.services} color={Palette.accentPurple} />
            <StatCard label={t('totalAppointments')} value={stats.appointments} color={Palette.accentGreen} />
            <StatCard label={t('totalAssignments')} value={stats.assignments} color={Palette.accentOrange} />
          </View>
        </View>
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('totalIncome')}</ThemedText>
          <View style={styles.chartCard}>
            <View style={styles.chartRow}>
              <ThemedText style={styles.chartLabel}>{t('ownerIncome')}</ThemedText>
              <View style={styles.chartTrack}>
                <View
                  style={[
                    styles.chartFill,
                    {
                      width: `${income.ownerTotal + income.employeeTotal === 0 ? 0 : (income.ownerTotal / (income.ownerTotal + income.employeeTotal)) * 100}%`,
                      backgroundColor: Palette.accentBlue,
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.chartValue}>{formatMoney(income.ownerTotal)}</ThemedText>
            </View>
            <View style={styles.chartRow}>
              <ThemedText style={styles.chartLabel}>{t('employeeIncome')}</ThemedText>
              <View style={styles.chartTrack}>
                <View
                  style={[
                    styles.chartFill,
                    {
                      width: `${income.ownerTotal + income.employeeTotal === 0 ? 0 : (income.employeeTotal / (income.ownerTotal + income.employeeTotal)) * 100}%`,
                      backgroundColor: Palette.accentGreen,
                    },
                  ]}
                />
              </View>
              <ThemedText style={styles.chartValue}>{formatMoney(income.employeeTotal)}</ThemedText>
            </View>
          </View>
          <View style={styles.incomeGrid}>
            <IncomeCard
              label={t('ownerIncome')}
              value={formatMoney(income.ownerTotal)}
              color={Palette.accentBlue}
            />
            <IncomeCard
              label={t('employeeIncome')}
              value={formatMoney(income.employeeTotal)}
              color={Palette.accentGreen}
            />
          </View>
          <ThemedText type="defaultSemiBold">{t('incomeByEmployee')}</ThemedText>
          {income.byEmployee.length === 0 ? (
            <ThemedText style={styles.emptyText}>{t('noData')}</ThemedText>
          ) : (
            <View style={styles.incomeList}>
              {income.byEmployee.map((item) => (
                <View key={item.id} style={styles.employeeBarRow}>
                  <View style={styles.employeeBarHeader}>
                    <ThemedText>{item.name}</ThemedText>
                    <ThemedText style={styles.incomeValue}>{formatMoney(item.total)}</ThemedText>
                  </View>
                  <View style={styles.employeeBarTrack}>
                    <View
                      style={[
                        styles.employeeBarFill,
                        { width: `${(item.total / maxEmployeeIncome) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('quickActions')}</ThemedText>
          <View style={styles.actionsGrid}>
            {filteredActions.map((item) => (
              <ActionCard
                key={item.path}
                label={item.label}
                color={item.color}
                onPress={() => router.push(item.path)}
              />
            ))}
          </View>
        </View>
        <ThemedText style={styles.logout} onPress={handleLogout}>
          {t('logout')}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <View style={[styles.statAccent, { backgroundColor: color }]} />
      <View style={styles.statHeader}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      </View>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function IncomeCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <View style={[styles.statAccent, { backgroundColor: color }]} />
      <View style={styles.statHeader}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      </View>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function ActionCard({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionBadge, { backgroundColor: `${color}22` }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 12,
  },
  hero: {
    backgroundColor: Palette.navy,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    marginTop: 4,
  },
  search: {
    borderWidth: 1,
    borderColor: Palette.navyDark,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#203254',
    color: '#fff',
  },
  section: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  incomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartCard: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  chartRow: {
    gap: 6,
  },
  chartLabel: {
    color: Palette.mutedText,
    fontSize: 12,
  },
  chartTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e9edf4',
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 999,
  },
  chartValue: {
    fontWeight: '600',
    color: Palette.navy,
  },
  incomeList: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  employeeBarRow: {
    gap: 8,
  },
  employeeBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#eef2f7',
    overflow: 'hidden',
  },
  employeeBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Palette.accentPurple,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeValue: {
    fontWeight: '600',
    color: Palette.navy,
  },
  emptyText: {
    color: Palette.mutedText,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statAccent: {
    height: 6,
    width: 40,
    borderRadius: 999,
    marginBottom: 8,
  },
  statLabel: {
    color: Palette.mutedText,
    marginTop: 6,
  },
  subtitle: {
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: {
    fontWeight: '600',
  },
  actionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  logout: {
    marginTop: 24,
    color: '#c00',
  },
});
