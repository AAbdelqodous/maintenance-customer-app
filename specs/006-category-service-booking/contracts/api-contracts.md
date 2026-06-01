# API Contracts: Category → Service Booking Flow

**Feature**: 006-category-service-booking  
**Date**: 2026-05-10  
**Backend base**: `GET|POST /api/v1/...`  
**Auth**: All endpoints require `Authorization: Bearer <jwt>`

---

## GET /centers/{id}/categories

**Consumer**: `CategorySelectScreen` via `useGetCenterCategoriesQuery(centerId)`  
**Purpose**: Fetch all service categories the center actively offers.

### Request

```
GET /api/v1/centers/{id}/categories
Authorization: Bearer <jwt>
```

### Response — 200 OK

```json
[
  {
    "id": 1,
    "nameAr": "إصلاح",
    "nameEn": "Repair",
    "descriptionAr": "خدمات الإصلاح",
    "descriptionEn": "Repair services",
    "iconUrl": null
  }
]
```

Empty array `[]` = center has no active categories. Client renders empty-state.

### Error responses

| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware intercepts → redirect to auth |
| 404 / 410 | Show "center no longer accepting bookings" + back button |
| 5xx / network | Show generic error + retry |

---

## GET /centers/{id}/categories/{catId}/services

**Consumer**: `new.tsx` Step 0 via `useGetServicesForCenterCategoryQuery({ centerId, categoryId })`  
**Purpose**: Fetch active services a center offers within a given category.

### Request

```
GET /api/v1/centers/{id}/categories/{catId}/services
Authorization: Bearer <jwt>
```

### Response — 200 OK

```json
[
  {
    "id": 42,
    "category": {
      "id": 1,
      "nameAr": "إصلاح",
      "nameEn": "Repair"
    },
    "service": {
      "id": 7,
      "code": "REPAIR",
      "nameAr": "إصلاح",
      "nameEn": "Repair",
      "descriptionAr": "خدمات الإصلاح العامة",
      "descriptionEn": "General repair services",
      "iconUrl": null
    },
    "minPrice": 5.000,
    "maxPrice": 50.000,
    "typicalDurationMinutes": 60,
    "descriptionAr": null,
    "descriptionEn": null,
    "isActive": true
  }
]
```

**Note**: `id` at the top level is the `center_service` junction record ID. This value is sent as `serviceId` in the booking creation request.

Empty array `[]` = center has no active services in this category. Client renders empty-state in Step 0; customer cannot proceed.

### Error responses

| Status | Client behavior |
|--------|----------------|
| 401 | Redux middleware → redirect to auth |
| 404 | Generic error + retry (category may have been removed) |
| 5xx / network | Generic error + retry (data from other steps preserved) |

---

## POST /bookings (modified contract)

**Consumer**: `createBooking` mutation called from `confirmation.tsx`  
**Purpose**: Create a new booking using the new category+service hierarchy.

### Request body — NEW format

```json
{
  "centerId": 10,
  "categoryId": 1,
  "serviceId": 42,
  "serviceDescription": "Engine making noise",
  "bookingDate": "2026-05-15",
  "bookingTime": "10:00:00",
  "paymentMethod": "CASH",
  "customerPhone": "+965 9999 9999",
  "specialInstructions": "Please call before arriving"
}
```

**Breaking changes from previous format**:
- `serviceType` field: **omitted** from new requests (was required; now deprecated)
- `categoryId`: **added** (required)
- `serviceId`: **added** (required — maps to `CenterServiceResponse.id`)

### Response — 201 Created

```json
{
  "id": 123,
  "bookingNumber": "BK-00123",
  "centerId": 10,
  "centerNameAr": "مركز الخليج",
  "centerNameEn": "Gulf Center",
  "serviceType": "REPAIR",
  "category": {
    "id": 1,
    "nameAr": "إصلاح",
    "nameEn": "Repair"
  },
  "service": {
    "id": 7,
    "code": "REPAIR",
    "nameAr": "إصلاح",
    "nameEn": "Repair"
  },
  "bookingDate": "2026-05-15",
  "bookingTime": "10:00:00",
  "bookingStatus": "PENDING",
  "paymentMethod": "CASH",
  "paymentStatus": "PENDING",
  "createdAt": "2026-05-10T12:00:00Z",
  "updatedAt": "2026-05-10T12:00:00Z"
}
```

**Note**: `serviceType` still present in response during transition window. Treat as deprecated — display logic prefers `service.nameAr/En` when `service` is non-null.

---

## Booking response — legacy vs new field matrix

| Booking era | `serviceType` | `category` | `service` | Display strategy |
|-------------|--------------|-----------|----------|-----------------|
| Pre-migration | populated enum | `null` | `null` | Show `serviceType` + Legacy tag |
| Post-migration | may be populated (back-compat) | populated | populated | Show `service.nameAr/En` |
| Partial (edge case) | populated | populated | `null` | Show `serviceType` + Legacy tag |
