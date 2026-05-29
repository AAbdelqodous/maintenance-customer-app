import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { WalletBalanceCard } from '../../../components/payments/WalletBalanceCard';
import { AppText } from '../../../components/ui/AppText';
import { formatKDSigned } from '../../../lib/money';
import { useGetWalletQuery, useGetWalletTransactionsQuery, type WalletTransaction } from '../../../store/api/walletApi';

// Spec 007 US3 — wallet balance + transaction history.
export default function WalletScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = i18n.dir() === 'rtl' ? 'ar' : 'en';

  const { data: wallet, isLoading } = useGetWalletQuery();
  const { data: transactions } = useGetWalletTransactionsQuery();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <FlatList<WalletTransaction>
      style={styles.list}
      contentContainerStyle={styles.content}
      data={transactions ?? []}
      keyExtractor={(tx) => String(tx.id)}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <WalletBalanceCard
            balance={wallet?.balance ?? 0}
            onTopUp={() => router.push('/(app)/wallet/topup')}
          />
          {!!(transactions && transactions.length) && (
            <AppText style={styles.txTitle}>{t('wallet.title')}</AppText>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const credit = item.amount >= 0;
        return (
          <View style={styles.txRow}>
            <Ionicons
              name={credit ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
              size={22}
              color={credit ? '#2E7D32' : '#C62828'}
            />
            <View style={styles.txText}>
              <AppText style={styles.txDesc}>{locale === 'ar' ? item.descriptionAr : item.descriptionEn}</AppText>
              <AppText style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString(locale)}</AppText>
            </View>
            <AppText style={[styles.txAmount, { color: credit ? '#2E7D32' : '#C62828' }]}>
              {formatKDSigned(item.amount, locale)}
            </AppText>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={40} color="#9E9E9E" />
          <AppText style={styles.emptyText}>{t('wallet.empty')}</AppText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrap: { marginBottom: 8 },
  txTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 20, marginBottom: 4 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  txText: { flex: 1 },
  txDesc: { fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  txDate: { fontSize: 12, color: '#757575', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, color: '#757575' },
});
