import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/ui/primary-button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useI18n } from '@/context/i18n-context';
import { Palette } from '@/constants/theme';

export default function PublicIndex() {
  const { t } = useI18n();
  const heroImage = require('../../assets/images/manicure.webp');

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <View style={styles.topRow}>
        <LanguageToggle />
      </View>
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={16} color="#ffffff" />
          <ThemedText style={styles.heroBadgeText} lightColor="#ffffff">
            {t('publicLandingBadge')}
          </ThemedText>
        </View>
        <ThemedText type="title" lightColor="#ffffff">
          {t('publicLandingTitle')}
        </ThemedText>
        <ThemedText style={styles.heroSubtitle} lightColor="#f6effb">
          {t('publicLandingSubtitle')}
        </ThemedText>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="flower-outline" size={14} color={Palette.navy} />
            <ThemedText style={styles.chipText}>{t('landingChipRelax')}</ThemedText>
          </View>
          <View style={styles.chip}>
            <Ionicons name="star-outline" size={14} color={Palette.navy} />
            <ThemedText style={styles.chipText}>{t('landingChipPremium')}</ThemedText>
          </View>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={14} color={Palette.navy} />
            <ThemedText style={styles.chipText}>{t('landingChipFast')}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.imageCard}>
        <Image source={heroImage} style={styles.heroImage} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="calendar-outline" size={18} color={Palette.accentPurple} />
          </View>
          <ThemedText type="subtitle">{t('customerSectionTitle')}</ThemedText>
        </View>
        <ThemedText style={styles.cardText}>{t('customerSectionSubtitle')}</ThemedText>
        <PrimaryButton
          label={t('bookAppointment')}
          onPress={() => router.push('/(public)/book-appointment')}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIcon}>
            <Ionicons name="people-outline" size={18} color={Palette.accentPink} />
          </View>
          <ThemedText type="subtitle">{t('staffSectionTitle')}</ThemedText>
        </View>
        <ThemedText style={styles.cardText}>{t('staffSectionSubtitle')}</ThemedText>
        <PrimaryButton
          label={t('login')}
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  hero: {
    gap: 6,
    padding: 20,
    borderRadius: 24,
    backgroundColor: Palette.accentPurple,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  heroSubtitle: {
    color: '#f6effb',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f9f1ff',
  },
  chipText: {
    fontSize: 12,
    color: Palette.navy,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fffafc',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageCard: {
    backgroundColor: '#fffafc',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e7ff',
  },
  cardText: {
    color: Palette.mutedText,
  },
});
