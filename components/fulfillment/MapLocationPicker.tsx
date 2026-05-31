import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { AppText } from '../ui/AppText';

// Spec 008 (R5) — capture a precise service-address location. `expo-location` ("use my location" +
// reverse geocoding) works in Expo Go and on web. The visual `react-native-maps` pin only renders in
// a dev client / production build that has a Google Maps API key, so it is gated behind
// EXPO_PUBLIC_ENABLE_MAPS — everywhere else (Expo Go, web, no key) gracefully falls back to the
// GPS button + the form's manual entry, and never tries to mount the native map view.
export interface PickedLocation {
  lat: number;
  lng: number;
  governorate?: string;
  area?: string;
}

const MAPS_ENABLED = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_ENABLE_MAPS === 'true';
let MapView: any = null;
let Marker: any = null;
if (MAPS_ENABLED) {
  try {
    // Required lazily so the native module is only touched when explicitly enabled.
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch {
    MapView = null;
  }
}

const KUWAIT = { latitude: 29.3759, longitude: 47.9774 };

async function reverse(lat: number, lng: number): Promise<Partial<PickedLocation>> {
  try {
    const [g] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!g) return {};
    return {
      governorate: g.region ?? g.subregion ?? g.city ?? undefined,
      area: g.district ?? g.street ?? undefined,
    };
  } catch {
    return {};
  }
}

export function MapLocationPicker({
  value,
  onChange,
}: {
  value?: { lat?: number; lng?: number };
  onChange: (loc: PickedLocation) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lat = value?.lat;
  const lng = value?.lng;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  const useCurrent = async () => {
    setError(null);
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('fulfillment.locationDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const la = pos.coords.latitude;
      const lo = pos.coords.longitude;
      onChange({ lat: la, lng: lo, ...(await reverse(la, lo)) });
    } catch {
      setError(t('fulfillment.locationError'));
    } finally {
      setBusy(false);
    }
  };

  const onMapPick = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onChange({ lat: latitude, lng: longitude, ...(await reverse(latitude, longitude)) });
  };

  const region = {
    latitude: hasCoords ? (lat as number) : KUWAIT.latitude,
    longitude: hasCoords ? (lng as number) : KUWAIT.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.wrap}>
      {MAPS_ENABLED && MapView ? (
        <View style={styles.mapBox}>
          <MapView
            style={styles.map}
            initialRegion={region}
            region={hasCoords ? region : undefined}
            onPress={onMapPick}
          >
            {hasCoords && (
              <Marker
                draggable
                coordinate={{ latitude: lat as number, longitude: lng as number }}
                onDragEnd={onMapPick}
              />
            )}
          </MapView>
          <AppText style={styles.mapHint}>{t('fulfillment.pinHint')}</AppText>
        </View>
      ) : null}

      <TouchableOpacity style={styles.locBtn} onPress={useCurrent} disabled={busy} accessibilityRole="button">
        {busy ? <ActivityIndicator color="#2196F3" /> : <Ionicons name="locate" size={18} color="#2196F3" />}
        <AppText style={styles.locText}>{t('fulfillment.useMyLocation')}</AppText>
      </TouchableOpacity>

      {hasCoords && (
        <View style={styles.coordsRow}>
          <Ionicons name="pin" size={14} color="#2E7D32" />
          <AppText style={styles.coordsText}>
            {(lat as number).toFixed(5)}, {(lng as number).toFixed(5)}
          </AppText>
        </View>
      )}
      {!!error && <AppText style={styles.err}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  mapBox: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#ECEFF1' },
  map: { width: '100%', height: 180 },
  mapHint: { fontSize: 12, color: '#757575', paddingHorizontal: 10, paddingVertical: 6 },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#2196F3', borderRadius: 10, paddingVertical: 10,
  },
  locText: { color: '#2196F3', fontWeight: '600', fontSize: 14 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  coordsText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  err: { fontSize: 12, color: '#C62828', textAlign: 'center' },
});
