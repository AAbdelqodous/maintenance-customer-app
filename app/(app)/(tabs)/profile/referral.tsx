import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../../components/ui/AppText';
import { useGetReferralStatsQuery } from '../../../../store/api/referralApi';
import * as Clipboard from 'expo-clipboard';

export default function ReferralScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { data, isLoading } = useGetReferralStatsQuery();

  const handleShare = async () => {
    if (!data) return;
    const message = t('referral.shareMessage', { code: data.referralCode });

    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(data.shareUrl);
      Alert.alert('', t('loyalty.codeCopied'));
      return;
    }

    try {
      await Share.share({ message: `${message}\n${data.shareUrl}` });
    } catch {
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('referral.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <ScrollView style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !data ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <>
            <View style={styles.codeCard}>
              <AppText style={styles.codeLabel}>{t('referral.yourCode')}</AppText>
              <AppText style={styles.code}>{data.referralCode}</AppText>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#fff" />
                <AppText style={styles.shareBtnText}>{t('referral.share')}</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              {[
                { label: t('referral.total'), value: data.totalReferrals },
                { label: t('referral.completed'), value: data.completedReferrals },
                { label: t('referral.pending'), value: data.pendingReferrals },
                { label: t('referral.pointsEarned'), value: data.totalPointsEarned },
              ].map(({ label, value }) => (
                <View key={label} style={styles.statCard}>
                  <AppText style={styles.statValue}>{value}</AppText>
                  <AppText style={styles.statLabel}>{label}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>{t('referral.stats')}</AppText>
              {data.referrals.length === 0 ? (
                <AppText style={styles.emptyText}>{t('referral.noReferrals')}</AppText>
              ) : (
                data.referrals.map((entry, idx) => (
                  <View key={idx} style={[styles.entryRow, isRTL && styles.rowReverse]}>
                    <View style={styles.entryIcon}>
                      <Ionicons name="person-outline" size={20} color="#2196F3" />
                    </View>
                    <View style={styles.entryInfo}>
                      <AppText style={styles.entryName}>{entry.referredName}</AppText>
                      <AppText style={styles.entryDate}>{formatDate(entry.referredAt)}</AppText>
                    </View>
                    <View style={styles.entryRight}>
                      <AppText
                        style={[
                          styles.entryStatus,
                          entry.status === 'COMPLETED' && styles.statusCompleted,
                        ]}
                      >
                        {t(`referral.status.${entry.status}`)}
                      </AppText>
                      {entry.pointsEarned > 0 && (
                        <AppText style={styles.entryPoints}>+{entry.pointsEarned}</AppText>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  codeCard: {
    backgroundColor: '#2196F3',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  codeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  code: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 3, marginBottom: 20 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2196F3', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#757575', textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, margin: 16, marginTop: 0, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 12 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  entryIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  entryDate: { fontSize: 12, color: '#9E9E9E' },
  entryRight: { alignItems: 'flex-end' },
  entryStatus: { fontSize: 12, color: '#FF9800', fontWeight: '600' },
  statusCompleted: { color: '#4CAF50' },
  entryPoints: { fontSize: 13, color: '#4CAF50', fontWeight: '700' },
});
