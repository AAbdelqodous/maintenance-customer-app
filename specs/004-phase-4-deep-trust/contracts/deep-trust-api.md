# API Contracts: Phase 4.0 — Deep Trust

**Branch**: `004-phase-4-deep-trust`
**Date**: 2026-04-15
**Backend Repo**: `life-experience-app/service-center` (Spring Boot)

---

## New Endpoints

### `GET /bookings/{bookingId}/progress`

Fetch the work progress timeline for a booking.

**Request**
```
GET /api/v1/bookings/{bookingId}/progress
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
{
  "bookingId": 42,
  "currentStage": "WORK_IN_PROGRESS",
  "currentStageDescription": "Technicians are replacing the engine oil and filter.",
  "progressPercentage": 57,
  "estimatedCompletionDate": "2026-04-16",
  "isDelayed": false,
  "nextExpectedStage": "QUALITY_CHECK",
  "timeline": [
    {
      "stage": "RECEIVED",
      "stageDisplayName": "Received",
      "notes": "Vehicle received in good condition.",
      "photoUrl": null,
      "timestamp": "2026-04-15T09:00:00Z",
      "isCompleted": true,
      "isCurrent": false
    },
    {
      "stage": "DIAGNOSING",
      "stageDisplayName": "Diagnosing",
      "notes": "Full engine diagnostics completed.",
      "photoUrl": "https://cdn.example.com/media/diag-001.jpg",
      "timestamp": "2026-04-15T10:30:00Z",
      "isCompleted": true,
      "isCurrent": false
    },
    {
      "stage": "WORK_IN_PROGRESS",
      "stageDisplayName": "Work in Progress",
      "notes": null,
      "photoUrl": null,
      "timestamp": "2026-04-15T13:00:00Z",
      "isCompleted": false,
      "isCurrent": true
    }
  ]
}
```

**Response `200 OK` (empty timeline)**
```json
{
  "bookingId": 42,
  "currentStage": null,
  "currentStageDescription": null,
  "progressPercentage": 0,
  "estimatedCompletionDate": null,
  "isDelayed": false,
  "nextExpectedStage": "RECEIVED",
  "timeline": []
}
```

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing or expired JWT |
| `403` | Booking belongs to a different user |
| `404` | Booking not found |

**Notes**:
- `stageDisplayName` is localised per `Accept-Language` header.
- `photoUrl` may be `null` — render timeline item without thumbnail.
- `timeline` returns only stages that have occurred (not future stages).

---

### `GET /bookings/{bookingId}/media`

Fetch all work photos for a booking.

**Request**
```
GET /api/v1/bookings/{bookingId}/media
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Query Parameters**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `MediaCategory` enum | No | Filter by category |

**Response `200 OK`**
```json
[
  {
    "id": 1,
    "url": "https://cdn.example.com/media/booking-42-001.jpg",
    "category": "DIAGNOSTICS",
    "categoryDisplayNameAr": "التشخيص",
    "categoryDisplayNameEn": "Diagnostics",
    "caption": "Engine diagnostic report attached.",
    "createdAt": "2026-04-15T10:45:00Z"
  }
]
```

**Response `200 OK` (no media)**
```json
[]
```

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing or expired JWT |
| `403` | Booking belongs to a different user |
| `404` | Booking not found |

---

### `GET /bookings/{bookingId}/quote`

Fetch the current active quote for a booking.

**Request**
```
GET /api/v1/bookings/{bookingId}/quote
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
{
  "id": 10,
  "bookingId": 42,
  "version": 1,
  "lineItems": [
    {
      "id": 1,
      "descriptionEn": "Engine Oil Change",
      "descriptionAr": "تغيير زيت المحرك",
      "partsCost": 8.000,
      "labourCost": 5.000
    },
    {
      "id": 2,
      "descriptionEn": "Oil Filter Replacement",
      "descriptionAr": "استبدال فلتر الزيت",
      "partsCost": 3.500,
      "labourCost": 2.000
    }
  ],
  "subtotal": 18.500,
  "discount": 0.000,
  "tax": 0.000,
  "total": 18.500,
  "estimatedDurationMinutes": 90,
  "estimatedDuration": "1.5 hours",
  "status": "SENT",
  "createdAt": "2026-04-15T11:00:00Z",
  "updatedAt": "2026-04-15T11:00:00Z"
}
```

**Response `404`** when no quote exists for this booking (booking not yet at `QUOTE_READY` stage).

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing or expired JWT |
| `403` | Booking belongs to a different user |
| `404` | Booking not found or no quote exists |

---

### `POST /quotes/{quoteId}/approve`

Approve a quote. Center is notified and begins work.

**Request**
```
POST /api/v1/quotes/{quoteId}/approve
Authorization: Bearer <jwt>
Content-Type: application/json

