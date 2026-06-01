import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { PaymentMethod, useCreateBookingMutation } from '../../../../store/api/bookingsApi';
import { useGetCenterByIdQuery } from '../../../../store/api/centersApi';
import type { FulfillmentMode } from '../../../../types/fulfillment';

interface BookingSummary {
  centerId: number;
  categoryId: number;
  serviceId: number;
  categoryNameEn: string;
  categoryNameAr: string;
  serviceNameEn: string;
  serviceNameAr: string;
  bookingDate: string;
  bookingTime: string;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  serviceDescription?: string;
  specialInstructions?: string;
}

export default function BookingConfirmationScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isRTL = i18n.dir() === 'rtl';

  const bookingData: BookingSummary = {
    centerId: Number(params.centerId),
    categoryId: Number(params.categoryId),
    serviceId: Number(params.serviceId),
    categoryNameEn: params.categoryNameEn as string ?? '',
    categoryNameAr: params.categoryNameAr as string ?? '',
    serviceNameEn: params.serviceNameEn as string ?? '',
    serviceNameAr: params.serviceNameAr as string ?? '',
    bookingDate: params.bookingDate as string,
    bookingTime: params.bookingTime as string,
    paymentMethod: params.paymentMethod as PaymentMethod,
    customerPhone: params.customerPhone as string,
    serviceDescription: (params.serviceDescription as string) || undefined,
    specialInstructions: (params.specialInstructions as string) || undefined,
  };

  const { data: center } = useGetCenterByIdQuery(bookingData.centerId);
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation();

  const paymentMethods: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: t('booking.paymentMethod.cash'),
    [PaymentMethod.KNET]: t('booking.paymentMethod.knet'),
    [PaymentMethod.CREDIT_CARD]: t('booking.paymentMethod.credit_card'),
  };

  const handleEdit = () => {
    router.back();
  };

  const handleConfirm = async () => {
    try {
      const result = await createBooking({
        centerId: bookingData.centerId,
        categoryId: bookingData.categoryId,
        serviceId: bookingData.serviceId,
        serviceDescription: bookingData.serviceDescription,
        bookingDate: bookingData.bookingDate,
        bookingTime: bookingData.bookingTime,
        paymentMethod: bookingData.paymentMethod,
        customerPhone: bookingData.customerPhone,
        specialInstructions: bookingData.specialInstructions,
        // Spec 008 — carry the chosen fulfillment (collected on the review step).
        fulfillmentMode: (params.fulfillmentMode as FulfillmentMode) || undefined,
        serviceAddressId: params.serviceAddressId ? Number(params.serviceAddressId) : undefined,
        pickupWindow: params.pickupWindow ? JSON.parse(params.pickupWindow as string) : undefined,
      }).unwrap();

      router.push({
        pathname: '/(app)/(tabs)/bookings/success',
        params: {
          bookingId: String(result.id),
          bookingNumber: result.bookingNumber ?? String(result.id),
          centerName: centerName,
          depositAmount: result.depositAmount ? String(result.depositAmount) : '',
        },
      });
    } catch (err: any) {
      const message = err?.data?.error || err?.data?.businessErrorDescription || t('common.retry');
      Alert.alert(t('common.error'), message);
    }
  };

  const centerName = center ? (isRTL ? center.nameAr : center.nameEn) : '';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>{t('booking.confirmation')}</AppText>
          <AppText style={styles.headerSubtitle}>{t('booking.confirmationSubtitle')}</AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={28} color="#2196F3" />
            </View>
            <View style={styles.cardHeaderContent}>
              <AppText style={styles.cardTitle}>{t('booking.center')}</AppText>
              <AppText style={styles.cardValue}>{centerName}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="settings" size={28} color="#FF9800" />
            </View>
            <View style={styles.cardHeaderContent}>
              <AppText style={styles.cardTitle}>{t('booking.serviceLabel')}</AppText>
              <AppText style={styles.cardValue}>
                {isRTL ? bookingData.serviceNameAr : bookingData.serviceNameEn}
              </AppText>
            </View>
          </View>
          {bookingData.serviceDescription && (
            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>{t('booking.description')}</AppText>
              <AppText style={styles.sectionValue}>{bookingData.serviceDescription}</AppText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="calendar" size={28} color="#4CAF50" />
            </View>
            <View style={styles.cardHeaderContent}>
              <AppText style={styles.cardTitle}>{t('booking.appointment')}</AppText>
            </View>
          </View>
          <View style={styles.section}>
            <AppText style={styles.sectionLabel}>{t('booking.date')}</AppText>
            <AppText style={styles.sectionValue}>{bookingData.bookingDate}</AppText>
          </View>
          <View style={styles.section}>
            <AppText style={styles.sectionLabel}>{t('booking.time')}</AppText>
            <AppText style={styles.sectionValue}>{bookingData.bookingTime}</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="wallet" size={28} color="#E91E63" />
            </View>
            <View style={styles.cardHeaderContent}>
              <AppText style={styles.cardTitle}>{t('booking.paymentMethodLabel')}</AppText>
              <AppText style={styles.cardValue}>{paymentMethods[bookingData.paymentMethod]}</AppText>
            </View>
          </View>
        </View>

        {bookingData.specialInstructions && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="document-text" size={28} color="#2196F3" />
              </View>
              <View style={styles.cardHeaderContent}>
                <AppText style={styles.cardTitle}>{t('booking.notes')}</AppText>
              </View>
            </View>
            <AppText style={styles.notesValue}>{bookingData.specialInstructions}</AppText>
          </View>
        )}

        <View style={styles.termsSection}>
          <AppText style={styles.termsText}>{t('booking.termsAndConditions')}</AppText>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title={creating ? t('common.loading') : t('booking.confirm')}
            onPress={handleConfirm}
            style={styles.confirmButton}
            disabled={creating}
          />
          <TouchableOpacity onPress={handleEdit} style={styles.editButton} disabled={creating}>
            <AppText style={styles.editButtonText}>{t('booking.editDetails')}</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  section: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  notesValue: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginTop: 8,
  },
  termsSection: {
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  confirmButton: {
    marginBottom: 12,
  },
  editButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});
