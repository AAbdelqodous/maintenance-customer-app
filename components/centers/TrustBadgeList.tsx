import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { TrustBadge } from '../../store/api/centersApi';

interface Props {
  badges: TrustBadge[];
  isRTL: boolean;
}

export default function TrustBadgeList({ badges, isRTL }: Props) {
  const { i18n } = useTranslation();

  if (badges.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, isRTL && styles.rowReverse]}
    >
      {badges.map((badge) => (
        <View key={badge.badgeType} style={styles.badge}>
          <Ionicons name={badge.iconName as any} size={18} color="#2196F3" />
          <AppText style={styles.label}>
            {i18n.language === 'ar' ? badge.labelAr : badge.labelEn}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  label: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '600',
  },
});
