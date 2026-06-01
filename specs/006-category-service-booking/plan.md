# Implementation Plan: Category → Service Booking Flow

**Branch**: `006-category-service-booking` | **Date**: 2026-05-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/006-category-service-booking/spec.md`

---

## Summary

Insert a new CategorySelectScreen between Center Detail and the booking form, replace the booking form's hardcoded service list with a live API query scoped to the chosen center+category, update `CreateBookingRequest` to send `categoryId` + `serviceId` instead of the deprecated `serviceType` enum, and update Bookings list/detail rendering to show the new nested service name with a graceful fallback for pre-migration rows.

**Files to add**: 3 (`centerServicesApi.ts`, `category.tsx`, `research.md`)  
**Files to modify**: 7 (`bookingsApi.ts`, `centers/[id].tsx`, `bookings/new.tsx`, `BookingCard.tsx`, `bookings/[id].tsx`, `en.json`, `ar.json`, `store/index.ts`)

---

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React Native 0.81.5, Expo SDK 54, Expo Router v3, Redux Toolkit + RTK Query, react-i18next  
**Storage**: N/A (feature is read-only API + type changes; no new persistence)  
**Testing**: Jest + React Native Testing Library (existing project pattern)  
**Target Platform**: iOS, Android, Web (react-native-web)  
**Project Type**: mobile-app  
**Performance Goals**: Category list < 3 items (typical); service list ≤ 7 items — no virtualization needed. Render must not block navigation.  
**Constraints**: No new third-party dependencies. Auth header from Redux store (JWT). API base URL from env config.  
**Scale/Scope**: 2 new files, 7 modified files. Feature is isolated to the booking creation path and booking display.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md approved before plan |
| II. Bilingual First | ✅ Pass | New i18n keys added to both en.json + ar.json; all new strings via i18n |
| III. Component-Driven UI | ✅ Pass | CategorySelectScreen built from AppText, AppButton, TouchableOpacity cards |
| IV. API Contract Adherence | ✅ Pass | RTK Query endpoints; JWT from store; base URL from config |
| V. Offline-Awareness | ✅ Pass | Error + retry states on both new fetches; existing form data preserved on error |
| VI. Security & Privacy | ✅ Pass | JWT from SecureStore via Redux; no plain text logging |

No violations. No Complexity Tracking section needed.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-category-service-booking/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code

```text
store/
└── api/
    └── centerServicesApi.ts          NEW — RTK Query slice (2 endpoints)

store/
└── index.ts                          MODIFIED — register centerServicesApi

store/api/
└── bookingsApi.ts                    MODIFIED — extend Booking type, update CreateBookingRequest

app/(app)/(tabs)/
└── centers/
    ├── [id].tsx                      MODIFIED — handleBookNow → category route
    └── [id]/
        └── book/
            └── category.tsx          NEW — CategorySelectScreen

app/(app)/(tabs)/
└── bookings/
    ├── new.tsx                       MODIFIED — Step 0 data-driven; accept categoryId param
    └── [id].tsx                      MODIFIED — service label with legacy fallback

components/
└── listings/
    └── BookingCard.tsx               MODIFIED — service label with legacy fallback

