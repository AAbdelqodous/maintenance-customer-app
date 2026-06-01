import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import WorkProgressTimeline from '../../../../components/bookings/WorkProgressTimeline';
import { AppText } from '../../../../components/ui/AppText';
import { useGetBookingProgressQuery } from '../../../../store/api/progressApi';

export default function BookingProgressScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const isRTL = i18n.dir() === 'rtl';
  const bookingId = Number(params.id);

  const { data, isLoading, isError } = useGetBookingProgressQuery(bookingId, {
    skip: !bookingId,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('booking.progress.title'),
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
        ) : isError || !data ? (
          <View style={styles.center}>
            <AppText style={styles.errorText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <WorkProgressTimeline data={data} isRTL={isRTL} />
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
    padding: 20,
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
