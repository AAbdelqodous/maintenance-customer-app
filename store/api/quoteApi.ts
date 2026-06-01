import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISED = 'REVISED',
}

export interface QuoteLineItem {
  id: number;
  descriptionEn: string;
  descriptionAr: string;
  partsCost: number;
  labourCost: number;
}

export interface BookingQuote {
  id: number;
  bookingId: number;
  version: number;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  estimatedDurationMinutes?: number;
  estimatedDuration?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export const quoteApi = createApi({
  reducerPath: 'quoteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Quote'],
  endpoints: (builder) => ({
    getBookingQuote: builder.query<BookingQuote, number>({
      query: (bookingId) => `bookings/${bookingId}/quote`,
      providesTags: (result, error, bookingId) => [{ type: 'Quote', id: bookingId }],
    }),
    approveQuote: builder.mutation<void, number>({
      query: (quoteId) => ({ url: `quotes/${quoteId}/approve`, method: 'POST', body: {} }),
      invalidatesTags: ['Quote'],
    }),
    rejectQuote: builder.mutation<void, { quoteId: number; reason?: string }>({
      query: ({ quoteId, reason }) => ({
        url: `quotes/${quoteId}/reject`,
        method: 'POST',
        body: { reason: reason ?? '' },
      }),
      invalidatesTags: ['Quote'],
    }),
  }),
});

export const { useGetBookingQuoteQuery, useApproveQuoteMutation, useRejectQuoteMutation } = quoteApi;
