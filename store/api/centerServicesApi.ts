import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export interface ServiceCategoryResponse {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
}

export interface ServiceDetail {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
}

export interface CenterServiceResponse {
  id: number;
  category: ServiceCategoryResponse;
  service: ServiceDetail;
  minPrice?: number;
  maxPrice?: number;
  typicalDurationMinutes?: number;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const centerServicesApi = createApi({
  reducerPath: 'centerServicesApi',
  tagTypes: ['CenterCategories', 'CenterServices'],
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
    getCenterCategories: builder.query<ServiceCategoryResponse[], number>({
      query: (centerId) => `/centers/${centerId}/categories`,
      providesTags: (_result, _err, centerId) => [
        { type: 'CenterCategories' as const, id: centerId },
      ],
    }),
    getServicesForCenterCategory: builder.query<
      CenterServiceResponse[],
      { centerId: number; categoryId: number }
    >({
      query: ({ centerId, categoryId }) =>
        `/centers/${centerId}/categories/${categoryId}/services`,
      providesTags: (_result, _err, { centerId, categoryId }) => [
        { type: 'CenterServices' as const, id: `${centerId}-${categoryId}` },
      ],
    }),
  }),
});

export const {
  useGetCenterCategoriesQuery,
  useGetServicesForCenterCategoryQuery,
} = centerServicesApi;
