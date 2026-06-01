# Data Model: Category → Service Booking Flow

**Feature**: 006-category-service-booking  
**Date**: 2026-05-10

---

## New Types (`store/api/centerServicesApi.ts`)

### `ServiceCategoryResponse`

Represents a service category offered by a specific center. Returned by `GET /centers/{id}/categories`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | ✅ | PK |
| `nameAr` | `string` | ✅ | Arabic display name |
| `nameEn` | `string` | ✅ | English display name |
| `descriptionAr` | `string` | optional | Arabic description |
| `descriptionEn` | `string` | optional | English description |
| `iconUrl` | `string` | optional | Remote icon URL |

### `ServiceDetail`

Represents the global service definition within a category.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | ✅ | PK |
| `code` | `string` | ✅ | Machine-readable code (e.g., `REPAIR`) |
| `nameAr` | `string` | ✅ | Arabic display name |
| `nameEn` | `string` | ✅ | English display name |
| `descriptionAr` | `string` | optional | |
| `descriptionEn` | `string` | optional | |
| `iconUrl` | `string` | optional | |

### `CenterServiceResponse`

Represents a (category, service) pair offered by a center. Returned by `GET /centers/{id}/categories/{catId}/services`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | ✅ | center_service PK — this is the `serviceId` sent in `CreateBookingRequest` |
| `category` | `ServiceCategoryResponse` | ✅ | Nested |
| `service` | `ServiceDetail` | ✅ | Nested |
| `minPrice` | `number` | optional | KD, 3 decimal places. Not displayed in this phase. |
| `maxPrice` | `number` | optional | KD, 3 decimal places. Not displayed in this phase. |
| `typicalDurationMinutes` | `number` | optional | Not displayed in this phase. |
| `descriptionAr` | `string` | optional | Center-specific service description |
| `descriptionEn` | `string` | optional | |
| `isActive` | `boolean` | ✅ | Server filters to `true` before returning |

---

## Modified Types (`store/api/bookingsApi.ts`)

### New: `BookingCategoryRef`

Nested object on `Booking` for post-migration bookings. `null` on legacy rows.

| Field | Type |
|-------|------|
| `id` | `number` |
| `nameAr` | `string` |
| `nameEn` | `string` |

### New: `BookingServiceRef`

Nested object on `Booking` for post-migration bookings. `null` on legacy rows.

| Field | Type |
|-------|------|
| `id` | `number` |
| `code` | `string` |
| `nameAr` | `string` |
| `nameEn` | `string` |

### Modified: `Booking`

Two optional fields added. All existing fields unchanged.

| Field | Change |
|-------|--------|
| `serviceType` | Kept as-is (still present on legacy rows; deprecated for new rows but non-null from API during transition) |
| `category` | NEW optional `BookingCategoryRef \| null` |
| `service` | NEW optional `BookingServiceRef \| null` |

### Modified: `CreateBookingRequest`

`serviceType` removed. `categoryId` and `serviceId` added as required fields.

| Field | Change |
|-------|--------|
| `serviceType` | REMOVED |
| `categoryId` | NEW required `number` |
| `serviceId` | NEW required `number` (maps to `CenterServiceResponse.id`) |
| All other fields | Unchanged |

---

## State Transitions

### Booking creation flow state

```
Center Detail
  └─ handleBookNow()
       ↓
CategorySelectScreen  [centerId in route params]
  └─ user taps category
       ↓
new.tsx Step 0  [centerId + categoryId in route params]
  → RTK Query: useGetServicesForCenterCategoryQuery
  └─ user selects CenterServiceResponse
       ↓
new.tsx Step 1  [date/time — unchanged]
       ↓
new.tsx Step 2  [confirm — unchanged except summary label]
       ↓
confirmation.tsx  [params: categoryId, serviceId, names, date, time, payment, phone]
       ↓
createBooking mutation  [body: { centerId, categoryId, serviceId, ... }]
       ↓
Bookings list / detail  [reads booking.category + booking.service]
```

### Legacy booking rendering state

```
booking.service present?
  YES → display booking.service.nameAr/En
  NO  → display getServiceTypeLabel(booking.serviceType)
        + render "Legacy" tag badge
```

---

## Validation Rules

- `categoryId` and `serviceId` are required on new `CreateBookingRequest`. UI must prevent submission without both selected.
- `serviceId` corresponds to `CenterServiceResponse.id` (the center_service junction record), not `ServiceDetail.id`.
- A `CenterServiceResponse` with `isActive: false` must never be displayed (server filters, but client should not render inactive entries if returned).
