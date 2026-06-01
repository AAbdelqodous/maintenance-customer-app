import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum Language {
  ARABIC = 'ARABIC',
  ENGLISH = 'ENGLISH',
}

export interface Address {
  street: string;
  city: string;
  area: string;
  postalCode?: string;
  buildingNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  dateOfBirth?: string;
  phone?: string;
  address?: Address;
  language: Language;
  enabled: boolean;
  accountLocked: boolean;
  createdAt: string;
  lastModifiedDate: string;
  profileImageUrl?: string;
}

export interface UpdateProfileRequest {
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: Address;
  language?: Language;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const profileApi = createApi({
  reducerPath: 'profileApi',
  tagTypes: ['Profile'],
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
    getMyProfile: builder.query<UserProfile, void>({
      query: () => '/users/me',
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: (body) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),

    uploadProfileImage: builder.mutation<UserProfile, FormData>({
      query: (formData) => ({
        url: '/users/me/profile-image',
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header — fetch sets it automatically with boundary for multipart
        formData: true,
      }),
      invalidatesTags: ['Profile'],
    }),

    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({
        url: '/users/me/change-password',
        method: 'POST',
        body,
      }),
    }),

    deleteAccount: builder.mutation<void, void>({
      query: () => ({
        url: '/users/me',
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useUploadProfileImageMutation,
} = profileApi;
