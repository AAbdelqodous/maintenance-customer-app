import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import {
  useDeleteSavedMethodMutation,
  useGetSavedMethodsQuery,
  type SavedMethod,
} from '../../../store/api/paymentsApi';

// Spec 007 US4 — manage saved (tokenized) cards. Masked labels only — never PAN.
export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const { data: methods, isLoading } = useGetSavedMethodsQuery();
  const [deleteMethod] = useDeleteSavedMethodMutation();

  const confirmRemove = (m: SavedMethod) => {
    const doRemove = () => deleteMethod(m.id);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(t('wallet.remove'))) doRemove();
      return;
    }
    Alert.alert(t('wallet.remove'), `${m.brand} ${m.maskedLabel}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('wallet.remove'), style: 'destructive', onPress: doRemove },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <FlatList<SavedMethod>
      style={styles.list}
      contentContainerStyle={styles.content}
      data={methods ?? []}
      keyExtractor={(m) => String(m.id)}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Ionicons name="card" size={22} color="#1565C0" />
          <View style={styles.info}>
            <AppText style={styles.label}>
              {item.brand} {item.maskedLabel}
            </AppText>
            <AppText style={styles.expiry}>{item.expiry}</AppText>
          </View>
          <TouchableOpacity onPress={() => confirmRemove(item)} accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color="#C62828" />
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="card-outline" size={40} color="#9E9E9E" />
          <AppText style={styles.emptyText}>{t('wallet.empty')}</AppText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  info: { flex: 1 },
  label: { fontSize: 15, color: '#1A1A2E', fontWeight: '600' },
  expiry: { fontSize: 13, color: '#757575', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, color: '#757575' },
});
