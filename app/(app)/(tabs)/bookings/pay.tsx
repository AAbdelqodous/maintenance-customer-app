import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { InvoiceLines } from '../../../../components/payments/InvoiceLines';
import { MethodPicker } from '../../../../components/payments/MethodPicker';
import { AppText } from '../../../../components/ui/AppText';
import { useNetworkStatus } from '../../../../hooks/useNetworkStatus';
import { formatKD, sumLinesFils } from '../../../../lib/money';
import {
  PaymentMethod,
  useGetBookingInvoiceQuery,
  useGetSavedMethodsQuery,
  useInitiatePaymentMutation,
} from '../../../../store/api/paymentsApi';
import { useGetWalletQuery } from '../../../../store/api/walletApi';

// One idempotency key per attempt (prevents double-charge, FR-011).
function genIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Spec 007 US1 (pay) + US3 (wallet split) + US4 (saved cards / save this card).
export default function PayScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const id = Number(bookingId);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = i18n.dir() === 'rtl' ? 'ar' : 'en';
  const { isConnected } = useNetworkStatus();

  const { data: invoice, isLoading, isError, refetch } = useGetBookingInvoiceQuery(id);
  const { data: savedMethods } = useGetSavedMethodsQuery();
  const { data: wallet } = useGetWalletQuery();
  const [initiatePayment, { isLoading: paying }] = useInitiatePaymentMutation();

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [saveCard, setSaveCard] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
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
  const walletBalance = wallet?.balance ?? 0;
  const walletAvailable = invoice.walletApplicable && walletBalance > 0;
  const remainder = useWallet
    ? Math.max(0, Math.round((invoice.total - walletBalance) * 1000) / 1000)
    : invoice.total;
  const walletCoversAll = useWallet && remainder === 0;
  // A method is needed unless the wallet covers the whole amount.
  const methodChosen = selectedSavedId != null || method != null;
  const canPay = reconcileOk && isConnected !== false && !paying && (walletCoversAll || methodChosen);

  const handleSelectMethod = (m: PaymentMethod) => {
    setMethod(m);
    setSelectedSavedId(null);
  };
  const handleSelectSaved = (savedId: number) => {
    setSelectedSavedId(savedId);
    setMethod(PaymentMethod.CARD);
    setSaveCard(false);
  };

  const handlePay = async () => {
    const effectiveMethod = walletCoversAll
      ? PaymentMethod.WALLET
      : selectedSavedId != null
        ? PaymentMethod.CARD
        : method;
    if (!effectiveMethod) return;
    try {
      const res = await initiatePayment({
        bookingId: id,
        method: effectiveMethod,
        useWalletBalance: useWallet,
        saveCard: saveCard || undefined,
        savedMethodId: selectedSavedId ?? undefined,
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

  const showCardSave = method === PaymentMethod.CARD && selectedSavedId == null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InvoiceLines lines={invoice.lines} total={invoice.total} />

        {walletAvailable && (
          <View style={styles.walletRow}>
            <View style={styles.walletText}>
              <AppText style={styles.walletLabel}>{t('payments.useWallet')}</AppText>
              <AppText style={styles.walletBalance}>{formatKD(walletBalance, locale)}</AppText>
            </View>
            <Switch value={useWallet} onValueChange={setUseWallet} />
          </View>
        )}
        {useWallet && remainder > 0 && (
          <AppText style={styles.remainder}>
            {t('payments.remainder')}: {formatKD(remainder, locale)}
          </AppText>
        )}

        {!walletCoversAll && (
          <>
            <AppText style={styles.sectionTitle}>{t('payments.method.card')}</AppText>
            <MethodPicker
              available={invoice.availableMethods}
              saved={savedMethods}
              selectedMethod={selectedSavedId == null ? method : null}
              selectedSavedId={selectedSavedId}
              onSelectMethod={handleSelectMethod}
              onSelectSaved={handleSelectSaved}
            />
            {showCardSave && (
              <TouchableOpacity style={styles.saveRow} onPress={() => setSaveCard((v) => !v)}>
                <Ionicons
                  name={saveCard ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={saveCard ? '#2196F3' : '#9E9E9E'}
                />
                <AppText style={styles.saveText}>{t('payments.saveCard')}</AppText>
              </TouchableOpacity>
            )}
          </>
        )}
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
          <AppText style={styles.payText}>
            {t('payments.payNow')} · {formatKD(walletCoversAll ? invoice.total : remainder, locale)}
          </AppText>
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
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  walletText: { flex: 1 },
  walletLabel: { fontSize: 15, color: '#1A1A2E', fontWeight: '600' },
  walletBalance: { fontSize: 13, color: '#757575', marginTop: 2 },
  remainder: { fontSize: 14, color: '#1565C0', fontWeight: '600', marginTop: 10 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingVertical: 4 },
  saveText: { fontSize: 14, color: '#424242' },
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
