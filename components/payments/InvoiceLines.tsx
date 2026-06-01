import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { formatKD, formatKDSigned, sumLinesFils } from '../../lib/money';
import type { InvoiceLine } from '../../store/api/paymentsApi';

interface InvoiceLinesProps {
  lines: InvoiceLine[];
  total: number;
}

// Spec 007 — itemized, bilingual invoice with a fils-safe total reconcile (FR-002).
export function InvoiceLines({ lines, total }: InvoiceLinesProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.dir() === 'rtl' ? 'ar' : 'en';
  const mismatch = sumLinesFils(lines.map((l) => l.amount)) !== total;

  return (
    <View style={styles.card}>
      {lines.map((line, idx) => {
        const credit = line.amount < 0;
        return (
          <View key={idx} style={styles.row}>
            <AppText style={styles.label}>{locale === 'ar' ? line.labelAr : line.labelEn}</AppText>
            <AppText style={[styles.amount, credit && styles.credit]}>
              {credit ? formatKDSigned(line.amount, locale) : formatKD(line.amount, locale)}
            </AppText>
          </View>
        );
      })}
      <View style={styles.divider} />
      <View style={styles.row}>
        <AppText style={styles.totalLabel}>{t('payments.total')}</AppText>
        <AppText style={styles.totalAmount}>{formatKD(total, locale)}</AppText>
      </View>
      {mismatch && <AppText style={styles.mismatch}>{t('payments.mismatch')}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, gap: 12 },
  label: { flex: 1, fontSize: 15, color: '#424242' },
  amount: { fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  credit: { color: '#2E7D32' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#1565C0' },
  mismatch: { color: '#E53935', fontSize: 13, marginTop: 8 },
});
