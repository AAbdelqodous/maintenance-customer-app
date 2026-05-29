import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../../components/ui/AppText';
import {
  PaymentStatus,
  paymentsApi,
  useLazyGetPaymentStatusQuery,
} from '../../../../store/api/paymentsApi';
import { walletApi } from '../../../../store/api/walletApi';
import { useAppDispatch } from '../../../../store';

const POLL_MS = 2000;
const MAX_POLLS = 30;
const TERMINAL = [
  PaymentStatus.HELD,
  PaymentStatus.PAID,
  PaymentStatus.RELEASED,
  PaymentStatus.FAILED,
  PaymentStatus.REFUNDED,
];

// Spec 007 US1 — reconcile payment status from the backend (authoritative). The WebView outcome
// is ignored here; only the polled status decides success/failure (R3, prevents double-charge).
export default function PaymentResultScreen() {
  const { paymentId, bookingId, returnTo } = useLocalSearchParams<{ paymentId: string; bookingId: string; returnTo?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isWallet = returnTo === 'wallet';

  const [fetchStatus] = useLazyGetPaymentStatusQuery();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      pollsRef.current += 1;
      try {
        const res = await fetchStatus(Number(paymentId), false).unwrap();
        if (cancelled) return;
        if (TERMINAL.includes(res.status)) {
          setStatus(res.status);
          // Refresh the relevant caches so the originating screen reflects the new state.
          if (isWallet) {
            dispatch(walletApi.util.invalidateTags(['Wallet', 'WalletTx']));
          } else {
            dispatch(paymentsApi.util.invalidateTags([{ type: 'Invoice', id: Number(bookingId) }]));
          }
          return;
        }
      } catch {
        // keep polling within the budget (webhook may lag)
      }
      if (pollsRef.current >= MAX_POLLS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const backToOrigin = () =>
    isWallet
      ? router.replace('/(app)/wallet')
      : router.replace({ pathname: '/(app)/(tabs)/bookings/[id]', params: { id: bookingId } });

  // Terminal renders
  if (status === PaymentStatus.HELD || status === PaymentStatus.PAID || status === PaymentStatus.RELEASED) {
    return (
      <Result
        icon="checkmark-circle"
        color="#2E7D32"
        title={isWallet ? t('wallet.topUpComplete') : t('payments.result.securedTitle')}
        body={isWallet ? undefined : t('payments.result.securedBody')}
        cta={t('common.ok')}
        onPress={backToOrigin}
      />
    );
  }
  if (status === PaymentStatus.FAILED) {
    return (
      <Result
        icon="close-circle"
        color="#C62828"
        title={t('payments.result.failedTitle')}
        cta={t('payments.result.retry')}
        onPress={() => router.replace({ pathname: '/(app)/(tabs)/bookings/pay', params: { bookingId } })}
      />
    );
  }
  if (timedOut) {
    return (
      <Result
        icon="time-outline"
        color="#E65100"
        title={t('payments.result.processing')}
        cta={t('common.ok')}
        onPress={backToOrigin}
      />
    );
  }
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2196F3" />
      <AppText style={styles.muted}>{t('payments.result.processing')}</AppText>
    </View>
  );
}

function Result({
  icon, color, title, body, cta, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  body?: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.centered}>
      <Ionicons name={icon} size={64} color={color} />
      <AppText style={styles.title}>{title}</AppText>
      {!!body && <AppText style={styles.muted}>{body}</AppText>}
      <TouchableOpacity style={[styles.cta, { backgroundColor: color }]} onPress={onPress}>
        <AppText style={styles.ctaText}>{cta}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  muted: { fontSize: 15, color: '#757575', textAlign: 'center' },
  cta: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
