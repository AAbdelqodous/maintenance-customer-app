import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function WalletLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('wallet.title') }} />
      <Stack.Screen name="topup" options={{ title: t('wallet.topUp') }} />
    </Stack>
  );
}
