import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { PaymentStatus } from '../../store/api/paymentsApi';

// Spec 007 — colored chip for the escrow/payment status.
const META: Record<PaymentStatus, { bg: string; fg: string; key: string }> = {
  [PaymentStatus.PENDING]: { bg: '#FFF3E0', fg: '#E65100', key: 'payments.status.pending' },
  [PaymentStatus.HELD]: { bg: '#E3F2FD', fg: '#1565C0', key: 'payments.status.held' },
  [PaymentStatus.RELEASED]: { bg: '#E8F5E9', fg: '#2E7D32', key: 'payments.status.released' },
  [PaymentStatus.PAID]: { bg: '#E8F5E9', fg: '#2E7D32', key: 'payments.status.paid' },
  [PaymentStatus.REFUNDED]: { bg: '#EEEEEE', fg: '#616161', key: 'payments.status.refunded' },
  [PaymentStatus.FAILED]: { bg: '#FFEBEE', fg: '#C62828', key: 'payments.status.failed' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();
  const meta = META[status];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <AppText style={[styles.text, { color: meta.fg }]}>{t(meta.key)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  text: { fontSize: 13, fontWeight: '700' },
});
