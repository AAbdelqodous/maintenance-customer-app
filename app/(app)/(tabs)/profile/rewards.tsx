import { Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import RewardCard from '../../../../components/loyalty/RewardCard';
import { AppText } from '../../../../components/ui/AppText';
import { useGetLoyaltyRewardsQuery } from '../../../../store/api/loyaltyApi';

export default function RewardsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { data: rewards, isLoading } = useGetLoyaltyRewardsQuery();

  return (
    <>
      <Stack.Screen
        options={{
          title: t('loyalty.rewardsTitle'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : !rewards || rewards.length === 0 ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('loyalty.noRewards')}</AppText>
          </View>
        ) : (
          <FlatList
            data={rewards}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <RewardCard reward={item} isRTL={isRTL} onRedeemed={() => {}} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9E9E9E' },
  list: { padding: 16 },
});
