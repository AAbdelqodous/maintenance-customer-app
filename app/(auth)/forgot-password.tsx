import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { AppText } from '../../components/ui/AppText';
import { useForgotPasswordMutation } from '../../store/api/authApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const schema = z.object({
  email: z.string().email('errors.invalidEmail'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (!isConnected) {
      setError('root', { message: t('errors.noInternet') });
      return;
    }
    try {
      await forgotPassword({ email: data.email }).unwrap();
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { email: data.email, mode: 'reset' },
      });
    } catch {
      setError('root', { message: t('errors.serverError') });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <AppText style={styles.title}>{t('auth.forgotPassword.title')}</AppText>
        <AppText style={styles.subtitle}>{t('auth.forgotPassword.subtitle')}</AppText>

        {errors.root && (
          <View style={styles.errorBanner}>
            <AppText style={styles.errorBannerText}>{errors.root.message}</AppText>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthInput
              label={t('auth.forgotPassword.emailLabel')}
              placeholder={t('auth.forgotPassword.emailPlaceholder')}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email ? t(errors.email.message!) : undefined}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />

        <AuthButton
          title={t('auth.forgotPassword.submitButton')}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
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
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#991B1B',
  },
});
