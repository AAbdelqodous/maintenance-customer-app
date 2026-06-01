import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import type { RootState } from '../index';
import type { ServiceAddress } from '../../types/fulfillment';

// Spec 008 — saved service addresses (Home/Work/Other) reused across bookings (R4).
export const addressesApi = createApi({
  reducerPath: 'addressesApi',
  tagTypes: ['Address'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAddresses: builder.query<ServiceAddress[], void>({
      query: () => '/me/addresses',
      providesTags: ['Address'],
    }),
    createAddress: builder.mutation<ServiceAddress, ServiceAddress>({
      query: (body) => ({ url: '/me/addresses', method: 'POST', body }),
      invalidatesTags: ['Address'],
    }),
    updateAddress: builder.mutation<ServiceAddress, { id: number; body: ServiceAddress }>({
      query: ({ id, body }) => ({ url: `/me/addresses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation<void, number>({
      query: (id) => ({ url: `/me/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = addressesApi;
