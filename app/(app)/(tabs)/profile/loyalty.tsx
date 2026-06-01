import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import PointsProgressBar from '../../../../components/loyalty/PointsProgressBar';
import TierBadge from '../../../../components/loyalty/TierBadge';
import { AppButton } from '../../../../components/ui/AppButton';
import { AppText } from '../../../../components/ui/AppText';
import { TIER_COLORS, useGetLoyaltyAccountQuery } from '../../../../store/api/loyaltyApi';

export default function LoyaltyScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.dir() === 'rtl';

  const { data: account, isLoading } = useGetLoyaltyAccountQuery();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar-KW' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: t('loyalty.title'),
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
        ) : !account ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('common.error')}</AppText>
          </View>
        ) : (
          <>
            <View style={[styles.hero, { backgroundColor: TIER_COLORS[account.tier] }]}>
              <View style={[styles.heroTop, isRTL && styles.rowReverse]}>
                <View>
                  <AppText style={styles.heroPointsLabel}>{t('loyalty.availablePoints')}</AppText>
                  <AppText style={styles.heroPoints}>{account.totalPoints.toLocaleString()}</AppText>
                </View>
                <TierBadge tier={account.tier} size="large" />
              </View>
              <AppText style={styles.heroLifetime}>
                {t('loyalty.lifetimePoints')}: {account.lifetimePoints.toLocaleString()}
              </AppText>
              {account.tierProgress && (
                <PointsProgressBar progress={account.tierProgress} isRTL={isRTL} />
              )}
            </View>

            {account.expiringPoints && (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={18} color="#E65100" />
                <AppText style={styles.warningText}>
                  {t('loyalty.expiringWarning', {
                    points: account.expiringPoints.points,
                    date: formatDate(account.expiringPoints.expiresAt),
                  })}
                </AppText>
              </View>
            )}

            <View style={styles.buttonsRow}>
              <AppButton
                title={t('loyalty.viewRewards')}
                onPress={() => router.push('/(app)/(tabs)/profile/rewards')}
                style={styles.navBtn as any}
              />
              <AppButton
                title={t('loyalty.history')}
                onPress={() => router.push('/(app)/(tabs)/profile/loyalty-history')}
                variant="secondary"
                style={styles.navBtn as any}
              />
            </View>

            <View style={styles.infoCard}>
              <AppText style={styles.infoLabel}>{t('loyalty.tier')}</AppText>
              <AppText style={styles.infoValue}>
                {t(`loyalty.tiers.${account.tier}`)} · {account.tierMultiplier}×
              </AppText>
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
  hero: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  heroPointsLabel: { fontSize: 13, color: '#fff', opacity: 0.85, marginBottom: 4 },
  heroPoints: { fontSize: 36, fontWeight: '800', color: '#fff' },
  heroLifetime: { fontSize: 12, color: '#fff', opacity: 0.75, marginTop: 4 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: { fontSize: 13, color: '#E65100', flex: 1 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  navBtn: { flex: 1 },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: { fontSize: 14, color: '#757575' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
});
