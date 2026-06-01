import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';
import type { InitiatePaymentResponse, PaymentMethod } from './paymentsApi';

// Spec 007 — customer wallet. Top-up reuses the same gateway-hosted checkout flow as a payment.

export interface Wallet {
  balance: number; // KD, 3 decimals
  currency: 'KWD';
}

export interface WalletTransaction {
  id: number;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND' | 'LOYALTY_CREDIT';
  /** Signed KD (credits +, debits −). */
  amount: number;
  bookingId?: number;
  createdAt: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface TopUpRequest {
  amount: number;
  method: PaymentMethod; // wallet cannot top up wallet — enforced in UI
  idempotencyKey: string;
}

export const walletApi = createApi({
  reducerPath: 'walletApi',
  tagTypes: ['Wallet', 'WalletTx'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getWallet: builder.query<Wallet, void>({
      query: () => '/wallet',
      providesTags: ['Wallet'],
    }),
    getWalletTransactions: builder.query<WalletTransaction[], void>({
      query: () => '/wallet/transactions',
      providesTags: ['WalletTx'],
    }),
    topUp: builder.mutation<InitiatePaymentResponse, TopUpRequest>({
      query: (body) => ({ url: '/wallet/topup', method: 'POST', body }),
      invalidatesTags: ['Wallet', 'WalletTx'],
    }),
  }),
});

export const {
  useGetWalletQuery,
  useGetWalletTransactionsQuery,
  useTopUpMutation,
} = walletApi;
