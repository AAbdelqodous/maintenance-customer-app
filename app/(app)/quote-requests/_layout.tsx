import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function QuoteRequestsLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackTitle: '' }}>
      <Stack.Screen name="new" options={{ title: t('quoteRequests.compose.title') }} />
      <Stack.Screen name="[id]" options={{ title: t('quoteRequests.detail.responses') }} />
    </Stack>
  );
}
