import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export interface Address {
  street: string;
  city: string;
  area: string;
  postalCode?: string;
  buildingNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
}

export interface ServiceCategory {
  id: number;
  code?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
}

export interface MaintenanceCenter {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  address: Address;
  phone: string;
  email?: string;
  website?: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  categories: ServiceCategory[];
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CentersQueryParams {
  page?: number;
  size?: number;
  categoryId?: number;
  city?: string;
  area?: string;
  search?: string;
  minRating?: number;
  isVerified?: boolean;
  isOpen?: boolean;
  sortBy?: 'rating' | 'distance' | 'name' | 'reviews';
  sortOrder?: 'asc' | 'desc';
}

export interface CentersResponse {
  content: MaintenanceCenter[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export enum TrustBadgeType {
  VERIFIED_BUSINESS = 'VERIFIED_BUSINESS',
  YEARS_EXPERIENCE = 'YEARS_EXPERIENCE',
  CERTIFIED_TECHNICIANS = 'CERTIFIED_TECHNICIANS',
  SATISFACTION_GUARANTEE = 'SATISFACTION_GUARANTEE',
  LICENSED = 'LICENSED',
}

export interface TrustBadge {
  badgeType: TrustBadgeType;
  labelAr: string;
  labelEn: string;
  iconName: string;
  awardedAt: string;
  metadata?: Record<string, string>;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const centersApi = createApi({
  reducerPath: 'centersApi',
  tagTypes: ['Centers', 'Center', 'Badges'],
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
    getCenters: builder.query<CentersResponse, CentersQueryParams>({
      query: (params) => ({
        url: '/centers',
        params,
      }),
    }),

    getCenterById: builder.query<MaintenanceCenter, number>({
      query: (id) => `/centers/${id}`,
    }),

    getCategories: builder.query<ServiceCategory[], void>({
      query: () => '/categories',
    }),

    searchCenters: builder.query<CentersResponse, { query: string; params?: CentersQueryParams }>({
      query: ({ query, params }) => ({
        url: '/centers/search',
        params: { ...params, search: query },
      }),
    }),

    getCenterBadges: builder.query<TrustBadge[], number>({
      query: (centerId) => `centers/${centerId}/badges`,
      providesTags: (result, error, centerId) => [{ type: 'Badges' as const, id: centerId }],
    }),
  }),
});

export const {
  useGetCentersQuery,
  useGetCenterByIdQuery,
  useGetCategoriesQuery,
  useLazySearchCentersQuery,
  useGetCenterBadgesQuery,
} = centersApi;
