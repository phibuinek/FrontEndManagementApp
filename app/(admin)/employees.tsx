import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { OptionPill } from '@/components/ui/option-pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Section } from '@/components/ui/section';

type Employee = {
  _id: string;
  username: string;
  role: string;
  displayName?: string;
  phone?: string;
  active?: boolean;
};

export default function EmployeesScreen() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const load = async () => {
    try {
      const data = await apiGet<Employee[]>('/users', token);
      setEmployees(data.filter((item) => item.role === 'employee'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleCreate = async () => {
    if (!username.trim()) {
      setError(t('errorUsernameRequired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost(
        '/users',
        {
          username: username.trim(),
          ...(password.trim() ? { password } : {}),
          role,
          displayName: displayName.trim() || undefined,
          phone: phone.trim() || undefined,
        },
        token,
      );
      setUsername('');
      setPassword('');
      setDisplayName('');
      setPhone('');
      setRole('employee');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await apiDelete(`/users/${id}`, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const filteredEmployees = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((item) => {
      const name = (item.displayName ?? item.username ?? '').toLowerCase();
      const phoneValue = (item.phone ?? '').toLowerCase();
      return name.includes(term) || phoneValue.includes(term);
    });
  }, [employees, searchText]);

  return (
    <ThemedView style={styles.container} lightColor="#f6f7f9">
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('employeesTitle')}</ThemedText>
            <FormInput
              label={t('searchEmployeesLabel')}
              placeholder={t('searchEmployeesPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {showCreate && (
              <Section title={t('employeeInfoTitle')}>
                <FormInput label={t('username')} value={username} onChangeText={setUsername} />
          <FormInput
            label={t('password')}
            placeholder={t('defaultPasswordHint')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
                <FormInput label={t('displayName')} value={displayName} onChangeText={setDisplayName} />
                <FormInput label={t('phone')} value={phone} onChangeText={setPhone} />
                <View style={styles.roleRow}>
                  <OptionPill
                    label={t('roleEmployee')}
                    selected={role === 'employee'}
                    onPress={() => setRole('employee')}
                  />
                  <OptionPill
                    label={t('roleAdmin')}
                    selected={role === 'admin'}
                    onPress={() => setRole('admin')}
                  />
                </View>
                <PrimaryButton
                  label={loading ? t('saving') : t('saveEmployee')}
                  onPress={handleCreate}
                />
              </Section>
            )}
            <PrimaryButton
              label={showCreate ? t('close') : t('addEmployee')}
              onPress={() => setShowCreate((prev) => !prev)}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">{item.displayName ?? item.username}</ThemedText>
            <ThemedText>
              {t('role')}: {item.role === 'admin' ? t('roleAdmin') : t('roleEmployee')}
            </ThemedText>
            <ThemedText>{t('phone')}: {item.phone ?? '-'}</ThemedText>
            <ThemedText>{t('active')}: {item.active ? t('yes') : t('no')}</ThemedText>
            <PrimaryButton
              label={t('delete')}
              variant="danger"
              onPress={() => handleDelete(item._id)}
            />
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  error: {
    color: '#c00',
  },
});
