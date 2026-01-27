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
import { PrimaryButton } from '@/components/ui/primary-button';
import { Section } from '@/components/ui/section';
import { Palette } from '@/constants/theme';

type ServiceItem = {
  _id: string;
  name: string;
  nameEn?: string;
  price: number;
  durationMinutes: number;
  active: boolean;
};

export default function ServicesScreen() {
  const { token } = useAuth();
  const { t, locale } = useI18n();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiGet<ServiceItem[]>('/services', token);
      setServices(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleCreate = async () => {
    const activeName = (locale === 'en' ? nameEn : name).trim();
    if (!activeName || !price) {
      setError(t('errorServiceRequired'));
      return;
    }
    const isEditing = Boolean(editingId);
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: activeName,
        nameEn: locale === 'en' ? activeName : nameEn.trim() || undefined,
        price: Number(price),
        durationMinutes: durationMinutes ? Number(durationMinutes) : 0,
      };
      if (editingId) {
        await apiPatch(
          `/services/${editingId}`,
          payload,
          token,
        );
      } else {
        await apiPost(
          '/services',
          payload,
          token,
        );
      }
      setName('');
      setNameEn('');
      setPrice('');
      setDurationMinutes('');
      setEditingId(null);
      await load();
      if (!isEditing) {
        setShowCreate(false);
        Alert.alert(t('successTitle'), t('createSuccess'));
      } else {
        Alert.alert(t('successTitle'), t('updateSuccess'));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await apiDelete(`/services/${id}`, token);
      await load();
      Alert.alert(t('successTitle'), t('deleteSuccess'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (item: ServiceItem) => {
    setShowCreate(true);
    setEditingId(item._id);
    setName(item.name ?? '');
    setNameEn(item.nameEn ?? '');
    setPrice(String(item.price ?? ''));
    setDurationMinutes(String(item.durationMinutes ?? ''));
  };

  const formatMoney = (value: number) => {
    if (locale === 'en') {
      const dollars = value / 27000;
      return `$${dollars.toFixed(2)}`;
    }
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const filteredServices = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return services;
    return services.filter((item) => {
      const nameValue = (item.name ?? '').toLowerCase();
      const nameEnValue = (item.nameEn ?? '').toLowerCase();
      return nameValue.includes(term) || nameEnValue.includes(term);
    });
  }, [services, searchText]);

  return (
    <ThemedView style={styles.container} lightColor={Palette.background}>
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">{t('servicesTitle')}</ThemedText>
            <FormInput
              label={t('searchServicesLabel')}
              placeholder={t('searchServicesPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
            />
            {showCreate && (
              <Section title={editingId ? t('editService') : t('addService')}>
                <FormInput
                  label={t('serviceNameLabel')}
                  value={locale === 'en' ? nameEn : name}
                  onChangeText={(value) => {
                    if (locale === 'en') {
                      setNameEn(value);
                    } else {
                      setName(value);
                    }
                  }}
                />
                <FormInput label={t('price')} value={price} onChangeText={setPrice} keyboardType="numeric" />
                <FormInput
                  label={t('durationMinutes')}
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                  keyboardType="numeric"
                />
                <PrimaryButton
                  label={loading ? t('saving') : editingId ? t('updateService') : t('addService')}
                  onPress={handleCreate}
                />
              </Section>
            )}
            <PrimaryButton
              label={showCreate ? t('close') : t('addService')}
              onPress={() => {
                setShowCreate((prev) => !prev);
                if (showCreate) {
                  setEditingId(null);
                  setName('');
                  setNameEn('');
                  setPrice('');
                  setDurationMinutes('');
                }
              }}
            />
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeaderRow}>
              <ThemedText type="defaultSemiBold">
                {locale === 'en' && item.nameEn ? item.nameEn : item.name}
              </ThemedText>
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
            <ThemedText>{t('price')}: {formatMoney(item.price)}</ThemedText>
            <ThemedText>{t('durationMinutes')}: {item.durationMinutes}</ThemedText>
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  error: {
    color: '#c00',
  },
});
