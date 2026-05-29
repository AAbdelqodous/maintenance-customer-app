import { Stack, router, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
  const { isAuthenticated, isSessionExpired, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (isSessionExpired()) {
      logout().then(() => {
        router.replace({ pathname: '/(auth)/', params: { reason: 'expired' } });
      });
    } else if (!isAuthenticated) {
      router.replace('/(auth)/');
    }
  }, [pathname, isAuthenticated, isSessionExpired, logout]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="quote-requests" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="complaints" options={{ headerShown: true }} />
      <Stack.Screen name="settings/language" options={{ headerShown: true }} />
      <Stack.Screen name="settings/notifications" options={{ headerShown: true }} />
      <Stack.Screen name="help" options={{ headerShown: true }} />
      <Stack.Screen name="about" options={{ headerShown: true }} />
      <Stack.Screen name="privacy" options={{ headerShown: true }} />
      <Stack.Screen name="terms" options={{ headerShown: true }} />
    </Stack>
  );
}
