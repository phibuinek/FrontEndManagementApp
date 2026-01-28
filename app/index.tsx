import { Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/auth-context';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(public)" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(employee)" />;
}
