import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#A8A9AD',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
};

export const TIER_TEXT_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#fff',
  SILVER: '#1A1A2E',
  GOLD: '#7B6300',
  PLATINUM: '#1A1A2E',
};

export enum RewardType {
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  FREE_SERVICE = 'FREE_SERVICE',
}

export interface LoyaltyTierProgress {
  currentPoints: number;
  requiredPoints: number;
  percent: number;
  nextTier: LoyaltyTier | null;
}

export interface ExpiringPoints {
  points: number;
  expiresAt: string;
}

export interface LoyaltyAccount {
  totalPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierMultiplier: number;
  tierProgress: LoyaltyTierProgress;
  expiringPoints?: ExpiringPoints;
}

export interface LoyaltyReward {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;
  tierRequired: LoyaltyTier | null;
  canRedeem: boolean;
  reasonCannotRedeem?: string;
  validUntil?: string;
}

export interface RedemptionResult {
  redemptionCode: string;
  expiresAt: string;
  pointsDeducted: number;
  remainingPoints: number;
}

export interface LoyaltyTransaction {
  id: number;
  description: string;
  pointsDelta: number;
  balanceAfter: number;
  createdAt: string;
}

export interface PaginatedTransactions {
  content: LoyaltyTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const loyaltyApi = createApi({
  reducerPath: 'loyaltyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['LoyaltyAccount', 'LoyaltyRewards', 'LoyaltyTransactions'],
  endpoints: (builder) => ({
    getLoyaltyAccount: builder.query<LoyaltyAccount, void>({
      query: () => 'loyalty/account',
      providesTags: ['LoyaltyAccount'],
    }),
    getLoyaltyRewards: builder.query<LoyaltyReward[], void>({
      query: () => 'loyalty/rewards',
      providesTags: ['LoyaltyRewards'],
    }),
    redeemReward: builder.mutation<RedemptionResult, number>({
      query: (rewardId) => ({ url: `loyalty/rewards/${rewardId}/redeem`, method: 'POST', body: {} }),
      invalidatesTags: ['LoyaltyAccount', 'LoyaltyRewards'],
    }),
    getLoyaltyTransactions: builder.query<PaginatedTransactions, { page: number; size: number }>({
      query: ({ page, size }) => ({ url: 'loyalty/transactions', params: { page, size } }),
      providesTags: ['LoyaltyTransactions'],
    }),
  }),
});

export const {
  useGetLoyaltyAccountQuery,
  useGetLoyaltyRewardsQuery,
  useRedeemRewardMutation,
  useGetLoyaltyTransactionsQuery,
} = loyaltyApi;
