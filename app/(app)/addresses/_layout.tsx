import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

// Spec 008 — saved service addresses (reached from the picker / profile, not a tab).
export default function AddressesLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('fulfillment.addresses.title') }} />
    </Stack>
  );
}
