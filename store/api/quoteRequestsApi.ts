import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';
import type {
  CreateQuoteRequest,
  QuoteRequest,
  QuoteRequestSummary,
} from '../../types/quoteRequests';

// Spec 009 — Get Quotes (reverse marketplace). Customer-side RTK Query slice.
// Matching + accept are server-side; responses are sealed (customer sees all, centers don't see
// competitors). Shares the backend `quoterequest` domain with center spec 024.

export interface AcceptQuoteRequest {
  requestId: number;
  quoteId: number;
}

export interface AcceptQuoteResponse {
  requestId: number;
  state: 'ACCEPTED';
  acceptedBookingId: number;
}

export interface CancelRequestResponse {
  requestId: number;
  state: 'CANCELLED';
}

export interface StartRequestChatResponse {
  conversationId: number;
}

export const quoteRequestsApi = createApi({
  reducerPath: 'quoteRequestsApi',
  tagTypes: ['QuoteRequest', 'QuoteRequestList'],
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
    createQuoteRequest: builder.mutation<QuoteRequest, CreateQuoteRequest>({
      query: (body) => ({
        url: '/quote-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['QuoteRequestList'],
    }),

    getMyQuoteRequests: builder.query<QuoteRequestSummary[], void>({
      query: () => '/quote-requests',
      providesTags: ['QuoteRequestList'],
    }),

    getQuoteRequest: builder.query<QuoteRequest, number>({
      query: (id) => `/quote-requests/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'QuoteRequest' as const, id }],
    }),

    acceptQuote: builder.mutation<AcceptQuoteResponse, AcceptQuoteRequest>({
      query: ({ requestId, quoteId }) => ({
        url: `/quote-requests/${requestId}/accept`,
        method: 'POST',
        body: { quoteId },
      }),
      invalidatesTags: (_result, _err, { requestId }) => [
        { type: 'QuoteRequest' as const, id: requestId },
        'QuoteRequestList',
      ],
    }),

    cancelRequest: builder.mutation<CancelRequestResponse, number>({
      query: (requestId) => ({
        url: `/quote-requests/${requestId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _err, requestId) => [
        { type: 'QuoteRequest' as const, id: requestId },
        'QuoteRequestList',
      ],
    }),

    startRequestChat: builder.mutation<
      StartRequestChatResponse,
      { requestId: number; centerId: number }
    >({
      query: ({ requestId, centerId }) => ({
        url: `/quote-requests/${requestId}/chat`,
        method: 'POST',
        body: { centerId },
      }),
    }),
  }),
});

export const {
  useCreateQuoteRequestMutation,
  useGetMyQuoteRequestsQuery,
  useGetQuoteRequestQuery,
  useAcceptQuoteMutation,
  useCancelRequestMutation,
  useStartRequestChatMutation,
} = quoteRequestsApi;
