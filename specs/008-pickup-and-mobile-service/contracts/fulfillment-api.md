# API Contracts: Fulfillment (Customer)

**Feature**: 008-pickup-and-mobile-service
**Date**: 2026-05-29
**Backend base**: `GET|POST|PUT|DELETE /api/v1/...`
**Auth**: All endpoints require `Authorization: Bearer <jwt>`
**Money**: Fees are **KD (`KWD`), 3 decimal places**.

> **Status: BACKEND NOT YET IMPLEMENTED.** The fulfillment **capability** (supported modes, service
> area, fee rules) is authored on the **center side** (an extension of center profile/pricing — a
> separate, dependent spec); this contract is the customer-side read + the booking/logistics surface.
> Build against an MSW mock.

---

## GET /centers/{id}/fulfillment

**Consumer**: `FulfillmentModePicker` via `useGetCenterFulfillmentQuery({ centerId, serviceId })`
**Purpose**: Which modes the center supports for the selected service, its area, and fee rules.

### Request
```
GET /api/v1/centers/{id}/fulfillment?serviceId=42
Authorization: Bearer <jwt>
```

### Response — 200 OK
```json
{
  "centerId": 10,
  "serviceId": 42,
  "supportedModes": ["DROP_OFF", "PICKUP_DELIVERY", "AT_HOME"],
  "serviceAreaGovernorates": ["Hawalli", "Salmiya", "Capital"],
  "feeByMode": {
    "DROP_OFF": { "type": "FLAT", "flatAmount": 0.000 },
    "PICKUP_DELIVERY": { "type": "PER_KM", "baseAmount": 3.000, "perKm": 0.250 },
    "AT_HOME": { "type": "FLAT", "flatAmount": 5.000 }
  },
  "centerLat": 29.333, "centerLng": 48.000
}
```
`supportedModes: ["DROP_OFF"]` → only drop-off offered. Client hides modes the center doesn't support
and (R7) modes clearly outside `serviceAreaGovernorates` for the customer's pinned area.

### Errors
| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → auth |
| 404 | No capability → treat as drop-off only |
| 5xx / network | Default to drop-off + retry; never block booking |

---

## GET /me/addresses · POST /me/addresses · PUT /me/addresses/{id} · DELETE /me/addresses/{id}

**Consumer**: `AddressPicker`, `addresses/index.tsx` via `addressesApi`
**Purpose**: Saved service addresses (Home/Work/Other) reused across bookings (R4).

### GET Response — 200 OK
```json
[
  { "id": 3, "label": "HOME", "governorate": "Hawalli", "area": "Block 3", "lat": 29.33, "lng": 48.02, "note": "Villa 5, gate at the back" }
]
```
### POST/PUT body
```json
{ "label": "WORK", "governorate": "Capital", "area": "Sharq", "lat": 29.37, "lng": 47.98, "note": "Tower B, level 4" }
```
DELETE → 204. Empty `[]` → AddressPicker prompts to add/pin one.

### Errors
| Status | Client behavior |
|--------|----------------|
| 400 | Missing governorate → inline |
| 401 | → auth |
| 5xx / network | Error + retry |

---

## POST /bookings  (modified contract)

**Consumer**: `createBooking` from the confirm step
**Purpose**: Create a booking carrying the chosen fulfillment.

### Request body — fulfillment additions
```json
{
  "centerId": 10, "categoryId": 1, "serviceId": 42,
  "bookingDate": "2026-06-02", "bookingTime": "10:00:00",
  "paymentMethod": "KNET",
  "fulfillmentMode": "AT_HOME",
  "serviceAddressId": 3,
  "pickupWindow": { "date": "2026-06-02", "startTime": "09:00", "endTime": "11:00" }
}
```
`serviceAddress` (inline object) may be sent instead of `serviceAddressId` for a one-off. `DROP_OFF`
omits address + window. The backend computes the authoritative `fulfillmentFee` and adds it as a
`FULFILLMENT_FEE` invoice line (`007`).

### Response — 201 Created (fulfillment fields on the Booking)
```json
{
  "id": 1234, "bookingStatus": "PENDING",
  "fulfillmentMode": "AT_HOME",
  "serviceAddress": { "id": 3, "label": "HOME", "governorate": "Hawalli", "note": "Villa 5" },
  "pickupWindow": { "date": "2026-06-02", "startTime": "09:00", "endTime": "11:00" },
  "fulfillmentFee": 5.000
}
```

### Errors
| Status | Client behavior |
|--------|----------------|
| 400 | Missing address/window for a non-drop-off mode, past/invalid window → inline |
| 409 | Mode no longer supported / out of area → re-open the fulfillment step |
| 5xx / network | Error + retry (booking data preserved) |

---

## GET /bookings/{id}/logistics

**Consumer**: `LogisticsTimeline` on `bookings/[id].tsx`
**Purpose**: Current logistics state for a non-drop-off booking (display-only, R3).

### Response — 200 OK
```json
{
  "bookingId": 1234, "mode": "AT_HOME",
  "currentState": "EN_ROUTE", "etaText": "Arriving in ~20 min",
  "declined": false, "declineReason": null,
  "updatedAt": "2026-06-02T09:40:00Z"
}
```
Drop-off → 404/empty (uses normal booking status). Refetch on focus + push.

### Errors
| Status | Client behavior |
|--------|----------------|
| 401 | → auth |
| 404 | Drop-off / no logistics → hide the timeline |
| 5xx / network | Cached state if present, else retry |

---

## POST /bookings/{id}/fulfillment/re-choose

**Consumer**: decline handling on `bookings/[id].tsx`
**Purpose**: After a center decline (out-of-area), switch mode or cancel (R7/FR-008).

### Request
```json
{ "fulfillmentMode": "DROP_OFF" }    // or { "cancel": true }
```
### Response — 200 OK — the updated `Booking` (or cancellation confirmation).

### Errors
| Status | Client behavior |
|--------|----------------|
| 409 | New mode also unsupported → show remaining options |
| 5xx / network | Error + retry |

---

## Notification / refresh events (push → client refetch)

| Event | Client behavior |
|-------|-----------------|
| Logistics status changed | Refetch `GET /bookings/{id}/logistics`; notification |
| Center declined the requested mode | Refetch; surface re-choose/cancel (R7) |

---

## RTK Query tag invalidation

| Mutation | Invalidates |
|----------|-------------|
| `createAddress` / `updateAddress` / `deleteAddress` | `Address` |
| `reChooseFulfillment` | `Logistics` (bookingId), `bookingsApi` Booking |
| logistics push event | `Logistics` (bookingId) — refetch on focus |

---

## i18n Key Set (namespace `fulfillment.*`)

`mode.*` (dropOff, pickupDelivery, atHome, choose), `fee.*` (label, flat, perKm, free, shownBefore),
`address.*` (saved, addNew, pin, useCurrent, manual, note, label: home/work/other), `window.*` (title,
date, from, to, pastError, hoursError), `status.*` (pickupScheduled, enRouteToCustomer, collected,
atCenter, outForReturn, delivered, techAssigned, enRoute, arrived, inProgress, completed, eta),
`decline.*` (title, reason, switchToDropOff, cancel, outOfArea). English in `en.json`, Arabic mirror.
