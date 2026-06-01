import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export interface ReferralEntry {
  referredName: string;
  status: 'PENDING' | 'COMPLETED';
  pointsEarned: number;
  referredAt: string;
}

export interface ReferralStats {
  referralCode: string;
  shareUrl: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  referrals: ReferralEntry[];
}

export const referralApi = createApi({
  reducerPath: 'referralApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Referral'],
  endpoints: (builder) => ({
    getReferralStats: builder.query<ReferralStats, void>({
      query: () => 'referral',
      providesTags: ['Referral'],
    }),
  }),
});

export const { useGetReferralStatsQuery } = referralApi;
