# Quickstart: Phase 4.0 — Deep Trust

**Branch**: `004-phase-4-deep-trust`
**Date**: 2026-04-15

---

## Prerequisites

All Phase 3.5 dependencies and implementation must be in place (branch `003-phase-3-5-trust-mvp` merged). No new packages are required for Phase 4.0.

Verify the existing setup:
```bash
cd ~/MaintenanceCenters/maintenance-customer-app
cat package.json | grep '"expo-image"'         # Must exist
cat package.json | grep '"react-native-reanimated"'  # Must exist
```

---

## Environment Setup

No new environment variables are required for Phase 4.0. The existing `.env` is sufficient:

```bash
# .env (already configured)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1
```

---

## Backend Requirements

The following backend endpoints must be available before testing Phase 4.0:

| Endpoint | Status | Required For |
|----------|--------|--------------|
| `GET /bookings/:id/progress` | **Not yet implemented** | `WorkProgressTimeline` component |
| `GET /bookings/:id/media` | **Not yet implemented** | `PhotoGrid` component |
| `GET /bookings/:id/quote` | **Not yet implemented** | `QuoteCard` component |
| `POST /quotes/:id/approve` | **Not yet implemented** | Quote approval action |
| `POST /quotes/:id/reject` | **Not yet implemented** | Quote rejection action |
| `GET /centers/:id/badges` | **Not yet implemented** | `TrustBadgeList` component |
| `BookingStatus.QUOTE_READY` | **Not yet implemented** | QuoteCard conditional render |

**Workaround for development** (until backend endpoints are ready):

RTK Query endpoints return empty/undefined when backend is not ready. Components degrade gracefully:
- `WorkProgressTimeline` with empty timeline → shows "No progress updates yet" + 0% bar
- `PhotoGrid` with empty array → shows "No photos yet" empty state
- `QuoteCard` not rendered when `bookingStatus !== QUOTE_READY`
- `TrustBadgeList` with empty array → section hidden entirely

---

## Running the App

```bash
# Web (fastest for UI development)
npx expo start --web

# Android emulator
npx expo start
# Press 'a' in the terminal
```

---

## New Files to Create

In implementation order:

```
lib/i18n/locales/en.json              # Add Phase 4.0 keys
lib/i18n/locales/ar.json              # Add Phase 4.0 Arabic keys
store/api/progressApi.ts              # New RTK Query API slice
store/api/mediaApi.ts                 # New RTK Query API slice
store/api/quoteApi.ts                 # New RTK Query API slice
store/index.ts                        # Register progressApi, mediaApi, quoteApi
store/api/bookingsApi.ts              # Add QUOTE_READY to BookingStatus enum
store/api/centersApi.ts               # Add getCenterBadges endpoint + TrustBadge types
components/bookings/WorkProgressStep.tsx
components/bookings/WorkProgressTimeline.tsx
components/bookings/QuoteCard.tsx
components/bookings/PhotoGrid.tsx
components/centers/TrustBadgeList.tsx
app/(app)/(tabs)/bookings/progress.tsx   # New screen
app/(app)/(tabs)/bookings/photos.tsx     # New screen
app/(app)/(tabs)/bookings/[id].tsx       # Add Track Progress, Work Photos, QuoteCard
app/(app)/(tabs)/centers/[id].tsx        # Add TrustBadgeList section
```

---

## Testing Checklist

### Work Progress Timeline (US1)
- [ ] Open a booking with `bookingStatus = IN_PROGRESS` → "Track Progress" button visible → tap → progress screen opens
- [ ] Progress screen shows timeline with completed stages timestamped
- [ ] Progress bar shows a non-zero percentage
- [ ] Stage with `photoUrl` shows a thumbnail
- [ ] Stage with null `photoUrl` shows no thumbnail (no broken image)
- [ ] Empty timeline → "No progress updates yet" with 0% bar
- [ ] Delayed booking → date shown with "Delayed" indicator
- [ ] Switch to Arabic → all stage names and notes in Arabic, RTL layout

### Work Photos Gallery (US2)
- [ ] "Work Photos" button on booking detail opens photos screen
- [ ] Photos displayed in 2-column grid
- [ ] Tap a photo → full-screen modal with caption and date
- [ ] Category filter bar → filter works correctly
- [ ] No photos → "No photos yet" empty state
- [ ] Switch to Arabic → category names in Arabic, RTL layout

### Quote Review & Approval (US3)
- [ ] Booking with `bookingStatus = QUOTE_READY` → QuoteCard visible on booking detail
- [ ] QuoteCard shows all line items (description, parts, labour), subtotal, discount, tax, total
- [ ] Tap "Approve Quote" → confirmation dialog → confirm → quote approved, booking progresses
- [ ] Tap "Reject Quote" → reason input shown → confirm → quote rejected
- [ ] Quote rejection with no reason → still submits (reason is optional)
- [ ] Offline → approve/reject buttons disabled + offline banner shown
- [ ] Switch to Arabic → all labels and amounts in Arabic (KD format)

### Trust Badges (US4)
- [ ] Open center with trust badges → "Trust & Certifications" section visible with badge icons and labels
- [ ] Open center with no badges → section hidden entirely
- [ ] Switch to Arabic → badge labels in Arabic
