import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import PhotoGrid from '../../../../components/bookings/PhotoGrid';
import { AppText } from '../../../../components/ui/AppText';
import { useGetCustomerMediaQuery } from '../../../../store/api/mediaApi';

export default function BookingPhotosScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const isRTL = i18n.dir() === 'rtl';
  const bookingId = Number(params.id);

  const { data, isLoading, isError } = useGetCustomerMediaQuery(bookingId, { skip: !bookingId });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('booking.photos.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <AppText style={styles.errorText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <PhotoGrid media={data ?? []} isRTL={isRTL} />
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
  content: {
    padding: 16,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
});
