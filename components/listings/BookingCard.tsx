import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Booking, BookingStatus, getBookingServiceLabel } from '../../store/api/bookingsApi';
import { AppText } from '../ui/AppText';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const centerName = isRTL ? booking.centerNameAr : booking.centerNameEn;
  const serviceLabel = getBookingServiceLabel(booking, t, isRTL);
  const isLegacy = !booking.service;

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return '#FF9800';
      case BookingStatus.CONFIRMED:
        return '#2196F3';
      case BookingStatus.IN_PROGRESS:
        return '#9C27B0';
      case BookingStatus.COMPLETED:
        return '#4CAF50';
      case BookingStatus.CANCELLED:
        return '#757575';
      case BookingStatus.REJECTED:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const handlePress = () => {
    router.push({ pathname: '/(app)/(tabs)/bookings/[id]', params: { id: String(booking.id) } });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText style={styles.centerName} numberOfLines={1}>
            {centerName}
          </AppText>
          <View style={styles.serviceLabelRow}>
            <AppText style={styles.serviceType}>{serviceLabel}</AppText>
            {isLegacy && (
              <View style={styles.legacyBadge}>
                <AppText style={styles.legacyBadgeText}>{t('booking.legacy.tag')}</AppText>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.bookingStatus) },
          ]}
        >
          <AppText style={styles.statusText}>
            {t(`booking.status.${booking.bookingStatus.toLowerCase()}`)}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <AppText style={styles.label}>{t('booking.date')}</AppText>
          <AppText style={styles.value}>
            {formatDate(booking.bookingDate)} at {booking.bookingTime}
          </AppText>
        </View>
        <View style={styles.row}>
          <AppText style={styles.label}>{t('booking.description')}</AppText>
          <AppText style={styles.value} numberOfLines={2}>
            {booking.serviceDescription}
          </AppText>
        </View>
        {booking.estimatedCost && (
          <View style={styles.row}>
            <AppText style={styles.label}>{t('booking.estimatedPrice')}</AppText>
            <AppText style={styles.price}>
              KD {booking.estimatedCost.toFixed(3)}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <AppText style={styles.bookingId}>
          {t('booking.id')}: #{booking.id}
        </AppText>
        <AppText style={styles.bookingDate}>
          {t('booking.bookedOn')}: {formatDate(booking.createdAt)}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 13,
    color: '#757575',
  },
  serviceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  legacyBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  legacyBadgeText: {
    fontSize: 10,
    color: '#757575',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  body: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#757575',
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookingId: {
    fontSize: 12,
    color: '#757575',
  },
  bookingDate: {
    fontSize: 12,
    color: '#757575',
  },
});
