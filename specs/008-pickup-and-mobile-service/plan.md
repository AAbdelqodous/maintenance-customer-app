# Implementation Plan: Pickup & Delivery and At-Home Mobile Service

**Branch**: `008-pickup-and-mobile-service` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/008-pickup-and-mobile-service/spec.md`

---

## Summary

Add a fulfillment step to the booking flow so a customer chooses, per booking, **how** the service is
delivered: **Drop-off** (today's default), **Pickup & Delivery** (the center collects and returns the
vehicle/appliance), or **At-Home** (a technician performs the work at the customer's location). Each
non-default mode may carry a transparent **fulfillment fee** shown before commit, captures a **service
address + map pin** and a **pickup/arrival window**, and exposes **logistics status** on the booking
detail with per-change notifications.

**Repo scope**: customer React Native app. This plan covers the **client**. Centers **declare** which
modes they support, their service area, and fee rules — that authoring is a **center-side dependency**
(an extension of center profile/pricing) marked out-of-scope here; the client *consumes* a
fulfillment-capability read and *advances* nothing on the logistics legs (the center drives status).

The feature inserts one step into `bookings/new.tsx`, adds a fulfillment fee line to the invoice
consumed by `007-payments-wallet-escrow`, and renders logistics state on `bookings/[id].tsx`.

**Files to add (client)**: 8 — `types/fulfillment.ts`, `store/api/fulfillmentApi.ts`,
`store/api/addressesApi.ts`, `components/fulfillment/FulfillmentModePicker.tsx`,
`components/fulfillment/AddressPicker.tsx`, `components/fulfillment/LogisticsTimeline.tsx`,
`app/(app)/addresses/_layout.tsx`, `app/(app)/addresses/index.tsx` (manage saved addresses).
**Files to modify (client)**: 6 — `store/api/bookingsApi.ts` (`CreateBookingRequest` + `Booking`
fulfillment fields), `app/(app)/(tabs)/bookings/new.tsx` (fulfillment step), `app/(app)/(tabs)/bookings/[id].tsx`
(logistics timeline + decline handling), `store/index.ts`, `lib/i18n/locales/en.json`, `ar.json`.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React Native 0.81.5, Expo SDK 54, Expo Router v3, Redux Toolkit + RTK Query, react-i18next. **New**: `expo-location` (current location + reverse geocode). The interactive **map pin** uses `react-native-maps` on native with a documented web/manual fallback (R5).
**Storage**: Saved addresses are server-side (per customer); RTK Query cache. No new on-device persistence.
**Testing**: Jest + RNTL (existing); pure fee/format + window-validation helpers unit-tested.
**Target Platform**: iOS, Android, Web (react-native-web — map degrades to address entry + lat/lng).
**Project Type**: mobile-app (client of a Spring Boot API)
**Performance Goals**: Complete an at-home booking incl. pinning < 2 min (SC-001); logistics status change → notification median < 10s (SC-005, depends on push).
**Constraints**: All strings bilingual + RTL; KD 3 decimals; **never charge an unshown fee** (FR-003); window validated against center hours and not in the past; JWT from secure store; no hardcoded URLs.
**Scale/Scope**: One fulfillment step + an address-capture screen + a logistics timeline; saved addresses (Home/Work/Other).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | spec.md approved before plan |
| II. Bilingual First | ✅ Pass | Mode labels, fee, status states via i18n; KD localized; RTL on the step + timeline |
| III. Component-Driven UI | ✅ Pass | `FulfillmentModePicker`, `AddressPicker`, `LogisticsTimeline` reusable; screens compose them |
| IV. API Contract Adherence | ✅ Pass | RTK Query typed endpoints; JWT; base URL from config |
| V. Offline-Awareness & Performance | ✅ Pass | Capability/status show cached + retry; location permission denial → manual address; lists virtualized |
| VI. Security & Privacy | ⚠️ Gated | Location permission + a stored home address are sensitive; request location only at the address step, allow manual entry, never log coordinates. See Complexity Tracking |

---

## Project Structure

### Documentation (this feature)

```text
specs/008-pickup-and-mobile-service/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── fulfillment-api.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (client repo)

