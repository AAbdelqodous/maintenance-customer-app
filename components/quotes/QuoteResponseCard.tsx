import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../ui/AppText';
import RatingStars from '../ui/RatingStars';
import type { QuoteResponse } from '../../types/quoteRequests';

interface QuoteResponseCardProps {
  response: QuoteResponse;
  onAccept: (quoteId: number) => void;
  onAsk: (centerId: number) => void;
  accepting?: boolean;
  /** Disable actions when the request is no longer OPEN. */
  actionable?: boolean;
}

function formatKD(amount: number): string {
  return `KD ${Number(amount).toFixed(3)}`;
}

// Spec 009 US1/US2 — one center's competing quote.
export function QuoteResponseCard({
  response,
  onAccept,
  onAsk,
  accepting = false,
  actionable = true,
}: QuoteResponseCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const centerName = isRTL ? response.centerNameAr : response.centerNameEn;
  const fixedPrice = response.priceMin === response.priceMax;
  const priceLabel = fixedPrice
    ? formatKD(response.priceMin)
    : `${formatKD(response.priceMin)} – ${formatKD(response.priceMax)}`;

  const notSelected = response.state === 'NOT_SELECTED';
  const selected = response.state === 'SELECTED';

  return (
    <View style={[styles.card, notSelected && styles.cardMuted]}>
      <View style={styles.headerRow}>
        <View style={styles.centerInfo}>
          <AppText style={styles.centerName} numberOfLines={1}>
            {centerName}
          </AppText>
          <View style={styles.metaRow}>
            <RatingStars rating={response.rating} size={13} />
            {response.trustScore != null && (
              <View style={styles.trustBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#2E7D32" />
                <AppText style={styles.trustText}>{response.trustScore}</AppText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.priceBox}>
          <AppText style={styles.price}>{priceLabel}</AppText>
          {response.estimatedDurationMinutes != null && (
            <AppText style={styles.duration}>
              {t('quoteRequests.response.duration', { minutes: response.estimatedDurationMinutes })}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.detailRow}>
        {response.distance != null && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#757575" />
            <AppText style={styles.detailText}>{response.distance.toFixed(1)} km</AppText>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color="#757575" />
          <AppText style={styles.detailText}>
            {t('quoteRequests.response.respondedAt', {
              when: new Date(response.respondedAt).toLocaleDateString(isRTL ? 'ar' : 'en'),
            })}
          </AppText>
        </View>
      </View>

      {!!response.inclusions && (
        <AppText style={styles.inclusions} numberOfLines={2}>
          {t('quoteRequests.response.includes')}: {response.inclusions}
        </AppText>
      )}
      {!!response.message && <AppText style={styles.message}>“{response.message}”</AppText>}

      {selected ? (
        <View style={styles.selectedBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
          <AppText style={styles.selectedText}>{t('quoteRequests.detail.accept')}</AppText>
        </View>
      ) : notSelected ? (
        <AppText style={styles.notSelectedText}>{t('quoteRequests.response.notSelected')}</AppText>
      ) : (
        actionable && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.askButton}
              onPress={() => onAsk(response.centerId)}
              accessibilityRole="button"
              accessibilityLabel={t('quoteRequests.detail.ask')}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#2196F3" />
              <AppText style={styles.askText}>{t('quoteRequests.detail.ask')}</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]}
              onPress={() => onAccept(response.id)}
              disabled={accepting}
              accessibilityRole="button"
              accessibilityLabel={t('quoteRequests.detail.accept')}
            >
              <AppText style={styles.acceptText}>
                {accepting ? t('quoteRequests.detail.accepting') : t('quoteRequests.detail.accept')}
              </AppText>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardMuted: { opacity: 0.6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  centerInfo: { flex: 1, marginRight: 12 },
  centerName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trustText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  priceBox: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700', color: '#1565C0' },
  duration: { fontSize: 12, color: '#757575', marginTop: 2 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#757575' },
  inclusions: { fontSize: 13, color: '#424242', marginTop: 10 },
  message: { fontSize: 13, color: '#616161', fontStyle: 'italic', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  askText: { color: '#2196F3', fontWeight: '600', fontSize: 14 },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: { opacity: 0.6 },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectedText: { color: '#2E7D32', fontWeight: '600', fontSize: 14 },
  notSelectedText: { color: '#9E9E9E', fontSize: 13, marginTop: 12, fontWeight: '500' },
});
