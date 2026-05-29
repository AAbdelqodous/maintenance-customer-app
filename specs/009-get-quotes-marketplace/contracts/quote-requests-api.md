# API Contracts: Quote Requests (Customer)

**Feature**: 009-get-quotes-marketplace
**Date**: 2026-05-29
**Backend base**: `GET|POST /api/v1/...`
**Auth**: All endpoints require `Authorization: Bearer <jwt>`
**Money**: Prices are **KD (`KWD`), 3 decimal places**.

> **Status: BACKEND NOT YET IMPLEMENTED.** New backend `quoterequest` package (broadcast + matching +
> sealed responses + expiry + accept→booking), **shared with center `024-quote-requests-inbox`**. Build
> against an MSW mock. Matching and acceptance are server-side (`research.md` R2/R4).

---

## POST /quote-requests

**Consumer**: `quote-requests/new.tsx` (`RequestComposer`)
**Purpose**: Create + broadcast a request; returns it with a reach count.

### Request body
```json
{
  "categoryId": 1,
  "serviceId": null,
  "description": "AC not cold, started last week",
  "attachmentIds": [55, 56],
  "vehicleOrApplianceNote": "2018 Toyota Camry",
  "areaGovernorate": "Hawalli",
  "fulfillmentHint": "AT_HOME"
}
```

### Response — 201 Created
```json
{
  "id": 900,
  "categoryId": 1, "categoryNameAr": "تكييف", "categoryNameEn": "AC",
  "description": "AC not cold, started last week",
  "attachmentUrls": ["https://.../55.jpg", "https://.../56.mp4"],
  "areaGovernorate": "Hawalli",
  "fulfillmentHint": "AT_HOME",
  "state": "OPEN",
  "reachCount": 7,
  "responses": [],
  "expiresAt": "2026-05-31T10:00:00Z",
  "acceptedBookingId": null,
  "createdAt": "2026-05-29T10:00:00Z"
}
```
`reachCount: 0` → no matching centers; client offers to widen area/category (`research.md` R8).

### Errors
| Status | Client behavior |
|--------|----------------|
| 400 | Missing category/description, bad attachment → inline message |
| 401 | Redux middleware → auth |
| 429 | Rate-limited (anti-spam) → message + retry later |
| 5xx / network | Generic error + retry (compose preserved) |

---

## GET /quote-requests

**Consumer**: "My quote requests" list (entry from Home)
**Purpose**: The customer's own requests with state + response counts.

### Response — 200 OK
```json
[
  { "id": 900, "categoryNameEn": "AC", "categoryNameAr": "تكييف", "state": "OPEN", "reachCount": 7, "responseCount": 3, "expiresAt": "2026-05-31T10:00:00Z", "createdAt": "2026-05-29T10:00:00Z" }
]
```
Empty `[]` → empty-state with a Get-Quotes CTA.

---

## GET /quote-requests/{id}

**Consumer**: `quote-requests/[id].tsx` (responses + compare)
**Purpose**: Full request + all (sealed-per-center) responses.

### Response — 200 OK
```json
{
  "id": 900,
  "categoryNameEn": "AC", "categoryNameAr": "تكييف",
  "description": "AC not cold, started last week",
  "attachmentUrls": ["https://.../55.jpg"],
  "state": "OPEN",
  "reachCount": 7,
  "expiresAt": "2026-05-31T10:00:00Z",
  "acceptedBookingId": null,
  "responses": [
    {
      "id": 5001, "centerId": 10, "centerNameAr": "مركز الخليج", "centerNameEn": "Gulf Center",
      "centerLogoUrl": "https://.../logo.png", "rating": 4.6, "trustScore": 88, "distance": 3.2,
      "priceMin": 15.000, "priceMax": 25.000, "estimatedDurationMinutes": 90,
      "inclusions": "Gas refill + leak check", "message": "Can come tomorrow morning",
      "state": "SUBMITTED", "respondedAt": "2026-05-29T11:00:00Z"
    }
  ]
}
```
Poll/refetch while `OPEN` (`research.md` R3).

### Errors
| Status | Client behavior |
|--------|----------------|
| 401 | → auth |
| 404 | Request not found → back to list |
| 5xx / network | Cached data if present, else error + retry |

---

## POST /quote-requests/{id}/accept

**Consumer**: Accept action on `[id].tsx`
**Purpose**: Accept one quote → server creates the booking, closes the request, notifies centers.

### Request
```json
{ "quoteId": 5001 }
```
### Response — 200 OK
```json
{ "requestId": 900, "state": "ACCEPTED", "acceptedBookingId": 1234 }
```
Client navigates to booking `1234` (carries `originRequestId: 900`).

### Errors
| Status | Client behavior |
|--------|----------------|
| 401 | → auth |
| 409 | Request not OPEN / quote withdrawn / center inactive → refetch + message; quote removed |
| 5xx / network | Error + retry |

---

## POST /quote-requests/{id}/cancel

**Consumer**: Cancel on `[id].tsx`
**Response — 200 OK**: `{ "requestId": 900, "state": "CANCELLED" }` (responding centers notified).

---

## POST /quote-requests/{id}/chat

**Consumer**: "Ask a question" on a `QuoteResponseCard`
**Purpose**: Create/get a request-scoped conversation with a specific responding center; delegates to chat.

### Request
```json
{ "centerId": 10 }
```
### Response — 200 OK
```json
{ "conversationId": 777 }
```
Client opens the existing chat thread (`chatApi.getMessages(777)` / `sendMessage`). After accept the
thread continues under the booking; after expiry it is read-only.

### Errors
| Status | Client behavior |
|--------|----------------|
| 401 | → auth |
| 409 | Request expired → open read-only |
| 5xx / network | Error + retry |

---

## Notification / refresh events (push → client refetch)

| Event | Client behavior |
|-------|-----------------|
| New quote received | Refetch `GET /quote-requests/{id}`; badge |
| Quote updated / withdrawn | Refetch; update/remove the card |
| Request expiring soon | Toast/notification; show countdown |
| Request expired | Move to EXPIRED; offer widen / book directly |

---

## RTK Query tag invalidation

| Mutation | Invalidates |
|----------|-------------|
| `createQuoteRequest` | `QuoteRequestList` |
| `acceptQuote` | `QuoteRequest` (id), `QuoteRequestList`, plus `bookingsApi` Booking list (new booking) |
| `cancelRequest` | `QuoteRequest` (id), `QuoteRequestList` |

---

## i18n Key Set (namespace `quoteRequests.*`)

`getQuotes` (entry CTA), `compose.*` (title, category, describe, attach, area, fulfillment, send,
reachCount, noMatches), `list.*` (empty, statuses), `detail.*` (responses, countdown, compare, sortBy:
price/rating/distance/soonest, accept, cancel, ask), `response.*` (price, range, duration, includes,
respondedAt, notSelected, withdrawn), `expired.*` (title, widen, bookDirectly). English in `en.json`,
Arabic mirror in `ar.json`.
