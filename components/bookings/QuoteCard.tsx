import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import { BookingQuote } from '../../store/api/quoteApi';
import { useApproveQuoteMutation, useRejectQuoteMutation } from '../../store/api/quoteApi';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface Props {
  quote: BookingQuote;
  isRTL: boolean;
  onApproved: () => void;
  onRejected: () => void;
}

export default function QuoteCard({ quote, isRTL, onApproved, onRejected }: Props) {
  const { t, i18n } = useTranslation();
  const { isConnected } = useNetworkStatus();
  const [approveQuote, { isLoading: approving }] = useApproveQuoteMutation();
  const [rejectQuote, { isLoading: rejecting }] = useRejectQuoteMutation();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fmtKD = (amount: number) => `KD ${amount.toFixed(3)}`;

  const handleApprove = () => {
    if (!isConnected) return;
    const confirm = () =>
      approveQuote(quote.id)
        .unwrap()
        .then(() => {
          onApproved();
        })
        .catch(() => Alert.alert(t('common.error'), t('common.retry')));

    if (Platform.OS === 'web') {
      if (window.confirm(t('booking.quote.confirmApprove'))) confirm();
    } else {
      Alert.alert(t('booking.quote.title'), t('booking.quote.confirmApprove'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: confirm },
      ]);
    }
  };

  const handleRejectConfirm = () => {
    if (!isConnected) return;
    rejectQuote({ quoteId: quote.id, reason: rejectReason.trim() || undefined })
      .unwrap()
      .then(() => {
        setShowRejectInput(false);
        setRejectReason('');
        onRejected();
      })
      .catch(() => Alert.alert(t('common.error'), t('common.retry')));
  };

  return (
    <View style={styles.card}>
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <Ionicons name="document-text-outline" size={20} color="#2196F3" />
        <AppText style={styles.title}>{t('booking.quote.title')}</AppText>
        {quote.estimatedDuration && (
          <AppText style={styles.duration}>
            {t('booking.quote.estimatedDuration')}: {quote.estimatedDuration}
          </AppText>
        )}
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={14} color="#fff" />
          <AppText style={styles.offlineText}>{t('errors.noInternet')}</AppText>
        </View>
      )}

      <View style={styles.tableHeader}>
        <AppText style={[styles.colDesc, isRTL && styles.textRight]}>{t('booking.quote.description')}</AppText>
        <AppText style={styles.colAmount}>{t('booking.quote.parts')}</AppText>
        <AppText style={styles.colAmount}>{t('booking.quote.labour')}</AppText>
      </View>
      <View style={styles.divider} />

      {quote.lineItems.length === 0 ? (
        <AppText style={styles.noItems}>{t('booking.quote.noItems')}</AppText>
      ) : (
        quote.lineItems.map((item) => (
          <View key={item.id} style={[styles.lineItem, isRTL && styles.rowReverse]}>
            <AppText style={[styles.colDesc, isRTL && styles.textRight]}>
              {i18n.language === 'ar' ? item.descriptionAr : item.descriptionEn}
            </AppText>
            <AppText style={styles.colAmount}>{fmtKD(item.partsCost)}</AppText>
            <AppText style={styles.colAmount}>{fmtKD(item.labourCost)}</AppText>
          </View>
        ))
      )}

      <View style={styles.divider} />
      {[
        { label: t('booking.quote.subtotal'), value: quote.subtotal },
        ...(quote.discount > 0 ? [{ label: t('booking.quote.discount'), value: -quote.discount }] : []),
        ...(quote.tax > 0 ? [{ label: t('booking.quote.tax'), value: quote.tax }] : []),
      ].map(({ label, value }) => (
        <View key={label} style={[styles.totalRow, isRTL && styles.rowReverse]}>
          <AppText style={styles.totalLabel}>{label}</AppText>
          <AppText style={[styles.totalValue, value < 0 && styles.discount]}>
            {value < 0 ? `-KD ${Math.abs(value).toFixed(3)}` : fmtKD(value)}
          </AppText>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={[styles.totalRow, isRTL && styles.rowReverse]}>
        <AppText style={styles.grandTotalLabel}>{t('booking.quote.total')}</AppText>
        <AppText style={styles.grandTotalValue}>{fmtKD(quote.total)}</AppText>
      </View>

      <View style={[styles.actions, isRTL && styles.rowReverse]}>
        <AppButton
          title={t('booking.quote.approve')}
          onPress={handleApprove}
          style={styles.approveBtn as any}
          disabled={!isConnected || approving || rejecting}
        />
        <AppButton
          title={t('booking.quote.reject')}
          onPress={() => setShowRejectInput((v) => !v)}
          variant="secondary"
          style={[styles.rejectBtn, !isConnected && styles.disabledBtn] as any}
          disabled={!isConnected || approving || rejecting}
        />
      </View>

      {showRejectInput && (
        <View style={styles.rejectSection}>
          <TextInput
            style={styles.reasonInput}
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder={t('booking.quote.rejectReasonPlaceholder')}
            multiline
            numberOfLines={3}
          />
          <AppButton
            title={t('booking.quote.confirmReject')}
            onPress={handleRejectConfirm}
            style={styles.confirmRejectBtn as any}
            disabled={rejecting}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: '#757575',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    gap: 6,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  colDesc: {
    flex: 2,
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  colAmount: {
    flex: 1,
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  noItems: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 8,
  },
  lineItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  textRight: {
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 13,
    color: '#757575',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  discount: {
    color: '#4CAF50',
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  approveBtn: {
    flex: 1,
  },
  rejectBtn: {
    flex: 1,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  rejectSection: {
    marginTop: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1A1A2E',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  confirmRejectBtn: {},
});
