import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MethodPicker } from '../../../components/payments/MethodPicker';
import { AppText } from '../../../components/ui/AppText';
import { PaymentMethod } from '../../../store/api/paymentsApi';
import { useTopUpMutation } from '../../../store/api/walletApi';

function genIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const TOPUP_METHODS = [PaymentMethod.KNET, PaymentMethod.CARD, PaymentMethod.APPLE_PAY];

// Spec 007 US3 — top up the wallet via the same gateway-hosted checkout flow as a payment.
export default function WalletTopUpScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [topUp, { isLoading }] = useTopUpMutation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const idempotencyKey = useRef(genIdempotencyKey()).current;

  const numericAmount = parseFloat(amount);
  const canSubmit = !!method && !isNaN(numericAmount) && numericAmount > 0 && !isLoading;

  const handleTopUp = async () => {
    if (!method || isNaN(numericAmount)) return;
    try {
      const res = await topUp({ amount: numericAmount, method, idempotencyKey }).unwrap();
      if (res.checkoutUrl) {
        router.push({
          pathname: '/(app)/(tabs)/bookings/payment-webview',
          params: {
            url: res.checkoutUrl,
            returnUrlPrefix: res.returnUrlPrefix,
            paymentId: String(res.paymentId),
            bookingId: '',
            returnTo: 'wallet',
          },
        });
      } else {
        router.replace('/(app)/wallet');
      }
    } catch {
      // no charge on failure
    }
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>{t('wallet.amount')}</AppText>
      <TextInput
        style={[styles.input, isRTL && styles.rtl]}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.000"
        placeholderTextColor="#9E9E9E"
      />

      <AppText style={[styles.label, styles.labelSpaced]}>{t('payments.method.card')}</AppText>
      <MethodPicker available={TOPUP_METHODS} selectedMethod={method} onSelectMethod={setMethod} />

      <TouchableOpacity
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleTopUp}
        disabled={!canSubmit}
        accessibilityRole="button"
      >
        {isLoading ? <ActivityIndicator color="#fff" /> : <AppText style={styles.buttonText}>{t('wallet.topUp')}</AppText>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 10 },
  labelSpaced: { marginTop: 24 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rtl: { writingDirection: 'rtl' },
  button: { backgroundColor: '#2196F3', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 32 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
