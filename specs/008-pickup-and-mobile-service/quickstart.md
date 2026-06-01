# Quickstart: Pickup & Delivery and At-Home Mobile Service

**Branch**: `008-pickup-and-mobile-service`
**Date**: 2026-05-29

---

## Prerequisites

- Customer app builds and runs.
- `006-category-service-booking` — fulfillment is chosen after service selection in the booking wizard.
- `002-phase-2-core-screens` — extends the existing `bookings/new.tsx` + `bookings/[id].tsx`.
- Pairs with `007-payments-wallet-escrow` — the fulfillment fee is an invoice line.
- **Center-side dependency**: centers declare supported modes + service area + fee rules (an extension
  of center profile/pricing — a separate spec). Until that ships, use the MSW capability mock.

Verify the booking flow shape:
```bash
cd ~/MaintenanceCenter/maintenance-customer-app
grep -n "const \[step" "app/(app)/(tabs)/bookings/new.tsx"   # 3-step wizard to extend
grep -n "expo-location\|react-native-maps" package.json       # added by this feature
```

---

## New packages

```bash
npx expo install expo-location          # current location + reverse geocode
npx expo install react-native-maps      # interactive pin (native); web falls back to manual address (R5)
```

> `react-native-maps` needs a **dev/preview build** (not stock Expo Go) and a Google Maps key for
> Android — finalize in the production/EAS spec. The web target uses manual address + lat/lng, no map.

---

## Environment Setup

No new client env vars (a Maps API key is a build/EAS config item, not app `.env`).
```bash
# .env (already configured)
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api/v1
```

---

## Backend Requirements

| Endpoint | Status | Required for |
|----------|--------|--------------|
| `GET /centers/{id}/fulfillment?serviceId` | **Not yet implemented** | Mode picker (capability) |
| `GET|POST|PUT|DELETE /me/addresses` | **Not yet implemented** | Saved addresses |
| `POST /bookings` (fulfillment fields) | **Modify existing** | Booking creation |
| `GET /bookings/{id}/logistics` | **Not yet implemented** | Logistics timeline |
| `POST /bookings/{id}/fulfillment/re-choose` | **Not yet implemented** | Decline → re-choose |
| Center capability authoring | **Center-side dependency** | Real supported modes/area/fees |

See `contracts/fulfillment-api.md` for exact shapes.

**Develop without the backend (MSW mock):** `GET /centers/{id}/fulfillment` → all three modes with a
flat + per-km fee; `GET /me/addresses` → one saved Home; `POST /bookings` → echoes the fulfillment
fields + a computed fee; `GET /bookings/{id}/logistics` → advance `currentState` across calls to exercise
the timeline; set `declined:true` to exercise the re-choose path.

---

## Running the App

```bash
npx expo start --web      # fastest for the step UI (map → manual fallback)
npx expo run:android      # dev build for the interactive map pin
```

---

## New files to create

```
types/fulfillment.ts
store/api/fulfillmentApi.ts
store/api/addressesApi.ts
components/fulfillment/FulfillmentModePicker.tsx
components/fulfillment/AddressPicker.tsx
components/fulfillment/LogisticsTimeline.tsx
app/(app)/addresses/_layout.tsx
app/(app)/addresses/index.tsx
```

## Files to modify

```
store/index.ts                           # register fulfillmentApi + addressesApi
store/api/bookingsApi.ts                  # CreateBookingRequest + Booking fulfillment fields
app/(app)/(tabs)/bookings/new.tsx         # insert the fulfillment step (after service)
app/(app)/(tabs)/bookings/[id].tsx        # LogisticsTimeline + decline → re-choose
lib/i18n/locales/en.json                  # fulfillment.* keys
lib/i18n/locales/ar.json                  # mirror
```

---

## Smoke test (happy paths)

1. **At-home appliance** — book an appliance service at a center that supports At-Home → choose At-Home,
   pin/select an address + arrival window → the at-home fee shows before continue → confirm → booking
   carries `fulfillmentMode: AT_HOME` + address + fee.
2. **Pickup & delivery (car)** — choose Pickup & Delivery → set pickup address/window → round-trip fee
   shown → confirm → booking detail shows the two-leg logistics timeline; advance the mock states and
   see notifications.
3. **Drop-off unchanged** — choose Drop-off → no address/window, fee 0 → booking behaves exactly as today.
4. **Out-of-area hidden** — pin an address outside the center's `serviceAreaGovernorates` → At-Home/Pickup
   hidden up front; only Drop-off offered.
5. **Decline → re-choose** — mock `logistics.declined:true` → booking paused → switch to Drop-off or cancel
   without penalty.
6. **Saved addresses** — add Home + Work in `addresses/index.tsx`; reuse them in the picker.
7. **Permission denied** — deny location at the address step → manual address entry path still completes the booking.

---

## Verification checklist

- [ ] Only `capability.supportedModes` are offered; clearly out-of-area modes hidden.
- [ ] Fulfillment fee shown **before** confirming the mode; rendered via the shared KD formatter (3 decimals).
- [ ] Non-drop-off requires address + window; window not in the past and within center hours.
- [ ] Logistics timeline is display-only; states + ETA update on refetch/push; client never advances a leg.
- [ ] Decline pauses the booking and offers re-choose (drop-off) or cancel without penalty.
- [ ] Location requested only at the address step; denial → manual entry; coordinates never logged.
- [ ] Web target: map degrades to area select + manual address + optional lat/lng.
- [ ] RTL spot-check: mode picker, address picker, window, logistics timeline.
- [ ] Offline: capability/status degrade gracefully (cached + retry / default to drop-off), not blank/crash.
