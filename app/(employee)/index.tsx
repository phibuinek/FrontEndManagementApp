import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { apiGet } from '@/lib/api';
import { Palette } from '@/constants/theme';

export default function EmployeeHome() {
  const { user, logout, token } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState({
    schedules: 0,
    pendingAssignments: 0,
    commissions: 0,
  });
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [schedules, assignments, commissions] = await Promise.all([
          apiGet<any[]>('/work-schedules/mine', token),
          apiGet<any[]>('/assignments/mine', token),
          apiGet<any[]>('/commissions/mine', token),
        ]);
        const pending = assignments.filter((item) => item.status !== 'completed').length;
        setStats({
          schedules: schedules.length,
          pendingAssignments: pending,
          commissions: commissions.length,
        });
      } catch {
        // ignore dashboard errors
      }
    };
    load();
  }, [token]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(public)');
  };

  const actions = useMemo(
    () => [
      { label: t('employeeSchedule'), color: Palette.accentTeal, path: '/(employee)/schedule' },
      { label: t('employeeAppointments'), color: Palette.accentPurple, path: '/(employee)/appointments' },
      { label: t('employeeAssignments'), color: Palette.accentBlue, path: '/(employee)/assignments' },
      { label: t('employeeCommissions'), color: Palette.accentPink, path: '/(employee)/commissions' },
      { label: t('employeePayrolls'), color: Palette.accentGreen, path: '/(employee)/payrolls' },
      { label: t('changePassword'), color: Palette.accentOrange, path: '/(employee)/change-password' },
    ],
    [t],
  );

  const filteredActions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter((item) => item.label.toLowerCase().includes(term));
  }, [actions, searchText]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <ThemedText type="title" lightColor="#ffffff">
                {t('hello')}, {user?.displayName ?? user?.username}
              </ThemedText>
              <ThemedText style={styles.heroSubtitle} lightColor="#f6effb">
                {t('employeeDashboard')}
              </ThemedText>
            </View>
            <LanguageToggle />
          </View>
          <TextInput
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#9a8fa0"
            style={styles.search}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <View style={styles.section}>
          <ThemedText type="subtitle">{t('overview')}</ThemedText>
          <View style={styles.statsGrid}>
            <StatCard label={t('todaySchedules')} value={stats.schedules} color={Palette.accentBlue} />
            <StatCard label={t('pendingAssignments')} value={stats.pendingAssignments} color={Palette.accentOrange} />
            <StatCard label={t('myCommissions')} value={stats.commissions} color={Palette.accentGreen} />
          </View>
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
    <View style={[styles.statCard, { backgroundColor: `${color}18` }]}>
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
    <Pressable style={[styles.actionCard, { backgroundColor: `${color}14` }]} onPress={onPress}>
      <View style={styles.actionBadge}>
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
    backgroundColor: Palette.accentPurple,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
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
    borderColor: '#f2e6f6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff7fb',
    color: Palette.navy,
  },
  section: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 0,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 0,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  actionLabel: {
    fontWeight: '600',
  },
  actionBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logout: {
    marginTop: 24,
    color: '#c00',
  },
});
