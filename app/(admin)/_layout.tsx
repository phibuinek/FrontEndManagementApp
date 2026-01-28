import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Admin',
      }}
    >
      <Stack.Screen name="index" options={{ headerBackVisible: false }} />
    </Stack>
  );
}
