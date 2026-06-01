import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { PaymentMethod, type SavedMethod } from '../../store/api/paymentsApi';

interface MethodPickerProps {
  available: PaymentMethod[];
  saved?: SavedMethod[];
  selectedMethod: PaymentMethod | null;
  selectedSavedId?: number | null;
  onSelectMethod: (m: PaymentMethod) => void;
  onSelectSaved?: (id: number) => void;
}

const METHOD_META: Record<PaymentMethod, { icon: keyof typeof Ionicons.glyphMap; key: string }> = {
  [PaymentMethod.KNET]: { icon: 'card-outline', key: 'payments.method.knet' },
  [PaymentMethod.CARD]: { icon: 'card-outline', key: 'payments.method.card' },
  [PaymentMethod.APPLE_PAY]: { icon: 'logo-apple', key: 'payments.method.applePay' },
  [PaymentMethod.GOOGLE_PAY]: { icon: 'logo-google', key: 'payments.method.googlePay' },
  [PaymentMethod.WALLET]: { icon: 'wallet-outline', key: 'payments.method.wallet' },
};

// Spec 007 — renders only the methods the gateway/device supports + saved (masked) cards.
export function MethodPicker({
  available,
  saved = [],
  selectedMethod,
  selectedSavedId,
  onSelectMethod,
  onSelectSaved,
}: MethodPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {available
        .filter((m) => m !== PaymentMethod.WALLET) // wallet handled by a separate toggle (US3)
        .map((m) => {
          const meta = METHOD_META[m];
          const selected = selectedMethod === m && selectedSavedId == null;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => onSelectMethod(m)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Ionicons name={meta.icon} size={20} color={selected ? '#1565C0' : '#616161'} />
              <AppText style={[styles.label, selected && styles.labelSelected]}>{t(meta.key)}</AppText>
              {selected && <Ionicons name="checkmark-circle" size={20} color="#2196F3" />}
            </TouchableOpacity>
          );
        })}

      {saved.map((card) => {
        const selected = selectedSavedId === card.id;
        return (
          <TouchableOpacity
            key={`saved-${card.id}`}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => onSelectSaved?.(card.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Ionicons name="card" size={20} color={selected ? '#1565C0' : '#616161'} />
            <AppText style={[styles.label, selected && styles.labelSelected]}>
              {card.brand} {card.maskedLabel}
            </AppText>
            {selected && <Ionicons name="checkmark-circle" size={20} color="#2196F3" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  label: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  labelSelected: { color: '#1565C0' },
});
