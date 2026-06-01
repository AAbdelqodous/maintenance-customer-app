import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

interface RatingStarsProps {
  rating: number;
  size?: number;
  color?: string;
  showCount?: boolean;
  reviewCount?: number;
}

export default function RatingStars({
  rating,
  size = 16,
  color = '#FFD700',
  showCount = false,
  reviewCount,
}: RatingStarsProps) {
  const { t } = useTranslation();
  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const Star = ({ filled, half }: { filled?: boolean; half?: boolean }) => (
    <AppText
      style={[
        styles.star,
        { fontSize: size, color: filled || half ? color : '#E0E0E0' },
      ]}
    >
      {half ? '½' : filled ? '★' : '☆'}
    </AppText>
  );

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} filled />
        ))}
        {hasHalfStar && <Star half />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} />
        ))}
      </View>
      {showCount && reviewCount !== undefined && (
        <AppText style={[styles.count, { fontSize: size * 0.8 }]}>
          {` (${reviewCount})`}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  count: {
    marginLeft: 4,
    color: '#757575',
  },
});
