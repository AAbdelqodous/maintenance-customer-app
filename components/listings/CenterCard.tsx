import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../../lib/constants/config';
import { MaintenanceCenter } from '../../store/api/centersApi';
import { AppText } from '../ui/AppText';
import RatingStars from '../ui/RatingStars';

const SERVER_URL = API_BASE_URL.replace('/api/v1', '');

interface CenterCardProps {
  center: MaintenanceCenter;
  isFavorite?: boolean;
  onFavoriteToggle?: (centerId: number) => void;
}

export default function CenterCard({ center, isFavorite, onFavoriteToggle }: CenterCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const name = isRTL ? center.nameAr : center.nameEn;
  const description = isRTL ? center.descriptionAr : center.descriptionEn;

  const handlePress = () => {
    router.push({ pathname: '/(app)/(tabs)/centers/[id]', params: { id: String(center.id) } });
  };

  const handleFavoritePress = () => {
    onFavoriteToggle?.(center.id);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {center.imageUrls && center.imageUrls.length > 0 ? (
          <Image
            source={{ uri: center.imageUrls[0].startsWith('http') ? center.imageUrls[0] : `${SERVER_URL}${center.imageUrls[0]}` }}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <AppText style={styles.placeholderText}>{name?.charAt(0) ?? '?'}</AppText>
          </View>
        )}
        {center.isVerified && (
          <View style={styles.verifiedBadge}>
            <AppText style={styles.verifiedText}>✓</AppText>
          </View>
        )}
        {isFavorite !== undefined && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppText style={[styles.favoriteText, isFavorite && styles.favoriteActive]}>
              {isFavorite ? '♥' : '♡'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <AppText style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        {description && (
          <AppText style={styles.description} numberOfLines={2}>
            {description}
          </AppText>
        )}
        <View style={styles.infoRow}>
          <RatingStars rating={center.rating} size={14} showCount reviewCount={center.totalReviews} />
        </View>
        <View style={styles.infoRow}>
          <AppText style={styles.location}>
            {[center.address?.city, center.address?.area].filter(Boolean).join(', ')}
          </AppText>
          {center.distance !== undefined && (
            <AppText style={styles.distance}>{center.distance.toFixed(1)} km</AppText>
          )}
        </View>
        {center.isActive !== undefined && (
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: center.isActive ? '#4CAF50' : '#F44336' },
              ]}
            />
            <AppText
              style={[
                styles.statusText,
                { color: center.isActive ? '#4CAF50' : '#F44336' },
              ]}
            >
              {center.isActive ? t('center.open') : t('center.closed')}
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#757575',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteText: {
    fontSize: 20,
    color: '#757575',
  },
  favoriteActive: {
    color: '#E91E63',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#757575',
    flex: 1,
  },
  distance: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
