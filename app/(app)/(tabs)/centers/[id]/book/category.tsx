import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '../../../../../../components/ui/AppText';
import {
  ServiceCategoryResponse,
  useGetCenterCategoriesQuery,
} from '../../../../../../store/api/centerServicesApi';

export default function CategorySelectScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isRTL = i18n.dir() === 'rtl';

  const centerId = Number(id);
  const { data, isLoading, isError, error, refetch } =
    useGetCenterCategoriesQuery(centerId, { skip: !centerId });

  const isCenterGone =
    isError && ((error as any)?.status === 404 || (error as any)?.status === 410);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={56} color="#F44336" />
          <AppText style={styles.errorText}>
            {isCenterGone
              ? t('booking.categorySelect.centerUnavailable')
              : t('booking.categorySelect.error')}
          </AppText>
          {isCenterGone ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('booking.categorySelect.back')}
            >
              <AppText style={styles.actionButtonText}>
                {t('booking.categorySelect.back')}
              </AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => refetch()}
              accessibilityRole="button"
              accessibilityLabel={t('booking.categorySelect.retry')}
            >
              <AppText style={styles.actionButtonText}>
                {t('booking.categorySelect.retry')}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.centered}>
          <Ionicons name="construct-outline" size={56} color="#BDBDBD" />
          <AppText style={styles.emptyText}>
            {t('booking.categorySelect.empty')}
          </AppText>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {data.map((cat: ServiceCategoryResponse) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/bookings/new',
                params: { centerId: String(centerId), categoryId: String(cat.id) },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={isRTL ? cat.nameAr : cat.nameEn}
          >
            <View style={[styles.cardRow, isRTL && styles.cardRowRTL]}>
              <AppText style={styles.cardLabel}>
                {isRTL ? cat.nameAr : cat.nameEn}
              </AppText>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color="#9E9E9E"
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('booking.categorySelect.back')}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color="#1A1A2E"
          />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>
          {t('booking.categorySelect.title')}
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRowRTL: {
    flexDirection: 'row-reverse',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A2E',
    flex: 1,
  },
});
