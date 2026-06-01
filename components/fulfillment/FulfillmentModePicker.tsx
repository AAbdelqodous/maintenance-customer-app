import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { formatKD } from '../../lib/money';
import { computeFee, type CenterFulfillmentCapability, type FulfillmentMode } from '../../types/fulfillment';

const ICON: Record<FulfillmentMode, keyof typeof Ionicons.glyphMap> = {
  DROP_OFF: 'business-outline',
  PICKUP_DELIVERY: 'car-outline',
  AT_HOME: 'home-outline',
};

// Spec 008 — choose the fulfillment mode. Offers only supported modes; the fee is shown per mode
// before the customer continues (FR-003). PER_KM without a known distance shows "from {base}".
export function FulfillmentModePicker({
  capability,
  selected,
  onSelect,
}: {
  capability: CenterFulfillmentCapability;
  selected: FulfillmentMode | null;
  onSelect: (mode: FulfillmentMode) => void;
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const locale = isRTL ? 'ar' : 'en';

  const feeLabel = (mode: FulfillmentMode): string => {
    const rule = capability.feeByMode[mode];
    if (!rule) return '';
    if (mode === 'DROP_OFF' || (rule.type === 'FLAT' && (rule.flatAmount ?? 0) === 0)) {
      return t('fulfillment.free');
    }
    const fee = computeFee(rule);
    if (fee != null) return formatKD(fee, locale);
    // PER_KM without a distance yet — show the base as a "from".
    return t('fulfillment.fromFee', { amount: formatKD(rule.baseAmount ?? 0, locale) });
  };

  return (
    <View style={styles.wrap}>
      {capability.supportedModes.map((mode) => {
        const active = selected === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.card, active && styles.cardActive, isRTL && styles.rowRtl]}
            onPress={() => onSelect(mode)}
            activeOpacity={0.8}
          >
            <Ionicons name={ICON[mode]} size={26} color={active ? '#2196F3' : '#616161'} />
            <View style={styles.body}>
              <AppText style={[styles.title, active && styles.titleActive]}>{t(`fulfillment.mode.${mode}`)}</AppText>
              <AppText style={styles.sub}>{t(`fulfillment.modeSub.${mode}`)}</AppText>
            </View>
            <View style={styles.right}>
              <AppText style={[styles.fee, mode === 'DROP_OFF' && styles.feeFree]}>{feeLabel(mode)}</AppText>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? '#2196F3' : '#BDBDBD'} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  cardActive: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  rowRtl: { flexDirection: 'row-reverse' },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  titleActive: { color: '#1565C0' },
  sub: { fontSize: 12, color: '#757575', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  fee: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  feeFree: { color: '#2E7D32' },
});
