import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FormInput } from '@/components/ui/form-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiPatch } from '@/lib/api';
import { Palette } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(t('errorPasswordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('errorPasswordMismatch'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPatch(
        '/users/me/password',
        { currentPassword, newPassword },
        token,
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('successTitle'), t('changePasswordSuccess'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <ThemedText type="title">{t('changePasswordTitle')}</ThemedText>
      <FormInput
        label={t('currentPassword')}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <FormInput
        label={t('newPassword')}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <FormInput
        label={t('confirmPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
      <PrimaryButton
        label={loading ? t('saving') : t('changePassword')}
        onPress={handleSave}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  error: {
    color: '#c00',
  },
});
