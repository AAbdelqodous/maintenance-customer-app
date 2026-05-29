import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OtpInput } from '../../components/auth/OtpInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { AppText } from '../../components/ui/AppText';
import { useLazyActivateAccountQuery, useLoginMutation } from '../../store/api/authApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAppDispatch } from '../../store';
import { setSession, setUser, decodeJwt } from '../../store/authSlice';
import { setJwt } from '../../lib/secureStorage';

export default function OtpVerifyScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { email, password, mode } = useLocalSearchParams<{
    email: string;
    password?: string;
    mode?: string;
  }>();

  const isResetMode = mode === 'reset';

  const [code, setCode] = useState('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { isConnected } = useNetworkStatus();
  const [activateAccount, { isFetching }] = useLazyActivateAccountQuery();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  async function handleVerify() {
    if (code.length < 6) return;
    if (!isConnected) {
      setBannerMessage(t('errors.noInternet'));
      return;
    }
    setBannerMessage(null);
    setInlineError(null);

    if (isResetMode) {
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: email ?? '', token: code },
      });
      return;
    }

    try {
      await activateAccount(code).unwrap();

      // Account activated — log in automatically if password available
      if (password) {
        const { token } = await login({ email, password }).unwrap();
        const { user, expiresAt } = decodeJwt(token);
        await setJwt(token);
        dispatch(setSession({ token, expiresAt }));
        dispatch(setUser(user));
        router.replace('/(app)/');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string } };
      const message = apiError?.data?.error ?? '';

      if (message.toLowerCase().includes('expired')) {
        setBannerMessage(t('auth.otp.expiredCode'));
        setCode('');
      } else {
        setInlineError(t('auth.otp.invalidCode'));
      }
    }
  }

  const isLoading = isFetching || isLoggingIn;

  const title = isResetMode ? t('auth.otp.resetTitle') : t('auth.otp.title');
  const subtitle = isResetMode
    ? t('auth.otp.resetSubtitle', { email: email ?? '' })
    : t('auth.otp.subtitle', { email: email ?? '' });

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.subtitle}>
        {subtitle}
      </AppText>

      {bannerMessage && (
        <View style={styles.infoBanner}>
          <AppText style={styles.infoBannerText}>{bannerMessage}</AppText>
        </View>
      )}

      <View style={styles.otpContainer}>
        <OtpInput value={code} onChange={setCode} />
      </View>

      {inlineError && (
        <AppText style={styles.inlineError}>{inlineError}</AppText>
      )}

      <AuthButton
        title={t('auth.otp.submitButton')}
        onPress={handleVerify}
        loading={isLoading}
        disabled={code.length < 6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  infoBanner: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoBannerText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
  },
  otpContainer: {
    marginBottom: 12,
  },
  inlineError: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
});
