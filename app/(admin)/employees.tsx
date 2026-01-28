import React, { useMemo, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { IconButton } from '@/components/ui/icon-button';
import { OptionPill } from '@/components/ui/option-pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Section } from '@/components/ui/section';
import { Palette } from '@/constants/theme';

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
  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (!editingId && !username.trim()) {
      setError(t('errorUsernameRequired'));
      return;
    }
    const isEditing = Boolean(editingId);
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...(editingId ? {} : { username: username.trim() }),
        ...(password.trim() ? { password } : {}),
        role,
        displayName: displayName.trim() || undefined,
        phone: phone.trim() || undefined,
      };
      if (editingId) {
        await apiPatch(`/users/${editingId}`, payload, token);
      } else {
        await apiPost('/users', payload, token);
      }
      setUsername('');
      setPassword('');
      setDisplayName('');
      setPhone('');
      setRole('employee');
      setEditingId(null);
      await load();
      setShowCreate(false);
      Alert.alert(t('successTitle'), isEditing ? t('updateSuccess') : t('createSuccess'));
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
      Alert.alert(t('successTitle'), t('deleteSuccess'));
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

  const handleEdit = (item: Employee) => {
    setShowCreate(true);
    setEditingId(item._id);
    setUsername(item.username ?? '');
    setPassword('');
    setDisplayName(item.displayName ?? '');
    setPhone(item.phone ?? '');
    setRole(item.role === 'admin' ? 'admin' : 'employee');
  };

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
                <FormInput
                  label={t('username')}
                  value={username}
                  onChangeText={setUsername}
                  editable={!editingId}
                />
                {!editingId && (
                  <FormInput
                    label={t('password')}
                    placeholder={t('defaultPasswordHint')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                )}
                {editingId && (
                  <ThemedText style={styles.helperText}>{t('passwordSelfOnly')}</ThemedText>
                )}
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
              onPress={() => {
                setShowCreate((prev) => !prev);
                if (showCreate) {
                  setEditingId(null);
                  setUsername('');
                  setPassword('');
                  setDisplayName('');
                  setPhone('');
                  setRole('employee');
                }
              }}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeaderRow}>
              <ThemedText type="defaultSemiBold">{item.displayName ?? item.username}</ThemedText>
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
            <ThemedText>
              {t('role')}: {item.role === 'admin' ? t('roleAdmin') : t('roleEmployee')}
            </ThemedText>
            <ThemedText>{t('phone')}: {item.phone ?? t('notAvailable')}</ThemedText>
            <ThemedText>{t('active')}: {item.active ? t('yes') : t('no')}</ThemedText>
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  helperText: {
    color: Palette.mutedText,
    fontSize: 12,
  },
  error: {
    color: '#c00',
  },
});
