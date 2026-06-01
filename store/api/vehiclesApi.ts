import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export interface UserVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  color?: string;
  currentMileage?: number;
  nickname?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  color?: string;
  currentMileage?: number;
  nickname?: string;
}

export interface ServiceHistorySummary {
  totalServices: number;
  totalSpentKD: number;
  lastServiceDate?: string;
}

export interface RecentService {
  bookingId: number;
  centerNameEn: string;
  centerNameAr: string;
  serviceType: string;
  completedAt: string;
  amountKD?: number;
}

export interface MaintenanceReminderBrief {
  id: number;
  name: string;
  dueDate?: string;
  status: string;
  daysUntilDue?: number;
}

export interface VehicleDashboard {
  vehicle: UserVehicle;
  stats: ServiceHistorySummary;
  upcomingReminders: MaintenanceReminderBrief[];
  recentServices: RecentService[];
}

export const vehiclesApi = createApi({
  reducerPath: 'vehiclesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Vehicles', 'VehicleDashboard'],
  endpoints: (builder) => ({
    getVehicles: builder.query<UserVehicle[], void>({
      query: () => '/vehicles',
      providesTags: ['Vehicles'],
    }),
    createVehicle: builder.mutation<UserVehicle, CreateVehicleRequest>({
      query: (body) => ({ url: '/vehicles', method: 'POST', body }),
      invalidatesTags: ['Vehicles'],
    }),
    deleteVehicle: builder.mutation<void, number>({
      query: (id) => ({ url: `/vehicles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vehicles'],
    }),
    getVehicleDashboard: builder.query<VehicleDashboard, number>({
      query: (id) => `/vehicles/${id}/dashboard`,
      providesTags: (result, error, id) => [{ type: 'VehicleDashboard', id }],
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetVehicleDashboardQuery,
} = vehiclesApi;