lib/i18n/locales/
├── en.json                           MODIFIED — new keys
└── ar.json                           MODIFIED — new keys
```

---

## Phase 0: Research

### R1 — Routing: `[id].tsx` + `[id]/` coexistence in Expo Router v3

**Decision**: Both `centers/[id].tsx` and `centers/[id]/book/category.tsx` can coexist.  
**Rationale**: In Expo Router v3 (Expo SDK 54), a file segment and a directory segment with the same dynamic name serve different URL paths — `[id].tsx` handles `/centers/123` and `[id]/book/category.tsx` handles `/centers/123/book/category`. They do not conflict.  
**Impact**: No restructuring of existing `[id].tsx` needed. Just create the `[id]/book/` directory with `category.tsx`.

### R2 — authedBaseQuery: shared vs inline

**Decision**: Inline `fetchBaseQuery` + `prepareHeaders` pattern (same as all existing API slices).  
**Rationale**: No shared base query exists in the project. All 14 existing API slices (`authApi`, `centersApi`, `bookingsApi`, etc.) each inline an identical `fetchBaseQuery` block. Introducing a shared helper would be out of scope and risk merge conflicts.  
**Impact**: `centerServicesApi.ts` inlines the same pattern.

### R3 — Route param flow for category → service → booking

**Decision**: Category screen navigates to `new.tsx` passing `{ centerId, categoryId }` as route params.  
**Rationale**: The existing `new.tsx` already receives `centerId` via route params. Adding `categoryId` keeps the existing multi-step form intact and requires only that Step 0 use the params to fire the services query.  
**Impact**: `new.tsx` reads `categoryId` from `useLocalSearchParams`; center detail's `handleBookNow` now goes to the category screen instead.

### R4 — Confirmation screen param contract

**Decision**: Replace `serviceType` param with `categoryId`, `serviceId`, `categoryName`, `serviceName` in the navigation call from `new.tsx` to `confirmation`.  
**Rationale**: The confirmation screen (not yet read) receives flat params. Passing human-readable `categoryName`/`serviceName` avoids a second API call on the confirmation screen.  
**Impact**: `new.tsx` `handleConfirm` sends the new params; `confirmation.tsx` must accept them (minimal change to confirmation screen — only the label displayed in the summary row changes).

### R5 — Legacy booking rendering

**Decision**: A helper `getBookingServiceLabel(booking, isAr)` reads `booking.service?.nameAr/nameEn` when present, falls back to the existing `getServiceTypeLabel(booking.serviceType)` switch for legacy rows.  
**Rationale**: Both `BookingCard.tsx` and `bookings/[id].tsx` implement the same switch today. Extracting a shared helper avoids duplicating the dual-path logic.  
**Impact**: Helper is defined once in `bookingsApi.ts` as a pure exported function; both files import it.

### R6 — Center deactivation error signal

**Decision**: Check HTTP status code 404 or 410 (or backend `businessErrorCode` in error payload) to distinguish "center no longer available" from a transient 500/network error. Display specific message for 4xx, generic message + retry for others.  
**Rationale**: Backend returns `{ businessErrorCode, businessErrorDescription }` on known errors. A 404 on `/centers/{id}/categories` means the center no longer exists; a 503 or network timeout is transient.  
**Impact**: `category.tsx` inspects `error.status` in the RTK Query error object; two different error message i18n keys.

---

## Phase 1: Design & Contracts

### Data Model (`data-model.md` — see sibling file)

#### New Types — `store/api/centerServicesApi.ts`

```typescript
export interface ServiceCategoryResponse {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
}

export interface ServiceDetail {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  iconUrl?: string;
}

export interface CenterServiceResponse {
  id: number;
  category: ServiceCategoryResponse;
  service: ServiceDetail;
  minPrice?: number;
  maxPrice?: number;
  typicalDurationMinutes?: number;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
}
```

#### Modified Types — `store/api/bookingsApi.ts`

```typescript
// ADD — nested refs on Booking
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

// MODIFY Booking — add optional fields (backward compatible)
export interface Booking {
  // ... all existing fields unchanged ...
  serviceType: ServiceType;            // kept — still present on legacy rows
  category?: BookingCategoryRef;       // null on pre-migration bookings
  service?: BookingServiceRef;         // null on pre-migration bookings
}

// MODIFY CreateBookingRequest — replace serviceType with categoryId + serviceId
export interface CreateBookingRequest {
  centerId: number;
  categoryId: number;                  // REPLACES serviceType
  serviceId: number;                   // REPLACES serviceType
  serviceDescription?: string;
  bookingDate: string;
  bookingTime: string;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  specialInstructions?: string;
  // serviceType intentionally omitted from new requests
}

// ADD — shared helper used by BookingCard + booking detail
export function getBookingServiceLabel(
  booking: Pick<Booking, 'service' | 'serviceType'>,
  isAr: boolean
): string {
  if (booking.service) {
    return isAr ? booking.service.nameAr : booking.service.nameEn;
  }
  // legacy fallback — same switch already in BookingCard
  switch (booking.serviceType) {
    case ServiceType.REPAIR:        return 'Repair';       // callers pass t() output
    case ServiceType.INSTALLATION:  return 'Installation';
    // ... etc. — callers actually pass the i18n result, see implementation note
  }
  return booking.serviceType;
}
```

> **Implementation note**: `getBookingServiceLabel` is kept simple — callers pass `t` so the helper only decides which field to read, not which string to return. Actual signature: `getBookingServiceLabel(booking, t, isAr)`.

---

### RTK Query Endpoints — `store/api/centerServicesApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../lib/constants/config';
import { RootState } from '../index';
import type { ServiceCategoryResponse, CenterServiceResponse } from './centerServicesApi';

export const centerServicesApi = createApi({
  reducerPath: 'centerServicesApi',
  tagTypes: ['CenterCategories', 'CenterServices'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.session?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCenterCategories: builder.query<ServiceCategoryResponse[], number>({
      query: (centerId) => `/centers/${centerId}/categories`,
      providesTags: (_result, _err, centerId) => [
        { type: 'CenterCategories' as const, id: centerId },
      ],
    }),
    getServicesForCenterCategory: builder.query<
      CenterServiceResponse[],
      { centerId: number; categoryId: number }
    >({
      query: ({ centerId, categoryId }) =>
        `/centers/${centerId}/categories/${categoryId}/services`,
      providesTags: (_result, _err, { centerId, categoryId }) => [
        { type: 'CenterServices' as const, id: `${centerId}-${categoryId}` },
      ],
    }),
  }),
});