```text
types/
└── fulfillment.ts                    NEW — mode, service address, logistics status, capability types

store/api/
├── fulfillmentApi.ts                 NEW — center fulfillment capability + booking logistics status
└── addressesApi.ts                   NEW — saved addresses CRUD (Home/Work/Other)

store/
└── index.ts                          MODIFIED — register fulfillmentApi + addressesApi

store/api/
└── bookingsApi.ts                    MODIFIED — CreateBookingRequest + Booking gain fulfillment fields

app/(app)/(tabs)/bookings/
├── new.tsx                           MODIFIED — insert the fulfillment step (after service)
└── [id].tsx                          MODIFIED — LogisticsTimeline + decline handling

app/(app)/addresses/                  NEW — top-level stack (manage saved addresses)
├── _layout.tsx
└── index.tsx

components/fulfillment/
├── FulfillmentModePicker.tsx         NEW — Drop-off / Pickup&Delivery / At-Home + fee per mode
├── AddressPicker.tsx                 NEW — saved address select + pin/geocode + note
└── LogisticsTimeline.tsx             NEW — discrete status states + ETA text per mode

lib/i18n/locales/
├── en.json                           MODIFIED — fulfillment.* keys
└── ar.json                           MODIFIED — fulfillment.* keys
```

**Structure Decision**: The fulfillment choice is a **new step in the existing booking wizard**
(`new.tsx`, after service selection), not a separate flow. Saved-address management lives at
`app/(app)/addresses/` (top-level stack, reachable from the picker and profile) — not a bottom tab.
Logistics is **display-only** on the client; the center drives status transitions.

---

## Phase 0: Research

> Full records in `research.md`. Summary:

- **R1 — Center declares capability; client consumes.** `GET /centers/{id}/fulfillment?serviceId=` returns
  supported modes, service-area governorates, and fee rules. The client offers only what the center
  supports for the selected service (FR-001); authoring the capability is a center-side dependency.
- **R2 — Fee is always shown before commit.** The capability response carries fee derivation (flat or
  per-distance); the client computes the displayed fee from it and **never** lets the customer confirm a
  mode whose fee wasn't shown (FR-003). The authoritative fee lands as an invoice line (`007`).
- **R3 — Logistics is display-only + center-driven.** The client renders discrete status states per mode
  and refetches on focus + push; it never advances a leg. Decline returns the booking to the customer
  to re-choose or cancel.
- **R4 — Saved addresses are server-side.** Home/Work/Other addresses (label + governorate + pin + note)
  live per customer and are reused across bookings.
- **R5 — Location + map pin.** Add `expo-location` for current-location + reverse geocode. The interactive
  pin uses `react-native-maps` on native; on web (and when permission is denied) fall back to area select
  + manual address + (optional) lat/lng. Request location **only** at the address step.
- **R6 — Window validation.** Pickup/arrival windows are validated against center operating hours and
  rejected if in the past; distinct from the drop-off appointment slot.
- **R7 — Out-of-area hiding + decline.** Where the pinned governorate is clearly outside the center's
  service area, unsupported modes are hidden up front; otherwise a center decline pauses the booking for
  re-choice (FR-008/FR-010).

---

## Phase 1: Design & Contracts

### Data model (`data-model.md`)

`types/fulfillment.ts` — `FulfillmentMode`, `CenterFulfillmentCapability`, `FeeRule`, `ServiceAddress`,
`PickupWindow`, `LogisticsStatus`, `LogisticsState`. `bookingsApi` `CreateBookingRequest` + `Booking`
gain `fulfillmentMode`, `serviceAddressId`/inline address, `pickupWindow`, `fulfillmentFee`,
`logistics`. Full tables + transitions in `data-model.md`.

### Contracts (`contracts/fulfillment-api.md`)

Customer endpoints (all `Authorization: Bearer <jwt>`):

| Method & Path | Consumer |
|---|---|
| `GET /centers/{id}/fulfillment?serviceId=` | `FulfillmentModePicker` — supported modes + area + fee rules |
| `GET /me/addresses` · `POST` · `PUT` · `DELETE` | saved addresses |
| `GET /bookings/{id}/logistics` | `LogisticsTimeline` |
| `POST /bookings/{id}/fulfillment/re-choose` | after a center decline, switch mode or cancel |
| `POST /bookings` (modified) | booking creation carries fulfillment fields |

> Logistics status changes + declines arrive via push → client refetch.

### RTK Query slices

`store/api/fulfillmentApi.ts` (tagTypes `['Capability','Logistics']`) and `store/api/addressesApi.ts`
(tagTypes `['Address']`), inline `fetchBaseQuery` + Bearer (same as the other slices).

### Agent context update

```powershell
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

---

## Complexity Tracking

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|-----------|--------------------------------------|
| New dependency `expo-location` (+ `react-native-maps` native) | At-home/pickup need a service address + pin | Free-text address alone can't compute distance fees or guide a driver; geocode/pin is core |
| Principle VI gated (location + home address) | Coordinates + home address are sensitive | None — request location only at the address step, allow manual entry, never log coordinates |
| Logistics rendered but not driven | The center performs the legs; the client only tracks | Letting the client advance legs would fake status the center hasn't done |
