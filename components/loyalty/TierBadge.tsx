import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LoyaltyTier, TIER_COLORS, TIER_TEXT_COLORS } from '../../store/api/loyaltyApi';

interface Props {
  tier: LoyaltyTier;
  size?: 'small' | 'large';
}

export default function TierBadge({ tier, size = 'small' }: Props) {
  const { t } = useTranslation();
  const bgColor = TIER_COLORS[tier];
  const textColor = TIER_TEXT_COLORS[tier];
  const isLarge = size === 'large';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        isLarge && styles.badgeLarge,
      ]}
    >
      <AppText
        style={[
          styles.text,
          { color: textColor },
          isLarge && styles.textLarge,
        ]}
      >
        {t(`loyalty.tiers.${tier}`)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: 14,
  },
});
