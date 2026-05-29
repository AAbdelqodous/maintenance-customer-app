# Research: Category → Service Booking Flow

**Feature**: 006-category-service-booking  
**Date**: 2026-05-10

---

## R1 — Expo Router: `[id].tsx` + `[id]/` directory coexistence

**Decision**: Both can coexist without conflict.

**Rationale**: Expo Router v3 (Expo SDK 54) treats a file `centers/[id].tsx` as the route for `/centers/123`, and a directory `centers/[id]/book/category.tsx` as the route for `/centers/123/book/category`. These are distinct URL patterns — the file serves the exact segment, the directory serves deeper nested paths. No Expo Router v3 documentation or known bug contradicts this.

**Alternatives considered**: Moving Center Detail into `[id]/index.tsx` (renaming + directory restructure) — rejected because it's a high-risk rename for a file not in scope.

---

## R2 — Authentication base query pattern

**Decision**: Inline `fetchBaseQuery` + `prepareHeaders` (identical to all 14 existing API slices).

**Rationale**: No shared `authedBaseQuery` exists in `store/api/`. All existing slices (`authApi`, `centersApi`, `bookingsApi`, `reviewsApi`, `chatApi`, etc.) each define the same `fetchBaseQuery` block inline. A shared helper does not exist and introducing one is out of scope.

**Alternatives considered**: Extract a `createAuthedBaseQuery()` helper to `store/api/baseQuery.ts` — rejected as out of scope for this feature; would touch all 14 existing slices to avoid inconsistency.

---

## R3 — Route param flow: category → service → booking creation

**Decision**: Category screen navigates to `new.tsx` passing `{ centerId, categoryId }` as flat route params. `new.tsx` reads both via `useLocalSearchParams`.

**Rationale**: The existing `new.tsx` already consumes `centerId` via route params and manages its own multi-step state. Adding `categoryId` as a second incoming param requires zero new Redux state and keeps the form's step logic unchanged except for the Step 0 data source.

**Alternatives considered**: Redux store for selected category — rejected as unnecessary; ephemeral selection state that lives only during the booking creation flow does not need Redux persistence.

---

## R4 — Confirmation screen param contract

**Decision**: `new.tsx` passes `categoryId`, `serviceId`, `categoryNameEn`, `categoryNameAr`, `serviceNameEn`, `serviceNameAr` to `confirmation.tsx` as route params (replacing `serviceType`).

**Rationale**: Confirmation screen renders human-readable names. Passing them as params avoids a second API call on the confirmation screen. The existing pattern (flat string params via `router.push`) is already used by `new.tsx` for all other booking fields.

**Alternatives considered**: Pass only IDs and let confirmation re-fetch names — rejected because it adds an unnecessary network call on the confirmation screen and makes confirmation dependent on RTK Query state that may have been evicted.

---

## R5 — Legacy booking service label

**Decision**: Implement `getBookingServiceLabel(booking, t, isAr)` as a pure function exported from `bookingsApi.ts`. Both `BookingCard.tsx` and `bookings/[id].tsx` import and call it.

**Rationale**: The same dual-path logic (new `service` field → legacy `serviceType` fallback) is needed in two places. A shared function avoids duplication and ensures consistent fallback behavior across the app.

**Function signature**:
```typescript
export function getBookingServiceLabel(
  booking: Pick<Booking, 'service' | 'serviceType'>,
  t: TFunction,
  isAr: boolean
): string {
  if (booking.service) {
    return isAr ? booking.service.nameAr : booking.service.nameEn;
  }
  // legacy enum fallback
  return t(`booking.serviceType.${booking.serviceType.toLowerCase()}`);
}
```

**Alternatives considered**: Inline the dual-path check in each component — rejected to avoid duplicated logic and drift.

---

## R6 — Center deactivation error signal from API

**Decision**: In `CategorySelectScreen`, inspect `error.status` from RTK Query's error object. HTTP 404 or 410 → show specific "center no longer accepting bookings" message + back button. Any other error → generic error + retry.

**Rationale**: The backend returns HTTP 404 for unknown resources. A deactivated center that responds to `/centers/{id}/categories` with 404 (or 410 Gone) is unambiguously gone. A 500 or network timeout is transient and warrants retry.

**Note for backend coordination**: If the backend uses a specific `businessErrorCode` (e.g., `CENTER_DEACTIVATED`) rather than HTTP 4xx, the check should be updated to `error?.data?.businessErrorCode === 'CENTER_DEACTIVATED'`. This can be adjusted during integration testing before production.

**Alternatives considered**: Always show specific message — rejected because transient errors would mislead users into thinking the center is gone when it isn't.

---

## R7 — BookingCard: `centerName` field bug

**Decision**: Fix simultaneously with the service label change.

**Rationale**: `BookingCard.tsx` line 17 reads `booking.centerName` which does not exist on the `Booking` type. The correct fields are `booking.centerNameAr` and `booking.centerNameEn`. This is a latent bug that will surface as `undefined` in the card header. Since we are already modifying `BookingCard.tsx` for the service label change, fix it in the same PR.

**Fix**:
```typescript
// BEFORE (broken)
const centerName = booking.centerName;

// AFTER
const centerName = isRTL ? booking.centerNameAr : booking.centerNameEn;
```
