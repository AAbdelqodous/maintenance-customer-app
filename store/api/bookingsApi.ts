import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// ── Types ───────────────────────────────────────────────────────────────────────

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  QUOTE_READY = 'QUOTE_READY',
}

export enum ServiceType {
  CAR = 'CAR',
  ELECTRONICS = 'ELECTRONICS',
  HOME_APPLIANCE = 'HOME_APPLIANCE',
  EMERGENCY = 'EMERGENCY',
  INSTALLATION = 'INSTALLATION',
  REPAIR = 'REPAIR',
}

export enum PaymentMethod {
  CASH = 'CASH',
  KNET = 'KNET',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum CancelledBy {
  USER = 'USER',
  CENTER = 'CENTER',
  SYSTEM = 'SYSTEM',
}

export interface BookingCategoryRef {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface BookingServiceRef {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface Booking {
  id: number;
  bookingNumber?: string;
  userId: number;
  centerId: number;
  centerNameAr: string;
  centerNameEn: string;
  serviceType: ServiceType;
  category?: BookingCategoryRef | null;
  service?: BookingServiceRef | null;
  /** Spec 009 — set when this booking was created by accepting a quote request. */
  originRequestId?: number;
  serviceDescription?: string;
  bookingDate: string;
  bookingTime: string;
  bookingStatus: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Spec 007 — amount captured in-app (KD), when paid via the payments flow. */
  paidAmount?: number;
  estimatedCost?: number;
  finalCost?: number;
  specialInstructions?: string;
  cancelledBy?: CancelledBy;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  centerId: number;
  categoryId: number;
  serviceId: number;
  serviceDescription?: string;
  bookingDate: string;
  bookingTime: string;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  specialInstructions?: string;
}

export interface UpdateBookingRequest {
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface BookingsQueryParams {
  status?: BookingStatus;
}

export interface BookingsPageParams {
  page?: number;
  size?: number;
  serviceType?: ServiceType;
  centerId?: number;
  sortBy?: 'date' | 'status' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingsResponse {
  content: Booking[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ── API slice ───────────────────────────────────────────────────────────────────

export const bookingsApi = createApi({
  reducerPath: 'bookingsApi',
  tagTypes: ['Booking'],
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
    getMyBookings: builder.query<Booking[], BookingsQueryParams>({
      query: (params) => ({
        url: '/bookings/my',
        params,
      }),
      providesTags: ['Booking'],
    }),

    getBookingById: builder.query<Booking, number>({
      query: (id) => `/bookings/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Booking', id }],
    }),

    createBooking: builder.mutation<Booking, CreateBookingRequest>({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Booking'],
    }),

    updateBooking: builder.mutation<Booking, { id: number; data: UpdateBookingRequest }>({
      query: ({ id, data }) => ({
        url: `/bookings/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Booking'],
    }),

    cancelBooking: builder.mutation<void, { id: number; data: CancelBookingRequest }>({
      query: ({ id, data }) => ({
        url: `/bookings/${id}/cancel`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Booking'],
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useCancelBookingMutation,
} = bookingsApi;

export function getBookingServiceLabel(
  booking: Pick<Booking, 'service' | 'serviceType'>,
  t: (key: string) => string,
  isAr: boolean
): string {
  if (booking.service) {
    return isAr ? booking.service.nameAr : booking.service.nameEn;
  }
  return t(`booking.serviceType.${booking.serviceType.toLowerCase()}`);
}
