import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoyaltyTierProgress, LoyaltyTier } from '../../store/api/loyaltyApi';

interface Props {
  progress: LoyaltyTierProgress;
  isRTL: boolean;
}

export default function PointsProgressBar({ progress, isRTL }: Props) {
  const { t } = useTranslation();

  if (!progress.nextTier) {
    return (
      <View style={styles.container}>
        <AppText style={styles.maxLabel}>
          {t('loyalty.tiers.PLATINUM')} ✦
        </AppText>
      </View>
    );
  }

  const pct = Math.min(100, Math.max(0, progress.percent));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText style={styles.label}>
          {t('loyalty.tierProgress', { tier: t(`loyalty.tiers.${progress.nextTier}`) })}
        </AppText>
        <AppText style={styles.fraction}>
          {progress.currentPoints} / {progress.requiredPoints}
        </AppText>
      </View>
      <View style={[styles.track, isRTL && styles.trackRTL]}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  fraction: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  maxLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackRTL: {
    transform: [{ scaleX: -1 }],
  },
  fill: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});
