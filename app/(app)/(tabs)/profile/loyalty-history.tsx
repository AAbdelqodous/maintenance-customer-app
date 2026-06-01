import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import TransactionRow from '../../../../components/loyalty/TransactionRow';
import { AppText } from '../../../../components/ui/AppText';
import { LoyaltyTransaction, useGetLoyaltyTransactionsQuery } from '../../../../store/api/loyaltyApi';

const PAGE_SIZE = 20;

export default function LoyaltyHistoryScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [page, setPage] = useState(0);
  const [allTransactions, setAllTransactions] = useState<LoyaltyTransaction[]>([]);

  const { data, isLoading, isFetching } = useGetLoyaltyTransactionsQuery({ page, size: PAGE_SIZE });

  useEffect(() => {
    if (data?.content) {
      setAllTransactions((prev) =>
        page === 0 ? data.content : [...prev, ...data.content]
      );
    }
  }, [data]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t('loyalty.historyTitle'),
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        }}
      />
      <View style={styles.container}>
        {isLoading && page === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : allTransactions.length === 0 ? (
          <View style={styles.center}>
            <AppText style={styles.emptyText}>{t('loyalty.noHistory')}</AppText>
          </View>
        ) : (
          <FlatList
            data={allTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <TransactionRow transaction={item} isRTL={isRTL} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              data && !data.last ? (
                <TouchableOpacity
                  style={styles.loadMore}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <AppText style={styles.loadMoreText}>{t('loyalty.loadMore')}</AppText>
                  )}
                </TouchableOpacity>
              ) : null
            }
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
  loadMore: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: { fontSize: 14, color: '#2196F3', fontWeight: '600' },
});
