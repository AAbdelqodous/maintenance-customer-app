import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui/AppText';
import { LOGISTICS_STATES, type LogisticsStatus } from '../../types/fulfillment';

// Spec 008 — display-only logistics legs for a pickup/at-home booking. Center-driven; the client
// renders the current state + ETA and never advances. Decline shows a banner (re-choice handled above).
export function LogisticsTimeline({ status }: { status: LogisticsStatus }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (status.mode === 'DROP_OFF') return null;
  // Prefer the server's authoritative legs; fall back to the local map only if absent.
  const states = status.legs?.length ? status.legs : (LOGISTICS_STATES[status.mode] ?? []);
  const currentIdx = states.indexOf(status.currentState);

  return (
    <View style={styles.wrap}>
      <View style={[styles.headerRow, isRTL && styles.rowRtl]}>
        <AppText style={styles.title}>{t(`fulfillment.mode.${status.mode}`)}</AppText>
        {!!status.etaText && <AppText style={styles.eta}>{t('fulfillment.eta', { eta: status.etaText })}</AppText>}
      </View>

      {status.declined && (
        <View style={[styles.declineBanner, isRTL && styles.rowRtl]}>
          <Ionicons name="alert-circle" size={18} color="#C62828" />
          <AppText style={styles.declineText}>
            {t('fulfillment.declined')}{status.declineReason ? ` — ${status.declineReason}` : ''}
          </AppText>
        </View>
      )}

      {states.map((state, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx;
        return (
          <View key={state} style={[styles.row, isRTL && styles.rowRtl]}>
            <View style={styles.railCol}>
              <View style={[styles.dot, done && styles.dotDone, current && styles.dotCurrent]}>
                {done && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {idx < states.length - 1 && <View style={[styles.line, (done || current) && styles.lineDone]} />}
            </View>
            <AppText style={[styles.state, current && styles.stateCurrent, done && styles.stateDone]}>
              {t(`fulfillment.logistics.${state}`)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowRtl: { flexDirection: 'row-reverse' },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  eta: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  declineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10, marginBottom: 12 },
  declineText: { flex: 1, fontSize: 13, color: '#C62828', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  railCol: { alignItems: 'center', width: 22 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#BDBDBD', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  dotCurrent: { borderColor: '#2196F3', backgroundColor: '#2196F3' },
  line: { width: 2, height: 22, backgroundColor: '#E0E0E0' },
  lineDone: { backgroundColor: '#2E7D32' },
  state: { fontSize: 14, color: '#9E9E9E', paddingTop: 1, paddingBottom: 12 },
  stateCurrent: { color: '#1A1A2E', fontWeight: '700' },
  stateDone: { color: '#424242' },
});
