import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { QuoteResponseCard } from '../../../components/quotes/QuoteResponseCard';
import { AppText } from '../../../components/ui/AppText';
import {
  useAcceptQuoteMutation,
  useCancelRequestMutation,
  useGetQuoteRequestQuery,
  useStartRequestChatMutation,
} from '../../../store/api/quoteRequestsApi';
import { SORT_KEYS, sortResponses } from '../../../lib/quoteSort';
import type { QuoteResponse, RequestSortKey } from '../../../types/quoteRequests';

const SORT_LABEL_KEY: Record<RequestSortKey, string> = {
  PRICE: 'quoteRequests.detail.sort.price',
  RATING: 'quoteRequests.detail.sort.rating',
  DISTANCE: 'quoteRequests.detail.sort.distance',
  SOONEST: 'quoteRequests.detail.sort.soonest',
};

// Spec 009 US1 — view a request's incoming quotes; US2 — accept one; chat to clarify.
export default function QuoteRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  // Poll for new quotes only while the request is still OPEN (stop once terminal).
  const [pollMs, setPollMs] = useState(4000);
  const { data, isLoading, isError, refetch } = useGetQuoteRequestQuery(requestId, {
    refetchOnFocus: true,
    pollingInterval: pollMs,
  });
  useEffect(() => {
    setPollMs(data && data.state !== 'OPEN' ? 0 : 4000);
  }, [data?.state]);

  const [acceptQuote, { isLoading: accepting }] = useAcceptQuoteMutation();
  const [startRequestChat] = useStartRequestChatMutation();
  const [cancelRequest] = useCancelRequestMutation();
  const [sortKey, setSortKey] = useState<RequestSortKey>('PRICE');

  const isOpen = data?.state === 'OPEN';

  const handleAccept = (quoteId: number) => {
    Alert.alert(
      t('quoteRequests.detail.accept'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('quoteRequests.detail.accept'),
          onPress: async () => {
            try {
              const res = await acceptQuote({ requestId, quoteId }).unwrap();
              router.replace(`/(app)/(tabs)/bookings/${res.acceptedBookingId}`);
            } catch {
              Alert.alert(t('quoteRequests.detail.responses'), t('errors.serverError'));
              refetch();
            }
          },
        },
      ],
    );
  };

  const handleAsk = async (centerId: number) => {
    try {
      const { conversationId } = await startRequestChat({ requestId, centerId }).unwrap();
      router.push(`/(app)/(tabs)/chat/${conversationId}`);
    } catch {
      Alert.alert(t('quoteRequests.detail.ask'), t('errors.serverError'));
    }
  };

  const handleCancel = () => {
    Alert.alert(t('quoteRequests.detail.cancel'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('quoteRequests.detail.cancel'),
        style: 'destructive',
        onPress: () => cancelRequest(requestId),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color="#9E9E9E" />
        <AppText style={styles.emptyText}>{t('errors.serverError')}</AppText>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <AppText style={styles.retryText}>{t('common.retry')}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // While OPEN, show only active quotes, sorted for comparison. Once decided
  // (ACCEPTED/EXPIRED/CANCELLED), show all non-withdrawn so the outcome is visible.
  const visible = isOpen
    ? sortResponses(data.responses, sortKey)
    : data.responses.filter((r) => r.state !== 'WITHDRAWN');
  const showSort = isOpen && visible.length >= 2;

  const renderHeader = () => (
    <View style={styles.header}>
      <AppText style={styles.category}>
        {isRTL ? data.categoryNameAr : data.categoryNameEn}
      </AppText>
      <AppText style={styles.description}>{data.description}</AppText>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="paper-plane-outline" size={14} color="#757575" />
          <AppText style={styles.metaText}>
            {data.reachCount === 1
              ? t('quoteRequests.compose.reachCountOne')
              : t('quoteRequests.compose.reachCount', { count: data.reachCount })}
          </AppText>
        </View>
        {isOpen && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#757575" />
            <AppText style={styles.metaText}>
              {t('quoteRequests.detail.countdown', {
                when: new Date(data.expiresAt).toLocaleDateString(isRTL ? 'ar' : 'en'),
              })}
            </AppText>
          </View>
        )}
      </View>

      {data.state === 'ACCEPTED' && (
        <TouchableOpacity
          style={[styles.banner, styles.bannerAccepted]}
          onPress={() => data.acceptedBookingId && router.replace(`/(app)/(tabs)/bookings/${data.acceptedBookingId}`)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
          <AppText style={styles.bannerText}>{t('quoteRequests.detail.viewBooking')}</AppText>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#2E7D32" />
        </TouchableOpacity>
      )}

      {data.state === 'CANCELLED' && (
        <View style={[styles.banner, styles.bannerClosed]}>
          <Ionicons name="close-circle-outline" size={18} color="#757575" />
          <AppText style={styles.bannerText}>{t('quoteRequests.detail.cancelledBanner')}</AppText>
        </View>
      )}

      {data.state === 'EXPIRED' && (
        <View style={styles.expiredBox}>
          <View style={styles.banner}>
            <Ionicons name="time-outline" size={18} color="#E65100" />
            <AppText style={styles.bannerText}>{t('quoteRequests.expired.title')}</AppText>
          </View>
          <View style={styles.expiredActions}>
            <TouchableOpacity style={styles.expiredBtn} onPress={() => router.replace('/(app)/quote-requests/new')}>
              <AppText style={styles.expiredBtnText}>{t('quoteRequests.expired.widen')}</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.expiredBtnAlt} onPress={() => router.replace('/(app)/(tabs)/centers')}>
              <AppText style={styles.expiredBtnAltText}>{t('quoteRequests.expired.bookDirectly')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AppText style={styles.responsesTitle}>{t('quoteRequests.detail.responses')}</AppText>
      {showSort && (
        <View style={styles.sortRow}>
          <AppText style={styles.sortLabel}>{t('quoteRequests.detail.sortBy')}:</AppText>
          {SORT_KEYS.map((key) => {
            const active = sortKey === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => setSortKey(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <AppText style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                  {t(SORT_LABEL_KEY[key])}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList<QuoteResponse>
        data={visible}
        keyExtractor={(r) => String(r.id)}
        renderItem={({ item }) => (
          <QuoteResponseCard
            response={item}
            onAccept={handleAccept}
            onAsk={handleAsk}
            accepting={accepting}
            actionable={isOpen}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyInline}>
            <ActivityIndicator color="#2196F3" />
            <AppText style={styles.emptyText}>{t('quoteRequests.detail.noResponsesYet')}</AppText>
          </View>
        }
      />
      {isOpen && (
        <TouchableOpacity style={styles.cancelBar} onPress={handleCancel}>
          <AppText style={styles.cancelText}>{t('quoteRequests.detail.cancel')}</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  listContent: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 8 },
  category: { fontSize: 13, color: '#2196F3', fontWeight: '700', textTransform: 'uppercase' },
  description: { fontSize: 16, color: '#1A1A2E', marginTop: 6, lineHeight: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#757575' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, marginTop: 16 },
  bannerAccepted: { backgroundColor: '#E8F5E9' },
  bannerClosed: { backgroundColor: '#EEEEEE' },
  bannerText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  expiredBox: { marginTop: 16, backgroundColor: '#FFF3E0', borderRadius: 12, padding: 6 },
  expiredActions: { flexDirection: 'row', gap: 10, padding: 8 },
  expiredBtn: { flex: 1, backgroundColor: '#2196F3', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  expiredBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  expiredBtnAlt: { flex: 1, borderWidth: 1, borderColor: '#2196F3', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  expiredBtnAltText: { color: '#2196F3', fontWeight: '700', fontSize: 14 },
  responsesTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginTop: 22, marginBottom: 4 },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 4 },
  sortLabel: { fontSize: 13, color: '#757575', fontWeight: '500' },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortChipActive: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  sortChipText: { fontSize: 13, color: '#616161', fontWeight: '500' },
  sortChipTextActive: { color: '#1565C0', fontWeight: '600' },
  emptyInline: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 15, color: '#757575', marginTop: 12, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  cancelBar: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  cancelText: { color: '#E53935', fontWeight: '600', fontSize: 15 },
});
