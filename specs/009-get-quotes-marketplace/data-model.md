# Data Model: Get Quotes — Multi-Center Request & Compare

**Feature**: 009-get-quotes-marketplace
**Date**: 2026-05-29

> Client-side TypeScript shapes (`types/quoteRequests.ts`). Prices are **KD, 3 decimals**. The backend
> is authoritative for matching, state, and acceptance.

---

## Enums

### `QuoteRequestState`

| Value | Meaning | UI |
|-------|---------|----|
| `OPEN` | Broadcast, accepting quotes | Show responses + countdown + Cancel |
| `ACCEPTED` | A quote was accepted → booking created | Link to the booking |
| `EXPIRED` | Window elapsed with no accept | Offer widen / book directly |
| `CANCELLED` | Customer cancelled | Read-only |

### `QuoteResponseState`

| Value | Meaning |
|-------|---------|
| `SUBMITTED` | Center sent a quote |
| `UPDATED` | Center revised it |
| `WITHDRAWN` | Center withdrew it |
| `SELECTED` | Customer accepted this one |
| `NOT_SELECTED` | Another quote was accepted |

### `RequestSortKey`

`'PRICE' | 'RATING' | 'DISTANCE' | 'SOONEST'` — compare-view sort.

---

## Types (`types/quoteRequests.ts`)

### `CreateQuoteRequest`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `categoryId` | `number` | ✅ | Required anchor |
| `serviceId` | `number` | optional | If the customer knows the specific service |
| `description` | `string` | ✅ | Free text ("AC not cold…") |
| `attachmentIds` | `number[]` | optional | Uploaded photo/video refs |
| `vehicleOrApplianceNote` | `string` | optional | e.g. "2018 Camry" |
| `areaGovernorate` | `string` | optional | Preferred area for matching |
| `fulfillmentHint` | `'DROP_OFF' \| 'PICKUP_DELIVERY' \| 'AT_HOME'` | optional | Hint to centers (ties to `008`) |

### `QuoteResponse`

One center's reply. Sealed from other centers.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | |
| `centerId` | `number` | |
| `centerNameAr` / `centerNameEn` | `string` | Bilingual |
| `centerLogoUrl` | `string?` | |
| `rating` | `number` | Center rating |
| `trustScore` | `number?` | From `004` trust |
| `distance` | `number?` | km from the customer area |
| `priceMin` | `number` | KD |
| `priceMax` | `number` | KD (== priceMin when fixed) |
| `estimatedDurationMinutes` | `number?` | |
| `inclusions` | `string?` | What's covered |
| `message` | `string?` | Optional note |
| `state` | `QuoteResponseState` | |
| `respondedAt` | `string` (ISO) | For "response time" + SOONEST sort |

### `QuoteRequest`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | |
| `categoryId` | `number` | |
| `categoryNameAr` / `categoryNameEn` | `string` | |
| `serviceId` | `number?` | |
| `description` | `string` | |
| `attachmentUrls` | `string[]` | Resolved for display |
| `areaGovernorate` | `string?` | |
| `fulfillmentHint` | `string?` | |
| `state` | `QuoteRequestState` | |
| `reachCount` | `number` | How many centers it was sent to (R2) |
| `responses` | `QuoteResponse[]` | Populated on detail fetch |
| `expiresAt` | `string` (ISO) | Countdown |
| `acceptedBookingId` | `number?` | Set when `ACCEPTED` |
| `createdAt` | `string` (ISO) | |

### Modified: `bookingsApi.Booking`

| Field | Change |
|-------|--------|
| `originRequestId` | NEW optional `number` — set when the booking was created by accepting a quote (provenance / "from a quote request" badge) |

---

## State Transitions

### Request lifecycle

```
compose (new.tsx) → POST /quote-requests
   → OPEN (reachCount shown; "sent to N centers")
        │  centers respond → QuoteResponse[] grows (refetch on focus/poll, R3)
        │  customer chats a center (POST …/chat, reuses chatApi, R6)
        ├─ accept a quote → POST …/accept { quoteId }
        │      → server creates booking, request ACCEPTED,
        │        other responses → NOT_SELECTED, centers notified (R4)
        │      → client navigates to acceptedBookingId
        ├─ cancel → POST …/cancel → CANCELLED (centers notified)
        └─ expiresAt elapses → EXPIRED (offer widen / book directly, R8)
```

### Compare view

```
responses (state SUBMITTED|UPDATED) → sort by RequestSortKey
   PRICE    → priceMin asc
   RATING   → rating desc
   DISTANCE → distance asc
   SOONEST  → respondedAt asc (proxy for availability)
WITHDRAWN/NOT_SELECTED responses are excluded from the active compare list
```

---

## Validation Rules

- `categoryId` + `description` are required to send a request; the composer blocks submit otherwise.
- Attachments are validated for type (image/video) and size at compose; oversized/unsupported are rejected with guidance.
- The client never computes matching — `reachCount` and the response set come from the backend (R2).
- Accept is allowed only on an `OPEN` request with a non-withdrawn `quoteId`; accepting a quote whose
  center just went inactive fails gracefully and removes that quote (edge case).
- Prices render via the shared KD formatter (3 decimals); a fixed price shows once when `priceMin === priceMax`.
- A request-scoped chat is reachable while OPEN and from the booking after accept; read-only after expiry.
- All centers' quotes are visible to the customer; the client must not expose any cross-center data to
  the center side (that boundary lives in `024`).
