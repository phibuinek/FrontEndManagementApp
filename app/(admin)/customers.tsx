import React, { useMemo, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { FormInput } from '@/components/ui/form-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Section } from '@/components/ui/section';
import { Palette } from '@/constants/theme';

type Customer = {
  _id: string;
  name: string;
  nameEn?: string;
  phone?: string;
  note?: string;
};

export default function CustomersScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [token]);

  const load = async () => {
    try {
      const data = await apiGet<Customer[]>('/customers', token);
      setCustomers(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreate = async () => {
    const activeName = (locale === 'en' ? nameEn : name).trim();
    if (!activeName) {
      setError(t('errorCustomerRequired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: activeName,
        nameEn: locale === 'en' ? activeName : nameEn.trim() || undefined,
        phone,
        note,
      };
      if (editingId) {
        await apiPatch(
          `/customers/${editingId}`,
          payload,
          token,
        );
      } else {
        await apiPost(
          '/customers',
          payload,
          token,
        );
      }
      setName('');
      setNameEn('');
      setPhone('');
      setNote('');
      setEditingId(null);
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
      await apiDelete(`/customers/${id}`, token);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (item: Customer) => {
    setShowCreate(true);
    setEditingId(item._id);
    setName(item.name ?? '');
    setNameEn(item.nameEn ?? '');
    setPhone(item.phone ?? '');
    setNote(item.note ?? '');
  };

  const filteredCustomers = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((item) => {
      const nameValue = (item.name ?? '').toLowerCase();
      const nameEnValue = (item.nameEn ?? '').toLowerCase();
      const phoneValue = (item.phone ?? '').toLowerCase();
      return nameValue.includes(term) || nameEnValue.includes(term) || phoneValue.includes(term);
    });
  }, [customers, searchText]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('customersTitle')}</ThemedText>
            <FormInput
              label={t('searchCustomersLabel')}
              placeholder={t('searchCustomersPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {showCreate && (
              <Section title={editingId ? t('editCustomer') : t('addCustomer')}>
                <FormInput
                  label={t('customerNameLabel')}
                  value={locale === 'en' ? nameEn : name}
                  onChangeText={(value) => {
                    if (locale === 'en') {
                      setNameEn(value);
                    } else {
                      setName(value);
                    }
                  }}
                />
                <FormInput label={t('phone')} value={phone} onChangeText={setPhone} />
                <FormInput label={t('note')} value={note} onChangeText={setNote} />
                <PrimaryButton
                  label={loading ? t('saving') : editingId ? t('updateCustomer') : t('addCustomer')}
                  onPress={handleCreate}
                />
              </Section>
            )}
            <PrimaryButton
              label={showCreate ? t('close') : t('addCustomer')}
              onPress={() => {
                setShowCreate((prev) => !prev);
                if (showCreate) {
                  setEditingId(null);
                  setName('');
                  setNameEn('');
                  setPhone('');
                  setNote('');
                }
              }}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <ThemedText type="defaultSemiBold">
              {locale === 'en' && item.nameEn ? item.nameEn : item.name}
            </ThemedText>
            <ThemedText>{t('phone')}: {item.phone ?? '-'}</ThemedText>
            <ThemedText>{t('note')}: {item.note ?? '-'}</ThemedText>
            <PrimaryButton label={t('edit')} variant="secondary" onPress={() => handleEdit(item)} />
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
  error: {
    color: '#c00',
  },
});
