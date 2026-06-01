import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import ReminderItem from '../../../components/vehicles/ReminderItem';
import { AppText } from '../../../components/ui/AppText';
import {
  MaintenanceReminder,
  ReminderStatus,
  useCompleteReminderMutation,
  useGetVehicleRemindersQuery,
} from '../../../store/api/remindersApi';

export default function VehicleRemindersScreen() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const vehicleId = Number(params.id);
  const isRTL = i18n.dir() === 'rtl';

  const { data: reminders, isLoading } = useGetVehicleRemindersQuery(vehicleId, { skip: !vehicleId });
  const [completeReminder] = useCompleteReminderMutation();
  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleComplete = async (reminderId: number) => {
    setCompletingId(reminderId);
    try {
      await completeReminder({ reminderId, vehicleId }).unwrap();
    } catch {
      Alert.alert(t('common.error'), t('common.retry'));
    } finally {
      setCompletingId(null);
    }
  };

  const groups: { status: ReminderStatus; label: string; color: string }[] = [
    { status: ReminderStatus.OVERDUE, label: t('vehicles.overdue'), color: '#F44336' },
    { status: ReminderStatus.DUE_SOON, label: t('vehicles.dueSoon'), color: '#FF9800' },
    { status: ReminderStatus.UPCOMING, label: t('vehicles.upcoming'), color: '#757575' },
  ];

  const grouped = (status: ReminderStatus): MaintenanceReminder[] =>
    (reminders ?? []).filter((r) => r.status === status && !r.isCompleted);

  const total = (reminders ?? []).filter((r) => !r.isCompleted).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('vehicles.reminders'),
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
        ) : total === 0 ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('vehicles.noReminders')}</AppText>
          </View>
        ) : (
          groups.map(({ status, label, color }) => {
            const items = grouped(status);
            if (items.length === 0) return null;
            return (
              <View key={status} style={styles.group}>
                <AppText style={[styles.groupHeader, { color }]}>{label}</AppText>
                {items.map((reminder) => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    isRTL={isRTL}
                    onComplete={handleComplete}
                    isCompleting={completingId === reminder.id}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  group: { marginBottom: 20 },
  groupHeader: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
