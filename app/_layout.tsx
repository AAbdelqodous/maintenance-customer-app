import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Provider } from 'react-redux';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { store } from '../store';
import { setSession, setUser, decodeJwt } from '../store/authSlice';
import { setLocale } from '../store/uiSlice';
import { getJwt } from '../lib/secureStorage';
import { initI18n, getStoredLocale } from '../lib/i18n';
import { enableMocksIfRequested } from '../lib/mocks/enableMocks';

import './globals.css';

// Dev-only: start the MSW mock backend when EXPO_PUBLIC_USE_MOCKS=true (no-op otherwise).
enableMocksIfRequested();

const ONBOARDING_KEY = '@app/onboarding';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleRestart = async () => {
    try {
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        await Updates.reloadAsync();
      }
    } catch {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.message}>
            {'حدث خطأ غير متوقع.\nAn unexpected error occurred.'}
          </Text>
          <Pressable style={errorStyles.button} onPress={this.handleRestart}>
            <Text style={errorStyles.buttonText}>
              {'إعادة تشغيل التطبيق  /  Restart App'}
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  message: {
    fontSize: 16,
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Init i18n with persisted locale
        const locale = await getStoredLocale();
        await initI18n();
        store.dispatch(setLocale(locale));

        // 2. Try to restore JWT session
        const token = await getJwt();
        if (token) {
          try {
            const { user, expiresAt } = decodeJwt(token);
            if (expiresAt > Date.now()) {
              store.dispatch(setSession({ token, expiresAt }));
              store.dispatch(setUser(user));
              setRedirectTo('/(app)/');
              return;
            }
          } catch {
            // Malformed JWT — treat as no session
          }
        }

        // 3. No valid session — check onboarding flag
        const seenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        setRedirectTo(seenOnboarding === 'true' ? '/(auth)/' : '/(onboarding)');
      } finally {
        setReady(true);
      }
    }

    bootstrap();
  }, []);

  // Navigate only after the Stack is mounted (ready = true)
  useEffect(() => {
    if (ready && redirectTo) {
      router.replace(redirectTo as Parameters<typeof router.replace>[0]);
    }
  }, [ready, redirectTo]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppBootstrap>
          <Stack screenOptions={{ headerShown: false }} />
        </AppBootstrap>
      </Provider>
    </ErrorBoundary>
  );
}
