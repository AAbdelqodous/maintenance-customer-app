import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { InvoiceLines } from '../../../../components/payments/InvoiceLines';
import { MethodPicker } from '../../../../components/payments/MethodPicker';
import { AppText } from '../../../../components/ui/AppText';
import { useNetworkStatus } from '../../../../hooks/useNetworkStatus';
import { sumLinesFils } from '../../../../lib/money';
import {
  PaymentMethod,
  useGetBookingInvoiceQuery,
  useGetSavedMethodsQuery,
  useInitiatePaymentMutation,
} from '../../../../store/api/paymentsApi';

// One idempotency key per attempt (prevents double-charge, FR-011).
function genIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Spec 007 US1 — review the invoice, pick a method, pay (gateway-hosted checkout).
export default function PayScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = Number(bookingId);
  const router = useRouter();
  const { t } = useTranslation();
  const { isConnected } = useNetworkStatus();

  const { data: invoice, isLoading, isError, refetch } = useGetBookingInvoiceQuery(id);
  const { data: savedMethods } = useGetSavedMethodsQuery();
  const [initiatePayment, { isLoading: paying }] = useInitiatePaymentMutation();

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const idempotencyKey = useRef(genIdempotencyKey()).current;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }
  if (isError || !invoice) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.muted}>{t('payments.mismatch')}</AppText>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <AppText style={styles.retryText}>{t('payments.result.retry')}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const reconcileOk = sumLinesFils(invoice.lines.map((l) => l.amount)) === invoice.total;
  const canPay = !!method && reconcileOk && isConnected !== false && !paying;

  const handlePay = async () => {
    if (!method) return;
    try {
      const res = await initiatePayment({
        bookingId: id,
        method,
        useWalletBalance: false,
        idempotencyKey,
      }).unwrap();
      if (res.checkoutUrl) {
        router.push({
          pathname: '/(app)/(tabs)/bookings/payment-webview',
          params: {
            url: res.checkoutUrl,
            returnUrlPrefix: res.returnUrlPrefix,
            paymentId: String(res.paymentId),
            bookingId: String(id),
          },
        });
      } else {
        router.replace({
          pathname: '/(app)/(tabs)/bookings/payment-result',
          params: { paymentId: String(res.paymentId), bookingId: String(id) },
        });
      }
    } catch {
      // No charge made on failure; allow retry with the same idempotency key.
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InvoiceLines lines={invoice.lines} total={invoice.total} />

        <AppText style={styles.sectionTitle}>{t('payments.method.card')}</AppText>
        <MethodPicker
          available={invoice.availableMethods}
          saved={savedMethods}
          selectedMethod={method}
          onSelectMethod={setMethod}
        />
      </ScrollView>

      {isConnected === false && <AppText style={styles.offline}>{t('payments.result.processing')}</AppText>}
      <TouchableOpacity
        style={[styles.payButton, !canPay && styles.payButtonDisabled]}
        onPress={handlePay}
        disabled={!canPay}
        accessibilityRole="button"
      >
        {paying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <AppText style={styles.payText}>{t('payments.payNow')}</AppText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  muted: { fontSize: 15, color: '#757575', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 24, marginBottom: 12 },
  offline: { textAlign: 'center', color: '#E65100', fontSize: 13, paddingVertical: 6 },
  payButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: { opacity: 0.5 },
  payText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  retry: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2196F3', borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
});
