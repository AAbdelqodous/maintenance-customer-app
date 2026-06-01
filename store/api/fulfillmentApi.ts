import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import type { RootState } from '../index';
import type { CenterFulfillmentCapability, LogisticsStatus } from '../../types/fulfillment';

// Spec 008 — center fulfillment capability (modes/area/fees) + per-booking logistics status.
// Capability is authored center-side (a dependency); the client consumes it. Logistics is
// display-only and center-driven — the client refetches on focus/push, never advances a leg.
export const fulfillmentApi = createApi({
  reducerPath: 'fulfillmentApi',
  tagTypes: ['Capability', 'Logistics'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCenterFulfillment: builder.query<CenterFulfillmentCapability, { centerId: number; serviceId?: number }>({
      query: ({ centerId, serviceId }) =>
        `/centers/${centerId}/fulfillment${serviceId != null ? `?serviceId=${serviceId}` : ''}`,
      providesTags: (_r, _e, { centerId }) => [{ type: 'Capability' as const, id: centerId }],
    }),

    getBookingLogistics: builder.query<LogisticsStatus, number>({
      query: (bookingId) => `/bookings/${bookingId}/logistics`,
      providesTags: (_r, _e, id) => [{ type: 'Logistics' as const, id }],
    }),

    // After a center decline, switch mode (e.g. to DROP_OFF) or cancel — pauses then re-opens (R7).
    reChooseFulfillment: builder.mutation<LogisticsStatus, { bookingId: number; mode: string }>({
      query: ({ bookingId, mode }) => ({
        url: `/bookings/${bookingId}/fulfillment/re-choose`,
        method: 'POST',
        body: { mode },
      }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: 'Logistics' as const, id: bookingId }],
    }),
  }),
});

export const {
  useGetCenterFulfillmentQuery,
  useGetBookingLogisticsQuery,
  useReChooseFulfillmentMutation,
} = fulfillmentApi;