{}
```
*(Empty body — no payload required)*

**Response `204 No Content`**

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing or expired JWT |
| `403` | Quote belongs to a booking of a different user |
| `404` | Quote not found |
| `409` | Quote already approved or rejected |

---

### `POST /quotes/{quoteId}/reject`

Reject a quote with an optional reason.

**Request**
```
POST /api/v1/quotes/{quoteId}/reject
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "reason": "Price is too high"
}
```

**Response `204 No Content`**

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing or expired JWT |
| `403` | Quote belongs to a different user's booking |
| `404` | Quote not found |
| `409` | Quote already approved or rejected |

---

### `GET /centers/{centerId}/badges`

Fetch trust badges for a maintenance center.

**Request**
```
GET /api/v1/centers/{centerId}/badges
Authorization: Bearer <jwt>
Accept-Language: ar | en
```

**Response `200 OK`**
```json
[
  {
    "badgeType": "VERIFIED_BUSINESS",
    "labelAr": "نشاط تجاري موثق",
    "labelEn": "Verified Business",
    "iconName": "shield-checkmark",
    "awardedAt": "2025-01-15",
    "metadata": null
  },
  {
    "badgeType": "YEARS_EXPERIENCE",
    "labelAr": "5 سنوات خبرة",
    "labelEn": "5 Years Experience",
    "iconName": "star",
    "awardedAt": "2025-01-15",
    "metadata": { "years": "5" }
  }
]
```

**Response `200 OK` (no badges)**
```json
[]
```

**Error Responses**
| Code | Condition |
|------|-----------|
| `401` | Missing or expired JWT |
| `404` | Center not found |

**Notes**:
- Empty array → client hides the Trust & Certifications section entirely.
- `iconName` maps directly to Ionicons icon names.
- `labelAr`/`labelEn` are pre-formatted by the backend (e.g. "5 Years Experience" already has the value substituted).

---

## RTK Query Endpoint Definitions (Mobile)

### `progressApi.ts` — New

```typescript
// store/api/progressApi.ts
getBookingProgress: builder.query<WorkProgressResponse, number>({
  query: (bookingId) => `bookings/${bookingId}/progress`,
  providesTags: (result, error, bookingId) => [{ type: 'Progress', id: bookingId }],
})
```

### `mediaApi.ts` — New

```typescript
// store/api/mediaApi.ts
getBookingMedia: builder.query<BookingMedia[], { bookingId: number; category?: MediaCategory }>({
  query: ({ bookingId, category }) => ({
    url: `bookings/${bookingId}/media`,
    params: category ? { category } : undefined,
  }),
  providesTags: (result, error, { bookingId }) => [{ type: 'Media', id: bookingId }],
})
```

### `quoteApi.ts` — New

```typescript
// store/api/quoteApi.ts
getBookingQuote: builder.query<BookingQuote, number>({
  query: (bookingId) => `bookings/${bookingId}/quote`,
  providesTags: (result, error, bookingId) => [{ type: 'Quote', id: bookingId }],
}),
approveQuote: builder.mutation<void, number>({
  query: (quoteId) => ({ url: `quotes/${quoteId}/approve`, method: 'POST', body: {} }),
  invalidatesTags: (result, error, quoteId) => [{ type: 'Quote' }],
}),
rejectQuote: builder.mutation<void, { quoteId: number; reason?: string }>({
  query: ({ quoteId, reason }) => ({
    url: `quotes/${quoteId}/reject`,
    method: 'POST',
    body: { reason: reason ?? '' },
  }),
  invalidatesTags: () => [{ type: 'Quote' }],
})
```

### `centersApi.ts` — Additive

```typescript
// Add to existing centersApi endpoints
getCenterBadges: builder.query<TrustBadge[], number>({
  query: (centerId) => `centers/${centerId}/badges`,
  providesTags: (result, error, centerId) => [{ type: 'Badges', id: centerId }],
})
```

---

## Store Registration

```typescript
// store/index.ts — additions only
import { progressApi } from './api/progressApi';
import { mediaApi } from './api/mediaApi';
import { quoteApi } from './api/quoteApi';

const store = configureStore({
  reducer: {
    // ...existing reducers
    [progressApi.reducerPath]: progressApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
    [quoteApi.reducerPath]: quoteApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      // ...existing middleware
      .concat(progressApi.middleware, mediaApi.middleware, quoteApi.middleware),
});
```
