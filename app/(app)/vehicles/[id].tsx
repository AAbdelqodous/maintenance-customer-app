import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { useGetVehicleDashboardQuery } from '../../../store/api/vehiclesApi';

export default function VehicleDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleId = Number(params.id);
  const isRTL = i18n.dir() === 'rtl';

  const { data, isLoading } = useGetVehicleDashboardQuery(vehicleId, { skip: !vehicleId });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <AppText style={styles.errorText}>{t('common.error')}</AppText>
      </View>
    );
  }

  const { vehicle, stats, upcomingReminders, recentServices } = data;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${vehicle.make} ${vehicle.model}`,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.statsRow}>
          {[
            { label: t('vehicles.totalServices'), value: String(stats.totalServices) },
            { label: t('vehicles.totalSpent'), value: `KD ${stats.totalSpentKD.toFixed(3)}` },
            {
              label: t('vehicles.lastService'),
              value: stats.lastServiceDate ? formatDate(stats.lastServiceDate) : '—',
            },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <AppText style={styles.statValue}>{value}</AppText>
              <AppText style={styles.statLabel}>{label}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
            <AppText style={styles.sectionTitle}>{t('vehicles.reminders')}</AppText>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(app)/vehicles/reminders',
                  params: { id: String(vehicleId) },
                })
              }
            >
              <AppText style={styles.seeAll}>{t('vehicles.viewReminders')}</AppText>
            </TouchableOpacity>
          </View>
          {upcomingReminders.length === 0 ? (
            <AppText style={styles.emptyText}>{t('vehicles.noReminders')}</AppText>
          ) : (
            upcomingReminders.map((r) => (
              <View key={r.id} style={[styles.reminderRow, isRTL && styles.rowReverse]}>
                <Ionicons name="notifications-outline" size={16} color="#FF9800" />
                <AppText style={styles.reminderName}>{r.name}</AppText>
                {r.daysUntilDue !== undefined && (
                  <AppText style={[styles.reminderDays, r.daysUntilDue < 0 && styles.overdue]}>
                    {r.daysUntilDue < 0
                      ? t('vehicles.daysOverdue', { count: Math.abs(r.daysUntilDue) })
                      : t('vehicles.daysLeft', { count: r.daysUntilDue })}
                  </AppText>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>{t('booking.bookingDetails')}</AppText>
          {recentServices.length === 0 ? (
            <AppText style={styles.emptyText}>{t('vehicles.noHistory')}</AppText>
          ) : (
            recentServices.map((s) => (
              <View key={s.bookingId} style={styles.serviceRow}>
                <AppText style={styles.serviceName}>
                  {i18n.language === 'ar' ? s.centerNameAr : s.centerNameEn}
                </AppText>
                <AppText style={styles.serviceDate}>{formatDate(s.completedAt)}</AppText>
                {s.amountKD && (
                  <AppText style={styles.serviceAmount}>KD {s.amountKD.toFixed(3)}</AppText>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#F44336' },
  statsRow: { flexDirection: 'row', gap: 8, padding: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#2196F3', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#757575', textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, margin: 16, marginTop: 0, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  seeAll: { fontSize: 13, color: '#2196F3' },
  emptyText: { fontSize: 13, color: '#9E9E9E' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  reminderName: { flex: 1, fontSize: 14, color: '#1A1A2E' },
  reminderDays: { fontSize: 12, color: '#FF9800' },
  overdue: { color: '#F44336' },
  serviceRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  serviceName: { fontSize: 14, color: '#1A1A2E', marginBottom: 2 },
  serviceDate: { fontSize: 12, color: '#9E9E9E' },
  serviceAmount: { fontSize: 13, color: '#2196F3', fontWeight: '600', marginTop: 2 },
});
