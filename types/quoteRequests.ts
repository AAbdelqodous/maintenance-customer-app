// Spec 009 — Get Quotes (reverse marketplace). Customer-side types.
// Prices are KD, 3 decimals. The backend is authoritative for matching, state, and acceptance.

export type QuoteRequestState = 'OPEN' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export type QuoteResponseState =
  | 'SUBMITTED'
  | 'UPDATED'
  | 'WITHDRAWN'
  | 'SELECTED'
  | 'NOT_SELECTED';

/** Compare-view sort keys (see lib/quoteSort.ts). */
export type RequestSortKey = 'PRICE' | 'RATING' | 'DISTANCE' | 'SOONEST';

export type FulfillmentHint = 'DROP_OFF' | 'PICKUP_DELIVERY' | 'AT_HOME';

export interface CreateQuoteRequest {
  /** Required anchor. */
  categoryId: number;
  /** If the customer knows the specific service. */
  serviceId?: number;
  /** Free text, e.g. "AC not cold, started last week". */
  description: string;
  /** Uploaded photo/video attachment refs. */
  attachmentIds?: number[];
  /** e.g. "2018 Toyota Camry". */
  vehicleOrApplianceNote?: string;
  /** Preferred area for matching. */
  areaGovernorate?: string;
  /** Hint to centers (ties to spec 008 fulfillment). */
  fulfillmentHint?: FulfillmentHint;
}

/** One center's reply. Sealed from other centers. */
export interface QuoteResponse {
  id: number;
  centerId: number;
  centerNameAr: string;
  centerNameEn: string;
  centerLogoUrl?: string;
  rating: number;
  /** From spec 004 trust score. */
  trustScore?: number;
  /** km from the customer area. */
  distance?: number;
  priceMin: number;
  /** Equals priceMin when the center quoted a fixed price. */
  priceMax: number;
  estimatedDurationMinutes?: number;
  /** What's covered. */
  inclusions?: string;
  message?: string;
  state: QuoteResponseState;
  /** ISO — used for "response time" and the SOONEST sort. */
  respondedAt: string;
}

export interface QuoteRequest {
  id: number;
  categoryId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  serviceId?: number;
  description: string;
  /** Resolved URLs for display. */
  attachmentUrls: string[];
  areaGovernorate?: string;
  fulfillmentHint?: FulfillmentHint;
  state: QuoteRequestState;
  /** How many centers it was broadcast to. */
  reachCount: number;
  /** Populated on the detail fetch; omitted/empty on the list. */
  responses: QuoteResponse[];
  /** ISO countdown target. */
  expiresAt: string;
  /** Set when state === 'ACCEPTED'. */
  acceptedBookingId?: number;
  createdAt: string;
}

/** Lightweight row for the "my requests" list (GET /quote-requests). */
export interface QuoteRequestSummary {
  id: number;
  categoryNameAr: string;
  categoryNameEn: string;
  state: QuoteRequestState;
  reachCount: number;
  responseCount: number;
  expiresAt: string;
  createdAt: string;
}
