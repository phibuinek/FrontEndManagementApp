import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { PrimaryButton } from '@/components/ui/primary-button';
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
                {t('employeeDashboard')}
              </ThemedText>
            </View>
            <LanguageToggle />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: Palette.accentBlue }]}>
            <View style={[styles.statAccent, { backgroundColor: Palette.accentBlue }]} />
            <View style={styles.statHeader}>
              <View style={[styles.dot, { backgroundColor: Palette.accentBlue }]} />
              <ThemedText style={[styles.statValue, { color: Palette.accentBlue }]}>{stats.schedules}</ThemedText>
            </View>
            <ThemedText style={styles.statLabel}>{t('todaySchedules')}</ThemedText>
          </View>
          <View style={[styles.statCard, { borderColor: Palette.accentOrange }]}>
            <View style={[styles.statAccent, { backgroundColor: Palette.accentOrange }]} />
            <View style={styles.statHeader}>
              <View style={[styles.dot, { backgroundColor: Palette.accentOrange }]} />
              <ThemedText style={[styles.statValue, { color: Palette.accentOrange }]}>{stats.pendingAssignments}</ThemedText>
            </View>
            <ThemedText style={styles.statLabel}>{t('pendingAssignments')}</ThemedText>
          </View>
          <View style={[styles.statCard, { borderColor: Palette.accentGreen }]}>
            <View style={[styles.statAccent, { backgroundColor: Palette.accentGreen }]} />
            <View style={styles.statHeader}>
              <View style={[styles.dot, { backgroundColor: Palette.accentGreen }]} />
              <ThemedText style={[styles.statValue, { color: Palette.accentGreen }]}>{stats.commissions}</ThemedText>
            </View>
            <ThemedText style={styles.statLabel}>{t('myCommissions')}</ThemedText>
          </View>
        </View>
        <View style={styles.links}>
          <PrimaryButton
            label={t('employeeSchedule')}
            onPress={() => router.push('/(employee)/schedule')}
          />
          <PrimaryButton
            label={t('employeeAssignments')}
            onPress={() => router.push('/(employee)/assignments')}
          />
          <PrimaryButton
            label={t('employeeCommissions')}
            onPress={() => router.push('/(employee)/commissions')}
          />
          <PrimaryButton
            label={t('employeePayrolls')}
            onPress={() => router.push('/(employee)/payrolls')}
          />
        </View>
        <ThemedText style={styles.logout} onPress={logout}>
          {t('logout')}
        </ThemedText>
      </ScrollView>
    </ThemedView>
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
  subtitle: {
    marginBottom: 12,
  },
  links: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
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
    fontSize: 18,
    fontWeight: '700',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statAccent: {
    height: 6,
    width: 36,
    borderRadius: 999,
    marginBottom: 8,
  },
  statLabel: {
    color: Palette.mutedText,
    marginTop: 4,
    fontSize: 12,
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
