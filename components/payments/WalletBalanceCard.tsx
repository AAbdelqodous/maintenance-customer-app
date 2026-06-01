import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { formatKD } from '../../lib/money';

interface WalletBalanceCardProps {
  balance: number;
  onTopUp: () => void;
}

// Spec 007 US3 — wallet balance + top-up CTA.
export function WalletBalanceCard({ balance, onTopUp }: WalletBalanceCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.dir() === 'rtl' ? 'ar' : 'en';
  return (
    <View style={styles.card}>
      <AppText style={styles.label}>{t('wallet.balance')}</AppText>
      <AppText style={styles.balance}>{formatKD(balance, locale)}</AppText>
      <TouchableOpacity style={styles.topUp} onPress={onTopUp} accessibilityRole="button">
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <AppText style={styles.topUpText}>{t('wallet.topUp')}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1565C0', borderRadius: 16, padding: 20 },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  balance: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4 },
  topUp: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  topUpText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
