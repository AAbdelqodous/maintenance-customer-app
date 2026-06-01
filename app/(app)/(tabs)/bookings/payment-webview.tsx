import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { AppText } from '../../../../components/ui/AppText';

// Spec 007 US1 — gateway-hosted checkout. The client never reads the WebView outcome; on return
// it routes to payment-result, which reconciles status from the backend (R3). Mock mode renders a
// simulated gateway so the flow is demoable without a real gateway server.
export default function PaymentWebViewScreen() {
  const { url, returnUrlPrefix, paymentId, bookingId, returnTo } = useLocalSearchParams<{
    url: string;
    returnUrlPrefix: string;
    paymentId: string;
    bookingId: string;
    returnTo?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const mockMode = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

  const goResult = () =>
    router.replace({
      pathname: '/(app)/(tabs)/bookings/payment-result',
      params: { paymentId, bookingId, ...(returnTo ? { returnTo } : {}) },
    });

  // Web (non-mock): open the hosted page in the system browser, then reconcile on return.
  useEffect(() => {
    if (!mockMode && Platform.OS === 'web') {
      WebBrowser.openAuthSessionAsync(url, returnUrlPrefix).finally(goResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (mockMode) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.title}>Mock gateway</AppText>
        <AppText style={styles.sub}>Simulate the hosted KNET/card checkout.</AppText>
        <TouchableOpacity style={styles.primary} onPress={goResult} accessibilityRole="button">
          <AppText style={styles.primaryText}>Complete payment</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={goResult} accessibilityRole="button">
          <AppText style={styles.secondaryText}>{t('payments.result.retry')}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: url }}
      onNavigationStateChange={(nav) => {
        if (nav.url.startsWith(returnUrlPrefix)) {
          goResult();
        }
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14, backgroundColor: '#F5F5F5' },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  sub: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 8 },
  primary: { backgroundColor: '#2196F3', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { paddingVertical: 10 },
  secondaryText: { color: '#757575', fontWeight: '600' },
});