export const {
  useGetCenterCategoriesQuery,
  useGetServicesForCenterCategoryQuery,
} = centerServicesApi;
```

---

### Store Registration — `store/index.ts`

Add to `reducer` map:
```typescript
[centerServicesApi.reducerPath]: centerServicesApi.reducer,
```

Add to `middleware` chain:
```typescript
centerServicesApi.middleware,
```

---

### New Screen: `app/(app)/(tabs)/centers/[id]/book/category.tsx`

**CategorySelectScreen** — full implementation spec:

```
Props/Params (via useLocalSearchParams):
  id: string   ← centerId

State:
  none (RTK Query manages data state)

Hooks:
  useGetCenterCategoriesQuery(centerId)
  useTranslation()
  useRouter()
  i18n.dir() → isRTL

Render flow:
  1. If isLoading → <ActivityIndicator />
  2. If isError:
       - error.status === 404 || 410 → specific "center unavailable" message + back button
       - otherwise → generic error message + retry button (call refetch)
  3. If data.length === 0 → empty-state (icon + t('booking.categorySelect.empty'))
  4. Otherwise → ScrollView of category cards
       Each card: category name (nameAr/nameEn), chevron icon
       onPress → router.push({
         pathname: '/(app)/(tabs)/bookings/new',
         params: { centerId: id, categoryId: String(cat.id) }
       })

Accessibility:
  Each card: accessibilityRole="button", accessibilityLabel=cat.nameAr/nameEn

RTL:
  flexDirection: isRTL ? 'row-reverse' : 'row' on card rows
  Back icon: isRTL ? 'arrow-forward' : 'arrow-back'
```

---

### Modified Screen: `app/(app)/(tabs)/centers/[id].tsx`

**Change**: `handleBookNow` pushes to category screen.

```typescript
// BEFORE
const handleBookNow = () => {
  router.push({
    pathname: '/(app)/(tabs)/bookings/new',
    params: { centerId: String(centerId) },
  });
};

// AFTER
const handleBookNow = () => {
  router.push(`/(app)/(tabs)/centers/${centerId}/book/category`);
};
```

No other changes to this file.

---

### Modified Screen: `app/(app)/(tabs)/bookings/new.tsx`

**Changes**:
1. Read `categoryId` from `useLocalSearchParams` alongside existing `centerId`
2. Add `useGetServicesForCenterCategoryQuery({ centerId: Number(centerId), categoryId: Number(categoryId) })` — skip if either param missing
3. Replace `selectedServiceType: ServiceType | null` with `selectedServiceId: number | null` and `selectedCategoryId: number` (from params)
4. Replace the static `serviceTypes` array + `CATEGORY_SERVICE_MAP` logic with the RTK Query result
5. Step 0 render: show loading/empty/error states from the query; card list renders `centerService.service.nameAr/nameEn`
6. `handleConfirm` passes `categoryId`, `serviceId`, `categoryName`, `serviceName` to confirmation instead of `serviceType`
7. Remove `useGetCentersQuery` (no longer needed for the no-services recommendation block — that logic is now handled by the empty-state on the category screen)

**Key state renames**:
```typescript
// BEFORE
const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);

// AFTER
const [selectedService, setSelectedService] = useState<CenterServiceResponse | null>(null);
```

**Step 0 render guard**:
```typescript
if (servicesLoading) return <ActivityIndicator />;
if (servicesError) return <ErrorState onRetry={refetchServices} />;
if (!servicesData || servicesData.length === 0) return <EmptyState />;
```

**handleConfirm**:
```typescript
router.push({
  pathname: '/(app)/(tabs)/bookings/confirmation',
  params: {
    centerId: String(centerId),
    categoryId: String(selectedService!.category.id),
    serviceId: String(selectedService!.id),
    categoryNameEn: selectedService!.category.nameEn,
    categoryNameAr: selectedService!.category.nameAr,
    serviceNameEn: selectedService!.service.nameEn,
    serviceNameAr: selectedService!.service.nameAr,
    bookingDate: selectedDate,
    bookingTime: `${selectedTime}:00`,
    paymentMethod: selectedPayment,
    customerPhone: customerPhone.trim(),
    serviceDescription: description || '',
    specialInstructions: notes || '',
  },
});
```

---

### Modified Component: `components/listings/BookingCard.tsx`

**Change**: Replace `getServiceTypeLabel(booking.serviceType)` with a dual-path render.

```typescript
const serviceLabel = booking.service
  ? (isAr ? booking.service.nameAr : booking.service.nameEn)
  : getServiceTypeLabel(booking.serviceType);

const isLegacy = !booking.service;

