import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { FormInput } from '@/components/ui/form-input';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette } from '@/constants/theme';

export default function LoginScreen() {
  const { login, user } = useAuth();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError((err as Error).message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      setTimeout(() => router.replace('/(admin)'), 0);
      return;
    }
    if (user?.role === 'employee') {
      setTimeout(() => router.replace('/(employee)'), 0);
      return;
    }
    if (!user && !router.canGoBack()) {
      setTimeout(() => router.replace('/(public)'), 0);
    }
  }, [user]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <ThemedText style={styles.backText} lightColor="#ffffff">
            {t('back')}
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.hero}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title" lightColor="#ffffff">
              {t('appTitle')}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle} lightColor="#f4e9f9">
              {t('loginTitle')}
            </ThemedText>
          </View>
          <LanguageToggle />
        </View>
      </View>
      <View style={styles.form}>
        <FormInput
          label={t('username')}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <FormInput
          label={t('password')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <PrimaryButton
          label={loading ? t('loggingIn') : t('login')}
          onPress={handleLogin}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    justifyContent: 'center',
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Palette.accentPurple,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  backText: {
    fontWeight: '700',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubtitle: {
    marginTop: 4,
  },
  form: {
    gap: 12,
    backgroundColor: '#fffafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: Palette.navyDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  error: {
    color: '#c00',
  },
});
