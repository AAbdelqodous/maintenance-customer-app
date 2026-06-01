import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import VehicleCard from '../../../components/vehicles/VehicleCard';
import { AppText } from '../../../components/ui/AppText';
import { useDeleteVehicleMutation, useGetVehiclesQuery } from '../../../store/api/vehiclesApi';

export default function MyVehiclesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const { data: vehicles, isLoading } = useGetVehiclesQuery();
  const [deleteVehicle] = useDeleteVehicleMutation();

  const handleDelete = (id: number) => {
    const doDelete = () =>
      deleteVehicle(id)
        .unwrap()
        .then(() => Alert.alert('', t('vehicles.deleted')))
        .catch(() => Alert.alert(t('common.error'), t('common.retry')));

    if (Platform.OS === 'web') {
      if (window.confirm(t('vehicles.deleteConfirm'))) doDelete();
    } else {
      Alert.alert(t('vehicles.title'), t('vehicles.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('vehicles.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/vehicles/new')}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="add" size={24} color="#2196F3" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !vehicles || vehicles.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="car-outline" size={56} color="#BDBDBD" />
            <AppText style={styles.emptyTitle}>{t('vehicles.noVehicles')}</AppText>
            <AppText style={styles.emptyMsg}>{t('vehicles.noVehiclesMessage')}</AppText>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(app)/vehicles/new')}
            >
              <AppText style={styles.addBtnText}>{t('vehicles.addVehicle')}</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <VehicleCard
                vehicle={item}
                isRTL={isRTL}
                onPress={() =>
                  router.push({ pathname: '/(app)/vehicles/[id]', params: { id: String(item.id) } })
                }
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginTop: 16, marginBottom: 8 },
  emptyMsg: { fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: '#2196F3', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { padding: 16 },
});