// In render:
<AppText style={styles.serviceType}>
  {serviceLabel}
  {isLegacy && (
    <AppText style={styles.legacyTag}> {t('booking.legacy.tag')}</AppText>
  )}
</AppText>
```

Add `legacyTag` style: small, muted, italic badge.

Also fix: `const centerName = booking.centerName;` → `booking.centerNameAr/centerNameEn` (currently broken — `centerName` doesn't exist on `Booking`):
```typescript
const centerName = isRTL ? booking.centerNameAr : booking.centerNameEn;
```

---

### Modified Screen: `app/(app)/(tabs)/bookings/[id].tsx`

**Change**: Update the Service Info section to use the same dual-path logic.

```typescript
// BEFORE
<AppText style={styles.infoValue}>{getServiceTypeLabel(booking.serviceType)}</AppText>

// AFTER — service name row
const serviceLabel = booking.service
  ? (i18n.language === 'ar' ? booking.service.nameAr : booking.service.nameEn)
  : getServiceTypeLabel(booking.serviceType);
const isLegacy = !booking.service;

<AppText style={styles.infoValue}>
  {serviceLabel}
  {isLegacy && <AppText style={styles.legacyTagInline}> ({t('booking.legacy.tag')})</AppText>}
</AppText>

// Add category row when present:
{booking.category && (
  <View style={styles.infoRow}>
    <Ionicons name="grid-outline" size={20} color="#2196F3" />
    <AppText style={styles.infoLabel}>{t('booking.categoryLabel')}</AppText>
    <AppText style={styles.infoValue}>
      {i18n.language === 'ar' ? booking.category.nameAr : booking.category.nameEn}
    </AppText>
  </View>
)}
```

---

### i18n Keys

#### `lib/i18n/locales/en.json` additions (under `booking`):

```json
"categorySelect": {
  "title": "Select Category",
  "empty": "This center has no available services at the moment.",
  "error": "Could not load categories. Please try again.",
  "centerUnavailable": "This center is no longer accepting bookings.",
  "retry": "Try Again",
  "back": "Go Back"
},
"legacy": {
  "tag": "Legacy",
  "fallbackLabel": "Service"
},
"categoryLabel": "Category",
"serviceLabel": "Service"
```

#### `lib/i18n/locales/ar.json` additions (under `booking`):

```json
"categorySelect": {
  "title": "اختر الفئة",
  "empty": "لا توجد خدمات متاحة في هذا المركز حالياً.",
  "error": "تعذّر تحميل الفئات. يرجى المحاولة مرة أخرى.",
  "centerUnavailable": "هذا المركز لم يعد يقبل الحجوزات.",
  "retry": "إعادة المحاولة",
  "back": "رجوع"
},
"legacy": {
  "tag": "قديم",
  "fallbackLabel": "الخدمة"
},
"categoryLabel": "الفئة",
"serviceLabel": "الخدمة"
```

---

### Agent Context Update

Run after Phase 1 design is complete:

```powershell
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

---

## Contracts (`contracts/`)

### GET /centers/{id}/categories

**Consumer**: `CategorySelectScreen`  
**Returns**: `ServiceCategoryResponse[]`  
**Auth**: Bearer JWT required  
**Empty response** ([]): renders empty-state, does not crash  
**Error 404/410**: "center unavailable" specific message  
**Error 5xx / network**: generic error + retry

### GET /centers/{id}/categories/{catId}/services

**Consumer**: `new.tsx` Step 0  
**Returns**: `CenterServiceResponse[]` (pre-filtered to `isActive: true` server-side)  
**Auth**: Bearer JWT required  
**Empty response** ([]): renders empty-state in Step 0, cannot proceed past step  
**Error**: generic error + retry (inline in Step 0, does not discard other steps' data)

### POST /bookings (modified)

**Consumer**: `new.tsx` → `confirmation.tsx` → `createBooking` mutation  
**Request body change**:

| Field | Before | After |
|-------|--------|-------|
| `serviceType` | required enum | omitted |
| `categoryId` | absent | required number |
| `serviceId` | absent | required number |

**Backward compat**: Backend still accepts `serviceType` during transition; client omits it from new requests.

---

## Task Ordering (for `/speckit.tasks`)

Suggested grouping:

1. **Foundation** (no UI): `centerServicesApi.ts`, type extensions to `bookingsApi.ts`, `store/index.ts` registration, i18n keys in both locale files
2. **New screen**: `category.tsx` + `handleBookNow` change in `centers/[id].tsx`
3. **Booking form rewire**: `new.tsx` Step 0 + `handleConfirm` payload
4. **List + detail**: `BookingCard.tsx` + `bookings/[id].tsx` dual-path label + category row
5. **Polish**: empty/error states audit, RTL spot-check, accessibility labels, smoke test

Tasks 1–2 can be implemented before the backend ships (mockable). Tasks 3–5 need either a real endpoint or an MSW mock.
