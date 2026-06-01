import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { UserVehicle } from '../../store/api/vehiclesApi';

interface Props {
  vehicle: UserVehicle;
  onPress: () => void;
  isRTL: boolean;
}

export default function VehicleCard({ vehicle, onPress, isRTL }: Props) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.row, isRTL && styles.rowReverse]}>
        <View style={styles.iconCircle}>
          <Ionicons name="car-outline" size={24} color="#2196F3" />
        </View>
        <View style={styles.info}>
          <View style={[styles.nameRow, isRTL && styles.rowReverse]}>
            <AppText style={styles.name}>
              {vehicle.make} {vehicle.model}
            </AppText>
            {vehicle.isPrimary && (
              <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
            )}
          </View>
          <AppText style={styles.meta}>
            {vehicle.year}
            {vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ''}
            {vehicle.color ? ` · ${vehicle.color}` : ''}
          </AppText>
          {vehicle.currentMileage && (
            <AppText style={styles.mileage}>
              {vehicle.currentMileage.toLocaleString()} km
            </AppText>
          )}
        </View>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={20}
          color="#9E9E9E"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowReverse: { flexDirection: 'row-reverse' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  name: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  starIcon: { marginLeft: 4 },
  meta: { fontSize: 13, color: '#757575', marginBottom: 2 },
  mileage: { fontSize: 12, color: '#9E9E9E' },
});
