import React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

import { AuthInput } from '../../components/auth/AuthInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { AppText } from '../../components/ui/AppText';
import { useLoginMutation } from '../../store/api/authApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAppDispatch } from '../../store';
import { setSession, setUser, decodeJwt } from '../../store/authSlice';
import { setJwt } from '../../lib/secureStorage';

const loginSchema = z.object({
  email: z.string().email('errors.invalidEmail'),
  password: z.string().min(1, 'errors.required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const BUSINESS_CODE_LOCKED = 302;
const BUSINESS_CODE_DISABLED = 303;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    if (!isConnected) {
      setError('root', { message: t('errors.noInternet') });
      return;
    }
    try {
      const { token } = await loginMutation(data).unwrap();
      const { user, expiresAt } = decodeJwt(token);
      await setJwt(token);
      dispatch(setSession({ token, expiresAt }));
      dispatch(setUser(user));
      router.replace('/(app)/');
    } catch (err: unknown) {
      const apiError = err as {
        data?: { businessErrorCode?: number; businessErrorDescription?: string };
        status?: number;
      };
      const code = apiError?.data?.businessErrorCode;

      if (code === BUSINESS_CODE_LOCKED) {
        Alert.alert(t('errors.accountLocked'));
      } else if (code === BUSINESS_CODE_DISABLED) {
        // Not yet verified — go to OTP
        router.push({
          pathname: '/(auth)/otp-verify',
          params: { email: getValues('email') },
        });
      } else {
        setError('root', { message: t('errors.incorrectCredentials') });
      }
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
        <AppText style={styles.title}>{t('auth.login.title')}</AppText>

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
              label={t('auth.login.emailLabel')}
              placeholder={t('auth.login.emailPlaceholder')}
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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PasswordInput
              label={t('auth.login.passwordLabel')}
              placeholder={t('auth.login.passwordPlaceholder')}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password ? t(errors.password.message!) : undefined}
              autoComplete="password"
            />
          )}
        />

        <Pressable
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <AppText style={styles.forgotPasswordText}>
            {t('auth.login.forgotPassword')}
          </AppText>
        </Pressable>

        <AuthButton
          title={t('auth.login.submitButton')}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
        />

        <View style={styles.footer}>
          <AppText style={styles.footerText}>{t('auth.login.noAccount')}</AppText>
          <Pressable onPress={() => router.replace('/(auth)/register')}>
            <AppText style={styles.link}>{t('auth.login.registerLink')}</AppText>
          </Pressable>
        </View>
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
    marginBottom: 24,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1A73E8',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    color: '#1A73E8',
    fontWeight: '600',
  },
});
