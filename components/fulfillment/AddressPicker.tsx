import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { useCreateAddressMutation, useGetAddressesQuery } from '../../store/api/addressesApi';
import type { AddressLabel, ServiceAddress } from '../../types/fulfillment';

const LABELS: AddressLabel[] = ['HOME', 'WORK', 'OTHER'];

// Spec 008 — pick a saved service address or add one. Map pin is optional (manual lat/lng); on web
// and when location is unavailable this degrades to area + manual address (R5).
export function AddressPicker({
  serviceAreaGovernorates,
  selected,
  onSelect,
}: {
  serviceAreaGovernorates: string[];
  selected: ServiceAddress | null;
  onSelect: (address: ServiceAddress) => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { data: saved, isLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creating }] = useCreateAddressMutation();

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState<AddressLabel>('HOME');
  const [governorate, setGovernorate] = useState('');
  const [area, setArea] = useState('');
  const [note, setNote] = useState('');

  const outOfArea = (g: string) => serviceAreaGovernorates.length > 0 && !serviceAreaGovernorates.includes(g);

  const saveNew = async () => {
    if (!governorate.trim()) return;
    const body: ServiceAddress = { label, governorate: governorate.trim(), area: area.trim() || undefined, note: note.trim() || undefined };
    try {
      const created = await createAddress(body).unwrap();
      onSelect(created);
      setAdding(false);
      setGovernorate(''); setArea(''); setNote('');
    } catch {
      // surfaced by the caller's error handling
    }
  };

  if (isLoading) return <ActivityIndicator style={{ marginVertical: 16 }} color="#2196F3" />;

  return (
    <View style={styles.wrap}>
      {(saved ?? []).map((addr) => {
        const active = selected?.id === addr.id;
        const ooa = outOfArea(addr.governorate);
        return (
          <TouchableOpacity
            key={addr.id}
            style={[styles.card, active && styles.cardActive, isRTL && styles.rowRtl]}
            onPress={() => onSelect(addr)}
            disabled={ooa}
          >
            <Ionicons name="location-outline" size={20} color={active ? '#2196F3' : '#616161'} />
            <View style={styles.body}>
              <AppText style={styles.label}>{t(`fulfillment.label.${addr.label}`)} · {addr.governorate}</AppText>
              {!!(addr.area || addr.note) && <AppText style={styles.note} numberOfLines={1}>{[addr.area, addr.note].filter(Boolean).join(' · ')}</AppText>}
              {ooa && <AppText style={styles.ooa}>{t('fulfillment.outOfArea')}</AppText>}
            </View>
            <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? '#2196F3' : '#BDBDBD'} />
          </TouchableOpacity>
        );
      })}

      {!adding ? (
        <TouchableOpacity style={[styles.addRow, isRTL && styles.rowRtl]} onPress={() => setAdding(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
          <AppText style={styles.addText}>{t('fulfillment.addAddress')}</AppText>
        </TouchableOpacity>
      ) : (
        <View style={styles.form}>
          <View style={[styles.labelRow, isRTL && styles.rowRtl]}>
            {LABELS.map((l) => (
              <TouchableOpacity key={l} style={[styles.labelChip, label === l && styles.labelChipActive]} onPress={() => setLabel(l)}>
                <AppText style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{t(`fulfillment.label.${l}`)}</AppText>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, isRTL && styles.inputRtl, governorate && outOfArea(governorate) && styles.inputWarn]} value={governorate} onChangeText={setGovernorate} placeholder={t('fulfillment.governorate')} placeholderTextColor="#9E9E9E" />
          {!!governorate && outOfArea(governorate) && <AppText style={styles.ooa}>{t('fulfillment.outOfArea')}</AppText>}
          <TextInput style={[styles.input, isRTL && styles.inputRtl]} value={area} onChangeText={setArea} placeholder={t('fulfillment.area')} placeholderTextColor="#9E9E9E" />
          <TextInput style={[styles.input, isRTL && styles.inputRtl]} value={note} onChangeText={setNote} placeholder={t('fulfillment.addressNote')} placeholderTextColor="#9E9E9E" />
          <View style={[styles.formActions, isRTL && styles.rowRtl]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAdding(false)}><AppText style={styles.cancelText}>{t('common.cancel')}</AppText></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, (!governorate.trim() || creating) && styles.disabled]} onPress={saveNew} disabled={!governorate.trim() || creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <AppText style={styles.saveText}>{t('fulfillment.saveAddress')}</AppText>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: 'transparent' },
  cardActive: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  rowRtl: { flexDirection: 'row-reverse' },
  body: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  note: { fontSize: 12, color: '#757575', marginTop: 2 },
  ooa: { fontSize: 12, color: '#C62828', marginTop: 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  addText: { fontSize: 15, color: '#2196F3', fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 10 },
  labelRow: { flexDirection: 'row', gap: 8 },
  labelChip: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  labelChipActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  labelChipText: { fontSize: 13, color: '#555' },
  labelChipTextActive: { color: '#fff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1A1A2E' },
  inputRtl: { textAlign: 'right' },
  inputWarn: { borderColor: '#EF9A9A' },
  formActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelText: { color: '#555', fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2196F3', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
