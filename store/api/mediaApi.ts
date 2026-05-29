import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export enum MediaCategory {
  ISSUE_FOUND = 'ISSUE_FOUND',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  BEFORE_REPAIR = 'BEFORE_REPAIR',
  AFTER_REPAIR = 'AFTER_REPAIR',
  QUALITY_CHECK = 'QUALITY_CHECK',
  VEHICLE_ARRIVAL = 'VEHICLE_ARRIVAL',
  PARTS_USED = 'PARTS_USED',
  CUSTOMER_PICKUP = 'CUSTOMER_PICKUP',
}

export interface BookingMedia {
  id: number;
  bookingId: number;
  mediaType: 'PHOTO' | 'VIDEO';
  category: MediaCategory;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  captionAr?: string;
  isVisibleToCustomer: boolean;
  createdAt: string;
}

export interface UploadPhotoArgs {
  bookingId: number;
  asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  };
  caption?: string;
  captionAr?: string;
}

export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Media'],
  endpoints: (builder) => ({
    getCustomerMedia: builder.query<BookingMedia[], number>({
      query: (bookingId) => `bookings/${bookingId}/customer-media`,
      providesTags: (result, error, bookingId) => [{ type: 'Media', id: bookingId }],
    }),
    uploadCustomerMedia: builder.mutation<BookingMedia, UploadPhotoArgs>({
      queryFn: async ({ bookingId, asset, caption, captionAr }, { getState }, _, baseQuery) => {
        const formData = new FormData();

        if (Platform.OS === 'web') {
          const blob = await fetch(asset.uri).then((r) => r.blob());
          formData.append('file', blob, asset.fileName || 'photo.jpg');
        } else {
          formData.append('file', {
            uri: asset.uri,
            name: asset.fileName || 'photo.jpg',
            type: asset.mimeType || 'image/jpeg',
          } as any);
        }

        if (caption) formData.append('caption', caption);
        if (captionAr) formData.append('captionAr', captionAr);

        return baseQuery({
          url: `bookings/${bookingId}/customer-media`,
          method: 'POST',
          body: formData,
        });
      },
      invalidatesTags: (result, error, { bookingId }) => [{ type: 'Media', id: bookingId }],
    }),
  }),
});

export const { useGetCustomerMediaQuery, useUploadCustomerMediaMutation } = mediaApi;
