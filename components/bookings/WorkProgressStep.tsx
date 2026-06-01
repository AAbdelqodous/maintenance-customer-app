import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { WorkProgressItem } from '../../store/api/progressApi';

interface Props {
  item: WorkProgressItem;
  isLast: boolean;
  isRTL: boolean;
}

export default function WorkProgressStep({ item, isLast, isRTL }: Props) {
  const iconName = item.isCurrent
    ? 'radio-button-on'
    : item.isCompleted
    ? 'checkmark-circle'
    : 'ellipse-outline';

  const iconColor = item.isCurrent
    ? '#FF9800'
    : item.isCompleted
    ? '#4CAF50'
    : '#BDBDBD';

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={[styles.iconColumn, isRTL && styles.iconColumnRTL]}>
        <Ionicons name={iconName as any} size={22} color={iconColor} />
        {!isLast && <View style={[styles.connector, item.isCompleted && styles.connectorDone]} />}
      </View>

      <View style={styles.content}>
        <AppText
          style={[
            styles.stageName,
            item.isCurrent && styles.stageNameCurrent,
            item.isCompleted && styles.stageNameDone,
          ]}
        >
          {item.stageDisplayName}
        </AppText>
        {item.timestamp && (item.isCompleted || item.isCurrent) && (
          <AppText style={styles.timestamp}>{formatDate(item.timestamp)}</AppText>
        )}
        {item.notes ? (
          <AppText style={styles.notes}>{item.notes}</AppText>
        ) : null}
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 4,
    width: 24,
  },
  iconColumnRTL: {
    marginRight: 4,
    marginLeft: 12,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    minHeight: 32,
  },
  connectorDone: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  stageName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9E9E9E',
    marginBottom: 2,
  },
  stageNameCurrent: {
    color: '#FF9800',
    fontWeight: '700',
  },
  stageNameDone: {
    color: '#1A1A2E',
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  notes: {
    fontSize: 13,
    color: '#424242',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    lineHeight: 20,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginTop: 8,
  },
});
