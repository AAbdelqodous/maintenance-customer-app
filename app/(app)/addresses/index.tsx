import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetAddressesQuery,
} from '../../../store/api/addressesApi';
import type { AddressLabel, ServiceAddress } from '../../../types/fulfillment';

const LABELS: AddressLabel[] = ['HOME', 'WORK', 'OTHER'];

// Spec 008 — manage saved service addresses (Home/Work/Other) reused across bookings.
export default function AddressesScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { data, isLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState<AddressLabel>('HOME');
  const [governorate, setGovernorate] = useState('');
  const [area, setArea] = useState('');
  const [note, setNote] = useState('');

  const save = async () => {
    if (!governorate.trim()) return;
    await createAddress({ label, governorate: governorate.trim(), area: area.trim() || undefined, note: note.trim() || undefined }).unwrap().catch(() => {});
    setAdding(false); setGovernorate(''); setArea(''); setNote('');
  };

  const remove = (a: ServiceAddress) => {
    if (a.id == null) return;
    const run = () => deleteAddress(a.id!).unwrap().catch(() => {});
    if (Platform.OS === 'web') { if (window.confirm(t('fulfillment.addresses.deleteConfirm'))) run(); } else run();
  };

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2196F3" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={data ?? []}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, isRTL && styles.rowRtl]}>
            <Ionicons name="location-outline" size={20} color="#2196F3" />
            <View style={styles.body}>
              <AppText style={styles.label}>{t(`fulfillment.label.${item.label}`)} · {item.governorate}</AppText>
              {!!(item.area || item.note) && <AppText style={styles.note}>{[item.area, item.note].filter(Boolean).join(' · ')}</AppText>}
            </View>
            <TouchableOpacity onPress={() => remove(item)} accessibilityRole="button">
              <Ionicons name="trash-outline" size={20} color="#C62828" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<AppText style={styles.empty}>{t('fulfillment.addresses.empty')}</AppText>}
        ListFooterComponent={
          adding ? (
            <View style={styles.form}>
              <View style={[styles.labelRow, isRTL && styles.rowRtl]}>
                {LABELS.map((l) => (
                  <TouchableOpacity key={l} style={[styles.chip, label === l && styles.chipActive]} onPress={() => setLabel(l)}>
                    <AppText style={[styles.chipText, label === l && styles.chipTextActive]}>{t(`fulfillment.label.${l}`)}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, isRTL && styles.inputRtl]} value={governorate} onChangeText={setGovernorate} placeholder={t('fulfillment.governorate')} placeholderTextColor="#9E9E9E" />
              <TextInput style={[styles.input, isRTL && styles.inputRtl]} value={area} onChangeText={setArea} placeholder={t('fulfillment.area')} placeholderTextColor="#9E9E9E" />
              <TextInput style={[styles.input, isRTL && styles.inputRtl]} value={note} onChangeText={setNote} placeholder={t('fulfillment.addressNote')} placeholderTextColor="#9E9E9E" />
              <TouchableOpacity style={[styles.saveBtn, (!governorate.trim() || creating) && styles.disabled]} onPress={save} disabled={!governorate.trim() || creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <AppText style={styles.saveText}>{t('fulfillment.saveAddress')}</AppText>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.addRow, isRTL && styles.rowRtl]} onPress={() => setAdding(true)}>
              <Ionicons name="add-circle-outline" size={22} color="#2196F3" />
              <AppText style={styles.addText}>{t('fulfillment.addAddress')}</AppText>
            </TouchableOpacity>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  rowRtl: { flexDirection: 'row-reverse' },
  body: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  note: { fontSize: 12, color: '#757575', marginTop: 2 },
  empty: { textAlign: 'center', color: '#9E9E9E', marginVertical: 24 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  addText: { fontSize: 15, color: '#2196F3', fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 10, marginTop: 6 },
  labelRow: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1A1A2E' },
  inputRtl: { textAlign: 'right' },
  saveBtn: { backgroundColor: '#2196F3', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
