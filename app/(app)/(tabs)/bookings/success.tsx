import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { formatKD } from '../../../../lib/money';

export default function BookingSuccessScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const bookingNumber = params.bookingNumber as string;
  const centerName = params.centerName as string;
  const depositAmount = params.depositAmount ? Number(params.depositAmount) : 0;


  const handleViewBooking = () => {
    router.push('/(app)/(tabs)/bookings');
  };

  const handleBookAnother = () => {
    router.push('/(app)/(tabs)/centers');
  };

  const handleShare = () => {
    // Implement share functionality
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={120} color="#4CAF50" />
          </View>
          <View style={styles.confettiContainer}>
            <Ionicons name="star" size={30} color="#FFD700" style={styles.confetti1} />
            <Ionicons name="star" size={24} color="#FFC107" style={styles.confetti2} />
            <Ionicons name="star" size={20} color="#FF9800" style={styles.confetti3} />
          </View>
        </View>

        <AppText style={styles.title}>{t('booking.bookingConfirmed')}</AppText>
        <AppText style={styles.subtitle}>
          {t('booking.bookingConfirmedMessage', { center: centerName })}
        </AppText>

        <View style={styles.bookingNumberCard}>
          <AppText style={styles.bookingNumberLabel}>{t('booking.bookingNumber')}</AppText>
          <AppText style={styles.bookingNumberValue}>{bookingNumber}</AppText>
        </View>

        {depositAmount > 0 && (
          <View style={styles.depositCard}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#7B1FA2" />
            <View style={styles.depositTextWrap}>
              <AppText style={styles.depositTitle}>
                {t('booking.depositRequired')} · {formatKD(depositAmount, i18n.dir() === 'rtl' ? 'ar' : 'en')}
              </AppText>
              <AppText style={styles.depositNote}>{t('booking.depositNote')}</AppText>
            </View>
          </View>
        )}

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <AppText style={styles.infoText}>{t('booking.confirmationEmail')}</AppText>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="notifications" size={20} color="#2196F3" />
            <AppText style={styles.infoText}>{t('booking.reminderNotification')}</AppText>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <AppButton
            title={t('booking.viewBooking')}
            onPress={handleViewBooking}
            style={styles.primaryButton}
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBookAnother}>
            <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
            <AppText style={styles.secondaryButtonText}>{t('booking.bookAnother')}</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tertiaryButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#757575" />
            <AppText style={styles.tertiaryButtonText}>{t('booking.shareBooking')}</AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(app)/(tabs)/')}
        >
          <Ionicons name="home" size={20} color="#757575" />
          <AppText style={styles.backButtonText}>{t('navigation.home')}</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  successIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confettiContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  confetti1: {
    position: 'absolute',
    top: 0,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  confetti2: {
    position: 'absolute',
    top: 10,
    right: 10,
    transform: [{ rotate: '20deg' }],
  },
  confetti3: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    transform: [{ rotate: '-10deg' }],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  bookingNumberCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  bookingNumberLabel: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  bookingNumberValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  depositCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5EEF8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  depositTextWrap: {
    flex: 1,
  },
  depositTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7B1FA2',
  },
  depositNote: {
    fontSize: 12,
    color: '#9575CD',
    marginTop: 2,
  },
  infoContainer: {
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 12,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
});
