import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { AppText } from '../../components/ui/AppText';
import { useResetPasswordMutation } from '../../store/api/authApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

const schema = z
  .object({
    password: z.string().min(8, 'errors.passwordTooShort'),
    confirm: z.string().min(1, 'errors.required'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'auth.resetPassword.passwordMismatch',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

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
      await resetPassword({ email, token, newPassword: data.password }).unwrap();
      if (Platform.OS === 'web') {
        window.alert(t('auth.resetPassword.success'));
        router.replace('/(auth)/login');
      } else {
        Alert.alert(t('common.success'), t('auth.resetPassword.success'), [
          { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
        ]);
      }
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
        <AppText style={styles.title}>{t('auth.resetPassword.title')}</AppText>
        <AppText style={styles.subtitle}>{t('auth.resetPassword.subtitle')}</AppText>

        {errors.root && (
          <View style={styles.errorBanner}>
            <AppText style={styles.errorBannerText}>{errors.root.message}</AppText>
          </View>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label={t('auth.resetPassword.passwordLabel')}
              placeholder={t('auth.resetPassword.passwordPlaceholder')}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password ? t(errors.password.message!) : undefined}
              autoComplete="new-password"
            />
          )}
        />

        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label={t('auth.resetPassword.confirmLabel')}
              placeholder={t('auth.resetPassword.confirmPlaceholder')}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.confirm ? t(errors.confirm.message!) : undefined}
              autoComplete="new-password"
            />
          )}
        />

        <AuthButton
          title={t('auth.resetPassword.submitButton')}
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
