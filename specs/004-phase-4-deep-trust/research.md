# Research: Phase 4.0 — Deep Trust

**Branch**: `004-phase-4-deep-trust`
**Date**: 2026-04-15

---

## Resolution Log

### 1. QUOTE_READY as a BookingStatus value

**Question**: Is `QUOTE_READY` a new `BookingStatus` value, or is it a `WorkStage`?

**Decision**: `QUOTE_READY` is a new `BookingStatus` enum value, added to the existing `BookingStatus` enum in `store/api/bookingsApi.ts`. It represents a booking-level state between `CONFIRMED` and `IN_PROGRESS`.

**Rationale**: The spec says "booking with status `QUOTE_READY`" and "QuoteCard when the booking status is `QUOTE_READY`". This is a first-class booking state, not a work stage. The booking transitions: `CONFIRMED → QUOTE_READY → IN_PROGRESS → COMPLETED`.

**Alternatives considered**: Treating it as a WorkStage — rejected because the spec explicitly uses `bookingStatus` (not a work stage field).

---

### 2. WorkStage vs BookingStatus separation

**Question**: Are work progress stages (Received, Diagnosing, etc.) the same as BookingStatus?

**Decision**: `WorkStage` is a separate enum defined in `store/api/progressApi.ts`. It covers the granular internal timeline returned by `GET /bookings/:id/progress`. It is independent of `BookingStatus`.

**Rationale**: Work stages (RECEIVED, DIAGNOSING, PARTS_ORDERED, etc.) represent what the technician is doing. `BookingStatus` represents the administrative state of the booking. They serve different purposes.

**WorkStage values**: `RECEIVED`, `DIAGNOSING`, `PARTS_ORDERED`, `WORK_IN_PROGRESS`, `QUALITY_CHECK`, `READY_FOR_PICKUP`, `PICKED_UP`

---

### 3. Work Progress Navigation

**Question**: How is the Work Progress screen accessed and what are its routing params?

**Decision**: New screen at `app/(app)/(tabs)/bookings/progress.tsx`. Navigated from `bookings/[id].tsx` using:
```typescript
router.push({ pathname: '/(app)/(tabs)/bookings/progress', params: { id: String(bookingId) } })
```
The "Track Progress" button is visible when `bookingStatus ∈ {CONFIRMED, QUOTE_READY, IN_PROGRESS}`.

**Rationale**: Flat routing under `(tabs)/bookings/` is consistent with existing booking screens (`new.tsx`, `confirmation.tsx`, `success.tsx`). Using `id` as the param name matches the `bookings/[id].tsx` pattern.

---

### 4. Photos Screen Navigation

**Question**: When is the "Work Photos" button visible, and where does it navigate?

**Decision**: New screen at `app/(app)/(tabs)/bookings/photos.tsx`. The "Work Photos" button is always visible on booking detail (photo count shown when >0; empty state handled inside the screen). Navigated with:
```typescript
router.push({ pathname: '/(app)/(tabs)/bookings/photos', params: { id: String(bookingId) } })
```

**Rationale**: Always showing the button avoids a race condition where the button appears/disappears as media count is fetched. The empty state inside the screen is a better UX.

---

### 5. Trust Badges API

**Question**: Are trust badges included in the center detail response or a separate endpoint?

**Decision**: Separate endpoint `GET /centers/:id/badges` — added to the existing `centersApi.ts` as an additional RTK Query endpoint (not a new slice). This keeps the center detail payload lean and allows badges to be lazy-loaded.

**Rationale**: Center detail is already fetched on page load. Adding badges to a separate endpoint lets badges load independently without blocking the main center detail render. The badges section renders an empty state gracefully while loading.

**New endpoint added to centersApi.ts**: `getCenterBadges: builder.query<TrustBadge[], number>`

---

### 6. Full-Screen Photo Modal

**Question**: What library/approach to use for full-screen photo viewing?

**Decision**: React Native built-in `Modal` component with `expo-image` for rendering. No new library required.

**Rationale**: The existing project already uses `expo-image` for lazy-loaded images (as per CLAUDE.md). The built-in `Modal` is sufficient for a simple full-screen photo view with caption. Adding `react-native-image-viewing` or similar would be an unnecessary dependency.

---

### 7. Quote Rejection UX

**Question**: Inline or modal for the rejection reason input?

**Decision**: Inline expansion within the QuoteCard — same approach as the cancel booking reason dialog in `bookings/[id].tsx`. When "Reject" is tapped, a `TextInput` expands below the buttons for the optional reason, followed by a "Confirm Rejection" button.

**Rationale**: Consistent with existing UX pattern in the same screen. Avoids nested modals.

---

### 8. Offline Guard for Quote Actions

**Decision**: Use the existing `useNetworkStatus` hook from `hooks/useNetworkStatus.ts`. Approve/Reject buttons are disabled + an inline `#F44336` banner shows when `isConnected === false`. No navigation away from the screen.

**Rationale**: Same pattern as existing form screens. Blocking the action with a visible banner is better UX than silently failing.

---

### 9. New API Slices vs Extending Existing

**Question**: Should `progressApi`, `mediaApi`, `quoteApi` be new slices or added to `bookingsApi.ts`?

**Decision**: Three new separate `createApi` slices — `store/api/progressApi.ts`, `store/api/mediaApi.ts`, `store/api/quoteApi.ts`. Each registered independently in `store/index.ts`.

**Rationale**: All existing Phase 1/2 API slices are per-resource (bookingsApi, centersApi, chatApi, etc.). Keeping the same pattern avoids bloating `bookingsApi.ts` and gives each slice its own cache (enabling independent invalidation). Phase 3.5 set the precedent with `pricingApi.ts`.

---

### 10. BookingStatus.QUOTE_READY color

**Decision**: Orange-amber `#FF6F00` for QUOTE_READY status color in `getStatusColor()` function in `bookings/[id].tsx`. Distinct from PENDING (`#FF9800`) and CONFIRMED (`#2196F3`).

**Rationale**: The QUOTE_READY state requires customer action (quote approval). Orange-amber signals urgency without being alarming.
