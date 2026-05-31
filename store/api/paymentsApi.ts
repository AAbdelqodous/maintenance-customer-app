import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';

// Spec 007 — In-app payments, wallet & escrow (customer). Gateway-hosted checkout (MyFatoorah/Tap)
// is handled by the backend; the client consumes the status machine and never handles raw PAN.

export enum PaymentStatus {
  PENDING = 'PENDING',
  HELD = 'HELD', // captured, in escrow, awaiting release
  RELEASED = 'RELEASED', // released, settling to center
  PAID = 'PAID', // fully settled
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  KNET = 'KNET',
  CARD = 'CARD',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  WALLET = 'WALLET',
}

export type InvoiceLineKind =
  | 'SERVICE'
  | 'PART'
  | 'DIAGNOSTIC_FEE'
  | 'FULFILLMENT_FEE'
  | 'DISCOUNT'
  | 'LOYALTY';

export interface InvoiceLine {
  labelEn: string;
  labelAr: string;
  /** KD, 3 decimals; negative for discounts/loyalty. */
  amount: number;
  kind: InvoiceLineKind;
}

export interface BookingInvoice {
  bookingId: number;
  lines: InvoiceLine[];
  /** Authoritative chargeable total (KD). */
  total: number;
  currency: 'KWD';
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  walletApplicable: boolean;
  /** Methods the gateway/device supports right now. */
  availableMethods: PaymentMethod[];
  /** True once the center marked the work complete (US2). */
  releaseEligible: boolean;
  autoReleaseAt?: string;
  receiptUrl?: string;
  /** Spec 023 — deposit netting. `amountDue` = total − depositPaid (the balance still owed). */
  depositRequired?: number;
  depositPaid?: number;
  amountDue?: number;
  /** False when a customer cancellation would forfeit the paid deposit (RETAIN policy). */
  depositRefundable?: boolean;
}

export interface InitiatePaymentRequest {
  bookingId: number;
  method: PaymentMethod;
  /** Apply wallet first, remainder external (R6). */
  useWalletBalance: boolean;
  saveCard?: boolean;
  savedMethodId?: number;
  /** Client-generated, one per attempt — prevents double-charge (FR-011). */
  idempotencyKey: string;
}

export interface InitiatePaymentResponse {
  paymentId: number;
  status: PaymentStatus;
  /** Present only when an external gateway step is needed. */
  checkoutUrl?: string;
  returnUrlPrefix: string;
}

export interface PaymentStatusResponse {
  paymentId: number;
  status: PaymentStatus;
  bookingId: number;
}

export interface SavedMethod {
  id: number;
  brand: string;
  /** Masked only — never the full PAN. */
  maskedLabel: string;
  expiry: string;
}

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  tagTypes: ['Invoice', 'SavedMethods'],
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
    getBookingInvoice: builder.query<BookingInvoice, number>({
      query: (bookingId) => `/bookings/${bookingId}/invoice`,
      providesTags: (_r, _e, id) => [{ type: 'Invoice' as const, id }],
    }),

    initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: 'Invoice' as const, id: bookingId }],
    }),

    // Spec 023 — pay the booking's required deposit upfront (credited against the balance later).
    initiateDeposit: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (body) => ({ url: '/payments/deposit', method: 'POST', body }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: 'Invoice' as const, id: bookingId }],
    }),

    // Polled after the gateway return — the backend is the source of truth (R3).
    getPaymentStatus: builder.query<PaymentStatusResponse, number>({
      query: (paymentId) => `/payments/${paymentId}`,
    }),

    releaseEscrow: builder.mutation<{ bookingId: number; paymentStatus: PaymentStatus }, number>({
      query: (bookingId) => ({ url: `/bookings/${bookingId}/release`, method: 'POST', body: {} }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Invoice' as const, id }],
    }),

    raiseProblem: builder.mutation<void, { bookingId: number; reason: string }>({
      query: ({ bookingId, reason }) => ({
        url: `/bookings/${bookingId}/dispute`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: 'Invoice' as const, id: bookingId }],
    }),

    getSavedMethods: builder.query<SavedMethod[], void>({
      query: () => '/payments/methods',
      providesTags: ['SavedMethods'],
    }),

    deleteSavedMethod: builder.mutation<void, number>({
      query: (id) => ({ url: `/payments/methods/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SavedMethods'],
    }),
  }),
});

export const {
  useGetBookingInvoiceQuery,
  useInitiatePaymentMutation,
  useInitiateDepositMutation,
  useLazyGetPaymentStatusQuery,
  useReleaseEscrowMutation,
  useRaiseProblemMutation,
  useGetSavedMethodsQuery,
  useDeleteSavedMethodMutation,
} = paymentsApi;
