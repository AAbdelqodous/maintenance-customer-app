import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import ReviewCard from '../../../../components/listings/ReviewCard';
import TrustBadgeList from '../../../../components/centers/TrustBadgeList';
import { AppText } from '../../../../components/ui/AppText';
import RatingStars from '../../../../components/ui/RatingStars';
import { API_BASE_URL } from '../../../../lib/constants/config';
import { useCreateConversationMutation } from '../../../../store/api/chatApi';
import { useGetCenterByIdQuery, useGetCenterBadgesQuery } from '../../../../store/api/centersApi';
import { useAddFavoriteMutation, useIsFavoriteQuery, useRemoveFavoriteMutation } from '../../../../store/api/favoritesApi';
import { useGetCenterReviewsQuery, useCreateReviewMutation } from '../../../../store/api/reviewsApi';

const SERVER_URL = API_BASE_URL.replace('/api/v1', '');

export default function CenterDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.dir() === 'rtl';

  const centerId = Number(params.id);

  const { data: center, isLoading: centerLoading } = useGetCenterByIdQuery(centerId);
  const { data: badges } = useGetCenterBadgesQuery(centerId, { skip: true });
  const { data: reviewsData } = useGetCenterReviewsQuery({ centerId, page: 0, size: 10 });

  const { data: isFavoriteData, refetch: refetchIsFavorite } = useIsFavoriteQuery(centerId);
  const isFavorite = isFavoriteData ?? false;
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const [selectedTab, setSelectedTab] = useState<'about' | 'reviews'>('about');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [createConversation, { isLoading: creatingConversation }] = useCreateConversationMutation();
  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(centerId).unwrap();
      } else {
        await addFavorite(centerId).unwrap();
      }
      refetchIsFavorite();
    } catch (error: any) {
      const message = error?.data?.error || error?.data?.businessErrorDescription || t('common.retry');
      Alert.alert(t('common.error'), message);
    }
  };

  const handleCall = () => {
    if (center?.phone) {
      // Handle phone call
      Alert.alert(t('center.call'), center.phone);
    }
  };

  const handleDirections = () => {
    if (center?.latitude && center?.longitude) {
      // Handle directions
      Alert.alert(t('center.directions'), `${center.latitude}, ${center.longitude}`);
    }
  };

  const handleShare = () => {
    // Handle share
    Alert.alert(t('center.share'), 'Share functionality');
  };

  const handleChatWithCenter = async () => {
    try {
      const conversation = await createConversation(centerId).unwrap();
      router.push(`/(app)/(tabs)/chat/${conversation.id}`);
    } catch (error) {
      Alert.alert(t('common.error'), t('common.retry'));
    }
  };

  const handleBookNow = () => {
    router.push(`/(app)/(tabs)/centers/${centerId}/book/category`);
  };

  const handleWriteReview = () => setShowReviewModal(true);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert(t('common.error'), t('review.rating'));
      return;
    }

    try {
      await createReview({ centerId, rating: reviewRating, comment: reviewComment }).unwrap();
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewComment('');
      Alert.alert(t('common.ok'), t('review.success'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.retry'));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isRTL ? center?.nameAr : center?.nameEn,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {centerLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : (
          <>
            {/* Center Image */}
            {center?.imageUrls && center.imageUrls.length > 0 && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: center.imageUrls[0].startsWith('http') ? center.imageUrls[0] : `${SERVER_URL}${center.imageUrls[0]}` }}
                  style={styles.centerImage}
                />
              </View>
            )}

            {/* Center Name */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{t('center.name')}</AppText>
              <AppText style={styles.centerName}>
                {isRTL ? center?.nameAr : center?.nameEn}
              </AppText>
            </View>

            {/* Rating */}
            {reviewsData && reviewsData.content.length > 0 && (
              <View style={styles.section}>
                <AppText style={styles.sectionTitle}>{t('center.rating')}</AppText>
                <View style={styles.ratingRow}>
                  <AppText style={styles.averageRating}>
                    {t('center.averageRating')}{reviewsData.content.length > 0 ? `: ${(reviewsData.content.reduce((sum, r) => sum + r.rating, 0) / reviewsData.content.length).toFixed(1)}` : ': N/A'}
                  </AppText>
                  <RatingStars rating={reviewsData.content.length > 0 ? reviewsData.content.reduce((sum, r) => sum + r.rating, 0) / reviewsData.content.length : 0} />
                </View>
                <TouchableOpacity onPress={handleWriteReview}>
                  <AppText style={styles.writeReview}>{t('center.writeReview')}</AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{t('center.about')}</AppText>
              <AppText style={styles.description}>{isRTL ? center?.descriptionAr : center?.descriptionEn}</AppText>
            </View>

            {/* Contact */}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{t('center.contact')}</AppText>
              <View style={styles.contactRow}>
                <Ionicons name="business" size={20} color="#757575" />
                <AppText style={styles.infoLabel}>{t('center.details')}</AppText>
                <AppText style={styles.infoValue}>
                  {isRTL ? center?.nameAr : center?.nameEn}
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={handleChatWithCenter}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2196F3" />
                <AppText style={styles.contactText}>{t('center.chatWithCenter')}</AppText>
              </TouchableOpacity>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#757575" />
                <AppText style={styles.infoLabel}>{t('center.call')}</AppText>
                <AppText style={styles.infoValue}>{center?.phone || 'N/A'}</AppText>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="navigate" size={20} color="#757575" />
                <AppText style={styles.infoLabel}>{t('center.directions')}</AppText>
                <AppText style={styles.infoValue}>{t('center.navigate')}</AppText>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="share-outline" size={20} color="#757575" />
                <AppText style={styles.infoLabel}>{t('center.share')}</AppText>
                <AppText style={styles.infoValue}>Share functionality</AppText>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, isFavorite && styles.actionButtonFavorite]}
                onPress={handleFavoriteToggle}
                activeOpacity={0.7}
              >
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#E91E63' : '#757575'} />
                <AppText style={styles.actionText}>{isFavorite ? t('center.removeFromFavorites') : t('center.addToFavorites')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleBookNow}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={20} color="#2196F3" />
                <AppText style={styles.actionText}>{t('center.bookNow')}</AppText>
              </TouchableOpacity>
            </View>
           </>
         )}

        {/* Trust Badges */}
        {badges && badges.length > 0 && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>{t('center.trustBadges')}</AppText>
            <TrustBadgeList badges={badges} isRTL={isRTL} />
          </View>
        )}

        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <AppText style={styles.sectionTitle}>{t('center.reviews')}</AppText>
            {reviewsData && reviewsData.content.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push(`/(app)/(tabs)/centers/reviews?id=${centerId}`)}
              >
                <AppText style={styles.seeAllReviews}>{t('center.seeAllReviews')}</AppText>
              </TouchableOpacity>
            )}
          </View>
          {reviewsData && reviewsData.content.length > 0 ? (
            <>
              <FlatList
                data={reviewsData.content.slice(0, 3)}
                renderItem={({ item }) => (
                  <ReviewCard
                    key={item.id}
                    review={item}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.reviewsListContent}
              />
              {reviewsData.content.length > 3 && (
                <TouchableOpacity
                  style={styles.loadMoreReviews}
                  onPress={() => router.push(`/(app)/(tabs)/centers/reviews?id=${centerId}`)}
                >
                  <AppText style={styles.loadMoreReviewsText}>
                    {t('center.viewAllReviews', { count: reviewsData.content.length })}
                  </AppText>
                  <Ionicons name="chevron-forward" size={20} color="#2196F3" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="star-outline" size={48} color="#9E9E9E" />
              <AppText style={styles.noReviewsText}>{t('center.noReviews')}</AppText>
              <AppText style={styles.noReviewsSubtext}>{t('center.beFirstToReview')}</AppText>
              <TouchableOpacity
                style={styles.writeFirstReviewButton}
                onPress={handleWriteReview}
              >
                <AppText style={styles.writeFirstReviewButtonText}>{t('review.writeReview')}</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Review Modal */}
        {showReviewModal && (
          <Modal visible={showReviewModal} transparent animationType="fade" onRequestClose={() => setShowReviewModal(false)}>
            <View style={styles.modalContainer}>
              <AppText style={styles.modalTitle}>{t('center.writeReview')}</AppText>
              <View style={styles.ratingContainer}>
                <TouchableOpacity
                  style={[styles.ratingOption, reviewRating >= 1 && styles.ratingOptionSelected]}
                  onPress={() => setReviewRating(1)}
                >
                  <Ionicons name="star" size={24} color={reviewRating >= 1 ? '#FFC107' : '#E0E0E0'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingOption, reviewRating >= 2 && styles.ratingOptionSelected]}
                  onPress={() => setReviewRating(2)}
                >
                  <Ionicons name="star" size={24} color={reviewRating >= 2 ? '#FFC107' : '#E0E0E0'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingOption, reviewRating >= 3 && styles.ratingOptionSelected]}
                  onPress={() => setReviewRating(3)}
                >
                  <Ionicons name="star" size={24} color={reviewRating >= 3 ? '#FFC107' : '#E0E0E0'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingOption, reviewRating >= 4 && styles.ratingOptionSelected]}
                  onPress={() => setReviewRating(4)}
                >
                  <Ionicons name="star" size={24} color={reviewRating >= 4 ? '#FFC107' : '#E0E0E0'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ratingOption, reviewRating >= 5 && styles.ratingOptionSelected]}
                  onPress={() => setReviewRating(5)}
                >
                  <Ionicons name="star" size={24} color={reviewRating >= 5 ? '#FFC107' : '#E0E0E0'} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.reviewInput}
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder={t('review.placeholder')}
                placeholderTextColor="#9E9E9E"
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, !reviewRating && styles.modalButtonDisabled]}
                  onPress={handleSubmitReview}
                  disabled={!reviewRating}
                  activeOpacity={0.8}
                >
                  <AppText style={styles.modalButtonText}>{t('common.submit')}</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowReviewModal(false)}
                  activeOpacity={0.8}
                >
                  <AppText style={styles.modalButtonText}>{t('common.cancel')}</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  centerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  centerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  description: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 12,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  contactText: {
    fontSize: 14,
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonFavorite: {
    backgroundColor: '#E91E63',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  seeAllReviews: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  averageRating: {
    fontSize: 14,
    color: '#757575',
    marginRight: 8,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 12,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
    marginBottom: 16,
  },
  writeFirstReviewButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeFirstReviewButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  reviewsListContent: {
    paddingBottom: 20,
  },
  loadMoreReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreReviewsText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ratingOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  ratingOptionSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFC107',
  },
  reviewInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 8,
  },
  modalButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
