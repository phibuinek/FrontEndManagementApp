import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
      router.replace('/(admin)');
    } else if (user?.role === 'employee') {
      router.replace('/(employee)');
    }
  }, [user]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <View style={styles.hero}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title" lightColor="#ffffff">
              {t('appTitle')}
            </ThemedText>
            <ThemedText style={styles.heroSubtitle} lightColor="#dbe3f4">
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
    padding: 24,
    justifyContent: 'center',
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
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  error: {
    color: '#c00',
  },
});
