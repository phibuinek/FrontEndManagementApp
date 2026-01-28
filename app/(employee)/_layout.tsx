import { Stack } from 'expo-router';
import { useI18n } from '@/context/i18n-context';

export default function EmployeeLayout() {
  const { t } = useI18n();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: t('employeeHeaderTitle'),
      }}
    >
      <Stack.Screen name="index" options={{ headerBackVisible: false }} />
    </Stack>
  );
}
