import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export enum WorkStage {
  RECEIVED = 'RECEIVED',
  DIAGNOSING = 'DIAGNOSING',
  PARTS_ORDERED = 'PARTS_ORDERED',
  WORK_IN_PROGRESS = 'WORK_IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
}

export interface WorkProgressItem {
  stage: WorkStage;
  stageDisplayName: string;
  notes?: string;
  photoUrl?: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface WorkProgressResponse {
  bookingId: number;
  currentStage: WorkStage | null;
  currentStageDescription: string | null;
  progressPercentage: number;
  estimatedCompletionDate?: string;
  isDelayed: boolean;
  nextExpectedStage?: WorkStage;
  timeline: WorkProgressItem[];
}

export const progressApi = createApi({
  reducerPath: 'progressApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Progress'],
  endpoints: (builder) => ({
    getBookingProgress: builder.query<WorkProgressResponse, number>({
      query: (bookingId) => `bookings/${bookingId}/progress`,
      providesTags: (result, error, bookingId) => [{ type: 'Progress', id: bookingId }],
    }),
  }),
});

export const { useGetBookingProgressQuery } = progressApi;
