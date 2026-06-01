import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../ui/AppText';
import WorkProgressStep from './WorkProgressStep';
import { WorkProgressResponse } from '../../store/api/progressApi';

interface Props {
  data: WorkProgressResponse;
  isRTL: boolean;
}

export default function WorkProgressTimeline({ data, isRTL }: Props) {
  const { t } = useTranslation();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <AppText style={styles.progressLabel}>{data.progressPercentage}%</AppText>
          {data.estimatedCompletionDate && (
            <AppText style={[styles.estimatedLabel, data.isDelayed && styles.delayedLabel]}>
              {t('booking.progress.estimatedCompletion')}: {formatDate(data.estimatedCompletionDate)}
              {data.isDelayed ? ` (${t('booking.progress.delayed')})` : ''}
            </AppText>
          )}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${data.progressPercentage}%` }]} />
        </View>
      </View>

      {data.timeline.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={40} color="#BDBDBD" />
          <AppText style={styles.emptyText}>{t('booking.progress.noUpdates')}</AppText>
        </View>
      ) : (
        <View style={styles.timeline}>
          {data.timeline.map((item, index) => (
            <WorkProgressStep
              key={item.stage}
              item={item}
              isLast={index === data.timeline.length - 1}
              isRTL={isRTL}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  estimatedLabel: {
    fontSize: 12,
    color: '#757575',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  delayedLabel: {
    color: '#F44336',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
  },
  timeline: {
    paddingTop: 8,
  },
});
