import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

export enum ReminderStatus {
  UPCOMING = 'UPCOMING',
  DUE_SOON = 'DUE_SOON',
  OVERDUE = 'OVERDUE',
}

export enum ReminderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface MaintenanceReminder {
  id: number;
  vehicleId: number;
  name: string;
  dueDate?: string;
  dueMileage?: number;
  priority: ReminderPriority;
  status: ReminderStatus;
  daysUntilDue?: number;
  isCompleted: boolean;
}

export const remindersApi = createApi({
  reducerPath: 'remindersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Reminders'],
  endpoints: (builder) => ({
    getVehicleReminders: builder.query<MaintenanceReminder[], number>({
      query: (vehicleId) => `vehicles/${vehicleId}/reminders`,
      providesTags: (result, error, vehicleId) => [{ type: 'Reminders', id: vehicleId }],
    }),
    completeReminder: builder.mutation<void, { reminderId: number; vehicleId: number }>({
      query: ({ reminderId }) => ({
        url: `reminders/${reminderId}/complete`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: (result, error, { vehicleId }) => [{ type: 'Reminders', id: vehicleId }],
    }),
  }),
});

export const { useGetVehicleRemindersQuery, useCompleteReminderMutation } = remindersApi;
