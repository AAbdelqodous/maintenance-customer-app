import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { MaintenanceReminder, ReminderStatus } from '../../store/api/remindersApi';

interface Props {
  reminder: MaintenanceReminder;
  isRTL: boolean;
  onComplete: (id: number) => void;
  isCompleting: boolean;
}

const STATUS_COLORS: Record<ReminderStatus, string> = {
  OVERDUE: '#F44336',
  DUE_SOON: '#FF9800',
  UPCOMING: '#9E9E9E',
};

export default function ReminderItem({ reminder, isRTL, onComplete, isCompleting }: Props) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[reminder.status];

  const dueDaysLabel = () => {
    if (reminder.daysUntilDue === undefined) return null;
    if (reminder.daysUntilDue < 0) {
      return t('vehicles.daysOverdue', { count: Math.abs(reminder.daysUntilDue) });
    }
    return t('vehicles.daysLeft', { count: reminder.daysUntilDue });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.row, isRTL && styles.rowReverse]}>
      <TouchableOpacity
        onPress={() => !isCompleting && onComplete(reminder.id)}
        style={styles.checkbox}
        disabled={isCompleting}
      >
        {isCompleting ? (
          <ActivityIndicator size="small" color="#2196F3" />
        ) : (
          <Ionicons name="checkbox-outline" size={24} color={color} />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <AppText style={[styles.name, { color }]}>{reminder.name}</AppText>
        {reminder.dueDate && (
          <AppText style={styles.dueDate}>{formatDate(reminder.dueDate)}</AppText>
        )}
        {reminder.dueMileage && (
          <AppText style={styles.dueDate}>{reminder.dueMileage.toLocaleString()} km</AppText>
        )}
      </View>

      {dueDaysLabel() && (
        <AppText style={[styles.daysLabel, { color }]}>{dueDaysLabel()}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  checkbox: { padding: 2 },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  dueDate: { fontSize: 12, color: '#9E9E9E' },
  daysLabel: { fontSize: 12, fontWeight: '600' },
});
