import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import {
  LoyaltyReward,
  RedemptionResult,
  RewardType,
  useRedeemRewardMutation,
} from '../../store/api/loyaltyApi';

interface Props {
  reward: LoyaltyReward;
  isRTL: boolean;
  onRedeemed: (result: RedemptionResult) => void;
}

export default function RewardCard({ reward, isRTL, onRedeemed }: Props) {
  const { t, i18n } = useTranslation();
  const [redeemReward, { isLoading }] = useRedeemRewardMutation();
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);

  const name = i18n.language === 'ar' ? reward.nameAr : reward.nameEn;

  const getRewardLabel = () => {
    switch (reward.rewardType) {
      case RewardType.DISCOUNT_PERCENT:
        return t('loyalty.rewardTypes.DISCOUNT_PERCENT', { value: reward.rewardValue });
      case RewardType.DISCOUNT_FIXED:
        return t('loyalty.rewardTypes.DISCOUNT_FIXED', { value: reward.rewardValue.toFixed(3) });
      case RewardType.FREE_SERVICE:
        return t('loyalty.rewardTypes.FREE_SERVICE');
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleRedeem = () => {
    const doRedeem = () =>
      redeemReward(reward.id)
        .unwrap()
        .then((result) => {
          setRedemptionResult(result);
          onRedeemed(result);
        })
        .catch((err) => {
          const msg = err?.data?.businessErrorDescription ?? t('common.retry');
          Alert.alert(t('common.error'), msg);
        });

    if (Platform.OS === 'web') {
      if (window.confirm(t('loyalty.redeemConfirm', { points: reward.pointsRequired }))) doRedeem();
    } else {
      Alert.alert(
        t('loyalty.rewardsTitle'),
        t('loyalty.redeemConfirm', { points: reward.pointsRequired }),
        [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.confirm'), onPress: doRedeem }]
      );
    }
  };

  const handleCopy = async () => {
    if (redemptionResult) {
      await Clipboard.setStringAsync(redemptionResult.redemptionCode);
      Alert.alert('', t('loyalty.codeCopied'));
    }
  };

  return (
    <View style={[styles.card, !reward.canRedeem && styles.cardDisabled]}>
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <View style={styles.titleBlock}>
          <AppText style={[styles.name, !reward.canRedeem && styles.nameDisabled]}>{name}</AppText>
          <AppText style={styles.rewardLabel}>{getRewardLabel()}</AppText>
        </View>
        <View style={styles.pointsBadge}>
          <AppText style={styles.pointsValue}>{reward.pointsRequired}</AppText>
          <AppText style={styles.pointsUnit}>{t('loyalty.points')}</AppText>
        </View>
      </View>

      {reward.validUntil && (
        <AppText style={styles.validUntil}>
          {t('loyalty.codeExpires', { date: formatDate(reward.validUntil) })}
        </AppText>
      )}

      {!reward.canRedeem && reward.reasonCannotRedeem && (
        <AppText style={styles.reason}>{reward.reasonCannotRedeem}</AppText>
      )}

      {redemptionResult ? (
        <View style={styles.codeBox}>
          <AppText style={styles.codeLabel}>{t('loyalty.yourCode')}</AppText>
          <View style={[styles.codeRow, isRTL && styles.rowReverse]}>
            <AppText style={styles.code}>{redemptionResult.redemptionCode}</AppText>
            <AppButton
              title={t('loyalty.copyCode')}
              onPress={handleCopy}
              variant="secondary"
              style={styles.copyBtn as any}
            />
          </View>
          <AppText style={styles.codeExpiry}>
            {t('loyalty.codeExpires', { date: formatDate(redemptionResult.expiresAt) })}
          </AppText>
        </View>
      ) : (
        <AppButton
          title={t('loyalty.redeem')}
          onPress={handleRedeem}
          disabled={!reward.canRedeem || isLoading}
          style={[styles.redeemBtn, !reward.canRedeem && styles.redeemBtnDisabled] as any}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: { opacity: 0.65 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  titleBlock: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  nameDisabled: { color: '#9E9E9E' },
  rewardLabel: { fontSize: 13, color: '#2196F3', fontWeight: '500' },
  pointsBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pointsValue: { fontSize: 18, fontWeight: '800', color: '#1565C0' },
  pointsUnit: { fontSize: 10, color: '#1565C0' },
  validUntil: { fontSize: 11, color: '#9E9E9E', marginBottom: 6 },
  reason: { fontSize: 12, color: '#F44336', marginBottom: 8 },
  redeemBtn: { marginTop: 8 },
  redeemBtnDisabled: { opacity: 0.5 },
  codeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  codeLabel: { fontSize: 11, color: '#388E3C', marginBottom: 6, fontWeight: '600' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  code: { fontSize: 18, fontWeight: '800', color: '#1B5E20', flex: 1, letterSpacing: 1 },
  copyBtn: { paddingHorizontal: 8 },
  codeExpiry: { fontSize: 11, color: '#4CAF50' },
});
