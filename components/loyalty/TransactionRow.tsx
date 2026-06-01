import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoyaltyTransaction } from '../../store/api/loyaltyApi';

interface Props {
  transaction: LoyaltyTransaction;
  isRTL: boolean;
}

export default function TransactionRow({ transaction, isRTL }: Props) {
  const { i18n } = useTranslation();
  const isEarned = transaction.pointsDelta > 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <View style={[styles.row, isRTL && styles.rowReverse]}>
      <View style={styles.textBlock}>
        <AppText style={styles.description} numberOfLines={2}>
          {transaction.description}
        </AppText>
        <AppText style={styles.date}>{formatDate(transaction.createdAt)}</AppText>
      </View>
      <View style={styles.amountBlock}>
        <AppText style={[styles.delta, isEarned ? styles.earned : styles.spent]}>
          {isEarned ? '+' : ''}{transaction.pointsDelta}
        </AppText>
        <AppText style={styles.balance}>{transaction.balanceAfter}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  textBlock: { flex: 1, marginRight: 12 },
  description: { fontSize: 14, color: '#1A1A2E', marginBottom: 3 },
  date: { fontSize: 12, color: '#9E9E9E' },
  amountBlock: { alignItems: 'flex-end' },
  delta: { fontSize: 16, fontWeight: '700' },
  earned: { color: '#4CAF50' },
  spent: { color: '#F44336' },
  balance: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
});
